/* ---------- Lecture optique de la feuille papier (OMR) ----------
 *
 * Objectif : photographier une feuille de la semaine remplie à la main, et en
 * ressortir la liste des cases cochées, SANS que la photo ne quitte jamais le
 * téléphone. La feuille porte les prénoms des enfants et une semaine entière
 * de leur comportement : l'envoyer à un service tiers contredirait la phrase
 * imprimée sur la feuille elle-même (« vos données restent chez vous »), et
 * obligerait à inscrire un sous-traitant au registre des traitements. Tout se
 * fait donc ici, hors ligne.
 *
 * Ce qui rend la chose possible, c'est que nous imprimons la feuille
 * nous-mêmes : plutôt que de « comprendre » une image quelconque, on y place
 * d'abord des repères, puis on ne fait que redresser et mesurer.
 *
 *   1. REPÈRES. Quatre taches sombres pleines, aux quatre coins de la grille
 *      des jours (centres des cases extrêmes). Ils donnent les quatre points
 *      qui suffisent à annuler la perspective d'une photo prise de travers.
 *      Leur forme est libre — ce sont de petites planètes à l'impression —,
 *      seuls leurs CENTRES font foi.
 *   2. REPÈRE CANONIQUE. On ramène ces quatre centres sur (0,0) (1,0) (0,1)
 *      (1,1). Dans ce carré, toute case a une position calculable : les sept
 *      colonnes de jours sont régulières (x = i/6), et les lignes le sont
 *      aussi car l'impression leur impose une hauteur unique (y = (k+1)/(R+1)).
 *   3. BANDE DE CONTRÔLE. Vingt marques noires ou blanches, sur les deux
 *      lignes de repères, encodent le nombre de lignes et une empreinte de ce
 *      qui identifie la feuille : l'enfant, la semaine, la liste des missions.
 *      Elle sert deux fois — à RECONNAÎTRE la feuille parmi celles de la
 *      fratrie (inutile alors de demander au parent de quel enfant il s'agit :
 *      la feuille le dit), et à REFUSER celle qui ne correspond à aucune,
 *      plutôt que de la lire en silence sur les mauvaises lignes.
 *   4. MESURE. Chaque case à cocher est un carré vide à l'impression : il
 *      suffit d'y mesurer la proportion d'encre. Au-dessus d'un seuil, cochée ;
 *      en dessous d'un autre, vide ; entre les deux, DOUTEUSE — et c'est le
 *      parent qui tranche, jamais nous.
 *
 * Rien n'est jamais écrit dans le journal d'un enfant sur la seule foi d'une
 * photo : la lecture ne produit qu'une proposition, relue et corrigée à
 * l'écran avant d'être validée.
 *
 * Aucune dépendance, aucun accès au DOM dans les fonctions de calcul : elles
 * travaillent sur des tableaux typés, et sont donc testables sur des images de
 * synthèse (perspective, ombre, bruit) sans navigateur.
 */

/* Largeur de travail. Une photo de téléphone fait 3 000 à 4 000 px de large :
 * inutile ici, et vingt fois plus lent. À 1 100 px, une case de 4 mm occupe
 * encore une quinzaine de pixels — largement de quoi la mesurer. */
const SCAN_LARGEUR_TRAVAIL = 1100;

/* Seuils de décision sur la proportion d'encre d'une case. Entre les deux, on
 * ne tranche pas : la case part en « douteuse » et le parent décide. Mieux
 * vaut trois cases à confirmer qu'une seule écrite à tort.
 * Calibré sur quatre vraies feuilles photographiées : une case vide y mesure
 * 0 à 7 %, un point d'enfant jusqu'à 11 %, une coche au crayon fin 16 à 20 %
 * — d'où un seuil « cochée » à 16 % et non plus 20 %, qui laissait en doute
 * la moitié des coches légères. */
const SCAN_SEUIL_COCHE = 0.16;
const SCAN_SEUIL_VIDE = 0.07;

/* Bande de contrôle : 6 bits pour le nombre de lignes (jusqu'à 63), le reste
 * pour l'empreinte de la liste des missions.
 *
 * Une première version tenait en 10 marques, dont 4 d'empreinte — et un test
 * l'a prise en défaut : deux listes de missions différentes tombaient sur la
 * même empreinte. Une chance sur seize d'accepter une feuille étrangère et de
 * l'écrire dans le dossier d'un enfant, c'est trop. On utilise donc AUSSI la
 * rangée de repères du bas : vingt marques, dont quatorze d'empreinte, soit
 * une collision sur seize mille — le tout sans changer ni la taille ni
 * l'espacement des marques, déjà éprouvés sur les images de synthèse. */
