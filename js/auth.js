/* =====================================================================
 * FamiTeam — Authentification, familles, invitations & synchro
 * ---------------------------------------------------------------------
 * Utilise Supabase (Auth e-mail : lien magique + mot de passe) et une base
 * Postgres protégée par RLS (voir supabase/schema.sql).
 *
 * Modèle :
 *   - un utilisateur (compte e-mail) peut être membre de plusieurs familles ;
 *   - une famille possède un "état de jeu" (table family_state.data = `etat`) ;
 *   - on rejoint une famille via un lien d'invitation ;
 *   - chaque famille porte un "plan" (free / premium) pour un futur abonnement.
 * ===================================================================== */

let sb = null;                 // client Supabase
let session = null, utilisateur = null;
let mesFamilles = [];          // familles de l'utilisateur
let familleActive = null;      // { id, name, plan, plan_status, role }
let estAdmin = false;          // l'utilisateur est-il administrateur de l'app ?
// (anti-rebond sauvegarde et abonnement temps réel : gérés par Store, Phase D)

const FAMILLE_KEY = "kp_famille_active";
const INVITE_KEY = "kp_pending_invite";
const PARRAIN_KEY = "kp_pending_parrain";   // parrainage : créer SA propre famille

// Interrupteur global des inscriptions :
//   false = sur invitation/parrainage uniquement (+ liste d'attente)  ← provisoire
//   true  = inscriptions ouvertes à tous
const INSCRIPTIONS_OUVERTES = false;

document.addEventListener("DOMContentLoaded", demarrer);

async function demarrer() {
  const cfg = window.KP_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || typeof supabase === "undefined") {
    return ecranConfig();
  }
  sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  Store.init(sb);                          // couche de données isolée (Phase D)
  chargerConfigApp();                      // réglages globaux (ex. lien de don Stripe)

  // Jeton d'invitation éventuellement présent dans l'URL (?invite=...)
  const params = new URLSearchParams(location.search);
  const inv = params.get("invite");
  if (inv) { localStorage.setItem(INVITE_KEY, inv); nettoyerUrl(); }
  // Lien de parrainage (?parrain=...) : l'ami créera SA propre famille.
  const par = params.get("parrain");
  if (par) { localStorage.setItem(PARRAIN_KEY, par); nettoyerUrl(); }

  const { data } = await sb.auth.getSession();
  session = data.session;
  utilisateur = session && session.user;
  sb.auth.onAuthStateChange((evenement, s) => {
    session = s; utilisateur = s && s.user;
    if (evenement === "PASSWORD_RECOVERY") ecranNouveauMdp();
  });

  // Arrivée via le lien « mot de passe oublié » : Supabase ouvre une session
  // de récupération (#type=recovery dans l'URL). On propose alors de choisir
  // un nouveau mot de passe avant d'entrer dans l'app.
  if (location.hash.includes("type=recovery")) return ecranNouveauMdp();

  if (!utilisateur) return ecranAuth();
  await apresConnexion();
}

function nettoyerUrl() {
  try { history.replaceState({}, "", location.pathname); } catch {}
}
function utilisateurCourant() { return utilisateur; }

// ---------- Configuration globale de l'app (table app_config) ----------
let configApp = {};
async function chargerConfigApp() {
  if (!sb) return;
  try {
    const { data } = await sb.from("app_config").select("key,value");
    configApp = {};
    (data || []).forEach(r => { configApp[r.key] = r.value; });
  } catch { configApp = {}; }
}
// Lien de don : priorité au lien Stripe configuré par l'admin, sinon config.js.
function urlDon() {
  return (configApp && configApp.don_stripe_url) ||
         (window.KP_CONFIG && window.KP_CONFIG.DON_URL) || "";
}
// Écriture d'un réglage global (admin uniquement).
async function adminDefinirConfig(key, value) {
  const { error } = await sb.rpc("set_app_config", { p_key: key, p_value: value });
  if (error) { toast("Erreur : " + error.message, "info"); return false; }
  configApp[key] = (value || "").trim();
  return true;
}

