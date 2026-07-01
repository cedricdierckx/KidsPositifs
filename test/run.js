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
// Décale une date AAAA-MM-JJ de `n` jours (n négatif = dans le passé).
function decalerJour(cle, n) {
  const d = new Date(cle + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}

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

/* ---------- Validation de schéma (Phase B) ---------- */
test("etatValide accepte un état vierge et un état normalisé", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.etatValide(api.etatVierge()).ok, true);
  assert.strictEqual(api.etatValide(api.normaliser({ enfants: { x: { prenom: "Z" } } })).ok, true);
});

test("etatValide rejette un état vide ou non-objet", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.etatValide(null).ok, false);
  assert.strictEqual(api.etatValide({}).ok, false);
  assert.strictEqual(api.etatValide({ enfants: {} }).ok, false);
});

test("etatValide rejette des monnaies corrompues", () => {
  const { api } = construireContexte();
  const e = api.etatVierge();
  const id = Object.keys(e.enfants)[0];
  e.enfants[id].coeurs = -5;
  assert.strictEqual(api.etatValide(e).ok, false);
  const e2 = api.etatVierge();
  e2.enfants[Object.keys(e2.enfants)[0]].gouttes = NaN;
  assert.strictEqual(api.etatValide(e2).ok, false);
});

test("etatValide rejette des structures essentielles du mauvais type", () => {
  const { api } = construireContexte();
  const e = api.etatVierge();
  const id = Object.keys(e.enfants)[0];
  e.enfants[id].badges = "oops";
  assert.strictEqual(api.etatValide(e).ok, false);
});

/* ---------- Couche de données isolée : garde-fous d'écriture (Phase D) ---------- */
test("Store.ecritureAutorisee autorise un état lié, peuplé et valide", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  assert.strictEqual(api.Store.ecritureAutorisee().ok, true);
});

test("Store.ecritureAutorisee bloque un état d'une autre famille", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());   // familleEtat = f1
  api.familleId = "f2";             // on bascule de famille sans relier
  assert.strictEqual(api.Store.ecritureAutorisee().ok, false);
});

test("Store.ecritureAutorisee bloque un état vide", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat({ enfants: {} });
  assert.strictEqual(api.Store.ecritureAutorisee().ok, false);
});

test("Store.ecritureAutorisee bloque un état au schéma corrompu", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  const e = api.etatVierge();
  e.enfants[Object.keys(e.enfants)[0]].coeurs = -1;
  api.lierEtat(e);
  assert.strictEqual(api.Store.ecritureAutorisee().ok, false);
});

/* ---------- Humour (touches bon enfant, désactivables) ---------- */
test("humour: activé par défaut, messageVide renvoie une blague", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  assert.strictEqual(api.humourActif(), true);
  const m = api.messageVide("NEUTRE");
  assert.ok(api.MESSAGES_VIDES.includes(m), "doit venir du corpus d'humour");
});

test("humour: désactivé, messageVide renvoie le texte neutre et blagueDuJour reste dispo", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  const e = api.etatVierge();
  e.reglages.humour = false;
  api.lierEtat(e);
  assert.strictEqual(api.humourActif(), false);
  assert.strictEqual(api.messageVide("NEUTRE"), "NEUTRE");
  const b = api.blagueDuJour();          // la blague existe indépendamment du réglage
  assert.ok(b && b.q && b.r);
  assert.strictEqual(typeof b.idx, "number");
});

test("blague: l'avis (j'aime/bof) se pose, bascule et s'enlève au re-clic", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const idx = api.blagueDuJour().idx;
  assert.strictEqual(api.avisBlague(idx), null);
  api.definirAvisBlague(idx, "up");
  assert.strictEqual(api.avisBlague(idx), "up");
  api.definirAvisBlague(idx, "down");   // change d'avis
  assert.strictEqual(api.avisBlague(idx), "down");
  api.definirAvisBlague(idx, "down");   // re-clic = on enlève
  assert.strictEqual(api.avisBlague(idx), null);
});

