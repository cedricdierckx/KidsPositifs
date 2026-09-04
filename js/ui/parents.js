/* =====================================================================
 * FamiTeam — Espace parents : tâches tournantes, missions du jour, corrections
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * Les réglages quotidiens des parents : tâches tournantes, sélection groupée,
 * missions du jour et leur planification, journal des actions,
 * personnalisation par enfant, corrections d'historique, cartes surprises.
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

/* ---------- Vue Réglages (parents) ---------- */
const histDate = {}; // date sélectionnée pour la correction d'historique, par enfant
const planDate = {}; // date sélectionnée pour les missions du jour, par enfant

// Sélection des missions proposées à un enfant pour un jour donné.
// Tournantes : des tâches effectuées à tour de rôle par les enfants choisis
// (ex. mettre/débarrasser la table, une semaine sur deux entre 2 enfants).
let rotNouv = null;   // brouillon de création (session)
/* ---------- Tournantes, côté parent ----------
 * Une tournante se lit en une phrase : QUI fait QUOI, à quel RYTHME, jusqu'à
 * QUAND, et qui vient ensuite. Le tableau des prochains tours évite d'avoir
 * à faire le calcul de tête. */

// Nom complet d'un jour de semaine (0 = dimanche), dans la langue courante.
// On s'appuie sur une date de référence plutôt que sur une liste traduite :
// une liste de plus à maintenir dans quatre langues serait une liste de trop.
function nomJourSemaine(wd) {
  const d = new Date("2026-07-05T00:00:00");        // un dimanche
  d.setDate(d.getDate() + wd);
  try { return d.toLocaleDateString(langue, { weekday: "long" }); } catch (e) { return String(wd); }
}

// Liste lisible des jours sans tâche : « samedi, dimanche ».
function joursOffLisibles(rot) {
  if (!Array.isArray(rot.joursOff) || !rot.joursOff.length) return "";
  return [1, 2, 3, 4, 5, 6, 0].filter(wd => rot.joursOff.includes(wd)).map(nomJourSemaine).join(", ");
}

// La phrase de résumé, utilisée pour une tournante existante ET pour l'aperçu
// en direct du formulaire de création.
function phraseTournante(rot) {
  const taches = (rot.missions || []).map(id => {
    const m = trouverMission(id); return m ? `${m.emoji} ${titreMission(m)}` : null;
  }).filter(Boolean).join(", ") || "…";
  const prenoms = (rot.enfants || []).map(id => {
    const e = etat.enfants[id]; return e ? echapper(e.prenom) : null;
  }).filter(Boolean);
  const rythme = rot.periode === "jour" ? t("rot.rythme_jour") : t("rot.rythme_semaine");
  const qui = prenoms.length > 1
    ? prenoms.slice(0, -1).join(", ") + " " + t("rot.et") + " " + prenoms[prenoms.length - 1]
    : (prenoms[0] || "…");
  let phrase = t("rot.phrase", { taches, rythme, enfants: qui });
  const off = joursOffLisibles(rot);
  if (off) phrase += " " + t("rot.phrase_off", { jours: off });
  return phrase;
}

function carteTournante(r, jour) {
  const carte = el("div", "rot-item");
  const off = jourOffRotation(r, jour);
  const p = periodeRotation(r, jour);
  const suite = apercuRotation(r, jour, 5);
  const prenomDe = (id) => { const e = etat.enfants[id]; return e ? echapper(e.prenom) : "—"; };

  let html = `<p class="rot-phrase">${phraseTournante(r)}</p>`;
  // Qui, maintenant, et jusqu'à quand.
  html += `<p class="rot-maintenant">${off
    ? "⏸️ " + t("rot.off_auj")
    : "👤 " + t("rot.en_cours", { prenom: prenomDe(suite[0].enfant), jour: jourLisible(p.fin) })}`;
  if (suite[1]) html += ` <span class="rot-ensuite">${t("rot.ensuite", { prenom: prenomDe(suite[1].enfant) })}</span>`;
  html += `</p>`;
  // Le calendrier des prochains tours : plus besoin de compter de tête.
  html += `<span class="rot-apercu-t">${t("rot.apercu")}</span><div class="rot-apercu">` +
    suite.map((x, i) => `<span class="rot-tour${i === 0 ? " en-cours" : ""}">
      <strong>${prenomDe(x.enfant)}</strong>
      <small>${jourLisible(x.debut)}${x.debut !== x.fin ? " → " + jourLisible(x.fin, false) : ""}</small>
    </span>`).join("") + `</div>`;
  html += `<p class="note rot-depuis">${t("rot.depuis", { jour: jourLisible(r.debut || jour) })}</p>`;
  carte.innerHTML = html;

  const sup = el("button", "mini-btn danger", "🗑️");
  sup.setAttribute("aria-label", t("a11y.supprimer"));
  sup.onclick = () => { if (confirm(t("rot.confirm_suppr"))) supprimerRotation(r.id); };
  carte.appendChild(sup);
  return carte;
}