// Listes d'emails gérées par l'admin (stockées dans app_config, en JSON).
function listeConfig(key) {
  try {
    const v = configApp && configApp[key];
    if (Array.isArray(v)) return v;
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}
function dansListeConfig(key, email) {
  const e = (email || "").toLowerCase();
  return !!e && listeConfig(key).map(x => String(x).toLowerCase()).includes(e);
}
// Early adopters : catégorisés par l'admin (app_config) OU comptes anciens.
// Eux seuls ont le module de suggestion ; et on ne leur propose JAMAIS les dons.
const EARLY_ADOPTER_LIMITE = "2026-08-01T00:00:00Z";
function estEarlyAdopter() {
  if (typeof modeDemo !== "undefined" && modeDemo) return true; // démo : module visible
  const u = utilisateur;
  if (u && u.email && dansListeConfig("early_adopters", u.email)) return true;
  if (!u || !u.created_at) return true;   // par prudence si la date est inconnue
  return new Date(u.created_at) < new Date(EARLY_ADOPTER_LIMITE);
}
// Compte bloqué par l'admin (refus d'accès).
function compteBloque() {
  return !!(utilisateur && dansListeConfig("comptes_bloques", utilisateur.email));
}

// Bouton de don : jamais pour les early adopters ; sinon admins + familles
// créées il y a plus d'une semaine (fenêtre glissante).
function donDisponible() {
  if (typeof modeDemo !== "undefined" && modeDemo) return true;   // aperçu en démo
  if (estEarlyAdopter()) return false;                            // jamais aux early adopters
  if (estAdmin) return true;
  const cree = familleActive && familleActive.created_at;
  if (!cree) return false;
  return (Date.now() - new Date(cree).getTime()) > 7 * 24 * 60 * 60 * 1000;
}

// Actions admin : catégoriser (early adopter), bloquer, supprimer un compte.
async function adminBasculerListe(key, email, ajouter) {
  const e = (email || "").toLowerCase();
  if (!e) return false;
  const actuelle = listeConfig(key).map(x => String(x).toLowerCase());
  const nouvelle = ajouter ? Array.from(new Set([...actuelle, e])) : actuelle.filter(x => x !== e);
  const ok = await adminDefinirConfig(key, JSON.stringify(nouvelle));
  if (ok) configApp[key] = JSON.stringify(nouvelle);
  return ok;
}
async function adminSupprimerFamille(id) {
  const { error } = await sb.rpc("admin_delete_family", { p_family: id });
  if (error) { toast("Erreur : " + error.message, "info"); return false; }
  return true;
}


/* ---------- Après connexion : invitation, familles ---------- */
async function apresConnexion() {
  try { const { data } = await sb.rpc("is_admin"); estAdmin = !!data; } catch { estAdmin = false; }

  // Compte bloqué par l'admin : on refuse l'accès (sauf admin).
  if (!estAdmin) {
    try { if (!configApp || !Object.keys(configApp).length) await chargerConfigApp(); } catch (e) { /* ignore */ }
    if (compteBloque()) {
      alert(t ? t("compte.bloque") : "Ce compte a été bloqué. Contacte hello@fami.team.");
      try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
      location.reload();
      return;
    }
  }

  const inv = localStorage.getItem(INVITE_KEY);
  if (inv) { localStorage.removeItem(INVITE_KEY); return ecranInvitation(inv); }

  await chargerFamilles();
  if (mesFamilles.length === 0) return ecranFamilles({ premiere: true });

  const dernier = localStorage.getItem(FAMILLE_KEY);
  let f = mesFamilles.find(x => x.id === dernier);
  if (!f && mesFamilles.length === 1) f = mesFamilles[0];
  if (!f) return ecranFamilles({});
  await ouvrirFamille(f);
}

async function chargerFamilles() {
  const { data, error } = await sb.from("families")
    .select("id,name,plan,plan_status,owner_id,created_at").order("created_at");
  mesFamilles = error ? [] : (data || []);
}

async function ouvrirFamille(f) {
  // On annule toute sauvegarde différée de la famille précédente (sinon elle
  // risquerait d'écraser la nouvelle famille avec l'ancien état).
  Store.annulerSauverDiffere();
  familleActive = { ...f, role: f.owner_id === utilisateur.id ? "owner" : "parent" };
  familleId = f.id;                       // variable globale (app.js) pour le cache
  localStorage.setItem(FAMILLE_KEY, f.id);

  initSquelette();
  // On repart d'un état vierge pour ne JAMAIS conserver les données de la
  // famille précédente, puis on charge le cache local de CETTE famille s'il existe.
  lierEtat(etatVierge());
  const cache = lireCache();
  if (cache) lierEtat(cache);             // affichage instantané / hors-ligne
  await chargerEtatFamille();
  vueAccueilAine();                       // toujours démarrer sur l'accueil de l'aîné
  rendre();
  if (typeof verifierTuto === "function") verifierTuto();   // tutoriel au 1ᵉʳ lancement
  abonnerRealtime();
  document.removeEventListener("visibilitychange", auRetour);
  document.addEventListener("visibilitychange", auRetour);
  verifierParrainages();                  // féliciter le parrain si un filleul a rejoint
}
function auRetour() { if (!document.hidden) { tirerEtat(); if (typeof majDodo === "function") majDodo(); } }

/* ---------- Synchronisation de l'état de jeu ----------
 * Toute la logique d'accès aux tables `family_state(_history)` et au temps
 * réel vit désormais dans js/store.js (couche de données isolée, Phase D).
 * Les fonctions ci-dessous ne sont que de fines délégations conservées pour
 * compatibilité avec les appelants existants (app.js, ui.js). */
async function chargerEtatFamille() { return Store.charger(); }
async function tirerEtat()          { return Store.tirer(); }
function planifierSauvegardeCloud() { return Store.planifierSauver(); }
async function sauvegardeCloud()    { return Store.sauver(); }
async function listerHistoriqueCloud() { return Store.historique(); }
function abonnerRealtime()          { return Store.abonnerRealtime(); }
function majBadgeSync(symbole)      { return Store.badge(symbole); }

/* ---------- Authentification ---------- */
async function connexionLienMagique(email) {
  const { error } = await sb.auth.signInWithOtp({
    email, options: { emailRedirectTo: location.origin + location.pathname }
  });
  return error;
}
async function connexionMotDePasse(email, mdp) {
  const { error } = await sb.auth.signInWithPassword({ email, password: mdp });
  if (!error) { utilisateur = (await sb.auth.getUser()).data.user; await apresConnexion(); }
  return error;
}
async function inscription(email, mdp) {
  const { data, error } = await sb.auth.signUp({
    email, password: mdp, options: { emailRedirectTo: location.origin + location.pathname }
  });
  if (!error && data.session) { utilisateur = data.user; await apresConnexion(); }
  return error;
}
async function envoyerResetMdp(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + location.pathname
  });
  return error;
}
async function definirNouveauMdp(mdp) {
  const { error } = await sb.auth.updateUser({ password: mdp });
  return error;
}
// Suppression DÉFINITIVE du compte famille (propriétaire uniquement).
// Double confirmation : l'utilisateur doit retaper le nom de la famille.
async function supprimerCompteFamille() {
  if (modeDemo || !familleId) return;
  const nom = (familleActive && familleActive.name) ? familleActive.name : "";
  if (!confirm(t("suppr.confirm1", { nom }))) return;
  const saisie = prompt(t("suppr.confirm2", { nom }));
  if (saisie == null) return;
  if (saisie.trim() !== nom.trim()) { toast(t("suppr.nom_incorrect"), "info"); return; }
  // 1) Suppression des données de la famille (RPC propriétaire).
  const { error } = await sb.rpc("delete_family", { p_family: familleId });
  if (error) { toast(t("suppr.erreur", { msg: error.message }), "info"); return; }
  // 2) Suppression du compte d'authentification lui-même (best-effort).
  try { await sb.functions.invoke("delete-account", { body: {} }); } catch (e) { /* compte login conservé si la fonction n'est pas déployée */ }
  // Tout est supprimé : on nettoie et on déconnecte.
  try { Store.fermerRealtime(); } catch (e) { /* ignore */ }
  localStorage.removeItem(FAMILLE_KEY);
  alert(t("suppr.ok"));
  try { await sb.auth.signOut(); } catch (e) { /* la session peut déjà être invalide */ }
  location.reload();
}
async function deconnexion() {
  Store.fermerRealtime();
  localStorage.removeItem(FAMILLE_KEY);
  await sb.auth.signOut();
  location.reload();
}

