/* =====================================================================
 * KidsPositifs — Rendu d'avatar vectoriel (SVG)
 * ---------------------------------------------------------------------
 * Tous les éléments sont dessinés sur une grille fixe 100×100, donc
 * parfaitement alignés quelle que soit la combinaison choisie.
 *
 * Repères : tête centrée (50,52), rayon ~27.
 *           œil gauche (40,50), œil droit (60,50), bouche (50,64).
 * ===================================================================== */

// Récupère une option d'avatar (et donc ses propriétés : hex, emoji…).
function optAvatar(cat, id) {
  const liste = AVATAR_OPTIONS[cat] || [];
  return liste.find(o => o.id === id) || liste[0];
}
function hexAvatar(cat, id, defaut) {
  const o = optAvatar(cat, id);
  return (o && o.hex) || defaut;
}

/* ---------- Éléments ---------- */
function svgFond(id) {
  const o = optAvatar("fond", id);
  const motif = o.motif
    ? `<text x="50" y="30" font-size="20" text-anchor="middle" opacity="0.85">${o.motif}</text>
       <text x="20" y="22" font-size="12" text-anchor="middle" opacity="0.6">${o.motif}</text>
       <text x="80" y="24" font-size="12" text-anchor="middle" opacity="0.6">${o.motif}</text>`
    : "";
  return `<rect x="0" y="0" width="100" height="100" rx="16" fill="${o.hex}"/>${motif}`;
}

function svgTete(peauId) {
  const p = hexAvatar("peau", peauId, "#ffd9b3");
  const ombre = "rgba(0,0,0,0.08)";
  return `
    <ellipse cx="32" cy="56" rx="5.5" ry="6" fill="${p}"/>
    <ellipse cx="68" cy="56" rx="5.5" ry="6" fill="${p}"/>
    <path d="M50 74 q-9 0 -9 9 h18 q0 -9 -9 -9Z" fill="${p}"/>
    <ellipse cx="50" cy="52" rx="27" ry="29" fill="${p}"/>
    <ellipse cx="50" cy="52" rx="27" ry="29" fill="none" stroke="${ombre}" stroke-width="0.5"/>
    <ellipse cx="40" cy="60" rx="4" ry="2.6" fill="rgba(255,120,120,0.25)"/>
    <ellipse cx="60" cy="60" rx="4" ry="2.6" fill="rgba(255,120,120,0.25)"/>`;
}

function svgYeux(id) {
  const G = 40, D = 60, Y = 50; // positions fixes des yeux
  const oeil = (x) => `<circle cx="${x}" cy="${Y}" r="3.4" fill="#2b2b35"/>
                       <circle cx="${x + 1.1}" cy="${Y - 1.1}" r="1.1" fill="#fff"/>`;
  switch (id) {
    case "joyeux":
      return `<path d="M${G - 4} ${Y + 1} Q${G} ${Y - 5} ${G + 4} ${Y + 1}" stroke="#2b2b35" stroke-width="2.6" fill="none" stroke-linecap="round"/>
              <path d="M${D - 4} ${Y + 1} Q${D} ${Y - 5} ${D + 4} ${Y + 1}" stroke="#2b2b35" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case "clin":
      return oeil(G) +
             `<path d="M${D - 4} ${Y} Q${D} ${Y + 3} ${D + 4} ${Y}" stroke="#2b2b35" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case "etoiles":
      return etoile(G, Y, 4, "#2b2b35") + etoile(D, Y, 4, "#2b2b35");
    case "coeur":
      return coeurForme(G, Y, 4, "#e8607d") + coeurForme(D, Y, 4, "#e8607d");
    default: // ronds
      return oeil(G) + oeil(D);
  }
}

