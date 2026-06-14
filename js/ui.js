/* =====================================================================
 * KidsPositifs — Rendu de l'interface
 * ===================================================================== */

function initSquelette() {
  document.body.innerHTML = `
    <div id="confettis"></div>
    <div id="toast" class="toast"></div>

    <header class="topbar">
      <div class="logo">🌟 KidsPositifs <span id="sync-etat" class="sync-etat" title="État de la synchronisation">…</span></div>
      <div id="selecteur-enfant" class="selecteur"></div>
    </header>

    <main id="contenu"></main>

    <nav class="navbar">
      <button data-vue="accueil"  class="nav-btn">🏠<span>Accueil</span></button>
      <button data-vue="famille"  class="nav-btn">🏡<span>Famille</span></button>
      <button data-vue="planete"  class="nav-btn">🌍<span>Planète</span></button>
      <button data-vue="avatar"   class="nav-btn">🎨<span>Avatar</span></button>
      <button data-vue="reglages" class="nav-btn">⚙️<span>Parents</span></button>
    </nav>`;

  // Navigation : choix d'affichage local (non synchronisé entre appareils).
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.addEventListener("click", () => { etat.vue = b.dataset.vue; ecrireCache(); rendre(); }));
}

/* ---------- Écran de connexion (code famille) ---------- */
function ecranCode() {
  document.body.innerHTML = `
    <div class="ecran-code">
      <div class="carte code-carte">
        <div class="code-logo">🌟</div>
        <h1>KidsPositifs</h1>
        <p>Pour retrouver les mêmes données sur tous vos appareils, entrez un
           <strong>code famille</strong> (le même partout).</p>
        <input id="champ-code" placeholder="ex. famille-dierckx" autocomplete="off">
        <button id="btn-code" class="gros-bouton planete">C'est parti ! 🚀</button>
        <p class="note">Choisissez un code unique et facile à retenir. Toute personne
           connaissant ce code verra les données — gardez-le en famille.</p>
      </div>
    </div>`;
  const champ = document.querySelector("#champ-code");
  const valider = () => {
    const v = champ.value.trim();
    if (v.length < 3) { champ.focus(); champ.classList.add("erreur"); return; }
    demarrerAvecCode(v);
  };
  document.querySelector("#btn-code").onclick = valider;
  champ.addEventListener("keydown", e => { if (e.key === "Enter") valider(); });
  champ.focus();
}

function rendre() {
  rendreSelecteur();
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("actif", b.dataset.vue === etat.vue));

  const c = $("#contenu");
  c.innerHTML = "";
  switch (etat.vue) {
    case "accueil":  vueAccueil(c);  break;
    case "famille":  vueMissions(c, "famille"); break;
    case "planete":  vueMissions(c, "planete"); break;
    case "avatar":   vueAvatar(c);   break;
    case "reglages": vueReglages(c); break;
  }
}

/* ---------- Sélecteur d'enfant ---------- */
function rendreSelecteur() {
  const s = $("#selecteur-enfant");
  s.innerHTML = "";
  Object.values(etat.enfants).forEach(enf => {
    const b = el("button", "pastille" + (enf.id === etat.enfantActif ? " actif" : ""));
    b.style.setProperty("--c", enf.couleur);
    b.innerHTML = `<span class="pastille-emoji">${enf.emoji}</span><span class="pastille-nom">${enf.prenom}</span>`;
    b.onclick = () => { etat.enfantActif = enf.id; ecrireCache(); rendre(); };
    s.appendChild(b);
  });
}