const SCAN_BITS = 20;
const SCAN_BITS_LIGNES = 6;
const SCAN_BITS_EMPREINTE = SCAN_BITS - SCAN_BITS_LIGNES;

/* CONTRAT AVEC L'IMPRESSION (htmlFeuilleSemaine, ui.js).
 * La feuille imprime un pas de colonne de 13 mm. On mesure l'encre sur une
 * fenêtre carrée, centrée sur la case et proportionnelle À LA CASE : assez
 * large pour voir une croix, assez étroite pour ne jamais mordre sur le trait
 * imprimé de la case.
 *
 * Cette fraction-là est le vrai contrat. Une première version exprimait la
 * fenêtre en fraction des PAS (colonne et ligne) : tant que la feuille faisait
 * 7 mm par ligne, cela revenait au même, mais dès que les lignes se resserrent
 * la case rétrécit plus vite que le pas — et la fenêtre finissait par recouvrir
 * le trait de la case. Un test sur une feuille de 34 missions l'a montré :
 * toutes les cases vides étaient lues « cochées ». */
const SCAN_COL_MM = 13;            // pas de colonne, en millimètres
const SCAN_FENETRE = 0.32;         // demi-côté de la fenêtre, en fraction de la case

/* HAUTEUR DE LIGNE. Sept millimètres tant que la liste de missions le permet
 * — mais la carte d'un enfant doit tenir sur UNE page : coupée en deux, elle
 * mettrait ses quatre repères sur deux feuilles et plus rien ne serait
 * lisible. Au-delà d'une vingtaine de missions, les lignes se resserrent donc
 * juste ce qu'il faut. Le lecteur ne mesurant que des rapports, cela lui est
 * indifférent — à une chose près, et c'est pourquoi la formule vit ICI et non
 * dans la mise en page : la fenêtre de mesure d'une case doit rétrécir avec
 * elle, faute de quoi elle finirait par déborder de la case et lire du blanc.
 * Les deux constantes de page ont été MESURÉES dans un navigateur. */
const SCAN_RANG_MM = 7, SCAN_RANG_MIN_MM = 4;
const SCAN_PAGE_MM = 250;   // hauteur laissée à une carte (A4 utile moins l'en-tête)
const SCAN_CARTE_MM = 86;   // ce que la carte occupe hors lignes du tableau
function scanHauteurRang(nRangs) {
  if (!nRangs) return SCAN_RANG_MM;
  return Math.max(SCAN_RANG_MIN_MM, Math.min(SCAN_RANG_MM, (SCAN_PAGE_MM - SCAN_CARTE_MM) / nRangs));
}
// Côté de la case à cocher, en millimètres : elle doit respirer dans sa ligne.
function scanTailleCase(hRang) { return Math.min(5, hRang - 1.7); }
// Demi-fenêtre de mesure, dans le repère canonique (où la largeur vaut 1 pour
// 6 pas de colonne, et la hauteur 1 pour R+1 pas de ligne).
function scanFenetre(R) {
  const hRang = scanHauteurRang(R + 2);
  const cote = scanTailleCase(hRang) * SCAN_FENETRE;
  return { demiX: cote / (6 * SCAN_COL_MM), demiY: cote / ((R + 1) * hRang) };
}

/* ---------- 1. Préparation de l'image ---------- */

// RGBA (tel que le donne un <canvas>) → niveaux de gris, 0 = noir, 255 = blanc.
// Pondération perceptuelle : un trait de stylo bleu doit compter comme sombre.
function scanGrisDepuisRgba(rgba, l, h) {
  const g = new Uint8Array(l * h);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    g[i] = (rgba[p] * 77 + rgba[p + 1] * 151 + rgba[p + 2] * 28) >> 8;
  }
  return g;
}

// Réduction par moyenne de blocs. Moyenner (plutôt que d'échantillonner) évite
// qu'un trait fin ne disparaisse entre deux pixels retenus.
function scanReduire(gris, l, h, lCible) {
  if (l <= lCible) return { gris, l, h };
  const f = Math.ceil(l / lCible);
  const l2 = Math.floor(l / f), h2 = Math.floor(h / f);
  const out = new Uint8Array(l2 * h2);
  for (let y = 0; y < h2; y++) {
    for (let x = 0; x < l2; x++) {
      let s = 0;
      for (let dy = 0; dy < f; dy++) {
        const base = (y * f + dy) * l + x * f;
        for (let dx = 0; dx < f; dx++) s += gris[base + dx];
      }
      out[y * l2 + x] = (s / (f * f)) | 0;
    }
  }
  return { gris: out, l: l2, h: h2 };
}

