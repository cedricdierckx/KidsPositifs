/* =====================================================================
 * FamiTeam — Vues Famille, Planète (écosystème) et Avatar
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * Les trois vues de récompense : les activités d'équipe (Famille), la planète
 * vivante et son écosystème, et la personnalisation de l'avatar.
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

/* ---------- Vue Famille : activités d'équipe (cartes surprises) ---------- */
function vueFamille(c) {
  const enf = enfantActif();
  const cat = CATEGORIES.famille;

  const entete = el("section", "carte entete-cat");
  entete.style.setProperty("--c", cat.couleur);
  const soldeFam = estJeune(enf)
    ? `<span class="solde-pips">${repeterEmoji(enf.coeurs, cat.monnaieEmoji, 10)}</span>`
    : `${cat.monnaieEmoji} <strong>${enf.coeurs}</strong> ${t("money.coeurs")}`;
  entete.innerHTML = `<h1>${cat.emoji} ${t("cat.famille.nom")}</h1>
    <p class="solde">${soldeFam}</p>`;
  c.appendChild(entete);

  // Cartes surprises : objectif d'équipe à débloquer ensemble.
  c.appendChild(blocCartesSurprises(enf));

  // L'Arbre des familles : purement contemplatif pour l'enfant.
  if (!(typeof modeDemo !== "undefined" && modeDemo)) c.appendChild(blocArbreEnfant());
}

/* ---------- Vue Planète : écosystème ---------- */
function vuePlanete(c) {
  const enf = enfantActif();
  const cat = CATEGORIES.planete;

  const entete = el("section", "carte entete-cat");
  entete.style.setProperty("--c", cat.couleur);
  const soldePla = estJeune(enf)
    ? `<span class="solde-pips">${repeterEmoji(enf.gouttes, cat.monnaieEmoji, 10)}</span>`
    : `${cat.monnaieEmoji} <strong>${enf.gouttes}</strong> ${t("money.gouttes")}`;
  entete.innerHTML = `<h1>${cat.emoji} ${t("cat.planete.nom")}</h1>
    <p>${t("cat.planete.desc")}</p>
    <p class="solde">${soldePla}</p>`;
  c.appendChild(entete);

  // Scène vivante (vue d'ensemble fun, pour les petits).
  c.appendChild(sceneVivante(enf));

  // Écosystème détaillé (chaîne alimentaire).
  c.appendChild(vueEcosysteme(enf));
}

/* ---------- Scène vivante : l'écosystème comme un petit monde ---------- */
function sceneVivante(enf) {
  // On rassemble tous les êtres créés, en distinguant ceux "du ciel".
  const VOLANTS = ["coccinelle", "abeille", "papillon", "hibou", "aigle"];
  const ciel = [], plantes = [], animaux = [];
  let total = 0;
  // Au-delà de ce plafond PAR ESPÈCE, la scène s'arrête d'ajouter des
  // individus supplémentaires (sans le dire) : sans lui, une espèce
  // nombreuse (des dizaines d'escargots, par exemple) devient un amas
  // indistinct, et de plus en plus lourd à animer. Le compte exact reste
  // toujours visible ailleurs — le total sous la scène, et le nombre
  // possédé sur la carte d'achat de chaque espèce (voir carteEspece) — la
  // scène elle-même est une illustration, pas un compteur : pas de badge
  // « +N » ici.
  const CAP_SCENE = 8;
  TIERS_ECO.forEach(tier => {
    tier.especes.forEach(sp => {
      const n = (enf.ecosysteme[tier.id] || {})[sp.id] || 0;
      if (!n) return;
      total += n;
      const cible = VOLANTS.includes(sp.id) ? ciel                 // vole dans le ciel
        : (tier.id === "plantes" ? plantes                         // immobile au sol
        : animaux);                                                // se déplace au sol
      const affiches = Math.min(n, CAP_SCENE);
      for (let k = 0; k < affiches; k++) cible.push(emojiOuRepli(sp.emoji, sp.emojiRepli));
    });
  });
  // Le décor (couleurs uniquement) évolue : désert → prairie → forêt.
  let niveau = "desert";
  if (total >= 20) niveau = "foret"; else if (total >= 8) niveau = "prairie";

  const sec = el("section", "carte eco-monde-carte");
  let html = `<h2>${t("eco.monde_titre")} <span class="ecomonde-niveau">${t("eco.niveau_" + niveau)}</span></h2>
    <div class="ecomonde niveau-${niveau}">
      <div class="ecomonde-ciel">
        <span class="ecomonde-soleil">☀️</span>
        <span class="ecomonde-nuage c1">☁️</span>
        <span class="ecomonde-nuage c2">☁️</span>`;
  ciel.forEach((e, i) => { html += `<span class="ecomonde-vol" style="--i:${i}">${e}</span>`; });
  html += `</div><div class="ecomonde-sol">`;
  if (!total) {
    html += `<span class="ecomonde-vide">${t("eco.monde_vide")}</span>`;
  } else {
    // Plantes : immobiles (elles ne bougent pas).
    plantes.forEach(e => { html += `<span class="ecomonde-flore">${e}</span>`; });
    // Animaux : se déplacent au sol (marche + saut « Pixar »).
    animaux.forEach((e, i) => {
      html += `<span class="ecomonde-etre" style="--i:${i}"><span class="ecomonde-corps">${e}</span></span>`;
    });
  }
  html += `</div></div>
    <p class="eco-statut">${t("home.etres_vivants", { n: total })}</p>`;
  sec.innerHTML = html;
  return sec;
}

