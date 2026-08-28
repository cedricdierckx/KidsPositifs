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

// Adresse publique de l'application. Tout ce qui SORT — liens d'invitation, QR,
// e-mails aux familles — doit s'y référer, et surtout pas à location.origin :
// sur un déploiement de préaperçu celui-ci vaut une URL Vercel de 60 caractères,
// éphémère, et au-delà de la capacité du QR (53) — qui cessait alors d'être
// produit, sans le dire. Les redirections d'authentification, elles, gardent
// location.origin : elles doivent revenir sur le déploiement en cours.
const HOTE_PUBLIC = "https://fami.team";
// (anti-rebond sauvegarde et abonnement temps réel : gérés par Store, Phase D)

const FAMILLE_KEY = "kp_famille_active";
const INVITE_KEY = "kp_pending_invite";
const PARRAIN_KEY = "kp_pending_parrain";   // parrainage : créer SA propre famille
const PARRAIN_CODE_KEY = "kp_pending_parrain_code";  // code permanent (?p=), Arbre des familles
const VAGUE_KEY = "kp_pending_vague";      // jeton de vague (liste d'attente)

// Interrupteur global des inscriptions :
//   false = sur invitation/parrainage uniquement (+ liste d'attente)
//   true  = inscriptions ouvertes à tous
// Valeur de repli : les inscriptions sont ouvertes tant que l'administrateur
// n'a pas choisi le mode « par vagues » (app_config → inscriptions).
const INSCRIPTIONS_OUVERTES = true;

// Mode d'inscription effectif, décidé depuis l'admin sans redéploiement.
// « vagues » : seuls les invités, parrainés et candidats d'une vague entrent.
function inscriptionsOuvertes() {
  const mode = configApp && String(configApp.inscriptions || "").trim();
  if (mode === "vagues") return false;
  if (mode === "ouvertes") return true;
  return INSCRIPTIONS_OUVERTES;
}
// Taille d'une vague : ce qu'une heure par semaine permet d'accompagner.
function tailleVague() {
  const n = parseInt((configApp && configApp.vague_taille) || "", 10);
  return (isNaN(n) || n < 1) ? 20 : Math.min(n, 200);
}
/* ---------- Production ou aperçu ? ----------
 * dev, les aperçus Vercel et la production pointent tous vers la MÊME base.
 * Tout ce qui a un effet vers l'extérieur — envoyer un e-mail à une famille,
 * fermer les inscriptions, poser un verrou d'envoi mensuel — ne doit se
 * produire que depuis la production. Sinon une simple visite sur un aperçu
 * enverrait de vrais e-mails, ou consommerait le verrou du mois sans rien
 * envoyer : la vague serait alors perdue pour de bon.
 * L'hôte de production est configurable, au cas où le domaine change. */
// Domaines officiels. Le « www. » de chacun est accepté sans avoir à l'écrire.
// Liste surchargeable (app_config → hote_prod, séparés par des virgules) au
// cas où un domaine s'ajoute ou disparaît, sans redéploiement.
const HOTES_PRODUCTION = ["famiteam.com", "fami.team"];
function hotesProduction() {
  const cfg = (typeof configApp !== "undefined" && configApp) ? configApp : {};
  const kp = (typeof window !== "undefined" && window.KP_CONFIG) ? window.KP_CONFIG : {};
  const brut = String(cfg.hote_prod || kp.HOTE_PROD || "").trim();
  const liste = brut ? brut.split(",") : HOTES_PRODUCTION;
  return liste.map(h => String(h).trim().toLowerCase().replace(/^www\./, "")).filter(Boolean);
}
// Vrai dans l'app native (Capacitor) — coquille iOS/Android autour du même
// code web. `window.Capacitor` n'existe alors que là : détection sûre même
// avant l'installation du plugin, elle vaut simplement toujours faux ici.
function estAppNative() {
  return typeof window !== "undefined" &&
    !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}
function estProduction() {
  // Dans l'app native, `location.hostname` n'est plus un domaine public
  // (ex. "localhost") : il n'existe pas d'« aperçu » pour un binaire installé,
  // donc l'app packagée EST la production.
  if (estAppNative()) return true;
  const hote = String((typeof location !== "undefined" && location.hostname) || "").toLowerCase();
  if (!hote) return false;
  // Comparaison exacte, jamais « se termine par » : famiteam.com.exemple.net
  // ne doit surtout pas passer pour la production.
  return hotesProduction().some(p => hote === p || hote === "www." + p);
}

/* Mode vacances (chantier « Soutenabilité »). Le projet doit survivre à une
 * semaine chargée : pendant une pause, plus rien ne part — ni aux familles, ni
 * à l'administrateur — et les nouvelles inscriptions attendent leur tour.
 * L'app, elle, continue de fonctionner normalement pour les familles. */
function enVacances() {
  const jusqua = String((configApp && configApp.vacances_jusqua) || "").trim();
  if (!jusqua) return false;
  return jusqua >= new Date().toISOString().slice(0, 10);   // inclus le dernier jour
}
function vacancesJusqua() {
  return enVacances() ? String(configApp.vacances_jusqua).trim() : "";
}

// Plafond de familles : ce que le temps de support et la capacité gratuite
// permettent de tenir. Modifiable depuis l'admin.
function plafondFamilles() {
  const n = parseInt((configApp && configApp.plafond_familles) || "", 10);
  return (isNaN(n) || n < 1) ? 800 : n;
}
// Capacité du projet : familles / plafond, et remplissage de la base.
async function capaciteProjet() {
  if (!estAdmin) return null;
  try {
    const { data, error } = await sb.rpc("capacite_projet");
    return error ? null : (data || null);
  } catch (e) { return null; }
}
/* Plafond atteint : les inscriptions passent d'elles-mêmes en « vagues ».
 * Une liste d'attente est plus honnête qu'un support qui ne suit plus. Le
 * basculement ne se fait qu'une fois, et jamais dans l'autre sens. */
async function appliquerPlafond() {
  if (!estAdmin || (typeof modeDemo !== "undefined" && modeDemo)) return false;
  if (!estProduction()) return false;    // un aperçu ne ferme pas les inscriptions réelles
  try {
    const { data, error } = await sb.rpc("appliquer_plafond");
    if (error || !data) return false;
    configApp.inscriptions = "vagues";     // le cache local suit la bascule
    if (typeof toast === "function") toast(t("cap.bascule"), "info");
    return true;
  } catch (e) { return false; }
}

// Invitations/parrainages : plus aucune limite de nombre (true = illimité).
const INVITATIONS_ILLIMITEES = true;

document.addEventListener("DOMContentLoaded", demarrer);

