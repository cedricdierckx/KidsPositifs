/* =====================================================================
 * FamiTeam — Interface : Écran d'accueil de l'enfant
 * ---------------------------------------------------------------------
 * La vue d'accueil elle-même, le mode révision du parent (naviguer d'un
 * jour à l'autre pour corriger après coup) et les repères de dates
 * partagés par les écrans qui suivent.
 *
 * Module de l'interface (ARCHITECTURE.md, phase C). Script classique,
 * comme tous les autres : les fonctions restent globales et s'appellent
 * entre modules sans import. L'ordre des balises dans index.html n'a
 * donc aucune conséquence — rien ne s'exécute au chargement.
 * ===================================================================== */
/* ---------- Vue Accueil ---------- */
function vueAccueil(c) {
  const enf = enfantActif();

  // Mode révision (parent) : bannière de navigation par jour, EN HAUT, pour
  // bien voir quel jour on est en train de modifier.
  if (retroActif) c.appendChild(blocVerifJours(enf));

  // Disposition 2 colonnes sur grand écran, empilée sur mobile/tablette.
  const layout = el("div", "accueil-layout");
  const colA = el("div", "acc-col acc-col-a"); // profil + dodo (latéral sur desktop)
  const colB = el("div", "acc-col acc-col-b"); // missions, écosystème, badges
  layout.appendChild(colA); layout.appendChild(colB);
  c.appendChild(layout);

  const jeune = estJeune(enf);   // affichage imagé (seuil réglable par les parents)
  const carte = el("section", "carte-accueil");
  carte.style.setProperty("--c", enf.couleur);
  carte.innerHTML = `
    <div class="accueil-avatar">${renduAvatar(enf)}</div>
    <h1>${t("home.salut", { prenom: enf.prenom })} <small>(${t("home.ans", { age: age(enf) })})</small></h1>
    <div class="compteurs">
      <div class="compteur">${compteurVisuel("💛", enf.coeurs, jeune)}<span>${t("home.coeurs_label")}</span></div>
      <div class="compteur">${compteurVisuel("💧", enf.gouttes, jeune)}<span>${t("home.gouttes_label")}</span></div>
    </div>`;
  colA.appendChild(carte);

  // Auto-évaluation de la journée (mise en avant, juste sous le profil)
  colA.appendChild(blocEval(enf, "enfant"));

  // Bandeau "dodo" : ambiance selon l'heure + mission coucher à l'heure
  colA.appendChild(bandeauDodo(enf));

  // Tournantes : à qui le tour, jusqu'à quand — AVANT les missions, sinon
  // l'enfant découvre une tâche (ou son absence) sans comprendre pourquoi.
  const tr = blocTournanteEnfant(enf);
  if (tr) colB.appendChild(tr);

  // Missions Famille (directement sur la page d'accueil de l'enfant)
  const titreFam = el("section", "carte titre-cat");
  titreFam.style.setProperty("--c", CATEGORIES.famille.couleur);
  titreFam.innerHTML = `<h2>${t("home.missions_famille")} <span class="solde-inline">💛${jeune ? "" : " " + enf.coeurs}</span></h2>`;
  colB.appendChild(titreFam);
  colB.appendChild(grilleMissions("famille"));

  // Missions Planète (directement sur la page d'accueil de l'enfant)
  const titrePla = el("section", "carte titre-cat");
  titrePla.style.setProperty("--c", CATEGORIES.planete.couleur);
  titrePla.innerHTML = `<h2>${t("home.missions_planete")} <span class="solde-inline">💧${jeune ? "" : " " + enf.gouttes}</span></h2>`;
  colB.appendChild(titrePla);
  colB.appendChild(grilleMissions("planete"));

  // Badges (seuls les badges réalisés sont affichés)
  colB.appendChild(blocBadges(enf));

  // Blague du jour (si l'humour est activé par les parents)
  const blg = blocBlagueDuJour();
  if (blg) colB.appendChild(blg);

  // Section discrète (bas de page) : activer le mode révision (uniquement au repos).
  if (!retroActif) c.appendChild(blocVerifJours(enf));
}

// État local (session) du mode « vérification des jours précédents ».
let retroActif = false;
let retroJour = null;

// Active le mode rétroactif après le code PIN parental (ou directement si le
// parent est déjà en mode parents / qu'aucun PIN n'est défini).
function activerModeRetro() {
  const lancer = () => { retroActif = true; retroJour = retroJour || aujourdHui(); rendre(); };
  if (modeParents || !(etat.reglages && etat.reglages.codeParent)) { lancer(); return; }
  demanderPin({
    titre: t("retro.pin_titre"),
    permettreOubli: true,
    onReset: () => lancer(),
    onOk: (saisi) => { if (saisi.trim() !== etat.reglages.codeParent) return false; lancer(); }
  });
}
function quitterModeRetro() { retroActif = false; rendre(); }
// Jour affiché sur l'accueil : le jour en révision si actif, sinon aujourd'hui.
function jourAffiche() { return (retroActif && retroJour) ? retroJour : aujourdHui(); }
function decalerJourRetro(delta) {
  const d = new Date((retroJour || aujourdHui()) + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const cle = dateCle(d);
  if (cle > aujourdHui()) return;     // pas de futur
  retroJour = cle;
  rendre();
}
// Libellé lisible d'un jour (ex. « lundi 16 juin »), dans la langue courante.
function libelleJour(cle) {
  try {
    const d = new Date(cle + "T00:00:00");
    return d.toLocaleDateString(langue, { weekday: "long", day: "numeric", month: "long" });
  } catch { return cle; }
}

// Bloc « vérifier les jours précédents » : discret au repos, déployé une fois
// le code PIN saisi. Permet de cocher/décocher toutes les missions, jour par jour.
/* ---------- Semaine papier (suivi sans écran) ---------- */
// Lundi de la semaine contenant `cle` (AAAA-MM-JJ local).
function debutSemaine(cle) {
  const d = new Date(cle + "T00:00:00");
  const dl = (d.getDay() + 6) % 7;     // 0 = lundi
  d.setDate(d.getDate() - dl);
  return dateCle(d);
}
// Les 7 clés de jour d'une semaine à partir de son lundi.
function joursSemaine(debut) {
  const base = new Date(debut + "T00:00:00");
  const arr = [];
  for (let i = 0; i < 7; i++) { const d = new Date(base); d.setDate(base.getDate() + i); arr.push(dateCle(d)); }
  return arr;
}
// Missions à imprimer/encoder pour un enfant sur la semaine sélectionnée :
// union des missions réellement actives chaque jour (tient compte du plan, de
// la sélection conseillée, de l'activation par enfant et de la PLANIFICATION
// jours/dates). Une mission planifiée le week-end n'apparaît que si elle est
// active au moins un jour de la semaine.
function missionsFeuille(enf, catId) {
  const debut = semainePapierDebut || debutSemaine(aujourdHui());
  const jours = joursSemaine(debut);
  const vues = {};
  jours.forEach(j => {
    missionsActives(enf, catId, j).forEach(m => {
      if (m.speciale !== "coucher") vues[m.id] = m;
    });
  });
  return Object.values(vues);
}
// La mission est-elle planifiée/active pour cet enfant ce jour précis ?
function missionActiveJour(enf, m, jour) {
  return missionActivePourEnfant(enf, m.id) && missionPlanifieeActive(m, enf, jour);
}