/* ---------- Scène : tous les êtres vivants créés ---------- */
function renduSceneEco(enf) {
  let html = "";
  TIERS_ECO.forEach(t => {
    t.especes.forEach(sp => {
      const n = (enf.ecosysteme[t.id] || {})[sp.id] || 0;
      for (let i = 0; i < n; i++)
        html += `<span class="eco-item" title="${trData("espece", sp.id, sp.nom)}">${emojiOuRepli(sp.emoji, sp.emojiRepli)}</span>`;
    });
  });
  return html;
}

/* ---------- Écosystème détaillé (chaîne alimentaire, cartes) ---------- */
function vueEcosysteme(enf) {
  const sec = el("section", "carte eco-carte");
  const jeune = estJeune(enf);
  sec.innerHTML = `<h2>${t("eco.titre")}</h2>
    <p class="note">${t("eco.intro")}</p>`;
  // Le mode « tous petits » masque les cartes non atteignables — sans le
  // dire, une catégorie entière peut sembler avoir disparu (signalé comme un
  // bug par une famille : « les carnivores ont disparu chez Pauline »).
  // Un mot au parent suffit à couper court à l'inquiétude.
  if (jeune) sec.appendChild(el("p", "note eco-mode-simplifie", t("eco.mode_simplifie", { prenom: echapper(enf.prenom) })));

  TIERS_ECO.forEach(tier => {
    const bloc = el("div", "eco-tier");
    const compte = nbTier(enf, tier.id);
    const compteAff = jeune ? repeterEmoji(compte, tier.emoji, 5) : compte;
    bloc.innerHTML = `<div class="eco-tier-tete"><span class="t-emoji">${tier.emoji}</span>
      <span class="t-nom">${trData("tier", tier.id, tier.nom)}</span><span class="t-compte${jeune ? " imgs" : ""}">${compteAff}</span></div>
      <p class="t-lecon">${trData("lecon", tier.id, tier.lecon)}</p>`;

    const grille = el("div", "eco-cartes");
    // Mode « tous petits » (estJeune) : pas de cartes verrouillées à
    // déchiffrer — juste celles qu'on peut créer là, tout de suite. Passé le
    // seuil d'âge, la carte verrouillée reste utile : elle dit quoi viser.
    const especesVisibles = tier.especes
      .filter(sp => especeActivePourEnfant(enf, sp.id))
      .filter(sp => !jeune || (especeDebloquee(enf, sp) && enf.gouttes >= coutEspece(enf, sp)));
    especesVisibles.forEach(sp => grille.appendChild(carteEspece(enf, tier, sp)));
    bloc.appendChild(grille);
    // Catégorie entièrement filtrée (rien d'atteignable pour l'instant) :
    // le dire plutôt que de laisser un vide muet sous le titre.
    if (jeune && !especesVisibles.length) {
      bloc.appendChild(el("p", "note eco-tier-vide", t("eco.tier_vide")));
    }
    sec.appendChild(bloc);
  });

  return sec;
}