function blocTournantes() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("rot.titre")}</h2><p class="note">${t("rot.note")}</p>`;
  const jour = aujourdHui();

  // --- Tournantes existantes ---
  const liste = etat.rotations || [];
  if (liste.length) {
    liste.forEach(r => sec.appendChild(carteTournante(r, jour)));
  } else {
    sec.appendChild(el("p", "note", t("rot.aucune")));
  }

  // --- Création ---
  if (!rotNouv) rotNouv = { missions: [], enfants: [], periode: "semaine", joursOff: [], bascule: 1 };
  if (typeof rotNouv.bascule !== "number") rotNouv.bascule = 1;   // lundi par défaut
  const { details, corps } = blocPliable(`➕ ${t("rot.creer")}`, false, "rot-creer");
  corps.appendChild(el("p", "note rot-priorite-aide", `💡 ${t("rot.priorite_aide")}`));

  // Missions (cases à cocher, par catégorie)
  corps.appendChild(el("p", "sous-titre", t("rot.choix_missions")));
  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    toutesMissions().filter(m => m.cat === catId && m.speciale !== "coucher").forEach(m => {
      const l = el("label", "switch-ligne");
      const cb = el("input"); cb.type = "checkbox"; cb.checked = rotNouv.missions.includes(m.id);
      cb.onchange = () => {
        if (cb.checked) rotNouv.missions.push(m.id);
        else rotNouv.missions = rotNouv.missions.filter(x => x !== m.id);
      };
      l.appendChild(cb);
      l.appendChild(el("span", null, `${m.emoji} ${titreMission(m)} <small>(${cat.monnaieEmoji})</small>`));
      corps.appendChild(l);
    });
  });

  // Enfants (ordre = ordre de tour ; clic pour ajouter/retirer)
  corps.appendChild(el("p", "sous-titre", t("rot.choix_enfants")));
  const enfRow = el("div", "planif-enfants");
  Object.values(etat.enfants).forEach(e => {
    const pos = rotNouv.enfants.indexOf(e.id);
    const b = el("button", "enf-chip" + (pos >= 0 ? " on" : ""), `${echapper(e.prenom)}${pos >= 0 ? " " + (pos + 1) : ""}`);
    b.onclick = () => {
      if (pos >= 0) rotNouv.enfants.splice(pos, 1);
      else rotNouv.enfants.push(e.id);
      rendre();
    };
    enfRow.appendChild(b);
  });
  corps.appendChild(enfRow);

  // Période
  corps.appendChild(el("p", "sous-titre", t("rot.periode")));
  const perRow = el("div", "segmente");
  [["semaine", "🗓️ " + t("rot.par_semaine")], ["jour", "☀️ " + t("rot.par_jour")]].forEach(([val, lab]) => {
    const b = el("button", "seg" + (rotNouv.periode === val ? " actif" : ""), lab);
    b.onclick = () => { rotNouv.periode = val; rendre(); };
    perRow.appendChild(b);
  });
  corps.appendChild(perRow);
  corps.appendChild(el("p", "note rot-periode-aide", t("rot.periode_aide")));

  // Jours off (aucune tâche ce jour-là, ex. le week-end)
  corps.appendChild(el("p", "sous-titre", t("rot.jours_off")));
  const lettresJ = t("planif.jours_courts").split(",");
  const ordreJ = [1, 2, 3, 4, 5, 6, 0];   // L→D
  const offRow = el("div", "planif-jours");
  ordreJ.forEach((wd, i) => {
    const on = rotNouv.joursOff.includes(wd);
    const b = el("button", "jour-chip" + (on ? " on" : ""), lettresJ[i] || String(wd));
    b.onclick = () => {
      if (on) rotNouv.joursOff = rotNouv.joursOff.filter(x => x !== wd);
      else rotNouv.joursOff.push(wd);
      rendre();
    };
    offRow.appendChild(b);
  });
  corps.appendChild(offRow);

  // Jour de bascule (rythme hebdomadaire) : le tour change ce jour-là.
  let debutPrevu = aujourdHui();
  if (rotNouv.periode === "semaine") {
    corps.appendChild(el("p", "sous-titre", t("rot.bascule")));
    const bascRow = el("div", "planif-jours");
    [1, 2, 3, 4, 5, 6, 0].forEach((wd, i) => {
      const b = el("button", "jour-chip" + (rotNouv.bascule === wd ? " on" : ""), lettresJ[i] || String(wd));
      b.onclick = () => { rotNouv.bascule = wd; rendre(); };
      bascRow.appendChild(b);
    });
    corps.appendChild(bascRow);
    debutPrevu = dernierJourSemaine(aujourdHui(), rotNouv.bascule);
    corps.appendChild(el("p", "note", t("rot.bascule_aide", { jour: nomJourSemaine(rotNouv.bascule) })));
  }

  // Aperçu en direct : la phrase exacte et les premiers tours, AVANT de valider.
  if (rotNouv.missions.length && rotNouv.enfants.length) {
    const projet = {
      missions: rotNouv.missions, enfants: rotNouv.enfants,
      periode: rotNouv.periode, debut: debutPrevu, joursOff: rotNouv.joursOff
    };
    const ap = el("div", "rot-apercu-creation");
    ap.innerHTML = `<p class="sous-titre">${t("rot.apercu_creation")}</p>` +
      `<p class="rot-phrase">${phraseTournante(projet)}</p>`;
    const suite = apercuRotation(projet, aujourdHui(), 4);
    ap.innerHTML += `<div class="rot-apercu">` + suite.map((x, i) => {
      const e = etat.enfants[x.enfant];
      return `<span class="rot-tour${i === 0 ? " en-cours" : ""}"><strong>${e ? echapper(e.prenom) : "—"}</strong>
        <small>${jourLisible(x.debut)}${x.debut !== x.fin ? " → " + jourLisible(x.fin, false) : ""}</small></span>`;
    }).join("") + `</div>`;
    corps.appendChild(ap);
  }

  const bGo = el("button", "gros-bouton planete", t("rot.valider"));
  bGo.onclick = () => {
    if (rotNouv.missions.length < 1) { toast(t("rot.err_mission"), "info"); return; }
    if (rotNouv.enfants.length < 1) { toast(t("rot.err_enfants"), "info"); return; }
    const { missions, enfants, periode, joursOff, bascule } = rotNouv;
    const debut = periode === "semaine" ? dernierJourSemaine(aujourdHui(), bascule) : aujourdHui();
    rotNouv = null;
    ajouterRotation(missions, enfants, periode, debut, joursOff);
    toast(t("rot.creee"), "succes");
  };
  corps.appendChild(bGo);
  sec.appendChild(details);
  return sec;
}

// Sélection groupée : une matrice missions × enfants pour tout cocher d'un
// coup, avec repère visuel de l'adéquation à l'âge de chaque enfant.
function blocSelectionGroupee() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("grp_sel.titre")}</h2><p class="note">${t("grp_sel.note")}</p>`;
  const jour = aujourdHui();
  const enfants = Object.values(etat.enfants);

  // Actions globales.
  const actions = el("div", "grp-actions");
  const mkA = (cls, lab, mode) => {
    const b = el("button", cls, lab);
    b.onclick = () => majSansSaut(() => selectionGroupee(mode));
    return b;
  };
  actions.appendChild(mkA("gros-bouton planete", t("grp_sel.recommande"), "recommande"));
  actions.appendChild(mkA("btn-secondaire", t("grp_sel.tous"), "tous"));
  actions.appendChild(mkA("btn-secondaire", t("grp_sel.aucun"), "aucun"));
  sec.appendChild(actions);
  sec.appendChild(el("p", "note grp-legende", t("grp_sel.legende")));

  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    const ms = toutesMissions().filter(m => m.cat === catId);
    if (!ms.length) return;
    const { details, corps } = blocPliable(`${cat.emoji} ${trData("cat", catId + ".nom", cat.nom)}`, false, "grpsel-" + catId);
    const tbl = el("table", "grp-tbl");
    // En-tête : avatars des enfants.
    let head = `<tr><th class="grp-mlbl"></th>`;
    enfants.forEach(e => { head += `<th><span class="grp-enf" style="--c:${e.couleur}">${vignetteEnfant(e, "mini")}</span></th>`; });
    head += `</tr>`;
    tbl.innerHTML = head;
    ms.forEach(m => {
      const tr = el("tr");
      const lbl = el("td", "grp-mlbl");
      lbl.innerHTML = `${m.emoji} ${titreMission(m)} <small>${t("grp_sel.des_ans", { age: ageMinMission(m) })}</small>`;
      tr.appendChild(lbl);
      enfants.forEach(e => {
        const td = el("td", "grp-cell");
        const reco = age(e) >= ageMinMission(m);          // adapté à l'âge ?
        td.classList.add(reco ? "reco" : "jeune");
        const plan = planEffectif(e, jour);
        const inclus = plan ? plan.includes(m.id) : idsDefaut(e).includes(m.id);
        const cb = el("input"); cb.type = "checkbox"; cb.checked = inclus;
        cb.title = reco ? t("grp_sel.adapte", { prenom: e.prenom }) : t("grp_sel.jeune", { prenom: e.prenom });
        cb.onchange = () => majSansSaut(() => basculerPlan(e, jour, m.id));
        td.appendChild(cb);
        if (!reco) td.appendChild(el("span", "grp-warn", "⚠️"));
        tr.appendChild(td);
      });
      tbl.appendChild(tr);
    });
    corps.appendChild(tbl);
    sec.appendChild(details);
  });
  return sec;
}

