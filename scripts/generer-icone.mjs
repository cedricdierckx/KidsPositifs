// Génère les sources d'icône/écran de démarrage (resources/) à partir du
// « logo » déjà en place partout dans l'app : le texte « 🌟 FamiTeam »
// (js/ui/*.js) et son dégradé doré caractéristique — celui déjà utilisé pour
// les moments de récompense (css/style.css, ligne ~528 : radial-gradient
// « circle at 35% 30%, #fff3c4, #ffd25e 60%, #f6a623 »). Rien n'est inventé :
// c'est une mise en forme graphique d'une identité déjà établie, en attendant
// un vrai logo dessiné (voir PLAN-MOBILE.md).
//
// Réexécutable : `node scripts/generer-icone.mjs`, puis
// `npx capacitor-assets generate` pour produire toutes les tailles.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dossier = path.join(racine, "resources");
mkdirSync(dossier, { recursive: true });

const DOREE = `
  <radialGradient id="g" cx="35%" cy="30%" r="80%">
    <stop offset="0%" stop-color="#fff3c4"/>
    <stop offset="60%" stop-color="#ffd25e"/>
    <stop offset="100%" stop-color="#f6a623"/>
  </radialGradient>`;

// Étoile à 5 branches, centrée en (cx,cy), pointe vers le haut.
function etoile(cx, cy, rExt, rInt) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rExt : rInt;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="#fff"/>`;
}

async function png(svg, taille, fichier) {
  await sharp(Buffer.from(svg)).resize(taille, taille).png().toFile(path.join(dossier, fichier));
  console.log("→ " + fichier);
}

const FOND = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${DOREE}</defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
</svg>`;

// Étoile seule, sur fond transparent : la zone visible sûre d'une icône
// adaptative Android tient dans ~66 % du canevas — on reste large en dessous.
const AVANT_PLAN = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  ${etoile(512, 512, 280, 140)}
</svg>`;

const ICONE_PLEINE = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${DOREE}</defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  ${etoile(512, 512, 280, 140)}
</svg>`;

const SPLASH = `<svg width="2732" height="2732" xmlns="http://www.w3.org/2000/svg">
  <defs>${DOREE}</defs>
  <rect width="2732" height="2732" fill="url(#g)"/>
  ${etoile(1366, 1366, 300, 150)}
</svg>`;

await png(FOND, 1024, "icon-background.png");
await png(AVANT_PLAN, 1024, "icon-foreground.png");
await png(ICONE_PLEINE, 1024, "icon-only.png");
await png(SPLASH, 2732, "splash.png");

console.log("\nresources/ prêt. Prochaine étape : npx capacitor-assets generate");
