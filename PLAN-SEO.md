# 🔍 Plan — Référencement (SEO) de FamiTeam

> Document de travail, créé le 25 août 2026, en complément de
> `PLAN-COMMERCIAL.md` (chantier *✍️ Contenu & référencement*, phase 1,
> périmètre *plus tard*). Ce document ne change pas ce périmètre : écrire du
> contenu reste une activité lente, incompatible avec le budget d'**une heure
> par semaine** (§ 0.3 de `PLAN-COMMERCIAL.md`). Ce qu'il change : la partie
> **technique** du référencement — gratuite en temps une fois faite — est
> **terminée aujourd'hui**, et la suite est découpée en étapes de 15 à
> 30 minutes, à piocher un jour où le rituel hebdomadaire (« Semaine 1 : les
> chiffres ») laisse un peu de marge.

**Avertissement sur les chiffres.** Comme dans `PLAN-COMMERCIAL.md`, chaque
affirmation qui n'est pas une mesure directe porte un degré de certitude.

---

## 0. Le référencement expliqué à un enfant de 10 ans

Imagine une **immense bibliothèque** avec des milliards de livres, et un seul
bibliothécaire — **Google** — qui doit trouver le bon livre pour chaque
personne qui pose une question.

Trois choses aident le bibliothécaire à te trouver :

1. **Un titre clair sur la couverture.** Si ton livre s'appelle juste
   « Machin », personne ne devine de quoi il parle. S'il s'appelle « Punir ou
   réparer : que faire quand un enfant dérape ? », le bibliothécaire sait
   exactement à qui le donner.
2. **Un résumé au dos du livre.** C'est la petite description que Google
   affiche sous le titre dans les résultats. Si elle est utile, la personne
   clique.
3. **D'autres personnes qui recommandent ton livre.** Si dix bibliothèques
   amies disent « ce livre est bien, va le lire », le bibliothécaire te fait
   plus confiance. Ce sont les **liens** que d'autres sites font vers le tien
   (les « backlinks »).

C'est tout, en vrai. Le reste — ce document — n'est que la liste concrète des
gestes qui rendent ces trois choses vraies pour FamiTeam.

