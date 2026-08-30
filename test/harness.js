/* =====================================================================
 * FamiTeam — Banc d'essai headless (Phase A)
 * ---------------------------------------------------------------------
 * Charge js/i18n.js + js/data.js + js/croissance.js + js/app.js dans un contexte isolé
 * (module `vm`), avec des bouchons (stubs) minimalistes pour le DOM, le
 * navigateur et le stockage local. Aucune dépendance externe.
 *
 * Pourquoi un seul script concaténé ? Les fichiers déclarent leurs symboles
 * avec `const`/`let`/`function` au niveau racine. En les exécutant dans un
 * même script `vm`, l'épilogue de test partage leur portée lexicale et peut
 * appeler n'importe quelle fonction (crediterMission, normaliser, …) ainsi
 * que lire/écrire l'état global `etat`.
 * ===================================================================== */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const racine = path.join(__dirname, "..");
const lire = (rel) => fs.readFileSync(path.join(racine, rel), "utf8");

// ---------- Bouchons DOM / navigateur ----------
function elementFactice() {
  const noeud = {
    children: [],
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { noeud.children.push(c); return c; },
    remove() {}, focus() {}, click() {},
    querySelector() { return elementFactice(); },
    querySelectorAll() { return []; },
  };
  let _texte = "", _html = "", _cls = "", _val = "";
  Object.defineProperties(noeud, {
    textContent: { get: () => _texte, set: (v) => { _texte = String(v); } },
    innerHTML: { get: () => _html, set: (v) => { _html = String(v); } },
    className: { get: () => _cls, set: (v) => { _cls = String(v); } },
    value: { get: () => _val, set: (v) => { _val = String(v); } },
  });
  return noeud;
}

const documentFactice = {
  body: elementFactice(),
  documentElement: elementFactice(),
  createElement: () => elementFactice(),
  querySelector: () => elementFactice(),
  querySelectorAll: () => [],
  getElementById: () => elementFactice(),
  addEventListener() {},
};

class StockageMemoire {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
  // `length` et `key(i)` font partie de l'API Storage : sans eux,
  // listerSauvegardesLocales() — qui balaie les clés — ne trouvait jamais
  // rien, et un test des sauvegardes locales aurait passé pour de mauvaises
  // raisons ou échoué sans que le produit soit en cause.
  get length() { return this.m.size; }
  key(i) { return Array.from(this.m.keys())[i] ?? null; }
}

