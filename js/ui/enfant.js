/* =====================================================================
 * FamiTeam — Espace enfant : missions, cartes surprises, badges, statistiques
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * Ce que voit l'enfant : missions du jour, blague et compliment,
 * auto-évaluation, bandeau du soir, cartes surprises et leur rendez-vous, roue
 * de la tâche tournante, badges, statistiques, dons et réparation.
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

// Au repos : un lien discret (PIN) pour activer le mode révision.
// Actif : une bannière compacte (◀ jour ▶ + Terminer) placée en haut de
// l'accueil ; les missions s'adaptent alors directement dans la grille standard.
function blocVerifJours(enf) {
  if (!retroActif) {
    const sec = el("section", "carte verif-jours");
    const b = el("button", "verif-activer", t("retro.activer"));
    b.onclick = () => activerModeRetro();
    sec.appendChild(b);
    return sec;
  }
  retroJour = retroJour || aujourdHui();
  const estAuj = retroJour >= aujourdHui();
  const sec = el("section", "carte revision-banniere");
  sec.innerHTML = `<div class="rev-titre">✏️ ${t("retro.modif_jour")}</div>`;
  const nav = el("div", "verif-nav");
  const prev = el("button", "verif-fleche", "◀"); prev.setAttribute("aria-label", t("a11y.precedent"));
  prev.onclick = () => decalerJourRetro(-1);
  const lbl = el("span", "verif-jour rev-jour", libelleJour(retroJour) + (estAuj ? " · " + t("retro.aujourdhui") : ""));
  const next = el("button", "verif-fleche", "▶"); next.setAttribute("aria-label", t("a11y.suivant"));
  next.disabled = estAuj;
  next.onclick = () => decalerJourRetro(1);
  nav.appendChild(prev); nav.appendChild(lbl); nav.appendChild(next);
  sec.appendChild(nav);
  sec.appendChild(el("p", "note", t("retro.note2")));
  const bq = el("button", "gros-bouton planete", t("retro.quitter"));
  bq.onclick = quitterModeRetro;
  sec.appendChild(bq);
  return sec;
}

// Carte « Blague du jour » : la réponse se révèle au tap (effet surprise).
function blocBlagueDuJour() {
  const b = (typeof blagueDuJourVisible === "function") ? blagueDuJourVisible() : null;
  if (!b) return null;
  const sec = el("section", "carte blague-carte");
  sec.innerHTML = `<h2>${t("blague.titre")}</h2>
    <p class="blague-q">${b.q}</p>`;
  const rep = el("button", "blague-reveal", t("blague.reveler"));
  const rTxt = el("p", "blague-r");
  rTxt.textContent = b.r;
  rTxt.style.display = "none";
  // Avis sur la blague (j'aime / bof) — révélé en même temps que la réponse.
  const avisRow = el("div", "blague-avis");
  avisRow.style.display = "none";
  const majAvis = () => {
    const a = avisBlague(b.idx);
    bUp.classList.toggle("on", a === "up");
    bDown.classList.toggle("on", a === "down");
  };
  const bUp = el("button", "blague-avis-btn", "😂 " + t("blague.jaime"));
  const bDown = el("button", "blague-avis-btn", "😐 " + t("blague.bof"));
  bUp.onclick = () => { definirAvisBlague(b.idx, "up"); majAvis(); if (avisBlague(b.idx) === "up") confettis(); };
  bDown.onclick = () => { definirAvisBlague(b.idx, "down"); majAvis(); };
  avisRow.appendChild(bUp);
  avisRow.appendChild(bDown);
  majAvis();

  rep.onclick = () => {
    rTxt.style.display = "block";
    rep.style.display = "none";
    avisRow.style.display = "flex";
    confettis();
  };
  sec.appendChild(rep);
  sec.appendChild(rTxt);
  sec.appendChild(avisRow);
  return sec;
}

// Compliment du jour (espace parent) : une phrase d'encouragement concrète,
// basée sur la régularité/progression réelle de l'enfant sur une tâche
// précise (esprit « parentalité positive »). Se renouvelle chaque jour.
function blocComplimentDuJour(enf) {
  const sec = el("section", "carte compliment-carte");
  if (!enf) { sec.style.display = "none"; return sec; }
  const c = complimentDuJour(enf);
  if (!c) { sec.style.display = "none"; return sec; }
  sec.innerHTML = `<h2>💌 ${t("compliment.titre")}</h2>
    <p class="compliment-texte">${echapper(c.texte)}</p>
    <p class="note compliment-aide">${t("compliment.aide")}</p>`;
  return sec;
}

// Widget d'évaluation de la journée (Bien / Moyen / Pas top).
// mode "enfant" = auto-évaluation ; mode "parent" = évaluation par un parent.
function blocEval(enf, mode) {
  const sec = el("section", "carte eval-carte");
  // 😄 rayonne la joie · 😐 neutre · 😠 colère
  const CHOIX = [["bien", "😄"], ["moyen", "😐"], ["mauvais", "😠"]];
  // Construit une ligne de choix pour un jour donné.
  const ligneChoix = (courant, onPick) => {
    const row = el("div", "eval-choix");
    CHOIX.forEach(([v, e]) => {
      const b = el("button", "eval-btn eval-" + v + (courant === v ? " actif" : ""), `${e} ${t("eval." + v)}`);
      b.onclick = () => onPick(v);
      row.appendChild(b);
    });
    return row;
  };

  if (mode === "parent") {
    sec.innerHTML = `<h2>${t("eval.titre_parent", { prenom: echapper(enf.prenom) })}</h2>`;
    const base = new Date(aujourdHui() + "T00:00:00");
    // Carte simplifiée : seul « aujourd'hui » est en vue directe, en gros.
    const cleAuj = dateCle(base);
    const courantAuj = (enf.evalParent || {})[cleAuj];
    const ligneAuj = el("div", "eval-jour eval-jour-aujourdhui");
    ligneAuj.appendChild(el("span", "eval-jour-lbl", t("eval.aujourdhui") + (courantAuj ? " ✓" : "")));
    ligneAuj.appendChild(ligneChoix(courantAuj, v => definirEvalParent(enf, v, cleAuj)));
    sec.appendChild(ligneAuj);
    // L'historique (jusqu'à 2 semaines, au lieu de 3 jours) reste disponible
    // mais replié : on ne le consulte que rarement, pour comparer avec
    // l'auto-évaluation dans les statistiques.
    const { details, corps } = blocPliable(t("eval.historique"), false, "eval-hist-" + enf.id);
    for (let i = 1; i < 14; i++) {
      const d = new Date(base); d.setDate(base.getDate() - i);
      const cle = dateCle(d);
      const courant = (enf.evalParent || {})[cle];
      const ligne = el("div", "eval-jour");
      const lbl = i === 1 ? t("eval.hier") : d.toLocaleDateString(langue, { day: "numeric", month: "short" });
      ligne.appendChild(el("span", "eval-jour-lbl", lbl + (courant ? " ✓" : "")));
      ligne.appendChild(ligneChoix(courant, v => definirEvalParent(enf, v, cle)));
      corps.appendChild(ligne);
    }
    sec.appendChild(details);
    return sec;
  }

  // Enfant : le jour affiché (aujourd'hui, ou le jour révisé en mode révision),
  // en grand et expressif.
  sec.className = "carte eval-carte eval-enfant";
  sec.innerHTML = `<h2>${t("eval.titre_enfant")}</h2>`;
  const courant = (enf.autoEval || {})[jourAffiche()];
  const row = el("div", "eval-choix-grand");
  CHOIX.forEach(([v, e]) => {
    const b = el("button", "eval-gros eval-" + v + (courant === v ? " actif" : ""));
    b.innerHTML = `<span class="eval-gros-emoji">${e}</span><span class="eval-gros-lbl">${t("eval." + v)}</span>`;
    b.onclick = () => definirAutoEval(v);
    row.appendChild(b);
  });
  sec.appendChild(row);
  return sec;
}

// Rafraîchit le bandeau dodo (l'ambiance suit l'heure réelle). On ne remplace
// le nœud que si l'affichage change vraiment : inutile de reconstruire le
// bouton « aller au lit » soixante fois par heure en pleine journée.
function majDodo() {
  if (etat.vue !== "accueil") return;
  const ancien = document.getElementById("dodo-bandeau");
  if (!ancien) return;
  const enf = enfantActif();
  if (!enf) return;
  const m = momentDodo(enf);
  const signature = m.classe + "|" + m.progress + "|" + m.heure;
  if (ancien.dataset.dodo === signature) return;
  ancien.replaceWith(bandeauDodo(enf));
}

// Cale le rafraîchissement sur la prochaine minute pleine de l'horloge système
// plutôt que sur un intervalle libre : la bascule orange → nuit tombe ainsi à
// la seconde près sur l'heure du coucher, quelle que soit l'heure de démarrage
// de l'application ou la dérive accumulée par le navigateur.
function planifierDodo() {
  clearTimeout(window.__dodoTimer);
  majDodo();
  const now = new Date();
  const versLaMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
  window.__dodoTimer = setTimeout(planifierDodo, versLaMinute + 30);
}

// Bandeau "dodo" : change d'ambiance selon l'heure et permet de valider
// la mission "aller au lit à l'heure" (toggle, points).
function bandeauDodo(enf) {
  const m = momentDodo(enf);
  const mission = MISSIONS.find(x => x.id === "coucher_lheure");
  const jour = aujourdHui();
  const fait = ((enf.journal[jour] || {})[mission.id] || 0) >= 1;
  const enAttente = enf.enAttente.some(a => a.missionId === mission.id && a.jour === jour);

  // Petite réplique rigolote le soir / la nuit (si l'humour est activé).
  let funDodo = "";
  if (typeof humourActif === "function" && humourActif()) {
    if (m.classe === "dodo-soir") funDodo = `<small class="dodo-fun">${t("dodo.fun_soir")}</small>`;
    else if (m.classe === "dodo-nuit") funDodo = `<small class="dodo-fun">${t("dodo.fun_nuit")}</small>`;
  }

  const sec = el("section", "dodo " + m.classe);
  sec.id = "dodo-bandeau";
  sec.dataset.dodo = m.classe + "|" + m.progress + "|" + m.heure;
  sec.innerHTML = `
    <div class="dodo-etoiles">✦ ✧ ⭐ ✦ ✧ ✦ ✧</div>
    <div class="dodo-txt"><strong>${m.emoji} ${titreMission(m)}</strong><small>🛏️ ${m.heure}</small>${funDodo}</div>
    <div class="dodo-chemin" title="${t("dodo.title")}">
      <span class="dc-bout">☀️</span>
      <div class="dc-piste"><div class="dc-rempli" style="width:${m.progress}%"></div>
        <span class="dc-token" style="left:${m.progress}%">⭐</span></div>
      <span class="dc-bout">🌙</span>
    </div>`;
  const jeune = estJeune(enf);
  const emojiCat = (CATEGORIES[mission.cat] || {}).monnaieEmoji || "💛";
  const ptsDodo = pointsMission(enf, mission);
  const texteAction = jeune
    ? `🛏️ ${pointsVisuels(ptsDodo, emojiCat, true)}`
    : t("dodo.bouton", { pts: ptsDodo });
  const b = el("button", "dodo-btn" + (fait ? " fait" : ""),
    fait ? t("dodo.fait") : (enAttente ? t("dodo.attente") : texteAction));
  b.onclick = () => validerMission(mission);
  sec.appendChild(b);
  return sec;
}

// Grille des missions d'une catégorie, adaptées à l'âge de l'enfant actif.
function grilleMissions(catId) {
  const enf = enfantActif();
  const cat = CATEGORIES[catId];
  const jour = jourAffiche();           // jour en révision (parent) ou aujourd'hui
  const journalJour = enf.journal[jour] || {};
  const liste = el("section", "missions");
  // La mission spéciale "coucher" est affichée à part (bandeau dodo).
  const actives = missionsActives(enf, catId, jour).filter(m => m.speciale !== "coucher");
  if (actives.length === 0) {
    liste.appendChild(el("p", "note", messageVide(t("missions.aucune"))));
    return liste;
  }
  const jeune = estJeune(enf);
  actives.forEach(m => {
    const fait = (journalJour[m.id] || 0) >= 1;
    const enAttente = !retroActif && enf.enAttente.some(a => a.missionId === m.id && a.jour === jour);
    // Tâche de tournante dont c'est le tour de cet enfant : on le dit sur la
    // tuile elle-même, avec la date de fin en infobulle.
    const rotM = rotationsDe(m.id).find(r => (r.enfants || []).includes(enf.id)
      && !jourOffRotation(r, jour) && enfantDeGardeRotation(r, jour) === enf.id);
    const carte = el("button", "mission" + (fait ? " fait" : "") + (enAttente ? " attente" : "")
      + (retroActif ? " revision" : "") + (rotM ? " tour" : ""));
    if (rotM) carte.title = t("rot.jusqu_a", { jour: jourLisible(periodeRotation(rotM, jour).fin) });
    const recompense = pointsVisuels(pointsMission(enf, m), cat.monnaieEmoji, jeune);
    carte.innerHTML = `
      ${rotM ? `<span class="m-tour" aria-label="${t("rot.badge")}">🔁</span>` : ""}
      <span class="m-emoji">${emojiOuRepli(m.emoji, m.emojiRepli)}</span>
      <span class="m-titre">${titreMission(m)}</span>
      <span class="m-points">${fait ? "✅" : (enAttente ? "⏳" : recompense)}</span>`;
    // En révision (parent) : un tap (dé)valide directement pour le jour affiché.
    carte.onclick = () => {
      if (retroActif) {
        const n = (enf.journal[jour] || {})[m.id] || 0;
        majSansSaut(() => modifierHistorique(enf, jour, m, n > 0 ? -1 : +1));
      } else validerMission(m);
    };
    liste.appendChild(carte);
  });
  return liste;
}

// Palette : une couleur distincte par carte surprise.
const CS_COULEURS = ["#f6a623", "#e2566d", "#9b6ef3", "#2bb3c0", "#e88b2f", "#5b8def", "#c05fae", "#39c08a"];

/* ---------- Cartes surprises (objectif d'équipe) ----------
 * Activités à faire en famille, débloquées ensemble par les dons de Cœurs
 * 💛 de tous les enfants. Partagées : le même bloc s'affiche pour chacun. */