/* ---------- Familles & invitations ---------- */
async function creerFamille(nom, nbEnfants) {
  const { data, error } = await sb.rpc("create_family", { p_name: nom });
  if (error) { alert("Erreur : " + error.message); return; }
  await chargerFamilles();
  const f = mesFamilles.find(x => x.id === data) || mesFamilles[mesFamilles.length - 1];
  if (f) await ouvrirFamille(f);
  // Nouvelle famille (état vierge) : on ajuste le nombre d'enfants choisi.
  if (nbEnfants && typeof ajusterNombreEnfantsCreation === "function") {
    ajusterNombreEnfantsCreation(nbEnfants);
    vueAccueilAine(); rendre();
  }
  // Si l'utilisateur a été parrainé, on relie sa nouvelle famille au parrain.
  const par = localStorage.getItem(PARRAIN_KEY);
  if (par && data) {
    try { await sb.rpc("claim_referral", { p_token: par, p_family: data }); } catch {}
    localStorage.removeItem(PARRAIN_KEY);
  }
}

/* ---------- Parrainage (inviter un ami à créer sa propre famille) ---------- */
async function creerParrainage() {
  const { data, error } = await sb.rpc("create_referral", { p_family: familleId });
  if (error) { toast("Erreur : " + error.message, "info"); return null; }
  return location.origin + location.pathname + "?parrain=" + data;
}
async function parrainageRestant() {
  if (estAdmin) return 999;
  const { data, error } = await sb.rpc("referral_quota", { p_family: familleId });
  return error ? 0 : (data || 0);
}
async function infoParrainage(token) {
  try {
    const { data } = await sb.rpc("referral_info", { p_token: token });
    const info = Array.isArray(data) ? data[0] : data;
    return info || null;
  } catch { return null; }
}
async function nbFilleuls() {
  const { data, error } = await sb.rpc("referral_accepted_count", { p_family: familleId });
  return error ? 0 : (data || 0);
}
// Félicite le parrain dès qu'un nouveau filleul a créé sa famille.
async function verifierParrainages() {
  if (modeDemo || !familleId) return;
  const cle = "kp_filleuls_vus_" + familleId;
  const nb = await nbFilleuls();
  const vus = parseInt(localStorage.getItem(cle) || "", 10);
  if (isNaN(vus)) { localStorage.setItem(cle, String(nb)); return; } // 1ère fois : on calibre
  if (nb > vus && typeof feterParrainage === "function") feterParrainage(nb - vus);
  if (nb !== vus) localStorage.setItem(cle, String(nb));
}

