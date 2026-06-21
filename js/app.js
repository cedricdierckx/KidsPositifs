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
  chargerJournalActions();   // journal d'annulation propre à la famille active
  chargerTimer();            // état du minuteur de temps d'écran (par famille)
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

/* ---------- Journal des actions récentes (annulation) ----------
 * Garde une trace locale (non synchronisée) des dernières actions parentales
 * importantes, avec une copie de l'état AVANT l'action pour pouvoir l'annuler.
 * Volontairement local à l'appareil : annuler une action est une correction
 * immédiate, pas une donnée à partager entre appareils. */
const JOURNAL_MAX = 20;
let journalActions = [];
function cleJournal() { return STORAGE_KEY + ":journal:" + (familleId || "_local"); }
function chargerJournalActions() {
  try {
    const brut = localStorage.getItem(cleJournal());
    journalActions = brut ? JSON.parse(brut) : [];
  } catch { journalActions = []; }
  if (!Array.isArray(journalActions)) journalActions = [];
}
function ecrireJournalActions() {
  try { localStorage.setItem(cleJournal(), JSON.stringify(journalActions)); } catch {}
}
// À appeler AVANT une mutation : mémorise l'état actuel + un libellé lisible.
function enregistrerAction(libelle, enfantNom) {
  let avant;
  try { avant = JSON.parse(JSON.stringify(etat)); } catch { return; }
  journalActions.unshift({
    id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    ts: Date.now(),
    libelle: libelle || "Action",
    enfant: enfantNom || "",
    avant
  });
  if (journalActions.length > JOURNAL_MAX) journalActions.length = JOURNAL_MAX;
  ecrireJournalActions();
}
// Restaure l'état mémorisé par une entrée du journal (annulation).
function annulerAction(id) {
  const i = journalActions.findIndex(a => a.id === id);
  if (i < 0) return;
  const entree = journalActions[i];
  if (!entree.avant) return;
  // Remplace le contenu d'etat sur place (la référence est partagée ailleurs).
  Object.keys(etat).forEach(k => delete etat[k]);
  Object.assign(etat, entree.avant);
  // L'entrée annulée et toutes les suivantes (plus récentes) ne sont plus valides.
  journalActions.splice(0, i + 1);
  ecrireJournalActions();
  sauver();
  rendre();
}

/* ---------- Minuteur de temps d'écran (verrouillage PIN) ----------
 * Au bout de la durée choisie, l'application se verrouille et ne se rouvre
 * qu'avec le code PIN parental. État local (par appareil) et persistant : un
 * simple rechargement de page ne contourne pas le verrou.
 *   réglages (synchronisés) : reglages.timerDuree (min) et reglages.timerMode
 *   ("parEnfant" = repart à zéro à chaque changement d'enfant, ou "global"). */
// restes : budget restant (ms) PAR enfant en mode « par enfant » (persistant).
// choix : en attente du choix de l'enfant qui continue (un enfant a épuisé son
// temps mais d'autres en ont encore).
// prep : horodatage de fin du petit décompte « prépare-toi » (5 s) qui précède
// la reprise du minuteur après un changement d'enfant. Pendant cette phase le
// temps de l'enfant n'est PAS décompté.
const PREP_MS = 5000;
let timerEtat = { actif: false, fin: 0, total: 0, enfant: null, restes: {}, prep: 0, choix: false, verrouille: false };
let timerInterval = null;
function cleTimer() { return STORAGE_KEY + ":timer:" + (familleId || "_local"); }
function timerVierge() { return { actif: false, fin: 0, total: 0, enfant: null, restes: {}, prep: 0, choix: false, verrouille: false }; }
function chargerTimer() {
  try {
    const b = localStorage.getItem(cleTimer());
    timerEtat = b ? JSON.parse(b) : timerVierge();
  } catch { timerEtat = timerVierge(); }
  if (!timerEtat || typeof timerEtat !== "object") timerEtat = timerVierge();
  if (!timerEtat.restes || typeof timerEtat.restes !== "object") timerEtat.restes = {};
  if (typeof timerEtat.prep !== "number") timerEtat.prep = 0;
  // Le minuteur a expiré pendant l'absence (onglet fermé).
  if (timerEtat.actif && timerEtat.fin && Date.now() >= timerEtat.fin) {
    finDeTempsEnfant();   // gère verrouillage OU proposition de continuer
  }
}
function ecrireTimer() { try { localStorage.setItem(cleTimer(), JSON.stringify(timerEtat)); } catch {} }

function timerDureeMin() {
  const m = etat.reglages && etat.reglages.timerDuree;
  return (typeof m === "number" && m > 0) ? m : 3;
}
function timerMode() {
  return (etat.reglages && etat.reglages.timerMode === "global") ? "global" : "parEnfant";
}
function definirReglageTimer(duree, mode) {
  if (!etat.reglages) etat.reglages = {};
  const d = Math.max(1, Math.min(120, parseInt(duree, 10) || 3));
  etat.reglages.timerDuree = d;
  etat.reglages.timerMode = (mode === "global") ? "global" : "parEnfant";
  sauver();
}