function blocCartesSurprises(enf) {
  const sec = el("section", "carte cartes-surprises");
  const cartes = (etat.cartesSurprises || []);
  let html = `<h2>${t("cs.titre")}</h2><p class="cs-sous">${t("cs.sous")}</p>`;
  if (!cartes.length) {
    html += `<p class="note">${t("cs.aucune")}</p>`;
    sec.innerHTML = html;
    return sec;
  }
  // Une activité réalisée n'a plus rien à demander : elle quitte le fil principal
  // et va s'empiler, repliée, tout en bas. On ne la supprime pas — les parents
  // peuvent la réinitialiser, et l'enfant aime revoir ce qui a été fait.
  const faites = [];
  html += `<div class="cs-liste">`;
  cartes.forEach((c, idx) => {
    if (c.faite) { faites.push({ c, idx }); return; }
    const couleur = CS_COULEURS[idx % CS_COULEURS.length];   // couleur propre à chaque carte
    const titre = trData("carte", c.id, c.titre);
    const activite = trData("carteAct", c.id, c.activite);
    const pct = Math.max(0, Math.min(100, Math.round((c.recolte / c.cout) * 100)));
    const reste = Math.max(0, c.cout - c.recolte);
    // Contributions des enfants (esprit d'équipe).
    const dons = Object.keys(c.dons || {})
      .filter(id => etat.enfants[id] && c.dons[id] > 0)
      .map(id => `<span class="cs-contrib-item">${echapper(etat.enfants[id].prenom)} ${c.dons[id]}</span>`)
      .join("");
    // Jauge très visuelle : piste colorée + coureur qui avance vers le cadeau.
    const jauge = `<div class="cs-jauge">
        <div class="cs-jauge-piste">
          <div class="cs-jauge-rempli" style="width:${pct}%"></div>
          <span class="cs-jauge-token" style="left:${pct}%">${c.debloquee ? "🎉" : "⭐"}</span>
          <span class="cs-jauge-but">${c.debloquee ? "🎁" : "🔒"}</span>
        </div>
        <div class="cs-jauge-bas"><span class="cs-jauge-chiffres">${c.recolte} / ${c.cout} 💛</span>
          <span class="cs-jauge-pct">${pct}%</span></div>
      </div>`;

    const visible = c.debloquee || c.revele;   // carte montrée (sinon : mystère)
    html += `<div class="cs-carte${c.debloquee ? " ouverte" : (visible ? " visible" : " mystere")}" style="--cs-c:${couleur}">`;
    if (c.debloquee) {
      // Carte DÉBLOQUÉE (jauge pleine) : activité + invitation à la faire.
      html += `<div class="cs-tete"><span class="cs-emoji">${c.emoji}</span>
          <span class="cs-titre">${echapper(titre)}</span>
          <span class="cs-prix">${t("cs.debloquee")}</span></div>
        ${jauge}
        <p class="cs-activite">${echapper(activite)}</p>`;
      // Décompte : « dans 3 dodos » chez les petits, « dans 3 jours » dès que
      // l'enfant lit un calendrier (voir texteDecompteCarte). Tant qu'aucun
      // jour n'est fixé, on garde l'invitation à le faire — mais sans jamais
      // l'annoncer à l'enfant.
      const jRdv = joursAvantCarte(c);
      if (jRdv !== null) {
        html += `<p class="cs-rdv${jRdv <= 1 && jRdv >= 0 ? " proche" : ""}">
          ${jRdv < 0 ? "🎈" : "📅"} ${texteDecompteCarte(jRdv, estJeune(enf))}
          <small>${jourLisible(c.prevueLe, true)}${c.prevueHeure ? " · " + echapper(c.prevueHeure) : ""}</small></p>`;
      } else {
        html += `<p class="cs-afaire">${t("cs.a_faire")}</p>`;
      }
      // Fixer la date se fait ici, là où la carte se regarde — mais derrière le
      // code PIN : c'est un engagement de parent, pas un vœu d'enfant.
      html += `<button class="btn-secondaire cs-plan-btn" data-plan="${c.id}">📅 ${t(c.prevueLe ? "cs.rdv_modifier" : "cs.rdv_planifier")}</button>
        <button class="btn-secondaire cs-faite-btn" data-faite="${c.id}">${t("cs.faite_btn")}</button>`;
    } else {
      // Carte EN COURS : soit visible (objectif montré), soit mystère (caché).
      if (visible) {
        html += `<div class="cs-tete"><span class="cs-emoji">${c.emoji}</span>
          <span class="cs-titre">${echapper(titre)}</span>
          <span class="cs-prix">❓</span></div>
          <p class="cs-mystere-sous">${echapper(activite)}</p>`;
      } else {
        html += `<div class="cs-tete"><span class="cs-emoji cs-mystere-emoji">🎁</span>
          <span class="cs-titre">${t("cs.mystere")}</span>
          <span class="cs-prix">❓</span></div>
          <p class="cs-mystere-sous">${t("cs.mystere_sous")}</p>`;
      }
      html += `${jauge}
        <p class="cs-reste">${t("cs.reste", { reste })}</p>
        <div class="cs-dons">
          <button class="cs-don" data-don="${c.id}" data-montant="1">${t("cs.donner1")}</button>
          <button class="cs-don" data-don="${c.id}" data-montant="5">${t("cs.donner5")}</button>
          <button class="cs-don" data-don="${c.id}" data-montant="10">${t("cs.donner10")}</button>
        </div>`;
    }
    if (dons) html += `<div class="cs-contrib">${dons}</div>`;
    html += `</div>`;
  });
  html += `</div>`;

  // Le tiroir des activités faites : fermé par défaut, il ne prend qu'une ligne.
  if (faites.length) {
    html += `<details class="pliable cs-faites"><summary class="pliable-tete">${
      t("cs.faites_titre", { n: faites.length })}</summary><div class="pliable-corps">`;
    faites.forEach(({ c }) => {
      const titre = trData("carte", c.id, c.titre);
      const quand = c.faiteLe ? jourLisible(c.faiteLe, true) : "";
      html += `<div class="cs-faite-l">
        <span class="cs-faite-emoji">${c.emoji}</span>
        <span class="cs-faite-nom">${echapper(titre)}</span>
        ${quand ? `<span class="cs-faite-quand">${quand}</span>` : ""}
        <span class="cs-faite-ok">✅</span>
      </div>`;
    });
    html += `</div></details>`;
  }

  sec.innerHTML = html;
  memoriserPli(sec.querySelector("details.cs-faites"), "cs-faites", false);
  // Actions : dons (limités aux Cœurs disponibles de l'enfant actif) + "fait".
  sec.querySelectorAll(".cs-don").forEach(b => {
    const montant = parseInt(b.dataset.montant, 10);
    if (enf.coeurs < montant) b.disabled = true;
    b.onclick = () => donnerCarte(b.dataset.don, montant);
  });
  sec.querySelectorAll(".cs-faite-btn").forEach(b =>
    b.onclick = () => marquerCarteFaite(b.dataset.faite));
  sec.querySelectorAll(".cs-plan-btn").forEach(b =>
    b.onclick = () => planifierCarteSurprise(b.dataset.plan));
  return sec;
}

