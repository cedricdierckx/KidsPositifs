/* =====================================================================
 * FamiTeam — Interface : Badges et statistiques
 * ---------------------------------------------------------------------
 * Les médailles décrochées, les séries, les missions les plus faites.
 * Rien ici ne compare deux enfants entre eux : un enfant ne se mesure
 * qu'à lui-même.
 *
 * Module de l'interface (ARCHITECTURE.md, phase C). Script classique,
 * comme tous les autres : les fonctions restent globales et s'appellent
 * entre modules sans import. L'ordre des balises dans index.html n'a
 * donc aucune conséquence — rien ne s'exécute au chargement.
 * ===================================================================== */
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