function demarrerTimer() {
  const ms = timerDureeMin() * 60000;
  const enf = enfantActif();
  const id = enf ? enf.id : null;
  const restes = {};
  if (timerMode() === "parEnfant" && id) restes[id] = ms;   // budget initial de l'enfant actif
  timerEtat = { actif: true, fin: Date.now() + ms, total: ms, enfant: id, restes, choix: false, verrouille: false };
  ecrireTimer();
  lancerTickTimer();
  if (typeof toast === "function") toast(t("timer.lance"), "info");
  rendre();
}
function arreterTimer() {
  timerEtat = timerVierge();
  stopTickTimer();
  ecrireTimer();
  if (typeof masquerVerrou === "function") masquerVerrou();
  rendre();
}
function lancerTickTimer() {
  stopTickTimer();
  timerInterval = setInterval(tickTimer, 500);
  tickTimer();
}
function stopTickTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
function tickTimer() {
  if (!timerEtat.actif) { stopTickTimer(); return; }
  // Phase « prépare-toi » : décompte de 5 s avant de (re)lancer le minuteur.
  if (timerEtat.prep) {
    const restePrep = timerEtat.prep - Date.now();
    if (restePrep > 0) {
      if (typeof majAffichagePrep === "function") majAffichagePrep(restePrep);
      if (typeof majBoutonTimer === "function") majBoutonTimer();
      return;
    }
    timerEtat.prep = 0;
    timerEtat.fin = Date.now() + tempsRestantEnfant(timerEtat.enfant);
    ecrireTimer();
    if (typeof masquerPrep === "function") masquerPrep();
  }
  const reste = timerEtat.fin - Date.now();
  if (reste <= 0) {
    finDeTempsEnfant();
    return;
  }
  if (typeof majAffichageTimer === "function") majAffichageTimer(reste, timerEtat.total);
}

// Temps écoulé pour l'enfant courant (ou minuteur global).
// - mode global : verrouillage direct.
// - mode par enfant : si d'autres enfants ont encore du temps, on propose de
//   choisir lequel continue ; sinon on verrouille.
function finDeTempsEnfant() {
  stopTickTimer();
  timerEtat.actif = false;
  if (timerMode() === "parEnfant") {
    if (timerEtat.enfant) timerEtat.restes[timerEtat.enfant] = 0;   // budget épuisé
    if (restesDisponibles().length > 0) {
      timerEtat.choix = true;
      ecrireTimer();
      if (typeof afficherChoixEnfant === "function") afficherChoixEnfant();
      return;
    }
  }
  ecrireTimer();
  verrouillerApp();
}

// Liste des enfants (objets) ayant encore du temps disponible (mode par enfant).
// Les enfants jamais utilisés disposent de leur budget plein par défaut.
function restesDisponibles() {
  return Object.values(etat.enfants).filter(enf => tempsRestantEnfant(enf.id) > 0);
}
// Temps restant (ms) d'un enfant : valeur mémorisée, ou budget plein si jamais utilisé.
function tempsRestantEnfant(id) {
  if (timerEtat.restes && Object.prototype.hasOwnProperty.call(timerEtat.restes, id)) {
    return Math.max(0, timerEtat.restes[id]);
  }
  return timerEtat.total || (timerDureeMin() * 60000);
}

// Remet du temps à un enfant (ms) : ajoute à son budget restant. Si c'est
// l'enfant actif en cours de décompte, on prolonge directement la fin.
function ajouterTempsEnfant(id, ms) {
  if (!id || !ms) return;
  if (!timerEtat.restes) timerEtat.restes = {};
  const actifEnCours = timerEtat.actif && timerEtat.enfant === id && !timerEtat.prep;
  const courant = actifEnCours ? Math.max(0, timerEtat.fin - Date.now()) : tempsRestantEnfant(id);
  timerEtat.restes[id] = courant + ms;
  if (actifEnCours) timerEtat.fin = Date.now() + timerEtat.restes[id];
  ecrireTimer();
  rendre();
}
// Remet du temps au minuteur global (ms).
function ajouterTempsGlobal(ms) {
  if (!ms || !timerEtat.actif) return;
  timerEtat.fin += ms;
  ecrireTimer();
  rendre();
}

// L'utilisateur choisit l'enfant qui continue : on bascule dessus et on reprend
// son budget restant.
function continuerAvecEnfant(id) {
  if (!id || tempsRestantEnfant(id) <= 0) return;
  etat.enfantActif = id;
  timerEtat.restes[id] = tempsRestantEnfant(id);   // fige le budget repris
  timerEtat.enfant = id;
  timerEtat.choix = false;
  timerEtat.actif = true;
  timerEtat.prep = Date.now() + PREP_MS;            // 5 s pour se préparer
  timerEtat.fin = 0;
  ecrireTimer();
  if (typeof masquerChoixEnfant === "function") masquerChoixEnfant();
  ecrireCache();
  lancerTickTimer();
  rendre();
}