// Image intégrale : permet de connaître la moyenne de n'importe quel rectangle
// en quatre lectures, quelle que soit sa taille.
function scanIntegrale(gris, l, h) {
  const S = new Float64Array((l + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let ligne = 0;
    for (let x = 0; x < l; x++) {
      ligne += gris[y * l + x];
      S[(y + 1) * (l + 1) + (x + 1)] = S[y * (l + 1) + (x + 1)] + ligne;
    }
  }
  return S;
}
function scanMoyenne(S, l, x0, y0, x1, y1) {
  const L = l + 1;
  const a = S[y0 * L + x0], b = S[y0 * L + x1], c = S[y1 * L + x0], d = S[y1 * L + x1];
  const n = (x1 - x0) * (y1 - y0);
  return n > 0 ? (d - b - c + a) / n : 255;
}

// Binarisation ADAPTATIVE : un pixel est de l'encre s'il est nettement plus
// sombre que le voisinage. Un seuil global (Otsu) suffirait sur un scanner,
// mais pas sur une photo de téléphone : l'ombre de la main qui tient la feuille
// noircit tout un coin, et la moitié de la page passerait pour de l'encre.
function scanBinariser(gris, l, h, options) {
  const o = options || {};
  const rayon = o.rayon || Math.max(8, Math.round(l / 40));
  const ecart = (o.ecart === undefined) ? 12 : o.ecart;
  const S = scanIntegrale(gris, l, h);
  const bin = new Uint8Array(l * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - rayon), y1 = Math.min(h, y + rayon + 1);
    for (let x = 0; x < l; x++) {
      const x0 = Math.max(0, x - rayon), x1 = Math.min(l, x + rayon + 1);
      const moy = scanMoyenne(S, l, x0, y0, x1, y1);
      bin[y * l + x] = gris[y * l + x] < moy - ecart ? 1 : 0;
    }
  }
  return bin;
}

/* ---------- 2. Repères ---------- */

// Composantes connexes (4-voisinage), par remplissage itératif — une récursion
// déborderait la pile sur une grande tache d'encre.
function scanComposantes(bin, l, h, aireMin, aireMax) {
  const vu = new Uint8Array(l * h);
  const pile = new Int32Array(l * h);
  const out = [];
  for (let d = 0; d < bin.length; d++) {
    if (!bin[d] || vu[d]) continue;
    let n = 0, sommet = 0;
    let x0 = l, y0 = h, x1 = 0, y1 = 0;
    pile[sommet++] = d; vu[d] = 1;
    while (sommet > 0) {
      const p = pile[--sommet];
      const x = p % l, y = (p / l) | 0;
      n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && bin[p - 1] && !vu[p - 1]) { vu[p - 1] = 1; pile[sommet++] = p - 1; }
      if (x < l - 1 && bin[p + 1] && !vu[p + 1]) { vu[p + 1] = 1; pile[sommet++] = p + 1; }
      if (y > 0 && bin[p - l] && !vu[p - l]) { vu[p - l] = 1; pile[sommet++] = p - l; }
      if (y < h - 1 && bin[p + l] && !vu[p + l]) { vu[p + l] = 1; pile[sommet++] = p + l; }
    }
    if (n < aireMin || n > aireMax) continue;
    const larg = x1 - x0 + 1, haut = y1 - y0 + 1;
    out.push({ x0, y0, x1, y1, n, larg, haut, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2,
               carre: larg / haut, plein: n / (larg * haut) });
  }
  return out;
}

// Parmi les composantes, retrouve les quatre repères : des carrés PLEINS, de
// taille plausible. Le reste de la feuille (lettres, cadres, écriture) est soit
// trop petit, soit trop allongé, soit creux.
function scanTachesPleines(bin, l, h) {
  const aireMin = Math.round((l * 0.012) * (l * 0.012));
  const aireMax = Math.round((l * 0.06) * (l * 0.06));
  return scanComposantes(bin, l, h, aireMin, aireMax)
    .filter(c => c.carre > 0.65 && c.carre < 1.55 && c.plein > 0.72);
}

function scanReperes(bin, l, h) {
  return scanReperesParmi(scanTachesPleines(bin, l, h), l);
}