test("blagues: liste par langue + surcharge admin via configApp", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  // Chaque langue a sa propre liste par défaut, non vide.
  ["fr", "en", "nl", "de"].forEach(lg => {
    assert.ok(Array.isArray(api.BLAGUES_DEFAUT[lg]) && api.BLAGUES_DEFAUT[lg].length > 0);
    assert.ok(api.blaguesDe(lg).length > 0);
  });
  // Surcharge admin : la liste effective suit configApp["blagues_<lang>"].
  api.configApp = { blagues_fr: JSON.stringify([{ q: "Q?", r: "R!" }]) };
  assert.strictEqual(api.blaguesDe("fr").length, 1);
  assert.strictEqual(api.blaguesDe("fr")[0].q, "Q?");
  // La blague du jour est tirée de la langue courante.
  api.langue = "fr";
  const b = api.blagueDuJour();
  assert.strictEqual(b.q, "Q?");
});

/* ---------- Compliment du jour (espace parent) ---------- */
test("compliment: une série de 3+ jours consécutifs est détectée et félicitée", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  const aujourdhui = api.aujourdHui();
  [0, -1, -2].forEach(dec => api.modifierHistorique(enf, decalerJour(aujourdhui, dec), m, +1));
  assert.strictEqual(api.streakMission(enf, m.id, aujourdhui), 3);
  const c = api.complimentDuJour(enf);
  assert.strictEqual(c.type, "serie");
  assert.ok(c.texte.includes(enf.prenom));
});

test("compliment: la série s'interrompt si un jour est manqué", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  const aujourdhui = api.aujourdHui();
  api.modifierHistorique(enf, decalerJour(aujourdhui, 0), m, +1);
  // -1 manqué volontairement
  api.modifierHistorique(enf, decalerJour(aujourdhui, -2), m, +1);
  assert.strictEqual(api.streakMission(enf, m.id, aujourdhui), 1);
});

test("compliment: progression cette semaine vs la semaine précédente", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  const aujourdhui = api.aujourdHui();
  // Cette semaine (0..-6) : 3 fois. Semaine précédente (-7..-13) : 1 fois.
  [0, -2, -4].forEach(dec => api.modifierHistorique(enf, decalerJour(aujourdhui, dec), m, +1));
  api.modifierHistorique(enf, decalerJour(aujourdhui, -9), m, +1);
  assert.strictEqual(api.comptageMissionPeriode(enf, m.id, aujourdhui, 7), 3);
  assert.strictEqual(api.comptageMissionPeriode(enf, m.id, decalerJour(aujourdhui, -7), 7), 1);
  const c = api.complimentDuJour(enf);
  assert.strictEqual(c.type, "progres");
});

test("compliment: repli sur un message de bienvenue pour un enfant sans historique", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = enfantNeuf(api);
  const c = api.complimentDuJour(enf);
  assert.strictEqual(c.type, "bienvenue");
  assert.ok(c.texte.includes(enf.prenom));
});

/* ---------- Planification des missions ---------- */
test("planification: weekend uniquement filtre les jours de semaine", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const m = missionFamille(api);
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  api.definirPlanifMission(m.id, "jours", [0, 6]);   // dimanche + samedi
  // 2026-06-20 = samedi (actif), 2026-06-22 = lundi (inactif)
  assert.strictEqual(api.missionPlanifieeActive(m, enf, "2026-06-20"), true);
  assert.strictEqual(api.missionPlanifieeActive(m, enf, "2026-06-22"), false);
});

test("planification: plage de dates et enfant ciblé", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const m = missionPlanete(api);
  const ids = Object.keys(api.etat.enfants);
  const enfA = api.etat.enfants[ids[0]];
  const enfB = api.etat.enfants[ids[1]];
  api.definirPlanifMission(m.id, "du", "2026-06-10");
  api.definirPlanifMission(m.id, "au", "2026-06-30");
  api.definirPlanifMission(m.id, "enfants", [enfA.id]);
  assert.strictEqual(api.missionPlanifieeActive(m, enfA, "2026-06-15"), true);
  assert.strictEqual(api.missionPlanifieeActive(m, enfA, "2026-07-01"), false); // hors plage
  assert.strictEqual(api.missionPlanifieeActive(m, enfB, "2026-06-15"), false); // autre enfant
});

/* ---------- Semaine papier : encodage ---------- */
test("encodage détaillé : modifierHistorique crédite un jour précis", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  const m = missionFamille(api);
  const c0 = enf.coeurs;
  api.modifierHistorique(enf, "2026-06-15", m, +1);
  assert.strictEqual((enf.journal["2026-06-15"] || {})[m.id], 1);
  assert.strictEqual(enf.coeurs, c0 + m.points);
});