function changerFamille() { ecranFamilles({}); }

// Inscriptions autorisées si ouvertes globalement, ou via un jeton en attente.
function inscriptionAutorisee() {
  return INSCRIPTIONS_OUVERTES ||
         !!(localStorage.getItem(INVITE_KEY) || localStorage.getItem(PARRAIN_KEY));
}
// Rejoindre la liste d'attente (candidats sans invitation).
async function rejoindreListeAttente(email) {
  const { error } = await sb.rpc("join_waitlist", { p_email: email });
  return error;
}
// RPC admin : consulter la liste d'attente.
async function adminListerAttente() {
  const { data, error } = await sb.rpc("admin_list_waitlist");
  if (error) { toast("Erreur admin : " + error.message, "info"); return []; }
  return data || [];
}
// RPC admin : retirer un candidat (après approbation ou refus).
async function adminRetirerAttente(email) {
  const { error } = await sb.rpc("admin_remove_waitlist", { p_email: email });
  if (error) toast("Erreur : " + error.message, "info");
  return !error;
}

async function creerInvitation() {
  const { data, error } = await sb.rpc("create_invite", { p_family: familleId, p_email: null });
  if (error) { toast("Erreur : " + error.message, "info"); return null; }
  return location.origin + location.pathname + "?invite=" + data;
}

