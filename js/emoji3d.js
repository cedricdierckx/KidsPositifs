/* =====================================================================
 * FamiTeam — Emojis 3D (Microsoft Fluent Emoji, licence MIT)
 * ---------------------------------------------------------------------
 * Un emoji n'est pas une image : c'est un caractère, que CHAQUE appareil
 * dessine à sa façon. Le même écran montrait donc les emojis 3D de Microsoft
 * sur un PC Windows, les emojis plats de Google sur Android, ceux d'Apple sur
 * iPhone — trois applications différentes pour une même famille, et la plus
 * réussie (Windows, de l'avis du fondateur) réservée au seul ordinateur.
 *
 * Ce module remplace, à l'affichage, chaque emoji par la même image 3D sur
 * tous les appareils. Il ne touche à AUCUNE chaîne du code ni des
 * traductions : il observe le DOM et convertit les nœuds texte à mesure
 * qu'ils apparaissent (un MutationObserver, comme twemoji.parse). Les
 * images sont embarquées (images/emoji/, copiées par
 * `npm run vendor:emojis`) : hors-ligne et dans l'app native, rien ne part
 * vers un tiers.
 *
 * Garde-fous :
 * - seul un emoji dont l'image existe est converti (table EMOJI_3D, générée) ;
 *   les autres restent des caractères, comme avant ;
 * - rien n'est converti là où une image n'a pas sa place ou casserait
 *   quelque chose : champs de saisie, <option>, SVG (avatars), et tout
 *   sous-arbre marqué `data-emo="non"` — en particulier les conteneurs hors
 *   écran que html2canvas capture aussitôt créés pour les PDF (l'image
 *   n'aurait pas eu le temps de charger : un trou dans le PDF) ;
 * - une image introuvable redevient son caractère (`alt`), jamais un trou ;
 * - `alt` porte l'emoji d'origine : un lecteur d'écran le lit comme avant.
 * ===================================================================== */
(function (racine) {
  // Même règle que les navigateurs : un pictogramme dont la présentation par
  // défaut est « texte » (◀ ▶ ✔ ☀…) n'est un emoji que suivi de U+FE0F.
  // Sans cette règle, les flèches ◀ ▶ des sous-menus seraient devenues de
  // gros boutons « lecture » bleus. Motif partagé avec
  // scripts/vendorer-emojis.mjs et le banc d'essai (même source de vérité).
  const MOTIF = String.raw`(?:\p{RI}\p{RI}|[#*0-9]️?⃣|(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️)\p{EMod}?(?:‍(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️?)\p{EMod}?)*)`;
  racine.EMOJI_3D_MOTIF = MOTIF;
  // Clé d'un emoji : ses points de code en hexadécimal, sans U+FE0F (le
  // sélecteur de variante s'écrit ou non selon la source ; la table, elle,
  // pointe vers le bon fichier dans les deux cas).
  racine.cleEmoji3d = (s) => Array.from(s)
    .map(c => c.codePointAt(0).toString(16).padStart(4, "0"))
    .filter(h => h !== "fe0f").join("-");
  if (typeof document === "undefined") return;   // banc d'essai / générateur

  const TABLE = racine.EMOJI_3D || {};
  const RE = new RegExp(MOTIF, "gu");
  // Dossier des images, relatif à CE script : les pages sont servies depuis
  // la racine (index.html) comme depuis une adresse absolue (/defi).
  const script = document.currentScript;
  const base = new URL("../images/emoji/", script ? script.src : location.href).href;
  const IGNORER = /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|SELECT|TITLE|NOSCRIPT|CODE|PRE)$/;
  const SVG = "http://www.w3.org/2000/svg";

  function ignore(parent) {
    if (!parent || parent.nodeType !== 1) return true;
    if (IGNORER.test(parent.nodeName) || parent.namespaceURI === SVG) return true;
    if (parent.isContentEditable) return true;
    return !!(parent.closest && parent.closest('[data-emo="non"], svg'));
  }

  function convertirTexte(noeud) {
    const texte = noeud.nodeValue;
    if (!texte || texte.length > 5000) return;
    RE.lastIndex = 0;
    if (!RE.test(texte) || ignore(noeud.parentNode)) return;
    RE.lastIndex = 0;
    let fin = 0, change = false, m;
    const frag = document.createDocumentFragment();
    while ((m = RE.exec(texte))) {
      const fichier = TABLE[racine.cleEmoji3d(m[0])];
      if (!fichier) continue;
      if (m.index > fin) frag.appendChild(document.createTextNode(texte.slice(fin, m.index)));
      const img = document.createElement("img");
      img.className = "emo";
      img.alt = m[0];
      img.draggable = false;
      img.decoding = "async";
      img.src = base + fichier + ".webp";
      frag.appendChild(img);
      fin = m.index + m[0].length;
      change = true;
    }
    if (!change) return;
    if (fin < texte.length) frag.appendChild(document.createTextNode(texte.slice(fin)));
    noeud.parentNode.replaceChild(frag, noeud);
  }

  function convertir(racineDom) {
    if (!racineDom) return;
    if (racineDom.nodeType === 3) { convertirTexte(racineDom); return; }
    if (racineDom.nodeType !== 1 && racineDom.nodeType !== 11) return;
    if (racineDom.nodeType === 1 && racineDom.closest('[data-emo="non"], svg')) return;
    const w = document.createTreeWalker(racineDom, NodeFilter.SHOW_TEXT);
    const lot = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) lot.push(n);   // on ne modifie pas en marchant
    lot.forEach(convertirTexte);
  }
  racine.convertirEmojis3d = convertir;

  // Image absente (fichier manquant, premier lancement hors-ligne…) : on
  // remet le caractère d'origine à sa place.
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img && img.tagName === "IMG" && img.classList.contains("emo") && img.parentNode) {
      img.parentNode.replaceChild(document.createTextNode(img.alt), img);
    }
  }, true);

  function demarrer() {
    convertir(document.body);
    new MutationObserver((mutations) => {
      for (const mu of mutations) {
        if (mu.type === "characterData") convertirTexte(mu.target);
        else mu.addedNodes.forEach(convertir);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) demarrer();
  else document.addEventListener("DOMContentLoaded", demarrer);
})(typeof window !== "undefined" ? window : globalThis);