// Fixer la date d'une carte gagnée : réservé aux parents. Même porte que le
// mode rétroactif — code PIN s'il en existe un, accès direct sinon.
function planifierCarteSurprise(id) {
  const lancer = () => modaleRendezVousCarte(id);
  if (modeParents || !(etat.reglages && etat.reglages.codeParent)) { lancer(); return; }
  demanderPin({
    titre: t("cs.rdv_pin"),
    permettreOubli: true,
    onReset: () => lancer(),
    onOk: (saisi) => { if (saisi.trim() !== etat.reglages.codeParent) return false; lancer(); }
  });
}

function modaleRendezVousCarte(id) {
  const c = trouverCarteSurprise(id);
  if (!c || !c.debloquee) return;
  const ov = el("div", "pin-modal");
  ov.innerHTML = `
    <div class="pin-carte">
      <button class="modale-fermer" aria-label="${t("common.fermer")}">✕</button>
      <div class="pin-titre">${t("cs.rdv_titre")}</div>
      <p class="note">${c.emoji} ${echapper(trData("carte", c.id, c.titre))}</p>
      <div class="csp-ligne">
        <input class="csp-rdv-date" id="rdv-date" type="date" value="${c.prevueLe || ""}">
        <input class="csp-rdv-heure" id="rdv-heure" type="time" value="${c.prevueHeure || ""}">
      </div>
      <p id="rdv-decompte" class="csp-rdv-decompte"></p>
      <button id="rdv-ics" class="btn-secondaire">📅 ${t("cs.rdv_agenda")}</button>
      <p class="note">${t("cs.rdv_note")}</p>
    </div>`;
  document.body.appendChild(ov);
  const fermer = () => ov.remove();
  ov.querySelector(".modale-fermer").onclick = fermer;
  ov.addEventListener("click", e => { if (e.target === ov) fermer(); });

  const iDate = ov.querySelector("#rdv-date");
  const iHeure = ov.querySelector("#rdv-heure");
  const zone = ov.querySelector("#rdv-decompte");
  const bIcs = ov.querySelector("#rdv-ics");
  const rafraichir = () => {
    const j = joursAvantCarte(c);
    zone.textContent = j === null ? "" : texteDecompteCarte(j);
    zone.className = "csp-rdv-decompte" + (j !== null && j < 0 ? " passe" : "");
    bIcs.disabled = !c.prevueLe;
  };
  // Date et heure s'enregistrent ensemble : saisir l'heure d'abord effacerait
  // sinon la date à peine posée.
  const enregistrer = () => { definirDateCarte(id, iDate.value, iHeure.value); rafraichir(); };
  iDate.onchange = enregistrer;
  iHeure.onchange = enregistrer;
  bIcs.onclick = () => exporterCarteAgenda(id);
  rafraichir();
}