test("encodage express : ajusterMonnaie ajoute les totaux de la semaine", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  api.ajusterMonnaie(enf, "coeurs", 12);
  api.ajusterMonnaie(enf, "gouttes", 7);
  assert.strictEqual(enf.coeurs, 12);
  assert.strictEqual(enf.gouttes, 7);
});

test("comportement par jour : cyclerAutoEvalJour parcourt bien→moyen→mauvais→vide", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  const j = "2026-06-16";
  api.cyclerAutoEvalJour(enf, j); assert.strictEqual(enf.autoEval[j], "bien");
  api.cyclerAutoEvalJour(enf, j); assert.strictEqual(enf.autoEval[j], "moyen");
  api.cyclerAutoEvalJour(enf, j); assert.strictEqual(enf.autoEval[j], "mauvais");
  api.cyclerAutoEvalJour(enf, j); assert.strictEqual(enf.autoEval[j], undefined);
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

/* ---------- Personnalisation par enfant ---------- */
test("points par enfant : override pris en compte au crédit", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const m = missionFamille(api);
  api.definirPersoMission(enf, m.id, "points", 9);
  assert.strictEqual(api.pointsMission(enf, m), 9);
  const c0 = enf.coeurs;
  api.crediterMission(enf, m, "2026-06-16");
  assert.strictEqual(enf.coeurs, c0 + 9);
});

test("mission désactivée pour un enfant n'apparaît plus dans ses missions actives", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const ids0 = api.idsDefaut(enf);
  const cible = ids0[0];
  const m = api.trouverMission(cible);
  api.definirPersoMission(enf, cible, "actif", false);
  assert.strictEqual(api.missionActivePourEnfant(enf, cible), false);
  const actives = api.missionsActives(enf, m.cat, "2026-06-16").map(x => x.id);
  assert.ok(!actives.includes(cible));
});

test("coût d'espèce par enfant : override pris en compte", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const sp = api.spInfo("herbe").sp;
  assert.strictEqual(api.coutEspece(enf, sp), sp.cout);
  api.definirPersoEspece(enf, "herbe", "cout", 1);
  assert.strictEqual(api.coutEspece(enf, sp), 1);
  assert.strictEqual(api.especeActivePourEnfant(enf, "herbe"), true);
  api.definirPersoEspece(enf, "herbe", "actif", false);
  assert.strictEqual(api.especeActivePourEnfant(enf, "herbe"), false);
});

/* ---------- Budget de tâches par âge (≈ 3 min/jour) ---------- */
test("la sélection par défaut respecte le budget de tâches selon l'âge", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const a = api.age(enf);
  const attendu = api.tachesConseillees(a);
  const ids = api.idsDefaut(enf);
  // On ne dépasse pas le budget conseillé (peut être un peu moins si peu de missions pour l'âge).
  assert.ok(ids.length <= attendu, `${ids.length} ≤ ${attendu}`);
  assert.ok(ids.length >= 2, "au moins quelques tâches proposées");
});

test("tachesConseillees augmente avec l'âge", () => {
  const { api } = construireContexte();
  assert.ok(api.tachesConseillees(3) <= api.tachesConseillees(6));
  assert.ok(api.tachesConseillees(6) <= api.tachesConseillees(10));
});

/* ---------- Tableau de bord science ---------- */
test("scienceConf renvoie les défauts sans override", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  assert.strictEqual(api.budgetMinJour(), 3);
  assert.ok(api.tachesConseillees(3) === 8);
});

test("un override science (app_config) ajuste le budget et l'âge des missions", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const m = api.MISSIONS.find(x => x.cat === "famille");
  api.configApp = { science: JSON.stringify({
    budgetMinJour: 5,
    tachesParAge: [{ max: 3, n: 1 }, { max: 99, n: 8 }],
    ageMission: { [m.id]: 9 }
  }) };
  assert.strictEqual(api.budgetMinJour(), 5);
  assert.strictEqual(api.tachesConseillees(3), 1);
  assert.strictEqual(api.tachesConseillees(10), 8);
  assert.strictEqual(api.ageMinMission(m), 9);
});