// La première idée — les quatre taches les plus extrêmes — suffit sur une
// image propre. Elle est gardée comme premier essai, parce qu'elle est
// immédiate et que c'est le cas le plus fréquent.
function scanReperesParmi(comps, l) {
  if (comps.length < 4) return null;
  const choisir = (score) => comps.reduce((a, b) => (score(b) < score(a) ? b : a));
  const hg = choisir(c => c.cx + c.cy);
  const hd = choisir(c => -c.cx + c.cy);
  const bg = choisir(c => c.cx - c.cy);
  const bd = choisir(c => -c.cx - c.cy);
  const coins = [hg, hd, bg, bd];
  const ids = new Set(coins.map(c => c.x0 + ":" + c.y0));
  if (ids.size !== 4) return null;          // deux coins confondus : photo inexploitable

  /* Les quatre extrêmes ne sont pas forcément les quatre repères. Dans la
   * colonne des noms, à gauche de la grille, un émoji de mission est lui aussi
   * petit, sombre, à peu près carré et bien rempli : il peut se retrouver plus
   * à gauche que le vrai repère, et emporter le coin. Deux garde-fous, parce
   * qu'un mauvais quadrilatère lirait la grille de travers :
   *   - quatre repères imprimés ensemble ont la MÊME taille ;
   *   - ils forment un quadrilatère dont les côtés opposés se répondent.
   * En cas de doute on renvoie « pas trouvé » : le parent reprend la photo,
   * ce qui vaut infiniment mieux qu'un encodage silencieusement décalé. */
  const cotes = coins.map(c => (c.larg + c.haut) / 2);
  if (Math.max(...cotes) > Math.min(...cotes) * 1.7) return null;
  const dist = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy);
  const haut = dist(hg, hd), bas = dist(bg, bd);
  const gauche = dist(hg, bg), droite = dist(hd, bd);
  const proches = (a, b) => Math.max(a, b) <= Math.min(a, b) * 1.6;
  if (!proches(haut, bas) || !proches(gauche, droite)) return null;
  // Une grille aplatie au point d'être illisible ne se redresse pas non plus.
  if (Math.min(haut, bas, gauche, droite) < l * 0.05) return null;
  return { hg, hd, bg, bd };
}

/* HYPOTHÈSES DE REPÈRES. Les vraies photos ont montré la limite des quatre
 * extrêmes : sur une feuille de vingt missions, les émojis de la colonne des
 * noms et ceux de la ligne « Ai-je fait de mon mieux ? » sont eux aussi de
 * petites taches pleines, et l'un d'eux finit presque toujours par être plus
 * « dans le coin » que le vrai repère. Trois feuilles sur quatre étaient
 * refusées pour cette seule raison.
 *
 * Plutôt que de deviner, on énumère : tout triplet de taches de même taille
 * (haut-gauche, haut-droit, bas-gauche) prédit où doit se trouver la
 * quatrième, puisqu'une feuille photographiée reste à peu près un
 * parallélogramme. Les quadrilatères ainsi trouvés sont classés du plus grand
 * au plus petit — les repères encadrent toute la grille — et c'est la BANDE
 * DE CONTRÔLE qui tranche : un faux quadrilatère n'y lit jamais exactement les
 * vingt marques d'une feuille connue (voir scanFeuilles).
 *
 * Les quatre sens de lecture sont essayés du même coup (on ne contraint que
 * l'orientation, pas le sens) : une feuille posée tête-bêche ou de côté se lit
 * comme les autres. Un miroir, lui, est écarté — aucune photo n'en produit. */
