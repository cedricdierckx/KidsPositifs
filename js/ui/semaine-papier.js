/* =====================================================================
 * FamiTeam — Feuille de la semaine : encodage et impression
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * La feuille papier de la semaine : encodage groupé (détaillé ou express),
 * fabrication du HTML imprimable et impression/PDF, une page par enfant.
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

let semainePapierDebut = null;   // lundi de la semaine sélectionnée (session)

// Onglet « Semaine papier » : explique le rituel sans écran et génère la feuille A4.
function blocSemainePapier() {
  semainePapierDebut = semainePapierDebut || debutSemaine(aujourdHui());
  const sec = el("section", "carte papier-carte");
  const jours = joursSemaine(semainePapierDebut);
  sec.innerHTML = `<h2>${t("papier.titre")}</h2>
    <div class="papier-intro">🌿 ${t("papier.intro")}</div>`;

  // Choix de la semaine (◀ / libellé / ▶) — on peut aussi préparer les
  // semaines suivantes (impression à l'avance).
  const nav = el("div", "verif-nav");
  const prev = el("button", "verif-fleche", "◀"); prev.setAttribute("aria-label", t("a11y.precedent"));
  prev.onclick = () => { semainePapierDebut = decalerSemaine(semainePapierDebut, -7); rendre(); };
  const lbl = el("span", "verif-jour", libelleSemaine(jours[0], jours[6]));
  const next = el("button", "verif-fleche", "▶"); next.setAttribute("aria-label", t("a11y.suivant"));
  next.onclick = () => { semainePapierDebut = decalerSemaine(semainePapierDebut, 7); rendre(); };
  nav.appendChild(prev); nav.appendChild(lbl); nav.appendChild(next);
  sec.appendChild(nav);

  // Deux mises en page possibles (choix à l'impression) — mêmes deux mots
  // (Détaillé / Rapide) et la même présentation « icône + titre + précision »
  // que le choix de mode plus bas, pour qu'imprimer et encoder se lisent
  // comme un seul et même choix, pas deux vocabulaires différents.
  sec.appendChild(el("p", "planif-sous", t("papier.format")));
  const impressions = el("div", "enc-modes segmente");
  [["jours", "📋", t("papier.imprimer_jours")], ["total", "⚡", t("papier.imprimer_total")]].forEach(([val, ico, lab]) => {
    const m = /^(.*?)\s*\((.*)\)\s*$/.exec(lab);
    const titre = m ? m[1] : lab;
    const hint = m ? m[2] : "";
    const b = el("button", "seg seg-mode");
    b.innerHTML = `<span class="seg-ico">${ico}</span><span class="seg-txt"><span class="seg-titre">${echapper(titre)}</span>${hint ? `<span class="seg-hint">${echapper(hint)}</span>` : ""}</span>`;
    b.onclick = () => imprimerFeuilleSemaine(val);
    impressions.appendChild(b);
  });
  sec.appendChild(impressions);
  return sec;
}

let encodeMode = "detaille";   // "detaille" | "express" (session)

// Exécute une action qui re-rend la page, en préservant la position de défilement
// (vertical de la page + horizontal de la grille d'encodage) pour éviter le saut
// en haut à chaque case cochée.
function majSansSaut(action) {
  const y = window.scrollY || window.pageYOffset || 0;
  const sc = document.querySelector(".enc-scroll");
  const sx = sc ? sc.scrollLeft : 0;
  action();
  const sc2 = document.querySelector(".enc-scroll");
  if (sc2) sc2.scrollLeft = sx;
  window.scrollTo(0, y);
}

// Encodage de la feuille papier dans l'app, pour la semaine sélectionnée et
// l'enfant actif. Deux modes : détaillé (grille jour par jour + comportement)
// ou express (juste les totaux de la semaine).
function blocEncoderSemaine() {
  const sec = el("section", "carte papier-carte");
  const enf = enfantActif();
  const jours = joursSemaine(semainePapierDebut || debutSemaine(aujourdHui()));
  const lettres = t("planif.jours_courts").split(",");
  sec.innerHTML = `<h2>${t("papier.encoder_titre")}</h2>
    <p class="note">${t("papier.encoder_note")}</p>`;

  // Sélection de l'enfant à encoder.
  const enfRow = el("div", "planif-enfants");
  Object.values(etat.enfants).forEach(e => {
    const b = el("button", "enf-chip" + (e.id === etat.enfantActif ? " on" : ""), echapper(e.prenom));
    b.onclick = () => { etat.enfantActif = e.id; ecrireCache(); rendre(); };
    enfRow.appendChild(b);
  });
  sec.appendChild(enfRow);

  // Bascule de mode (contrôle segmenté : icône + titre + courte explication).
  const modes = el("div", "enc-modes segmente");
  [["detaille", "📋", t("papier.mode_detaille")], ["express", "⚡", t("papier.mode_express")]].forEach(([val, ico, lab]) => {
    // Le libellé est de la forme « Titre (explication) » : on sépare les deux.
    const m = /^(.*?)\s*\((.*)\)\s*$/.exec(lab);
    const titre = m ? m[1] : lab;
    const hint = m ? m[2] : "";
    const b = el("button", "seg seg-mode" + (encodeMode === val ? " actif" : ""));
    b.innerHTML = `<span class="seg-ico">${ico}</span><span class="seg-txt"><span class="seg-titre">${echapper(titre)}</span>${hint ? `<span class="seg-hint">${echapper(hint)}</span>` : ""}</span>`;
    b.onclick = () => { encodeMode = val; rendre(); };
    modes.appendChild(b);
  });
  sec.appendChild(modes);

  if (encodeMode === "express") {
    // -- Mode express : totaux de la semaine --
    sec.appendChild(el("p", "planif-sous", t("papier.express_note", { prenom: echapper(enf.prenom) })));
    const mk = (champ, libelle) => {
      const l = el("label", "champ", libelle);
      const inp = el("input", "aj-val"); inp.type = "number"; inp.min = "0"; inp.inputMode = "numeric"; inp.value = "0";
      l.appendChild(inp); return { l, inp };
    };
    const c = mk("coeurs", "💛 " + t("money.coeurs"));
    const g = mk("gouttes", "💧 " + t("money.gouttes"));
    sec.appendChild(c.l); sec.appendChild(g.l);
    const b = el("button", "gros-bouton planete", t("papier.express_ajouter"));
    b.onclick = () => {
      const nc = Math.max(0, parseInt(c.inp.value, 10) || 0);
      const ng = Math.max(0, parseInt(g.inp.value, 10) || 0);
      if (!nc && !ng) { toast(t("papier.rien"), "info"); return; }
      if (nc) ajusterMonnaie(enf, "coeurs", nc);
      if (ng) ajusterMonnaie(enf, "gouttes", ng);
      toast(t("papier.express_ok", { prenom: enf.prenom }), "succes");
    };
    sec.appendChild(b);
    return sec;
  }

  // -- Mode détaillé : grille missions × 7 jours + comportement --
  // Navigation entre semaines (◀ / libellé / ▶) : permet de remplir la feuille
  // d'une semaine précédente (ou de préparer une semaine à venir).
  const navS = el("div", "verif-nav enc-nav-semaine");
  const prevS = el("button", "verif-fleche", "◀"); prevS.setAttribute("aria-label", t("a11y.precedent"));
  prevS.onclick = () => { semainePapierDebut = decalerSemaine(semainePapierDebut || debutSemaine(aujourdHui()), -7); rendre(); };
  const estSemaineCourante = (semainePapierDebut || debutSemaine(aujourdHui())) >= debutSemaine(aujourdHui());
  const lblS = el("span", "verif-jour", libelleSemaine(jours[0], jours[6]) + (estSemaineCourante ? " · " + t("papier.semaine_actuelle") : ""));
  const nextS = el("button", "verif-fleche", "▶"); nextS.setAttribute("aria-label", t("a11y.suivant"));
  nextS.onclick = () => { semainePapierDebut = decalerSemaine(semainePapierDebut || debutSemaine(aujourdHui()), 7); rendre(); };
  navS.appendChild(prevS); navS.appendChild(lblS); navS.appendChild(nextS);
  sec.appendChild(navS);

  const scroll = el("div", "enc-scroll");
  const grille = el("div", "enc-grille");
  // En-tête (jours).
  const head = el("div", "enc-ligne enc-head");
  head.appendChild(el("span", "enc-lib", ""));
  lettres.forEach(l => head.appendChild(el("span", "enc-jour", l)));
  grille.appendChild(head);

  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    const ms = missionsFeuille(enf, catId);
    if (!ms.length) return;
    const titre = el("div", "enc-cat", `${cat.monnaieEmoji} ${trData("cat", catId + ".nom", cat.nom)}`);
    grille.appendChild(titre);
    ms.forEach(m => {
      const ligne = el("div", "enc-ligne");
      ligne.appendChild(el("span", "enc-lib", `${m.emoji} ${titreMission(m)}`));
      jours.forEach(j => {
        const n = (enf.journal[j] || {})[m.id] || 0;
        const planifie = missionActiveJour(enf, m, j);   // jour prévu pour cette mission ?
        const b = el("button", "enc-case" + (n ? " on" : "") + (planifie ? "" : " hors"),
          n ? "✅" : (planifie ? "" : "·"));
        if (!planifie) b.title = t("papier.hors_jour");
        b.onclick = () => majSansSaut(() => modifierHistorique(enf, j, m, n > 0 ? -1 : +1));
        ligne.appendChild(b);
      });
      grille.appendChild(ligne);
    });
  });

  // Ligne comportement (auto-évaluation par jour).
  grille.appendChild(el("div", "enc-cat", `😊 ${t("papier.comportement")}`));
  const ligneC = el("div", "enc-ligne");
  ligneC.appendChild(el("span", "enc-lib", t("papier.humeur_jour")));
  const EMO = { bien: "😄", moyen: "😐", mauvais: "😠", "": "·" };
  jours.forEach(j => {
    const v = (enf.autoEval || {})[j] || "";
    const b = el("button", "enc-case enc-humeur" + (v ? " on" : ""), EMO[v]);
    b.onclick = () => majSansSaut(() => cyclerAutoEvalJour(enf, j));
    ligneC.appendChild(b);
  });
  grille.appendChild(ligneC);

  scroll.appendChild(grille);
  sec.appendChild(scroll);
  sec.appendChild(el("p", "note", t("papier.detaille_note")));
  return sec;
}
function decalerSemaine(debut, deltaJours) {
  const d = new Date(debut + "T00:00:00"); d.setDate(d.getDate() + deltaJours); return dateCle(d);
}
function libelleSemaine(d1, d2) {
  try {
    const a = new Date(d1 + "T00:00:00").toLocaleDateString(langue, { day: "numeric", month: "short" });
    const b = new Date(d2 + "T00:00:00").toLocaleDateString(langue, { day: "numeric", month: "short" });
    return t("papier.semaine_du", { a, b });
  } catch { return d1 + " → " + d2; }
}

// Construit la feuille A4 (HTML autonome) et ouvre la fenêtre d'impression.
// Construit le document HTML autonome de la feuille A4 (styles compris) :
// une fonction PURE, sans effet de bord, pour servir aussi bien la fenêtre
// d'impression du web que le rendu hors écran de l'app installée (voir
// imprimerFeuilleSemaine plus bas) — un seul contenu, deux destinations.
function htmlFeuilleSemaine(mode) {
  const jours = joursSemaine(semainePapierDebut);
  const lettres = t("planif.jours_courts").split(",");
  const famille = (typeof familleActive !== "undefined" && familleActive && familleActive.name) ? familleActive.name : "";
  const titreSem = libelleSemaine(jours[0], jours[6]);

  const auj = aujourdHui();
  const EMO_EVAL = { bien: "😄", moyen: "😐", mauvais: "😠" };
  const blocEnfant = (enf, k) => {
    const coul = enf.couleur || "#f6a623";
    let coeursSem = 0, gouttesSem = 0;   // déjà gagnés cette semaine (jours écoulés)
    let lignes = "";
    ["famille", "planete"].forEach(catId => {
      const cat = CATEGORIES[catId];
      const ms = missionsFeuille(enf, catId);
      if (!ms.length) return;
      lignes += `<tr class="cat"><td colspan="${mode === "jours" ? 8 : 2}">${cat.monnaieEmoji} ${trData("cat", catId + ".nom", cat.nom)}</td></tr>`;
      ms.forEach(m => {
        const nom = `${m.emoji} ${titreMission(m)} <small>(${cat.monnaieEmoji}${pointsMission(enf, m)})</small>`;
        // Total déjà fait cette semaine (jours écoulés) pour cette mission.
        let totMission = 0;
        jours.forEach(j => { if (j <= auj) totMission += (enf.journal[j] || {})[m.id] || 0; });
        if (catId === "planete") gouttesSem += totMission * pointsMission(enf, m);
        else coeursSem += totMission * pointsMission(enf, m);
        if (mode === "jours") {
          lignes += `<tr><td class="m">${nom}</td>` + lettres.map((_, i) => {
            // Week-end teinté (voir plus bas) : un petit repère visuel et coloré
            // dans une grille par ailleurs assez austère.
            const we = i >= 5 ? " we" : "";
            const j = jours[i];
            if (!missionActiveJour(enf, m, j)) return `<td class="c hors${we}">·</td>`;   // jour non prévu
            const fait = (enf.journal[j] || {})[m.id] || 0;
            if (j <= auj && fait) return `<td class="c faite${we}">✓</td>`;               // déjà fait : pré-rempli
            return `<td class="c${we}">☆</td>`;                                            // à cocher
          }).join("") + `</tr>`;
        } else {
          lignes += `<tr><td class="m">${nom}</td><td class="c large">${totMission || ""}</td></tr>`;
        }
      });
    });
    // Répétée sur chaque page où la carte se poursuit (voir <thead> plus
    // bas) : sans elle, une liste assez longue pour déborder sur une
    // deuxième page y perdait le nom de l'enfant ET l'en-tête des jours —
    // rien ne disait alors à qui appartenait la suite du tableau.
    const nomRepete = `<tr class="cat nom-repete"><th colspan="${mode === "jours" ? 8 : 2}">${vignetteEnfant(enf, "mini")} ${echapper(enf.prenom)}</th></tr>`;
    const entete = (mode === "jours")
      ? `<tr class="head"><th></th>${lettres.map((l, i) => `<th${i >= 5 ? ' class="we"' : ""}>${l}</th>`).join("")}</tr>`
      : `<tr class="head"><th></th><th>${t("papier.total")}</th></tr>`;
    // Auto-évaluation du comportement : pré-remplie pour les jours écoulés.
    const humeur = `<div class="humeur">
        <div class="humeur-t">😊 ${t("papier.humeur")}</div>
        <table class="humeur-tbl">
          <tr class="head"><th></th>${lettres.map((l, i) => `<th${i >= 5 ? ' class="we"' : ""}>${l}</th>`).join("")}</tr>
          <tr><td class="m">${t("papier.humeur_jour")}</td>${lettres.map((_, i) => {
            const we = i >= 5 ? " we" : "";
            const ev = (enf.autoEval || {})[jours[i]];
            return (ev && jours[i] <= auj)
              ? `<td class="hc faite${we}">${EMO_EVAL[ev] || ""}</td>`
              : `<td class="hc${we}">😄 😐 😠</td>`;
          }).join("")}</tr>
        </table>
      </div>`;
    const tC = coeursSem ? `<strong>${coeursSem}</strong>` : `<span class="trait"></span>`;
    const tG = gouttesSem ? `<strong>${gouttesSem}</strong>` : `<span class="trait"></span>`;
    return `<div class="enfant enf-${k}" style="--c:${coul}">
        <h3>${vignetteEnfant(enf, "mini")} ${echapper(enf.prenom)} <span class="stars">★ ★ ★</span></h3>
        <p class="fun-msg">${t("papier.encourage", { prenom: enf.prenom })}</p>
        <table><thead>${nomRepete}${entete}</thead><tbody>${lignes}</tbody></table>
        ${humeur}
        <div class="totaux">💛 ${t("money.coeurs")} : ${tC}&nbsp;&nbsp; 💧 ${t("money.gouttes")} : ${tG}</div>
        <div class="bravo">🎉 ${t("papier.bravo")} <span class="sticker-slot" aria-hidden="true"></span></div>
      </div>`;
  };

  const corps = Object.values(etat.enfants).map(blocEnfant).join("");
  const html = `<!doctype html><html lang="${langue}"><head><meta charset="utf-8">
    <title>${APP_NOM} — ${titreSem}</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      *{box-sizing:border-box} body{font-family:'Comic Sans MS','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2b3a4a;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .tete{display:flex;justify-content:space-between;align-items:center;
        background:linear-gradient(90deg,#fff1d6,#ffe3ef,#e3f3ff);border-radius:14px;
        padding:10px 14px;margin-bottom:8px;border:2px dashed #f6a623}
      .tete .logo{font-size:19px;font-weight:800}
      .tete .sem{font-size:13px;color:#5a6b7a;font-weight:700}
      .intro{font-size:11px;color:#6a7a88;margin:0 0 12px;text-align:center}
      /* Trois problemes distincts corrigeaient la meme capture d'ecran :
         page 1 quasi blanche (juste l'entete), une paire d'enfants par page
         au lieu de repartir le contenu au mieux, puis (familles nombreuses,
         4 enfants et plus) des cartes qui debordent ou se desalignent d'une
         page a l'autre.

         1) "display:grid" ne se pagine PAS correctement a l'impression sous
         Chrome (limitation connue et ancienne du moteur : les pistes d'une
         grille ne se fragmentent pas proprement entre les pages).

         2) Un flottement ("float") en deux colonnes paginait mieux qu'une
         grille, mais reste fragile des que les enfants ont des listes de
         longueurs differentes : la colonne la plus longue force un saut de
         page qui laisse l'autre colonne desalignee, voire coupee au milieu —
         le rendu differait meme d'un navigateur a l'autre. Une seule colonne
         (chaque enfant occupe toute la largeur, l'un sous l'autre) supprime
         la classe de bug entiere : plus de colonnes a desynchroniser, chaque
         carte se pagine independamment des autres. Le cout — un peu plus de
         pages pour une famille nombreuse — est le prix d'un rendu fiable
         partout, y compris a la maison sur une imprimante quelconque.

         3) "break-inside:avoid" pose sur LA CARTE ENTIERE forcait chaque
         enfant a rester d'un bloc. Avec une longue liste de missions, une
         carte a elle seule peut approcher la hauteur d'une page A4
         imprimable (~277 mm) : des qu'elle ne tient plus a cote de l'entete
         ou de la carte precedente, tout le bloc bascule sur la page
         suivante — laissant la page courante quasiment blanche. La regle
         passe donc du bloc entier aux seules LIGNES du tableau ("tr"), qui
         ne se coupent jamais en leur milieu de toute facon : une longue
         liste se repartit desormais sur autant de pages que necessaire, en
         utilisant le bas de la page courante au lieu de le laisser vide. Le
         nom de l'enfant reste coince au debut de son tableau ("h3" avec
         "break-after:avoid"), pour ne jamais se retrouver seul en bas d'une
         page, separe de son contenu. */
      .enfant{width:100%; margin:0 0 12px;
        border:2px solid var(--c);border-radius:16px;padding:9px 11px;background:#fff}
      /* Une page par enfant, sur demande explicite : chaque carte peut donc
         laisser du blanc en bas de sa page plutôt que de partager la
         suivante — c'est voulu, pour distribuer une feuille par enfant. */
      .enfant + .enfant{break-before:page; page-break-before:always}
      .enfant tr{break-inside:avoid}
      .enfant h3{margin:0 0 4px;font-size:17px;display:flex;align-items:center;gap:8px;break-after:avoid}
      .enfant h3 .em{font-size:19px}
      .enfant h3 .stars{margin-left:auto;color:#f2c200;font-size:15px;letter-spacing:2px}
      /* Un avatar bien plus grand qu'ailleurs dans l'app, en tête de la
         feuille : c'est la sienne, autant qu'elle se voie ! (le petit
         format « mini » reste utilisé pour l'en-tête répétée en cas de
         débordement sur une deuxième page, voir nomRepete plus haut.) */
      .enfant h3 .av-vignette{width:38px; height:38px; border-radius:12px;
        box-shadow:0 2px 4px rgba(0,0,0,.2); vertical-align:middle}
      .fun-msg{margin:0 0 8px; font-size:12px; font-weight:700; color:var(--c); break-after:avoid}
      /* Vignette avatar (voir vignetteEnfant, taille « mini » ici) : ce document
         est autonome — ouvert dans sa propre fenêtre pour l'impression, ou
         capturé hors écran pour le PDF (voir pdfDepuisElement) — et NE CHARGE
         PAS css/style.css, où ces règles vivent normalement. Sans elles, le
         <svg> de l'avatar (qui n'a qu'un viewBox, aucune taille propre) se
         rendait à sa taille par défaut du navigateur — un avatar énorme,
         gonflant chaque carte bien au-delà d'une page A4 et cassant du même
         coup la pagination « une page par enfant » juste au-dessus. */
      .av-vignette{width:24px; height:24px; display:inline-block; border-radius:7px;
        overflow:hidden; background:#fff; vertical-align:-6px; flex:0 0 auto}
      .av-vignette .av-svg{width:100%; height:100%; display:block}
      .av-vignette.initiale{display:inline-flex; align-items:center; justify-content:center;
        background:var(--c,#5b8def); color:#fff; font-weight:900; font-size:12px}
      table{width:100%;border-collapse:separate;border-spacing:0;font-size:11px}
      th,td{border:1px solid #e0e6ec;padding:3px 4px;text-align:center}
      td.m{text-align:left;font-size:10.5px;line-height:1.2} td.m small{color:#9aa7b3}
      tr.cat td,tr.cat th{background:var(--c);color:#fff;text-align:left;font-weight:800;font-size:10.5px;border-color:var(--c)}
      tr.nom-repete th{font-size:12px}
      tr.head th{background:#f3f6fa;font-size:10px;width:23px;font-weight:800}
      /* Week-end teinté : un petit repère de couleur dans une grille par
         ailleurs assez austère, pour marquer le rythme de la semaine — placé
         AVANT les règles « faite »/« hors » ci-dessous, qui doivent rester
         prioritaires quand une case est à la fois cochée et en week-end. */
      tr.head th.we{background:#ffe9f3}
      td.c.we, .humeur-tbl td.hc.we{background:#fff6ea}
      td.c{width:23px;height:19px;color:#cfd8e0;font-size:13px;border-radius:6px} td.c.large{width:62px;color:#fff}
      td.c.hors{background:repeating-linear-gradient(45deg,#f4f4f4,#f4f4f4 3px,#eaeaea 3px,#eaeaea 6px);color:#c8c8c8}
      td.c.faite{background:#e7f7ee;color:#1d7a52;font-weight:800}
      td.hc.faite{background:#eef6ff;font-size:14px}
      .humeur{margin-top:8px} .humeur-t{font-size:10.5px;font-weight:800;margin-bottom:2px}
      .humeur-tbl td.hc{font-size:11px;letter-spacing:0;white-space:nowrap}
      .totaux{font-size:12px;margin-top:8px;font-weight:700}
      .totaux .trait{display:inline-block;width:46px;border-bottom:2px dotted #9aa7b3}
      /* Petit rituel « colle ta plus belle étoile » : un cercle en pointillés
         que l'enfant remplit lui-même (autocollant, dessin) — la feuille ne
         reste pas qu'une grille à cocher. */
      .bravo{margin-top:10px;font-size:12px;font-weight:800;color:var(--c);
        display:flex;align-items:center;gap:8px}
      .sticker-slot{width:26px;height:26px;border-radius:50%;border:2px dashed var(--c);flex:0 0 auto}
      .pied{margin-top:12px;font-size:10px;color:#8a97a3;text-align:center}
    </style></head><body>
    <div class="tete"><div class="logo">🌟 ${APP_NOM}${famille ? " · " + echapper(famille) : ""}</div><div class="sem">🗓️ ${titreSem}</div></div>
    <p class="intro">${t("papier.feuille_intro")}</p>
    <div class="grille">${corps}</div>
    <p class="pied">${t("papier.feuille_pied")}</p>
    </body></html>`;
  return html;
}

async function imprimerFeuilleSemaine(mode) {
  // Dans l'app installée, ouvrir une fenêtre pour y imprimer déclenchait
  // l'aperçu d'impression NATIF du système sur une fenêtre que l'app
  // n'avait jamais pu créer proprement — puis restait coincée derrière,
  // sans bouton retour, jusqu'à devoir fermer l'app de force. On y
  // construit donc un vrai PDF (même document HTML, rendu hors écran —
  // voir pdfDepuisHtmlEtEnvoyer plus haut), tenté avant toute autre voie.
  if (greffonNatif("Filesystem")) {
    try {
      const ok = await pdfDepuisHtmlEtEnvoyer(htmlFeuilleSemaine(mode), "famiteam-semaine-" + aujourdHui() + ".pdf", APP_NOM);
      toast(ok ? t("impr.pdf_pret") : t("impr.echec"), ok ? "ok" : "info");
    } catch (e) { toast(t("impr.echec"), "info"); }
    return;
  }
  if (typeof window.print !== "function") {
    if (typeof toast === "function") toast(t("papier.indispo", { hote: "fami.team" }), "info");
    return;
  }
  const w = window.open("", "_blank");
  if (!w) { toast(t("papier.popup_bloque"), "info"); return; }
  w.document.open(); w.document.write(htmlFeuilleSemaine(mode)); w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* impression annulée */ } }, 350);
}
