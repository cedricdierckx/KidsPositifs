/* =====================================================================
 * KidsPositifs — Logique de l'application
 * Données synchronisées entre appareils via une API (/api) + Upstash KV,
 * grâce à un "code famille" partagé. localStorage sert de cache hors-ligne.
 * ===================================================================== */

const STORAGE_KEY = "kidspositifs_v1";   // cache local (par code famille)
const CODE_KEY = "kidspositifs_code";    // code famille mémorisé sur l'appareil
const PULL_INTERVAL = 12000;             // rafraîchissement auto (ms)

/* ---------- État ---------- */
let etat = etatVierge();      // remplacé au démarrage par la synchro
let codeFamille = null;       // identifiant partagé de la famille
let pushTimer = null;         // anti-rebond pour l'envoi
let syncEnCours = false;

function etatVierge() {
  const enfants = {};
  ENFANTS_DEFAUT.forEach(e => {
    enfants[e.id] = {
      ...e,
      coeurs: 0,            // monnaie famille (dépensable pour avatar)
      coeursTotal: 0,       // total cumulé (statistiques)
      gouttes: 0,           // monnaie planète (dépensable pour l'écosystème)
      gouttesTotal: 0,      // total cumulé (statistiques)
      ecosysteme: { plantes: {}, herbivores: {}, carnivores: {} }, // tier -> {especeId: nb}
      avatar: { base: avatarDefaut(e), chapeau: "rien",
                accessoire: "rien", compagnon: "rien", fond: "ciel" },
      debloque: [],         // ids d'options d'avatar débloquées
      journal: {},          // { "2026-06-14": { missionId: count } }
      badges: []            // récompenses symboliques
    };
  });
  return { enfants, enfantActif: ENFANTS_DEFAUT[0].id, vue: "accueil", maj: 0 };
}

// Avatar de base par défaut selon l'âge et le sexe.
function avatarDefaut(e) {
  if (ageDepuis(e.naissance) <= 2) return "bebe";
  return e.sexe === "fille" ? "fille" : "garcon";
}

// Normalise / complète un état (migrations).
function normaliser(e) {
  if (!e || !e.enfants) return etatVierge();
  Object.values(e.enfants).forEach(enf => {
    if (!enf.ecosysteme) enf.ecosysteme = { plantes: {}, herbivores: {}, carnivores: {} };
    TIERS_ECO.forEach(t => { if (!enf.ecosysteme[t.id]) enf.ecosysteme[t.id] = {}; });
    if (enf.gouttesTotal === undefined) enf.gouttesTotal = enf.gouttes || 0;
    // migration date de naissance : ancien format = année (nombre)
    if (typeof enf.naissance === "number") enf.naissance = enf.naissance + "-01-01";
    if (!enf.naissance) enf.naissance = "2020-01-01";
    if (!enf.sexe) enf.sexe = "garcon";
  });
  if (e.maj === undefined) e.maj = 0;
  return e;
}

/* ---------- Cache local ---------- */
function cleCache() { return STORAGE_KEY + ":" + (codeFamille || "_local"); }
function lireCache() {
  try {
    const brut = localStorage.getItem(cleCache());
    return brut ? normaliser(JSON.parse(brut)) : null;
  } catch { return null; }
}
function ecrireCache() {
  try { localStorage.setItem(cleCache(), JSON.stringify(etat)); } catch {}
}

// Sauvegarde : met à jour l'horodatage, le cache local, puis pousse en ligne.
function sauver() {
  etat.maj = Date.now();
  ecrireCache();
  planifierPush();
}

/* ---------- Synchronisation en ligne ---------- */
function planifierPush() {
  if (!codeFamille) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pousser, 600);
}