function blocMissionsDuJour(enf) {
  const sec = el("section", "carte correction");
  sec.style.setProperty("--c", enf.couleur);
  const jour = planDate[enf.id] || aujourdHui();
  planDate[enf.id] = jour;
  const plan = planEffectif(enf, jour); // null = sélection par défaut
  const defauts = idsDefaut(enf);
  // Nombre de tâches sélectionnées vs conseillé (budget par âge).
  const selIds = (plan || defauts).filter(id => trouverMission(id));
  const totalSel = selIds.length;
  const conseille = tachesConseillees(age(enf));
  const trop = totalSel > conseille;
  sec.innerHTML = `<h2>${t("mdj.titre", { enf: echapper(enf.prenom) })}</h2>
    <p class="note">${t("mdj.note")}</p>
    <p class="note mdj-budget">${t("mdj.budget", { n: conseille, min: budgetMinJour() })}</p>
    <p class="mdj-compte ${trop ? "trop" : "ok"}">${t(trop ? "mdj.trop" : "mdj.compte", { sel: totalSel, n: conseille })}</p>`;

  const lDate = el("label", "champ", t("mdj.a_partir"));
  const iDate = el("input"); iDate.type = "date"; iDate.value = jour;
  iDate.onchange = () => { planDate[enf.id] = iDate.value || jour; rendre(); };
  lDate.appendChild(iDate);
  sec.appendChild(lDate);
  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    const dispo = toutesMissions().filter(m => m.cat === catId);   // toutes proposées
    if (!dispo.length) return;
    const choisis = dispo.filter(m => plan ? plan.includes(m.id) : defauts.includes(m.id)).length;
    // Liste déroulante par catégorie. Ouverte d'emblée : la carte « Missions
    // proposées » étant elle-même repliée, ouvrir puis rouvrir deux fois de
    // suite pour atteindre une case à cocher faisait un geste de trop.
    const { details, corps } = blocPliable(`${cat.emoji} ${trData("cat", catId + ".nom", cat.nom)} · ${choisis}/${dispo.length}`, true, "mdj-" + enf.id + "-" + catId);
    dispo.forEach(m => {
      const inclus = plan ? plan.includes(m.id) : defauts.includes(m.id);
      const ligne = el("label", "switch-ligne");
      const cb = el("input"); cb.type = "checkbox"; cb.checked = inclus;
      cb.onchange = () => majSansSaut(() => basculerPlan(enf, jour, m.id));
      ligne.appendChild(cb);
      ligne.appendChild(el("span", null, `${m.emoji} ${titreMission(m)} (${cat.monnaieEmoji}${pointsMission(enf, m)})`));
      // Édition fine (renommer/points/planification) : réservée au mode expert.
      let editeur = null;
      if (estModeExpert()) {
        const edit = el("button", "mini-btn", "✏️");
        edit.setAttribute("aria-label", t("a11y.modifier"));
        edit.title = t("mdj.modifier");
        editeur = blocEditionMission(m, cat);
        edit.onclick = (e) => {
          e.preventDefault();
          editeur.style.display = editeur.style.display === "none" ? "block" : "none";
        };
        ligne.appendChild(edit);
      }
      if (m.perso) {
        const sup = el("button", "mini-btn danger", "🗑️");
        sup.setAttribute("aria-label", t("a11y.supprimer"));
        sup.title = t("mdj.suppr_perso");
        sup.onclick = (e) => { e.preventDefault(); if (confirm(t("mdj.confirm_suppr", { nom: m.titre }))) supprimerMissionPerso(m.id); };
        ligne.appendChild(sup);
      }
      corps.appendChild(ligne);
      if (editeur) corps.appendChild(editeur);
    });
    sec.appendChild(details);
  });

  const rb = el("button", "btn-secondaire", t("mdj.defaut"));
  rb.onclick = () => reinitPlan(enf, jour);
  sec.appendChild(rb);

  // ----- Ajouter une mission personnalisée -----
  sec.appendChild(el("p", "sous-titre", t("mdj.ajouter_perso")));
  const form = el("div", "mission-perso-form");
  const iTitre = el("input"); iTitre.placeholder = t("mdj.nom_ph"); iTitre.maxLength = 40;
  const iEmoji = el("input"); iEmoji.placeholder = t("mdj.emoji_ph"); iEmoji.maxLength = 12; iEmoji.className = "mp-emoji";
  const iCat = el("select");
  iCat.innerHTML = `<option value="famille">🏡 ${t("cat.famille.nom")} (💛)</option><option value="planete">🌍 ${t("cat.planete.nom")} (💧)</option>`;
  const iPts = el("input"); iPts.type = "number"; iPts.min = "1"; iPts.max = "5"; iPts.value = "1"; iPts.className = "mp-pts";
  const bAdd = el("button", "btn-secondaire", t("mdj.ajouter"));
  bAdd.onclick = () => {
    ajouterMissionPerso(iCat.value, iTitre.value, iEmoji.value, iPts.value);
    iTitre.value = ""; iEmoji.value = "";
  };
  [iTitre, iEmoji, iCat, iPts, bAdd].forEach(x => form.appendChild(x));
  sec.appendChild(form);
  return sec;
}