/* ---------- Rendez-vous d'une carte gagnée ----------
 * Une carte débloquée qui ne devient pas une date reste une promesse en l'air.
 * Les parents fixent le jour ; l'enfant, lui, ne voit qu'un décompte.
 */
function blocRendezVousCarte(c) {
  const j = joursAvantCarte(c);
  const decompte = j === null ? "" :
    `<p class="csp-rdv-decompte${j < 0 ? " passe" : ""}">${texteDecompteCarte(j)}</p>`;
  return `<div class="csp-rdv">
    <p class="csp-rdv-titre">${t("cs.rdv_titre")}</p>
    <div class="csp-ligne">
      <input class="csp-rdv-date" type="date" data-rdv-date="${c.id}" value="${c.prevueLe || ""}">
      <input class="csp-rdv-heure" type="time" data-rdv-heure="${c.id}" value="${c.prevueHeure || ""}">
    </div>
    ${decompte}
    <button class="btn-secondaire csp-rdv-ics" data-ics="${c.id}"${c.prevueLe ? "" : " disabled"}>📅 ${t("cs.rdv_agenda")}</button>
    <p class="note csp-rdv-note">${t("cs.rdv_note")}</p>
  </div>`;
}

// Décompte avant une carte gagnée.
//
// « Dans 3 dodos » est l'unité de temps d'un JEUNE enfant : à 4 ans, une date
// ne veut rien dire, un nombre de nuits si. Passé 7-8 ans, c'est l'inverse —
// l'enfant lit un calendrier, et « dodos » sonne bébé, ce qui suffit à lui
// faire décrocher de l'app (voir PLAN-COMMERCIAL.md § 2.2). D'où le second
// paramètre : le libellé enfantin ne sort QUE si l'enfant qui regarde est
// jeune au sens de estJeune() — seuil réglable par les parents.
//
// `jeune` vaut false par défaut, et c'est voulu : les deux autres appelants
// sont des écrans PARENTS (bloc parents, modale de date), où « dans 3 jours »
// est de toute façon la bonne formulation.
function texteDecompteCarte(j, jeune) {
  if (j < 0) return t("cs.rdv_passe");
  if (j === 0) return t("cs.rdv_aujourdhui");
  if (j === 1) return t("cs.rdv_demain");
  return t(jeune ? "cs.rdv_dans" : "cs.rdv_dans_j", { n: j });
}

// Envoi vers l'agenda : un fichier .ics, que tous les agendas savent ouvrir —
// iOS, Android, Outlook, Google. Pas de compte à connecter, rien à autoriser.
async function exporterCarteAgenda(id) {
  const c = trouverCarteSurprise(id);
  if (!c) return;
  const titre = trData("carte", c.id, c.titre);
  const activite = trData("carteAct", c.id, c.activite);
  const ics = icsCarteSurprise(c, titre, activite);
  if (!ics) { toast(t("cs.rdv_sans_date"), "info"); return; }
  const champs = champsCarteSurprise(c, titre, activite);
  const resultat = await envoyerVersAgenda(champs, ics, "famiteam-" + c.id + ".ics", (c.emoji || "🎁") + " " + titre);
  // Le parent doit savoir ce qui vient de se passer : sans retour, un
  // téléphone qui ouvre l'agenda derrière l'app ressemble à un bouton mort.
  if (!resultat) { toast(t("cs.rdv_echec"), "info"); return; }
  if (resultat.voie === "calendrier") toast(t("cs.rdv_calendrier"), "ok");
  else if (resultat.voie === "natif") toast(t("cs.rdv_ouvert"), "ok");
  else toast(t("cs.rdv_fichier"), "ok");
}

// Date en toutes lettres, courte et lisible par un enfant : « dimanche 2 août ».
function jourLisible(cle, avecMois) {
  try {
    const d = new Date(cle + "T00:00:00");
    return d.toLocaleDateString(langue, avecMois === false
      ? { weekday: "long" }
      : { weekday: "long", day: "numeric", month: "long" });
  } catch (e) { return cle; }
}

/* ---------- Tournantes, côté enfant ----------
 * Une tâche qui apparaît ou disparaît sans explication est vécue comme
 * arbitraire. Cette carte répond, pour chaque tournante à laquelle l'enfant
 * participe, aux trois questions : c'est le tour de qui, jusqu'à quand, et
 * quand revient le mien. Elle s'affiche AU-DESSUS des missions. */
// Point sur un cercle : angle en degrés, 0° = midi (haut), sens horaire.
function _pointRoue(cx, cy, rayon, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return [cx + rayon * Math.cos(rad), cy + rayon * Math.sin(rad)];
}
// Mini-roue tournante (SVG) : un secteur coloré par enfant de la tournante,
// SON AVATAR (le même qu'ailleurs dans l'app, pas un émoji générique), un
// repère fixe en haut (triangle rouge pointant VERS le disque), et le disque
// qui tourne pour amener l'enfant de garde sous ce repère. Le disque part
// posé sur la bonne réponse (style inline) : l'animation elle-même est
// déclenchée à part, quand la roue entre réellement dans l'écran — voir
// observerRoues()/jouerRoue(). Purement décorative (l'info est déjà donnée
// par le texte à côté) : cachée aux lecteurs d'écran.
function roueTournante(ids, idGarde, taille) {
  taille = taille || 104;
  const cx = 60, cy = 60, rayon = 52;
  // Ordre INVERSÉ pour le seul positionnement visuel : avec l'ordre direct,
  // "le suivant chronologique" (le prochain à prendre le relais) atterrissait
  // à droite du repère, ce qui a été signalé comme lisant "à l'envers" —
  // vérifié avant/après par rendu réel (Chromium headless) : avec l'ordre
  // inversé, le suivant atterrit à GAUCHE et le précédent à DROITE. Aucune
  // autre logique (qui est de garde aujourd'hui, quelles tâches, etc.) n'est
  // affectée : ceci ne change que l'agencement des secteurs de LA ROUE.
  const enfants = ids.slice().reverse().map(id => etat.enfants[id]).filter(Boolean);
  const n = enfants.length;
  if (!n) return "";
  const step = 360 / n;
  const idx = Math.max(0, enfants.findIndex(e => e.id === idGarde));
  const angleCible = -((idx + 0.5) * step);

  let secteurs = "";
  if (n === 1) {
    secteurs = `<circle cx="${cx}" cy="${cy}" r="${rayon}" fill="${enfants[0].couleur || "#ccc"}"/>`;
  } else {
    enfants.forEach((e, i) => {
      const [x0, y0] = _pointRoue(cx, cy, rayon, i * step);
      const [x1, y1] = _pointRoue(cx, cy, rayon, (i + 1) * step);
      secteurs += `<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${rayon},${rayon} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${e.couleur || "#ccc"}" stroke="#fff" stroke-width="2"/>`;
    });
  }
  // Les avatars sont VOLONTAIREMENT en dehors du groupe qui tourne : sinon ils
  // pivoteraient avec le disque et se retrouveraient de travers (voire tête en
  // bas) selon l'angle d'arrivée. On calcule directement leur position
  // D'ARRIVÉE (angle du secteur + rotation cible) pour qu'ils restent toujours
  // droits, alignés sur leur secteur une fois la roue posée. Chaque avatar est
  // la même mini-scène SVG (buildAvatar) qu'ailleurs dans l'app, imbriquée et
  // mise à l'échelle (aucun identifiant interne dans avatar.js : pas de risque
  // de collision entre plusieurs avatars dans le même document).
  const TAILLE_AV = 34;
  const avatars = enfants.map((e, i) => {
    const angleFinal = (i + 0.5) * step + angleCible;
    const [ex, ey] = _pointRoue(cx, cy, rayon * 0.6, angleFinal);
    return buildAvatar(e.avatar).replace("<svg ",
      `<svg x="${(ex - TAILLE_AV / 2).toFixed(1)}" y="${(ey - TAILLE_AV / 2).toFixed(1)}" width="${TAILLE_AV}" height="${TAILLE_AV}" `);
  }).join("");

  return `<svg class="roue-svg" width="${taille}" height="${taille}" viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${rayon + 3}" fill="none" stroke="#e3edf5" stroke-width="3"/>
    <g class="roue-groupe" data-angle-cible="${angleCible}" style="transform:rotate(${angleCible}deg)">${secteurs}</g>
    <g class="roue-avatars">${avatars}</g>
    <polygon class="roue-pointeur" points="60,19 49,1 71,1"/>
  </svg>`;
}