// Mode « par enfant » : budgets PERSISTANTS. Quand on change d'enfant actif,
// on mémorise le temps restant de l'enfant qui sort, et on reprend (sans
// réinitialiser) le temps restant de l'enfant qui entre.
function timerSurChangementEnfant() {
  if (!timerEtat.actif || timerEtat.choix || timerMode() !== "parEnfant") return;
  const enf = enfantActif();
  const id = enf ? enf.id : null;
  if (id && id !== timerEtat.enfant) {
    // Sauvegarde du temps restant de l'enfant précédent (sauf en pleine phase
    // « prépare-toi », où son temps n'avait pas encore repris).
    if (timerEtat.enfant && !timerEtat.prep) {
      timerEtat.restes[timerEtat.enfant] = Math.max(0, timerEtat.fin - Date.now());
    }
    // Le nouvel enfant a 5 s pour se préparer avant que son temps ne reprenne.
    timerEtat.restes[id] = tempsRestantEnfant(id);
    timerEtat.enfant = id;
    timerEtat.prep = Date.now() + PREP_MS;
    timerEtat.fin = 0;
    ecrireTimer();
  }
}
function verrouillerApp() {
  timerEtat.verrouille = true;
  timerEtat.choix = false;
  ecrireTimer();
  modeParents = false;
  if (typeof afficherVerrou === "function") afficherVerrou();
}
function deverrouillerApp() {
  timerEtat = timerVierge();
  stopTickTimer();
  ecrireTimer();
  if (typeof masquerVerrou === "function") masquerVerrou();
  if (typeof masquerChoixEnfant === "function") masquerChoixEnfant();
  rendre();
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
      donsTotal: 0,         // Cœurs donnés au collectif (cartes surprises), cumulé
      avatarTotal: 0,       // Cœurs dépensés en individuel (avatar), cumulé
      ecosysteme: { plantes: {}, herbivores: {}, carnivores: {} }, // tier -> {especeId: nb}
      avatar: avatarParDefaut(e),
      debloque: [],         // ids d'options d'avatar débloquées
      heureCoucher: "19:30",// heure de coucher (réglable par les parents)
      journal: {},          // { "2026-06-14": { missionId: count } }
      planJour: {},         // { "2026-06-14": [missionId,...] } missions imposées du jour
      enAttente: [],        // actions en attente de validation parentale
      badges: [],           // récompenses symboliques
      badgesRetires: [],    // badges retirés par les parents (non re-attribués)
      autoEval: {},         // auto-évaluation de l'enfant : { "2026-06-17": "bien"|"moyen"|"mauvais" }
      evalParent: {},       // évaluation par un parent (facultative)
      reparations: {}       // défis réparation actifs : { defiId: timestamp } (toggle 1 h)
    };
  });
  return {
    enfants, enfantActif: ENFANTS_DEFAUT[0].id, vue: "accueil", maj: 0,
    version: ETAT_VERSION,
    missionsPerso: [],     // missions personnalisées ajoutées par les parents
    missionsModif: {},     // retouches parentales des missions (titre/emoji/points)
    missionsPlanif: {},    // planification des missions (jours/dates/enfants)
    rotations: [],         // tournantes de tâches entre enfants
    cartesSurprises: cartesSurprisesNeuves(ENFANTS_DEFAUT.length),  // objectifs d'équipe
    reglages: { validationParentale: false, codeParent: "", seuilVisuel: 5, humour: true }
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
    // Suivi des dépenses (additif). L'avatar est rétro-calculé depuis les
    // options déjà débloquées ; les dons collectifs démarrent à 0 (non rétro-actif).
    if (typeof enf.avatarTotal !== "number") enf.avatarTotal = coutAvatarDebloque(enf);
    if (typeof enf.donsTotal !== "number") enf.donsTotal = 0;
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
    if (!enf.autoEval || typeof enf.autoEval !== "object") enf.autoEval = {};
    if (!enf.evalParent || typeof enf.evalParent !== "object") enf.evalParent = {};
    if (!enf.reparations || typeof enf.reparations !== "object") enf.reparations = {};
    if (!Array.isArray(enf.badgesRetires)) enf.badgesRetires = [];
    if (!Array.isArray(enf.badges)) enf.badges = [];
    if (!enf.planJour || typeof enf.planJour !== "object") enf.planJour = {};
    if (!/^\d{1,2}:\d{2}$/.test(enf.heureCoucher || "")) enf.heureCoucher = "19:30";
  });
  if (e.maj === undefined) e.maj = 0;
  if (!Array.isArray(e.missionsPerso)) e.missionsPerso = [];
  if (!e.missionsModif || typeof e.missionsModif !== "object") e.missionsModif = {};
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
  if (!e.reglages) e.reglages = { validationParentale: false, codeParent: "", seuilVisuel: 5, humour: true };
  if (typeof e.reglages.seuilVisuel !== "number") e.reglages.seuilVisuel = 5;
  if (typeof e.reglages.humour !== "boolean") e.reglages.humour = true;   // humour ON par défaut
  if (!e.missionsPlanif || typeof e.missionsPlanif !== "object") e.missionsPlanif = {};
  if (!Array.isArray(e.rotations)) e.rotations = [];
  // Estampille de version : les migrations ci-dessus sont *additives* (on ne
  // supprime jamais de données existantes), garantissant qu'une mise à jour de
  // l'application ne fait jamais perdre la progression d'une famille.
  e.version = ETAT_VERSION;
  return e;
}