async function accepterInvitation(token) {
  const { data, error } = await sb.rpc("accept_invite", { p_token: token });
  if (error) { alert(error.message); return ecranFamilles({}); }
  await chargerFamilles();
  const f = mesFamilles.find(x => x.id === data);
  if (f) await ouvrirFamille(f); else ecranFamilles({});
}

/* ---------- Administration ---------- */
async function adminListerFamilles() {
  const { data, error } = await sb.rpc("admin_list_families");
  if (error) { toast("Erreur admin : " + error.message, "info"); return []; }
  return data || [];
}
async function adminOuvrirFamille(row) {
  await ouvrirFamille({ id: row.id, name: row.name, plan: row.plan,
                        plan_status: row.plan_status, owner_id: null });
}
async function adminMajPlan(familyId, plan) {
  const { error } = await sb.rpc("admin_set_plan", { p_family: familyId, p_plan: plan });
  if (error) toast("Erreur : " + error.message, "info");
}

function planLibelle() {
  if (!familleActive) return "";
  return familleActive.plan === "premium" ? "Premium ⭐" : "Gratuite";
}

/* =====================================================================
 *  Écrans (hors application)
 * ===================================================================== */
function carteEcran(html) {
  document.body.innerHTML = `<div class="ecran-code"><div class="carte code-carte">${html}</div></div>`;
}
function setMsg(txt, type) {
  const m = document.getElementById("auth-msg");
  if (!m) return;
  if (!txt) { m.textContent = ""; m.className = ""; return; }   // pas de cadre si vide
  m.textContent = txt;
  m.className = "msg-retour " + (type === "ok" ? "msg-ok" : type === "info" ? "msg-info" : "msg-err");
}

function ecranConfig() {
  carteEcran(`<div class="code-logo">🛠️</div><h1>Configuration requise</h1>
    <p>Renseignez votre projet Supabase dans <code>js/config.js</code>
       (<strong>SUPABASE_URL</strong> et <strong>SUPABASE_ANON_KEY</strong>),
       et exécutez <code>supabase/schema.sql</code> dans l'éditeur SQL Supabase.</p>
    <p class="note">Voir le README, section « Synchronisation & comptes ».</p>`);
}

