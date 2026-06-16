/* =====================================================================
 * FamiTeam — Logique de l'application (jeu)
 * L'authentification, les familles et la synchronisation Supabase sont
 * gérées dans js/auth.js. Ce fichier contient l'état de jeu et les actions.
 * ===================================================================== */

const STORAGE_KEY = "kidspositifs_state"; // préfixe du cache local (par famille)
const ETAT_VERSION = 3;                    // version du schéma d'état (migrations additives)

/* ---------- État ---------- */
let etat = etatVierge();      // remplacé au démarrage par les données de la famille
let familleId = null;         // id de la famille active (défini par auth.js)
let familleEtat = null;       // id de la famille à laquelle `etat` est RÉELLEMENT lié
let modeParents = false;      // mode parents actif (session, non synchronisé)
let modeDemo = false;         // mode démonstration (hors-ligne, sans compte)

// Lie `etat` à la famille active. À utiliser à CHAQUE (ré)assignation de etat
// pour une famille : c'est ce lien qui empêche d'écrire les données d'une
// famille dans une autre (garde-fou anti-corruption).
function lierEtat(nouvelEtat) {
  etat = nouvelEtat;
  familleEtat = familleId;
  return etat;
}
// Vrai si `etat` contient au moins un enfant (sécurité anti-écrasement vide).
function etatNonVide(e) {
  return !!(e && e.enfants && Object.keys(e.enfants).length);
}

// Validation de schéma avant écriture (Phase B). Renforce les garde-fous :
// on refuse d'enregistrer un état manifestement corrompu (mauvais types,
// monnaies non numériques, structures essentielles manquantes). Renvoie
// { ok: true } ou { ok: false, raison: "..." } pour journalisation/alerte.
// Volontairement tolérant : ne bloque que ce qui trahit une vraie corruption,
// jamais une simple variante de données légitimes.
function etatValide(e) {
  if (!e || typeof e !== "object") return { ok: false, raison: "état absent ou non-objet" };
  if (!e.enfants || typeof e.enfants !== "object") return { ok: false, raison: "champ enfants absent ou invalide" };
  const ids = Object.keys(e.enfants);
  if (!ids.length) return { ok: false, raison: "aucun enfant" };
  for (const id of ids) {
    const enf = e.enfants[id];
    if (!enf || typeof enf !== "object") return { ok: false, raison: `enfant ${id} invalide` };
    for (const champ of ["coeurs", "coeursTotal", "gouttes", "gouttesTotal"]) {
      const v = enf[champ];
      if (v !== undefined && (typeof v !== "number" || !isFinite(v) || v < 0))
        return { ok: false, raison: `${champ} invalide pour ${id}` };
    }
    if (enf.journal !== undefined && (typeof enf.journal !== "object" || enf.journal === null))
      return { ok: false, raison: `journal invalide pour ${id}` };
    if (enf.badges !== undefined && !Array.isArray(enf.badges))
      return { ok: false, raison: `badges invalides pour ${id}` };
    if (enf.ecosysteme !== undefined && (typeof enf.ecosysteme !== "object" || enf.ecosysteme === null))
      return { ok: false, raison: `ecosysteme invalide pour ${id}` };
  }
  if (e.cartesSurprises !== undefined && !Array.isArray(e.cartesSurprises))
    return { ok: false, raison: "cartesSurprises invalides" };
  return { ok: true };
}

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
    version: ETAT_VERSION,
    missionsPerso: [],     // missions personnalisées ajoutées par les parents
    cartesSurprises: cartesSurprisesNeuves(ENFANTS_DEFAUT.length),  // objectifs d'équipe
    reglages: { validationParentale: false, codeParent: "" }
  };
}

