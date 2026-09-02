// Recopie les bibliothèques d'impression (jsPDF + html2canvas, builds UMD)
// depuis node_modules vers js/vendor/.
//
// Même raison que scripts/vendorer-supabase.mjs : pas de CDN (le hors-ligne
// casserait), et un fichier embarqué versionné plutôt qu'un téléchargement
// manuel. Chargées à la demande seulement (voir js/ui/partage.js, chargerLibsImpression) :
// ~600 Ko à elles deux, pour une fonction que la plupart des sessions
// n'utilisent jamais — les charger au démarrage pénaliserait tout le monde
// pour un usage rare.
//
// À relancer après chaque mise à jour des paquets : npm run vendor:pdf
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cible = path.join(racine, "js", "vendor");
mkdirSync(cible, { recursive: true });

function vendoriser(nomPaquet, cheminDist, nomFichier) {
  const paquet = path.join(racine, "node_modules", nomPaquet);
  const infos = JSON.parse(readFileSync(path.join(paquet, "package.json"), "utf8"));
  const source = path.join(paquet, cheminDist);
  const entete = `/* ${nomPaquet} v${infos.version} — licence ${infos.license}.
 * Fichier NON MODIFIÉ, recopié depuis node_modules par scripts/vendorer-pdf.mjs
 * (npm run vendor:pdf). Ne pas éditer à la main : la prochaine recopie
 * écraserait la correction.
 */
`;
  const dest = path.join(cible, nomFichier);
  writeFileSync(dest, entete + readFileSync(source, "utf8"));
  console.log(`js/vendor/${nomFichier} prêt (v${infos.version}, ${Math.round(readFileSync(dest).length / 1024)} Ko).`);
}

vendoriser("jspdf", "dist/jspdf.umd.min.js", "jspdf.js");
vendoriser("html2canvas", "dist/html2canvas.min.js", "html2canvas.js");
