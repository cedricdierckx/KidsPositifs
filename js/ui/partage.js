/* =====================================================================
 * FamiTeam — Arbre des familles, dépliant, carte d'ami, partage de fichiers
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * Tout ce qui sort de l'app pour aller vers quelqu'un d'autre : l'arbre des
 * familles amenées, le dépliant à imprimer, la carte d'ami (image PNG dessinée
 * au canvas) et les chemins de partage/téléchargement, web comme natifs.
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

/* ---------- L'Arbre des familles : le dessin partagé ----------
 * Chaque famille VIVANTE amenée par la famille fait apparaître une feuille.
 * Volontairement sans chiffre pour l'enfant : on voit l'arbre se garnir, on ne
 * se compare à personne. Au-delà de dix feuilles, un « +N » discret. */
const ARBRE_FEUILLES_MAX = 10;
// Branches : [départ sur le tronc, extrémité]. Toujours dessinées, même sans
// feuille — un arbre nu qui se couvre de feuilles se comprend d'un coup d'œil,
// là où une couronne de pastilles ressemble à une jauge circulaire.
const ARBRE_BRANCHES = [
  [60, 88, 36, 72], [60, 82, 84, 66], [60, 70, 42, 54],
  [60, 64, 78, 48], [60, 54, 50, 38], [60, 52, 70, 36]
];
// Feuilles, dans l'ordre d'apparition : du sommet vers le bas, en alternant à
// gauche et à droite, pour que l'arbre paraisse toujours équilibré.
const ARBRE_FEUILLES = [
  [60, 30], [48, 36], [72, 34], [40, 52], [80, 46],
  [34, 70], [86, 64], [54, 46], [68, 48], [60, 58]
];
function arbreSvgFamilles(n, options) {
  const o = options || {};
  const total = Math.max(0, parseInt(n, 10) || 0);
  const visibles = Math.min(total, ARBRE_FEUILLES_MAX);
  const branches = ARBRE_BRANCHES.map(([x1, y1, x2, y2]) =>
    `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${y2 + 4} ${x2},${y2}" fill="none" stroke="#b07a45" stroke-width="3.5" stroke-linecap="round"/>`).join("");
  const feuilles = ARBRE_FEUILLES.map(([cx, cy], i) => {
    const vive = i < visibles;
    // Ellipse inclinée : lisible comme une feuille dès 24 px de large.
    return `<ellipse cx="${cx}" cy="${cy}" rx="11" ry="7.5"` +
      ` transform="rotate(${i % 2 ? 28 : -28} ${cx} ${cy})"` +
      ` fill="${vive ? "#39c0a0" : "#f2f6f5"}" stroke="${vive ? "#2aa88a" : "#dde7e3"}" stroke-width="1.5"/>`;
  }).join("");
  const surplus = total > ARBRE_FEUILLES_MAX
    ? `<circle cx="97" cy="30" r="14" fill="#2aa88a"/>` +
      `<text x="97" y="35" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">+${total - ARBRE_FEUILLES_MAX}</text>`
    : "";
  return `<svg viewBox="0 0 120 118" class="arbre-dessin${o.classe ? " " + o.classe : ""}" role="img" aria-label="${o.alt || ""}">` +
    `<rect x="26" y="109" width="68" height="5" rx="2.5" fill="#e6ecf2"/>` +
    `<path d="M55,110 C55,92 54,74 57,44 L63,44 C66,74 65,92 65,110 Z" fill="#b07a45"/>` +
    branches + feuilles + surplus + `</svg>`;
}

/* Bloc « Arbre des familles » côté ENFANT : le dessin, une phrase, rien à
 * compter et rien à faire. L'enfant n'est jamais chargé de recruter (voir
 * PLAN-PARRAINAGE § 1.2) ; il voit seulement l'arbre de la famille grandir. */