// Cartes surprises neuves (copie des modèles, sans progression). Le prix
// par défaut = coutParEnfant × nombre d'enfants de la famille.
function cartesSurprisesNeuves(nbEnfants) {
  const n = Math.max(1, nbEnfants || ENFANTS_DEFAUT.length);
  return CARTES_SURPRISES_DEFAUT.map(c => ({
    id: c.id, emoji: c.emoji, titre: c.titre, activite: c.activite,
    cout: c.coutParEnfant * n,
    revele: false,   // mystère par défaut (révélé seulement jauge pleine)
    recolte: 0, dons: {}, debloquee: false, debloqueeLe: null, faite: false, faiteLe: null
  }));
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

  // Carte surprise déjà bien entamée par l'équipe (démonstration).
  if (e.cartesSurprises[0]) {
    const c0 = e.cartesSurprises[0];
    c0.recolte = Math.min(c0.cout, 10);
    c0.dons = { [ids[0]]: 7, [ids[1]]: 3 };
  }

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
  if (!Array.isArray(e.missionsPerso)) e.missionsPerso = [];
  // Cartes surprises (objectifs d'équipe) : seedées par défaut pour les
  // familles existantes, et chaque carte reçoit ses champs de progression.
  const nbEnf = Object.keys(e.enfants).length || ENFANTS_DEFAUT.length;
  if (!Array.isArray(e.cartesSurprises)) e.cartesSurprises = cartesSurprisesNeuves(nbEnf);
  else {
    // Anciens prix par défaut (avant le calcul × nb d'enfants).
    const anciensDefauts = { cs_cine: 15, cs_picnic: 30, cs_sortie: 60 };
    e.cartesSurprises.forEach(c => {
      if (typeof c.recolte !== "number" || c.recolte < 0) c.recolte = 0;
      if (!c.dons || typeof c.dons !== "object") c.dons = {};
      if (typeof c.cout !== "number" || c.cout < 1) c.cout = 10;
      c.debloquee = !!c.debloquee;
      c.faite = !!c.faite;
      if (c.revele === undefined) c.revele = false;
      else c.revele = !!c.revele;
      if (!c.emoji) c.emoji = "🎁";
      // Migration douce : si une carte par défaut a encore son ancien prix et
      // n'a jamais été utilisée, on applique le nouveau calcul (× nb d'enfants).
      const def = CARTES_SURPRISES_DEFAUT.find(d => d.id === c.id);
      if (def && c.recolte === 0 && anciensDefauts[c.id] === c.cout) {
        c.cout = def.coutParEnfant * nbEnf;
      }
    });
  }
  if (!e.reglages) e.reglages = { validationParentale: false, codeParent: "" };
  // Estampille de version : les migrations ci-dessus sont *additives* (on ne
  // supprime jamais de données existantes), garantissant qu'une mise à jour de
  // l'application ne fait jamais perdre la progression d'une famille.
  e.version = ETAT_VERSION;
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
// Id de l'enfant aîné (date de naissance la plus ancienne).
function idAine() {
  const liste = Object.values(etat.enfants);
  if (!liste.length) return null;
  return liste.slice().sort((a, b) => (a.naissance || "").localeCompare(b.naissance || ""))[0].id;
}
// Réinitialise l'affichage : accueil de l'enfant aîné, hors mode parents.
function vueAccueilAine() {
  const aine = idAine();
  if (aine) etat.enfantActif = aine;
  etat.vue = "accueil";
  modeParents = false;
}

// Ambiance "dodo" selon l'heure LOCALE par rapport à l'heure de coucher.
// FENETRE = durée (minutes) avant le coucher pendant laquelle le décompte
// visuel progresse (le jeton avance vers la lune).
const DODO_FENETRE = 120;
function momentDodo(enf) {
  const parts = (enf.heureCoucher || "19:30").split(":");
  const coucher = (parseInt(parts[0], 10) || 19) * 60 + (parseInt(parts[1], 10) || 30);
  const now = new Date();                       // heure locale de l'appareil
  const maintenant = now.getHours() * 60 + now.getMinutes();
  const reste = coucher - maintenant;           // minutes avant le coucher
  let classe, emoji, titre, progress;
  if (reste > DODO_FENETRE)      { classe = "dodo-jour"; emoji = "☀️"; titre = t("dodo.jour"); progress = 0; }
  else if (reste > 0)           { classe = "dodo-soir"; emoji = "🌇"; titre = t("dodo.soir"); progress = Math.round((1 - reste / DODO_FENETRE) * 100); }
  else                          { classe = "dodo-nuit"; emoji = "🌙"; titre = t("dodo.nuit"); progress = 100; }
  return { classe, emoji, titre, progress, heure: enf.heureCoucher };
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
    toast(t("toast.annule", { points: mission.points, emoji: cat.monnaieEmoji }), "info");
    sauver(); rendre();
    return;
  }

  // 1er clic : validation parentale -> mise en attente (sauf mode parents).
  if (etat.reglages.validationParentale && !modeParents) {
    enf.enAttente.push({ missionId: mission.id, cat: mission.cat, points: mission.points,
                         titre: mission.titre, emoji: mission.emoji, jour, ts: Date.now() });
    toast(t("toast.en_attente"), "info");
    sauver(); rendre();
    return;
  }

  // 1er clic : on crédite.
  crediterMission(enf, mission, jour);
  feterGain(mission);
  sauver();
  rendre();
}