function svgBouche() {
  return `<path d="M43 63 Q50 71 57 63" stroke="#c0506a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
}

function svgLunettes(id) {
  if (!id || id === "rien") return "";
  const G = 40, D = 60, Y = 50;
  const branches = `<line x1="${G - 7}" y1="${Y - 1}" x2="26" y2="${Y - 4}" stroke="#2b2b35" stroke-width="1.6"/>
                    <line x1="${D + 7}" y1="${Y - 1}" x2="74" y2="${Y - 4}" stroke="#2b2b35" stroke-width="1.6"/>`;
  const pont = `<line x1="${G + 7}" y1="${Y}" x2="${D - 7}" y2="${Y}" stroke="#2b2b35" stroke-width="1.8"/>`;
  switch (id) {
    case "soleil":
      return `<rect x="${G - 8}" y="${Y - 5}" width="16" height="10" rx="4" fill="#2b2b35"/>
              <rect x="${D - 8}" y="${Y - 5}" width="16" height="10" rx="4" fill="#2b2b35"/>` + pont + branches;
    case "etoile":
      return `<circle cx="${G}" cy="${Y}" r="7.5" fill="rgba(255,210,80,0.25)" stroke="#f2b01b" stroke-width="2"/>
              <circle cx="${D}" cy="${Y}" r="7.5" fill="rgba(255,210,80,0.25)" stroke="#f2b01b" stroke-width="2"/>
              ${etoile(G, Y, 2.4, "#f2b01b")}${etoile(D, Y, 2.4, "#f2b01b")}` + pont + branches;
    default: // rondes
      return `<circle cx="${G}" cy="${Y}" r="7.5" fill="rgba(255,255,255,0.15)" stroke="#2b2b35" stroke-width="2"/>
              <circle cx="${D}" cy="${Y}" r="7.5" fill="rgba(255,255,255,0.15)" stroke="#2b2b35" stroke-width="2"/>` + pont + branches;
  }
}

/* Cheveux : couleur de "cheveux", style de "coiffure".
 * Deux couches : svgCheveuxArriere (volume DERRIÈRE la tête, dessiné avant le
 * visage) et svgCheveuxDevant (racine + mèches, dessiné après le visage mais
 * au-dessus du front, donc sans cacher les yeux). */
function svgCheveuxArriere(coiffure, couleurId) {
  if (!coiffure || coiffure === "chauve") return "";
  const c = hexAvatar("cheveux", couleurId, "#5b3a23");
  const cF = assombrir(c, 0.88);
  switch (coiffure) {
    case "long":
      return `<path d="M18 54 Q14 85 27 89 L29 56 Q31 47 36 45 L64 45 Q69 47 71 56 L73 89 Q86 85 82 54 Q81 21 50 18 Q19 21 18 54Z" fill="${cF}"/>`;
    case "couettes":
      return `<g fill="${cF}"><ellipse cx="15" cy="60" rx="8" ry="12"/><ellipse cx="85" cy="60" rx="8" ry="12"/></g>`;
    default:
      return "";
  }
}

function svgCheveuxDevant(coiffure, couleurId) {
  if (!coiffure || coiffure === "chauve") return "";
  const c = hexAvatar("cheveux", couleurId, "#5b3a23");
  const cF = assombrir(c, 0.82);
  const cL = eclaircir(c, 1.18);
  const reflet = `<path d="M44 22 Q56 21 66 28" fill="none" stroke="${cL}" stroke-width="2.4" stroke-linecap="round" opacity="0.55"/>`;
  const calotte = `M23 47 Q24 21 50 19 Q76 21 77 47`; // contour du cuir chevelu
  switch (coiffure) {
    case "court":
      return `<path d="${calotte} Q72 40 64 41 Q57 35 50 38 Q43 35 36 41 Q28 40 23 47Z" fill="${c}"/>${reflet}`;
    case "frange":
      return `<path d="${calotte} Q74 45 69 46 Q64 41 59 46 Q54 41 49 46 Q44 41 39 46 Q34 41 30 46 Q26 45 23 47Z" fill="${c}"/>`;
    case "couettes":
      return `<path d="${calotte} Q72 41 64 42 Q57 36 50 39 Q43 36 36 42 Q28 41 23 47Z" fill="${c}"/>${reflet}
              <g fill="${cF}"><ellipse cx="15" cy="60" rx="7" ry="10"/><ellipse cx="85" cy="60" rx="7" ry="10"/></g>
              <rect x="11" y="50" width="9" height="4" rx="2" fill="${c}"/><rect x="80" y="50" width="9" height="4" rx="2" fill="${c}"/>`;
    case "chignon":
      return `<path d="${calotte} Q72 40 50 38 Q28 40 23 47Z" fill="${c}"/>${reflet}
              <circle cx="50" cy="14" r="8" fill="${c}"/><ellipse cx="50" cy="21" rx="9" ry="3" fill="${cF}"/>`;
    case "long":
      return `<path d="${calotte} Q72 42 50 38 Q28 42 23 47Z" fill="${c}"/>${reflet}
              <path d="M24 45 Q20 65 26 76 L31 73 Q27 58 31 47Z" fill="${c}"/>
              <path d="M76 45 Q80 65 74 76 L69 73 Q73 58 69 47Z" fill="${c}"/>`;
    case "boucle":
      return `<g fill="${c}">
              <circle cx="29" cy="33" r="9"/><circle cx="42" cy="26" r="10"/><circle cx="56" cy="26" r="10"/>
              <circle cx="69" cy="33" r="9"/><circle cx="24" cy="44" r="7.5"/><circle cx="76" cy="44" r="7.5"/>
              <circle cx="37" cy="39" r="6"/><circle cx="63" cy="39" r="6"/></g>
              <g fill="${cL}" opacity="0.5"><circle cx="44" cy="24" r="2.6"/><circle cx="58" cy="25" r="2.1"/></g>`;
    case "crete":
      return `<path d="M25 47 Q26 38 32 36 Q29 42 33 46Z" fill="${cF}"/>
              <path d="M75 47 Q74 38 68 36 Q71 42 67 46Z" fill="${cF}"/>
              <path d="M39 39 L43 17 L47 36 L50 11 L53 36 L57 17 L61 39 Q50 33 39 39Z" fill="${c}"/>`;
    default:
      return "";
  }
}

function svgChapeau(id) {
  if (!id || id === "rien") return "";
  const c = hexAvatar("chapeau", id, "#3a7bd5");
  switch (id) {
    case "noeud":
      return `<g transform="translate(68,26)">
              <path d="M0 0 L-9 -5 L-9 5Z" fill="${c}"/><path d="M0 0 L9 -5 L9 5Z" fill="${c}"/>
              <circle cx="0" cy="0" r="3" fill="${assombrir(c, 0.8)}"/></g>`;
    case "casquette":
      return `<path d="M22 34 Q50 8 78 34 Q50 22 22 34Z" fill="${c}"/>
              <path d="M22 34 Q12 36 10 40 Q30 38 46 36 Q34 33 22 34Z" fill="${assombrir(c, 0.85)}"/>
              <circle cx="50" cy="16" r="2.4" fill="${assombrir(c, 0.7)}"/>`;
    case "bonnet":
      return `<path d="M22 36 Q50 6 78 36 Q50 30 22 36Z" fill="${c}"/>
              <rect x="22" y="34" width="56" height="6" rx="3" fill="${assombrir(c, 0.85)}"/>
              <circle cx="50" cy="10" r="4.5" fill="#fff"/>`;
    case "couronne":
      return `<path d="M28 34 L28 18 L37 27 L50 14 L63 27 L72 18 L72 34Z" fill="${c}" stroke="${assombrir(c, 0.8)}" stroke-width="1"/>
              <circle cx="50" cy="22" r="2.2" fill="#e8607d"/><circle cx="34" cy="26" r="1.8" fill="#5fc97a"/><circle cx="66" cy="26" r="1.8" fill="#4cb3e6"/>`;
    case "hautform":
      return `<rect x="34" y="6" width="32" height="22" rx="3" fill="${c}"/>
              <rect x="22" y="26" width="56" height="6" rx="3" fill="${c}"/>
              <rect x="34" y="20" width="32" height="5" fill="#e05a47"/>`;
    case "diademe":
      return `<path d="M30 34 Q50 22 70 34" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
              <path d="M50 20 L53 28 L47 28Z" fill="${c}"/><circle cx="50" cy="20" r="2.4" fill="#fff"/>`;
    default: return "";
  }
}

function svgTaches(id) {
  if (id !== "taches") return "";
  const c = "rgba(150,90,50,0.55)";
  const pts = [[36, 58], [40, 60], [44, 59], [56, 59], [60, 60], [64, 58]];
  return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="${c}"/>`).join("");
}