**Ce qui ne marche pas** (et qu'il ne faut jamais faire) : écrire le même mot
cent fois pour « tromper » le bibliothécaire, payer quelqu'un pour de fausses
recommandations, ou copier le résumé d'un autre livre. Google le voit et
punit le site — parfois pendant des mois. **Certitude : 90 %.**

---

## 1. Où en était FamiTeam avant aujourd'hui

| Élément | État avant | Pourquoi ça compte |
|---|---|---|
| Titre + résumé (`<title>`, description) sur chaque page publique | ✅ déjà fait | C'est la « couverture » vue par Google |
| Adresse canonique (`rel=canonical`) | ⚠️ seulement sur 2 pages sur 5 | Évite que Google hésite entre deux adresses pour la même page |
| Fiche « réseaux sociaux » (Open Graph) | ⚠️ seulement sur 2 pages sur 5 | Aperçu propre quand un lien est partagé (WhatsApp, Facebook…) |
| Données structurées (JSON-LD) | ⚠️ page d'accueil et article pilote seulement | Aide Google à comprendre *quel type* de contenu c'est |
| `robots.txt` + `sitemap.xml` | ✅ déjà fait, propre | Dit à Google quoi explorer et quoi ignorer |
| Images avec texte alternatif (`alt`) | ✅ déjà fait (voir `js/auth.js`) | Accessibilité + référencement image |
| Un article de contenu (`punir-ou-reparer.html`) | ✅ déjà fait, bien construit | Le seul contenu qui peut faire venir des gens qui ne connaissent pas encore FamiTeam |
| Suivi Google Search Console | ❔ non vérifié dans ce dossier | Sans lui, on ne *sait* pas ce que Google voit réellement |

**Certitude sur ce tableau : 95 %** (lecture directe du code au 25 août
2026) — sauf la dernière ligne, à 30 %, faute d'accès au compte Search
Console depuis cet environnement.

---

## 2. Ce qui a été fait aujourd'hui (technique, zéro minute récurrente)

Corrections apportées le **25 août 2026**, sans impact visuel, réversibles en
un `git revert` :

- **`faq.html`** : adresse canonique, fiche Open Graph, et données
  structurées `FAQPage` (chaque question/réponse balisée).
- **`confidentialite.html`** et **`mentions-legales.html`** : adresse
  canonique ajoutée.
- **`sitemap.xml`** : date de dernière modification (`lastmod`) ajoutée sur
  chaque page, pour que Google sache ce qui est récent.

**Note sur `FAQPage`, par souci d'exactitude (certitude 85 %) :** depuis août
2023, Google a restreint l'affichage visuel « accordéon » de ce balisage aux
sites gouvernementaux et de santé reconnus — FamiTeam n'en obtiendra
probablement pas l'effet visuel dans les résultats Google eux-mêmes. Le
balisage reste ajouté car il ne coûte rien, reste lu par Google pour
comprendre la page, et peut être utilisé par d'autres moteurs (Bing) ou par
des assistants IA qui lisent les pages. Ce n'est pas une action à refaire ni
à défaire : c'est acquis.

Ce qui **n'a volontairement pas été changé** aujourd'hui : le texte du titre
principal (`<h1>`) de la page d'accueil, qui affiche seulement « FamiTeam »
plutôt qu'une phrase avec des mots-clés. C'est une question de **rédaction et
d'identité visuelle** (traduite en quatre langues), pas un simple réglage
technique — elle est documentée en § 4 pour décision, plutôt que changée sans
en parler.

---

## 3. Le guide pas-à-pas pour la suite

Chaque étape est pensée pour tenir dans le rituel hebdomadaire existant
(§ 4 de `PLAN-COMMERCIAL.md`), sans lui ajouter de créneau récurrent. Prends
une étape, un jour où tu as 15 à 30 minutes de rabe — pas plus.

### Étape 1 — Dire à Google que le site existe *(15 min, une seule fois)*

1. Va sur [Google Search Console](https://search.google.com/search-console).
2. Ajoute la propriété `famiteam.com` (la vérification par
   `google-site-verification` est déjà en place dans `index.html`, ligne 9 —
   utilise la même méthode).
3. Colle l'adresse du plan du site : `https://famiteam.com/sitemap.xml`.
4. Reviens une fois par mois (pas plus) voir l'onglet **Performances** :
   c'est la liste des mots que les gens tapent avant d'arriver sur le site.
   Elle dit quoi écrire ensuite, sans deviner.

*Certitude que cette étape est correctement descriptible sans accès au
compte réel : 60 % — à vérifier concrètement au moment de le faire.*

### Étape 2 — Vérifier la vitesse *(10 min)*

1. Ouvre [PageSpeed Insights](https://pagespeed.web.dev/) et colle
   `https://famiteam.com/`.
2. Un site lent perd des visiteurs et perd des places dans Google. La page
   d'accueil de FamiTeam est déjà légère (un seul fichier CSS, JS différé,
   images en `loading="lazy"`) : ce test sert à **confirmer**, pas à
   deviner un problème.

### Étape 3 — Un deuxième article, quand l'envie et le temps se rencontrent *(plusieurs séances de 30 min)*

`punir-ou-reparer.html` est le modèle à copier : une vraie question de
parent, une réponse concrète, un lien discret vers l'app à la fin — jamais
l'inverse. Trois idées de sujets, choisies parce qu'elles répondent à une
vraie recherche et pas seulement à une envie d'écrire :

- « Faut-il donner de l'argent de poche contre les tâches ménagères ? »
  (répond directement à la faiblesse de NeatKid citée en § 2.2 de
  `PLAN-COMMERCIAL.md`)
- « Routine du soir 2-7 ans : ce qui marche vraiment »
- « Comment gérer une crise à l'épicerie sans céder ni punir »

Méthode : un seul article à la fois, jamais deux en chantier (règle du § 0.3
de `PLAN-COMMERCIAL.md`), et on ne le publie que terminé.

### Étape 4 — Obtenir de vraies recommandations (liens) *(rendement le plus élevé, se recoupe avec un chantier existant)*

C'est le levier le plus payant et le plus lent : un lien depuis un site
sérieux (une école, un pédiatre, un blog parental) vaut plus que dix
techniques. Bonne nouvelle : **cela ne demande pas de nouveau chantier** —
c'est exactement le même geste que le chantier *🏫 Écoles / 🧸 Crèches /
🩺 Professionnels de l'enfance* déjà prévu en phase 2. Quand une directrice
d'école accepte de parler de FamiTeam, demander en plus un lien depuis le
site de l'école (si elle en a un) ne coûte pas une minute de plus et sert les
deux objectifs à la fois.

### Étape 5 — Vérifier une fois par trimestre, pas plus souvent

Un tableau à remplir dans l'onglet Croissance ou ici, à main levée :

| Trimestre | Visiteurs venus de Google | Mots-clés qui amènent du monde | Note |
|---|---|---|---|
| T3 2026 | — | — | Premier relevé après mise en place de Search Console |

**Règle d'arrêt**, comme pour les autres canaux (§ 4 de
`PLAN-COMMERCIAL.md`) : si après trois trimestres le référencement n'amène
toujours aucune famille mesurable, on l'acte et on n'y consacre plus
d'énergie — le parrainage et les prescripteurs restent, mesurablement, plus
rentables à l'heure investie.

---

## 4. Ce qui reste à décider (pas à faire seul)

- **Le `<h1>` de la page d'accueil** (`js/auth.js`, ligne 1378) affiche
  « FamiTeam » plutôt qu'une phrase descriptive. Le remplacer par quelque
  chose comme « FamiTeam — une ambiance positive en famille, 2 à 7 ans »
  aiderait Google **et** clarifierait immédiatement le site pour un visiteur
  qui ne connaît pas le nom — mais c'est un choix de **rédaction et
  d'identité visuelle**, à répercuter dans les quatre langues (`i18n.*.js`),
  pas une simple correction technique. **Certitude que le gain SEO serait
  réel : 70 %. Décision à prendre par le fondateur, pas par ce document.**

---

## 5. Ce qu'il ne faut jamais faire (rappel, certitude 90 % sur chaque point)

- Acheter des liens ou des avis.
- Dupliquer le même texte sur plusieurs pages pour « faire du volume ».
- Répéter un mot-clé de façon artificielle dans le texte.
- Cacher du texte (couleur du fond, taille zéro) pour tromper Google.
- Créer du contenu uniquement pour Google, sans qu'un parent n'ait
  vraiment envie de le lire — Google le détecte de mieux en mieux, et c'est,
  de toute façon, contraire à l'esprit du projet (§ 0.1 de
  `PLAN-COMMERCIAL.md`).
