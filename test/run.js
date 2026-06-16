/* =====================================================================
 * FamiTeam — Suite de tests de non-régression (Phase A)
 * ---------------------------------------------------------------------
 * Exécution : `node test/run.js`  (aucune dépendance externe).
 * Couvre : migrations (normaliser), garde-fous (etatNonVide / lierEtat),
 * crédit/décrédit de mission, plan « jours suivants », et écosystème
 * (prérequis, coûts, badges).
 * ===================================================================== */

const assert = require("assert");
const { construireContexte } = require("./harness");

let reussites = 0, echecs = 0;
const cas = [];
function test(nom, fn) { cas.push({ nom, fn }); }

// Petit enfant de test, isolé, avec toutes les structures attendues.
function enfantNeuf(api) {
  const e = api.etatVierge();
  return e.enfants[Object.keys(e.enfants)[0]];
}
function missionFamille(api) { return api.MISSIONS.find(m => m.cat === "famille"); }
function missionPlanete(api) { return api.MISSIONS.find(m => m.cat === "planete"); }

/* ---------- Garde-fous & migrations ---------- */
test("etatNonVide distingue un état vide d'un état peuplé", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.etatNonVide(null), false);
  assert.strictEqual(api.etatNonVide({}), false);
  assert.strictEqual(api.etatNonVide({ enfants: {} }), false);
  assert.strictEqual(api.etatNonVide(api.etatVierge()), true);
});

test("lierEtat lie l'état à la famille active (anti inter-familles)", () => {
  const { api } = construireContexte();
  api.familleId = "famille-A";
  const e = api.etatVierge();
  api.lierEtat(e);
  assert.strictEqual(api.familleEtat, "famille-A");
  assert.strictEqual(api.etat, e);
});

test("normaliser complète un état minimal sans rien perdre", () => {
  const { api } = construireContexte();
  const brut = { enfants: { x: { prenom: "Zoé", coeurs: 7 } } };
  const n = api.normaliser(brut);
  assert.strictEqual(n.enfants.x.prenom, "Zoé");
  assert.strictEqual(n.enfants.x.coeurs, 7);
  assert.deepStrictEqual(Object.keys(n.enfants.x.ecosysteme).sort(), ["carnivores", "herbivores", "plantes"]);
  assert.strictEqual(n.enfants.x.gouttesTotal, 0);
  assert.ok(Array.isArray(n.enfants.x.enAttente));
  assert.ok(Array.isArray(n.enfants.x.badges));
  assert.strictEqual(n.version, api.ETAT_VERSION);
});

test("normaliser migre l'ancien format d'année de naissance", () => {
  const { api } = construireContexte();
  const n = api.normaliser({ enfants: { x: { naissance: 2018 } } });
  assert.strictEqual(n.enfants.x.naissance, "2018-01-01");
});

test("normaliser sur null renvoie un état vierge valide", () => {
  const { api } = construireContexte();
  const n = api.normaliser(null);
  assert.ok(api.etatNonVide(n));
  assert.strictEqual(n.version, api.ETAT_VERSION);
});

/* ---------- Crédit / décrédit de mission ---------- */
test("crediterMission ajoute points et journal (catégorie famille = cœurs)", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  api.crediterMission(enf, m, "2026-06-16");
  assert.strictEqual(enf.coeurs, m.points);
  assert.strictEqual(enf.coeursTotal, m.points);
  assert.strictEqual(enf.journal["2026-06-16"][m.id], 1);
});

test("crediterMission catégorie planète crédite les gouttes", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  const m = missionPlanete(api);
  api.crediterMission(enf, m, "2026-06-16");
  assert.strictEqual(enf.gouttes, m.points);
  assert.strictEqual(enf.gouttesTotal, m.points);
  assert.strictEqual(enf.coeurs, 0);
});

test("décréditer annule le crédit et nettoie le journal", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  api.crediterMission(enf, m, "2026-06-16");
  api.decrediterMission(enf, m, "2026-06-16");
  assert.strictEqual(enf.coeurs, 0);
  assert.strictEqual(enf.coeursTotal, 0);
  assert.strictEqual(enf.journal["2026-06-16"], undefined);
});

test("décréditer ne descend jamais sous zéro", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  api.decrediterMission(enf, m, "2026-06-16"); // rien à retirer
  assert.strictEqual(enf.coeurs, 0);
  assert.strictEqual(enf.coeursTotal, 0);
});