// Éditeur inline d'une mission (nom, emoji, points) — préexistante ou perso.
function blocEditionMission(m, cat) {
  const box = el("div", "mission-edit");
  box.style.display = "none";
  const iEmoji = el("input"); iEmoji.className = "mp-emoji"; iEmoji.maxLength = 12;
  iEmoji.placeholder = t("mdj.emoji_ph"); iEmoji.value = m.emoji || "";
  const iTitre = el("input"); iTitre.maxLength = 40;
  iTitre.placeholder = t("mdj.nom_ph"); iTitre.value = titreMission(m);
  const iPts = el("input"); iPts.type = "number"; iPts.min = "1"; iPts.max = "9"; iPts.className = "mp-pts";
  iPts.value = m.points;
  const bOk = el("button", "mini-btn ok", t("mdj.enregistrer"));
  bOk.onclick = (e) => {
    e.preventDefault();
    modifierMission(m.id, "emoji", iEmoji.value);
    modifierMission(m.id, "titre", iTitre.value);
    modifierMission(m.id, "points", iPts.value);
  };
  [iEmoji, iTitre, iPts, bOk].forEach(x => box.appendChild(x));
  // Bouton « rétablir » pour les missions intégrées retouchées.
  if (!m.perso) {
    const bReset = el("button", "mini-btn", t("mdj.retablir"));
    bReset.onclick = (e) => { e.preventDefault(); reinitMission(m.id); };
    box.appendChild(bReset);
  }
  // Bloc planification (jours / dates / enfants).
  box.appendChild(blocPlanifMission(m));
  return box;
}

