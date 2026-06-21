/* =====================================================================
 * FamiTeam — Banc d'essai headless (Phase A)
 * ---------------------------------------------------------------------
 * Charge js/i18n.js + js/data.js + js/app.js dans un contexte Node isolé
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
      lierEtat, etatNonVide, etatValide, etatVierge, etatDemo, normaliser,
      get familleId() { return familleId; }, set familleId(v) { familleId = v; },
      get familleEtat() { return familleEtat; },
      // missions
      crediterMission, decrediterMission, validerMission, trouverMission, toutesMissions,
      ajouterMissionPerso, planEffectif, missionsActives, basculerPlan, reinitPlan,
      missionsDefautCat, idsDefaut, enfantActif,
      // sélection groupée
      selectionGroupee, definirPlanComplet,
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
      humourActif, messageVide, blagueDuJour, MESSAGES_VIDES,
      // couche de données isolée (Phase D)
      Store,
      // données de référence
      CATEGORIES, MISSIONS, TIERS_ECO, ENFANTS_DEFAUT, ETAT_VERSION,
    };
  `;
  const source = [lire("js/i18n.js"), lire("js/data.js"), lire("js/app.js"), lire("js/store.js"), epilogue].join("\n;\n");
  vm.runInContext(source, contexte, { filename: "famiteam-bundle.js" });
  return { contexte, api: contexte.contexteExports };
}

module.exports = { construireContexte };
