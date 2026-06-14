/* =====================================================================
 * KidsPositifs — Authentification, familles, invitations & synchro
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
let cloudTimer = null;         // anti-rebond sauvegarde
let canalRealtime = null;      // abonnement temps réel

const FAMILLE_KEY = "kp_famille_active";
const INVITE_KEY = "kp_pending_invite";

document.addEventListener("DOMContentLoaded", demarrer);

async function demarrer() {
  const cfg = window.KP_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || typeof supabase === "undefined") {
    return ecranConfig();
  }
  sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  // Jeton d'invitation éventuellement présent dans l'URL (?invite=...)
  const params = new URLSearchParams(location.search);
  const inv = params.get("invite");
  if (inv) { localStorage.setItem(INVITE_KEY, inv); nettoyerUrl(); }

  const { data } = await sb.auth.getSession();
  session = data.session;
  utilisateur = session && session.user;
  sb.auth.onAuthStateChange((_e, s) => { session = s; utilisateur = s && s.user; });

  if (!utilisateur) return ecranAuth();
  await apresConnexion();
}

function nettoyerUrl() {
  try { history.replaceState({}, "", location.pathname); } catch {}
}
function utilisateurCourant() { return utilisateur; }

/* ---------- Après connexion : invitation, familles ---------- */
async function apresConnexion() {
  try { const { data } = await sb.rpc("is_admin"); estAdmin = !!data; } catch { estAdmin = false; }

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
    .select("id,name,plan,plan_status,owner_id").order("created_at");
  mesFamilles = error ? [] : (data || []);
}

async function ouvrirFamille(f) {
  familleActive = { ...f, role: f.owner_id === utilisateur.id ? "owner" : "parent" };
  familleId = f.id;                       // variable globale (app.js) pour le cache
  localStorage.setItem(FAMILLE_KEY, f.id);

  initSquelette();
  const cache = lireCache();
  if (cache) etat = cache;                // affichage instantané / hors-ligne
  await chargerEtatFamille();
  vueAccueilAine();                       // toujours démarrer sur l'accueil de l'aîné
  rendre();
  abonnerRealtime();
  document.removeEventListener("visibilitychange", auRetour);
  document.addEventListener("visibilitychange", auRetour);
}
function auRetour() { if (!document.hidden) { tirerEtat(); if (typeof majDodo === "function") majDodo(); } }

/* ---------- Synchronisation de l'état de jeu ---------- */
async function chargerEtatFamille() {
  majBadgeSync("⏬");
  const { data, error } = await sb.from("family_state")
    .select("data").eq("family_id", familleId).maybeSingle();
  if (!error && data && data.data && data.data.enfants) {
    const distant = normaliser(data.data);
    if ((distant.maj || 0) >= (etat.maj || 0)) { etat = distant; ecrireCache(); }
    else await sauvegardeCloud();
  } else {
    if (!etat || !etat.enfants) etat = etatVierge();
    await sauvegardeCloud();              // initialise la ligne distante
  }
  majBadgeSync("✅");
}

async function tirerEtat() {
  if (!sb || !familleId) return;
  const { data, error } = await sb.from("family_state")
    .select("data").eq("family_id", familleId).maybeSingle();
  if (!error && data && data.data && data.data.enfants && (data.data.maj || 0) > (etat.maj || 0)) {
    etat = normaliser(data.data); ecrireCache(); rendre();
  }
}

function planifierSauvegardeCloud() {
  if (modeDemo) return;                 // la démo ne synchronise rien
  if (!sb || !familleId) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(sauvegardeCloud, 700);
}
async function sauvegardeCloud() {
  if (!sb || !familleId) return;
  try {
    majBadgeSync("⏫");
    const { error } = await sb.from("family_state")
      .upsert({ family_id: familleId, data: etat, updated_at: new Date().toISOString() });
    majBadgeSync(error ? "⚠️" : "✅");
  } catch { majBadgeSync("📴"); }
}

function abonnerRealtime() {
  if (canalRealtime) { sb.removeChannel(canalRealtime); canalRealtime = null; }
  canalRealtime = sb.channel("fs:" + familleId)
    .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "family_state", filter: "family_id=eq." + familleId },
        payload => {
          const d = payload.new && payload.new.data;
          if (d && d.enfants && (d.maj || 0) > (etat.maj || 0)) {
            etat = normaliser(d); ecrireCache(); rendre();
          }
        })
    .subscribe();
}

function majBadgeSync(symbole) {
  const b = document.querySelector("#sync-etat");
  if (b) b.textContent = symbole;
}

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
async function deconnexion() {
  if (canalRealtime) sb.removeChannel(canalRealtime);
  localStorage.removeItem(FAMILLE_KEY);
  await sb.auth.signOut();
  location.reload();
}