// Planification d'une mission : jours de la semaine (avec préréglages), plage
// de dates, et enfants concernés. Tout vide = mission active pour tous, tous
// les jours, sans limite de dates.
function blocPlanifMission(m) {
  const p = (typeof planifMission === "function" && planifMission(m.id)) || { jours: [], du: "", au: "", enfants: [] };
  const wrap = el("div", "planif");
  wrap.appendChild(el("p", "planif-titre", t("planif.titre")));

  // -- Préréglages rapides + jours de la semaine --
  const presets = el("div", "planif-presets");
  const mkPreset = (label, jours) => {
    const b = el("button", "mini-btn", label);
    b.onclick = (e) => { e.preventDefault(); definirPlanifMission(m.id, "jours", jours.slice()); };
    return b;
  };
  presets.appendChild(mkPreset(t("planif.tous"), []));
  presets.appendChild(mkPreset(t("planif.semaine"), [1, 2, 3, 4, 5]));
  presets.appendChild(mkPreset(t("planif.weekend"), [0, 6]));
  wrap.appendChild(presets);

  // L=1 … D=0 (ordre d'affichage lundi→dimanche)
  const ordre = [1, 2, 3, 4, 5, 6, 0];
  const labels = t("planif.jours_courts").split(",");   // "L,M,M,J,V,S,D"
  const sem = el("div", "planif-jours");
  ordre.forEach((wd, i) => {
    const b = el("button", "jour-chip" + ((p.jours || []).includes(wd) ? " on" : ""), labels[i] || String(wd));
    b.onclick = (e) => { e.preventDefault(); basculerPlanifElement(m.id, "jours", wd); };
    sem.appendChild(b);
  });
  wrap.appendChild(sem);

  // -- Plage de dates --
  const dates = el("div", "planif-dates");
  const lDu = el("label", "champ-mini", t("planif.du"));
  const iDu = el("input"); iDu.type = "date"; iDu.value = p.du || "";
  iDu.onchange = () => definirPlanifMission(m.id, "du", iDu.value || "");
  lDu.appendChild(iDu);
  const lAu = el("label", "champ-mini", t("planif.au"));
  const iAu = el("input"); iAu.type = "date"; iAu.value = p.au || "";
  iAu.onchange = () => definirPlanifMission(m.id, "au", iAu.value || "");
  lAu.appendChild(iAu);
  dates.appendChild(lDu); dates.appendChild(lAu);
  wrap.appendChild(dates);

  // -- Enfants concernés --
  wrap.appendChild(el("p", "planif-sous", t("planif.enfants")));
  const enfRow = el("div", "planif-enfants");
  Object.values(etat.enfants).forEach(enf => {
    const actif = (p.enfants || []).includes(enf.id);
    // vide = tous les enfants ; on coche visuellement « tous » si aucune restriction
    const b = el("button", "enf-chip" + (actif ? " on" : ""), echapper(enf.prenom));
    b.onclick = (e) => { e.preventDefault(); basculerPlanifElement(m.id, "enfants", enf.id); };
    enfRow.appendChild(b);
  });
  wrap.appendChild(enfRow);
  wrap.appendChild(el("p", "note planif-aide", t("planif.aide")));
  return wrap;
}

// Bloc de corrections manuelles pour un enfant (mode parents).
// Journal des dernières actions, avec un bouton « Annuler » par ligne.
// Annuler une action restaure l'état d'avant et invalide les actions plus
// récentes (elles disparaissent du journal).
function blocJournalActions() {
  const sec = el("section", "carte journal-actions");
  sec.innerHTML = `<h2>${t("journal.titre")}</h2>`;
  if (!Array.isArray(journalActions) || journalActions.length === 0) {
    sec.appendChild(el("p", "note", t("journal.vide")));
    return sec;
  }
  sec.appendChild(el("p", "note", t("journal.note")));
  journalActions.forEach((a, idx) => {
    const ligne = el("div", "journal-ligne");
    const quand = heureCourte(a.ts);
    const qui = a.enfant ? `<strong>${a.enfant}</strong> · ` : "";
    ligne.innerHTML = `<span class="journal-info">${qui}${a.libelle} <small>(${quand})</small></span>`;
    const b = el("button", "mini-btn non", t("journal.annuler"));
    // Seule la plus récente est strictement « la dernière » ; annuler une plus
    // ancienne annule aussi celles d'après, on prévient au-delà de la 1ʳᵉ.
    b.onclick = () => {
      if (idx > 0 && !confirm(t("journal.confirm_multi", { n: idx + 1 }))) return;
      annulerAction(a.id);
    };
    ligne.appendChild(b);
    sec.appendChild(ligne);
  });
  return sec;
}