/* ---------- Vue Accueil ---------- */
function vueAccueil(c) {
  const enf = enfantActif();

  const carte = el("section", "carte-accueil");
  carte.style.setProperty("--c", enf.couleur);
  carte.innerHTML = `
    <div class="accueil-avatar">${renduAvatar(enf)}</div>
    <h1>Salut ${enf.prenom} ! <small>(${age(enf)} ans)</small></h1>
    <div class="compteurs">
      <div class="compteur"><span class="big">💛 ${enf.coeurs}</span><span>Cœurs à dépenser</span></div>
      <div class="compteur"><span class="big">💧 ${enf.gouttes}</span><span>Gouttes de vie</span></div>
    </div>`;
  c.appendChild(carte);

  // Aperçu écosystème
  const ecoCarte = el("section", "carte");
  const apercu = renduSceneEco(enf);
  ecoCarte.innerHTML = `<h2>🌍 Mon écosystème</h2>
    <div class="eco-mini">${apercu || "🌱 Ta nature attend tes premières plantes…"}</div>
    <p class="eco-statut">${nbTotalEspeces(enf)} êtres vivants</p>`;
  c.appendChild(ecoCarte);

  // Badges
  if (enf.badges.length) {
    const bCarte = el("section", "carte");
    bCarte.innerHTML = `<h2>🏆 Mes badges</h2>
      <div class="badges">${enf.badges.map(b => `<span class="badge">${b.emoji} ${b.nom}</span>`).join("")}</div>`;
    c.appendChild(bCarte);
  }

  // Raccourcis
  const ras = el("section", "raccourcis");
  ras.innerHTML = `
    <button class="gros-bouton famille" data-go="famille">🏡 Missions Famille</button>
    <button class="gros-bouton planete" data-go="planete">🌍 Missions Planète</button>`;
  ras.querySelectorAll("[data-go]").forEach(b =>
    b.onclick = () => { etat.vue = b.dataset.go; sauver(); rendre(); });
  c.appendChild(ras);
}

/* ---------- Vue Missions (famille / planète) ---------- */
function vueMissions(c, catId) {
  const enf = enfantActif();
  const cat = CATEGORIES[catId];
  const jour = aujourdHui();
  const journalJour = enf.journal[jour] || {};

  const entete = el("section", "carte entete-cat");
  entete.style.setProperty("--c", cat.couleur);
  entete.innerHTML = `<h1>${cat.emoji} ${cat.nom}</h1>
    <p>${cat.description}</p>
    <p class="solde">${cat.monnaieEmoji} <strong>${catId === "famille" ? enf.coeurs : enf.gouttes}</strong> ${cat.monnaie}</p>`;
  c.appendChild(entete);

  // Aperçu de la récompense liée
  if (catId === "planete") c.appendChild(vueEcosysteme(enf));

  // Liste des missions adaptées à l'âge
  const liste = el("section", "missions");
  const dispo = MISSIONS.filter(m => m.cat === catId && age(enf) >= m.ageMin);
  dispo.forEach(m => {
    const fait = (journalJour[m.id] || 0) >= 1 && m.type === "quotidien";
    const carte = el("button", "mission" + (fait ? " fait" : ""));
    carte.innerHTML = `
      <span class="m-emoji">${m.emoji}</span>
      <span class="m-titre">${m.titre}</span>
      <span class="m-points">${fait ? "✅" : `+${m.points} ${cat.monnaieEmoji}`}</span>`;
    carte.onclick = () => validerMission(m);
    liste.appendChild(carte);
  });
  c.appendChild(liste);

  // Section famille : défis réparation (alternative à la punition)
  if (catId === "famille") {
    const rep = el("section", "carte reparation");
    rep.innerHTML = `<h2>🌈 Oups, ça arrive…</h2>
      <p>Pas de point en moins ! Quand quelque chose ne va pas, on <strong>répare</strong> et on gagne même un petit bonus.</p>`;
    const g = el("div", "missions");
    DEFIS_REPARATION.forEach(d => {
      const b = el("button", "mission rep");
      b.innerHTML = `<span class="m-emoji">${d.emoji}</span><span class="m-titre">${d.titre}</span><span class="m-points">+${d.bonus} 💛</span>`;
      b.onclick = () => defiReparation(d);
      g.appendChild(b);
    });
    rep.appendChild(g);
    c.appendChild(rep);
  }
}

/* ---------- Scène : tous les êtres vivants créés ---------- */
function renduSceneEco(enf) {
  let html = "";
  TIERS_ECO.forEach(t => {
    t.especes.forEach(sp => {
      const n = (enf.ecosysteme[t.id] || {})[sp.id] || 0;
      for (let i = 0; i < n; i++)
        html += `<span class="eco-item" title="${sp.nom}">${sp.emoji}</span>`;
    });
  });
  return html;
}

