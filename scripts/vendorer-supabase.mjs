// Recopie la bibliothèque Supabase (build UMD) depuis node_modules vers
// js/vendor/, d'où la page la charge.
//
// Pourquoi l'embarquer plutôt que la prendre sur un CDN : l'app installée est
// censée fonctionner hors ligne (PLAN-MOBILE §0), mais tant que ce script
// venait de cdn.jsdelivr.net, un téléphone sans réseau ne le recevait pas —
// `supabase` restait indéfini et l'app affichait « Configuration requise »
// au lieu de travailler sur son cache local. Un fichier embarqué supprime
// aussi une dépendance à un tiers pour le site : plus de requête vers un
// domaine extérieur au premier chargement.
//
// À relancer après chaque mise à jour du paquet :  npm run vendor:supabase
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const paquet = path.join(racine, "node_modules", "@supabase", "supabase-js");
const infos = JSON.parse(readFileSync(path.join(paquet, "package.json"), "utf8"));
// `jsdelivr` désigne le build UMD : exactement le fichier que servait le CDN,
// celui qui déclare la variable globale `supabase` attendue par js/auth.js.
const source = path.join(paquet, infos.jsdelivr || "dist/umd/supabase.js");

const entete = `/* @supabase/supabase-js v${infos.version} — licence ${infos.license}.
 * Fichier NON MODIFIÉ, recopié depuis node_modules par scripts/vendorer-supabase.mjs
 * (npm run vendor:supabase). Ne pas éditer à la main : la prochaine recopie
 * écraserait la correction. Voir le pourquoi de l'embarquement dans ce script.
 */
`;

const cible = path.join(racine, "js", "vendor", "supabase.js");
mkdirSync(path.dirname(cible), { recursive: true });
writeFileSync(cible, entete + readFileSync(source, "utf8"));
console.log(`js/vendor/supabase.js prêt (v${infos.version}, ${Math.round(readFileSync(cible).length / 1024)} Ko).`);