// Une carte d'espèce : emoji, nom, coût, prérequis cochés, état.
function carteEspece(enf, tier, sp) {
  const possede = (enf.ecosysteme[tier.id] || {})[sp.id] || 0;
  const prereqOk = especeDebloquee(enf, sp);
  const cout = coutEspece(enf, sp);
  const assezGouttes = enf.gouttes >= cout;
  const creable = prereqOk && assezGouttes;

  let etatCls = creable ? "creable" : (prereqOk ? "verrou-cout" : "verrou-prereq");
  const carte = el("button", "eco-carte-sp " + etatCls);

  // Prérequis : rien s'il n'y en a pas. Pour les petits (≤ seuil), on les
  // montre en images (ex. 2 fleurs côte à côte) ; sinon en compteur "x/y".
  let prereqHtml = "";
  const entrees = Object.keys(sp.prereq || {});
  const jeune = estJeune(enf);
  if (entrees.length) {
    prereqHtml = `<div class="ec-prereq">` + entrees.map(id => {
      const info = spInfo(id);
      const emoji = info ? info.sp.emoji : "?";
      const a = nbEspece(enf, id), req = sp.prereq[id];
      const ok = a >= req;
      if (jeune) {
        let imgs = "";
        for (let i = 0; i < req; i++) imgs += `<span class="ec-img${i < a ? " ok" : " ko"}">${emoji}</span>`;
        return `<span class="ec-need-img${ok ? " ok" : ""}">${imgs}</span>`;
      }
      return `<span class="ec-need ${ok ? "ok" : "ko"}">${emoji} ${a}/${req}${ok ? " ✓" : ""}</span>`;
    }).join("") + `</div>`;
  }

  const coinAff = jeune ? repeterEmoji(possede, sp.emoji, 5) : (possede ? "×" + possede : "");
  const coutAff = jeune ? repeterEmoji(cout, "💧", 6) : `${cout} 💧`;
  carte.innerHTML = `
    <span class="ec-coin${jeune ? " imgs" : ""}">${possede ? coinAff : ""}</span>
    <span class="ec-emoji">${emojiOuRepli(sp.emoji, sp.emojiRepli)}</span>
    <span class="ec-nom">${trData("espece", sp.id, sp.nom)}</span>
    <span class="ec-cout ${assezGouttes ? "" : "manque"}">${coutAff}</span>
    ${prereqHtml}
    <span class="ec-etat">${creable ? t("eco.creer") : (prereqOk ? t("eco.plus_gouttes") : t("eco.verrouille"))}</span>`;
  carte.onclick = () => creerEspece(tier, sp);
  return carte;
}

/* ---------- Vue Avatar ---------- */
const AVATAR_LIBELLES = {
  peau: "Couleur de peau", coiffure: "Coiffure", cheveux: "Couleur des cheveux",
  yeux: "Yeux", lunettes: "Lunettes", taches: "Taches de rousseur",
  pilosite: "Moustache / barbe", boucles: "Boucles d'oreilles", chapeau: "Chapeau",
  accessoire: "Accessoire", compagnon: "Compagnon", fond: "Décor"
};

function vueAvatar(c) {
  const enf = enfantActif();
  const jeune = estJeune(enf);

  const apercu = el("section", "carte avatar-apercu");
  const soldeAv = jeune
    ? `<span class="solde-pips">${repeterEmoji(enf.coeurs, "💛", 10)}</span>`
    : `💛 <strong>${enf.coeurs}</strong> Cœurs à dépenser`;
  apercu.innerHTML = `<h1>🎨 Mon avatar</h1>
    <div class="avatar-grand">${renduAvatar(enf)}</div>
    <p class="solde">${soldeAv}</p>`;
  c.appendChild(apercu);

  Object.keys(AVATAR_OPTIONS).forEach(categorie => {
    const sec = el("section", "carte");
    sec.innerHTML = `<h2>${AVATAR_LIBELLES[categorie]}</h2>`;
    const grille = el("div", "options");
    AVATAR_OPTIONS[categorie].forEach(opt => {
      const dispo = estDebloque(enf, categorie, opt);
      const equipe = enf.avatar[categorie] === opt.id;
      const o = el("button", "option" + (equipe ? " equipe" : "") + (dispo ? "" : " verrou"));
      let cout;
      if (dispo) cout = equipe ? (jeune ? "✅" : "Porté ✅") : (jeune ? "👆" : "Choisir");
      else cout = jeune ? `🔒 ${repeterEmoji(opt.cout, "💛", 6)}` : `🔒 ${opt.cout} 💛`;
      o.innerHTML = `
        <span class="o-apercu">${apercuOption(enf, categorie, opt)}</span>
        <span class="o-nom">${trData("avatar." + categorie, opt.id, opt.nom)}</span>
        <span class="o-cout">${cout}</span>`;
      o.onclick = () => acheterOption(categorie, opt);
      grille.appendChild(o);
    });
    sec.appendChild(grille);
    c.appendChild(sec);
  });
}

// Aperçu d'une option : on rend l'avatar de l'enfant en remplaçant
// uniquement la catégorie concernée, pour montrer l'effet réel.
function apercuOption(enf, categorie, opt) {
  if (categorie === "peau" || categorie === "cheveux") {
    // pour les couleurs, une pastille est plus lisible
    return `<span class="o-swatch" style="background:${opt.hex}"></span>`;
  }
  const apercu = { ...enf.avatar, [categorie]: opt.id };
  return buildAvatar(apercu);
}

function renduAvatar(enf) {
  return `<div class="avatar-scene">${buildAvatar(enf.avatar)}</div>`;
}