/* ---------- Familles & invitations ---------- */
async function creerFamille(nom) {
  const { data, error } = await sb.rpc("create_family", { p_name: nom });
  if (error) { alert("Erreur : " + error.message); return; }
  await chargerFamilles();
  const f = mesFamilles.find(x => x.id === data) || mesFamilles[mesFamilles.length - 1];
  if (f) await ouvrirFamille(f);
}

function changerFamille() { ecranFamilles({}); }

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
function setMsg(txt) { const m = document.getElementById("auth-msg"); if (m) m.textContent = txt; }

function ecranConfig() {
  carteEcran(`<div class="code-logo">🛠️</div><h1>Configuration requise</h1>
    <p>Renseignez votre projet Supabase dans <code>js/config.js</code>
       (<strong>SUPABASE_URL</strong> et <strong>SUPABASE_ANON_KEY</strong>),
       et exécutez <code>supabase/schema.sql</code> dans l'éditeur SQL Supabase.</p>
    <p class="note">Voir le README, section « Synchronisation & comptes ».</p>`);
}

function ecranAuth() {
  carteEcran(`
    <div class="code-logo">🌟</div><h1>KidsPositifs</h1>
    <p id="auth-titre">Connecte-toi pour retrouver ta famille sur tous tes appareils.</p>
    <input id="email" type="email" inputmode="email" placeholder="ton@email.com" autocomplete="email">
    <input id="mdp" type="password" placeholder="Mot de passe" autocomplete="current-password" style="display:none">
    <button id="b-principal" class="gros-bouton planete">Recevoir un lien magique ✨</button>
    <button id="b-toggle" class="btn-secondaire">Utiliser un mot de passe</button>
    <button id="b-signup" class="btn-secondaire" style="display:none">Pas de compte ? Créer un compte</button>
    <p class="note" id="auth-msg"></p>
    <hr style="border:none;border-top:1px solid #e3edf5;margin:14px 0">
    <button id="b-demo" class="btn-secondaire">🧪 Découvrir en démo (sans compte)</button>`);

  let modeMdp = false, inscriptionMode = false;
  const elEmail = document.getElementById("email");
  const elMdp = document.getElementById("mdp");
  const bPrinc = document.getElementById("b-principal");
  const bToggle = document.getElementById("b-toggle");
  const bSignup = document.getElementById("b-signup");

  const rafraichir = () => {
    elMdp.style.display = modeMdp ? "block" : "none";
    bSignup.style.display = modeMdp ? "block" : "none";
    bToggle.textContent = modeMdp ? "Utiliser un lien magique ✨" : "Utiliser un mot de passe";
    bPrinc.textContent = !modeMdp ? "Recevoir un lien magique ✨"
                        : (inscriptionMode ? "Créer mon compte" : "Se connecter");
    bSignup.textContent = inscriptionMode ? "← J'ai déjà un compte" : "Pas de compte ? Créer un compte";
  };
  bToggle.onclick = () => { modeMdp = !modeMdp; inscriptionMode = false; rafraichir(); };
  bSignup.onclick = () => { inscriptionMode = !inscriptionMode; rafraichir(); };
  bPrinc.onclick = async () => {
    const email = elEmail.value.trim();
    if (!email) return setMsg("Entre ton adresse e-mail.");
    bPrinc.disabled = true;
    try {
      if (!modeMdp) {
        const err = await connexionLienMagique(email);
        setMsg(err ? "Erreur : " + err.message : "📧 E-mail envoyé ! Clique sur le lien reçu pour te connecter.");
      } else if (inscriptionMode) {
        const err = await inscription(email, elMdp.value);
        if (err) setMsg("Erreur : " + err.message);
        else setMsg("Compte créé. Vérifie ta boîte mail si une confirmation est demandée.");
      } else {
        const err = await connexionMotDePasse(email, elMdp.value);
        if (err) setMsg("Erreur : " + err.message);
      }
    } finally { bPrinc.disabled = false; }
  };
  document.getElementById("b-demo").onclick = demarrerDemo;
  rafraichir();
}

// Mode démonstration : famille pré-remplie, 100 % hors-ligne, sans compte.
function demarrerDemo() {
  modeDemo = true;
  familleActive = { id: "_demo", name: "Famille démo", plan: "free", role: "owner" };
  familleId = "_demo";
  estAdmin = false;
  etat = etatDemo();
  initSquelette();
  vueAccueilAine();
  rendre();
  majBadgeSync("🧪");
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
    <button id="b-creer" class="gros-bouton planete">➕ Créer cette famille</button>
    <button id="b-deco" class="btn-secondaire">Se déconnecter (${echapper(utilisateur.email || "")})</button>`);

  document.querySelectorAll(".famille-item").forEach(b =>
    b.onclick = () => { const f = mesFamilles.find(x => x.id === b.dataset.id); if (f) ouvrirFamille(f); });
  document.getElementById("b-creer").onclick = () => {
    const nom = document.getElementById("nom-famille").value.trim();
    creerFamille(nom || "Ma famille");
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
