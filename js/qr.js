/* =====================================================================
 * FamiTeam — Encodeur QR minimal, sans aucune dépendance
 * ---------------------------------------------------------------------
 * Pourquoi écrire un encodeur plutôt que charger une bibliothèque ? Le
 * projet doit fonctionner hors-ligne et ne dépend d'aucune CDN pour son
 * cœur. Un QR code servant à partager un lien de parrainage n'a besoin
 * que d'un cas d'usage très étroit, et cela tient en un fichier.
 *
 * Périmètre volontairement fermé :
 *   - version 3 (matrice 29×29), niveau de correction L ;
 *   - mode « octets » (UTF-8), donc n'importe quelle URL ;
 *   - un seul bloc de données (55 mots) → aucun entrelacement à gérer ;
 *   - capacité utile : 53 caractères ASCII. Au-delà, qrSvg() renvoie null
 *     et l'appelant retombe sur l'affichage du lien en texte.
 * Une URL de parrainage (« https://famiteam.com/?p=ABCDEFG », 31 caractères)
 * tient très largement.
 *
 * Vérifié module par module contre `segno` (implémentation indépendante,
 * Python) pour les huit masques : voir test/run.js → « QR ».
 * ===================================================================== */

const QR_TAILLE = 29;          // version 3
const QR_MOTS_DONNEES = 55;    // mots de données, niveau L
const QR_MOTS_CORRECTION = 15; // mots de correction, niveau L
const QR_CAPACITE = QR_MOTS_DONNEES - 2;   // 2 mots d'en-tête (mode + longueur)
const QR_NIVEAU_L = 1;         // 0b01 dans l'information de format
const QR_ALIGNEMENT = 22;      // centre du motif d'alignement (version 3)

/* ---------- Corps de Galois GF(256), polynôme primitif 0x11D ---------- */
const QR_EXP = new Array(512);
const QR_LOG = new Array(256);
(function initGaloisQr() {
  let x = 1;
  for (let i = 0; i < 255; i++) { QR_EXP[i] = x; QR_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) QR_EXP[i] = QR_EXP[i - 255];
})();
function qrMul(a, b) { return (a === 0 || b === 0) ? 0 : QR_EXP[QR_LOG[a] + QR_LOG[b]]; }

// Polynôme générateur de degré n : (x - α⁰)(x - α¹)…(x - αⁿ⁻¹).
function qrPolyGenerateur(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const suivant = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      suivant[j] ^= g[j];                      // terme en x
      suivant[j + 1] ^= qrMul(g[j], QR_EXP[i]); // terme constant
    }
    g = suivant;
  }
  return g;
}

// Mots de correction de Reed-Solomon (reste de la division polynomiale).
function qrCorrection(donnees, n) {
  const g = qrPolyGenerateur(n);
  const reste = donnees.concat(new Array(n).fill(0));
  for (let i = 0; i < donnees.length; i++) {
    const coef = reste[i];
    if (coef === 0) continue;
    for (let j = 0; j < g.length; j++) reste[i + j] ^= qrMul(g[j], coef);
  }
  return reste.slice(donnees.length);
}

/* ---------- Flux binaire : mode octets ---------- */
function qrOctetsUtf8(texte) {
  const s = String(texte);
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) { out.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
    else { out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
  }
  return out;
}

function qrMotsDonnees(texte) {
  const octets = qrOctetsUtf8(texte);
  if (octets.length > QR_CAPACITE) return null;      // trop long pour la version 3
  const bits = [];
  const pousser = (valeur, n) => { for (let i = n - 1; i >= 0; i--) bits.push((valeur >> i) & 1); };
  pousser(0b0100, 4);                                // mode « octets »
  pousser(octets.length, 8);                         // longueur (versions 1 à 9)
  octets.forEach(o => pousser(o, 8));
  pousser(0, Math.min(4, QR_MOTS_DONNEES * 8 - bits.length));   // terminateur
  while (bits.length % 8) bits.push(0);              // alignement sur l'octet
  const mots = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    mots.push(v);
  }
  const remplissage = [0xec, 0x11];                  // octets de bourrage normalisés
  let k = 0;
  while (mots.length < QR_MOTS_DONNEES) mots.push(remplissage[k++ % 2]);
  return mots;
}