/* ---------- Écosystème détaillé (chaîne alimentaire) ---------- */
function vueEcosysteme(enf) {
  const sec = el("section", "carte eco-carte");
  const scene = renduSceneEco(enf);
  sec.innerHTML = `<h2>🌱 Mon écosystème vivant</h2>
    <p class="note">Construis la nature dans le bon ordre : d'abord les 🌱 plantes, puis les 🐰 herbivores qui les mangent, puis les 🦊 carnivores. <strong>Choisis</strong> ce que tu veux créer !</p>
    <div class="eco-scene">${scene || "<span class='eco-vide'>Crée ta première plante 🌱</span>"}</div>`;

  TIERS_ECO.forEach(tier => {
    const bloc = el("div", "eco-tier");
    const debloque = tierDebloque(enf, tier);
    const compte = nbTier(enf, tier.id);

    let entete = `<div class="eco-tier-tete"><span class="t-emoji">${tier.emoji}</span>
      <span class="t-nom">${tier.nom}</span><span class="t-compte">${compte}</span></div>
      <p class="t-lecon">${tier.lecon}</p>`;

    if (!debloque) {
      const manque = manqueePourDebloquer(enf, tier);
      const prec = TIERS_ECO[TIERS_ECO.findIndex(t => t.id === tier.id) - 1];
      bloc.className = "eco-tier verrouille";
      bloc.innerHTML = entete +
        `<p class="t-verrou">🔒 Crée encore <strong>${manque}</strong> ${prec.nom.toLowerCase()} ${prec.emoji} pour nourrir les ${tier.nom.toLowerCase()} et les débloquer.</p>`;
    } else {
      bloc.innerHTML = entete;
      const grille = el("div", "options");
      tier.especes.forEach(sp => {
        const possede = (enf.ecosysteme[tier.id] || {})[sp.id] || 0;
        const o = el("button", "option" + (enf.gouttes < sp.cout ? " verrou" : ""));
        o.innerHTML = `
          <span class="o-emoji">${sp.emoji}</span>
          <span class="o-nom">${sp.nom}${possede ? ` ×${possede}` : ""}</span>
          <span class="o-cout">${sp.cout} 💧</span>`;
        o.onclick = () => creerEspece(tier, sp);
        grille.appendChild(o);
      });
      bloc.appendChild(grille);
    }
    sec.appendChild(bloc);
  });

  return sec;
}

/* ---------- Vue Avatar ---------- */
const AVATAR_LIBELLES = { base: "Personnage", chapeau: "Chapeau", accessoire: "Accessoire", compagnon: "Compagnon", fond: "Décor" };

function vueAvatar(c) {
  const enf = enfantActif();

  const apercu = el("section", "carte avatar-apercu");
  apercu.innerHTML = `<h1>🎨 Mon avatar</h1>
    <div class="avatar-grand">${renduAvatar(enf)}</div>
    <p class="solde">💛 <strong>${enf.coeurs}</strong> Cœurs à dépenser</p>`;
  c.appendChild(apercu);

  Object.keys(AVATAR_OPTIONS).forEach(categorie => {
    const sec = el("section", "carte");
    sec.innerHTML = `<h2>${AVATAR_LIBELLES[categorie]}</h2>`;
    const grille = el("div", "options");
    AVATAR_OPTIONS[categorie].forEach(opt => {
      const dispo = estDebloque(enf, categorie, opt);
      const equipe = enf.avatar[categorie] === opt.id;
      const o = el("button", "option" + (equipe ? " equipe" : "") + (dispo ? "" : " verrou"));
      o.innerHTML = `
        <span class="o-emoji">${opt.emoji || "🚫"}</span>
        <span class="o-nom">${opt.nom}</span>
        <span class="o-cout">${dispo ? (equipe ? "Porté ✅" : "Choisir") : `🔒 ${opt.cout} 💛`}</span>`;
      o.onclick = () => acheterOption(categorie, opt);
      grille.appendChild(o);
    });
    sec.appendChild(grille);
    c.appendChild(sec);
  });
}

function emojiOption(categorie, id) {
  const opt = AVATAR_OPTIONS[categorie].find(o => o.id === id);
  return opt ? opt.emoji : "";
}

function renduAvatar(enf) {
  const a = enf.avatar;
  return `
    <div class="avatar-scene fond-${a.fond}">
      <span class="av-fond">${emojiOption("fond", a.fond)}</span>
      <span class="av-perso">${emojiOption("base", a.base)}</span>
      <span class="av-chapeau">${emojiOption("chapeau", a.chapeau)}</span>
      <span class="av-acc">${emojiOption("accessoire", a.accessoire)}</span>
      <span class="av-comp">${emojiOption("compagnon", a.compagnon)}</span>
    </div>`;
}