function ecranAuth() {
  const parrain = localStorage.getItem(PARRAIN_KEY);
  const boutonsLangue = Object.keys(LANGUES).map(l =>
    `<button type="button" class="langue-btn${l === langue ? " actif" : ""}" data-lang="${l}">
       <span class="langue-drapeau">${drapeau(l)}</span><span class="langue-nom">${LANGUES[l]}</span>
     </button>`).join("");

  const features = [
    ["🎯", t("auth.feat1_t"), t("auth.feat1_d")],
    ["🎁", t("auth.feat2_t"), t("auth.feat2_d")],
    ["🌍", t("auth.feat3_t"), t("auth.feat3_d")],
    ["🏆", t("auth.feat4_t"), t("auth.feat4_d")]
  ].map(([e, ti, de]) => `<div class="feat"><span class="feat-emoji">${e}</span>
      <div><strong>${ti}</strong><span>${de}</span></div></div>`).join("");

  document.body.innerHTML = `
    <div class="landing">
      <section class="landing-hero">
        <div class="choix-langue langue-choix">${boutonsLangue}</div>
        <div class="hero-logo">🌟</div>
        <h1 class="hero-nom">${APP_NOM}</h1>
        <p class="hero-titre">${t("auth.hero_titre")}</p>
        <p class="hero-sous">${t("auth.hero_sous", { app: APP_NOM })}</p>
        <div class="hero-features">${features}</div>
        <div class="hero-steps">
          <h2>${t("auth.comment_titre")}</h2>
          <ol>
            <li>${t("auth.etape1")}</li>
            <li>${t("auth.etape2")}</li>
            <li>${t("auth.etape3")}</li>
          </ol>
        </div>
      </section>
      <section class="landing-form">
        <div class="carte code-carte">
          <div id="parrain-banniere"></div>
          <h2 class="form-titre" id="form-titre">${t("auth.form_titre")}</h2>
          <p id="form-sous" class="note" style="display:none"></p>
          <p id="auth-msg"></p>
          <input id="email" type="email" inputmode="email" placeholder="${t("auth.email_ph")}" autocomplete="email">
          <input id="mdp" type="password" placeholder="${t("auth.mdp_ph")}" autocomplete="current-password">
          <button id="b-principal" class="gros-bouton planete">${t("auth.connexion")}</button>
          <button id="b-oubli" class="lien-discret" type="button">${t("auth.mdp_oublie")}</button>
          <button id="b-signup" class="btn-secondaire">${t("auth.pas_compte")}</button>
          <div id="attente-bloc">
            <p class="note">${t("auth.attente_note")}</p>
            <button id="b-waitlist" class="btn-secondaire">${t("auth.rejoindre_attente")}</button>
          </div>
          <hr style="border:none;border-top:1px solid #e3edf5;margin:14px 0">
          <button id="b-demo" class="btn-secondaire">${t("auth.demo")}</button>
        </div>
      </section>
    </div>`;

  document.querySelectorAll(".langue-btn").forEach(b => {
    b.onclick = () => { const l = b.dataset.lang; if (l && l !== langue) { definirLangue(l); ecranAuth(); } };
  });

  // Bannière personnalisée si on arrive via un lien de parrainage.
  if (parrain) {
    const b = document.getElementById("parrain-banniere");
    if (b) {
      b.innerHTML = `<div class="parrain-carte">${t("auth.parrain_generique")}</div>`;
      infoParrainage(parrain).then(info => {
        if (info && info.parrain_name) {
          b.querySelector(".parrain-carte").innerHTML =
            t("auth.parrain_nomme", { nom: echapper(info.parrain_name), app: APP_NOM });
        }
      });
    }
  }

  const peutSinscrire = inscriptionAutorisee();      // inscription sur invitation seulement
  let inscriptionMode = !!parrain;                   // parrainage → création de compte
  const elEmail = document.getElementById("email");
  const elMdp = document.getElementById("mdp");
  const bPrinc = document.getElementById("b-principal");
  const bSignup = document.getElementById("b-signup");
  const blocAttente = document.getElementById("attente-bloc");
  const bWaitlist = document.getElementById("b-waitlist");
  const bOubli = document.getElementById("b-oubli");

  const titre = document.getElementById("form-titre");
  const sous = document.getElementById("form-sous");
  const rafraichir = () => {
    bSignup.style.display = peutSinscrire ? "block" : "none";
    blocAttente.style.display = peutSinscrire ? "none" : "block";
    bOubli.style.display = inscriptionMode ? "none" : "block";
    bPrinc.textContent = inscriptionMode ? t("auth.creer_compte") : t("auth.connexion");
    bSignup.textContent = inscriptionMode ? t("auth.deja_compte") : t("auth.pas_compte");
    // En mode création (notamment via un lien d'invitation), on invite
    // explicitement à créer son compte famille (e-mail + mot de passe).
    if (titre) titre.textContent = inscriptionMode ? t("auth.form_titre_creer") : t("auth.form_titre");
    if (sous) {
      if (inscriptionMode) { sous.textContent = t("auth.form_sous_creer"); sous.style.display = "block"; }
      else { sous.style.display = "none"; }
    }
    elEmail.placeholder = t("auth.email_ph");
    elMdp.placeholder = inscriptionMode ? t("auth.mdp_ph_creer") : t("auth.mdp_ph");
  };
  bOubli.onclick = async () => {
    const email = elEmail.value.trim();
    if (!email) return setMsg(t("auth.msg_entre_email"), "info");
    bOubli.disabled = true;
    const err = await envoyerResetMdp(email);
    bOubli.disabled = false;
    setMsg(err ? t("auth.erreur", { msg: err.message }) : t("auth.msg_reset_envoye"), err ? "err" : "ok");
  };
  bSignup.onclick = () => { inscriptionMode = !inscriptionMode; rafraichir(); };
  bPrinc.onclick = async () => {
    const email = elEmail.value.trim();
    if (!email) return setMsg(t("auth.msg_entre_email"), "info");
    bPrinc.disabled = true;
    try {
      if (inscriptionMode) {
        if (!peutSinscrire) { setMsg(t("auth.msg_invitation_only"), "info"); return; }
        const err = await inscription(email, elMdp.value);
        if (err) setMsg(t("auth.erreur", { msg: err.message }), "err");
        else setMsg(t("auth.msg_compte_cree"), "ok");
      } else {
        const err = await connexionMotDePasse(email, elMdp.value);
        if (err) setMsg(t("auth.erreur", { msg: err.message }), "err");
      }
    } finally { bPrinc.disabled = false; }
  };
  bWaitlist.onclick = async () => {
    const email = elEmail.value.trim();
    if (!email) return setMsg(t("auth.msg_attente_email"), "info");
    bWaitlist.disabled = true;
    const err = await rejoindreListeAttente(email);
    bWaitlist.disabled = false;
    setMsg(err ? t("auth.erreur", { msg: err.message }) : t("auth.msg_attente_ok"), err ? "err" : "ok");
  };
  document.getElementById("b-demo").onclick = demarrerDemo;
  rafraichir();
}