/* ---------- Matrice : motifs de repérage ---------- */
function qrMatriceVide() {
  const m = [];
  for (let i = 0; i < QR_TAILLE; i++) m.push(new Array(QR_TAILLE).fill(-1));
  return m;
}
function qrPoserCarre(m, ligne, col, taille, valeur) {
  for (let i = 0; i < taille; i++) for (let j = 0; j < taille; j++) {
    const r = ligne + i, c = col + j;
    if (r >= 0 && r < QR_TAILLE && c >= 0 && c < QR_TAILLE) m[r][c] = valeur;
  }
}
function qrPoserRepere(m, ligne, col) {
  qrPoserCarre(m, ligne - 1, col - 1, 9, 0);         // séparateur clair
  qrPoserCarre(m, ligne, col, 7, 1);
  qrPoserCarre(m, ligne + 1, col + 1, 5, 0);
  qrPoserCarre(m, ligne + 2, col + 2, 3, 1);
}
function qrPoserFonctions(m) {
  qrPoserRepere(m, 0, 0);                            // trois repères d'angle
  qrPoserRepere(m, 0, QR_TAILLE - 7);
  qrPoserRepere(m, QR_TAILLE - 7, 0);
  // Motif d'alignement (version 3 : un seul, centré sur 22,22).
  qrPoserCarre(m, QR_ALIGNEMENT - 2, QR_ALIGNEMENT - 2, 5, 1);
  qrPoserCarre(m, QR_ALIGNEMENT - 1, QR_ALIGNEMENT - 1, 3, 0);
  m[QR_ALIGNEMENT][QR_ALIGNEMENT] = 1;
  // Motifs de synchronisation (ligne et colonne 6).
  for (let i = 8; i < QR_TAILLE - 8; i++) {
    const v = (i % 2 === 0) ? 1 : 0;
    if (m[6][i] === -1) m[6][i] = v;
    if (m[i][6] === -1) m[i][6] = v;
  }
  // Emplacements de l'information de format (réservés, valeur posée plus tard).
  for (let i = 0; i <= 8; i++) {
    if (m[8][i] === -1) m[8][i] = 2;
    if (m[i][8] === -1) m[i][8] = 2;
  }
  for (let i = QR_TAILLE - 8; i < QR_TAILLE; i++) {
    if (m[8][i] === -1) m[8][i] = 2;
    if (m[i][8] === -1) m[i][8] = 2;
  }
  m[QR_TAILLE - 8][8] = 1;                           // module toujours sombre
  return m;
}

/* ---------- Placement des données en zigzag ---------- */
function qrPoserDonnees(m, mots) {
  const bits = [];
  mots.forEach(o => { for (let i = 7; i >= 0; i--) bits.push((o >> i) & 1); });
  let n = 0, versLeHaut = true;
  for (let col = QR_TAILLE - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;                          // on saute la colonne de synchronisation
    for (let i = 0; i < QR_TAILLE; i++) {
      const ligne = versLeHaut ? QR_TAILLE - 1 - i : i;
      for (let d = 0; d < 2; d++) {
        const c = col - d;
        if (m[ligne][c] !== -1) continue;             // module réservé
        m[ligne][c] = n < bits.length ? bits[n] : 0;
        n++;
      }
    }
    versLeHaut = !versLeHaut;
  }
  return m;
}

/* ---------- Masques ---------- */
const QR_MASQUES = [
  (i, j) => (i + j) % 2 === 0,
  (i, j) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0
];

// Information de format : 2 bits de niveau + 3 bits de masque, protégés par
// un code BCH(15,5) et brouillés par le masque normalisé 0x5412.
function qrInfoFormat(niveau, masque) {
  const donnees = (niveau << 3) | masque;
  let v = donnees << 10;
  for (let i = 4; i >= 0; i--) if (v & (1 << (i + 10))) v ^= 0x537 << i;
  return ((donnees << 10) | v) ^ 0x5412;
}
/* Placement de l'information de format.
 * L'ordre des quinze bits a été déduit expérimentalement d'une implémentation
 * de référence (segno), en faisant varier les quatre niveaux de correction et
 * les huit masques : chaque bit y possède alors une signature unique sur les
 * 32 combinaisons, ce qui lève toute ambiguïté. Résultat :
 *   copie 1 — bits 0→6 dans la colonne 8 du haut vers le bas (la ligne 6 est
 *             un motif de synchronisation), bit 7 à l'angle (8,8), puis
 *             bits 8→14 vers la GAUCHE le long de la ligne 8 ;
 *   copie 2 — bits 0→7 vers la gauche depuis le bord droit de la ligne 8,
 *             puis bits 8→14 vers le bas dans la colonne 8.
 * Le module toujours sombre, en (taille-8, 8), n'appartient pas au format. */
function qrPoserFormat(m, niveau, masque) {
  const f = qrInfoFormat(niveau, masque);
  const bit = (i) => (f >> i) & 1;
  for (let k = 0; k <= 5; k++) m[k][8] = bit(k);
  m[7][8] = bit(6);
  m[8][8] = bit(7);
  m[8][7] = bit(8);
  for (let k = 9; k <= 14; k++) m[8][14 - k] = bit(k);
  for (let k = 0; k <= 7; k++) m[8][QR_TAILLE - 1 - k] = bit(k);
  for (let k = 8; k <= 14; k++) m[QR_TAILLE - 7 + (k - 8)][8] = bit(k);
  m[QR_TAILLE - 8][8] = 1;
  return m;
}