async function demarrer() {
  const cfg = window.KP_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || typeof supabase === "undefined") {
    return ecranConfig();
  }
  sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  Store.init(sb);                          // couche de données isolée (Phase D)
  initDeepLinkAuth();                      // app native : rattraper le lien d'authentification
  configAppPrete();                        // réglages globaux (mode d'inscription, lien de don…)

  memoriserSource();                       // d'où vient ce visiteur (avant tout nettoyage d'URL)

  // Jeton d'invitation éventuellement présent dans l'URL (?invite=...)
  const params = new URLSearchParams(location.search);
  const inv = params.get("invite");
  if (inv) { localStorage.setItem(INVITE_KEY, inv); nettoyerUrl(); }
  // Lien de parrainage (?parrain=...) : l'ami créera SA propre famille.
  const par = params.get("parrain");
  if (par) { localStorage.setItem(PARRAIN_KEY, par); nettoyerUrl(); }
  // Code de parrainage permanent (?p=...) : même effet, mais le lien est
  // réutilisable — c'est celui que les familles partagent en groupe.
  const pcode = params.get("p");
  if (pcode) { localStorage.setItem(PARRAIN_CODE_KEY, normaliserCodeParrainage(pcode)); nettoyerUrl(); }
  // Jeton de vague (?vague=...) : le candidat de la liste d'attente crée sa
  // famille. On vérifie le jeton en base avant de le retenir, pour qu'une
  // valeur inventée n'ouvre pas les inscriptions.
  const vag = params.get("vague");
  if (vag) { nettoyerUrl(); if (await jetonVagueValide(vag)) localStorage.setItem(VAGUE_KEY, vag); }

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

  // Le mode d'inscription (ouvertes / par vagues) décide de ce qu'affiche
  // l'écran d'accueil : on attend la configuration avant de le peindre.
  if (!utilisateur) { await configAppPrete(); return ecranAuth(); }
  await apresConnexion();
}

function nettoyerUrl() {
  try { history.replaceState({}, "", location.pathname); } catch {}
}
function utilisateurCourant() { return utilisateur; }