const SCAN_HYPOTHESES_MAX = 200;
function scanHypothesesReperes(bin, l, h) {
  // Les repères et les marques de contrôle sont parmi les plus grosses taches
  // pleines de la feuille ; garder les soixante plus grosses borne la
  // recherche (un triplet par combinaison) sans jamais écarter un repère.
  const comps = scanTachesPleines(bin, l, h)
    .sort((a, b) => b.n - a.n).slice(0, 60);
  const out = [];
  const vus = new Set();
  const cle = (q) => [q.hg, q.hd, q.bg, q.bd].map(c => c.x0 + ":" + c.y0).join("|");
  const ajouter = (q, score) => {
    const k = cle(q);
    if (vus.has(k)) return;
    vus.add(k);
    out.push({ q, score });
  };
  const rapide = scanReperesParmi(comps, l);
  if (rapide) ajouter(rapide, Infinity);
  const n = comps.length;
  if (n < 4) return out.map(o => o.q);
  const cote = comps.map(c => (c.larg + c.haut) / 2);
  const semblables = (...i) => {
    const v = i.map(k => cote[k]);
    return Math.max(...v) <= Math.min(...v) * 1.35;
  };
  const trouves = [];
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (b === a || !semblables(a, b)) continue;
      const ux = comps[b].cx - comps[a].cx, uy = comps[b].cy - comps[a].cy;
      const lu = Math.hypot(ux, uy);
      if (lu < l * 0.05) continue;
      for (let c = 0; c < n; c++) {
        if (c === a || c === b || !semblables(a, b, c)) continue;
        const vx = comps[c].cx - comps[a].cx, vy = comps[c].cy - comps[a].cy;
        const lv = Math.hypot(vx, vy);
        if (lv < l * 0.05) continue;
        // Sens direct uniquement (y vers le bas) : écarte les miroirs, et
        // les triplets presque alignés qui ne redressent rien.
        const croix = (ux * vy - uy * vx) / (lu * lv);
        if (croix < 0.5) continue;
        const px = comps[b].cx + vx, py = comps[b].cy + vy;
        const tol = 0.15 * Math.max(lu, lv);
        // Le sens de lecture normal passe avant les trois autres : une feuille
        // est presque toujours photographiée à l'endroit, et une lecture
        // tête-bêche qui tomberait par hasard sur une bande valide ne doit
        // jamais passer devant la bonne.
        const endroit = ux > Math.abs(uy) ? 1 : 0;
        // Toute tache assez proche du quatrième coin prédit est candidate, pas
        // seulement la plus proche : la perspective éloigne le vrai repère de
        // la prédiction, et une marque de contrôle voisine peut s'en trouver
        // plus près que lui.
        for (let d = 0; d < n; d++) {
          if (d === a || d === b || d === c || !semblables(a, b, c, d)) continue;
          if (Math.hypot(comps[d].cx - px, comps[d].cy - py) > tol) continue;
          // Plus grand d'abord (surface du quadrilatère), mais à taille
          // égale : quatre repères imprimés ensemble ont le même diamètre,
          // alors qu'un quadrilatère qui emprunte un émoji (plus petit) gagne
          // souvent en surface ce qu'il perd en cohérence. La pénalité de
          // taille le fait passer derrière.
          const P = [comps[a], comps[b], comps[d], comps[c]];
          let aire = 0;
          for (let k = 0; k < 4; k++) {
            const s = P[k], t = P[(k + 1) % 4];
            aire += s.cx * t.cy - t.cx * s.cy;
          }
          const v4 = [a, b, c, d].map(k => cote[k]);
          const ecart = Math.max(...v4) / Math.min(...v4);
          trouves.push({ q: { hg: comps[a], hd: comps[b], bg: comps[c], bd: comps[d] },
                         endroit, score: Math.abs(aire) / Math.pow(ecart, 6) });
        }
      }
    }
  }
  trouves.sort((x, y) => (y.endroit - x.endroit) || (y.score - x.score));
  for (const t of trouves) {
    if (out.length >= SCAN_HYPOTHESES_MAX) break;
    ajouter(t.q, t.score);
  }
  return out.map(o => o.q);
}

/* ---------- 3. Redressement (homographie) ---------- */

// Résout le système linéaire n×n par élimination de Gauss avec pivot partiel.
function scanResoudre(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    if (Math.abs(A[p][i]) < 1e-12) return null;      // points alignés : pas de solution
    if (p !== i) { const t = A[p]; A[p] = A[i]; A[i] = t; const u = b[p]; b[p] = b[i]; b[i] = u; }
    for (let k = i + 1; k < n; k++) {
      const f = A[k][i] / A[i][i];
      if (!f) continue;
      for (let j = i; j < n; j++) A[k][j] -= f * A[i][j];
      b[k] -= f * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return x;
}

// Homographie envoyant les 4 points `src` sur les 4 points `dst`.
// Huit inconnues, quatre correspondances : le système est exactement déterminé.
function scanHomographie(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const s = scanResoudre(A, b);
  return s ? [s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], 1] : null;
}
function scanProjeter(H, x, y) {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

/* ---------- 4. Mesure d'une case ---------- */

// Proportion d'encre dans un petit rectangle du repère canonique, projeté dans
// l'image. On échantillonne la boîte englobante des quatre coins projetés :
// à cette échelle, la déformation résiduelle est négligeable.
function scanEncre(bin, l, h, H, cx, cy, demiX, demiY) {
  const pts = [
    scanProjeter(H, cx - demiX, cy - demiY), scanProjeter(H, cx + demiX, cy - demiY),
    scanProjeter(H, cx - demiX, cy + demiY), scanProjeter(H, cx + demiX, cy + demiY)
  ];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  pts.forEach(([x, y]) => {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  });
  x0 = Math.max(0, Math.round(x0)); y0 = Math.max(0, Math.round(y0));
  x1 = Math.min(l - 1, Math.round(x1)); y1 = Math.min(h - 1, Math.round(y1));
  if (x1 <= x0 || y1 <= y0) return 0;
  let encre = 0, total = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) { total++; if (bin[y * l + x]) encre++; }
  }
  return total ? encre / total : 0;
}