/* ---------- Tournantes de tâches ---------- */
test("tournante hebdo : alterne l'enfant de garde et masque la tâche aux autres", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const ids = Object.keys(api.etat.enfants);
  const eA = api.etat.enfants[ids[0]], eB = api.etat.enfants[ids[1]];
  const m = api.MISSIONS.find(x => x.id === "table_mettre");
  const lundi = "2026-06-15"; // un lundi
  api.ajouterRotation([m.id], [eA.id, eB.id], "semaine", lundi);
  const rot = api.etat.rotations[0];
  // Semaine 0 -> A de garde ; semaine 1 -> B
  assert.strictEqual(api.enfantDeGardeRotation(rot, "2026-06-17"), eA.id);
  assert.strictEqual(api.enfantDeGardeRotation(rot, "2026-06-23"), eB.id);
  // La tâche n'est permise qu'à l'enfant de garde
  assert.strictEqual(api.rotationPermet(eA, m.id, "2026-06-17"), true);
  assert.strictEqual(api.rotationPermet(eB, m.id, "2026-06-17"), false);
  // Forçage : c'est dans les missions du jour de A, pas de B
  assert.ok(api.missionsTournanteDuJour(eA, "2026-06-17").some(x => x.id === m.id));
  assert.ok(!api.missionsTournanteDuJour(eB, "2026-06-17").some(x => x.id === m.id));
});

test("tournante : jours off + un seul enfant", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const eA = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  const m = api.MISSIONS.find(x => x.id === "table_debarr");
  // Un seul enfant, off le week-end (sam=6, dim=0)
  api.ajouterRotation([m.id], [eA.id], "semaine", "2026-06-15", [6, 0]);
  const rot = api.etat.rotations[0];
  assert.strictEqual(api.jourOffRotation(rot, "2026-06-20"), true);  // samedi
  assert.strictEqual(api.jourOffRotation(rot, "2026-06-17"), false); // mercredi
  // En semaine : actif ; le week-end : masqué
  assert.ok(api.missionsTournanteDuJour(eA, "2026-06-17").some(x => x.id === m.id));
  assert.ok(!api.missionsTournanteDuJour(eA, "2026-06-20").some(x => x.id === m.id));
});

test("tournante : la tâche de demain revient à l'enfant de garde du lendemain", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const ids = Object.keys(api.etat.enfants);
  const eA = api.etat.enfants[ids[0]], eB = api.etat.enfants[ids[1]];
  const m = api.MISSIONS.find(x => x.id === "table_mettre");
  // Rotation quotidienne démarrant le 2026-06-15 : J0=A, J1=B, J2=A...
  api.ajouterRotation([m.id], [eA.id, eB.id], "jour", "2026-06-15");
  assert.strictEqual(api.demain("2026-06-15"), "2026-06-16");
  // Le 15, c'est A de garde ; demain (le 16) ce sera B
  assert.ok(api.missionsTournanteDuJour(eB, api.demain("2026-06-15")).some(x => x.id === m.id));
  assert.ok(!api.missionsTournanteDuJour(eA, api.demain("2026-06-15")).some(x => x.id === m.id));
});

