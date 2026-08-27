// Copie les fichiers du site (déployés tels quels sur Vercel) dans www/,
// le dossier que Capacitor embarque dans l'app Android/iOS. On ne touche
// jamais à la racine : elle reste le déploiement web, inchangé.
import { cpSync, rmSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
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

// Le versionCode Android doit être calculé ici, dans l'environnement npm où
// `git` est fiable — pas depuis le démon Gradle d'Android Studio, lancé
// comme app graphique Windows : son PATH hérité au démarrage de session peut
// ne pas contenir git même quand PowerShell le trouve très bien, et l'appel
// `exec{}` de build.gradle retombait alors silencieusement sur 1 (son repli
// de sécurité), au lieu du vrai nombre de commits. build.gradle lit
// désormais ce fichier en priorité ; l'appel git y reste en second recours
// pour les environnements sans npm (CI, build direct).
try {
  const nb = execFileSync("git", ["rev-list", "--count", "HEAD"], { cwd: racine })
    .toString().trim();
  writeFileSync(path.join(racine, "android", "versionCode.txt"), nb + "\n");
  console.log("versionCode Android : " + nb + " (android/versionCode.txt).");
} catch (e) {
  console.warn("Impossible de calculer le versionCode depuis git : " + e.message);
}