// Anime une roue précise : rotation (avec petit rebond à l'atterrissage) +
// apparition des avatars une fois le disque quasiment posé. Web Animations
// API plutôt que CSS : on calcule l'angle cible exact en JS et on ne joue
// l'anim QUE quand jouerRoue() est appelée (voir observerRoues), jamais au
// chargement de la page.
function jouerRoue(svg) {
  const groupe = svg.querySelector(".roue-groupe");
  if (!groupe || typeof groupe.animate !== "function") return;
  const cible = parseFloat(groupe.dataset.angleCible || "0");
  groupe.animate([
    { transform: "rotate(0deg)" },
    { transform: `rotate(${cible + 1080 + 18}deg)`, offset: 0.7 },
    { transform: `rotate(${cible + 1080 - 8}deg)`, offset: 0.85 },
    { transform: `rotate(${cible + 1080}deg)` }
  ], { duration: 2100, easing: "cubic-bezier(.15,.7,.13,1)", fill: "forwards" });
  const avatars = svg.querySelector(".roue-avatars");
  if (avatars && typeof avatars.animate === "function") {
    avatars.animate(
      [{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }],
      { duration: 2100, fill: "forwards" }
    );
  }
}

// Observe les roues présentes dans la page et déclenche leur animation la
// PREMIÈRE fois qu'elles entrent réellement dans la zone visible de l'écran
// (pas au chargement, qui peut se produire hors champ si la carte est plus
// bas que l'écran). Rejoué une seule fois par roue. Respecte le réglage
// système « mouvement réduit » : dans ce cas, la roue reste simplement sur
// sa position finale (déjà posée via le style inline), sans animation.
function observerRoues() {
  const roues = document.querySelectorAll(".roue-svg:not([data-roue-vue])");
  if (!roues.length) return;
  const reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduit || typeof IntersectionObserver === "undefined") {
    roues.forEach(svg => svg.setAttribute("data-roue-vue", "1"));
    return;
  }
  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach(entree => {
      if (!entree.isIntersecting) return;
      jouerRoue(entree.target);
      entree.target.setAttribute("data-roue-vue", "1");
      obs.unobserve(entree.target);
    });
  }, { threshold: 0.4 });
  roues.forEach(svg => obs.observe(svg));
}

function blocTournanteEnfant(enf) {
  const jour = jourAffiche();
  const rots = (etat.rotations || []).filter(r => (r.enfants || []).includes(enf.id));
  if (!rots.length) return null;

  const sec = el("section", "carte tournante-carte");
  // Deux groupes bien distincts : ce qui est SON tour (important, mis en
  // avant) et ce qui concerne un frère/une sœur ou un jour sans tâche
  // (purement informatif, en retrait — roue plus petite, section repliée
  // visuellement sous un intitulé).
  let htmlMoi = "", htmlAutres = "";
  rots.forEach(r => {
    const taches = (r.missions || []).map(id => {
      const m = trouverMission(id);
      return m ? `${m.emoji} ${titreMission(m)}` : null;
    }).filter(Boolean).join(", ");
    if (!taches) return;

    const p = periodeRotation(r, jour);
    const garde = enfantDeGardeRotation(r, jour);
    const off = jourOffRotation(r, jour);
    const suivant = apercuRotation(r, jour, 2)[1];
    const prenomDe = (id) => { const e = etat.enfants[id]; return e ? echapper(e.prenom) : "—"; };

    if (off) {
      htmlAutres += `<div class="tr-bloc off"><div class="tr-roue-wrap"></div><div class="tr-texte">
        <div class="tr-titre">🔁 ${t("rot.off_titre")}</div>
        <div class="tr-taches">${taches}</div>
        <div class="tr-quand">${t("rot.off_txt")}</div></div></div>`;
    } else if (garde === enf.id) {
      const roue = roueTournante(r.enfants, garde, 104);
      const ensuite = (suivant && suivant.enfant !== enf.id)
        ? " " + t("rot.ensuite_enf", { prenom: prenomDe(suivant.enfant) }) : "";
      htmlMoi += `<div class="tr-bloc moi"><div class="tr-roue-wrap">${roue}</div><div class="tr-texte">
        <div class="tr-titre">🔁 ${t("rot.moi_titre")}</div>
        <div class="tr-taches">${taches}</div>
        <div class="tr-quand">${t("rot.jusqu_a", { jour: jourLisible(p.fin) })}${ensuite}</div></div></div>`;
    } else {
      // « Ton tour revient lundi 27 » ET « et demain c'est toi » disaient la
      // même chose deux fois : quand le tour commence demain, on ne dit que ça.
      const roue = roueTournante(r.enfants, garde, 68);
      const mien = prochainTourRotation(r, enf.id, jour);
      const demainMonTour = !!mien && mien.debut === demain(jour);
      const quand = !mien ? ""
        : (demainMonTour ? `🌙 ${t("rot.ton_tour_demain")}`
                         : t("rot.ton_tour", { jour: jourLisible(mien.debut) }));
      htmlAutres += `<div class="tr-bloc autre${demainMonTour ? " demain" : ""}"><div class="tr-roue-wrap">${roue}</div><div class="tr-texte">
        <div class="tr-titre">🔁 ${t("rot.autre_titre", { prenom: prenomDe(garde) })}</div>
        <div class="tr-taches">${taches}</div>
        <div class="tr-quand">${quand}</div></div></div>`;
    }
  });
  if (!htmlMoi && !htmlAutres) return null;

  let html = "";
  if (htmlMoi) html += `<div class="tr-groupe tr-groupe-moi">${htmlMoi}</div>`;
  if (htmlAutres) html += `<div class="tr-groupe tr-groupe-autres">
    <p class="tr-section-titre">👨‍👩‍👧 ${t("rot.section_famille")}</p>${htmlAutres}</div>`;

  sec.innerHTML = html;
  return sec;
}

// Badges : médailles colorées — seuls les badges RÉALISÉS sont affichés.
function blocBadges(enf) {
  const gagnes = new Set((enf.badges || []).map(b => b.id));
  // On suit l'ordre du catalogue, mais on ne garde que les badges obtenus.
  const obtenus = BADGES_CATALOGUE.filter(b => gagnes.has(b.id));
  const sec = el("section", "carte badges-carte");
  let html = `<h2>${t("home.mes_badges")} <span class="badges-compteur">${obtenus.length}</span></h2>`;
  if (!obtenus.length) {
    html += `<p class="note">${t("badges.aucun")}</p>`;
    sec.innerHTML = html;
    return sec;
  }
  html += `<div class="badges-grid">`;
  obtenus.forEach(b => {
    const nom = trData("badge", b.id, b.nom);
    html += `<div class="badge-fun gagne" title="${echapper(nom)}">
      <div class="badge-medaille"><span class="badge-emoji">${b.emoji}</span></div>
      <div class="badge-nom">${echapper(nom)}</div>
    </div>`;
  });
  html += `</div>`;
  sec.innerHTML = html;
  return sec;
}

