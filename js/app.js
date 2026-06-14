/* =====================================================================
 * KidsPositifs — Logique de l'application (jeu)
 * L'authentification, les familles et la synchronisation Supabase sont
 * gérées dans js/auth.js. Ce fichier contient l'état de jeu et les actions.
 * ===================================================================== */

const STORAGE_KEY = "kidspositifs_state"; // préfixe du cache local (par famille)

/* ---------- État ---------- */
let etat = etatVierge();      // remplacé au démarrage par les données de la famille
let familleId = null;         // id de la famille active (défini par auth.js)
let modeParents = false;      // mode parents actif (session, non synchronisé)
let modeDemo = false;         // mode démonstration (hors-ligne, sans compte)

/* ---------- Cache local (par famille, pour le hors-ligne) ---------- */
function cleCache() { return STORAGE_KEY + ":" + (familleId || "_local"); }
function lireCache() {
  try {
    const brut = localStorage.getItem(cleCache());
    return brut ? normaliser(JSON.parse(brut)) : null;
  } catch { return null; }
}
function ecrireCache() {
  try { localStorage.setItem(cleCache(), JSON.stringify(etat)); } catch {}
}

// Sauvegarde : horodatage + cache local + envoi vers Supabase (auth.js).
function sauver() {
  etat.maj = Date.now();
  ecrireCache();
  if (typeof planifierSauvegardeCloud === "function") planifierSauvegardeCloud();
}

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
      avatar: avatarParDefaut(e),
      debloque: [],         // ids d'options d'avatar débloquées
      heureCoucher: "19:30",// heure de coucher (réglable par les parents)
      journal: {},          // { "2026-06-14": { missionId: count } }
      planJour: {},         // { "2026-06-14": [missionId,...] } missions imposées du jour
      enAttente: [],        // actions en attente de validation parentale
      badges: [],           // récompenses symboliques
      badgesRetires: []     // badges retirés par les parents (non re-attribués)
    };
  });
  return {
    enfants, enfantActif: ENFANTS_DEFAUT[0].id, vue: "accueil", maj: 0,
    reglages: { validationParentale: false, codeParent: "" }
  };
}

// État d'une "famille démo" pré-remplie (mode découverte, hors-ligne).
function etatDemo() {
  const e = etatVierge();
  const ids = Object.keys(e.enfants);
  const noms = ["Lina", "Tom", "Jade", "Noé"];
  ids.forEach((id, i) => { if (noms[i]) e.enfants[id].prenom = noms[i]; });

  const a = e.enfants[ids[0]];
  a.coeurs = 24; a.coeursTotal = 38; a.gouttes = 16; a.gouttesTotal = 22;
  a.avatar = { ...a.avatar, chapeau: "couronne", lunettes: "rondes", fond: "arcenciel", compagnon: "chat", coiffure: "couettes", cheveux: "rose" };
  a.ecosysteme.plantes = { herbe: 3, fleur: 2, arbre: 1 };
  a.ecosysteme.herbivores = { lapin: 1, papillon: 2 };
  a.badges = [{ id: "coeur10", nom: "Cœur d'or", emoji: "💛" },
              { id: "eco_p", nom: "Jardinier en herbe", emoji: "🌱" }];

  const b = e.enfants[ids[1]];
  b.coeurs = 9; b.coeursTotal = 9; b.gouttes = 5; b.gouttesTotal = 5;
  b.ecosysteme.plantes = { trefle: 2 };

  e.maj = Date.now();
  return e;
}

// Coiffure par défaut selon le sexe.
function coiffureDefaut(e) { return e.sexe === "fille" ? "couettes" : "court"; }
// Avatar complet par défaut.
function avatarParDefaut(e) {
  return {
    peau: "clair", coiffure: coiffureDefaut(e), cheveux: "brun", yeux: "ronds",
    lunettes: "rien", taches: "rien", pilosite: "rien", boucles: "rien",
    chapeau: "rien", accessoire: "rien", compagnon: "rien", fond: "ciel"
  };
}
// Emoji par défaut (sélecteur) selon l'âge et le sexe.
function emojiDefaut(e) {
  if (ageDepuis(e.naissance) <= 2) return "👶";
  return e.sexe === "fille" ? "👧" : "👦";
}
// Réaligne coiffure et emoji sur le sexe, sans écraser un choix personnalisé.
function appliquerSexe(enf) {
  const coiffuresDefaut = ["couettes", "court"];
  if (enf.avatar && coiffuresDefaut.includes(enf.avatar.coiffure)) enf.avatar.coiffure = coiffureDefaut(enf);
  const emojisDefaut = ["🧒", "👦", "👧", "🧑", "👶"];
  if (emojisDefaut.includes(enf.emoji)) enf.emoji = emojiDefaut(enf);
}