/* ---------- Sélection groupée ---------- */
test("selectionGroupee applique le mode à tous les enfants", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const jour = api.aujourdHui ? api.aujourdHui() : null;
  // « tous » : chaque enfant a toutes les missions
  api.selectionGroupee("tous");
  const tout = api.MISSIONS.length;
  Object.values(api.etat.enfants).forEach(enf => {
    const plan = api.planEffectif(enf, "2999-01-01"); // un jour très postérieur
    assert.strictEqual(plan.length, tout);
  });
  // « aucun » : plan vide
  api.selectionGroupee("aucun");
  Object.values(api.etat.enfants).forEach(enf => {
    assert.strictEqual(api.planEffectif(enf, "2999-01-01").length, 0);
  });
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

test("le choix parental fait foi, même au-delà de l'âge conseillé", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const trop = api.MISSIONS.find(m => m.ageMin > api.age(enf));
  if (!trop) return; // catalogue sans mission plus âgée
  assert.ok(!api.idsDefaut(enf).includes(trop.id), "non cochée par défaut (hors âge)");
  api.basculerPlan(enf, "2026-06-16", trop.id);
  const actives = api.missionsActives(enf, trop.cat, "2026-06-16").map(m => m.id);
  assert.ok(actives.includes(trop.id), "activable par les parents au-delà de l'âge");
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

/* ---------- Cartes surprises (objectifs d'équipe) ---------- */
test("un état vierge contient les cartes surprises par défaut (sans progression)", () => {
  const { api } = construireContexte();
  const cartes = api.etatVierge().cartesSurprises;
  assert.ok(Array.isArray(cartes) && cartes.length >= 3);
  assert.strictEqual(cartes[0].recolte, 0);
  assert.strictEqual(cartes[0].debloquee, false);
});

test("normaliser seede les cartes surprises pour une famille existante", () => {
  const { api } = construireContexte();
  const n = api.normaliser({ enfants: { x: { prenom: "Z" } } });
  assert.ok(Array.isArray(n.cartesSurprises) && n.cartesSurprises.length >= 3);
});

test("le prix par défaut des cartes = nb d'enfants × 50/200/1000", () => {
  const { api } = construireContexte();
  // Famille de 2 enfants.
  const n = api.normaliser({ enfants: { a: { prenom: "A" }, b: { prenom: "B" } } });
  const couts = n.cartesSurprises.map(c => c.cout);
  assert.strictEqual(couts[0], 100);
  assert.strictEqual(couts[1], 400);
  assert.strictEqual(couts[2], 2000);
});

test("migration douce : un ancien prix par défaut non utilisé est recalculé", () => {
  const { api } = construireContexte();
  const brut = { enfants: { a: { prenom: "A" }, b: { prenom: "B" } },
    cartesSurprises: [{ id: "cs_cine", emoji: "🍿", titre: "x", activite: "y", cout: 15, recolte: 0, dons: {}, debloquee: false }] };
  const n = api.normaliser(brut);
  assert.strictEqual(n.cartesSurprises[0].cout, 100); // 2 enfants × 50
});

test("migration douce : un prix personnalisé ou entamé n'est PAS recalculé", () => {
  const { api } = construireContexte();
  const brut = { enfants: { a: { prenom: "A" } },
    cartesSurprises: [{ id: "cs_cine", emoji: "🍿", titre: "x", activite: "y", cout: 99, recolte: 0, dons: {}, debloquee: false }] };
  assert.strictEqual(api.normaliser(brut).cartesSurprises[0].cout, 99);
});

test("donnerCarte dépense les cœurs et fait progresser la récolte commune", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10;
  const carte = api.cartesSurprises()[0];
  api.donnerCarte(carte.id, 4);
  assert.strictEqual(enf.coeurs, 6);
  assert.strictEqual(api.trouverCarteSurprise(carte.id).recolte, 4);
  assert.strictEqual(api.trouverCarteSurprise(carte.id).dons[enf.id], 4);
});

test("donnerCarte cumule les dépenses collectives (donsTotal)", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10;
  api.donnerCarte(api.cartesSurprises()[0].id, 4);
  assert.strictEqual(enf.donsTotal, 4);
});

test("acheterOption cumule les dépenses individuelles (avatarTotal)", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10;
  api.acheterOption("chapeau", { id: "couronne", cout: 6 });
  assert.strictEqual(enf.avatarTotal, 6);
});

test("donnerCarte ne dépense pas le total cumulé (coeursTotal)", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10; enf.coeursTotal = 20;
  api.donnerCarte(api.cartesSurprises()[0].id, 5);
  assert.strictEqual(enf.coeursTotal, 20);
});

test("donnerCarte refuse au-delà des cœurs disponibles", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 2;
  const carte = api.cartesSurprises()[0];
  api.donnerCarte(carte.id, 5);
  assert.strictEqual(enf.coeurs, 2);
  assert.strictEqual(api.trouverCarteSurprise(carte.id).recolte, 0);
});

test("donnerCarte plafonne au prix et débloque la carte", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const carte = api.cartesSurprises()[0];
  enf.coeurs = carte.cout + 10;
  api.donnerCarte(carte.id, carte.cout + 10);   // on essaie de trop donner
  const c = api.trouverCarteSurprise(carte.id);
  assert.strictEqual(c.recolte, carte.cout);    // plafonné au prix
  assert.strictEqual(c.debloquee, true);
  assert.strictEqual(enf.coeurs, 10);           // seul le nécessaire a été pris
});

test("plusieurs enfants contribuent à la même carte (collaboration)", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  const etat = api.etatVierge();
  api.lierEtat(etat);
  const ids = Object.keys(etat.enfants);
  const carte = api.cartesSurprises()[0];
  etat.enfants[ids[0]].coeurs = 5;
  etat.enfants[ids[1]].coeurs = 5;
  etat.enfantActif = ids[0]; api.donnerCarte(carte.id, 5);
  etat.enfantActif = ids[1]; api.donnerCarte(carte.id, 3);
  const c = api.trouverCarteSurprise(carte.id);
  assert.strictEqual(c.recolte, 8);
  assert.strictEqual(c.dons[ids[0]], 5);
  assert.strictEqual(c.dons[ids[1]], 3);
});

