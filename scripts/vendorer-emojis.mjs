// Copie dans images/emoji/ l'image 3D de chaque emoji que l'application
// affiche, et écrit la table js/emoji3d.liste.js que lit js/emoji3d.js.
//
// Source : @lobehub/fluent-emoji-3d (npm, MIT), conversion en WebP 256 px des
// « Fluent Emoji » 3D de Microsoft (MIT). On ne recopie QUE les emojis
// réellement présents dans le code et les pages — quelques centaines de
// fichiers de 2 à 9 Ko —, pas les 3 400 du paquet.
//
// À relancer après l'ajout d'un emoji dans le code ou une traduction : le
// banc d'essai le rappelle (« emojis 3D : chaque emoji du code est recensé »).
//
// Usage : npm install && npm run vendor:emojis
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";

const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const paquet = path.dirname(require.resolve("@lobehub/fluent-emoji-3d/package.json"));
const sourceImages = path.join(paquet, "assets");
const cible = path.join(racine, "images", "emoji");

// Le motif et la clé viennent de js/emoji3d.js lui-même : le générateur ne
// peut pas recenser autre chose que ce que le navigateur convertira.
const ctx = {};
vm.runInNewContext(readFileSync(path.join(racine, "js", "emoji3d.js"), "utf8"), ctx);
const RE = new RegExp(ctx.EMOJI_3D_MOTIF, "gu");
const cle = ctx.cleEmoji3d;

// Où chercher : le code de l'application et les pages publiques, pas les
// bibliothèques embarquées ni la table générée elle-même.
const fichiers = [
  ...readdirSync(path.join(racine, "js")).filter(f => f.endsWith(".js") && f !== "emoji3d.liste.js")
    .map(f => path.join(racine, "js", f)),
  ...readdirSync(racine).filter(f => f.endsWith(".html")).map(f => path.join(racine, f)),
];
const emojis = new Set();
for (const f of fichiers) for (const m of readFileSync(f, "utf8").matchAll(RE)) emojis.add(m[0]);

// Index du paquet par clé normalisée (sans U+FE0F) : le paquet nomme ses
// fichiers d'après la forme « pleinement qualifiée » (2699-fe0f.webp), le code
// écrit l'emoji avec ou sans le sélecteur.
const index = new Map();
for (const f of readdirSync(sourceImages)) {
  if (!f.endsWith(".webp")) continue;
  const nom = f.slice(0, -5);
  index.set(nom.split("-").filter(h => h !== "fe0f").join("-"), nom);
}

rmSync(cible, { recursive: true, force: true });
mkdirSync(cible, { recursive: true });
const table = {};
let copies = 0;
for (const e of [...emojis].sort()) {
  const k = cle(e);
  const nom = index.get(k) || null;       // null : recensé, mais sans image 3D
  table[k] = nom;
  if (nom && !existsSync(path.join(cible, nom + ".webp"))) {
    copyFileSync(path.join(sourceImages, nom + ".webp"), path.join(cible, nom + ".webp"));
    copies++;
  }
}

writeFileSync(path.join(cible, "LICENCE.txt"), `Images : Fluent Emoji (3D) de Microsoft — https://github.com/microsoft/fluentui-emoji
Conversion WebP : @lobehub/fluent-emoji-3d — https://github.com/lobehub/fluent-emoji

MIT License

Copyright (c) Microsoft Corporation.
Copyright (c) 2023 LobeHub.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`);

const lignes = Object.keys(table).sort().map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(table[k])},`);
writeFileSync(path.join(racine, "js", "emoji3d.liste.js"),
`// FICHIER GÉNÉRÉ par scripts/vendorer-emojis.mjs — ne pas éditer à la main.
// Clé : points de code de l'emoji sans U+FE0F ; valeur : nom du fichier
// images/emoji/<valeur>.webp, ou null si le paquet n'a pas d'image 3D (l'emoji
// reste alors un caractère).
window.EMOJI_3D = {
${lignes.join("\n")}
};
`);

const sans = Object.entries(table).filter(([, v]) => !v).length;
console.log(`${emojis.size} emojis recensés, ${copies} images copiées dans images/emoji/, ${sans} sans image 3D.`);