// Heure courte locale HH:MM (pour le journal des actions).
function heureCourte(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Personnalisation fine par enfant : pour chaque enfant, on peut activer /
// désactiver et ajuster (points / coût) chaque mission et chaque espèce.
// Tout est présenté en listes déroulantes imbriquées pour rester compact.
function blocPersonnalisation() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("perso.titre")}</h2><p class="note">${t("perso.note")}</p>`;

  Object.values(etat.enfants).forEach(enf => {
    const { details: dEnf, corps: cEnf } = blocPliable(echapper(enf.prenom), false, "perso-" + enf.id);
    dEnf.style.setProperty("--c", enf.couleur);

    // Écosystème (plantes & animaux) : activer/désactiver + ajuster le coût.
    TIERS_ECO.forEach(tier => {
      cEnf.appendChild(el("p", "sous-titre", `${tier.emoji} ${trData("tier", tier.id, tier.nom)}`));
      tier.especes.forEach(sp => {
        const actif = especeActivePourEnfant(enf, sp.id);
        const ligne = el("div", "perso-ligne" + (actif ? "" : " off"));
        const cb = el("input"); cb.type = "checkbox"; cb.checked = actif;
        cb.onchange = () => majSansSaut(() => definirPersoEspece(enf, sp.id, "actif", cb.checked ? undefined : false));
        const lbl = el("span", "perso-lbl", `${sp.emoji} ${trData("espece", sp.id, sp.nom)}`);
        const cout = el("input", "perso-num"); cout.type = "number"; cout.min = "1";
        cout.inputMode = "numeric"; cout.value = coutEspece(enf, sp);
        cout.onchange = () => definirPersoEspece(enf, sp.id, "cout", Math.max(1, parseInt(cout.value, 10) || sp.cout));
        const unite = el("span", "perso-unite", "💧");
        ligne.appendChild(cb); ligne.appendChild(lbl); ligne.appendChild(cout); ligne.appendChild(unite);
        cEnf.appendChild(ligne);
      });
    });
    const bReset = el("button", "btn-secondaire mini-reset", t("perso.reinit"));
    bReset.onclick = () => { enf.persoEspeces = {}; sauver(); rendre(); };
    cEnf.appendChild(bReset);

    sec.appendChild(dEnf);
  });
  return sec;
}

function blocCorrections(enf) {
  const sec = el("section", "carte correction");
  sec.style.setProperty("--c", enf.couleur);
  sec.innerHTML = `<h2>${t("cor.titre", { enf: echapper(enf.prenom) })}</h2>
    <p class="note">${t("cor.note")}</p>`;

  // -- Ajusteurs de monnaie --
  [["coeurs", "💛 Cœurs"], ["gouttes", "💧 Gouttes"]].forEach(([champ, libelle]) => {
    const l = el("div", "ajusteur");
    l.appendChild(el("span", "aj-label", libelle));
    [-5, -1].forEach(d => { const b = el("button", "mini-btn", d); b.onclick = () => ajusterMonnaie(enf, champ, d); l.appendChild(b); });
    const inp = el("input", "aj-val"); inp.type = "number"; inp.value = enf[champ]; inp.min = 0;
    inp.onchange = () => { fixerMonnaie(enf, champ, inp.value); rendre(); };
    l.appendChild(inp);
    [1, 5].forEach(d => { const b = el("button", "mini-btn", "+" + d); b.onclick = () => ajusterMonnaie(enf, champ, d); l.appendChild(b); });
    sec.appendChild(l);
  });

  // -- Historique rétroactif --
  const jour = histDate[enf.id] || aujourdHui();
  histDate[enf.id] = jour;
  const lDate = el("label", "champ", t("cor.corriger_jour"));
  const iDate = el("input"); iDate.type = "date"; iDate.value = jour; iDate.max = aujourdHui();
  iDate.onchange = () => { histDate[enf.id] = iDate.value; rendre(); };
  lDate.appendChild(iDate);
  sec.appendChild(lDate);

  // Une case à cocher par mission : validée ou pas, jamais plus — comme sur
  // l'écran de l'enfant, une mission ne se valide qu'une fois par jour. Les
  // anciens boutons −/+ laissaient croire qu'on pouvait aller au-delà de 1,
  // un état que le reste de l'app ne prévoit nulle part ailleurs.
  const journalJour = enf.journal[jour] || {};
  const listeHist = el("div", "hist-liste");
  toutesMissions().filter(m => age(enf) >= m.ageMin).forEach(m => {
    const fait = (journalJour[m.id] || 0) > 0;
    const ligne = el("label", "hist-ligne switch-ligne" + (fait ? " valide" : ""));
    const cat = CATEGORIES[m.cat];
    const cb = el("input"); cb.type = "checkbox"; cb.checked = fait;
    cb.onchange = () => modifierHistorique(enf, jour, m, cb.checked ? +1 : -1);
    ligne.appendChild(cb);
    ligne.appendChild(el("span", "h-info", `${emojiOuRepli(m.emoji, m.emojiRepli)} ${titreMission(m)} `
      + `<small>${cat.monnaieEmoji}${pointsMission(enf, m)}</small>`));
    listeHist.appendChild(ligne);
  });
  sec.appendChild(listeHist);

  // -- Badges --
  const hBadges = el("h2", null, t("cor.badges")); hBadges.style.marginTop = "12px";
  sec.appendChild(hBadges);
  if (!enf.badges.length) {
    sec.appendChild(el("p", "note", t("cor.aucun_badge")));
  } else {
    enf.badges.forEach(b => {
      const ligne = el("div", "hist-ligne");
      ligne.innerHTML = `<span class="h-info">${b.emoji} ${b.nom}</span>`;
      const x = el("button", "mini-btn non", t("cor.retirer"));
      x.onclick = () => retirerBadge(enf, b.id);
      ligne.appendChild(x);
      sec.appendChild(ligne);
    });
  }
  if (enf.badgesRetires && enf.badgesRetires.length) {
    const r = el("button", "btn-secondaire", t("cor.reautoriser", { n: enf.badgesRetires.length }));
    r.onclick = () => reactiverBadges(enf);
    sec.appendChild(r);
  }
  const eff = el("button", "btn-secondaire", t("cor.effacer"));
  eff.onclick = () => effacerBadges(enf);
  sec.appendChild(eff);

  return sec;
}

// Tableau de référence (parents) : coût et prérequis de chaque espèce.
function blocEcoReference() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("ecoref.titre")}</h2>
    <p class="note">${t("ecoref.note")}</p>`;
  TIERS_ECO.forEach(tier => {
    // Liste déroulante par palier (plantes / herbivores / carnivores).
    const { details, corps } = blocPliable(`${tier.emoji} ${trData("tier", tier.id, tier.nom)} · ${tier.especes.length}`);
    tier.especes.forEach(sp => {
      const entrees = Object.keys(sp.prereq || {});
      const prereq = entrees.length
        ? entrees.map(id => {
            const info = spInfo(id);
            return `${sp.prereq[id]}× ${info ? info.sp.emoji + " " + trData("espece", info.sp.id, info.sp.nom) : id}`;
          }).join(", ")
        : t("ecoref.aucun");
      const ligne = el("div", "eco-ref-ligne");
      ligne.innerHTML = `<span class="erl-nom">${sp.emoji} ${trData("espece", sp.id, sp.nom)}</span>
        <span class="erl-cout">${sp.cout} 💧</span>
        <span class="erl-prereq">${prereq}</span>`;
      corps.appendChild(ligne);
    });
    sec.appendChild(details);
  });
  return sec;
}