/* ---------- Plan « jours suivants » ---------- */
test("basculerPlan retire une mission pour ce jour ET les suivants", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  const etat = api.etatVierge();
  api.lierEtat(etat);
  const enf = api.enfantActif();
  const cible = api.idsDefaut(enf)[0];
  api.basculerPlan(enf, "2026-06-16", cible);
  const plan = api.planEffectif(enf, "2026-06-20");
  assert.ok(!plan.includes(cible), "la mission retirée ne doit plus apparaître les jours suivants");
});

test("planEffectif prend le modèle le plus récent <= jour", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.planJour = { "2026-06-10": ["a"], "2026-06-15": ["a", "b"] };
  assert.deepStrictEqual(api.planEffectif(enf, "2026-06-12"), ["a"]);
  assert.deepStrictEqual(api.planEffectif(enf, "2026-06-16"), ["a", "b"]);
  assert.strictEqual(api.planEffectif(enf, "2026-06-01"), null);
});

/* ---------- Écosystème : prérequis, coûts ---------- */
test("prereqManquants liste ce qui manque pour une espèce", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  // Cherche une espèce ayant des prérequis.
  let avecPrereq = null, tierTrouve = null;
  for (const t of api.TIERS_ECO) {
    const sp = t.especes.find(s => s.prereq && Object.keys(s.prereq).length);
    if (sp) { avecPrereq = sp; tierTrouve = t; break; }
  }
  assert.ok(avecPrereq, "le jeu doit contenir au moins une espèce à prérequis");
  const manquants = api.prereqManquants(enf, avecPrereq);
  assert.ok(manquants.length > 0);
  assert.strictEqual(api.especeDebloquee(enf, avecPrereq), false);
});

test("creerEspece refuse sans les gouttes nécessaires", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  // Espèce de base (sans prérequis) du premier tier.
  const tier = api.TIERS_ECO[0];
  const sp = tier.especes.find(s => !s.prereq || !Object.keys(s.prereq).length);
  enf.gouttes = 0;
  api.creerEspece(tier, sp);
  assert.strictEqual(api.nbEspece(enf, sp.id), 0, "aucune création sans gouttes");
});

test("creerEspece dépense les gouttes et ajoute l'être vivant", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const tier = api.TIERS_ECO[0];
  const sp = tier.especes.find(s => !s.prereq || !Object.keys(s.prereq).length);
  enf.gouttes = sp.cout + 5;
  api.creerEspece(tier, sp);
  assert.strictEqual(api.nbEspece(enf, sp.id), 1);
  assert.strictEqual(enf.gouttes, 5);
});

/* ---------- Badges ---------- */
test("verifierBadges attribue le badge cœur dès 10 cœurs cumulés", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  enf.coeursTotal = 12;
  api.verifierBadges(enf);
  assert.ok(enf.badges.find(b => b.id === "coeur10"));
});

test("verifierBadges ne redonne pas un badge retiré par un parent", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  enf.coeursTotal = 60;
  enf.badgesRetires = ["coeur50"];
  api.verifierBadges(enf);
  assert.ok(!enf.badges.find(b => b.id === "coeur50"), "un badge retiré ne revient pas");
});

/* ---------- Avatar ---------- */
test("acheterOption refuse sans assez de cœurs et n'équipe pas", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 0;
  const avant = enf.avatar.chapeau;
  api.acheterOption("chapeau", { id: "couronne", cout: 99 });
  assert.strictEqual(enf.coeurs, 0);
  assert.ok(!enf.debloque.includes("chapeau:couronne"));
  assert.strictEqual(enf.avatar.chapeau, avant);
});

test("acheterOption débloque, dépense puis équipe avec assez de cœurs", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10;
  api.acheterOption("chapeau", { id: "couronne", cout: 6 });
  assert.strictEqual(enf.coeurs, 4);
  assert.ok(enf.debloque.includes("chapeau:couronne"));
  assert.strictEqual(enf.avatar.chapeau, "couronne");
});

/* ---------- Exécution ---------- */
(function executer() {
  for (const { nom, fn } of cas) {
    try { fn(); reussites++; console.log(`  ✓ ${nom}`); }
    catch (e) { echecs++; console.log(`  ✗ ${nom}\n      ${e.message}`); }
  }
  console.log(`\n${reussites}/${cas.length} tests réussis` + (echecs ? `, ${echecs} échec(s)` : ""));
  process.exit(echecs ? 1 : 0);
})();