/* ---------- Statistiques (espace parents) ---------- */
// Points gagnés par jour sur les `nbJours` derniers jours, à partir du journal.
function statsJournalieres(enf, nbJours) {
  const out = [];
  const base = new Date(aujourdHui() + "T00:00:00");
  for (let i = nbJours - 1; i >= 0; i--) {
    const d = new Date(base); d.setDate(base.getDate() - i);
    const cle = dateCle(d);
    const j = enf.journal[cle] || {};
    let coeurs = 0, gouttes = 0;
    Object.keys(j).forEach(mid => {
      const m = (typeof trouverMission === "function") ? trouverMission(mid) : null;
      if (!m) return;
      const pts = pointsMission(enf, m) * j[mid];
      if (m.cat === "planete") gouttes += pts; else coeurs += pts;
    });
    out.push({ cle, coeurs, gouttes, total: coeurs + gouttes });
  }
  return out;
}

// Ensemble des dates actives (clés du journal).
function joursActifsSet(enf) { return new Set(Object.keys(enf.journal || {})); }
// Série actuelle de jours consécutifs actifs (jusqu'à aujourd'hui/hier).
function serieActuelle(enf) {
  const set = joursActifsSet(enf);
  const base = new Date(aujourdHui() + "T00:00:00");
  // On tolère un démarrage hier (si rien fait aujourd'hui encore).
  let depart = 0;
  if (!set.has(dateCle(base))) depart = 1;
  let streak = 0;
  const d = new Date(base); d.setDate(base.getDate() - depart);
  while (set.has(dateCle(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
// Plus longue série de jours consécutifs jamais réalisée.
function meilleureSerie(enf) {
  const dates = Object.keys(enf.journal || {}).sort();
  let best = 0, cur = 0, prev = null;
  dates.forEach(c => {
    if (prev) { const diff = (new Date(c) - new Date(prev)) / 86400000; cur = diff === 1 ? cur + 1 : 1; }
    else cur = 1;
    best = Math.max(best, cur); prev = c;
  });
  return best;
}
// Nombre de jours actifs sur les n derniers jours (régularité).
function actifsDerniers(enf, n) {
  const set = joursActifsSet(enf);
  const base = new Date(aujourdHui() + "T00:00:00");
  let cpt = 0;
  for (let i = 0; i < n; i++) { const d = new Date(base); d.setDate(base.getDate() - i); if (set.has(dateCle(d))) cpt++; }
  return cpt;
}
// Missions les plus réalisées (toutes périodes) : [[id, n], ...].
function topMissions(enf, k) {
  const cpt = {};
  Object.values(enf.journal || {}).forEach(j => Object.keys(j).forEach(mid => cpt[mid] = (cpt[mid] || 0) + j[mid]));
  return Object.entries(cpt).sort((a, b) => b[1] - a[1]).slice(0, k);
}
// Jours écoulés depuis la dernière activité (null si jamais).
function joursDepuisActivite(enf) {
  const dates = Object.keys(enf.journal || {}).sort();
  if (!dates.length) return null;
  const last = new Date(dates[dates.length - 1] + "T00:00:00");
  return Math.round((new Date(aujourdHui() + "T00:00:00") - last) / 86400000);
}

// Comportement : nb de missions réalisées par domaine (entraide / écologie).
function missionsParCat(enf) {
  let fam = 0, pla = 0;
  Object.values(enf.journal || {}).forEach(j => Object.keys(j).forEach(mid => {
    const m = (typeof trouverMission === "function") ? trouverMission(mid) : null;
    if (!m) return;
    if (m.cat === "planete") pla += j[mid]; else fam += j[mid];
  }));
  return { fam, pla, total: fam + pla };
}

// Espace statistiques : évolution de chaque enfant (utile aussi pour un suivi
// psychologique : régularité, persévérance, équilibre prosocial/écologique).
function blocStatistiques() {
  const wrap = el("div");
  const intro = el("section", "carte");
  intro.innerHTML = `<h2>${t("stats.titre")}</h2><p class="note">${t("stats.sous")}</p>`;
  wrap.appendChild(intro);

  const NB = 14;
  Object.values(etat.enfants).forEach(enf => {
    const sec = el("section", "carte stat-enfant");
    sec.style.setProperty("--c", enf.couleur);
    const joursActifs = Object.keys(enf.journal).length;

    if (!joursActifs) {
      sec.innerHTML = `<h3 class="stat-nom">${echapper(enf.prenom)}</h3>
        <p class="note">${t("stats.aucune")}</p>`;
      wrap.appendChild(sec);
      return;
    }

    const jours = statsJournalieres(enf, NB);
    const max = Math.max(1, ...jours.map(d => d.total));
    const semaine = jours.slice(7).reduce((s, d) => s + d.total, 0);
    const semainePrec = jours.slice(0, 7).reduce((s, d) => s + d.total, 0);
    const diff = semaine - semainePrec;
    const tendance = diff > 0 ? `▲ +${diff}` : (diff < 0 ? `▼ ${diff}` : "→ =");
    const tendCls = diff > 0 ? "up" : (diff < 0 ? "down" : "flat");

    // Indicateurs de suivi.
    const serie = serieActuelle(enf);
    const record = meilleureSerie(enf);
    const reg30 = actifsDerniers(enf, 30);
    const totalPts = enf.coeursTotal + enf.gouttesTotal;
    const moyenne = Math.round(totalPts / joursActifs);
    const depuis = joursDepuisActivite(enf);
    const pctFam = totalPts ? Math.round((enf.coeursTotal / totalPts) * 100) : 50;
    const pctPla = 100 - pctFam;

    let html = `<h3 class="stat-nom">${echapper(enf.prenom)} <small>(${t("home.ans", { age: age(enf) })})</small></h3>
      <div class="stat-chiffres">
        <span class="stat-puce">💛 ${enf.coeursTotal}</span>
        <span class="stat-puce">💧 ${enf.gouttesTotal}</span>
        <span class="stat-puce">🏆 ${enf.badges.length}</span>
        <span class="stat-puce">🌳 ${nbTotalEspeces(enf)}</span>
        <span class="stat-puce">🔥 ${t("stats.serie", { n: serie, r: record })}</span>
        <span class="stat-puce">📅 ${t("stats.regularite", { n: reg30 })}</span>
        <span class="stat-puce">📈 ${t("stats.moyenne", { n: moyenne })}</span>
        <span class="stat-puce">⏱️ ${depuis === 0 ? t("stats.actif_auj") : t("stats.depuis", { n: depuis })}</span>
      </div>

      <p class="stat-graph-titre">${t("stats.points_14j")}
        <span class="stat-tendance ${tendCls}">${tendance}</span></p>
      <div class="stat-graph">`;
    jours.forEach(d => {
      const h = Math.round((d.total / max) * 100);
      html += `<div class="stat-col" title="${d.cle} · ${d.total} pts (💛${d.coeurs} 💧${d.gouttes})">
        <div class="stat-bar" style="height:${h}%"></div><span class="stat-jour">${d.cle.slice(8, 10)}</span></div>`;
    });
    html += `</div>
      <p class="note stat-compare">${t("stats.compare", { s: semaine, p: semainePrec })}</p>

      <p class="stat-graph-titre">${t("stats.equilibre")}</p>
      <div class="stat-balance">
        <div class="stat-balance-fam" style="width:${pctFam}%">💛 ${pctFam}%</div>
        <div class="stat-balance-pla" style="width:${pctPla}%">💧 ${pctPla}%</div>
      </div>`;

    const top = topMissions(enf, 3);
    if (top.length) {
      html += `<p class="stat-graph-titre">${t("stats.top")}</p><div class="stat-top">`;
      top.forEach(([mid, n]) => {
        const m = (typeof trouverMission === "function") ? trouverMission(mid) : null;
        const emoji = m ? m.emoji : "•";
        const nom = m ? trData("mission", m.id, m.titre) : mid;
        html += `<div class="stat-top-ligne"><span>${emoji} ${echapper(nom)}</span><span class="stat-top-n">×${n}</span></div>`;
      });
      html += `</div>`;
    }

    // Dépenses : collectif (dons aux cartes surprises) vs individuel (avatar).
    const dons = enf.donsTotal || 0, avat = enf.avatarTotal || 0, somDep = dons + avat;
    if (somDep > 0) {
      const pctDon = Math.round((dons / somDep) * 100);
      html += `<p class="stat-graph-titre">${t("stats.depenses")}</p>
        <div class="stat-balance">
          <div class="stat-dep-col" style="width:${pctDon}%">🎁 ${dons}</div>
          <div class="stat-dep-ind" style="width:${100 - pctDon}%">🎨 ${avat}</div>
        </div>
        <p class="note stat-compare">${t("stats.depenses_detail", { col: dons, ind: avat })}</p>`;
    }

    // Cartes surprises soutenues par cet enfant (ses choix collectifs).
    const cartesChoisies = (etat.cartesSurprises || [])
      .filter(c => c.dons && c.dons[enf.id] > 0)
      .map(c => [c.emoji, trData("carte", c.id, c.titre), c.dons[enf.id]]);
    if (cartesChoisies.length) {
      html += `<p class="stat-graph-titre">${t("stats.cartes_choix")}</p><div class="stat-top">`;
      cartesChoisies.forEach(([e, nom, n]) =>
        html += `<div class="stat-top-ligne"><span>${e} ${echapper(nom)}</span><span class="stat-top-n">${n} 💛</span></div>`);
      html += `</div>`;
    }

    // Styles d'avatar préférés (catégories les plus débloquées).
    const cats = {};
    (enf.debloque || []).forEach(cle => { const cat = cle.split(":")[0]; cats[cat] = (cats[cat] || 0) + 1; });
    const topCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topCats.length) {
      html += `<p class="stat-graph-titre">${t("stats.avatar_choix")}</p><div class="stat-top">`;
      topCats.forEach(([cat, n]) =>
        html += `<div class="stat-top-ligne"><span>${(AVATAR_LIBELLES[cat] || cat)}</span><span class="stat-top-n">×${n}</span></div>`);
      html += `</div>`;
    }

    // Répartitions objectives (sans interprétation).
    const mc = missionsParCat(enf);
    if (mc.total > 0) {
      const pro = Math.round((mc.fam / mc.total) * 100);
      html += `<div class="stat-axe"><span class="stat-axe-lbl">${t("stats.axe_entraide")} / ${t("stats.axe_ecologie")}</span>
        <div class="stat-balance">
          <div class="stat-balance-fam" style="width:${pro}%">${pro}%</div>
          <div class="stat-balance-pla" style="width:${100 - pro}%">${100 - pro}%</div>
        </div></div>`;
    }

    // Auto-évaluation de l'enfant + évaluation parent (comptes objectifs, 30 j).
    const compteEval = (m) => {
      const base = new Date(aujourdHui() + "T00:00:00");
      const c = { bien: 0, moyen: 0, mauvais: 0 };
      for (let i = 0; i < 30; i++) { const d = new Date(base); d.setDate(base.getDate() - i);
        const v = (m || {})[dateCle(d)]; if (v && c[v] !== undefined) c[v]++; }
      return c;
    };
    const ae = compteEval(enf.autoEval), pe = compteEval(enf.evalParent);
    if (ae.bien + ae.moyen + ae.mauvais > 0)
      html += `<p class="note stat-compare">${t("stats.autoeval")} : 😀 ${ae.bien} · 😐 ${ae.moyen} · 🙁 ${ae.mauvais}</p>`;
    if (pe.bien + pe.moyen + pe.mauvais > 0)
      html += `<p class="note stat-compare">${t("stats.evalparent")} : 😀 ${pe.bien} · 😐 ${pe.moyen} · 🙁 ${pe.mauvais}</p>`;

    // Frise jour par jour : ressenti de l'enfant vs du parent (14 jours).
    const aDesEvals = (Object.keys(enf.autoEval || {}).length + Object.keys(enf.evalParent || {}).length) > 0;
    if (aDesEvals) {
      const EMO = { bien: "😀", moyen: "😐", mauvais: "🙁" };
      const base = new Date(aujourdHui() + "T00:00:00");
      let cE = "", cP = "", cJ = "";
      for (let i = 13; i >= 0; i--) {
        const d = new Date(base); d.setDate(base.getDate() - i);
        const cle = dateCle(d);
        const ve = (enf.autoEval || {})[cle], vp = (enf.evalParent || {})[cle];
        cE += `<span class="stat-eval-c">${ve ? EMO[ve] : "·"}</span>`;
        cP += `<span class="stat-eval-c">${vp ? EMO[vp] : "·"}</span>`;
        cJ += `<span class="stat-eval-c stat-eval-j">${cle.slice(8, 10)}</span>`;
      }
      html += `<p class="stat-graph-titre">${t("stats.ressenti")}</p>
        <div class="stat-eval-grid">
          <div class="stat-eval-row"><span class="stat-eval-lbl">🧒</span>${cE}</div>
          <div class="stat-eval-row"><span class="stat-eval-lbl">👤</span>${cP}</div>
          <div class="stat-eval-row"><span class="stat-eval-lbl"></span>${cJ}</div>
        </div>`;
    }

    sec.innerHTML = html;
    wrap.appendChild(sec);
  });
  return wrap;
}

/* ---------- Vue Missions (famille / planète) ---------- */
// Options de don configurables (clé app_config → montant affiché).
const DON_PONCTUELS = [["don_once_10", "10 €"], ["don_once_20", "20 €"], ["don_once_50", "50 €"]];
const DON_MENSUELS  = [["don_sub_1", "1 €"], ["don_sub_3", "3 €"], ["don_sub_10", "10 €"]];

// Soutien : don 100 % facultatif. On énonce ici un fait présent — gratuite,
// sans publicité, donc financée par les dons — sans rien affirmer de l'avenir.
// Les engagements de long terme relèvent des mentions légales, pas d'un bloc
// d'appel au don, où une promesse ressemblerait à un argument de vente.
function blocDon() {
  const cfg = (typeof configApp !== "undefined") ? configApp : {};
  const sec = el("section", "carte don-carte");
  let html = `<h2>${t("don.titre")}</h2>
    <p class="don-gratuit">${t("don.gratuit", { app: APP_NOM })}</p>
    <p class="don-texte">${t("don.texte", { app: APP_NOM })}</p>`;
  const ponct = DON_PONCTUELS.filter(([k]) => cfg[k]);
  const mens = DON_MENSUELS.filter(([k]) => cfg[k]);
  const libre = cfg.don_stripe_url || ((window.KP_CONFIG && window.KP_CONFIG.DON_URL) || "");

  if (ponct.length) {
    html += `<p class="don-sous">${t("don.ponctuel")}</p><div class="don-options">` +
      ponct.map(([k, m]) => `<a class="don-opt" href="${cfg[k]}" target="_blank" rel="noopener">${m}</a>`).join("") +
      `</div>`;
  }
  if (mens.length) {
    html += `<p class="don-sous">${t("don.mensuel")}</p><div class="don-options">` +
      mens.map(([k, m]) => `<a class="don-opt mensuel" href="${cfg[k]}" target="_blank" rel="noopener">${m}<small>${t("don.par_mois")}</small></a>`).join("") +
      `</div>`;
  }
  if (!ponct.length && !mens.length && libre) {
    html += `<a class="gros-bouton don-bouton" href="${libre}" target="_blank" rel="noopener">${t("don.bouton")}</a>`;
  }
  if (ponct.length || mens.length || libre) {
    html += `<p class="don-merci">${t("don.merci")}</p>`;
    // Arrêter un soutien mensuel doit être aussi simple que le commencer, et
    // se faire depuis l'app — pas en cherchant un vieil e-mail de reçu. Le
    // portail client Stripe s'en charge : le parent y entre son adresse et
    // reçoit un lien de connexion. Rien de sensible ne transite par le site.
    if (cfg.don_portail_url) {
      html += `<p class="don-gerer"><a href="${cfg.don_portail_url}" target="_blank" rel="noopener">${t("don.gerer")}</a></p>`;
    }
    // Transparence : ce que les dons financent, et ce qu'ils ne donnent pas.
    html += `<p class="don-transparence">${t("don.transparence")}
      <a href="faq.html#dons" target="_blank" rel="noopener">${t("don.en_savoir")}</a></p>`;
  }
  sec.innerHTML = html;
  return sec;
}

/* ---------- Parrainage : demander au bon moment ----------
 * On ne demande jamais « dans le vide ». Juste après qu'une carte surprise a
 * été débloquée, le parent vient de vivre un bon moment en famille : c'est le
 * seul instant où proposer d'en parler à une autre famille est un plaisir et
 * non une corvée. Affiché sept jours au maximum, refermable définitivement,
 * jamais insistant. */
function blocBonMoment() {
  if (typeof modeDemo !== "undefined" && modeDemo) return null;
  if (etat.reglages && etat.reglages.parrainProposeVu) return null;      // refermé par le parent
  const cartes = cartesSurprises().filter(c => c.debloquee && c.debloqueeLe);
  if (!cartes.length) return null;
  // La plus récemment débloquée, et seulement si c'est frais (7 jours).
  const derniere = cartes.sort((a, b) => (a.debloqueeLe < b.debloqueeLe ? 1 : -1))[0];
  const jours = Math.floor((new Date(aujourdHui() + "T00:00:00") - new Date(derniere.debloqueeLe + "T00:00:00")) / 86400000);
  if (!(jours >= 0 && jours <= 7)) return null;

  const sec = el("section", "carte bon-moment");
  sec.innerHTML = `<h2>${t("bm.titre")}</h2>
    <p class="bm-carte">${derniere.emoji} <strong>${echapper(trData("carte", derniere.id, derniere.titre))}</strong></p>
    <p class="note">${t("bm.texte", { app: APP_NOM })}</p>`;
  const b = el("button", "gros-bouton famille", "🎁 " + t("bm.bouton"));
  b.onclick = () => modaleParrainage();
  sec.appendChild(b);
  const bNon = el("button", "lien-oubli", t("bm.masquer"));
  bNon.onclick = () => {
    if (!etat.reglages) etat.reglages = {};
    etat.reglages.parrainProposeVu = true;
    sauver(); rendre();
  };
  sec.appendChild(bNon);
  return sec;
}

/* ---------- Le 7ᵉ jour : demander UNE famille, pas le maximum ----------
 * La proposition automatique préexistante attend trois semaines. Une famille
 * qui a tenu sept jours est déjà convaincue : c'est là que l'envie d'en parler
 * est la plus vive. Le texte ne réclame pas « le maximum de familles » — il
 * demande UN nom. Demander un maximum fait fuir ; demander un nom fait agir.
 * Affiché une seule fois, refermable définitivement, jamais insistant. */
function blocArbreSeptiemeJour() {
  if (typeof modeDemo !== "undefined" && modeDemo) return null;
  if (etat.reglages && etat.reglages.arbreJ7Vu) return null;
  if (typeof familleConvaincue !== "function" || !familleConvaincue()) return null;

  const sec = el("section", "carte bon-moment arbre-j7");
  sec.innerHTML = `<h2>${t("arbre.j7_titre")}</h2>
    <p class="note">${t("arbre.j7_texte", { app: APP_NOM })}</p>`;
  const b = el("button", "gros-bouton famille", "🌳 " + t("arbre.j7_bouton"));
  b.onclick = () => modaleParrainage();
  sec.appendChild(b);
  const bNon = el("button", "lien-oubli", t("bm.masquer"));
  bNon.onclick = () => {
    if (!etat.reglages) etat.reglages = {};
    etat.reglages.arbreJ7Vu = true;
    sauver(); rendre();
  };
  sec.appendChild(bNon);
  // Une famille qui a DÉJÀ semé n'a pas besoin qu'on le lui demande : on
  // retire la carte dès que le bilan revient avec au moins une famille amenée.
  if (typeof parrainageBilan === "function") {
    parrainageBilan().then(bilan => {
      if (bilan && ((bilan.invitees || 0) > 0 || (bilan.installees || 0) > 0)) sec.remove();
    }).catch(() => {});
  }
  return sec;
}

// Défis réparation (alternative bienveillante à la punition).
// Ce bloc est affiché dans l'espace parents : le mode d'emploi ci-dessous
// s'adresse donc au parent, qui coche le geste AVEC l'enfant.
function blocReparation() {
  const enf = enfantActif();
  const jeune = estJeune(enf);
  const rep = el("section", "carte reparation");
  rep.innerHTML = `<h2>${t("rep.titre")}</h2>
    <p>${t("rep.texte")}</p>
    <p class="rep-quand">${t("rep.quand", { prenom: echapper(enf.prenom) })}</p>`;

  // « Comment ça marche ? » — replié par défaut, pour ne pas alourdir l'écran
  // tout en levant l'incompréhension la plus fréquente des parents.
  const { details, corps } = blocPliable(t("rep.aide.titre"), false, "rep-aide");
  corps.innerHTML = `<ol class="rep-etapes">
      <li>${t("rep.etape1")}</li>
      <li>${t("rep.etape2")}</li>
      <li>${t("rep.etape3")}</li>
    </ol>
    <p class="reglage-aide">${t("rep.aide.annuler")}</p>
    <p class="reglage-aide">${t("rep.aide.pourquoi")}</p>`;
  rep.appendChild(details);

  const g = el("div", "missions");
  DEFIS_REPARATION.forEach(d => {
    const actif = reparationActive(enf, d.id);
    const b = el("button", "mission rep" + (actif ? " fait" : ""));
    b.innerHTML = `<span class="m-emoji">${emojiOuRepli(d.emoji, d.emojiRepli)}</span>
      <span class="m-titre">${trData("defi", d.id, d.titre)}</span>
      <span class="m-points">${actif ? "✅" : pointsVisuels(d.bonus, "💛", jeune)}</span>`;
    b.onclick = () => defiReparation(d);
    g.appendChild(b);
  });
  rep.appendChild(g);
  return rep;
}

/* ---------- Réparation en accès direct ----------
 * Même porte que le mode rétroactif et la planification d'une carte : code PIN
 * s'il en existe un, accès immédiat sinon. Créditer un geste de réparation
 * reste une décision de parent — mais elle doit pouvoir se prendre en deux
 * touches, l'enfant à côté, sans traverser l'espace parents.
 */
function ouvrirReparationRapide() {
  if (typeof modeDemo !== "undefined" && modeDemo) { modaleReparation(); return; }
  const lancer = () => modaleReparation();
  if (modeParents || !(etat.reglages && etat.reglages.codeParent)) { lancer(); return; }
  demanderPin({
    titre: t("rep.pin_titre"),
    permettreOubli: true,
    onReset: () => lancer(),
    onOk: (saisi) => { if (saisi.trim() !== etat.reglages.codeParent) return false; lancer(); }
  });
}

function modaleReparation() {
  const enf = enfantActif();
  if (!enf) return;
  const jeune = estJeune(enf);
  const ov = el("div", "pin-modal");
  ov.innerHTML = `
    <div class="pin-carte rep-modale">
      <button class="modale-fermer" aria-label="${t("common.fermer")}">✕</button>
      <div class="pin-titre">${t("rep.titre")}</div>
      <p class="note">${t("rep.quand", { prenom: echapper(enf.prenom) })}</p>
      <div id="rep-grille" class="missions"></div>
      <p class="note">${t("rep.aide.annuler")}</p>
    </div>`;
  document.body.appendChild(ov);
  const fermer = () => ov.remove();
  ov.querySelector(".modale-fermer").onclick = fermer;
  ov.addEventListener("click", e => { if (e.target === ov) fermer(); });

  // Une seule source pour les six gestes : la même liste que la carte de
  // l'espace parents, donc aucun risque de les voir diverger.
  const g = ov.querySelector("#rep-grille");
  DEFIS_REPARATION.forEach(d => {
    const actif = reparationActive(enf, d.id);
    const b = el("button", "mission rep" + (actif ? " fait" : ""));
    b.innerHTML = `<span class="m-emoji">${emojiOuRepli(d.emoji, d.emojiRepli)}</span>
      <span class="m-titre">${trData("defi", d.id, d.titre)}</span>
      <span class="m-points">${actif ? "✅" : pointsVisuels(d.bonus, "💛", jeune)}</span>`;
    b.onclick = () => { defiReparation(d); fermer(); };
    g.appendChild(b);
  });
}