// Gestion des cartes surprises par les parents (créer / modifier / supprimer).
function blocCartesSurprisesParents() {
  const sec = el("section", "carte cartes-surprises-parents");
  const cartes = (etat.cartesSurprises || []);
  let html = `<h2>${t("cs.gestion_titre")}</h2><p class="note">${t("cs.gestion_sous")}</p>`;
  html += `<div class="csp-liste">`;
  cartes.forEach((c, idx) => {
    const titre = trData("carte", c.id, c.titre);
    const activite = trData("carteAct", c.id, c.activite);
    html += `<div class="csp-carte">
      <div class="csp-ligne">
        <input class="csp-emoji" data-champ="emoji" data-id="${c.id}" value="${echapper(c.emoji)}" maxlength="3">
        <input class="csp-titre" data-champ="titre" data-id="${c.id}" value="${echapper(titre)}" placeholder="${t("cs.f_titre")}">
      </div>
      <input class="csp-activite" data-champ="activite" data-id="${c.id}" value="${echapper(activite)}" placeholder="${t("cs.f_activite")}">
      <div class="csp-ligne">
        <label class="csp-coutlbl">${t("cs.prix_label")}
          <input class="csp-cout" type="number" min="1" inputmode="numeric" data-champ="cout" data-id="${c.id}" value="${c.cout}"></label>
        <span class="csp-prog">${t("cs.recolte", { recolte: c.recolte, cout: c.cout })}</span>
      </div>
      <label class="switch-ligne csp-revele">
        <input type="checkbox" data-revele="${c.id}"${c.revele ? " checked" : ""}>
        <span>${t("cs.revele_label")}</span>
      </label>
      ${c.debloquee && !c.faite ? blocRendezVousCarte(c) : ""}
      <div class="csp-actions">
        <button class="mini-btn" data-monter="${c.id}" title="${t("cs.monter")}"${idx === 0 ? " disabled" : ""}>▲</button>
        <button class="mini-btn" data-descendre="${c.id}" title="${t("cs.descendre")}"${idx === cartes.length - 1 ? " disabled" : ""}>▼</button>
        <button class="mini-btn" data-reinit="${c.id}">${t("cs.reinit")}</button>
        <button class="mini-btn danger" data-suppr="${c.id}">${t("cs.supprimer")}</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  // Formulaire d'ajout.
  html += `<div class="csp-ajout">
    <div class="csp-ligne">
      <input class="csp-emoji" id="csp-new-emoji" value="🎁" maxlength="3">
      <input class="csp-titre" id="csp-new-titre" placeholder="${t("cs.f_titre")}">
    </div>
    <input class="csp-activite" id="csp-new-activite" placeholder="${t("cs.f_activite")}">
    <div class="csp-ligne">
      <label class="csp-coutlbl">${t("cs.prix_label")}
        <input class="csp-cout" id="csp-new-cout" type="number" min="1" inputmode="numeric" value="${50 * Object.keys(etat.enfants).length}"></label>
      <button class="btn-secondaire" id="csp-add">${t("cs.f_ajouter")}</button>
    </div>
  </div>`;
  // Bibliothèque d'idées (parentalité positive) groupées par taille.
  const nbEnf = Object.keys(etat.enfants).length || 1;
  // Bibliothèque repliée : c'est la plus longue partie de l'onglet, et elle ne
  // sert qu'au moment où l'on cherche une idée — pas à chaque passage.
  html += `<details class="csp-idees pliable"><summary class="pliable-tete"><h3 class="csp-idees-titre">${t("cs.idees_titre")}</h3></summary>
    <p class="note">${t("cs.idees_sous")}</p>`;
  ["petite", "moyenne", "grande"].forEach(taille => {
    const lot = IDEES_CARTES.filter(i => i.taille === taille);
    if (!lot.length) return;
    html += `<div class="csp-idees-groupe"><h4 class="csp-taille">${t("cs.taille_" + taille)}
      <span class="csp-taille-prix">${50 * (taille === "petite" ? 1 : taille === "moyenne" ? 4 : 20) * nbEnf} 💛</span></h4>
      <div class="csp-idees-liste">`;
    lot.forEach(i => {
      const titre = trData("idee", i.id, i.titre);
      const activite = trData("ideeAct", i.id, i.activite);
      html += `<button class="csp-idee" data-idee="${i.id}" title="${echapper(activite)}">
        <span class="csp-idee-emoji">${i.emoji}</span>
        <span class="csp-idee-txt"><strong>${echapper(titre)}</strong><small>${echapper(activite)}</small></span>
        <span class="csp-idee-plus">＋</span></button>`;
    });
    html += `</div></div>`;
  });
  html += `</details>`;

  sec.innerHTML = html;
  memoriserPli(sec.querySelector("details.csp-idees"), "cs-idees", false);

  // Ajout en un clic depuis une idée proposée.
  sec.querySelectorAll("[data-idee]").forEach(b =>
    b.onclick = () => {
      const idee = IDEES_CARTES.find(i => i.id === b.dataset.idee);
      if (idee) ajouterCarteSurprise(idee.emoji, trData("idee", idee.id, idee.titre),
        trData("ideeAct", idee.id, idee.activite), idee.coutParEnfant * nbEnf, false);
    });

  // Édition en direct (on enregistre à la sortie du champ).
  sec.querySelectorAll("[data-champ]").forEach(inp =>
    inp.onchange = () => modifierCarteSurprise(inp.dataset.id, inp.dataset.champ, inp.value));
  sec.querySelectorAll("[data-revele]").forEach(cb =>
    cb.onchange = () => majSansSaut(() => modifierCarteSurprise(cb.dataset.revele, "revele", cb.checked)));
  // Rendez-vous : la date et l'heure s'enregistrent ensemble, sans quoi saisir
  // l'heure en premier effacerait la date à peine posée.
  const litRdv = (id) => ({
    date: (sec.querySelector(`[data-rdv-date="${id}"]`) || {}).value || "",
    heure: (sec.querySelector(`[data-rdv-heure="${id}"]`) || {}).value || ""
  });
  sec.querySelectorAll("[data-rdv-date]").forEach(inp => inp.onchange = () => {
    const { date, heure } = litRdv(inp.dataset.rdvDate);
    majSansSaut(() => definirDateCarte(inp.dataset.rdvDate, date, heure));
  });
  sec.querySelectorAll("[data-rdv-heure]").forEach(inp => inp.onchange = () => {
    const { date, heure } = litRdv(inp.dataset.rdvHeure);
    majSansSaut(() => definirDateCarte(inp.dataset.rdvHeure, date, heure));
  });
  sec.querySelectorAll("[data-ics]").forEach(b =>
    b.onclick = () => exporterCarteAgenda(b.dataset.ics));
  sec.querySelectorAll("[data-monter]").forEach(b =>
    b.onclick = () => deplacerCarteSurprise(b.dataset.monter, -1));
  sec.querySelectorAll("[data-descendre]").forEach(b =>
    b.onclick = () => deplacerCarteSurprise(b.dataset.descendre, 1));
  sec.querySelectorAll("[data-reinit]").forEach(b =>
    b.onclick = () => reinitCarteSurprise(b.dataset.reinit));
  sec.querySelectorAll("[data-suppr]").forEach(b =>
    b.onclick = () => supprimerCarteSurprise(b.dataset.suppr));
  const add = sec.querySelector("#csp-add");
  if (add) add.onclick = () => ajouterCarteSurprise(
    sec.querySelector("#csp-new-emoji").value,
    sec.querySelector("#csp-new-titre").value,
    sec.querySelector("#csp-new-activite").value,
    sec.querySelector("#csp-new-cout").value);
  return sec;
}
