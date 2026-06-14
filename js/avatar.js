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

/* Cheveux : la couleur vient de la catégorie "cheveux", le style de "coiffure". */
function svgCheveux(coiffure, couleurId) {
  if (coiffure === "chauve") return "";
  const c = hexAvatar("cheveux", couleurId, "#5b3a23");
  const cFonce = assombrir(c, 0.85);
  switch (coiffure) {
    case "couettes":
      return `<circle cx="22" cy="44" r="9" fill="${cFonce}"/><circle cx="78" cy="44" r="9" fill="${cFonce}"/>
              <path d="M24 40 Q50 12 76 40 Q72 28 50 26 Q28 28 24 40Z" fill="${c}"/>`;
    case "frange":
      return `<path d="M23 46 Q50 14 77 46 L77 40 Q50 18 23 40Z" fill="${c}"/>
              <path d="M27 36 Q50 22 73 36 Q73 47 70 47 Q66 38 60 44 Q54 36 50 44 Q46 36 40 44 Q34 38 30 47 Q27 47 27 36Z" fill="${c}"/>`;
    case "chignon":
      return `<circle cx="50" cy="22" r="8" fill="${c}"/>
              <path d="M24 42 Q50 14 76 42 Q70 30 50 29 Q30 30 24 42Z" fill="${c}"/>`;
    case "long":
      return `<path d="M20 44 Q22 78 30 82 L30 50 Q40 40 50 40 Q60 40 70 50 L70 82 Q78 78 80 44 Q50 12 20 44Z" fill="${c}"/>
              <path d="M24 42 Q50 14 76 42 Q70 28 50 27 Q30 28 24 42Z" fill="${cFonce}"/>`;
    case "boucle":
      return `<g fill="${c}">
              <circle cx="30" cy="34" r="8"/><circle cx="42" cy="28" r="9"/><circle cx="55" cy="27" r="9"/>
              <circle cx="68" cy="33" r="8"/><circle cx="24" cy="44" r="7"/><circle cx="76" cy="44" r="7"/></g>`;
    case "crete":
      return `<path d="M24 46 Q26 34 34 32 Q30 40 34 44Z" fill="${cFonce}"/>
              <path d="M76 46 Q74 34 66 32 Q70 40 66 44Z" fill="${cFonce}"/>
              <path d="M44 30 L50 12 L56 30 Q50 24 44 30Z" fill="${c}"/>
              <path d="M38 34 L42 20 L48 32 Z" fill="${c}"/><path d="M52 32 L58 20 L62 34 Z" fill="${c}"/>`;
    default: // court
      return `<path d="M23 48 Q50 12 77 48 Q78 32 50 28 Q22 32 23 48Z" fill="${c}"/>
              <path d="M23 48 Q26 40 30 40 L30 46Z M77 48 Q74 40 70 40 L70 46Z" fill="${cFonce}"/>`;
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
    ${svgCheveux(av.coiffure, av.cheveux)}
    ${svgTete(av.peau)}
    ${svgYeux(av.yeux)}
    ${svgBouche()}
    ${svgLunettes(av.lunettes)}
    ${frangeAvant(av.coiffure, av.cheveux)}
    ${svgChapeau(av.chapeau)}
    ${svgEmojiCoin("compagnon", av.compagnon, 18, 92, 18)}
    ${svgEmojiCoin("accessoire", av.accessoire, 84, 90, 18)}
  </svg>`;
}

// Pour la frange/le toupet, on redessine une petite mèche par-dessus le front
// (sous le chapeau) afin que la coiffure encadre bien le visage.
function frangeAvant(coiffure, couleurId) {
  if (coiffure === "frange" || coiffure === "chauve") return "";
  const c = hexAvatar("cheveux", couleurId, "#5b3a23");
  return `<path d="M27 34 Q50 22 73 34 Q73 40 70 40 Q60 33 50 38 Q40 33 30 40 Q27 40 27 34Z" fill="${c}" opacity="0.95"/>`;
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
  const c = [1, 2, 3].map(i => Math.round(parseInt(m[i], 16) * f));
  return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("");
}