// Normalise / complète un état (migrations).
function normaliser(e) {
  if (!e || !e.enfants) return etatVierge();
  Object.values(e.enfants).forEach(enf => {
    if (!enf.ecosysteme) enf.ecosysteme = { plantes: {}, herbivores: {}, carnivores: {} };
    TIERS_ECO.forEach(t => { if (!enf.ecosysteme[t.id]) enf.ecosysteme[t.id] = {}; });
    if (enf.gouttesTotal === undefined) enf.gouttesTotal = enf.gouttes || 0;
    if (!Array.isArray(enf.enAttente)) enf.enAttente = [];
    // migration date de naissance : ancien format = année (nombre)
    if (typeof enf.naissance === "number") enf.naissance = enf.naissance + "-01-01";
    if (!enf.naissance) enf.naissance = "2020-01-01";
    if (!enf.sexe) enf.sexe = "garcon";
    // migration avatar : ancien format (emoji superposés) -> nouvel avatar SVG
    if (!enf.avatar || enf.avatar.base !== undefined || enf.avatar.peau === undefined) {
      enf.avatar = avatarParDefaut(enf);
      enf.debloque = []; // les anciens déblocages ne correspondent plus
    }
    // champs d'avatar ajoutés ultérieurement -> valeur par défaut
    ["taches", "pilosite", "boucles"].forEach(k => { if (enf.avatar[k] === undefined) enf.avatar[k] = "rien"; });
    if (!Array.isArray(enf.badgesRetires)) enf.badgesRetires = [];
    if (!Array.isArray(enf.badges)) enf.badges = [];
    if (!enf.planJour || typeof enf.planJour !== "object") enf.planJour = {};
    if (!/^\d{1,2}:\d{2}$/.test(enf.heureCoucher || "")) enf.heureCoucher = "19:30";
  });
  if (e.maj === undefined) e.maj = 0;
  if (!e.reglages) e.reglages = { validationParentale: false, codeParent: "" };
  return e;
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

// Ambiance "dodo" selon l'heure actuelle par rapport à l'heure de coucher.
function momentDodo(enf) {
  const parts = (enf.heureCoucher || "19:30").split(":");
  const coucher = (parseInt(parts[0], 10) || 19) * 60 + (parseInt(parts[1], 10) || 30);
  const now = new Date();
  const maintenant = now.getHours() * 60 + now.getMinutes();
  const reste = coucher - maintenant; // minutes avant le coucher
  if (reste > 60) return { classe: "dodo-jour", emoji: "☀️", titre: "Encore du temps pour jouer", info: `Dodo à ${enf.heureCoucher}` };
  if (reste > 0)  return { classe: "dodo-soir", emoji: "🌇", titre: "Bientôt l'heure du dodo", info: `Dans ${reste} min (${enf.heureCoucher})` };
  return { classe: "dodo-nuit", emoji: "🌙", titre: "C'est l'heure de dormir", info: `Dodo à ${enf.heureCoucher}` };
}
function $(sel) { return document.querySelector(sel); }
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}
function aleatoire(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ---------- Actions ---------- */
// Crédite réellement les points d'une mission un jour donné.
function crediterMission(enf, mission, jour) {
  enf.journal[jour] = enf.journal[jour] || {};
  enf.journal[jour][mission.id] = (enf.journal[jour][mission.id] || 0) + 1;
  if (mission.cat === "famille") {
    enf.coeurs += mission.points;
    enf.coeursTotal += mission.points;
  } else {
    enf.gouttes += mission.points;
    enf.gouttesTotal += mission.points;
  }
  verifierBadges(enf);
}

// Retire le crédit d'une mission un jour donné (correction d'erreur).
function decrediterMission(enf, mission, jour) {
  const j = enf.journal[jour];
  if (!j || !j[mission.id]) return;
  if (j[mission.id] <= 1) delete j[mission.id]; else j[mission.id] -= 1;
  if (Object.keys(j).length === 0) delete enf.journal[jour];
  const champ = mission.cat === "famille" ? "coeurs" : "gouttes";
  const total = mission.cat === "famille" ? "coeursTotal" : "gouttesTotal";
  enf[champ] = Math.max(0, enf[champ] - mission.points);
  enf[total] = Math.max(0, enf[total] - mission.points);
}

// Clic sur une mission : 1er clic = valider, 2e clic = annuler (corrige une erreur).
function validerMission(mission) {
  const enf = enfantActif();
  const jour = aujourdHui();
  const dejaFait = (enf.journal[jour] && enf.journal[jour][mission.id]) || 0;
  const idxAttente = enf.enAttente.findIndex(a => a.missionId === mission.id && a.jour === jour);

  // 2e clic alors qu'une demande est en attente -> on annule la demande.
  if (idxAttente >= 0) {
    enf.enAttente.splice(idxAttente, 1);
    toast("Demande annulée.", "info");
    sauver(); rendre();
    return;
  }

  // 2e clic alors que c'est déjà validé -> on annule et on retire les points.
  if (dejaFait >= 1) {
    decrediterMission(enf, mission, jour);
    const cat = CATEGORIES[mission.cat];
    toast(`Annulé : −${mission.points} ${cat.monnaieEmoji}`, "info");
    sauver(); rendre();
    return;
  }

  // 1er clic : validation parentale -> mise en attente (sauf mode parents).
  if (etat.reglages.validationParentale && !modeParents) {
    enf.enAttente.push({ missionId: mission.id, cat: mission.cat, points: mission.points,
                         titre: mission.titre, emoji: mission.emoji, jour, ts: Date.now() });
    toast("Bravo ! 🎉 À faire valider par un parent ⏳", "info");
    sauver(); rendre();
    return;
  }

  // 1er clic : on crédite.
  crediterMission(enf, mission, jour);
  feterGain(mission);
  sauver();
  rendre();
}

/* ---------- Missions du jour (sélection par les parents) ----------
 * enf.planJour[date] = [missionId, ...]  -> liste imposée pour ce jour.
 * Si aucune liste pour la date : toutes les missions adaptées à l'âge. */
function planDuJour(enf, jour) {
  return enf.planJour && Array.isArray(enf.planJour[jour]) ? enf.planJour[jour] : null;
}
// Sélection par défaut, pertinente selon l'âge (les + prioritaires), ordre d'origine.
function missionsDefautCat(enf, catId, n) {
  n = n || NB_DEFAUT_PAR_CAT;
  const dispo = MISSIONS.filter(m => m.cat === catId && age(enf) >= m.ageMin);
  const choisis = new Set(
    dispo.slice().sort((a, b) => (PRIO_DEFAUT[a.id] || 5) - (PRIO_DEFAUT[b.id] || 5))
         .slice(0, n).map(m => m.id)
  );
  return dispo.filter(m => choisis.has(m.id));
}
// Tous les ids proposés par défaut (toutes catégories).
function idsDefaut(enf) {
  return [...missionsDefautCat(enf, "famille"), ...missionsDefautCat(enf, "planete")].map(m => m.id);
}
function missionsActives(enf, catId, jour) {
  const plan = planDuJour(enf, jour);
  if (!plan) return missionsDefautCat(enf, catId);
  return MISSIONS.filter(m => m.cat === catId && age(enf) >= m.ageMin && plan.includes(m.id));
}
// Active/retire une mission du plan d'un jour (mode parents).
function basculerPlan(enf, jour, missionId) {
  if (!enf.planJour) enf.planJour = {};
  if (!Array.isArray(enf.planJour[jour])) {
    // initialise depuis la sélection par défaut pertinente selon l'âge
    enf.planJour[jour] = idsDefaut(enf);
  }
  const arr = enf.planJour[jour];
  const i = arr.indexOf(missionId);
  if (i >= 0) arr.splice(i, 1); else arr.push(missionId);
  sauver();
  rendre();
}
// Réinitialise le plan d'un jour (= toutes les missions adaptées à l'âge).
function reinitPlan(enf, jour) {
  if (enf.planJour) delete enf.planJour[jour];
  sauver();
  rendre();
}

/* ---------- Mode parents : validation des actions en attente ---------- */
function confirmerAttente(enf, idx) {
  const a = enf.enAttente[idx];
  if (!a) return;
  const mission = MISSIONS.find(m => m.id === a.missionId) ||
                  { id: a.missionId, cat: a.cat, points: a.points, titre: a.titre };
  crediterMission(enf, mission, a.jour);
  enf.enAttente.splice(idx, 1);
  toast(`Validé : ${a.emoji || ""} ${a.titre} (+${a.points})`, "succes");
  confettis();
  sauver();
  rendre();
}
function refuserAttente(enf, idx) {
  enf.enAttente.splice(idx, 1);
  toast("Demande retirée.", "info");
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
  if (!Array.isArray(enf.badgesRetires)) enf.badgesRetires = [];
  const ajoute = (id, nom, emoji) => {
    if (enf.badgesRetires.includes(id)) return; // retiré par un parent : on ne le redonne pas
    if (!enf.badges.find(b => b.id === id)) {
      enf.badges.push({ id, nom, emoji });
      if (typeof animationBadge === "function") animationBadge(emoji, nom);
      else toast(`Nouveau badge : ${emoji} ${nom} !`, "succes");
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

/* ---------- Mode parents ---------- */
function activerModeParents() {
  const code = etat.reglages.codeParent;
  if (code) {
    const saisi = prompt("🔒 Code PIN parent :");
    if (saisi === null) return;
    if (saisi.trim() !== code) { toast("Code PIN incorrect 🔒", "info"); return; }
  }
  modeParents = true;
  rendre();
}
function quitterModeParents() { modeParents = false; rendre(); }

function definirCodeParent() {
  const actuel = etat.reglages.codeParent;
  const v = prompt(actuel ? "Nouveau code PIN (laisser vide pour le supprimer) :"
                          : "Choisir un code PIN parent (ex. 4 chiffres) :", "");
  if (v === null) return;
  etat.reglages.codeParent = v.trim();
  sauver();
  toast(etat.reglages.codeParent ? "Code PIN enregistré 🔒" : "Code PIN supprimé", "succes");
  rendre();
}

function basculerValidationParentale(actif) {
  etat.reglages.validationParentale = !!actif;
  sauver();
  rendre();
}

/* ---------- Ajustements manuels (mode parents) ---------- */
// Ajuste une monnaie d'un delta (peut être négatif). Met aussi à jour le total cumulé.
function ajusterMonnaie(enf, champ, delta) {
  if (champ === "coeurs") {
    enf.coeurs = Math.max(0, enf.coeurs + delta);
    if (delta > 0) enf.coeursTotal += delta;
  } else if (champ === "gouttes") {
    enf.gouttes = Math.max(0, enf.gouttes + delta);
    if (delta > 0) enf.gouttesTotal += delta;
  }
  sauver();
  rendre();
}
// Fixe directement une valeur de monnaie.
function fixerMonnaie(enf, champ, valeur) {
  const v = Math.max(0, parseInt(valeur) || 0);
  enf[champ] = v;
  sauver();
}

// Édition rétroactive : ajoute/retire une validation de mission un jour donné,
// et ajuste les soldes en conséquence.
function modifierHistorique(enf, jour, mission, sens) {
  enf.journal[jour] = enf.journal[jour] || {};
  const actuel = enf.journal[jour][mission.id] || 0;
  const champ = mission.cat === "famille" ? "coeurs" : "gouttes";
  const totalChamp = mission.cat === "famille" ? "coeursTotal" : "gouttesTotal";

  if (sens > 0) {
    enf.journal[jour][mission.id] = actuel + 1;
    enf[champ] += mission.points;
    enf[totalChamp] += mission.points;
  } else {
    if (actuel <= 0) return;
    if (actuel === 1) delete enf.journal[jour][mission.id];
    else enf.journal[jour][mission.id] = actuel - 1;
    enf[champ] = Math.max(0, enf[champ] - mission.points);
    enf[totalChamp] = Math.max(0, enf[totalChamp] - mission.points);
  }
  if (Object.keys(enf.journal[jour]).length === 0) delete enf.journal[jour];
  sauver();
  rendre();
}

/* ---------- Gestion des badges (mode parents) ---------- */
// Retire un badge ; il ne sera pas ré-attribué automatiquement.
function retirerBadge(enf, badgeId) {
  enf.badges = enf.badges.filter(b => b.id !== badgeId);
  if (!enf.badgesRetires.includes(badgeId)) enf.badgesRetires.push(badgeId);
  sauver();
  rendre();
}
// Réautorise les badges retirés (ils pourront se regagner selon les critères).
function reactiverBadges(enf) {
  enf.badgesRetires = [];
  verifierBadges(enf);
  sauver();
  rendre();
}
// Efface tous les badges d'un enfant (et les autorise à nouveau).
function effacerBadges(enf) {
  if (!confirm(`Effacer tous les badges de ${enf.prenom} ?`)) return;
  enf.badges = [];
  enf.badgesRetires = [];
  sauver();
  toast("Badges effacés.", "info");
  rendre();
}

/* ---------- Réglages ---------- */
function majEnfant(id, champ, valeur) {
  const enf = etat.enfants[id];
  enf[champ] = valeur;
  // L'avatar et l'emoji suivent le sexe/l'âge tant qu'ils sont "par défaut".
  if (champ === "sexe" || champ === "naissance") appliquerSexe(enf);
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

/* Le démarrage (authentification, choix de famille, chargement des données)
 * est orchestré dans js/auth.js. */