/* ---------- Vue Réglages (parents) ---------- */
function vueReglages(c) {
  const intro = el("section", "carte");
  intro.innerHTML = `<h1>⚙️ Espace parents</h1>
    <p>Personnalisez les prénoms et avatars de base. Les missions s'adaptent automatiquement à l'âge de chaque enfant.</p>
    <p class="note">💡 <strong>Esprit « Papa Positive »</strong> : on valorise l'effort, jamais la performance ; on ne retire jamais de points ; on remplace la punition par un « défi réparation ». La coopération est encouragée plutôt que la compétition entre enfants.</p>`;
  c.appendChild(intro);

  Object.values(etat.enfants).forEach(enf => {
    const sec = el("section", "carte reglage-enfant");
    sec.style.setProperty("--c", enf.couleur);
    sec.innerHTML = `<h2>${enf.emoji} ${enf.prenom}</h2>`;

    const lPrenom = el("label", "champ", `Prénom`);
    const iPrenom = el("input");
    iPrenom.value = enf.prenom;
    iPrenom.oninput = () => { majEnfant(enf.id, "prenom", iPrenom.value); rendreSelecteur(); };
    lPrenom.appendChild(iPrenom);

    const lDate = el("label", "champ", `Date de naissance`);
    const iDate = el("input");
    iDate.type = "date"; iDate.value = enf.naissance; iDate.max = aujourdHui(); iDate.min = "2008-01-01";
    iDate.onchange = () => { majEnfant(enf.id, "naissance", iDate.value || enf.naissance); rendreSelecteur(); rendre(); };
    lDate.appendChild(iDate);

    const lSexe = el("label", "champ", `Sexe`);
    const iSexe = el("div", "segmente");
    ["fille", "garcon"].forEach(s => {
      const b = el("button", "seg" + (enf.sexe === s ? " actif" : ""), s === "fille" ? "👧 Fille" : "👦 Garçon");
      b.onclick = () => { majEnfant(enf.id, "sexe", s); rendre(); };
      iSexe.appendChild(b);
    });
    lSexe.appendChild(iSexe);

    const lEmoji = el("label", "champ", `Emoji`);
    const iEmoji = el("input");
    iEmoji.value = enf.emoji; iEmoji.maxLength = 4;
    iEmoji.oninput = () => { majEnfant(enf.id, "emoji", iEmoji.value); rendreSelecteur(); };
    lEmoji.appendChild(iEmoji);

    const lCouleur = el("label", "champ", `Couleur`);
    const iCouleur = el("input");
    iCouleur.type = "color"; iCouleur.value = enf.couleur;
    iCouleur.oninput = () => majEnfant(enf.id, "couleur", iCouleur.value);
    lCouleur.appendChild(iCouleur);

    const stats = el("p", "note", `${age(enf)} ans · Total cumulé : 💛 ${enf.coeursTotal} Cœurs · 💧 ${enf.gouttesTotal} Gouttes · 🌍 ${nbTotalEspeces(enf)} êtres vivants · 🏆 ${enf.badges.length} badges`);

    [lPrenom, lDate, lSexe, lEmoji, lCouleur, stats].forEach(x => sec.appendChild(x));
    c.appendChild(sec);
  });

  // Synchronisation
  const sync = el("section", "carte");
  sync.innerHTML = `<h2>🔄 Synchronisation</h2>
    <p>Code famille actuel : <strong>${codeFamille || "(local)"}</strong></p>
    <p class="note">Saisissez le même code sur vos autres appareils pour partager les mêmes données.</p>`;
  const bCode = el("button", "btn-secondaire", "🔑 Changer de code famille");
  bCode.onclick = changerCode;
  sync.appendChild(bCode);
  c.appendChild(sync);

  const actions = el("section", "carte");
  actions.innerHTML = `<h2>Données</h2>`;
  const bExp = el("button", "btn-secondaire", "💾 Exporter la sauvegarde");
  bExp.onclick = exporter;
  const bRaz = el("button", "btn-danger", "🗑️ Tout réinitialiser");
  bRaz.onclick = reinitialiser;
  actions.appendChild(bExp);
  actions.appendChild(bRaz);
  c.appendChild(actions);
}
