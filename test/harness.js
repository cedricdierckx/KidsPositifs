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
}

// ---------- Construction du contexte ----------
function construireContexte() {
  const contexte = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, parseInt, parseFloat, isNaN,
    document: documentFactice,
    navigator: { language: "fr" },
    localStorage: new StockageMemoire(),
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
      ajouterCarteSurprise, modifierCarteSurprise, supprimerCarteSurprise,
      reinitCarteSurprise, marquerCarteFaite, deplacerCarteSurprise,
      // badges & divers
      verifierBadges, acheterOption, estDebloque, age, ageDepuis,
      // humour (touches bon enfant, désactivables)
      humourActif, messageVide, blagueDuJour, MESSAGES_VIDES, avisBlague, definirAvisBlague,
      BLAGUES_ACTIVEES, blagueDuJourVisible,
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
      CATEGORIES, MISSIONS, TIERS_ECO, ENFANTS_DEFAUT, ETAT_VERSION,
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
    };
  `;
  const source = [lire("js/i18n.js"), lire("js/data.js"), lire("js/croissance.js"), lire("js/qr.js"), lire("js/app.js"), lire("js/store.js"), epilogue].join("\n;\n");
  vm.runInContext(source, contexte, { filename: "famiteam-bundle.js" });
  return { contexte, api: contexte.contexteExports };
}

module.exports = { construireContexte };