function svgPilosite(id, couleurId) {
  if (!id || id === "rien") return "";
  const c = hexAvatar("cheveux", couleurId, "#5b3a23");
  if (id === "moustache")
    return `<path d="M42 60 Q50 56 58 60 Q54 64 50 61 Q46 64 42 60Z" fill="${c}"/>`;
  // barbe
  return `<path d="M30 58 Q32 82 50 84 Q68 82 70 58 Q64 66 50 66 Q36 66 30 58Z" fill="${c}" opacity="0.95"/>`;
}

function svgBoucles(id) {
  if (!id || id === "rien") return "";
  const G = 31, D = 69, Y = 63; // sous les oreilles
  const bijou = (x) => {
    switch (id) {
      case "anneaux": return `<circle cx="${x}" cy="${Y}" r="2.6" fill="none" stroke="#f2c11b" stroke-width="1.6"/>`;
      case "etoiles": return etoile(x, Y, 2.6, "#f2c11b");
      case "coeurs":  return coeurForme(x, Y, 2.4, "#e8607d");
      default:        return `<circle cx="${x}" cy="${Y}" r="2.2" fill="#dfe7f2" stroke="#b9c4d6" stroke-width="0.6"/>`; // perles
    }
  };
  return bijou(G) + bijou(D);
}