function blocArbreEnfant() {
  const sec = el("section", "carte arbre-enfant");
  sec.innerHTML = `<h2>${t("arbre.titre")}</h2>
    <div class="arbre-enfant-corps">${arbreSvgFamilles(0, { alt: t("arbre.titre") })}
    <p class="note">${t("arbre.attente")}</p></div>`;
  if (typeof parrainageBilan !== "function") return sec;
  parrainageBilan().then(b => {
    const n = b ? (b.installees || 0) : 0;
    const phrase = n === 0 ? t("arbre.enfant_zero")
                 : (n === 1 ? t("arbre.enfant_une") : t("arbre.enfant_n", { n }));
    sec.querySelector(".arbre-enfant-corps").innerHTML =
      arbreSvgFamilles(n, { alt: phrase })
      + `<div><p class="arbre-enfant-phrase">${phrase}</p>
         <p class="arbre-enfant-expli">${t("arbre.enfant_expli", { app: APP_NOM })}</p></div>`;
  }).catch(() => sec.remove());
  return sec;
}

/* Bascule les règles @media print le temps de l'impression : seule la cible
 * marquée `.impression-cible` part sur le papier. Partagé par la carte d'ami et
 * le dépliant des écoles. */
async function imprimerCible() {
  // L'impression du navigateur n'existe pas dans la WebView Android : le
  // bouton ne faisait rien du tout dans l'app installée. On y construit
  // donc un vrai PDF (voir pdfDepuisElement plus haut), tenté avant toute
  // autre voie, plutôt que de se contenter de le dire.
  if (greffonNatif("Filesystem")) {
    const cible = document.querySelector(".impression-cible");
    if (!cible) { toast(t("impr.echec"), "info"); return false; }
    try {
      const blob = await pdfDepuisElement(cible);
      const ok = await enregistrerOuPartager(blob, "famiteam-" + aujourdHui() + ".pdf", APP_NOM);
      toast(ok ? t("impr.pdf_pret") : t("impr.echec"), ok ? "ok" : "info");
      return !!ok;
    } catch (e) { toast(t("impr.echec"), "info"); return false; }
  }
  if (typeof window.print !== "function") {
    if (typeof toast === "function") toast(t("impr.indispo", { hote: "fami.team" }), "info");
    return false;
  }
  document.body.classList.add("impression");
  window.print();
  setTimeout(() => document.body.classList.remove("impression"), 1000);
  return true;
}

/* ---------- Le dépliant A5 des écoles ----------
 * Une institutrice convaincue parle à vingt-cinq familles d'un coup : c'est le
 * meilleur rendement horaire du plan commercial. La feuille s'adresse donc à un
 * PARENT qui ne connaît pas encore l'app et qui la trouve dans le cartable.
 * Elle ne porte AUCUN code de famille — distribuer une feuille à vingt-cinq
 * familles n'est pas un parrainage — mais un lien marqué (?src=), qui fait
 * apparaître l'école dans « l'origine des inscriptions ». Et elle porte le nom
 * du projet, jamais celui d'une personne (contrainte d'anonymat, § 0.2). */
/* Le dépliant part sur du papier : son lien ne doit JAMAIS dépendre de l'origine
 * courante. Imprimé depuis un aperçu de déploiement, il porterait une URL
 * d'aperçu — illisible dans six mois — et dépasserait au passage la capacité du
 * QR. On écrit donc le domaine officiel, et le plus court des deux : sur du
 * papier, une adresse courte se recopie à la main. */
const DEPLIANT_HOTE = "https://fami.team/";
const DEPLIANT_SRC_MAX = 24;          // au-delà, le QR déborde de sa capacité
function normaliserSourceDepliant(brut) {
  return String(brut || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // accents retirés : l'URL reste lisible
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, DEPLIANT_SRC_MAX);
}
function lienDepliant(source) {
  const src = normaliserSourceDepliant(source) || "ecole";
  return DEPLIANT_HOTE + "?src=" + src;
}

