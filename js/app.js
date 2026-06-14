/* =====================================================================
 * KidsPositifs — Logique de l'application
 * Données sauvegardées en local (localStorage). Aucune connexion requise.
 * ===================================================================== */

const STORAGE_KEY = "kidspositifs_v1";
const ANNEE_REF = 2026; // sert au calcul de l'âge (mettez à jour si besoin)

/* ---------- État ---------- */
let etat = chargerEtat();

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
      avatar: { base: e.id === "e2023" ? "bebe" : "garcon", chapeau: "rien",
                accessoire: "rien", compagnon: "rien", fond: "ciel" },
      debloque: [],         // ids d'options d'avatar débloquées
      journal: {},          // { "2026-06-14": { missionId: count } }
      badges: []            // récompenses symboliques
    };
  });
  return { enfants, enfantActif: ENFANTS_DEFAUT[0].id, vue: "accueil" };
}

function chargerEtat() {
  try {
    const brut = localStorage.getItem(STORAGE_KEY);
    if (!brut) return etatVierge();
    const e = JSON.parse(brut);
    // garde-fou : compléter les champs manquants
    if (!e.enfants) return etatVierge();
    // migration : s'assurer que chaque enfant a un écosystème structuré
    Object.values(e.enfants).forEach(enf => {
      if (!enf.ecosysteme) enf.ecosysteme = { plantes: {}, herbivores: {}, carnivores: {} };
      TIERS_ECO.forEach(t => { if (!enf.ecosysteme[t.id]) enf.ecosysteme[t.id] = {}; });
      if (enf.gouttesTotal === undefined) enf.gouttesTotal = enf.gouttes || 0;
    });
    return e;
  } catch (err) {
    console.warn("Sauvegarde illisible, réinitialisation.", err);
    return etatVierge();
  }
}

function sauver() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(etat));
}

/* ---------- Utilitaires ---------- */
function aujourdHui() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function age(enfant) { return ANNEE_REF - enfant.naissance; }
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
document.addEventListener("DOMContentLoaded", () => {
  initSquelette();
  rendre();
});