test("les parents peuvent ajouter, modifier et supprimer une carte", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const avant = api.cartesSurprises().length;
  api.ajouterCarteSurprise("🎲", "Soirée jeux", "On sort les jeux de société", 12);
  assert.strictEqual(api.cartesSurprises().length, avant + 1);
  const ajoutee = api.cartesSurprises()[api.cartesSurprises().length - 1];
  assert.strictEqual(ajoutee.cout, 12);
  api.modifierCarteSurprise(ajoutee.id, "cout", 20);
  assert.strictEqual(api.trouverCarteSurprise(ajoutee.id).cout, 20);
  api.supprimerCarteSurprise(ajoutee.id);
  assert.strictEqual(api.cartesSurprises().length, avant);
});

test("les cartes sont en mode mystère (revele=false) par défaut", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.etatVierge().cartesSurprises[0].revele, false);
});

test("on peut rendre une carte visible (revele) puis la remasquer", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const id = api.cartesSurprises()[0].id;
  api.modifierCarteSurprise(id, "revele", true);
  assert.strictEqual(api.trouverCarteSurprise(id).revele, true);
  api.modifierCarteSurprise(id, "revele", false);
  assert.strictEqual(api.trouverCarteSurprise(id).revele, false);
});

test("ajouterCarteSurprise respecte le paramètre revele", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  api.ajouterCarteSurprise("🎲", "Soirée jeux", "desc", 12, true);
  const c = api.cartesSurprises()[api.cartesSurprises().length - 1];
  assert.strictEqual(c.revele, true);
});

test("deplacerCarteSurprise change l'ordre des cartes", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const ids = api.cartesSurprises().map(c => c.id);
  api.deplacerCarteSurprise(ids[0], 1);        // descendre la 1ʳᵉ
  assert.strictEqual(api.cartesSurprises()[0].id, ids[1]);
  assert.strictEqual(api.cartesSurprises()[1].id, ids[0]);
  api.deplacerCarteSurprise(ids[0], -1);       // la remonter
  assert.strictEqual(api.cartesSurprises()[0].id, ids[0]);
});

test("deplacerCarteSurprise ignore les déplacements hors limites", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const ids = api.cartesSurprises().map(c => c.id);
  api.deplacerCarteSurprise(ids[0], -1);       // déjà en haut : pas de changement
  assert.strictEqual(api.cartesSurprises()[0].id, ids[0]);
});

test("reinitCarteSurprise remet la carte à zéro pour la rejouer", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const carte = api.cartesSurprises()[0];
  enf.coeurs = carte.cout;
  api.donnerCarte(carte.id, carte.cout);
  assert.strictEqual(api.trouverCarteSurprise(carte.id).debloquee, true);
  api.reinitCarteSurprise(carte.id);
  const c = api.trouverCarteSurprise(carte.id);
  assert.strictEqual(c.recolte, 0);
  assert.strictEqual(c.debloquee, false);
  assert.deepStrictEqual(Object.keys(c.dons), []);
});

/* ---------- Défis réparation (toggle 1 h) ---------- */
test("un défi réparation crédite puis s'annule (toggle) dans l'heure", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const d = api.DEFIS_REPARATION[0];
  const avant = enf.coeurs;
  api.defiReparation(d);
  assert.strictEqual(enf.coeurs, avant + d.bonus);
  assert.strictEqual(api.reparationActive(enf, d.id), true);
  api.defiReparation(d);   // 2e clic dans l'heure = annulation
  assert.strictEqual(enf.coeurs, avant);
  assert.strictEqual(api.reparationActive(enf, d.id), false);
});

test("après une heure, le défi réparation est de nouveau disponible", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const d = api.DEFIS_REPARATION[0];
  api.defiReparation(d);                 // crédite (bonus une 1re fois)
  enf.reparations[d.id] = Date.now() - 2 * 60 * 60 * 1000;  // simulate 2 h plus tard
  assert.strictEqual(api.reparationActive(enf, d.id), false);
  const avant = enf.coeurs;
  api.defiReparation(d);                 // re-crédite de nouveaux points
  assert.strictEqual(enf.coeurs, avant + d.bonus);
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
