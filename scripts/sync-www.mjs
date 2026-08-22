// Copie les fichiers du site (déployés tels quels sur Vercel) dans www/,
// le dossier que Capacitor embarque dans l'app Android/iOS. On ne touche
// jamais à la racine : elle reste le déploiement web, inchangé.
import { cpSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cible = path.join(racine, "www");

// Ce qui compose l'app : les pages, leurs styles, leur code, leurs images.
const A_COPIER = [
  "index.html", "croissance.html", "defi.html", "challenge.html",
  "confidentialite.html", "mentions-legales.html", "faq.html",
  "punir-ou-reparer.html", "css", "js", "images", "robots.txt", "sitemap.xml"
];

rmSync(cible, { recursive: true, force: true });
mkdirSync(cible, { recursive: true });

for (const nom of A_COPIER) {
  const source = path.join(racine, nom);
  if (existsSync(source)) cpSync(source, path.join(cible, nom), { recursive: true });
}

console.log("www/ prêt (" + A_COPIER.length + " éléments copiés depuis la racine).");