/* ---------- Missions (catalogue + missions personnalisées) ----------
 * Les parents peuvent ajouter des missions propres à la famille.
 * Elles sont stockées dans etat.missionsPerso (synchronisées). */
function toutesMissions() {
  return (etat && Array.isArray(etat.missionsPerso)) ? MISSIONS.concat(etat.missionsPerso) : MISSIONS;
}
function trouverMission(id) {
  return toutesMissions().find(m => m.id === id) || null;
}
// Ajoute une mission personnalisée (mode parents).
function ajouterMissionPerso(cat, titre, emoji, points) {
  titre = (titre || "").trim();
  if (!titre) { toast(t("toast.nom_requis"), "info"); return; }
  if (!Array.isArray(etat.missionsPerso)) etat.missionsPerso = [];
  const id = "perso_" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  etat.missionsPerso.push({
    id, cat: cat === "planete" ? "planete" : "famille",
    emoji: (emoji || "").trim() || (cat === "planete" ? "🌍" : "⭐"),
    titre, ageMin: 0, points: Math.max(1, parseInt(points, 10) || 1),
    type: "quotidien", perso: true
  });
  sauver();
  toast(t("toast.mission_ajoutee"), "succes");
  rendre();
}
function supprimerMissionPerso(id) {
  if (!Array.isArray(etat.missionsPerso)) return;
  etat.missionsPerso = etat.missionsPerso.filter(m => m.id !== id);
  // On retire aussi la mission des plans enregistrés.
  Object.values(etat.enfants).forEach(enf => {
    if (enf.planJour) Object.keys(enf.planJour).forEach(d => {
      if (Array.isArray(enf.planJour[d])) enf.planJour[d] = enf.planJour[d].filter(x => x !== id);
    });
  });
  sauver();
  rendre();
}

/* ---------- Missions du jour (sélection par les parents) ----------
 * enf.planJour[date] = [missionId, ...] est un MODÈLE valable à partir de
 * cette date : pour un jour donné, on applique le dernier modèle dont la
 * date est <= ce jour. Modifier un jour s'applique donc à tous les suivants. */
