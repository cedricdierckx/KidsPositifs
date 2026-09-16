// Génère en.html, nl.html et de.html : les pages d'atterrissage en anglais,
// néerlandais et allemand.
//
// Pourquoi elles existent. L'application choisit sa langue toute seule, dans
// le navigateur, à une seule et même adresse. Un moteur de recherche ne voit
// donc qu'une seule page, en français : les trois autres langues n'existent
// pas pour lui, et aucun parent néerlandophone ne peut tomber sur FamiTeam en
// cherchant dans sa langue. Ces trois pages donnent à chaque langue une
// adresse réelle, avec du vrai texte lisible sans JavaScript.
//
// Le texte n'est PAS recopié à la main : il est relu dans les fichiers de
// traduction déjà existants (js/i18n.*.js). Une traduction corrigée là-bas se
// répercute ici en relançant ce script — rien à maintenir en double.
//
// Usage : node scripts/generer-langues.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VERSION = "193"; // doit suivre le ?v= des autres pages

// Lit une clé dans un fichier de traduction. On ne parse pas le JavaScript :
// on lit la chaîne caractère par caractère en respectant les échappements,
// ce qui reste juste même quand la traduction contient guillemets ou balises.
function cle(source, nom) {
  const debut = source.indexOf('"' + nom + '": "');
  if (debut === -1) throw new Error("clé absente : " + nom);
  let i = debut + nom.length + 5, out = "";
  while (i < source.length) {
    const c = source[i];
    if (c === "\\") { out += source[i] + source[i + 1]; i += 2; continue; }
    if (c === '"') break;
    out += c; i++;
  }
  return JSON.parse('"' + out + '"');
}

const sources = {
  en: readFileSync(path.join(racine, "js", "i18n.en.js"), "utf8"),
  nl: readFileSync(path.join(racine, "js", "i18n.nl.js"), "utf8"),
  de: readFileSync(path.join(racine, "js", "i18n.de.js"), "utf8")
};

// Le seul texte écrit ici : ce qui n'existe nulle part dans l'application —
// le titre d'onglet, le résumé affiché par Google, et le bouton d'entrée.
const PAGE = {
  en: { locale: "en_GB", nom: "English",
        titre: "FamiTeam — a positive family atmosphere, ages 3 to 12",
        desc: "Free family app for ages 3-12: two minutes a day to reward positive behaviour. Points are never taken away — when things go wrong, the child repairs. No ads, data stored in Europe.",
        cta: "Open FamiTeam in English", retour: "FamiTeam home", autres: "Other languages" },
  nl: { locale: "nl_NL", nom: "Nederlands",
        titre: "FamiTeam — een positieve sfeer in het gezin, 3 tot 12 jaar",
        desc: "Gratis gezinsapp voor 3-12 jaar: twee minuten per dag om positief gedrag te waarderen. Er gaan nooit punten af — als er iets misgaat, herstelt het kind. Zonder reclame, gegevens in Europa.",
        cta: "FamiTeam in het Nederlands openen", retour: "Naar FamiTeam", autres: "Andere talen" },
  de: { locale: "de_DE", nom: "Deutsch",
        titre: "FamiTeam — eine positive Familienstimmung, 3 bis 12 Jahre",
        desc: "Kostenlose Familien-App für 3-12 Jahre: zwei Minuten am Tag, um positives Verhalten zu bestärken. Punkte werden nie abgezogen — geht etwas schief, macht das Kind es wieder gut. Ohne Werbung, Daten in Europa.",
        cta: "FamiTeam auf Deutsch öffnen", retour: "Zu FamiTeam", autres: "Weitere Sprachen" }
};

const LANGUES = ["fr", "en", "nl", "de"];
const ADRESSE = { fr: "https://fami.team/", en: "https://fami.team/en",
                  nl: "https://fami.team/nl", de: "https://fami.team/de" };
const NOM = { fr: "Français", en: "English", nl: "Nederlands", de: "Deutsch" };

function echapper(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
}