// Pénalités normalisées : on retient le masque le moins pénalisé.
function qrPenalite(m) {
  let total = 0;
  // Règle 1 : suites de cinq modules ou plus de même couleur.
  for (let sens = 0; sens < 2; sens++) {
    for (let a = 0; a < QR_TAILLE; a++) {
      let precedent = -1, suite = 0;
      for (let b = 0; b < QR_TAILLE; b++) {
        const v = sens === 0 ? m[a][b] : m[b][a];
        if (v === precedent) { suite++; if (suite === 5) total += 3; else if (suite > 5) total += 1; }
        else { precedent = v; suite = 1; }
      }
    }
  }
  // Règle 2 : carrés 2×2 d'une seule couleur.
  for (let i = 0; i < QR_TAILLE - 1; i++) for (let j = 0; j < QR_TAILLE - 1; j++) {
    const v = m[i][j];
    if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) total += 3;
  }
  // Règle 3 : motif 1:1:3:1:1 précédé ou suivi de quatre modules clairs.
  const motifA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const motifB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  for (let sens = 0; sens < 2; sens++) {
    for (let a = 0; a < QR_TAILLE; a++) {
      for (let b = 0; b <= QR_TAILLE - 11; b++) {
        let egalA = true, egalB = true;
        for (let k = 0; k < 11; k++) {
          const v = sens === 0 ? m[a][b + k] : m[b + k][a];
          if (v !== motifA[k]) egalA = false;
          if (v !== motifB[k]) egalB = false;
        }
        if (egalA) total += 40;
        if (egalB) total += 40;
      }
    }
  }
  // Règle 4 : écart de la proportion de modules sombres à 50 %.
  let sombres = 0;
  for (let i = 0; i < QR_TAILLE; i++) for (let j = 0; j < QR_TAILLE; j++) if (m[i][j] === 1) sombres++;
  const pourcent = (sombres * 100) / (QR_TAILLE * QR_TAILLE);
  total += Math.floor(Math.abs(pourcent - 50) / 5) * 10;
  return total;
}

/* ---------- Matrice complète ----------
 * masqueImpose : uniquement pour les tests (comparaison à une implémentation
 * de référence). En usage normal, le masque est choisi par pénalité. */
function qrMatrice(texte, masqueImpose) {
  const mots = qrMotsDonnees(texte);
  if (!mots) return null;
  const complet = mots.concat(qrCorrection(mots, QR_MOTS_CORRECTION));
  const base = qrPoserDonnees(qrPoserFonctions(qrMatriceVide()), complet);
  let meilleure = null, meilleurScore = Infinity;
  const masques = (masqueImpose === undefined || masqueImpose === null)
    ? [0, 1, 2, 3, 4, 5, 6, 7] : [masqueImpose];
  masques.forEach(masque => {
    const m = base.map(l => l.slice());
    for (let i = 0; i < QR_TAILLE; i++) for (let j = 0; j < QR_TAILLE; j++) {
      if (base[i][j] === 2) continue;                       // zone de format
      const fonction = qrEstFonction(i, j);
      if (!fonction && QR_MASQUES[masque](i, j)) m[i][j] = base[i][j] ^ 1;
    }
    qrPoserFormat(m, QR_NIVEAU_L, masque);
    const score = qrPenalite(m);
    if (score < meilleurScore) { meilleurScore = score; meilleure = m; }
  });
  return meilleure;
}

// Un module appartient-il à un motif de service (jamais masqué) ?
function qrEstFonction(i, j) {
  if (i === 6 || j === 6) return true;                                  // synchronisation
  if (i <= 8 && j <= 8) return true;                                    // repère + format (haut gauche)
  if (i <= 8 && j >= QR_TAILLE - 8) return true;                        // repère + format (haut droit)
  if (i >= QR_TAILLE - 8 && j <= 8) return true;                        // repère + format (bas gauche)
  if (i >= QR_ALIGNEMENT - 2 && i <= QR_ALIGNEMENT + 2 &&
      j >= QR_ALIGNEMENT - 2 && j <= QR_ALIGNEMENT + 2) return true;    // alignement
  return false;
}

/* ---------- Rendu SVG ----------
 * Un seul <path> pour tous les modules sombres : léger, imprimable, et
 * lisible par les lecteurs même en noir sur blanc pur (exigence des
 * lecteurs bon marché). La marge de 4 modules est normalisée. */
function qrSvg(texte, options) {
  const o = options || {};
  const m = qrMatrice(texte);
  if (!m) return null;
  const marge = (o.marge === undefined) ? 4 : o.marge;
  const cote = QR_TAILLE + marge * 2;
  let d = "";
  for (let i = 0; i < QR_TAILLE; i++) for (let j = 0; j < QR_TAILLE; j++) {
    if (m[i][j] === 1) d += `M${j + marge},${i + marge}h1v1h-1z`;
  }
  const classe = o.classe ? ` class="${o.classe}"` : "";
  const taille = o.taille ? ` width="${o.taille}" height="${o.taille}"` : "";
  const titre = o.titre ? `<title>${String(o.titre).replace(/[<>&]/g, "")}</title>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cote} ${cote}"${taille}${classe} ` +
         `shape-rendering="crispEdges" role="img">${titre}` +
         `<rect width="${cote}" height="${cote}" fill="#fff"/>` +
         `<path d="${d}" fill="#000"/></svg>`;
}

// Export pour le banc d'essai Node (aucun effet dans le navigateur).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { qrMatrice, qrSvg, QR_TAILLE, QR_CAPACITE };
}