function modaleDepliant() {
  const ov = el("div", "pin-modal");
  ov.innerHTML = `
    <div class="pin-carte depliant-hote">
      <button class="modale-fermer" aria-label="${t("common.fermer")}">✕</button>
      <div class="pin-titre">${t("dep.titre")}</div>
      <p class="note">${t("dep.mode_emploi")}</p>
      <input id="dep-src" class="aj-val" maxlength="${DEPLIANT_SRC_MAX}" placeholder="${t("dep.src_ph")}">
      <div id="dep-page"></div>
      <button id="dep-imprimer" class="gros-bouton planete">🖨️ ${t("cami.imprimer")}</button>
    </div>`;
  document.body.appendChild(ov);
  const fermer = () => { document.body.classList.remove("impression"); ov.remove(); };
  ov.querySelector(".modale-fermer").onclick = fermer;
  ov.addEventListener("click", e => { if (e.target === ov) fermer(); });

  const zone = ov.querySelector("#dep-page");
  const champ = ov.querySelector("#dep-src");
  const dessiner = () => {
    const lien = lienDepliant(champ.value);
    const qr = (typeof qrSvg === "function" && qrSvg(lien, { classe: "depliant-qr" })) || "";
    // L'URL affichée en clair sous le QR : tous les parents ne scannent pas.
    const visible = lien.replace(/^https?:\/\//, "");
    zone.innerHTML = `<div class="depliant-page impression-cible">
      <p class="depliant-logo">🌟 ${APP_NOM}</p>
      <p class="depliant-promesse">${t("dep.promesse")}</p>
      <ul class="depliant-points">
        <li><span>🎯</span><span>${t("dep.p1")}</span></li>
        <li><span>💛</span><span>${t("dep.p2")}</span></li>
        <li><span>🛠️</span><span>${t("dep.p3")}</span></li>
      </ul>
      <div class="depliant-qr-cadre">${qr}</div>
      <p class="depliant-url">${echapper(visible)}</p>
      <p class="depliant-gratuit">${t("dep.gratuit")}</p>
      <p class="depliant-rgpd">${t("dep.rgpd")}</p>
    </div>`;
  };
  champ.oninput = dessiner;
  dessiner();
  ov.querySelector("#dep-imprimer").onclick = imprimerCible;
}

/* ---------- La carte d'ami : le seul objet confié à l'enfant ----------
 * Une page à imprimer, à colorier, et à donner à un copain. L'enfant n'est
 * jamais chargé de recruter (PLAN-PARRAINAGE § 1.2) : il montre quelque chose
 * dont il est fier. La transmission passe par les parents — le copain montre
 * la carte chez lui, et c'est SON parent qui scanne le code.
 * Aucune donnée du copain n'est jamais saisie : la carte est du papier. */
function zonesAColorier() {
  // Contours vides, épais, sans remplissage : faits pour être coloriés au
  // crayon par un enfant de 4 ans (traits de 2,5 px à l'impression).
  const f = 'fill="none" stroke="#9fb3c8" stroke-width="2.5" stroke-linejoin="round"';
  return `<svg viewBox="0 0 300 70" class="carte-ami-colorier" role="presentation">
    <circle cx="38" cy="35" r="20" ${f}/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
      const r = a * Math.PI / 180;
      return `<line x1="${(38 + Math.cos(r) * 24).toFixed(1)}" y1="${(35 + Math.sin(r) * 24).toFixed(1)}" x2="${(38 + Math.cos(r) * 31).toFixed(1)}" y2="${(35 + Math.sin(r) * 31).toFixed(1)}" stroke="#9fb3c8" stroke-width="2.5" stroke-linecap="round"/>`;
    }).join("")}
    <path d="M150,60 C120,40 124,18 138,18 c6,0 10,4 12,8 2,-4 6,-8 12,-8 14,0 18,22 -12,42 z" ${f}/>
    <path d="M252,14 l7,15 16,2 -12,11 3,16 -14,-8 -14,8 3,-16 -12,-11 16,-2 z" ${f}/>
  </svg>`;
}

function modaleCarteAmi(enf) {
  const prenom = (enf && enf.prenom) ? echapper(enf.prenom) : "";
  const avatar = (typeof buildAvatar === "function" && enf && enf.avatar) ? buildAvatar(enf.avatar) : "";
  const ov = el("div", "pin-modal carte-ami-modal");
  ov.innerHTML = `
    <div class="pin-carte carte-ami-hote">
      <button class="modale-fermer" aria-label="${t("common.fermer")}">✕</button>
      <div class="pin-titre">${t("cami.titre")}</div>
      <p class="note">${t("cami.mode_emploi")}</p>
      <div class="carte-ami-page impression-cible" id="carte-ami-page">
        <div class="carte-ami-haut">
          <div class="carte-ami-avatar">${avatar}</div>
          <div class="carte-ami-mots">
            <p class="carte-ami-moi">${t("cami.moi", { prenom })}</p>
            <p class="carte-ami-invite">${t("cami.invite", { app: APP_NOM })}</p>
          </div>
        </div>
        ${zonesAColorier()}
        <p class="carte-ami-colorier-note">${t("cami.colorier")}</p>
        <div class="carte-ami-bas" id="carte-ami-bas"><p class="note">${t("arbre.attente")}</p></div>
      </div>
      <div class="carte-ami-actions">
        <button id="carte-imprimer" class="gros-bouton planete">🖨️ ${t("cami.imprimer")}</button>
        <button id="carte-partager" class="gros-bouton">📤 ${t("cami.partager")}</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const fermer = () => { document.body.classList.remove("impression"); ov.remove(); };
  ov.querySelector(".modale-fermer").onclick = fermer;
  ov.addEventListener("click", e => { if (e.target === ov) fermer(); });

  // Le partage attend le code : proposer un bouton qui n'enverrait rien serait pire
  // que ne rien proposer du tout.
  const bPartager = ov.querySelector("#carte-partager");
  let lienCarte = "";
  bPartager.disabled = true;
  let codeCarte = "";
  bPartager.onclick = () => partagerCarteAmi(enf, lienCarte, codeCarte);

  codeParrainage().then(code => {
    const bas = ov.querySelector("#carte-ami-bas");
    if (!code) { bas.innerHTML = `<p class="note">${t("arbre.indispo")}</p>`; return; }
    const lien = lienDepuisCode(code);
    lienCarte = lien;
    codeCarte = code;
    bPartager.disabled = false;
    // Si le QR ne peut pas être produit, on l'écrit. Interpoler un null donnait
    // littéralement « null » au milieu de la carte, sous les yeux de l'enfant.
    const qr = (typeof qrSvg === "function" && qrSvg(lien, { classe: "carte-ami-qr", titre: code }))
      || `<p class="note carte-ami-sansqr">${t("cami.sans_qr")}</p>`;
    bas.innerHTML = `${qr}<div class="carte-ami-parents">
        <p class="carte-ami-parents-titre">${t("cami.parents_titre")}</p>
        <p class="carte-ami-parents-texte">${t("cami.parents_texte", { app: APP_NOM })}</p>
        <p class="carte-ami-code">${echapper(code)}</p></div>`;
  }).catch(() => {});

  ov.querySelector("#carte-imprimer").onclick = () => {
    imprimerCible();
  };
}

/* ---------- Image partageable de la carte d'ami ----------
 * Un lien nu dans une conversation n'a rien d'une invitation. On dessine donc
 * la carte sur un canevas et on la partage comme IMAGE, le lien accompagnant
 * en légende. Le dessin est fait à la main plutôt que capturé depuis le DOM :
 * html2canvas ou un SVG en foreignObject dépendent des polices et des règles
 * CSS chargées, et échouent silencieusement. Ici, ce qui est dessiné est ce
 * qui part.
 */
const CARTE_IMG_L = 1080;                       // format portrait, lisible en messagerie

function carteAmiLignes(ctx, texte, largeurMax) {
  const lignes = [];
  let courante = "";
  String(texte).split(" ").forEach(mot => {
    const essai = courante ? courante + " " + mot : mot;
    if (ctx.measureText(essai).width > largeurMax && courante) { lignes.push(courante); courante = mot; }
    else courante = essai;
  });
  if (courante) lignes.push(courante);
  return lignes;
}
function carteAmiTexteCentre(ctx, texte, y, largeurMax, interligne) {
  const lignes = carteAmiLignes(ctx, texte, largeurMax);
  lignes.forEach((l, i) => ctx.fillText(l, CARTE_IMG_L / 2, y + i * interligne));
  return y + lignes.length * interligne;
}

function carteAmiRectArrondi(ctx, x, y, l, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + h, r);
  ctx.arcTo(x + l, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
}

// L'avatar de l'enfant est un SVG : on le passe par une data-URI pour le
// dessiner sur le canevas. S'il n'arrive pas — SVG mal formé, navigateur
// récalcitrant — on renvoie null et la carte se dessine sans lui.
function carteAmiAvatar(enf) {
  return new Promise((resolve) => {
    try {
      if (typeof buildAvatar !== "function" || !enf || !enf.avatar) return resolve(null);
      const svg = buildAvatar(enf.avatar);
      if (!svg || svg.indexOf("<svg") === -1) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      setTimeout(() => resolve(null), 2000);       // ne jamais bloquer le partage
    } catch (e) { resolve(null); }
  });
}

/* Dessine la carte et renvoie un Blob PNG (null si le canevas est indisponible).
 * La hauteur s'ajuste au contenu : un QR absent ou un prénom long ne doit ni
 * laisser un grand vide, ni déborder. */
async function imageCarteAmi(enf, code, lien) {
  try {
    const avatar = await carteAmiAvatar(enf);
    const mesure = document.createElement("canvas").getContext("2d");
    if (!mesure) return null;
    const police = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
    const prenom = (enf && enf.prenom) ? enf.prenom : "";
    const largeurTexte = CARTE_IMG_L - 200;

    // --- 1ʳᵉ passe : on mesure pour connaître la hauteur exacte ---
    const m = (typeof qrMatrice === "function") ? qrMatrice(lien) : null;
    const qrCote = m ? Math.floor(560 / (m.length + 8)) * (m.length + 8) : 0;
    mesure.font = "800 76px " + police;
    const lMoi = carteAmiLignes(mesure, t("cami.moi", { prenom }), largeurTexte);
    mesure.font = "800 52px " + police;
    const lInvite = carteAmiLignes(mesure, t("cami.invite", { app: APP_NOM }), CARTE_IMG_L - 220);
    mesure.font = "600 32px " + police;
    const lParents = carteAmiLignes(mesure,
      t("cami.parents_texte", { app: APP_NOM }).replace(/<[^>]+>/g, ""), CARTE_IMG_L - 220);

    const hAvatar = avatar ? 200 : 0;
    const hauteur = 110 + hAvatar + lMoi.length * 88 + 26 + lInvite.length * 66
      + (m ? 50 + qrCote + 36 : 40) + 40 + 78 + lParents.length * 42 + 150;

    const cv = document.createElement("canvas");
    cv.width = CARTE_IMG_L; cv.height = Math.round(hauteur);
    const ctx = cv.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#fdf8ef";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#c9b79a"; ctx.lineWidth = 6; ctx.setLineDash([18, 14]);
    carteAmiRectArrondi(ctx, 34, 34, cv.width - 68, cv.height - 68, 44);
    ctx.stroke(); ctx.setLineDash([]);

    ctx.textAlign = "center"; ctx.textBaseline = "top";
    let y = 96;
    if (avatar) {
      const cote = 170, x0 = (CARTE_IMG_L - cote) / 2;
      ctx.fillStyle = "#cfe6fb";
      carteAmiRectArrondi(ctx, x0, y, cote, cote, 32);
      ctx.fill();
      try { ctx.drawImage(avatar, x0, y, cote, cote); } catch (e) { /* avatar ignoré */ }
      y += cote + 30;
    }
    ctx.fillStyle = "#27384a"; ctx.font = "800 76px " + police;
    y = carteAmiTexteCentre(ctx, t("cami.moi", { prenom }), y, largeurTexte, 88);
    ctx.fillStyle = "#2f7d5e"; ctx.font = "800 52px " + police;
    y = carteAmiTexteCentre(ctx, t("cami.invite", { app: APP_NOM }), y + 26, CARTE_IMG_L - 220, 66);

    if (m) {
      const marge = 4, cote = m.length + marge * 2;
      const px = Math.floor(560 / cote), taille = px * cote;
      const x0 = Math.round((CARTE_IMG_L - taille) / 2), y0 = y + 50;
      ctx.fillStyle = "#ffffff";
      carteAmiRectArrondi(ctx, x0 - 18, y0 - 18, taille + 36, taille + 36, 20);
      ctx.fill();
      ctx.fillStyle = "#101720";
      for (let i = 0; i < m.length; i++) for (let j = 0; j < m.length; j++) {
        if (m[i][j] === 1) ctx.fillRect(x0 + (j + marge) * px, y0 + (i + marge) * px, px, px);
      }
      y = y0 + taille + 36;
    } else {
      y += 40;   // pas de QR : le code écrit suffit, mais on ne laisse pas de trou
    }

    ctx.fillStyle = "#27384a";
    ctx.font = "800 58px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(String(code || ""), CARTE_IMG_L / 2, y);
    y += 78;
    ctx.fillStyle = "#6b7c8d"; ctx.font = "600 32px " + police;
    y = carteAmiTexteCentre(ctx, t("cami.parents_texte", { app: APP_NOM }).replace(/<[^>]+>/g, ""),
      y, CARTE_IMG_L - 220, 42);
    ctx.font = "800 34px " + police; ctx.fillStyle = "#2f7d5e";
    ctx.fillText("fami.team", CARTE_IMG_L / 2, cv.height - 96);

    if (!cv.toBlob) return null;
    return await new Promise((resolve) => cv.toBlob(resolve, "image/png"));
  } catch (e) { return null; }
}

/* Partage de la carte : une IMAGE accompagnée du lien. Le destinataire est le
 * parent de l'ami — il doit voir de quoi il s'agit avant de cliquer. Trois
 * niveaux de repli, du meilleur au plus modeste :
 *   1. image + lien par le sélecteur natif (téléphones récents) ;
 *   2. lien seul par le sélecteur natif (partage de fichiers non permis) ;
 *   3. image téléchargée et lien copié (ordinateurs).
 */
async function partagerCarteAmi(enf, lien, code) {
  if (!lien) return;
  const prenom = (enf && enf.prenom) ? enf.prenom : "";
  const texte = t("cami.partage_texte", { prenom, app: APP_NOM });
  const titre = t("cami.partage_titre", { prenom });
  const blob = await imageCarteAmi(enf, code, lien);

  // Dans l'app installée, `navigator.share` n'existe pas : la WebView Android
  // ne fournit pas l'API de partage du web. Sans ce premier essai, la fonction
  // traversait tous les replis pour finir sur un telechargerBlob sans effet —
  // le bouton ne faisait rien, et rien ne le disait.
  if (greffonNatif("Share")) {
    const nom = "famiteam-" + (prenom || "carte") + ".png";
    if (await partagerFichierNatif(blob, nom, titre, texte + " " + lien)) return;
  }

  if (blob && navigator.canShare && typeof File === "function") {
    const fichier = new File([blob], "famiteam-" + (prenom || "carte") + ".png", { type: "image/png" });
    if (navigator.canShare({ files: [fichier] })) {
      // Le lien va dans le texte : beaucoup d'applications ignorent « url »
      // quand un fichier est joint, et l'invitation partirait sans son lien.
      try { await navigator.share({ files: [fichier], title: titre, text: texte + " " + lien }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
  }
  if (navigator.share) {
    try { await navigator.share({ title: titre, text: texte, url: lien }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  if (blob) telechargerBlob(blob, "famiteam-" + (prenom || "carte") + ".png");
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("presse-papiers indisponible");
    await navigator.clipboard.writeText(texte + " " + lien);
    toast(t(blob ? "cami.partage_ordi" : "lien.copie"), "succes");
  } catch (e) {
    toast(lien, "info");   // dernier recours : le lien reste au moins lisible
  }
}

// Téléchargement d'un blob : utilisé par l'image de la carte et par le .ics.
// Dans l'app installée, la WebView Android ignore l'attribut `download` SANS
// lever d'erreur : `a.click()` ne fait rien et cette fonction renvoyait
// pourtant `true`. Tous ses appelants croyaient donc avoir réussi, et le
// parent voyait un bouton sans effet. On refuse ici, franchement, pour que
// l'appelant prenne le chemin natif ou prévienne.
function telechargerBlob(blob, nom) {
  if (greffonNatif("Filesystem")) return false;
  try {
    const url = URL.createObjectURL(blob);
    const a = el("a");
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return true;
  } catch (e) { return false; }
}

/* ---------- Envoyer un .ics vers l'agenda de l'appareil ----------
 * Sur le web, le lien « download » ci-dessus suffit. Dans l'app installée
 * (Capacitor), il ne suffit plus : la WebView Android ignore purement et
 * simplement l'attribut `download`, et sans lever la moindre erreur — le
 * parent tape « Ajouter à mon agenda », rien ne se passe, pas même un
 * message. Vu du parent, la fonction a disparu en passant du site à l'app.
 *
 * Dans l'app, on passe donc par le pont natif : écrire le .ics dans le cache
 * de l'app (que le téléphone peut vider : rien ne s'accumule, et rien de
 * personnel ne sort de l'appareil), puis demander à l'appareil de l'OUVRIR.
 * L'agenda affiche alors l'événement et propose de l'enregistrer. Si aucune
 * application ne sait ouvrir un .ics, on retombe sur la feuille de partage,
 * qui permet au moins de se l'envoyer par mail.
 *
 * Les greffons sont lus sur `window.Capacitor.Plugins` : l'app n'est pas
 * « bundlée » (des <script> classiques, pas de modules), il n'y a donc aucun
 * import à faire — le pont natif expose lui-même les greffons installés, et
 * cet objet n'existe pas du tout sur le web.
 */
function greffonNatif(nom) {
  const cap = (typeof window !== "undefined") ? window.Capacitor : null;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return null;
  return (cap.Plugins && cap.Plugins[nom]) || null;
}

// Écrit le fichier puis l'ouvre. Renvoie "natif" si l'agenda a été sollicité,
// false si le pont n'est pas disponible (app trop ancienne, greffon absent).
async function ouvrirIcsNatif(ics, nomFichier, titre) {
  const fichiers = greffonNatif("Filesystem");
  if (!fichiers) return false;
  // "CACHE" / "utf8" : les valeurs des énumérations Directory.Cache et
  // Encoding.UTF8, écrites en clair puisqu'on parle au pont sans le paquet JS.
  await fichiers.writeFile({ path: nomFichier, data: ics, directory: "CACHE", encoding: "utf8" });
  const { uri } = await fichiers.getUri({ path: nomFichier, directory: "CACHE" });

  const ouvreur = greffonNatif("FileOpener");
  if (ouvreur) {
    try {
      // openWithDefault: false — certains calendriers réglés comme
      // application par défaut (constaté : Calendrier Samsung) refusent
      // l'intent sans le dire à FamiTeam : `open()` réussit du point de vue
      // du pont (l'activité a bien démarré), mais l'application cible échoue
      // ensuite en silence de son côté. On force donc le sélecteur système,
      // pour que le parent puisse choisir un autre calendrier (p. ex. Google
      // Agenda) si celui par défaut ne sait pas importer ce fichier.
      await ouvreur.open({ filePath: uri, contentType: "text/calendar", openWithDefault: false });
      return "natif";
    } catch (e) { /* aucune application pour ouvrir un .ics : on partage */ }
  }
  const partage = greffonNatif("Share");
  if (partage) {
    await partage.share({ title: titre || APP_NOM, files: [uri] });
    return "natif";
  }
  return false;
}

/* ---------- Partager un fichier depuis l'app installée ----------
 * Même principe que l'agenda ci-dessus, mais pour un fichier binaire (une
 * image) et avec le PARTAGE comme action, non l'ouverture : le parent veut
 * l'envoyer à quelqu'un, pas la regarder.
 *
 * Le pont natif n'accepte pas un Blob : on passe par du base64, ce que
 * Filesystem écrit tel quel quand aucun encodage n'est précisé. */
function blobEnBase64(blob) {
  return new Promise((resolve, reject) => {
    try {
      const lecteur = new FileReader();
      lecteur.onerror = () => reject(new Error("lecture du fichier impossible"));
      // Le résultat est une URL de données : on ne garde que ce qui suit la virgule.
      lecteur.onload = () => resolve(String(lecteur.result).split(",")[1] || "");
      lecteur.readAsDataURL(blob);
    } catch (e) { reject(e); }
  });
}

async function partagerFichierNatif(blob, nomFichier, titre, texte) {
  const fichiers = greffonNatif("Filesystem");
  const partage = greffonNatif("Share");
  if (!fichiers || !partage || !blob) return false;
  try {
    const donnees = await blobEnBase64(blob);
    if (!donnees) return false;
    await fichiers.writeFile({ path: nomFichier, data: donnees, directory: "CACHE" });
    const { uri } = await fichiers.getUri({ path: nomFichier, directory: "CACHE" });
    await partage.share({ title: titre || APP_NOM, text: texte || "", files: [uri] });
    return true;
  } catch (e) {
    // Un partage annulé par le parent lève aussi : ce n'est pas un échec, mais
    // rien ne le distingue de façon fiable, donc on ne réessaie pas ailleurs.
    return true;
  }
}

/* Enregistrer ou partager un fichier, selon l'appareil. Renvoie false si rien
 * n'est parti — l'appelant DOIT alors le dire, jamais se taire. */
async function enregistrerOuPartager(blob, nomFichier, titre, texte) {
  if (greffonNatif("Filesystem")) return await partagerFichierNatif(blob, nomFichier, titre, texte);
  return telechargerBlob(blob, nomFichier);
}