/* ---------- 5. Géométrie canonique de la feuille ---------- */
/* Ces positions sont le contrat passé avec l'impression (voir htmlFeuilleSemaine,
 * ui.js) : si la feuille change, elles changent ici aussi, et les deux tests
 * « contrat » le rappellent. */

// Centre de la colonne du jour i (0 = lundi … 6 = dimanche).
function scanXJour(i) { return i / 6; }
// Centre de la k-ième ligne du corps, sur R lignes entre les deux rangs de
// repères : les repères sont eux-mêmes des lignes de même hauteur, d'où R+1
// intervalles entre leurs centres.
function scanYLigne(k, R) { return (k + 1) / (R + 1); }
// Marque n° j de la bande de contrôle : deux marques par colonne de jour, dans
// les colonnes 1 à 5 (les colonnes 0 et 6 portent les repères). Les dix
// premières sont sur la rangée du haut, les dix suivantes sur celle du bas.
function scanPosBit(j) {
  const bas = j >= 10 ? 1 : 0;
  const r = j % 10;
  const col = 1 + Math.floor(r / 2);
  return [scanXJour(col) + (r % 2 ? 1 / 24 : -1 / 24), bas];
}

// Empreinte de la liste des missions, calculée à l'identique à l'impression et
// à la lecture. Elle ne protège pas d'une falsification (ce n'est pas le but)
// mais d'une méprise : reconnaître qu'on scanne la feuille d'une autre
// semaine, ou d'avant un changement de missions.
function scanEmpreinteMissions(ids) {
  let s = 0;
  (ids || []).join(",").split("").forEach((c, i) => { s = (s * 31 + c.charCodeAt(0) + i) % 1000003; });
  return s % (1 << SCAN_BITS_EMPREINTE);
}
// La bande complète, en bits (poids fort en tête) : nombre de lignes, empreinte.
function scanBitsAttendus(nbLignes, ids) {
  const bits = [];
  for (let i = SCAN_BITS_LIGNES - 1; i >= 0; i--) bits.push((nbLignes >> i) & 1);
  const e = scanEmpreinteMissions(ids);
  for (let i = SCAN_BITS_EMPREINTE - 1; i >= 0; i--) bits.push((e >> i) & 1);
  return bits;
}

/* ---------- 6. Lecture complète ---------- */

/* Un « plan » décrit une feuille TELLE QU'ELLE A ÉTÉ IMPRIMÉE, pour un enfant
 * et une semaine :
 *   { lignes: [ { type:"cat" } | { type:"mission", id, jours:[bool×7] } ],
 *     missions:[ids], empreinte:[ce qui identifie la feuille] }
 * `jours[i]` dit si la case existe (mission prévue ce jour-là) : une case non
 * imprimée n'est jamais mesurée.
 *
 * On ne lit pas UNE feuille supposée, mais on présente PLUSIEURS feuilles
 * possibles — chaque enfant, chaque semaine récente — et c'est la bande de
 * contrôle qui désigne laquelle on a réellement sous les yeux. Demander au
 * parent de choisir l'enfant avant de photographier était une question dont
 * la feuille elle-même porte la réponse ; et se tromper d'enfant, c'était
 * écrire la semaine de l'un dans le dossier de l'autre. */