function planEffectif(enf, jour) {
  if (!enf.planJour) return null;
  const dates = Object.keys(enf.planJour)
    .filter(d => Array.isArray(enf.planJour[d]) && d <= jour).sort();
  return dates.length ? enf.planJour[dates[dates.length - 1]] : null;
}
// Sélection par défaut, pertinente selon l'âge (les + prioritaires), ordre d'origine.
function missionsDefautCat(enf, catId, n) {
  n = n || NB_DEFAUT_PAR_CAT;
  const dispo = toutesMissions().filter(m => m.cat === catId && age(enf) >= m.ageMin);
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
  const plan = planEffectif(enf, jour);
  if (!plan) return missionsDefautCat(enf, catId);
  return toutesMissions().filter(m => m.cat === catId && age(enf) >= m.ageMin && plan.includes(m.id));
}
// Active/retire une mission du plan (mode parents) : vaut pour ce jour et les suivants.
function basculerPlan(enf, jour, missionId) {
  if (!enf.planJour) enf.planJour = {};
  if (!Array.isArray(enf.planJour[jour])) {
    // on part du modèle actuellement en vigueur (ou des défauts selon l'âge)
    const base = planEffectif(enf, jour);
    enf.planJour[jour] = base ? base.slice() : idsDefaut(enf);
  }
  const arr = enf.planJour[jour];
  const i = arr.indexOf(missionId);
  if (i >= 0) arr.splice(i, 1); else arr.push(missionId);
  // Pour que la modification s'applique vraiment à tous les jours suivants,
  // on efface les modèles postérieurs à ce jour.
  Object.keys(enf.planJour).forEach(d => { if (d > jour) delete enf.planJour[d]; });
  sauver();
  rendre();
}
// Réinitialise le plan à partir de ce jour (= sélection par défaut selon l'âge).
function reinitPlan(enf, jour) {
  if (!enf.planJour) enf.planJour = {};
  enf.planJour[jour] = idsDefaut(enf);
  Object.keys(enf.planJour).forEach(d => { if (d > jour) delete enf.planJour[d]; });
  sauver();
  rendre();
}

/* ---------- Mode parents : validation des actions en attente ---------- */
function confirmerAttente(enf, idx) {
  const a = enf.enAttente[idx];
  if (!a) return;
  const mission = trouverMission(a.missionId) ||
                  { id: a.missionId, cat: a.cat, points: a.points, titre: a.titre };
  crediterMission(enf, mission, a.jour);
  enf.enAttente.splice(idx, 1);
  toast(t("toast.valide", { emoji: a.emoji || "", titre: trData("mission", a.missionId, a.titre), points: a.points }), "succes");
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
  toast(t("toast.repare", { bonus: defi.bonus }), "succes");
  sauver();
  rendre();
}

function acheterOption(categorie, option) {
  const enf = enfantActif();
  const cle = `${categorie}:${option.id}`;
  if (!enf.debloque.includes(cle) && option.cout > 0) {
    if (enf.coeurs < option.cout) {
      toast(t("toast.pas_assez_coeurs"), "info");
      return;
    }
    enf.coeurs -= option.cout;
    enf.debloque.push(cle);
    toast(t("toast.debloque", { nom: trData("avatar." + categorie, option.id, option.nom) }), "succes");
  }
  // équiper
  enf.avatar[categorie] = option.id;
  sauver();
  rendre();
}

function estDebloque(enf, categorie, option) {
  return option.cout === 0 || enf.debloque.includes(`${categorie}:${option.id}`);
}

/* ---------- Cartes surprises (objectifs d'équipe) ----------
 * Activités à faire en famille, débloquées ENSEMBLE : chaque enfant donne
 * volontairement des Cœurs 💛 à une carte commune jusqu'à atteindre son prix.
 * Les Cœurs donnés sont dépensés (comme pour l'avatar) mais le total cumulé
 * (coeursTotal, statistiques/badges) n'est jamais réduit. */
function cartesSurprises() {
  return Array.isArray(etat.cartesSurprises) ? etat.cartesSurprises : [];
}
function trouverCarteSurprise(id) {
  return cartesSurprises().find(c => c.id === id) || null;
}

// Un enfant donne des Cœurs 💛 à une carte surprise commune.
function donnerCarte(carteId, montant) {
  const enf = enfantActif();
  const carte = trouverCarteSurprise(carteId);
  if (!carte || carte.debloquee) return;
  montant = Math.max(1, parseInt(montant, 10) || 1);
  if (enf.coeurs < montant) { toast(t("toast.pas_assez_coeurs"), "info"); return; }
  // On ne donne jamais plus que ce qui reste à récolter.
  montant = Math.min(montant, carte.cout - carte.recolte);
  if (montant <= 0) return;
  enf.coeurs -= montant;
  carte.recolte += montant;
  carte.dons[enf.id] = (carte.dons[enf.id] || 0) + montant;
  if (carte.recolte >= carte.cout) {
    carte.recolte = carte.cout;
    carte.debloquee = true;
    carte.debloqueeLe = aujourdHui();
    toast(t("toast.carte_debloquee", { emoji: carte.emoji, titre: trData("carte", carte.id, carte.titre) }), "succes");
    confettis();
  } else {
    toast(t("toast.carte_don", { montant, emoji: "💛" }), "succes");
  }
  sauver();
  rendre();
}

