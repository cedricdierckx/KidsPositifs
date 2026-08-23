#!/usr/bin/env node
/* =====================================================================
 * FamiTeam — Découpe des traductions par langue
 * ---------------------------------------------------------------------
 * `js/i18n.js` pèse 330 Ko parce qu'il embarque les quatre langues. Un
 * parent n'en lit qu'une : les trois autres sont téléchargées et analysées
 * pour rien, à chaque visite — et deux fois dans le parcours Google, qui
 * recharge la page au retour.
 *
 * Ce script laisse `js/i18n.js` INTACT — il reste la source de vérité, le
 * seul endroit où l'on écrit une traduction, et celui que le banc d'essai
 * charge. Il en produit quatre fichiers destinés au navigateur :
 *
 *   js/i18n.base.js   le code + le français   (toujours chargé)
 *   js/i18n.en.js     l'anglais seul          (à la demande)
 *   js/i18n.nl.js     le néerlandais seul     (à la demande)
 *   js/i18n.de.js     l'allemand seul         (à la demande)
 *
 * La méthode n'est pas un découpage de texte, qui serait fragile : le
 * fichier source est EXÉCUTÉ, et ce sont les tables finales — après les
 * trois cent dix-neuf `Object.assign` et leurs surcharges — qui sont
 * sérialisées. Le résultat est donc exactement ce que le navigateur avait
 * en mémoire avant la découpe, ce qu'un test vérifie table par table.
 *
 * Usage : node scripts/construire-langues.js  [--verifier]
 *   --verifier : ne réécrit rien, sort en erreur si les fichiers générés
 *                ne correspondent plus à la source (utilisé par les tests).
 * ===================================================================== */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const racine = path.join(__dirname, "..");
const SOURCE = path.join(racine, "js", "i18n.js");
const LANGUE_PRINCIPALE = "fr";      // celle qui reste dans le fichier de base

// La source se lit en trois tranches : le code d'en-tête, la table de
// données, puis les fonctions. Les repères sont des lignes entières, pas
// des expressions régulières approximatives.
const DEBUT_TABLE = "const I18N = {";
const FIN_TABLE = "\n};\n";

function decouperSource(src) {
  const iDebut = src.indexOf(DEBUT_TABLE);
  if (iDebut < 0) throw new Error("« const I18N = { » introuvable dans js/i18n.js");
  const iFin = src.indexOf(FIN_TABLE, iDebut);
  if (iFin < 0) throw new Error("fin de la table I18N introuvable");
  const apres = src.slice(iFin + FIN_TABLE.length);
  // Tout ce qui suit la table doit être soit des fonctions, soit des
  // Object.assign de données. On coupe au premier Object.assign : au-delà,
  // il n'y a plus que des traductions (vérifié par un test).
  const iAssign = apres.indexOf("Object.assign(I18N.");
  if (iAssign < 0) throw new Error("aucun bloc Object.assign : structure inattendue");
  // On remonte au début de la ligne (ou du commentaire) qui le précède.
  const finFonctions = apres.lastIndexOf("\n", iAssign);
  return {
    entete: src.slice(0, iDebut),
    fonctions: apres.slice(0, finFonctions),
    donnees: apres.slice(finFonctions)
  };
}

// Exécute la source et rend les quatre tables finales.
function tablesFinales(src) {
  const contexte = {
    console,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { language: "fr" },
    document: { documentElement: {} }
  };
  vm.createContext(contexte);
  vm.runInContext(src + "\n;globalThis.__tables = I18N;", contexte, { filename: "i18n.js" });
  return contexte.__tables;
}

// Sérialisation stable : clés dans l'ordre d'insertion, une par ligne.
// Lisible en revue, et le diff reste petit quand une seule clé change.
function serialiser(table) {
  const lignes = Object.keys(table).map(
    k => "  " + JSON.stringify(k) + ": " + JSON.stringify(table[k]));
  return "{\n" + lignes.join(",\n") + "\n}";
}

const ENTETE_GENERE = (nom) =>
`/* ---------------------------------------------------------------------
 * ${nom} — FICHIER GÉNÉRÉ, NE PAS MODIFIER À LA MAIN.
 * Source : js/i18n.js — régénérer avec « node scripts/construire-langues.js ».
 * Un test échoue si ce fichier ne correspond plus à la source.
 * ------------------------------------------------------------------- */
`;

function construire() {
  const src = fs.readFileSync(SOURCE, "utf8");
  const { entete, fonctions, donnees } = decouperSource(src);
  const tables = tablesFinales(src);
  const langues = Object.keys(tables);
  const sortie = {};

  // Le fichier de base : le code, puis la seule langue principale. Les trois
  // autres tables existent mais vides — `t()` retombe déjà sur le français
  // quand une clé manque, donc rien ne casse tant que le fichier de langue
  // n'est pas arrivé.
  const vides = langues.filter(l => l !== LANGUE_PRINCIPALE)
    .map(l => "  " + l + ": {}").join(",\n");
  sortie["js/i18n.base.js"] =
    ENTETE_GENERE("js/i18n.base.js") + entete
    + "const I18N = {\n  " + LANGUE_PRINCIPALE + ": "
    + serialiser(tables[LANGUE_PRINCIPALE]).replace(/\n/g, "\n  ") + ",\n"
    + vides + "\n};\n" + fonctions + "\n";

  langues.filter(l => l !== LANGUE_PRINCIPALE).forEach(l => {
    sortie["js/i18n." + l + ".js"] =
      ENTETE_GENERE("js/i18n." + l + ".js")
      + "Object.assign(I18N." + l + ", " + serialiser(tables[l]) + ");\n";
  });

  // Garde-fou : rien après la table ne doit être autre chose que des
  // traductions, sinon du code serait silencieusement perdu.
  const restant = donnees.replace(/Object\.assign\(I18N\.[a-z]{2},[\s\S]*?\n\}\);/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").trim();
  if (restant) throw new Error("du code non-traduction suit la table I18N :\n" + restant.slice(0, 300));

  return sortie;
}

const fichiers = construire();
const verifier = process.argv.includes("--verifier");
let ecarts = 0;

Object.keys(fichiers).forEach(rel => {
  const chemin = path.join(racine, rel);
  const attendu = fichiers[rel];
  const actuel = fs.existsSync(chemin) ? fs.readFileSync(chemin, "utf8") : null;
  if (actuel === attendu) return;
  ecarts++;
  if (verifier) {
    console.error("✗ " + rel + (actuel === null ? " : absent" : " : périmé"));
  } else {
    fs.writeFileSync(chemin, attendu);
    console.log("✓ " + rel + "  (" + Math.round(attendu.length / 1024) + " Ko)");
  }
});

if (verifier && ecarts) {
  console.error("\nLes traductions ont changé sans être régénérées.");
  console.error("Lancez : node scripts/construire-langues.js");
  process.exit(1);
}
if (!verifier && !ecarts) console.log("Rien à faire : les fichiers sont à jour.");