function scanFeuilles(gris, l, h, plans) {
  const liste = (Array.isArray(plans) ? plans : [plans]).filter(p => p && p.lignes && p.lignes.length);
  if (!liste.length) return { ok: false, raison: "feuille_differente" };

  const bin = scanBinariser(gris, l, h);
  const hypotheses = scanHypothesesReperes(bin, l, h);
  if (!hypotheses.length) return { ok: false, raison: "reperes" };

  const attendusDe = (p) => scanBitsAttendus(p.lignes.length, p.empreinte || p.missions).join("");
  let echec = null;
  let rep = null, H = null, retenus = [];
  for (const q of hypotheses) {
    const Hq = scanHomographie(
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[q.hg.cx, q.hg.cy], [q.hd.cx, q.hd.cy], [q.bg.cx, q.bg.cy], [q.bd.cx, q.bd.cy]]
    );
    if (!Hq) continue;
    // Fenêtre de mesure, identique pour les marques de contrôle et pour les
    // cases : même taille en millimètres sur le papier. Elle dépend du nombre
    // de lignes, donc les bits se relisent une fois par hauteur de grille
    // distincte — et une seule fois, quel que soit le nombre d'enfants et de
    // semaines proposés.
    const lus = {};
    const bitsPour = (R) => {
      if (!(R in lus)) {
        const { demiX, demiY } = scanFenetre(R);
        const b = [];
        let net = true;
        for (let j = 0; j < SCAN_BITS; j++) {
          const [bx, by] = scanPosBit(j);
          const r = scanEncre(bin, l, h, Hq, bx, by, demiX, demiY);
          // Une vraie marque est franchement pleine ou franchement vide. Une
          // valeur intermédiaire, c'est qu'on mesure à côté — un faux
          // quadrilatère qui tombe sur du texte : on ne lui fait pas
          // confiance, même si le hasard lui donnait les bons bits.
          if (r > 0.25 && r < 0.6) net = false;
          b.push(r > 0.45 ? 1 : 0);
        }
        lus[R] = net ? b.join("") : null;
      }
      return lus[R];
    };
    const ok = liste.filter(p => bitsPour(p.lignes.length) === attendusDe(p));
    if (ok.length) { rep = q; H = Hq; retenus = ok; break; }
    // Aucune feuille connue. Mais si la bande lue est NETTE et annonce un
    // nombre de lignes crédible, c'est bien une de nos feuilles qu'on a sous
    // les yeux — simplement pas une qu'on attend (autre semaine, missions
    // changées depuis l'impression). Le dire ainsi est plus utile au parent
    // que « reprends la photo ».
    if (!echec) {
      const p = liste[0];
      const b = bitsPour(p.lignes.length);
      if (b && parseInt(b.slice(0, SCAN_BITS_LIGNES), 2) >= 3) {
        echec = { ok: false, raison: "feuille_differente", bits: b, attendus: attendusDe(p) };
      }
    }
  }
  if (!retenus.length) return echec || { ok: false, raison: "reperes" };
  // Deux feuilles candidates ne peuvent pas porter la même bande de contrôle.
  // Si cela arrivait tout de même (collision d'empreinte), mieux vaut refuser
  // que tirer au sort l'enfant dans le dossier duquel on va écrire.
  if (retenus.length > 1) return { ok: false, raison: "ambigu" };

  const plan = retenus[0];
  const R = plan.lignes.length;
  const { demiX, demiY } = scanFenetre(R);

  // Mesure des cases. Une case vide imprimée est un carré fin : même mesurée
  // en son centre, un peu d'encre peut apparaître (trame, ombre), d'où un
  // seuil « vide » qui n'est pas exactement zéro.
  const cases = [];
  let douteuses = 0;
  plan.lignes.forEach((ligne, k) => {
    if (ligne.type !== "mission") return;
    ligne.jours.forEach((existe, i) => {
      if (!existe) return;
      const r = scanEncre(bin, l, h, H, scanXJour(i), scanYLigne(k, R), demiX, demiY);
      const etat = r >= SCAN_SEUIL_COCHE ? "cochee" : (r <= SCAN_SEUIL_VIDE ? "vide" : "douteuse");
      if (etat === "douteuse") douteuses++;
      cases.push({ mission: ligne.id, jour: i, etat, encre: r });
    });
  });
  return { ok: true, plan, cases, douteuses, reperes: rep };
}

// Une seule feuille possible : le cas d'usage d'origine, et celui des tests.
function scanFeuille(gris, l, h, plan) { return scanFeuilles(gris, l, h, [plan]); }

/* ---------- PDF de scanner ----------
 * Un scanner de bureau rend un PDF, pas une image — et embarquer un moteur de
 * rendu PDF (un mégaoctet) pour lire une feuille de missions serait
 * disproportionné, surtout dans une app qui doit rester utilisable hors ligne.
 *
 * Or c'est inutile : un PDF de numérisation ne « dessine » rien, il se contente
 * d'encapsuler la photo de la page. Le JPEG s'y trouve donc tel quel, entre un
 * `stream` et un `endstream`, et se reconnaît à ses octets d'en-tête (FF D8 FF)
 * — aucune analyse de la structure du PDF n'est nécessaire.
 *
 * Renvoie les pages trouvées, de la plus lourde à la plus légère (la page
 * scannée avant ses vignettes éventuelles). Un PDF de plusieurs enfants en
 * contient plusieurs : c'est la bande de contrôle, ensuite, qui reconnaîtra
 * de quel enfant et de quelle semaine chaque page est la feuille.
 *
 * Limite assumée : une numérisation en noir et blanc pur est souvent encodée
 * en CCITT (fax) et non en JPEG. On ne la trouvera pas ici — l'appelant le dit
 * alors franchement plutôt que d'échouer sans explication.
 */