/* ---------- Utilitaires ---------- */
// Clé de jour AAAA-MM-JJ en heure LOCALE (et non UTC) : indispensable pour que
// « aujourd'hui » corresponde au calendrier mural de la famille. Utiliser
// toISOString() (UTC) décalait les clés d'un jour en soirée (fuseaux UTC+).
function dateCle(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}
function aujourdHui() {
  return dateCle(new Date());
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
// "Jeune" = âge ≤ seuil réglé par les parents (défaut 5 ans) : affichage imagé,
// sans chiffres (compteurs, prérequis de l'écosystème…).
function seuilVisuel() {
  return (etat.reglages && typeof etat.reglages.seuilVisuel === "number") ? etat.reglages.seuilVisuel : 5;
}
function estJeune(enfant) { return age(enfant) <= seuilVisuel(); }
function enfantActif() { return etat.enfants[etat.enfantActif]; }
// Id de l'enfant aîné (date de naissance la plus ancienne).
function idAine() {
  const liste = Object.values(etat.enfants);
  if (!liste.length) return null;
  return liste.slice().sort((a, b) => (a.naissance || "").localeCompare(b.naissance || ""))[0].id;
}
// Réinitialise l'affichage : accueil de l'enfant aîné, hors mode parents.
function vueAccueilAine() {
  // Si un minuteur « par enfant » tourne, on reste sur l'enfant en cours
  // (sinon un rechargement le ferait repartir à zéro en basculant sur l'aîné).
  if (timerEtat && timerEtat.actif && timerMode() === "parEnfant" && timerEtat.enfant && etat.enfants[timerEtat.enfant]) {
    etat.enfantActif = timerEtat.enfant;
  } else {
    const aine = idAine();
    if (aine) etat.enfantActif = aine;
  }
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
  const pts = pointsMission(enf, mission);
  enf.journal[jour] = enf.journal[jour] || {};
  enf.journal[jour][mission.id] = (enf.journal[jour][mission.id] || 0) + 1;
  if (mission.cat === "famille") {
    enf.coeurs += pts;
    enf.coeursTotal += pts;
  } else {
    enf.gouttes += pts;
    enf.gouttesTotal += pts;
  }
  verifierBadges(enf);
}

// Retire le crédit d'une mission un jour donné (correction d'erreur).
function decrediterMission(enf, mission, jour) {
  const j = enf.journal[jour];
  if (!j || !j[mission.id]) return;
  if (j[mission.id] <= 1) delete j[mission.id]; else j[mission.id] -= 1;
  if (Object.keys(j).length === 0) delete enf.journal[jour];
  const pts = pointsMission(enf, mission);
  const champ = mission.cat === "famille" ? "coeurs" : "gouttes";
  const total = mission.cat === "famille" ? "coeursTotal" : "gouttesTotal";
  enf[champ] = Math.max(0, enf[champ] - pts);
  enf[total] = Math.max(0, enf[total] - pts);
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
    enregistrerAction(`Mission retirée : ${titreMission(mission)}`, enf.prenom);
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
  enregistrerAction(`Mission validée : ${titreMission(mission)}`, enf.prenom);
  crediterMission(enf, mission, jour);
  feterGain(mission);
  sauver();
  rendre();
}

/* ---------- Missions (catalogue + missions personnalisées) ----------
 * Les parents peuvent ajouter des missions propres à la famille.
 * Elles sont stockées dans etat.missionsPerso (synchronisées). */
function toutesMissions() {
  const base = (etat && Array.isArray(etat.missionsPerso)) ? MISSIONS.concat(etat.missionsPerso) : MISSIONS.slice();
  const mods = (etat && etat.missionsModif) ? etat.missionsModif : null;
  if (!mods) return base;
  // Applique les retouches parentales (titre/emoji/points) sans modifier MISSIONS.
  return base.map(m => mods[m.id] ? Object.assign({}, m, mods[m.id]) : m);
}
function trouverMission(id) {
  return toutesMissions().find(m => m.id === id) || null;
}
// Titre affiché d'une mission : une retouche parentale (ou un titre perso)
// prime sur la traduction intégrée.
function titreMission(m) {
  const mod = etat && etat.missionsModif && etat.missionsModif[m.id];
  if (m.perso || (mod && mod.titre)) return m.titre;
  return trData("mission", m.id, m.titre);
}
/* ---------- Personnalisation PAR ENFANT (missions & espèces) ----------
 * enf.persoMissions[id] = { actif:bool, points:int }   (override par enfant)
 * enf.persoEspeces[id]  = { actif:bool, cout:int }
 * Champ absent = on retombe sur la valeur globale. */
function persoMission(enf, id) {
  return (enf && enf.persoMissions && enf.persoMissions[id]) || null;
}
// Points d'une mission pour un enfant donné (override éventuel, sinon global).
function pointsMission(enf, m) {
  const p = persoMission(enf, m.id);
  if (p && typeof p.points === "number" && p.points > 0) return p.points;
  return m.points;
}
// Une mission est-elle activée pour cet enfant ? (désactivable par enfant)
function missionActivePourEnfant(enf, id) {
  const p = persoMission(enf, id);
  return !(p && p.actif === false);
}
function definirPersoMission(enf, id, champ, valeur) {
  if (!enf) return;
  if (!enf.persoMissions) enf.persoMissions = {};
  const o = enf.persoMissions[id] || (enf.persoMissions[id] = {});
  o[champ] = valeur;
  // Nettoyage : si l'entrée ne porte plus aucune dérogation, on la retire.
  if ((o.actif === undefined || o.actif === true) && (o.points === undefined || o.points === null))
    delete enf.persoMissions[id];
  sauver();
  rendre();
}
// Coût d'une espèce pour un enfant (override éventuel).
function coutEspece(enf, sp) {
  const p = enf && enf.persoEspeces && enf.persoEspeces[sp.id];
  if (p && typeof p.cout === "number" && p.cout > 0) return p.cout;
  return sp.cout;
}
function especeActivePourEnfant(enf, id) {
  const p = enf && enf.persoEspeces && enf.persoEspeces[id];
  return !(p && p.actif === false);
}
function definirPersoEspece(enf, id, champ, valeur) {
  if (!enf) return;
  if (!enf.persoEspeces) enf.persoEspeces = {};
  const o = enf.persoEspeces[id] || (enf.persoEspeces[id] = {});
  o[champ] = valeur;
  if ((o.actif === undefined || o.actif === true) && (o.cout === undefined || o.cout === null))
    delete enf.persoEspeces[id];
  sauver();
  rendre();
}

// Modifie une mission (préexistante OU personnalisée) : titre, emoji ou points.
// Pour les missions personnalisées on édite l'objet directement ; pour les
// missions intégrées on enregistre une retouche dans etat.missionsModif.
function modifierMission(id, champ, valeur) {
  const perso = Array.isArray(etat.missionsPerso) ? etat.missionsPerso.find(m => m.id === id) : null;
  const normVal = (champ === "points")
    ? Math.max(1, parseInt(valeur, 10) || 1)
    : (valeur || "").trim();
  if (perso) {
    if (champ === "points") perso.points = normVal;
    else if (normVal) perso[champ] = normVal;   // titre/emoji non vides
  } else {
    if (!etat.missionsModif) etat.missionsModif = {};
    const o = etat.missionsModif[id] || (etat.missionsModif[id] = {});
    if (champ === "points") o.points = normVal;
    else if (normVal) o[champ] = normVal;
    else delete o[champ];
    if (!Object.keys(o).length) delete etat.missionsModif[id];
  }
  sauver();
  rendre();
}
// Restaure une mission intégrée dans son état d'origine (efface les retouches).
function reinitMission(id) {
  if (etat.missionsModif && etat.missionsModif[id]) {
    delete etat.missionsModif[id];
    sauver();
    rendre();
  }
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
// Sélection par défaut = TOUTES les missions adaptées à l'âge de l'enfant
// (cochées à la création ; les parents peuvent ensuite modifier librement).
/* ---------- Tableau de bord « science » (paramètres ajustables) ----------
 * Fusionne les défauts (data.js) avec l'override admin stocké dans app_config
 * (clé "science"). Source unique pour les réglages fondés sur la recherche. */
function scienceConf() {
  let over = {};
  try {
    if (typeof configApp !== "undefined" && configApp && configApp.science) {
      over = typeof configApp.science === "string" ? JSON.parse(configApp.science) : configApp.science;
    }
  } catch (e) { over = {}; }
  return Object.assign({}, SCIENCE_DEFAUT, over);
}
function budgetMinJour() { return scienceConf().budgetMinJour || 3; }
function pointsMaxConseille() { return scienceConf().pointsMax || 5; }
// Âge minimal conseillé d'une mission (override science prioritaire).
function ageMinMission(m) {
  const ov = scienceConf().ageMission || {};
  return (typeof ov[m.id] === "number") ? ov[m.id] : m.ageMin;
}

function missionsDefautCat(enf, catId) {
  return toutesMissions().filter(m => m.cat === catId && age(enf) >= ageMinMission(m));
}
// Nombre de tâches/jour conseillé pour un âge (budget ~3 min/jour).
function tachesConseillees(age) {
  const table = scienceConf().tachesParAge || TACHES_PAR_AGE;
  const r = table.find(x => age <= x.max);
  return r ? r.n : 6;
}
// Répartition du budget entre les deux catégories (≈ 60 % Famille).
function nbConseille(catId, age) {
  const total = tachesConseillees(age);
  const part = scienceConf().partFamille || 0.6;
  const fam = Math.ceil(total * part);
  return catId === "famille" ? fam : Math.max(1, total - fam);
}
// Sélection CONSEILLÉE par défaut : missions adaptées à l'âge, les plus
// prioritaires, limitées au budget de temps (≈ 3 min/jour).
function missionsConseillees(enf, catId) {
  const a = age(enf);
  return missionsDefautCat(enf, catId)
    .slice()
    .sort((m1, m2) => (PRIO_DEFAUT[m1.id] || 9) - (PRIO_DEFAUT[m2.id] || 9))
    .slice(0, nbConseille(catId, a));
}
// Tous les ids proposés par défaut (= sélection conseillée, budget respecté).
function idsDefaut(enf) {
  return [...missionsConseillees(enf, "famille"), ...missionsConseillees(enf, "planete")].map(m => m.id);
}
function missionsActives(enf, catId, jour) {
  const plan = planEffectif(enf, jour);
  const base = plan
    ? toutesMissions().filter(m => m.cat === catId && plan.includes(m.id))
    : missionsConseillees(enf, catId);
  // Filtres : activation par enfant + planification + tournante (c'est son tour ?).
  let liste = base.filter(m => missionActivePourEnfant(enf, m.id)
    && missionPlanifieeActive(m, enf, jour)
    && rotationPermet(enf, m.id, jour));
  // Ajoute les missions de tournante dont c'est le tour de l'enfant (forçage).
  missionsTournanteDuJour(enf, jour).forEach(m => {
    if (m.cat === catId && !liste.some(x => x.id === m.id)) liste.push(m);
  });
  return liste;
}

/* ---------- Tournantes de tâches (à tour de rôle entre enfants) ----------
 * etat.rotations[] = { id, missions:[ids], enfants:[ids ordonnés],
 *                      periode:"semaine"|"jour", debut:"AAAA-MM-JJ",
 *                      joursOff:[0..6] (jours sans tâche, 0=dim … 6=sam) } */
function enfantDeGardeRotation(rot, jour) {
  const ids = rot.enfants || [];
  if (!ids.length) return null;
  const base = new Date((rot.debut || aujourdHui()) + "T00:00:00");
  const d = new Date(jour + "T00:00:00");
  const div = rot.periode === "jour" ? 86400000 : 7 * 86400000;
  let periodes = Math.floor((d - base) / div);
  if (!isFinite(periodes) || periodes < 0) periodes = 0;
  return ids[((periodes % ids.length) + ids.length) % ids.length];
}
// Jour « off » d'une tournante (aucune tâche ce jour-là pour personne).
function jourOffRotation(rot, jour) {
  if (!Array.isArray(rot.joursOff) || !rot.joursOff.length) return false;
  return rot.joursOff.includes(new Date(jour + "T00:00:00").getDay());
}
function rotationsDe(id) {
  return (etat.rotations || []).filter(r => Array.isArray(r.missions) && r.missions.includes(id));
}
// La tournante autorise-t-elle cette mission pour cet enfant ce jour ?
// (si l'enfant fait partie d'une tournante de cette mission mais que ce n'est
//  pas son tour, ou que c'est un jour off, la mission lui est masquée.)
function rotationPermet(enf, id, jour) {
  const rots = rotationsDe(id).filter(r => (r.enfants || []).includes(enf.id));
  if (!rots.length) return true;
  return rots.some(r => !jourOffRotation(r, jour) && enfantDeGardeRotation(r, jour) === enf.id);
}
// Missions dont c'est le tour de l'enfant aujourd'hui (forcées actives).
function missionsTournanteDuJour(enf, jour) {
  const out = [];
  (etat.rotations || []).forEach(r => {
    if (!(r.enfants || []).includes(enf.id)) return;
    if (jourOffRotation(r, jour)) return;                       // jour off : aucune tâche
    if (enfantDeGardeRotation(r, jour) !== enf.id) return;
    (r.missions || []).forEach(id => {
      const m = trouverMission(id);
      if (m && missionActivePourEnfant(enf, id) && !out.some(x => x.id === id)) out.push(m);
    });
  });
  return out;
}
function ajouterRotation(missions, enfants, periode, debut, joursOff) {
  if (!Array.isArray(missions) || !missions.length) return;
  if (!Array.isArray(enfants) || enfants.length < 1) return;   // 1 enfant ou plus
  if (!Array.isArray(etat.rotations)) etat.rotations = [];
  etat.rotations.push({
    id: "rot-" + Date.now().toString(36),
    missions: missions.slice(),
    enfants: enfants.slice(),
    periode: periode === "jour" ? "jour" : "semaine",
    debut: debut || debutSemaineLundi(aujourdHui()),
    joursOff: Array.isArray(joursOff) ? joursOff.slice() : []
  });
  sauver();
  rendre();
}
function supprimerRotation(id) {
  etat.rotations = (etat.rotations || []).filter(r => r.id !== id);
  sauver();
  rendre();
}
// Lundi de la semaine d'une date (alignement des tournantes hebdomadaires).
function debutSemaineLundi(cle) {
  const d = new Date(cle + "T00:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateCle(d);
}

/* ---------- Planification des missions (jours / dates / enfants) ----------
 * etat.missionsPlanif[id] = { jours:[0..6], du:"AAAA-MM-JJ", au:"AAAA-MM-JJ", enfants:[ids] }
 * Champ vide / tableau vide = aucune restriction sur ce critère.
 * jours : 0=dimanche … 6=samedi (compatible Date.getDay). */
function planifMission(id) {
  return (etat.missionsPlanif && etat.missionsPlanif[id]) || null;
}
function planifVide(p) {
  return !p || ((!p.jours || !p.jours.length) && !p.du && !p.au && (!p.enfants || !p.enfants.length));
}
function definirPlanifMission(id, champ, valeur) {
  if (!etat.missionsPlanif) etat.missionsPlanif = {};
  const p = etat.missionsPlanif[id] || (etat.missionsPlanif[id] = { jours: [], du: "", au: "", enfants: [] });
  p[champ] = valeur;
  if (planifVide(p)) delete etat.missionsPlanif[id];   // pas de règle = on n'encombre pas l'état
  sauver();
  rendre();
}
// Bascule un jour de semaine (0..6) ou un enfant dans la planification.
function basculerPlanifElement(id, champ, valeur) {
  const p = (etat.missionsPlanif && etat.missionsPlanif[id]) || { jours: [], du: "", au: "", enfants: [] };
  const arr = Array.isArray(p[champ]) ? p[champ].slice() : [];
  const i = arr.indexOf(valeur);
  if (i >= 0) arr.splice(i, 1); else arr.push(valeur);
  definirPlanifMission(id, champ, arr);
}
// La mission est-elle active pour cet enfant ce jour-là, au regard de sa planification ?
function missionPlanifieeActive(m, enf, jour) {
  const p = planifMission(m.id);
  if (planifVide(p)) return true;
  if (p.enfants && p.enfants.length && !p.enfants.includes(enf.id)) return false;
  if (p.du && jour < p.du) return false;
  if (p.au && jour > p.au) return false;
  if (p.jours && p.jours.length) {
    const wd = new Date(jour + "T00:00:00").getDay();   // 0=dim … 6=sam
    if (!p.jours.includes(wd)) return false;
  }
  return true;
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

// Définit directement le plan d'un enfant à partir d'un jour (sélection groupée).
function definirPlanComplet(enf, jour, ids) {
  if (!enf.planJour) enf.planJour = {};
  enf.planJour[jour] = (ids || []).slice();
  Object.keys(enf.planJour).forEach(d => { if (d > jour) delete enf.planJour[d]; });
}
// Sélection groupée pour TOUS les enfants à partir d'aujourd'hui.
//  mode : "tous" (toutes les missions) | "recommande" (conseillé par âge) | "aucun".
function selectionGroupee(mode) {
  const jour = aujourdHui();
  const toutesIds = toutesMissions().map(m => m.id);
  Object.values(etat.enfants).forEach(enf => {
    let ids;
    if (mode === "tous") ids = toutesIds.slice();
    else if (mode === "recommande") ids = idsDefaut(enf);
    else ids = [];
    definirPlanComplet(enf, jour, ids);
  });
  sauver();
  rendre();
}

/* ---------- Mode parents : validation des actions en attente ---------- */
function confirmerAttente(enf, idx) {
  const a = enf.enAttente[idx];
  if (!a) return;
  const mission = trouverMission(a.missionId) ||
                  { id: a.missionId, cat: a.cat, points: a.points, titre: a.titre };
  enregistrerAction(`Demande acceptée : ${trData("mission", a.missionId, a.titre)}`, enf.prenom);
  crediterMission(enf, mission, a.jour);
  enf.enAttente.splice(idx, 1);
  toast(t("toast.valide", { emoji: a.emoji || "", titre: trData("mission", a.missionId, a.titre), points: a.points }), "succes");
  confettis();
  sauver();
  rendre();
}
function refuserAttente(enf, idx) {
  const a = enf.enAttente[idx];
  enregistrerAction(`Demande refusée : ${a ? trData("mission", a.missionId, a.titre) : ""}`, enf.prenom);
  enf.enAttente.splice(idx, 1);
  toast("Demande retirée.", "info");
  sauver();
  rendre();
}

// Vrai si un défi réparation est "actif" (crédité il y a moins d'une heure).
const REPARATION_FENETRE = 60 * 60 * 1000; // 1 heure
function reparationActive(enf, defiId) {
  const ts = enf.reparations && enf.reparations[defiId];
  return !!(ts && (Date.now() - ts) < REPARATION_FENETRE);
}
// Toggle comme une mission : 1er clic crédite, 2e clic (dans l'heure) annule.
// Après 1 h, le défi redevient disponible pour gagner de nouveaux points.
function defiReparation(defi) {
  const enf = enfantActif();
  if (!enf.reparations) enf.reparations = {};
  enregistrerAction(`Défi réparation`, enf.prenom);
  if (reparationActive(enf, defi.id)) {
    // Annulation dans l'heure : on retire le bonus.
    enf.coeurs = Math.max(0, enf.coeurs - defi.bonus);
    enf.coeursTotal = Math.max(0, enf.coeursTotal - defi.bonus);
    delete enf.reparations[defi.id];
    toast(t("toast.annule", { points: defi.bonus, emoji: "💛" }), "info");
  } else {
    enf.coeurs += defi.bonus;
    enf.coeursTotal += defi.bonus;
    enf.reparations[defi.id] = Date.now();
    verifierBadges(enf);
    toast(t("toast.repare", { bonus: defi.bonus }), "succes");
  }
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
    enf.avatarTotal = (enf.avatarTotal || 0) + option.cout;   // dépense individuelle
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

// Somme des Cœurs déjà dépensés en avatar (d'après les options débloquées).
function coutAvatarDebloque(enf) {
  let s = 0;
  (enf.debloque || []).forEach(cle => {
    const i = cle.indexOf(":");
    if (i < 0) return;
    const cat = cle.slice(0, i), id = cle.slice(i + 1);
    const opt = (AVATAR_OPTIONS[cat] || []).find(o => o.id === id);
    if (opt) s += opt.cout || 0;
  });
  return s;
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
  enf.donsTotal = (enf.donsTotal || 0) + montant;   // dépense collective
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
  verifierBadges(enf);   // badges d'esprit d'équipe (don / carte aidée)
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
// Déplace une carte dans la liste (sens = -1 monter, +1 descendre).
function deplacerCarteSurprise(id, sens) {
  const arr = etat.cartesSurprises;
  if (!Array.isArray(arr)) return;
  const i = arr.findIndex(c => c.id === id);
  if (i < 0) return;
  const j = i + (sens < 0 ? -1 : 1);
  if (j < 0 || j >= arr.length) return;
  const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
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
  const cout = coutEspece(enf, espece);
  if (enf.gouttes < cout) {
    toast(t("toast.pas_assez_gouttes"), "info");
    return;
  }
  enregistrerAction(`Achat écosystème : ${espece.emoji} ${trData("espece", espece.id, espece.nom)}`, enf.prenom);
  enf.gouttes -= cout;
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
  if (enf.coeursTotal >= 10)  ajoute("coeur10", "Cœur d'or", "💛");
  if (enf.coeursTotal >= 50)  ajoute("coeur50", "Super entraide", "🏅");
  if (enf.coeursTotal >= 100) ajoute("coeur100", "Trésor du cœur", "💖");
  if (enf.gouttesTotal >= 10) ajoute("goutte10", "Petite source", "💧");
  if (enf.gouttesTotal >= 50) ajoute("goutte50", "Grande rivière", "🌊");
  if (nbTier(enf, "plantes") >= 1)    ajoute("eco_p", "Jardinier en herbe", "🌱");
  if (nbTier(enf, "herbivores") >= 1) ajoute("eco_h", "Ami des herbivores", "🐰");
  if (nbTier(enf, "carnivores") >= 1) ajoute("eco_c", "Protecteur des prédateurs", "🦊");
  if (nbTier(enf, "plantes") >= 1 && nbTier(enf, "herbivores") >= 1 && nbTier(enf, "carnivores") >= 1)
    ajoute("eco_chaine", "Chaîne alimentaire complète", "🔗");
  if (nbTotalEspeces(enf) >= 10) ajoute("eco_10", "Petit monde vivant", "🌳");
  if (nbTotalEspeces(enf) >= 25) ajoute("eco_25", "Gardien de la nature", "🏞️");
  // série de jours actifs
  const jours = Object.keys(enf.journal).length;
  if (jours >= 7)  ajoute("semaine", "Une semaine d'efforts", "📅");
  if (jours >= 30) ajoute("mois", "Un mois d'efforts", "🗓️");
  // esprit d'équipe (cartes surprises)
  const cartes = Array.isArray(etat.cartesSurprises) ? etat.cartesSurprises : [];
  const totalDons = cartes.reduce((s, c) => s + ((c.dons && c.dons[enf.id]) || 0), 0);
  if (totalDons >= 1) ajoute("don_coeur", "Cœur partageur", "🎁");
  if (cartes.some(c => c.debloquee && c.dons && c.dons[enf.id] > 0))
    ajoute("equipe", "Esprit d'équipe", "🤝");
}

/* ---------- Auto-évaluation (enfant) & évaluation (parent) ---------- */
const EVAL_VALEURS = ["bien", "moyen", "mauvais"];
// L'enfant évalue sa propre journée depuis sa page d'accueil.
function definirAutoEval(valeur) {
  if (!EVAL_VALEURS.includes(valeur)) return;
  const enf = enfantActif();
  if (!enf.autoEval) enf.autoEval = {};
  const jour = aujourdHui();
  if (enf.autoEval[jour] === valeur) delete enf.autoEval[jour];  // re-toucher = annuler
  else enf.autoEval[jour] = valeur;
  sauver();
  rendre();
}
// Auto-évaluation d'un enfant pour un jour précis (encodage de la feuille).
// `valeur` vide = on efface. On cycle bien→moyen→mauvais→(vide) côté UI.
function definirAutoEvalJour(enf, jour, valeur) {
  if (!enf || !jour) return;
  if (valeur && !EVAL_VALEURS.includes(valeur)) return;
  if (!enf.autoEval) enf.autoEval = {};
  enregistrerAction(`Comportement (${jour})`, enf.prenom);
  if (!valeur) delete enf.autoEval[jour];
  else enf.autoEval[jour] = valeur;
  sauver();
  rendre();
}
function cyclerAutoEvalJour(enf, jour) {
  const ordre = ["bien", "moyen", "mauvais", ""];
  const cur = (enf.autoEval || {})[jour] || "";
  const i = ordre.indexOf(cur);
  definirAutoEvalJour(enf, jour, ordre[(i + 1) % ordre.length]);
}

// Un parent évalue (facultativement) la journée d'un enfant.
// `jour` permet de compléter les jours récents (défaut : aujourd'hui).
function definirEvalParent(enf, valeur, jour) {
  if (!EVAL_VALEURS.includes(valeur) || !enf) return;
  if (!enf.evalParent) enf.evalParent = {};
  jour = jour || aujourdHui();
  enregistrerAction(`Ressenti du jour modifié (${jour})`, enf.prenom);
  if (enf.evalParent[jour] === valeur) delete enf.evalParent[jour];
  else enf.evalParent[jour] = valeur;
  sauver();
  rendre();
}

/* ---------- Feedback ---------- */
/* ---------- Touches d'humour (désactivables) ---------- */
function humourActif() {
  return !!(etat && etat.reglages && etat.reglages.humour);
}
// Mémoire anti-répétition du dernier index tiré par préfixe.
const _humourDernier = {};
function humourAleatoire(prefix, arr) {
  if (!Array.isArray(arr) || !arr.length) return "";
  let idx = Math.floor(Math.random() * arr.length);
  if (arr.length > 1 && idx === _humourDernier[prefix]) idx = (idx + 1) % arr.length;
  _humourDernier[prefix] = idx;
  return trData(prefix, idx, arr[idx]);
}
// Message d'état vide : version rigolote si l'humour est actif, sinon le texte neutre fourni.
function messageVide(neutre) {
  if (!humourActif()) return neutre;
  return humourAleatoire("vide", MESSAGES_VIDES) || neutre;
}
// Blague du jour : stable sur la journée (index dérivé de la date locale).
function blagueDuJour() {
  if (!Array.isArray(BLAGUES) || !BLAGUES.length) return null;
  const cle = aujourdHui();
  let somme = 0;
  for (let i = 0; i < cle.length; i++) somme += cle.charCodeAt(i);
  const idx = somme % BLAGUES.length;
  const b = BLAGUES[idx];
  return {
    q: trData("blague_q", idx, b.q),
    r: trData("blague_r", idx, b.r)
  };
}

function feterGain(mission) {
  const cat = CATEGORIES[mission.cat];
  // 1 fois sur ~3, une taquinerie rigolote à la place de l'encouragement (si humour ON).
  let phrase;
  if (humourActif() && Math.random() < 0.34) {
    phrase = humourAleatoire("taquin", TAQUINERIES);
  } else {
    const idx = Math.floor(Math.random() * ENCOURAGEMENTS.length);
    phrase = trData("encour", idx, ENCOURAGEMENTS[idx]);
  }
  const pts = pointsMission(enfantActif(), mission);
  toast(t("toast.gain", { emoji: cat.monnaieEmoji, points: pts, monnaie: t("cat." + mission.cat + ".monnaie"), phrase }), "succes");
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
  if (scienceConf().celebrer === false) return;   // micro-célébrations désactivables (réglage science)
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
    permettreOubli: true,
    onReset: () => { modeParents = true; rendre(); },
    onOk: (saisi) => {
      if (saisi.trim() !== code) return false;   // garde la modale + message d'erreur
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
  const emoji = champ === "coeurs" ? "💛" : "💧";
  enregistrerAction(`Ajustement ${delta > 0 ? "+" : ""}${delta} ${emoji}`, enf.prenom);
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
  enregistrerAction(`Historique ${sens > 0 ? "ajout" : "retrait"} : ${titreMission(mission)} (${jour})`, enf.prenom);
  enf.journal[jour] = enf.journal[jour] || {};
  const actuel = enf.journal[jour][mission.id] || 0;
  const pts = pointsMission(enf, mission);
  const champ = mission.cat === "famille" ? "coeurs" : "gouttes";
  const totalChamp = mission.cat === "famille" ? "coeursTotal" : "gouttesTotal";

  if (sens > 0) {
    enf.journal[jour][mission.id] = actuel + 1;
    enf[champ] += pts;
    enf[totalChamp] += pts;
  } else {
    if (actuel <= 0) return;
    if (actuel === 1) delete enf.journal[jour][mission.id];
    else enf.journal[jour][mission.id] = actuel - 1;
    enf[champ] = Math.max(0, enf[champ] - pts);
    enf[totalChamp] = Math.max(0, enf[totalChamp] - pts);
  }
  if (Object.keys(enf.journal[jour]).length === 0) delete enf.journal[jour];
  sauver();
  rendre();
}

/* ---------- Gestion des badges (mode parents) ---------- */
// Retire un badge ; il ne sera pas ré-attribué automatiquement.
function retirerBadge(enf, badgeId) {
  enregistrerAction(`Badge retiré`, enf.prenom);
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
    coeurs: 0, coeursTotal: 0, gouttes: 0, gouttesTotal: 0, donsTotal: 0, avatarTotal: 0,
    ecosysteme: { plantes: {}, herbivores: {}, carnivores: {} },
    avatar: avatarParDefaut(base), debloque: [], heureCoucher: "19:30",
    journal: {}, planJour: {}, enAttente: [], badges: [], badgesRetires: [],
    autoEval: {}, evalParent: {}, reparations: {}
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