// ---------- Construction du contexte ----------
// `options.stockage` : paires a deposer dans localStorage AVANT l'execution
// des scripts. Indispensable pour tester ce que l'application lit au
// demarrage — la langue memorisee, par exemple — plutot que ce qu'elle ecrit.
// `options.langueNavigateur` : valeur de navigator.language.
function construireContexte(options) {
  const opt = options || {};
  const stockage = new StockageMemoire();
  Object.keys(opt.stockage || {}).forEach(k => stockage.setItem(k, opt.stockage[k]));
  const contexte = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,        // ex. le minuteur d'écran : jamais exécuté en test
    clearInterval: () => {},
    Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, parseInt, parseFloat, isNaN,
    document: documentFactice,
    navigator: { language: opt.langueNavigateur || "fr" },
    localStorage: stockage,
    location: { href: "https://famiteam.com/", search: "", hash: "" },
    rendre() {},                 // rendu UI (no-op en test)
    demanderPin() {},            // dialogue PIN (no-op en test)
  };
  contexte.window = contexte;
  contexte.globalThis = contexte;
  vm.createContext(contexte);

  // Épilogue : expose les symboles utiles aux tests (portée lexicale partagée).
  const epilogue = `
    contexteExports = {
      // état & garde-fous
      get etat() { return etat; }, set etat(v) { etat = v; },
      lierEtat, etatNonVide, etatValide, etatVierge, etatDemo, normaliser, restaurerSauvegarde,
      listerSauvegardesLocales, sauvegarderAvantConflit,
      get familleId() { return familleId; }, set familleId(v) { familleId = v; },
      get familleEtat() { return familleEtat; },
      // missions
      crediterMission, decrediterMission, validerMission, trouverMission, toutesMissions,
      ajouterMissionPerso, planEffectif, missionsActives, basculerPlan, reinitPlan,
      missionsDefautCat, idsDefaut, enfantActif,
      // sélection groupée
      selectionGroupee, definirPlanComplet,
      // tournantes de tâches
      ajouterRotation, supprimerRotation, enfantDeGardeRotation, rotationPermet, missionsTournanteDuJour, debutSemaineLundi, jourOffRotation, demain,
      periodeRotation, apercuRotation, prochainTourRotation, joursPeriodeRotation,
      // budget de tâches par âge (≈ 3 min/jour)
      tachesConseillees, nbConseille, missionsConseillees,
      // tableau de bord science
      scienceConf, budgetMinJour, pointsMaxConseille, ageMinMission,
      get configApp() { return (typeof configApp !== "undefined") ? configApp : undefined; },
      set configApp(v) { configApp = v; },
      // planification des missions (jours / dates / enfants)
      definirPlanifMission, basculerPlanifElement, planifMission, missionPlanifieeActive,
      // encodage semaine papier
      definirAutoEvalJour, cyclerAutoEvalJour, modifierHistorique, ajusterMonnaie,
      // auto-évaluation (enfant) — dépend du jour affiché (mode révision)
      definirAutoEval, definirEvalParent,
      // personnalisation par enfant
      pointsMission, missionActivePourEnfant, definirPersoMission,
      coutEspece, especeActivePourEnfant, definirPersoEspece,
      // attente / validation parentale
      confirmerAttente, refuserAttente,
      // défis réparation
      defiReparation, reparationActive, DEFIS_REPARATION,
      // écosystème
      nbTier, nbTotalEspeces, spInfo, nbEspece, prereqManquants, especeDebloquee, creerEspece,
      // cartes surprises (objectifs d'équipe)
      cartesSurprises, trouverCarteSurprise, donnerCarte,
      // rendez-vous d'une carte gagnée (date, décompte, export agenda)
      definirDateCarte, joursAvantCarte, icsCarteSurprise, champsCarteSurprise, icsEchapper, icsPlier,
      ajouterCarteSurprise, modifierCarteSurprise, supprimerCarteSurprise,
      reinitCarteSurprise, marquerCarteFaite, deplacerCarteSurprise,
      // badges & divers
      verifierBadges, acheterOption, estDebloque, age, ageDepuis,
      // seuil d'affichage imagé : décide aussi du registre du décompte
      // (« dans 3 dodos » chez les petits, « dans 3 jours » chez les grands)
      estJeune, seuilVisuel,
      // humour (touches bon enfant, désactivables)
      humourActif, messageVide, blagueDuJour, MESSAGES_VIDES, avisBlague, definirAvisBlague,
      blaguesActivees, blagueDuJourVisible,
      // compliment du jour (espace parent)
      complimentDuJour, streakMission, comptageMissionPeriode, joursActifsPeriode, aujourdHui,
      blaguesDe, langueCourante, BLAGUES_DEFAUT,
      get langue() { return (typeof langue !== "undefined") ? langue : undefined; },
      set langue(v) { langue = v; },
      // internationalisation (parité des traductions)
      I18N, LANGUES, t,
      // couche de données isolée (Phase D)
      Store,
      // données de référence
      CATEGORIES, MISSIONS, TIERS_ECO, ENFANTS_DEFAUT, ETAT_VERSION, BADGES_CATALOGUE,
      // plan de développement commercial (admin)
      CROISSANCE_PHASES, CROISSANCE_CHANTIERS, CROISSANCE_MAILS, CROISSANCE_CONTRAINTES, CROISSANCE_RITUEL,
      chantiersDePhase, mailCroissance, dureeChantier, seanceDeLaSemaine, cleEtapeCroissance,
      CROISSANCE_DECISIONS, decisionsEnAttente, optionRecommandee, decisionCroissance,
      // encodeur QR (Arbre des familles)
      qrMatrice, qrSvg, QR_TAILLE, QR_CAPACITE,
      // Arbre des familles : paliers d'effort et détection de la famille convaincue
      ARBRE_PALIERS, arbrePalier, arbrePalierSuivant,
      joursActifsFamille, familleConvaincue, ARBRE_J7_JOURS_ACTIFS, ARBRE_J7_ANCIENNETE,
      // bandeau dodo : lecture de l'heure de coucher et ambiance courante
      momentDodo, minutesCoucher, DODO_FENETRE, DODO_DEFAUT,
      // rendez-vous du soir : rappel délégué à l'agenda du parent
      RITUEL_RYTHMES, RITUEL_DUREE_MIN, RITUEL_AVANT_DODO,
      heureRituelConseillee, debutRituel, rituelRrule, rituelRecurrence, icsRituelSoir, champsRituelSoir, hhmm, heureValide,
      // minuteur d'écran (verrouillage PIN) : plafond de 6 h depuis le lancement
      get timerEtat() { return timerEtat; }, set timerEtat(v) { timerEtat = v; },
      timerVierge, chargerTimer, ecrireTimer, cleTimer,
      timerDureeMin, timerMode, definirReglageTimer, demarrerTimer, arreterTimer,
      timerDepasseDelaiMax, verifierDelaiMaxTimer, TIMER_DELAI_MAX_MS,
      continuerAvecEnfant, ajouterTempsEnfant, ajouterTempsGlobal, tempsRestantEnfant,
      // mode « verrouillage permanent » : cycle fixe de 6 h, sans PIN
      TIMER_CYCLE_MS, timerDebutCycle, timerFinCycle, assurerCyclePermanent, assurerTimerPermanent,
      verrouillerAppPermanent, contournerVerrouPermanent, restesDisponibles, finDeTempsEnfant,
      get modeParents() { return modeParents; }, set modeParents(v) { modeParents = v; },
    };
  `;
  const source = [lire("js/i18n.js"), lire("js/data.js"), lire("js/croissance.js"), lire("js/qr.js"), lire("js/app.js"), lire("js/store.js"), epilogue].join("\n;\n");
  vm.runInContext(source, contexte, { filename: "famiteam-bundle.js" });
  return { contexte, api: contexte.contexteExports };
}

module.exports = { construireContexte };