async function pousser() {
  if (!codeFamille) return;
  try {
    majBadgeSync("⏫");
    const r = await fetch(`/api/state?code=${encodeURIComponent(codeFamille)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(etat)
    });
    majBadgeSync(r.ok ? "✅" : "⚠️");
  } catch {
    majBadgeSync("📴"); // hors-ligne : le cache local prend le relais
  }
}

async function tirer({ silencieux = false } = {}) {
  if (!codeFamille || syncEnCours) return;
  syncEnCours = true;
  try {
    if (!silencieux) majBadgeSync("⏬");
    const r = await fetch(`/api/state?code=${encodeURIComponent(codeFamille)}`);
    if (r.ok) {
      const distant = await r.json();
      if (distant && distant.enfants && (distant.maj || 0) > (etat.maj || 0)) {
        etat = normaliser(distant);
        ecrireCache();
        rendre();
      }
      majBadgeSync("✅");
    }
  } catch {
    majBadgeSync("📴");
  } finally {
    syncEnCours = false;
  }
}

function majBadgeSync(symbole) {
  const b = document.querySelector("#sync-etat");
  if (b) b.textContent = symbole;
}

// Connexion à un code famille : charge le distant, sinon publie le local.
async function connecterFamille(code) {
  codeFamille = code.trim().toLowerCase().replace(/[^a-z0-9\-]/g, "-").slice(0, 40);
  if (!codeFamille) return;
  localStorage.setItem(CODE_KEY, codeFamille);

  const cache = lireCache();
  if (cache) etat = cache;

  try {
    const r = await fetch(`/api/state?code=${encodeURIComponent(codeFamille)}`);
    if (r.ok) {
      const distant = await r.json();
      if (distant && distant.enfants) {
        // fusion simple : on garde la version la plus récente
        if ((distant.maj || 0) >= (etat.maj || 0)) etat = normaliser(distant);
        else await pousser();
      } else {
        await pousser(); // espace vide en ligne : on y publie nos données
      }
    }
  } catch {
    /* hors-ligne : on reste sur le cache local */
  }
  rendre();
}

function changerCode() {
  if (confirm("Changer de code famille ? Cet appareil affichera alors les données liées au nouveau code.")) {
    localStorage.removeItem(CODE_KEY);
    location.reload();
  }
}

/* ---------- Utilitaires ---------- */
function aujourdHui() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
// Âge en années révolues à partir d'une date AAAA-MM-JJ.
function ageDepuis(dateNaissance) {
  const n = new Date(dateNaissance);
  if (isNaN(n)) return 0;
  const a = new Date();
  let ans = a.getFullYear() - n.getFullYear();
  const m = a.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && a.getDate() < n.getDate())) ans--;
  return Math.max(0, ans);
}
function age(enfant) { return ageDepuis(enfant.naissance); }
function enfantActif() { return etat.enfants[etat.enfantActif]; }
function $(sel) { return document.querySelector(sel); }
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}
function aleatoire(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ---------- Actions ---------- */
function validerMission(mission) {
  const enf = enfantActif();
  const jour = aujourdHui();
  enf.journal[jour] = enf.journal[jour] || {};
  const dejaFait = enf.journal[jour][mission.id] || 0;

  // Les missions quotidiennes ne se valident qu'une fois par jour.
  if (mission.type === "quotidien" && dejaFait >= 1) {
    toast("Déjà validé aujourd'hui ! Reviens demain 😊", "info");
    return;
  }

  enf.journal[jour][mission.id] = dejaFait + 1;

  if (mission.cat === "famille") {
    enf.coeurs += mission.points;
    enf.coeursTotal += mission.points;
  } else {
    enf.gouttes += mission.points;
    enf.gouttesTotal += mission.points;
  }

  feterGain(mission);
  verifierBadges(enf);
  sauver();
  rendre();
}

function defiReparation(defi) {
  const enf = enfantActif();
  enf.coeurs += defi.bonus;
  enf.coeursTotal += defi.bonus;
  toast(`Bravo d'avoir réparé ! +${defi.bonus} 💛`, "succes");
  sauver();
  rendre();
}

function acheterOption(categorie, option) {
  const enf = enfantActif();
  const cle = `${categorie}:${option.id}`;
  if (!enf.debloque.includes(cle) && option.cout > 0) {
    if (enf.coeurs < option.cout) {
      toast("Pas encore assez de Cœurs 💛 — continue tes belles actions !", "info");
      return;
    }
    enf.coeurs -= option.cout;
    enf.debloque.push(cle);
    toast(`Débloqué : ${option.nom} ! 🎉`, "succes");
  }
  // équiper
  enf.avatar[categorie] = option.id;
  sauver();
  rendre();
}

function estDebloque(enf, categorie, option) {
  return option.cout === 0 || enf.debloque.includes(`${categorie}:${option.id}`);
}

/* ---------- Écosystème (chaîne alimentaire) ---------- */

// Nombre total d'êtres vivants créés dans un niveau (tier).
function nbTier(enf, tierId) {
  const c = enf.ecosysteme[tierId] || {};
  return Object.values(c).reduce((s, n) => s + n, 0);
}
// Nombre total d'êtres vivants dans tout l'écosystème.
function nbTotalEspeces(enf) {
  return TIERS_ECO.reduce((s, t) => s + nbTier(enf, t.id), 0);
}
// Un niveau est-il débloqué ? (assez d'êtres vivants au niveau précédent)
function tierDebloque(enf, tier) {
  const idx = TIERS_ECO.findIndex(t => t.id === tier.id);
  if (idx === 0) return true;
  const precedent = TIERS_ECO[idx - 1];
  return nbTier(enf, precedent.id) >= tier.requis;
}
// Manque combien d'êtres du niveau précédent pour débloquer ce niveau.
function manqueePourDebloquer(enf, tier) {
  const idx = TIERS_ECO.findIndex(t => t.id === tier.id);
  if (idx === 0) return 0;
  const precedent = TIERS_ECO[idx - 1];
  return Math.max(0, tier.requis - nbTier(enf, precedent.id));
}

// Créer un être vivant : dépense des Gouttes et l'ajoute à l'écosystème.
function creerEspece(tier, espece) {
  const enf = enfantActif();
  if (!tierDebloque(enf, tier)) {
    const manque = manqueePourDebloquer(enf, tier);
    const prec = TIERS_ECO[TIERS_ECO.findIndex(t => t.id === tier.id) - 1];
    toast(`Crée encore ${manque} ${prec.nom.toLowerCase()} ${prec.emoji} d'abord — ils nourrissent les ${tier.nom.toLowerCase()} !`, "info");
    return;
  }
  if (enf.gouttes < espece.cout) {
    toast("Pas encore assez de Gouttes 💧 — continue tes gestes pour la planète !", "info");
    return;
  }
  enf.gouttes -= espece.cout;
  const coll = enf.ecosysteme[tier.id];
  coll[espece.id] = (coll[espece.id] || 0) + 1;
  toast(`${espece.emoji} Un(e) ${espece.nom} rejoint ton écosystème ! 🌍`, "succes");
  confettis();
  verifierBadges(enf);
  sauver();
  rendre();
}

/* ---------- Badges ---------- */
function verifierBadges(enf) {
  const ajoute = (id, nom, emoji) => {
    if (!enf.badges.find(b => b.id === id)) {
      enf.badges.push({ id, nom, emoji });
      toast(`Nouveau badge : ${emoji} ${nom} !`, "succes");
    }
  };
  if (enf.coeursTotal >= 10) ajoute("coeur10", "Cœur d'or", "💛");
  if (enf.coeursTotal >= 50) ajoute("coeur50", "Super entraide", "🏅");
  if (nbTier(enf, "plantes") >= 1)    ajoute("eco_p", "Jardinier en herbe", "🌱");
  if (nbTier(enf, "herbivores") >= 1) ajoute("eco_h", "Ami des herbivores", "🐰");
  if (nbTier(enf, "carnivores") >= 1) ajoute("eco_c", "Protecteur des prédateurs", "🦊");
  if (nbTier(enf, "plantes") >= 1 && nbTier(enf, "herbivores") >= 1 && nbTier(enf, "carnivores") >= 1)
    ajoute("eco_chaine", "Chaîne alimentaire complète", "🔗");
  // série de jours actifs
  const jours = Object.keys(enf.journal).length;
  if (jours >= 7) ajoute("semaine", "Une semaine d'efforts", "📅");
}

/* ---------- Feedback ---------- */
function feterGain(mission) {
  const cat = CATEGORIES[mission.cat];
  toast(`${cat.monnaieEmoji} +${mission.points} ${cat.monnaie} — ${aleatoire(ENCOURAGEMENTS)}`, "succes");
  confettis();
}

let toastTimer;
function toast(msg, type = "info") {
  const t = $("#toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 3200);
}

function confettis() {
  const zone = $("#confettis");
  const emojis = ["🎉", "⭐", "💛", "🌟", "✨", "🌈"];
  for (let i = 0; i < 18; i++) {
    const c = el("span", "confetti", aleatoire(emojis));
    c.style.left = Math.random() * 100 + "vw";
    c.style.animationDelay = Math.random() * 0.4 + "s";
    c.style.fontSize = 18 + Math.random() * 22 + "px";
    zone.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }
}

/* ---------- Réglages ---------- */
function majEnfant(id, champ, valeur) {
  etat.enfants[id][champ] = valeur;
  sauver();
}
function reinitialiser() {
  if (confirm("Tout effacer et recommencer à zéro ? (Cœurs, gouttes, avatars, écosystèmes)")) {
    etat = etatVierge();
    sauver();
    rendre();
  }
}
function exporter() {
  const blob = new Blob([JSON.stringify(etat, null, 2)], { type: "application/json" });
  const a = el("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kidspositifs-sauvegarde.json";
  a.click();
}

/* ---------- Démarrage ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const code = localStorage.getItem(CODE_KEY);
  if (!code) {
    ecranCode();   // première fois : on demande le code famille
    return;
  }
  await demarrerAvecCode(code);
});

async function demarrerAvecCode(code) {
  initSquelette();
  await connecterFamille(code);
  rendre();
  // rafraîchissement périodique + au retour sur l'onglet
  setInterval(() => tirer({ silencieux: true }), PULL_INTERVAL);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tirer({ silencieux: true });
  });
}