// Écran de réinitialisation : l'utilisateur choisit un nouveau mot de passe
// après avoir cliqué sur le lien « mot de passe oublié » reçu par e-mail.
function ecranNouveauMdp() {
  document.body.innerHTML = `
    <div class="landing landing-centre">
      <section class="landing-form">
        <div class="carte code-carte">
          <div class="code-logo">🌟</div>
          <h2 class="form-titre">${t("auth.reset_titre")}</h2>
          <p id="auth-msg"></p>
          <input id="reset-mdp" type="password" placeholder="${t("auth.reset_ph")}" autocomplete="new-password">
          <button id="b-reset" class="gros-bouton planete">${t("auth.reset_valider")}</button>
          <button id="b-retour" class="btn-secondaire">${t("auth.reset_retour")}</button>
        </div>
      </section>
    </div>`;
  const elMdp = document.getElementById("reset-mdp");
  const bReset = document.getElementById("b-reset");
  document.getElementById("b-retour").onclick = () => { nettoyerUrl(); ecranAuth(); };
  bReset.onclick = async () => {
    const mdp = elMdp.value;
    if (mdp.length < 8) return setMsg(t("auth.mdp_court"), "info");
    bReset.disabled = true;
    const err = await definirNouveauMdp(mdp);
    if (err) { bReset.disabled = false; return setMsg(t("auth.erreur", { msg: err.message }), "err"); }
    setMsg(t("auth.reset_ok"), "ok");
    nettoyerUrl();
    utilisateur = (await sb.auth.getUser()).data.user;
    await apresConnexion();
  };
  elMdp.focus();
}