/* ---------- Cartes surprises : gestion par les parents ---------- */
function ajouterCarteSurprise(emoji, titre, activite, cout, revele) {
  titre = (titre || "").trim();
  if (!titre) { toast(t("toast.nom_requis"), "info"); return; }
  if (!Array.isArray(etat.cartesSurprises)) etat.cartesSurprises = [];
  etat.cartesSurprises.push({
    id: "cs_" + Date.now().toString(36) + Math.floor(Math.random() * 1000),
    emoji: (emoji || "").trim() || "🎁",
    titre, activite: (activite || "").trim(),
    cout: Math.max(1, parseInt(cout, 10) || 10),
    revele: !!revele,
    recolte: 0, dons: {}, debloquee: false, debloqueeLe: null, faite: false, faiteLe: null
  });
  sauver();
  toast(t("toast.carte_ajoutee"), "succes");
  rendre();
}
function modifierCarteSurprise(id, champ, valeur) {
  const c = trouverCarteSurprise(id);
  if (!c) return;
  if (champ === "cout") c.cout = Math.max(1, parseInt(valeur, 10) || 1);
  else if (champ === "revele") c.revele = !!valeur;
  else c[champ] = valeur;
  sauver();
  rendre();
}
function supprimerCarteSurprise(id) {
  if (!Array.isArray(etat.cartesSurprises)) return;
  etat.cartesSurprises = etat.cartesSurprises.filter(c => c.id !== id);
  sauver();
  rendre();
}
// Réinitialise la récolte d'une carte (pour la rejouer en équipe).
function reinitCarteSurprise(id) {
  const c = trouverCarteSurprise(id);
  if (!c) return;
  c.recolte = 0; c.dons = {}; c.debloquee = false; c.debloqueeLe = null; c.faite = false; c.faiteLe = null;
  sauver();
  rendre();
}
// Marque l'activité d'une carte débloquée comme réalisée en famille.
function marquerCarteFaite(id) {
  const c = trouverCarteSurprise(id);
  if (!c || !c.debloquee) return;
  c.faite = true; c.faiteLe = aujourdHui();
  sauver();
  rendre();
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
// Retrouve une espèce (et son tier) par son id, où qu'elle soit.
function spInfo(id) {
  for (const t of TIERS_ECO) {
    const sp = t.especes.find(s => s.id === id);
    if (sp) return { tier: t, sp };
  }
  return null;
}
// Combien d'exemplaires d'une espèce précise l'enfant possède-t-il ?
function nbEspece(enf, id) {
  const info = spInfo(id);
  if (!info) return 0;
  return (enf.ecosysteme[info.tier.id] || {})[id] || 0;
}
// Prérequis d'une espèce encore manquants : [{ info, requis, possede }].
function prereqManquants(enf, sp) {
  const p = sp.prereq || {};
  return Object.keys(p)
    .map(id => ({ info: spInfo(id), requis: p[id], possede: nbEspece(enf, id) }))
    .filter(x => x.possede < x.requis);
}
// L'espèce est-elle débloquée (tous ses prérequis satisfaits) ?
function especeDebloquee(enf, sp) {
  return prereqManquants(enf, sp).length === 0;
}

// Créer un être vivant : vérifie les prérequis, dépense des Gouttes, l'ajoute.
function creerEspece(tier, espece) {
  const enf = enfantActif();
  const manquants = prereqManquants(enf, espece);
  if (manquants.length) {
    const liste = manquants.map(m => {
      const n = m.info ? trData("espece", m.info.sp.id, m.info.sp.nom).toLowerCase() : "?";
      const e = m.info ? m.info.sp.emoji : "";
      return `${m.requis - m.possede} ${n} ${e}`;
    }).join(", ");
    toast(t("toast.manque_prereq", { emoji: espece.emoji, nom: trData("espece", espece.id, espece.nom), liste }), "info");
    return;
  }
  if (enf.gouttes < espece.cout) {
    toast(t("toast.pas_assez_gouttes"), "info");
    return;
  }
  enf.gouttes -= espece.cout;
  const coll = enf.ecosysteme[tier.id];
  coll[espece.id] = (coll[espece.id] || 0) + 1;
  toast(t("toast.nouvel_etre", { emoji: espece.emoji, nom: trData("espece", espece.id, espece.nom) }), "succes");
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
      const nomTr = trData("badge", id, nom);
      enf.badges.push({ id, nom, emoji });
      if (typeof animationBadge === "function") animationBadge(emoji, nomTr);
      else toast(t("toast.nouveau_badge", { emoji, nom: nomTr }), "succes");
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
  const idx = Math.floor(Math.random() * ENCOURAGEMENTS.length);
  toast(t("toast.gain", { emoji: cat.monnaieEmoji, points: mission.points, monnaie: t("cat." + mission.cat + ".monnaie"), phrase: trData("encour", idx, ENCOURAGEMENTS[idx]) }), "succes");
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
  if (!code) { modeParents = true; rendre(); return; }
  demanderPin({
    titre: "🔒 Code PIN parent",
    onOk: (saisi) => {
      if (saisi.trim() !== code) { toast("Code PIN incorrect 🔒", "info"); return; }
      modeParents = true;
      rendre();
    }
  });
}
function quitterModeParents() { modeParents = false; rendre(); }

function definirCodeParent() {
  const actuel = etat.reglages.codeParent;
  demanderPin({
    titre: actuel ? "🔑 Nouveau code PIN" : "🔑 Choisir un code PIN parent",
    sousTitre: actuel ? "Laissez vide pour supprimer le code." : "Par exemple 4 chiffres.",
    permettreVide: true,
    onOk: (v) => {
      etat.reglages.codeParent = (v || "").trim();
      sauver();
      toast(etat.reglages.codeParent ? "Code PIN enregistré 🔒" : "Code PIN supprimé", "succes");
      rendre();
    }
  });
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

/* ---------- Gestion des enfants ---------- */
// Crée un objet enfant vierge (mêmes champs que dans etatVierge).
function enfantVierge(modele) {
  const base = modele || { id: "", prenom: "Nouvel enfant", naissance: "2020-01-01",
                           sexe: "garcon", emoji: "🧒", couleur: "#5b8def" };
  return {
    ...base,
    coeurs: 0, coeursTotal: 0, gouttes: 0, gouttesTotal: 0,
    ecosysteme: { plantes: {}, herbivores: {}, carnivores: {} },
    avatar: avatarParDefaut(base), debloque: [], heureCoucher: "19:30",
    journal: {}, planJour: {}, enAttente: [], badges: [], badgesRetires: []
  };
}
// Ajoute un enfant à la famille et l'active.
function ajouterEnfant() {
  const id = "e" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  const couleurs = ["#5b8def", "#39c0a0", "#f6a623", "#e26d9b", "#9b6ef3", "#e2566d"];
  const n = Object.keys(etat.enfants).length;
  const enf = enfantVierge({ id, prenom: "Nouvel enfant", naissance: "2020-01-01",
                             sexe: "garcon", emoji: "🧒", couleur: couleurs[n % couleurs.length] });
  appliquerSexe(enf);
  etat.enfants[id] = enf;
  etat.enfantActif = id;
  sauver();
  return id;
}
// Supprime un enfant (toutes ses données). Refuse de supprimer le dernier.
function supprimerEnfant(id) {
  const ids = Object.keys(etat.enfants);
  if (ids.length <= 1) { toast("Il faut au moins un enfant.", "info"); return; }
  const enf = etat.enfants[id];
  if (!enf) return;
  if (!confirm(`Supprimer définitivement ${enf.prenom} et toutes ses données (cœurs, gouttes, avatar, écosystème, badges) ? Cette action est irréversible.`)) return;
  delete etat.enfants[id];
  if (etat.enfantActif === id) etat.enfantActif = Object.keys(etat.enfants)[0];
  sauver();
  rendre();
}
// Ajuste le nombre d'enfants d'une famille VIERGE (à la création uniquement).
// Ne supprime jamais un enfant qui possède déjà des données.
function ajusterNombreEnfantsCreation(n) {
  n = Math.max(1, Math.min(12, n | 0));
  let ids = Object.keys(etat.enfants);
  // Retirer les enfants en trop (uniquement s'ils sont vierges).
  while (ids.length > n) {
    const id = ids[ids.length - 1];
    const enf = etat.enfants[id];
    if ((enf.coeursTotal || 0) > 0 || (enf.gouttesTotal || 0) > 0) break;
    delete etat.enfants[id];
    ids = Object.keys(etat.enfants);
  }
  // Ajouter les enfants manquants.
  while (ids.length < n) {
    const id = "e" + Date.now().toString(36) + ids.length + Math.floor(Math.random() * 1000);
    const couleurs = ["#5b8def", "#39c0a0", "#f6a623", "#e26d9b", "#9b6ef3", "#e2566d"];
    etat.enfants[id] = enfantVierge({ id, prenom: "Enfant " + (ids.length + 1),
      naissance: "2020-01-01", sexe: "garcon", emoji: "🧒", couleur: couleurs[ids.length % couleurs.length] });
    ids = Object.keys(etat.enfants);
  }
  etat.enfantActif = Object.keys(etat.enfants)[0];
  sauver();
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
  if (confirm(t("donnees.confirm_reset"))) {
    lierEtat(etatVierge());
    sauver();
    rendre();
  }
}
function exporter() {
  const blob = new Blob([JSON.stringify(etat, null, 2)], { type: "application/json" });
  const a = el("a");
  a.href = URL.createObjectURL(blob);
  a.download = "famiteam-sauvegarde.json";
  a.click();
}

/* ---------- Récupération de données (sauvegardes locales) ----------
 * Liste toutes les sauvegardes présentes dans le cache du navigateur,
 * tous comptes/familles confondus, pour pouvoir en restaurer une. */
function listerSauvegardesLocales() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const cle = localStorage.key(i);
    if (!cle || cle.indexOf(STORAGE_KEY) !== 0) continue;
    try {
      const data = JSON.parse(localStorage.getItem(cle));
      if (!data || !data.enfants) continue;
      const enfants = Object.values(data.enfants);
      out.push({
        cle,
        familleId: cle.slice(STORAGE_KEY.length + 1),
        prenoms: enfants.map(e => e.prenom),
        nb: enfants.length,
        maj: data.maj || 0,
        brut: localStorage.getItem(cle)
      });
    } catch {}
  }
  return out.sort((a, b) => b.maj - a.maj);
}
// Restaure un état (chaîne JSON) DANS la famille actuellement ouverte.
function restaurerSauvegarde(brutJson) {
  let data;
  try { data = JSON.parse(brutJson); } catch { toast("Sauvegarde illisible.", "info"); return false; }
  if (!data || !data.enfants || !Object.keys(data.enfants).length) {
    toast("Cette sauvegarde ne contient aucun enfant.", "info"); return false;
  }
  lierEtat(normaliser(data));     // lie ces données à la famille actuellement ouverte
  etat.maj = Date.now();          // force la priorité sur la version distante
  vueAccueilAine();
  sauver();                       // écrit dans le cache ET dans le cloud de la famille actuelle
  rendre();
  toast(t("toast.sauv_restauree"), "succes");
  return true;
}
// Importe une sauvegarde depuis un fichier JSON.
function importerSauvegardeFichier(file) {
  const r = new FileReader();
  r.onload = () => restaurerSauvegarde(r.result);
  r.readAsText(file);
}

/* Le démarrage (authentification, choix de famille, chargement des données)
 * est orchestré dans js/auth.js. */