// ---------- Configuration globale de l'app (table app_config) ----------
let configApp = {};
let configAppPromesse = null;
async function chargerConfigApp() {
  if (!sb) return;
  try {
    const { data } = await sb.from("app_config").select("key,value");
    configApp = {};
    (data || []).forEach(r => { configApp[r.key] = r.value; });
  } catch { configApp = {}; }
}
// Même chargement, mutualisé : l'écran d'accueil doit connaître le mode
// d'inscription avant de s'afficher, sans relancer une deuxième requête.
function configAppPrete() {
  if (!configAppPromesse) configAppPromesse = chargerConfigApp();
  return configAppPromesse;
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
  // L'éditeur doit pouvoir contrôler le module en conditions réelles. Ce test
  // passe AVANT celui des early adopters : l'administrateur figure lui-même
  // dans cette liste, et l'ordre inverse lui masquait le bloc en permanence.
  if (estAdmin) return true;
  if (estEarlyAdopter()) return false;                            // jamais aux early adopters
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

// ---------- Blagues gérées par l'admin (par langue, app_config) ----------
// On matérialise la liste complète (défaut + modifs) dans « blagues_<lang> »
// dès la 1ʳᵉ modification ; tant qu'aucune modif, on garde la liste par défaut.
async function adminAjouterBlague(lang, q, r) {
  if (!BLAGUES_DEFAUT[lang]) return false;
  q = (q || "").trim(); r = (r || "").trim();
  if (!q || !r) { toast(t("admin.blg_vide"), "info"); return false; }
  const liste = blaguesDe(lang).concat([{ q, r }]);
  const ok = await adminDefinirConfig("blagues_" + lang, JSON.stringify(liste));
  if (ok) configApp["blagues_" + lang] = JSON.stringify(liste);
  return ok;
}
async function adminSupprimerBlague(lang, idx) {
  if (!BLAGUES_DEFAUT[lang]) return false;
  const liste = blaguesDe(lang).filter((_, i) => i !== idx);
  const ok = await adminDefinirConfig("blagues_" + lang, JSON.stringify(liste));
  if (ok) configApp["blagues_" + lang] = JSON.stringify(liste);
  return ok;
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

  // Retours restés en file locale (envoyés hors ligne) : on les rejoue.
  if (typeof viderFileRetours === "function") viderFileRetours();

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

/* Raccourcis d'URL (#croissance, #admin) : ouvrent directement une section de
 * l'espace admin après connexion. Sans effet pour un non-administrateur : le
 * contenu reste protégé côté serveur (RLS + is_admin) et côté affichage. */
function ouvrirRaccourciURL() {
  const cle = (location.hash || "").replace(/^#/, "").trim();
  if (!cle) return;
  const raccourcis = { croissance: "croissance", admin: "stats" };
  if (!raccourcis[cle]) return;
  if (!estAdmin) return;                 // estAdmin est résolu dans apresConnexion()
  etat.vue = "reglages";                 // le code parent reste demandé s'il existe
  if (typeof ongletParent !== "undefined") ongletParent = "admin";
  if (typeof sousOngletAdmin !== "undefined") sousOngletAdmin = raccourcis[cle];
  history.replaceState(null, "", location.pathname);   // on nettoie l'URL
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
  ouvrirRaccourciURL();                   // /croissance → Admin → Croissance
  rendre();
  if (typeof verifierTuto === "function") verifierTuto();   // tutoriel au 1ᵉʳ lancement
  abonnerRealtime();
  document.removeEventListener("visibilitychange", auRetour);
  document.addEventListener("visibilitychange", auRetour);
  verifierParrainages();                  // féliciter le parrain si un filleul a rejoint
  pingUsage();                            // mesure d'activité (best-effort, 1×/jour)
  declencherEnvoisAuto();                 // relances + rapport (admin, 1×/jour, si armé)
}
function auRetour() { if (!document.hidden) { tirerEtat(); if (typeof majDodo === "function") majDodo(); } }

// Ping d'usage : une fois par jour et par famille (best-effort, jamais bloquant).
// Sert aux statistiques « familles actives ». N'écrit jamais dans family_state.
async function pingUsage() {
  try {
    if (typeof modeDemo !== "undefined" && modeDemo) return;          // pas en démo
    if (!familleActive || !familleActive.id || familleActive.id === "_demo") return;
    if (typeof sb === "undefined" || !sb) return;
    const cle = "famiteam_ping_" + familleActive.id;
    const auj = new Date().toISOString().slice(0, 10);               // AAAA-MM-JJ (local suffisant)
    if (localStorage.getItem(cle) === auj) return;                   // déjà pingé aujourd'hui
    localStorage.setItem(cle, auj);
    await sb.rpc("track_usage", { p_family: familleActive.id, p_kind: "open" });
  } catch (e) { /* best-effort : on n'interrompt jamais l'app */ }
}

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
// Où revenir après un lien d'authentification. Sur le web, on garde
// location.origin (voir HOTE_PUBLIC plus haut : ça permet de tester un lien
// magique sur un aperçu Vercel). Dans l'app native, cette adresse n'existe
// pas — il faut renvoyer vers l'hôte public, à charge pour lui de rouvrir
// l'app (App Links / Universal Links à configurer côté Capacitor).
function urlRetourAuth() {
  return estAppNative() ? HOTE_PUBLIC : (location.origin + location.pathname);
}

// Réception du lien d'authentification dans l'app native. Sur le web, cliquer
// le lien recharge la page sur HOTE_PUBLIC/urlRetourAuth : le SDK Supabase lit
// alors tout seul les jetons dans location.hash au chargement. Dans l'app,
// ouvrir ce même lien ne recharge rien — le système remet juste l'URL à l'app
// (Universal Links iOS / App Links Android, plugin @capacitor/app) — donc rien
// ne lit jamais ce hash si on ne va pas le chercher explicitement ici.
// Fonction pure (testée isolément) : extrait les jetons, ne fait aucun accès réseau.
function analyserJetonsAuthDepuisUrl(url) {
  const i = (url || "").indexOf("#");
  if (i === -1) return null;
  const params = new URLSearchParams(url.slice(i + 1));
  const access_token = params.get("access_token"), refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, type: params.get("type") || "" };
}
function initDeepLinkAuth() {
  if (!estAppNative()) return;
  const app = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!app || typeof app.addListener !== "function") return;
  app.addListener("appUrlOpen", async ({ url }) => {
    const jetons = analyserJetonsAuthDepuisUrl(url);
    if (!jetons) return;   // lien d'invitation/parrainage ordinaire : rien à faire ici
    const { error } = await sb.auth.setSession(jetons);
    if (error) return;
    if (jetons.type === "recovery") ecranNouveauMdp();
    else await apresConnexion();
  });
}
async function connexionLienMagique(email) {
  const { error } = await sb.auth.signInWithOtp({
    email, options: { emailRedirectTo: urlRetourAuth() }
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
    email, password: mdp, options: { emailRedirectTo: urlRetourAuth() }
  });
  if (!error && data.session) { utilisateur = data.user; await apresConnexion(); }
  return error;
}
async function envoyerResetMdp(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: urlRetourAuth()
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

/* ---------- Origine de l'inscription ----------
 * Mémorisée à la toute première visite (?src=… , ?utm_source=… , sinon le
 * domaine référent), puis transmise à la création de famille et à la liste
 * d'attente. Sert au chantier « Socle de mesure » : savoir ce qui amène des
 * familles. Aucune donnée personnelle : un simple mot-clé. */
const SOURCE_KEY = "kp_source";
function memoriserSource() {
  try {
    if (localStorage.getItem(SOURCE_KEY)) return;          // la première visite fait foi
    const p = new URLSearchParams(location.search);
    let src = (p.get("src") || p.get("utm_source") || "").trim().toLowerCase();
    if (!src && document.referrer) {
      try {
        const h = new URL(document.referrer).hostname.replace(/^www\./, "");
        if (h && h !== location.hostname) src = h;
      } catch (e) { /* référent illisible */ }
    }
    if (src) localStorage.setItem(SOURCE_KEY, src.slice(0, 60));
  } catch (e) { /* stockage indisponible : on s'en passe */ }
}
function sourceInscription() {
  try { return localStorage.getItem(SOURCE_KEY) || null; } catch (e) { return null; }
}

/* ---------- Envois automatiques (chantier « Automatiser le récurrent ») ----------
 * Deux règles non négociables :
 *   1. rien ne part tant que l'administrateur n'a pas armé l'interrupteur
 *      (app_config → mails_auto) : par défaut, aucun envoi ;
 *   2. un envoi réussi est journalisé en base (table mails_auto), donc un
 *      même e-mail ne peut jamais partir deux fois, même si le déclencheur
 *      est rejoué.
 * L'envoi passe par la session de l'utilisateur connecté : la fonction
 * send-mail exige une authentification. Le déclencheur est donc l'ouverture
 * de l'app (une fois par jour au maximum), pas un cron. */
function mailsAutoArmes() {
  return !!(configApp && String(configApp.mails_auto || "").trim() === "on");
}
// Corps d'un modèle de js/croissance.js, mentions {…} remplacées.
function modeleMailCroissance(id, valeurs) {
  const m = (typeof mailCroissance === "function") ? mailCroissance(id) : null;
  if (!m) return null;
  const remplir = (txt) => String(txt).replace(/\{(\w+)\}/g, (_, k) =>
    (valeurs && valeurs[k] != null) ? valeurs[k] : "");
  return { sujet: remplir(m.sujet), corps: remplir(m.corps) };
}
async function mailAutoDeja(type, cle) {
  try {
    const { data } = await sb.rpc("mail_auto_deja", { p_type: type, p_cle: String(cle) });
    return !!data;
  } catch (e) { return true; }        // en cas de doute : on n'envoie pas
}
async function mailAutoMarquer(type, cle) {
  try { await sb.rpc("mail_auto_marquer", { p_type: type, p_cle: String(cle) }); } catch (e) { /* best-effort */ }
}
// Envoi unitaire, journalisé. Retourne true si l'e-mail est bien parti.
async function envoyerMailAuto(type, cle, dest, modele, valeurs) {
  if (!mailsAutoArmes() || !dest) return false;
  if (!estProduction()) return false;          // aperçu : on ne touche pas aux familles
  if (typeof modeDemo !== "undefined" && modeDemo) return false;
  if (await mailAutoDeja(type, cle)) return false;
  const m = modeleMailCroissance(modele, valeurs);
  if (!m) return false;
  const res = await envoyerMailFn({ to: dest, subject: m.sujet, text: m.corps, replyTo: emailSupport() });
  if (res && res.ok) { await mailAutoMarquer(type, cle); return true; }
  return false;
}

/* ---------- Avertir l'administrateur d'un changement ----------
 * Tout ce qui s'applique tout seul doit être signalé : un e-mail court, le
 * changement en une phrase, et le lien vers la page Croissance où se prennent
 * les décisions. Le verrou est en base (table changements) : un même
 * changement ne peut donner lieu qu'à un seul e-mail, quel que soit
 * l'appareil. Indépendant de l'interrupteur des e-mails aux familles : ceci
 * part chez l'administrateur, pas chez les parents. */
function notifsAdminActives() {
  return String((configApp && configApp.notifs_admin) || "on").trim() !== "off";
}
function lienCroissance() {
  return (location.origin || "https://famiteam.com") + "/croissance";
}
async function notifierAdmin(type, cle, resume, decisions) {
  if (!estAdmin || !notifsAdminActives()) return false;
  if (typeof modeDemo !== "undefined" && modeDemo) return false;
  if (typeof enVacances === "function" && enVacances()) return false;
  // Hors production : on sort AVANT de noter le changement. Sinon l'aperçu
  // consommerait le verrou et la production ne signalerait jamais rien.
  if (!estProduction()) return false;
  let nouveau = false;
  try {
    const { data, error } = await sb.rpc("changement_noter",
      { p_type: type, p_cle: String(cle), p_resume: resume });
    nouveau = !error && !!data;
  } catch (e) { return false; }
  if (!nouveau) return false;                 // déjà signalé : on n'écrit pas deux fois

  let corps = `${resume}\n\n`;
  // Les décisions en attente, avec leurs options et celle recommandée.
  if (decisions && decisions.length) {
    corps += `À DÉCIDER\n`;
    decisions.forEach(d => {
      corps += `\n${d.titre}\n${d.contexte}\n`;
      d.options.forEach(o => {
        corps += `  ${o.recommande ? "→ [recommandé]" : "  -"} ${o.titre} : ${o.detail}\n`;
      });
    });
    corps += `\nChaque option se choisit en un clic sur la page :\n`;
  } else {
    corps += `Rien à décider : c'est une information.\n\n`;
  }
  corps += `${lienCroissance()}\n`;

  const res = await envoyerMailFn({
    to: emailSupport(),
    subject: `FamiTeam — ${resume.slice(0, 70)}`,
    text: corps
  });
  if (res && res.ok) {
    try { await sb.rpc("changement_notifie", { p_type: type, p_cle: String(cle) }); } catch (e) { /* best-effort */ }
    return true;
  }
  return false;
}
// Les derniers changements appliqués (page Croissance).
async function adminChangements(limite) {
  if (!estAdmin) return [];
  try {
    const { data, error } = await sb.rpc("admin_changements", { p_limit: limite || 20 });
    return error ? [] : (data || []);
  } catch (e) { return []; }
}
// Décision tranchée : on l'enregistre, elle ne reviendra plus.
async function enregistrerDecision(id, optionId) {
  const ok = await adminDefinirConfig("decision_" + id, optionId);
  if (ok) configApp["decision_" + id] = optionId;
  return ok;
}
function decisionsPrises() {
  const out = {};
  Object.keys(configApp || {}).forEach(k => {
    if (k.indexOf("decision_") === 0 && configApp[k]) out[k.slice(9)] = configApp[k];
  });
  return out;
}

// E-mail de bienvenue : envoyé au parent qui vient de créer sa famille.
async function envoyerBienvenue(familleId) {
  const u = utilisateurCourant();
  if (!u || !u.email) return false;
  const prenom = (u.email.split("@")[0] || "").replace(/[._-]+/g, " ");
  return envoyerMailAuto("bienvenue", familleId, u.email, "m_bienvenue",
    { prenom, lien: HOTE_PUBLIC });
}

// Relances d'activation en attente (administrateur uniquement).
async function adminMailsEnAttente() {
  if (!estAdmin) return [];
  const { data, error } = await sb.rpc("admin_mails_en_attente");
  if (error) return [];
  return data || [];
}
/* Le 7e jour : proposer d'offrir l'app aux familles CONVAINCUES.
 * Une seule fois par famille (verrou en base, type « parrainage_actif »), et
 * seulement si aucune famille n'a encore été amenée. Le message demande UNE
 * famille, jamais le maximum. */
async function envoyerPropositionsParrainageActifs(liste) {
  const familles = liste || await adminParrainagesActifsARelancer();
  let n = 0;
  for (const f of familles) {
    if (!f.email) continue;
    const prenom = (f.email.split("@")[0] || "").replace(/[._-]+/g, " ");
    const ok = await envoyerMailAuto("parrainage_actif", f.famille_id, f.email, "m_parrainage_actif",
      { prenom, lien: HOTE_PUBLIC });
    if (ok) n++;
  }
  return n;
}

// Propose le parrainage aux familles installées depuis trois semaines.
// Une seule fois par famille, jamais de relance.
async function envoyerPropositionsParrainage(liste) {
  const familles = liste || await adminParrainagesAProposer();
  let n = 0;
  for (const f of familles) {
    if (!f.email) continue;
    const prenom = (f.email.split("@")[0] || "").replace(/[._-]+/g, " ");
    const ok = await envoyerMailAuto("parrainage", f.famille_id, f.email, "m_parrainage",
      { prenom, lien: HOTE_PUBLIC });
    if (ok) n++;
  }
  return n;
}

// Envoie les relances en attente. Retourne le nombre d'e-mails partis.
async function envoyerRelancesActivation(liste) {
  const familles = liste || await adminMailsEnAttente();
  let n = 0;
  for (const f of familles) {
    if (!f.email) continue;
    const prenom = (f.email.split("@")[0] || "").replace(/[._-]+/g, " ");
    const ok = await envoyerMailAuto("activation", f.famille_id, f.email, "m_activation",
      { prenom, lien: HOTE_PUBLIC });
    if (ok) n++;
  }
  return n;
}
// Rapport mensuel : les chiffres clés, à l'adresse de support, une fois par mois.
async function envoyerRapportMensuel() {
  if (!estAdmin || !mailsAutoArmes()) return false;
  const periode = new Date().toISOString().slice(0, 7);
  if (await mailAutoDeja("rapport", periode)) return false;
  const [s, u, a] = await Promise.all([adminStats(), adminUsageStats(), adminActivation()]);
  if (!s && !u) return false;
  const v = (o, k) => (o && o[k] != null) ? o[k] : "—";
  const corps = `FamiTeam — rapport du mois ${periode}\n\n` +
    `Familles actives 7 j (étoile du Nord) : ${v(u, "actifs_7j")}\n` +
    `Familles inscrites : ${v(s, "familles_total")} (dont ${v(s, "familles_30j")} sur 30 jours)\n` +
    `Activation J+1 : ${a && a.taux != null ? a.taux + " %" : "—"}\n` +
    `Parrainages acceptés : ${v(s, "referrals_acceptes")}\n` +
    `Liste d'attente : ${v(s, "waitlist_total")}\n` +
    `Retours non lus : ${v(s, "feedback_non_lus")}\n\n` +
    `Une décision à noter ce mois-ci ? ${location.origin || "https://famiteam.com"}/croissance\n`;
  const res = await envoyerMailFn({ to: emailSupport(), subject: `FamiTeam — rapport ${periode}`, text: corps });
  if (res && res.ok) { await mailAutoMarquer("rapport", periode); return true; }
  return false;
}
/* Contexte des décisions : les chiffres réels sur lesquels se déclenchent les
 * questions à trancher. Une seule collecte, réutilisée par l'e-mail et par la
 * page Croissance. */
async function contexteDecisions() {
  const [cap, dons, vag, act] = await Promise.all([
    capaciteProjet(),
    (typeof adminDonationsStats === "function") ? adminDonationsStats() : null,
    (typeof adminVaguesStats === "function") ? adminVaguesStats() : null,
    (typeof adminActivation === "function") ? adminActivation() : null
  ]);
  return {
    familles:            cap ? cap.familles : 0,
    plafond:             cap ? cap.plafond : plafondFamilles(),
    plafondAtteint:      cap ? !!cap.atteint : false,
    partBase:            cap ? cap.part_base : 0,
    envoisArmes:         mailsAutoArmes(),
    inscriptionsOuvertes: inscriptionsOuvertes(),
    tauxVague:           (vag && vag.taux != null) ? vag.taux : 0,
    tauxActivation:      (act && act.taux != null) ? act.taux : 0,
    donsCents:           (dons && dons.total_cents) || 0,
    coutCents:           (typeof coutAnnuelCents === "function") ? coutAnnuelCents() : 2700
  };
}
// Déclencheur : à l'ouverture de l'app par l'administrateur, une fois par jour.
async function declencherEnvoisAuto() {
  try {
    if (!estAdmin) return;
    if (typeof modeDemo !== "undefined" && modeDemo) return;
    // Aperçu (dev, déploiement de test, local) : on ne touche à rien. La base
    // est partagée avec la production — un basculement de plafond ou un verrou
    // d'envoi posé ici aurait des effets bien réels sur les familles.
    if (!estProduction()) return;
    const cle = "kp_envois_auto";
    const auj = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(cle) === auj) return;
    localStorage.setItem(cle, auj);
    if (enVacances()) return;                 // pause : rien ne part, rien ne bascule

    // Le plafond se surveille tout seul, et indépendamment des envois : c'est
    // une protection, pas une communication. Il s'applique donc même quand
    // l'interrupteur des e-mails automatiques est coupé.
    const bascule = await appliquerPlafond();

    // Les décisions à prendre, calculées sur les chiffres du jour.
    const ctx = await contexteDecisions();
    const aDecider = (typeof decisionsEnAttente === "function")
      ? decisionsEnAttente(ctx, decisionsPrises()) : [];

    if (bascule) {
      await notifierAdmin("plafond", String(ctx.plafond),
        `Plafond de ${ctx.plafond} familles atteint : les inscriptions sont passées en liste d'attente.`,
        aDecider);
    }

    if (mailsAutoArmes()) {
      const nAct = await envoyerRelancesActivation();
      const nPar = await envoyerPropositionsParrainage();
      const nJ7 = await envoyerPropositionsParrainageActifs();
      const nRev = await envoyerReveils();
      const nVag = await envoyerVagueDuMois();
      const nRel = await envoyerRelancesVague();
      const n = nAct + nPar + nJ7 + nRev + nVag + nRel;
      await envoyerRapportMensuel();
      if (nVag > 0) {
        await notifierAdmin("vague", new Date().toISOString().slice(0, 7),
          `Vague d'invitations partie : ${nVag} famille(s) invitée(s) depuis la liste d'attente.`, []);
      }
      if (n > 0 && typeof toast === "function") toast(t("croiss.mails_partis", { n }), "succes");
    }

    // Une décision nouvellement ouverte mérite un mot, même sans autre changement.
    for (const d of aDecider) {
      await notifierAdmin("decision", d.id, `Une décision vous attend : ${d.titre}`, [d]);
    }
  } catch (e) { /* best-effort : jamais bloquant */ }
}

/* ---------- Familles & invitations ---------- */
async function creerFamille(nom, nbEnfants) {
  const { data, error } = await sb.rpc("create_family", { p_name: nom, p_source: sourceInscription() });
  if (error) { alert("Erreur : " + error.message); return; }
  await chargerFamilles();
  const f = mesFamilles.find(x => x.id === data) || mesFamilles[mesFamilles.length - 1];
  if (f) await ouvrirFamille(f);
  // Nouvelle famille (état vierge) : on ajuste le nombre d'enfants choisi.
  if (nbEnfants && typeof ajusterNombreEnfantsCreation === "function") {
    ajusterNombreEnfantsCreation(nbEnfants);
    vueAccueilAine(); rendre();
  }
  // E-mail de bienvenue (silencieux, et seulement si l'admin a armé les envois).
  if (data) envoyerBienvenue(data);

  // Si l'utilisateur a été parrainé, on relie sa nouvelle famille au parrain.
  const par = localStorage.getItem(PARRAIN_KEY);
  if (par && data) {
    try { await sb.rpc("claim_referral", { p_token: par, p_family: data }); } catch {}
    localStorage.removeItem(PARRAIN_KEY);
  }
  // Même chose pour un code permanent (?p=). La RPC est silencieuse en cas de
  // code inconnu ou d'auto-parrainage : une inscription ne doit jamais échouer
  // pour cette raison.
  const pcode = localStorage.getItem(PARRAIN_CODE_KEY);
  if (pcode && data) {
    try { await sb.rpc("claim_referral_code", { p_code: pcode, p_family: data }); } catch {}
    localStorage.removeItem(PARRAIN_CODE_KEY);
  }
  // Jeton de vague consommé : la famille existe, il n'a plus d'utilité.
  if (data) localStorage.removeItem(VAGUE_KEY);
}

/* ---------- L'Arbre des familles : code de parrainage permanent ----------
 * Un seul code par famille, réutilisable indéfiniment : il se colle une fois
 * dans un groupe de parents, se met sur un QR code et s'imprime. */
// Nettoyage d'un code saisi ou lu : majuscules, sans les caractères ambigus
// écartés de l'alphabet (O→0 et I/L→1 sont des confusions de lecture).
function normaliserCodeParrainage(brut) {
  return String(brut || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}
let _codeParrainageCache = null;
async function codeParrainage() {
  if (_codeParrainageCache) return _codeParrainageCache;
  if (!familleId) return null;
  const { data, error } = await sb.rpc("referral_code_famille", { p_family: familleId });
  if (error || !data) return null;
  _codeParrainageCache = data;
  return data;
}
function lienDepuisCode(code) {
  return HOTE_PUBLIC + "/?p=" + encodeURIComponent(code);
}
async function lienParrainagePermanent() {
  const code = await codeParrainage();
  return code ? lienDepuisCode(code) : null;
}
async function regenererCodeParrainage() {
  if (!familleId) return null;
  const { data, error } = await sb.rpc("regenerer_referral_code", { p_family: familleId });
  if (error) { toast("Erreur : " + error.message, "info"); return null; }
  _codeParrainageCache = data || null;
  return _codeParrainageCache;
}
// Bilan de SA famille : familles arrivées, familles vivantes, palier atteint
// et ce qui manque pour le suivant. Aucune identité de filleul n'est renvoyée.
async function parrainageBilan() {
  if (!familleId || modeDemo) return null;
  const { data, error } = await sb.rpc("parrainage_bilan", { p_family: familleId });
  return error ? null : (data || null);
}
// Jauge collective : des agrégats seulement, pour transformer un classement
// en quête commune.
async function parrainageJauge() {
  if (modeDemo) return null;
  const { data, error } = await sb.rpc("parrainage_jauge");
  return error ? null : (data || null);
}
/* Tableau d'honneur. La lecture est ouverte à toute famille connectée : voir
 * n'est pas figurer. Y FIGURER exige un consentement explicite et un
 * pseudonyme d'équipe — jamais le nom de la famille (RGPD art. 7). */
async function classementParrainages(saison) {
  if (modeDemo) return null;
  const { data, error } = await sb.rpc("classement_parrainages", { p_saison: saison || null });
  return error ? null : (data || null);
}
async function definirClassementOptin(optin, pseudo) {
  if (!familleId) return null;
  const { error } = await sb.rpc("definir_classement_optin",
    { p_family: familleId, p_optin: !!optin, p_pseudo: pseudo || null });
  if (error) { toast(error.message, "info"); return false; }
  return true;
}
// Saison en cours, au format AAAA. Annuelle : un mois est trop court pour
// qu'une famille ait le temps d'en amener plusieurs, et le tableau repartait
// de zéro avant même d'avoir pris. Sans saison du tout, à l'inverse, la
// première famille arrivée gagnerait à vie.
function saisonCourante() {
  return String(new Date().getFullYear());
}

async function infoParrainageCode(code) {
  try {
    const { data } = await sb.rpc("referral_info_par_code", { p_code: code });
    const info = Array.isArray(data) ? data[0] : data;
    return info || null;
  } catch { return null; }
}

/* ---------- Parrainage (inviter un ami à créer sa propre famille) ---------- */
async function creerParrainage() {
  const { data, error } = await sb.rpc("create_referral", { p_family: familleId });
  if (error) { toast("Erreur : " + error.message, "info"); return null; }
  return HOTE_PUBLIC + "/?parrain=" + data;
}
async function parrainageRestant() {
  if (INVITATIONS_ILLIMITEES || estAdmin) return 999;   // illimité
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

// Inscriptions autorisées si ouvertes globalement, ou via un jeton en attente
// (invitation, parrainage, ou jeton de vague de la liste d'attente).
function inscriptionAutorisee() {
  return inscriptionsOuvertes() ||
         !!(localStorage.getItem(INVITE_KEY) || localStorage.getItem(PARRAIN_KEY) ||
            localStorage.getItem(PARRAIN_CODE_KEY) || localStorage.getItem(VAGUE_KEY));
}
// Rejoindre la liste d'attente (candidats sans invitation).
async function rejoindreListeAttente(email) {
  const { error } = await sb.rpc("join_waitlist", { p_email: email, p_source: sourceInscription() });
  return error;
}
// RPC admin : activation J+1 (part des familles qui ont vraiment démarré).
async function adminActivation() {
  const { data, error } = await sb.rpc("admin_activation");
  if (error) { toast("Erreur admin : " + error.message, "info"); return null; }
  return data || null;
}
// RPC admin : entonnoir d'activation (chantier Activation & rétention).
// admin_activation() ne mesure que J+1 ; l'entonnoir montre où l'on perd les
// familles ensuite, ce que rien n'affichait.
async function adminEntonnoir() {
  if (!estAdmin) return null;
  const { data, error } = await sb.rpc("admin_entonnoir");
  return error ? null : (data || null);
}
// RPC admin : familles endormies à réveiller (30 jours à six mois).
async function adminFamillesEndormies() {
  if (!estAdmin) return [];
  const { data, error } = await sb.rpc("admin_familles_endormies");
  if (error) return [];
  return data || [];
}
/* Réveil d'une famille endormie : un seul envoi par trimestre, et plus rien
 * passé six mois de silence (le filtre est en base). La clé d'idempotence est
 * calculée par la RPC elle-même, pour que la base et le client ne puissent pas
 * diverger dans leur définition du trimestre. */
async function envoyerReveils(liste) {
  const familles = liste || await adminFamillesEndormies();
  let n = 0;
  for (const f of familles) {
    if (!f.email || !f.cle_trimestre) continue;
    const prenom = (f.email.split("@")[0] || "").replace(/[._-]+/g, " ");
    const ok = await envoyerMailAuto("reactivation", f.cle_trimestre, f.email, "m_reactivation",
      { prenom, lien: HOTE_PUBLIC });
    if (ok) n++;
  }
  return n;
}

// RPC admin : familles convaincues au 7e jour, sans filleul (Arbre des familles).
async function adminParrainagesActifsARelancer() {
  if (!estAdmin) return [];
  const { data, error } = await sb.rpc("admin_parrainages_actifs_a_relancer");
  if (error) return [];
  return data || [];
}
// RPC admin : familles à qui proposer de parrainer (chantier Parrainage).
async function adminParrainagesAProposer() {
  if (!estAdmin) return [];
  const { data, error } = await sb.rpc("admin_parrainages_a_proposer");
  if (error) return [];
  return data || [];
}
// RPC admin : origine des inscriptions (90 jours).
async function adminSources() {
  const { data, error } = await sb.rpc("admin_sources");
  if (error) { toast("Erreur admin : " + error.message, "info"); return []; }
  return data || [];
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

/* ---------- Vagues d'invitation (chantier « Liste d'attente ») ---------- */
// Lien personnel d'un candidat : autorise la création de SA famille.
function lienVague(token) {
  return HOTE_PUBLIC + "/?vague=" + token;
}
// Le jeton existe-t-il, et la vague a-t-elle bien été envoyée ? La fonction
// ne renvoie qu'un booléen : elle ne divulgue jamais l'e-mail du candidat.
async function jetonVagueValide(token) {
  if (!/^[0-9a-f-]{36}$/i.test(String(token || ""))) return false;
  try {
    const { data, error } = await sb.rpc("waitlist_invitation_valide", { p_token: token });
    return !error && !!data;
  } catch (e) { return false; }
}
// Les prochains candidats à inviter (les plus anciens d'abord).
async function adminVagueSuivante(taille) {
  if (!estAdmin) return [];
  const { data, error } = await sb.rpc("admin_vague_suivante", { p_taille: taille || tailleVague() });
  if (error) return [];
  return data || [];
}
// Candidats invités il y a au moins sept jours et toujours sans compte.
async function adminVaguesARelancer() {
  if (!estAdmin) return [];
  const { data, error } = await sb.rpc("admin_vagues_a_relancer");
  if (error) return [];
  return data || [];
}
// Conversion des vagues : invités, inscrits, taux.
async function adminVaguesStats() {
  if (!estAdmin) return null;
  const { data, error } = await sb.rpc("admin_vagues_stats");
  if (error) return null;
  return data || null;
}
// Une vague par mois au maximum : le verrou est en base (mails_auto), donc il
// tient même si l'app est ouverte depuis plusieurs appareils.
async function envoyerVagueDuMois() {
  if (!estAdmin || !mailsAutoArmes()) return 0;
  const periode = new Date().toISOString().slice(0, 7);
  if (await mailAutoDeja("vague_mois", periode)) return 0;
  const candidats = await adminVagueSuivante();
  if (!candidats.length) return 0;              // rien à inviter : on ne verrouille pas le mois
  await mailAutoMarquer("vague_mois", periode);
  return envoyerVague(candidats);
}
// Envoie une vague d'invitations. Un candidat n'est jamais invité deux fois :
// mails_auto le garantit, et invited_at l'enregistre côté liste d'attente.
async function envoyerVague(liste) {
  const candidats = liste || await adminVagueSuivante();
  let n = 0;
  for (const cand of candidats) {
    if (!cand.email) continue;
    const ok = await envoyerMailAuto("vague", cand.email, cand.email, "m_waitlist_invit",
      { lien_invitation: lienVague(cand.token) });
    if (!ok) continue;
    try { await sb.rpc("admin_vague_marquer", { p_email: cand.email }); } catch (e) { /* best-effort */ }
    n++;
  }
  return n;
}
// Relance unique à J+7. Pas de deuxième relance : on laisse tranquille.
async function envoyerRelancesVague(liste) {
  const candidats = liste || await adminVaguesARelancer();
  let n = 0;
  for (const cand of candidats) {
    if (!cand.email) continue;
    const ok = await envoyerMailAuto("vague_relance", cand.email, cand.email, "m_waitlist_relance",
      { lien_invitation: lienVague(cand.token) });
    if (ok) n++;
  }
  return n;
}

async function creerInvitation() {
  const { data, error } = await sb.rpc("create_invite", { p_family: familleId, p_email: null });
  if (error) { toast("Erreur : " + error.message, "info"); return null; }
  return HOTE_PUBLIC + "/?invite=" + data;
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

// ---------- Statistiques d'utilisation (admin, lecture seule) ----------
async function adminStats() {
  const { data, error } = await sb.rpc("admin_stats");
  if (error) { toast("Erreur stats : " + error.message, "info"); return null; }
  return data || null;
}
async function adminSerieInscriptions() {
  const { data, error } = await sb.rpc("admin_series_inscriptions");
  if (error) { toast("Erreur stats : " + error.message, "info"); return []; }
  return data || [];
}
async function adminSerieActivite() {
  const { data, error } = await sb.rpc("admin_series_activite");
  if (error) { toast("Erreur stats : " + error.message, "info"); return []; }
  return data || [];
}
async function adminFamillesRecentes(limite) {
  const { data, error } = await sb.rpc("admin_list_families_recent", { p_limit: limite || 10 });
  if (error) { toast("Erreur stats : " + error.message, "info"); return []; }
  return data || [];
}

// ---------- Activité d'usage (admin, lecture seule) ----------
async function adminUsageStats() {
  const { data, error } = await sb.rpc("admin_usage_stats");
  if (error) { toast("Erreur stats : " + error.message, "info"); return null; }
  return data || null;
}
async function adminSerieUsage() {
  const { data, error } = await sb.rpc("admin_series_usage");
  if (error) { toast("Erreur stats : " + error.message, "info"); return []; }
  return data || [];
}
async function adminDbStats() {
  const { data, error } = await sb.rpc("admin_db_stats");
  if (error) { toast("Erreur stockage : " + error.message, "info"); return null; }
  return data || null;
}

// ---------- Dons (admin, lecture seule — alimenté par le webhook Stripe) ----------
async function adminDonationsStats() {
  const { data, error } = await sb.rpc("admin_donations_stats");
  if (error) { toast("Erreur dons : " + error.message, "info"); return null; }
  return data || null;
}
async function adminListerDons(limite) {
  const { data, error } = await sb.rpc("admin_list_donations", { p_limit: limite || 20 });
  if (error) { toast("Erreur dons : " + error.message, "info"); return []; }
  return data || [];
}
async function adminExportAll() {
  const { data, error } = await sb.rpc("admin_export_all");
  if (error) { toast("Erreur export : " + error.message, "info"); return null; }
  return data || null;
}

// ---------- Retours utilisateurs (admin) ----------
async function adminListerFeedback() {
  const { data, error } = await sb.rpc("admin_list_feedback");
  if (error) { toast("Erreur retours : " + error.message, "info"); return []; }
  return data || [];
}
async function adminMajStatutFeedback(id, statut) {
  const { error } = await sb.rpc("admin_set_feedback_status", { p_id: id, p_status: statut });
  if (error) { toast("Erreur : " + error.message, "info"); return false; }
  return true;
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
  const parrainCode = localStorage.getItem(PARRAIN_CODE_KEY);
  // Menu déroulant compact : un seul bouton visible (drapeau + code de la
  // langue active) qui ouvre la liste au clic — même quatre pastilles à la
  // suite prenaient trop de place sur un petit téléphone. Le nom complet de
  // chaque langue reste lisible dans la liste, pour un lecteur d'écran comme
  // au clic.
  const optionsLangue = Object.keys(LANGUES).map(l =>
    `<li role="option" aria-selected="${l === langue}">
       <button type="button" class="lang-opt${l === langue ? " actif" : ""}" data-lang="${l}">
         <span class="langue-drapeau">${drapeau(l)}</span>
         <span class="lang-nom">${LANGUES[l]}</span>
         ${l === langue ? '<span class="lang-coche" aria-hidden="true">✓</span>' : ""}
       </button>
     </li>`).join("");

  const features = [
    ["🎯", t("auth.feat1_t"), t("auth.feat1_d")],
    ["🎁", t("auth.feat2_t"), t("auth.feat2_d")],
    ["🌍", t("auth.feat3_t"), t("auth.feat3_d")],
    ["🏆", t("auth.feat4_t"), t("auth.feat4_d")],
    // Les quatre premières promesses décrivent un jeu pour enfants, ce qui
    // suffit à faire fuir un parent réticent aux écrans — la raison d'arrêt
    // la plus citée par les familles interrogées. Le mode sans écran existe
    // depuis longtemps, mais il était replié au fond de l'espace parents :
    // personne ne le trouvait avant d'avoir décidé de partir.
    ["📄", t("auth.feat5_t"), t("auth.feat5_d")]
  ].map(([e, ti, de]) => `<div class="feat"><span class="feat-emoji">${e}</span>
      <div><strong>${ti}</strong><span>${de}</span></div></div>`).join("");

  document.body.innerHTML = `
    <div class="landing">
      <!-- Barre de langues : une ligne, en haut, hors du flux du texte. -->
      <nav class="landing-langues" aria-label="${t("auth.langues")}">
        <button type="button" id="lang-toggle" class="lang-select"
                aria-haspopup="listbox" aria-expanded="false" aria-controls="lang-menu">
          <span class="langue-drapeau">${drapeau(langue)}</span>
          <span class="lang-code">${langue.toUpperCase()}</span>
          <span class="lang-fleche" aria-hidden="true">▾</span>
        </button>
        <ul id="lang-menu" class="lang-menu" role="listbox" aria-label="${t("auth.langues")}" hidden>${optionsLangue}</ul>
      </nav>

      <!-- Qui nous sommes, en quatre lignes. Sur téléphone, ce bloc précède le
           formulaire : on ne demande pas de créer un compte avant d'avoir dit
           de quoi il s'agit. -->
      <section class="landing-tete">
        <div class="hero-logo">🌟</div>
        <h1 class="hero-nom">${APP_NOM}</h1>
        <p class="hero-titre">${t("auth.hero_titre")}</p>
        <p class="hero-sous">${t("auth.hero_sous", { app: APP_NOM })}</p>
      </section>

      <!-- Le différenciateur, expliqué sans jargon. Il reste AVANT le
           formulaire : c'est la réponse à l'objection principale, et c'est ce
           qui décide un parent hésitant. -->
      <section class="landing-cle">
        <div class="hero-principe">
          <h2>${t("auth.principe_titre")}</h2>
          <p>${t("auth.principe_1")}</p>
          <p>${t("auth.principe_2")}</p>
          <p class="hero-principe-faq"><a href="faq.html">${t("auth.principe_faq")}</a></p>
        </div>
      </section>

      <!-- Le formulaire vient ensuite : sur téléphone, on l'atteint sans faire
           défiler toute la page ; sur grand écran, la grille le place en haut
           à droite (voir grid-template-areas). -->
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
          <p class="note landing-liens">
            <a href="faq.html">${t("auth.lien_faq")}</a>
            <a href="mentions-legales.html">${t("auth.lien_legal")}</a>
            <a href="confidentialite.html">${t("auth.lien_confid")}</a>
          </p>
        </div>
      </section>

      <section class="landing-corps">
        <div class="hero-features">${features}</div>
        <div class="hero-steps">
          <h2>${t("auth.comment_titre")}</h2>
          <ol>
            <li>${t("auth.etape1")}</li>
            <li>${t("auth.etape2")}</li>
            <li>${t("auth.etape3")}</li>
          </ol>
        </div>

        <!-- Trois captures réelles de l'app : ce que voit l'enfant, ce qu'il
             fait grandir, et ce que fait le parent le soir. Générées depuis
             l'état de démonstration : aucune donnée de famille réelle. -->
        <div class="hero-apercus">
          <figure>
            <img src="images/apercu-enfant.png" width="500" height="500" loading="lazy"
                 alt="${t("auth.shot1_alt")}">
            <figcaption>${t("auth.shot1")}</figcaption>
          </figure>
          <figure>
            <img src="images/apercu-avatar.png" width="500" height="560" loading="lazy"
                 alt="${t("auth.shot2_alt")}">
            <figcaption>${t("auth.shot2")}</figcaption>
          </figure>
          <figure>
            <img src="images/apercu-parents.png" width="500" height="680" loading="lazy"
                 alt="${t("auth.shot3_alt")}">
            <figcaption>${t("auth.shot3")}</figcaption>
          </figure>
        </div>

      </section>
    </div>`;

  const toggleLangue = document.getElementById("lang-toggle");
  const menuLangue = document.getElementById("lang-menu");
  if (toggleLangue && menuLangue) {
    toggleLangue.onclick = (e) => {
      e.stopPropagation();
      const ouvrir = menuLangue.hidden;
      menuLangue.hidden = !ouvrir;
      toggleLangue.setAttribute("aria-expanded", String(ouvrir));
      // Un clic n'importe où ailleurs referme le menu — écouteur à usage
      // unique, posé seulement à l'ouverture : jamais d'accumulation au fil
      // des ouvertures/fermetures successives.
      if (ouvrir) {
        document.addEventListener("click", () => {
          menuLangue.hidden = true; toggleLangue.setAttribute("aria-expanded", "false");
        }, { once: true });
      }
    };
    menuLangue.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        menuLangue.hidden = true; toggleLangue.setAttribute("aria-expanded", "false"); toggleLangue.focus();
      }
    });
    menuLangue.querySelectorAll(".lang-opt").forEach(b => {
      b.onclick = () => { const l = b.dataset.lang; if (l && l !== langue) { definirLangue(l); ecranAuth(); } };
    });
  }

  // Bannière personnalisée si on arrive via un lien de parrainage — jeton
  // unique (?parrain=) ou code permanent (?p=), le message est le même.
  if (parrain || parrainCode) {
    const b = document.getElementById("parrain-banniere");
    if (b) {
      b.innerHTML = `<div class="parrain-carte">${t("auth.parrain_generique")}</div>`;
      const promesse = parrain ? infoParrainage(parrain) : infoParrainageCode(parrainCode);
      promesse.then(info => {
        if (info && info.parrain_name) {
          b.querySelector(".parrain-carte").innerHTML =
            t("auth.parrain_nomme", { nom: echapper(info.parrain_name), app: APP_NOM });
        }
      });
    }
  }

  const peutSinscrire = inscriptionAutorisee();      // inscription sur invitation seulement
  let inscriptionMode = !!(parrain || parrainCode);  // parrainage → création de compte
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