// Mode démonstration : famille pré-remplie, 100 % hors-ligne, sans compte.
function demarrerDemo() {
  modeDemo = true;
  familleActive = { id: "_demo", name: "Famille démo", plan: "free", role: "owner" };
  familleId = "_demo";
  estAdmin = false;
  lierEtat(etatDemo());
  initSquelette();
  vueAccueilAine();
  rendre();
  majBadgeSync("🧪");
  if (typeof verifierTuto === "function") verifierTuto();   // tutoriel en démo aussi
}

function ecranFamilles(opts) {
  const liste = mesFamilles.map(f =>
    `<button class="famille-item" data-id="${f.id}">🏡 ${echapper(f.name)}
       <small>${f.plan === "premium" ? "Premium ⭐" : "Gratuite"}</small></button>`).join("");
  carteEcran(`
    <div class="code-logo">👪</div>
    <h1>${opts.premiere ? "Bienvenue !" : "Mes familles"}</h1>
    ${opts.premiere ? "<p>Crée ta famille pour commencer. Tu pourras inviter l'autre parent ensuite.</p>"
                    : "<p>Choisis une famille ou crées-en une nouvelle.</p>"}
    <div class="familles-liste">${liste}</div>
    <input id="nom-famille" placeholder="Nom de la nouvelle famille (ex. Famille Dupont)">
    <label class="champ" style="text-align:left">Nombre d'enfants
      <input id="nb-enfants" type="number" min="1" max="12" value="2" inputmode="numeric">
    </label>
    <p class="note">Tu pourras en ajouter ou en retirer à tout moment dans l'espace parents.</p>
    <button id="b-creer" class="gros-bouton planete">➕ Créer cette famille</button>
    <button id="b-deco" class="btn-secondaire">Se déconnecter (${echapper(utilisateur.email || "")})</button>`);

  document.querySelectorAll(".famille-item").forEach(b =>
    b.onclick = () => { const f = mesFamilles.find(x => x.id === b.dataset.id); if (f) ouvrirFamille(f); });
  document.getElementById("b-creer").onclick = () => {
    const nom = document.getElementById("nom-famille").value.trim();
    const nb = parseInt(document.getElementById("nb-enfants").value, 10) || 2;
    creerFamille(nom || "Ma famille", nb);
  };
  document.getElementById("b-deco").onclick = deconnexion;
}

async function ecranInvitation(token) {
  carteEcran(`<div class="code-logo">✉️</div><h1>Invitation</h1>
    <p id="inv-txt">Vérification de l'invitation…</p>
    <div id="inv-actions" style="display:none">
      <button id="b-accept" class="gros-bouton planete">Rejoindre cette famille</button>
      <button id="b-skip" class="btn-secondaire">Plus tard</button>
    </div>`);
  let nom = "", valide = false;
  try {
    const { data } = await sb.rpc("invite_info", { p_token: token });
    const info = Array.isArray(data) ? data[0] : data;
    if (info) { nom = info.family_name; valide = info.valid; }
  } catch {}
  const txt = document.getElementById("inv-txt");
  if (valide) {
    txt.innerHTML = `Tu es invité·e à rejoindre <strong>${echapper(nom)}</strong>.`;
    document.getElementById("inv-actions").style.display = "block";
    document.getElementById("b-accept").onclick = () => accepterInvitation(token);
    document.getElementById("b-skip").onclick = () => apresConnexion();
  } else {
    txt.textContent = "Cette invitation est invalide ou expirée.";
    setTimeout(() => apresConnexion(), 1800);
  }
}

function echapper(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