for (const l of Object.keys(PAGE)) {
  const s = sources[l], p = PAGE[l];
  const T = n => cle(s, "auth." + n);
  const hero = T("hero_sous").replace(/\{app\}/g, "FamiTeam");

  const atouts = [1, 2, 3, 4, 5].map(n =>
    `      <div class="lang-atout">\n` +
    `        <strong>${echapper(T("feat" + n + "_t"))}</strong>\n` +
    `        <span>${echapper(T("feat" + n + "_d"))}</span>\n` +
    `      </div>`).join("\n");

  const etapes = [1, 2, 3].map(n => `        <li>${echapper(T("etape" + n))}</li>`).join("\n");

  const apercus = [["enfant", "shot1", 500], ["avatar", "shot2", 560], ["parents", "shot3", 680]].map(([img, k, haut]) =>
    `      <figure>\n` +
    `        <img src="images/apercu-${img}.png" width="500" height="${haut}" loading="lazy"\n` +
    `             alt="${echapper(T(k + "_alt"))}">\n` +
    `        <figcaption>${echapper(T(k))}</figcaption>\n` +
    `      </figure>`).join("\n");

  const alternates = LANGUES.map(a =>
    `  <link rel="alternate" hreflang="${a}" href="${ADRESSE[a]}">`).join("\n");

  const autresLangues = LANGUES.filter(a => a !== l).map(a =>
    `<a href="${a === "fr" ? "/" : "/" + a}">${NOM[a]}</a>`).join(" · ");

  const html = `<!DOCTYPE html>
<html lang="${l}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f6a623">
  <!-- FICHIER GÉNÉRÉ par scripts/generer-langues.mjs — NE PAS MODIFIER À LA MAIN.
       Le texte vient de js/i18n.${l}.js : corrigez la traduction là-bas, puis
       relancez « node scripts/generer-langues.mjs ». -->
  <title>${echapper(p.titre)}</title>
  <meta name="description" content="${echapper(p.desc)}">
  <link rel="canonical" href="${ADRESSE[l]}">
${alternates}
  <link rel="alternate" hreflang="x-default" href="${ADRESSE.fr}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${echapper(p.titre)}">
  <meta property="og:description" content="${echapper(p.desc)}">
  <meta property="og:url" content="${ADRESSE[l]}">
  <meta property="og:image" content="https://fami.team/images/apercu-enfant.png">
  <meta property="og:site_name" content="FamiTeam">
  <meta property="og:locale" content="${p.locale}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "FamiTeam",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Any web browser",
    "url": "${ADRESSE[l]}",
    "inLanguage": "${l}",
    "audience": { "@type": "PeopleAudience", "suggestedMinAge": 3, "suggestedMaxAge": 12 },
    "description": ${JSON.stringify(p.desc)},
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
    "author": { "@type": "Person", "name": "Cédric Dierckx" },
    "publisher": { "@type": "Person", "name": "Cédric Dierckx" },
    "isAccessibleForFree": true
  }
  </script>
  <link rel="stylesheet" href="css/style.css?v=${VERSION}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌟</text></svg>">
  <style>
    body{padding:24px 16px 60px}
    .page-legale{max-width:660px; margin:0 auto}
    .page-legale .carte{text-align:left; margin-bottom:16px}
    .page-legale h1{font-size:27px; line-height:1.25}
    .page-legale h2{font-size:19px; margin-top:1.4em}
    .page-legale p, .page-legale li{color:var(--doux); line-height:1.65; font-size:15.5px}
    .page-legale strong{color:#27384a}
    .lang-atout{margin:10px 0}
    .lang-atout strong{display:block}
    .lang-atout span{color:var(--doux); font-size:15px; line-height:1.55}
    .lang-cta{display:inline-block; margin:6px 0 2px; padding:12px 20px; border-radius:14px;
      background:#f6a623; color:#fff; font-weight:800; text-decoration:none}
    .lang-autres{font-size:14px; margin-top:14px}
    .page-legale figure{margin:16px 0}
    .page-legale figure img{max-width:100%; height:auto; border-radius:14px}
    .page-legale figcaption{color:var(--doux); font-size:14px; margin-top:6px}
  </style>
</head>
<body>
  <div class="page-legale">
    <section class="carte">
      <div class="code-logo">🌟</div>
      <h1>${echapper(T("hero_titre"))}</h1>
      <p>${echapper(hero)}</p>
      <p><a class="lang-cta" href="/" id="entrer">${echapper(p.cta)}</a></p>
      <p class="note lang-autres">${p.autres} : ${autresLangues}</p>
    </section>

    <section class="carte">
      <h2>${echapper(T("principe_titre"))}</h2>
      <p>${T("principe_1")}</p>
      <p>${T("principe_2")}</p>
    </section>

    <section class="carte">
${atouts}
    </section>

    <section class="carte">
      <h2>${echapper(T("comment_titre"))}</h2>
      <ol>
${etapes}
      </ol>
${apercus}
      <p><a class="lang-cta" href="/">${echapper(p.cta)}</a></p>
    </section>
  </div>

  <!-- Entrer dans l'application dans CETTE langue. L'application lit
       « kp_langue » au démarrage (voir detecterLangue) : on l'écrit avant de
       partir, sinon un parent arrivé ici depuis Google repartirait dans la
       langue de son téléphone. Sans stockage, le lien reste un lien normal. -->
  <script>
    (function () {
      document.querySelectorAll('a[href="/"], a.lang-cta').forEach(function (a) {
        a.addEventListener("click", function () {
          try { localStorage.setItem("kp_langue", ${JSON.stringify(l)}); } catch (e) {}
        });
      });
    })();
  </script>
</body>
</html>
`;
  writeFileSync(path.join(racine, l + ".html"), html);
  console.log(l + ".html généré (" + html.length + " octets).");
}