// Accessoire tenu (emoji, coin bas-droite) et compagnon (emoji, coin bas-gauche).
function svgEmojiCoin(cat, id, x, y, taille) {
  const o = optAvatar(cat, id);
  if (!o || !o.emoji) return "";
  return `<text x="${x}" y="${y}" font-size="${taille}" text-anchor="middle">${o.emoji}</text>`;
}

/* ---------- Assemblage ---------- */
function buildAvatar(av) {
  av = av || {};
  return `<svg viewBox="0 0 100 100" class="av-svg" xmlns="http://www.w3.org/2000/svg">
    ${svgFond(av.fond)}
    ${svgCheveuxArriere(av.coiffure, av.cheveux)}
    ${svgTete(av.peau)}
    ${svgBoucles(av.boucles)}
    ${svgCheveuxDevant(av.coiffure, av.cheveux)}
    ${svgTaches(av.taches)}
    ${svgYeux(av.yeux)}
    ${svgBouche()}
    ${svgPilosite(av.pilosite, av.cheveux)}
    ${svgLunettes(av.lunettes)}
    ${svgChapeau(av.chapeau)}
    ${svgEmojiCoin("compagnon", av.compagnon, 18, 92, 18)}
    ${svgEmojiCoin("accessoire", av.accessoire, 84, 90, 18)}
  </svg>`;
}

/* ---------- Petites formes utilitaires ---------- */
function etoile(cx, cy, r, fill) {
  let pts = "";
  for (let i = 0; i < 5; i++) {
    const a1 = (Math.PI / 2) + i * 2 * Math.PI / 5;
    const a2 = a1 + Math.PI / 5;
    pts += `${cx + r * Math.cos(a1)},${cy - r * Math.sin(a1)} `;
    pts += `${cx + (r / 2.4) * Math.cos(a2)},${cy - (r / 2.4) * Math.sin(a2)} `;
  }
  return `<polygon points="${pts.trim()}" fill="${fill}"/>`;
}
function coeurForme(cx, cy, r, fill) {
  return `<path transform="translate(${cx - r},${cy - r}) scale(${r / 8})"
    d="M8 14 C2 9 0 6 0 3.5 A3.5 3.5 0 0 1 8 2 A3.5 3.5 0 0 1 16 3.5 C16 6 14 9 8 14Z" fill="${fill}"/>`;
}
// Assombrit une couleur hex (facteur < 1).
function assombrir(hex, f) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const c = [1, 2, 3].map(i => Math.min(255, Math.round(parseInt(m[i], 16) * f)));
  return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
}
// Éclaircit une couleur hex (facteur > 1).
function eclaircir(hex, f) { return assombrir(hex, f); }