function scanJpegsDansPdf(octets) {
  const pages = [];
  const finDe = (i) => {
    // Le flux se termine au `endstream` qui suit : on prend les octets bruts,
    // débarrassés du saut de ligne que le PDF insère avant le mot-clé.
    for (let p = i; p < octets.length - 8; p++) {
      if (octets[p] === 0x65 && octets[p + 1] === 0x6E && octets[p + 2] === 0x64 &&
          octets[p + 3] === 0x73 && octets[p + 4] === 0x74 && octets[p + 5] === 0x72 &&
          octets[p + 6] === 0x65 && octets[p + 7] === 0x61 && octets[p + 8] === 0x6D) {
        let fin = p;
        while (fin > i && (octets[fin - 1] === 0x0A || octets[fin - 1] === 0x0D || octets[fin - 1] === 0x20)) fin--;
        return fin;
      }
    }
    return -1;
  };
  for (let i = 0; i < octets.length - 3; i++) {
    if (octets[i] !== 0xFF || octets[i + 1] !== 0xD8 || octets[i + 2] !== 0xFF) continue;
    const fin = finDe(i);
    if (fin <= i + 4) continue;
    // Un JPEG complet se termine par FF D9 : sans cela, ce n'est pas une image
    // mais une coïncidence d'octets dans un flux compressé.
    if (!(octets[fin - 2] === 0xFF && octets[fin - 1] === 0xD9)) continue;
    pages.push(octets.slice(i, fin));
    i = fin;
  }
  return pages.sort((a, b) => b.length - a.length);
}

function scanEstPdf(fichier) {
  return !!fichier && (fichier.type === "application/pdf" ||
    /\.pdf$/i.test(fichier.name || ""));
}

/* ---------- Passerelle navigateur ----------
 * Seul endroit qui touche au DOM : décoder le fichier en pixels. Le reste
 * ci-dessus n'en dépend pas, et tourne tel quel dans les tests.
 */
function scanPixelsDepuisBlob(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height);
        const g0 = scanGrisDepuisRgba(d.data, c.width, c.height);
        resolve(scanReduire(g0, c.width, c.height, SCAN_LARGEUR_TRAVAIL));
      } catch (e) { resolve(null); }
      finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function scanDepuisFichier(fichier, plans) {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return { ok: false, raison: "indisponible" };
  }
  // Un PDF de plusieurs pages (toute la fratrie numérisée d'un coup) : on
  // essaie chaque page, et c'est la bande de contrôle qui désigne la bonne.
  // Aucune page ne peut être lue « à peu près » : soit elle correspond à
  // l'enfant et à la semaine choisis, soit on passe à la suivante.
  if (scanEstPdf(fichier)) {
    let octets;
    try { octets = new Uint8Array(await fichier.arrayBuffer()); }
    catch (e) { return { ok: false, raison: "image" }; }
    const pages = scanJpegsDansPdf(octets);
    if (!pages.length) return { ok: false, raison: "pdf_sans_image" };
    // Toutes les pages sont lues, pas seulement la première qui répond : on
    // numérise volontiers la fratrie entière d'un coup, parfois plusieurs
    // semaines à la fois, et s'arrêter à la première feuille reconnue
    // obligerait à recommencer autant de fois qu'il y a d'enfants.
    const lectures = [];
    const vues = {};
    let dernier = { ok: false, raison: "reperes" };
    for (const page of pages) {
      const px = await scanPixelsDepuisBlob(new Blob([page], { type: "image/jpeg" }));
      if (!px) continue;
      const r = scanFeuilles(px.gris, px.l, px.h, plans);
      if (!r.ok) { dernier = r; continue; }
      // Une même feuille numérisée deux fois (recto photographié puis
      // rescanné) ne doit pas compter double.
      const cle = (r.plan.enfantId || "") + "|" + (r.plan.semaine || "");
      if (vues[cle]) continue;
      vues[cle] = 1;
      lectures.push(r);
    }
    if (!lectures.length) return dernier;
    return { ok: true, lectures, pages: pages.length };
  }
  const px = await scanPixelsDepuisBlob(fichier);
  if (!px) return { ok: false, raison: "image" };
  const r = scanFeuilles(px.gris, px.l, px.h, plans);
  return r.ok ? { ok: true, lectures: [r], pages: 1 } : r;
}
