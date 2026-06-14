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
      gouttes: 0,           // monnaie planète (cumul = écosystème)
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

/* ---------- Écosystème ---------- */
function paliersAtteints(gouttes) {
  return ECOSYSTEME_PALIERS.filter(p => gouttes >= p.seuil);
}
function prochainPalier(gouttes) {
  return ECOSYSTEME_PALIERS.find(p => gouttes < p.seuil) || null;
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
  if (enf.gouttes >= 20) ajoute("eco20", "Ami des arbres", "🌳");
  if (enf.gouttes >= 70) ajoute("eco70", "Gardien de la nature", "🦋");
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
