# 🏗️ FamiTeam — Architecture & feuille de route

Document vivant. Objectif : faire évoluer l'application **par petites touches
sûres**, sans jamais remettre en cause la **sûreté des données** (priorité n°1).

> 🧭 **Plusieurs agents Claude interviennent sur ce dépôt.** Avant de
> commencer, lire **`COORDINATION.md`** (protocole de travail concurrent +
> catalogue des chantiers priorisés, avec le modèle Claude recommandé pour
> chacun).

## 1. État actuel (vue d'ensemble)

Application **web vanilla** (sans framework), chargée par `index.html` :

| Fichier | Rôle |
|---|---|
| `js/demarrage.js` | Écran de démarrage animé (le temps que la session arrive) |
| `js/config.js` | Clés Supabase (publiques, sécurité par RLS) |
| `js/vendor/supabase.js` | Bibliothèque Supabase embarquée (MIT) — recopiée par `npm run vendor:supabase`, jamais éditée |
| `js/i18n.js` | Traductions FR/EN/NL/DE + helper `t("clé")` |
| `js/data.js` | Données statiques : `APP_NOM`, enfants, missions, avatar, écosystème |
| `js/avatar.js` | Rendu vectoriel (SVG) des avatars |
| `js/croissance.js` | Données du plan de développement (chantiers, e-mails) — voir `PLAN-COMMERCIAL.md` |
| `js/app.js` | État de jeu + logique (missions, badges, écosystème, sûreté données) |
| `js/store.js` | Couche de données isolée : sync `family_state(_history)`, garde-fous d'écriture |
| `js/ui/*.js` | Rendu de tous les écrans, en 14 morceaux (Phase C) : `pin`, `partage`, `systeme`, `squelette`, `minuteur`, `admin`, `admin-croissance`, `rendu`, `semaine-papier`, `enfant`, `planete-avatar`, `parents`, `reglages`, `retours` |
| `js/auth.js` | Auth, familles, invitations, parrainage, **synchronisation** |
| `supabase/schema.sql` | Schéma BDD : tables, RLS, fonctions, déclencheurs |
| `supabase/functions/` | Edge functions : `send-mail`, `delete-account`, `stripe-webhook` |
| `test/` | Suite de non-régression headless (`node test/run.js`) |

**Source de vérité** : Supabase (`family_state.data` = `etat` JSON). Le
`localStorage` n'est qu'un **cache** local / hors-ligne.

## 2. Invariants de sûreté (à NE JAMAIS casser)

1. **Source unique** : le cloud fait foi ; le cache n'est qu'un miroir.
2. **Liaison etat ↔ famille** (`lierEtat` / `familleEtat`) : on n'écrit jamais
   l'état d'une famille dans une autre.
3. **Jamais d'écrasement vide** : une sauvegarde sans enfant est refusée.
4. **Migrations additives** (`normaliser`) : on n'efface jamais un champ existant.
5. **Historique automatique** (`family_state_history`) : tout état précédent est
   archivé (40 instantanés/famille) → restauration toujours possible.
6. **Toute modif touchant la sync ou le schéma = test de non-régression** (cf. §4).

## 3. Feuille de route progressive (du moins au plus ambitieux)

Chaque phase est **indépendante**, livrable seule, et **réversible**.

### Phase A — Tests de non-régression (priorité, risque faible) ✅ FAIT
- Suite Node headless (`test/run.js` + `test/harness.js`, `vm` + DOM stub) :
  crédit/décrédit mission, plan « jours suivants », écosystème (prérequis,
  coûts), **sync** (anti inter-familles, anti-vide), migrations `normaliser`,
  auto-évaluation, i18n (parité des traductions), etc.
- **306 tests** au 04/09/2026 (`node test/run.js`). L'interface (`js/ui/*.js`)
  est désormais **chargée et exécutée** par le banc d'essai, de deux façons
  complémentaires :
  - `construireContexte({ avecInterface: true })` charge i18n + data + app +
    store **et** les morceaux d'interface, et expose leurs fonctions sous
    `api.interface` : c'est là qu'on teste un comportement (statistiques de
    l'enfant, semaines, premiers pas, onglets, carte d'ami, formats, mini-graphe).
    `rendre` et `demanderPin` y sont neutralisés après coup, pour qu'un
    mutateur de `app.js` ne repeigne pas l'écran en pleine assertion ;
  - un contexte **isolé** (dans `test/run.js`) exécute les morceaux d'interface
    *seuls* : c'est ce qui prouve l'intégrité du découpage (tous les points
    d'entrée déclarés, aucun symbole en double, chaque fichier analysable seul).
  Reste à couvrir : les fonctions qui construisent réellement du DOM
  (`blocXxx`, `vueXxx`) — elles demandent un faux DOM plus complet que le
  bouchon actuel.

### Phase B — Validation de schéma à l'écriture (risque faible) ✅ FAIT
- `etatValide(e)` (enfants non vides, types corrects) appelée **avant chaque**
  écriture cloud, centralisée dans `Store.ecritureAutorisee()` (Phase D).

### Phase C — Découpage de l'interface (risque moyen) — 1ère moitié ✅ FAITE
**C1 — découpage physique de `ui.js` (fait le 04/09/2026).** Le fichier unique
(7 850 lignes) est devenu **14 fichiers** dans `js/ui/`, du plus bas niveau au
plus haut : `pin`, `partage`, `systeme`, `squelette`, `minuteur`, `admin`,
`admin-croissance`, `rendu`, `semaine-papier`, `enfant`, `planete-avatar`,
`parents`, `reglages`, `retours` (151 à 1 158 lignes chacun).

- **Aucune ligne de code n'a été déplacée, réécrite ni renommée** : les
  morceaux sont des tranches contiguës de l'ancien fichier, recollables à
  l'identique (vérifié mécaniquement avant commit). Le seul ajout est
  l'en-tête de chaque fichier.
- Ce sont toujours des **scripts classiques**, dans l'ordre fixé par
  `index.html` : ils partagent la même portée globale qu'avant, donc aucun
  appel croisé (`ui` ↔ `app.js` ↔ `auth.js`) n'a eu à changer.
- Trois tests gardent le découpage : `index.html` et le contenu de `js/ui/`
  doivent coïncider, l'ensemble doit **s'exécuter** et déclarer tous les
  points d'entrée, et aucun symbole racine ne doit être déclaré deux fois
  (un `const` en double casserait l'app entière au chargement).
- Un morceau au-delà de 1 400 lignes fait échouer un test : le but du
  chantier est la relecture, il ne doit pas se reperdre.
- **Vérifié en plus dans un vrai navigateur** (Chromium sans interface) :
  mode démo, les cinq vues (accueil, famille, planète, avatar, réglages) et
  les six onglets de l'espace parents dans les deux modes (standard et
  expert) — **zéro erreur JavaScript**, et chaque écran peint bien son
  contenu. Recette, si le contrôle doit être refait après un futur
  découpage : servir le dossier (`python3 -m http.server 8137`), copier
  `index.html` en ajoutant à la fin un script qui, sur `DOMContentLoaded`,
  appelle `demarrerDemo()` puis parcourt `etat.vue` / `ongletParent` en
  collectant `window.onerror`, et charger cette page avec
  `chrome --headless=new --virtual-time-budget=15000 --dump-dom`. Ce contrôle
  n'entre pas dans `npm test` : il exige un navigateur, que le dépôt
  n'installe pas (voir Phase F).

**C2 — vrais modules ES (`import`/`export`) : ⏸️ EN PAUSE (décision du
fondateur, 05/09/2026). Aucun agent ne reprend ce chantier sans son accord
explicite.** Recommandation qui a mené à cette pause : Le chantier était prévu comme la suite naturelle de C1. Examen fait,
la recommandation s'inverse — et la décision revient au fondateur :

- **Ce serait forcément un « big bang »**, ce que `§4` interdit : un module ne
  voit pas les globals d'un script classique. Il faudrait convertir d'un seul
  coup `index.html`, les 14 morceaux d'interface **et** `app.js`, `auth.js`,
  `data.js`, `i18n.js`, `store.js`, `avatar.js`, `qr.js`, `croissance.js`, en
  déclarant explicitement les ~250 symboles qu'ils se partagent. Aucun
  découpage en petites étapes vérifiables n'existe ici.
- **Le banc d'essai y perdrait sa force**. Il concatène aujourd'hui les
  fichiers dans un contexte `vm` et atteint **n'importe quelle** fonction ou
  variable interne par la portée lexicale partagée (voir `test/harness.js`).
  Avec des modules, un test ne voit plus que ce qui est `export`é : soit on
  exporte tout « pour les tests » (ce qui vide le bénéfice de la conversion),
  soit on perd des tests. Les 306 tests actuels sont un actif plus précieux
  que la propreté des imports.
- **Deux mécanismes en place cesseraient de fonctionner** : le chargement
  conditionnel des fichiers de langue par `document.write` (inopérant depuis
  un module) et le repli `versionChargeeActuelle()` qui lit les balises
  `<script src>`.
- **Bénéfice pour les familles : nul.** Aucune fonctionnalité, aucune vitesse,
  aucune sûreté de données en plus. Le gain (moins d'effets de bord globaux)
  est réel mais théorique à cette échelle, et C1 a déjà réglé le problème
  concret — la relisibilité.

Certitude que ce raisonnement tient : **85 %**. Si le projet grossit au point
d'avoir besoin d'un outil de build (Phase F), la conversion redeviendra
naturelle : esbuild/Vite la rend beaucoup moins risquée, et le banc d'essai
pourra alors importer les modules réels. **Décision proposée : garder les
scripts classiques, et rouvrir la question seulement avec la Phase F.**

### Phase D — Couche de données isolée (risque moyen) ✅ FAIT
- Toute la sync `family_state(_history)` (lecture/écriture, realtime, garde-fous)
  est regroupée dans `js/store.js`, objet global `Store` à API claire :
  `Store.charger()`, `Store.sauver()`, `Store.planifierSauver()`, `Store.tirer()`,
  `Store.historique()`, `Store.abonnerRealtime()`, `Store.ecritureAutorisee()`.
- Les trois garde-fous d'écriture (anti inter-familles, anti-état-vide,
  validation de schéma) sont centralisés dans `Store.ecritureAutorisee()`.
- `auth.js` ne garde que de fines délégations (compatibilité des appelants).

### Phase E — Internationalisation (FR/EN/NL/DE) ✅ FAIT
- Tous les textes vivent dans `js/i18n.js` (objet `I18N`, helper `t("clé")`),
  dans les 4 langues, avec sélecteur et détection `navigator.language`.
- Test de non-régression dédié : parité des clés + cohérence des `{variables}`
  entre langues (voir Phase A).

### Phase F — Build & qualité (optionnel) — pas commencé
- Outil de build léger (esbuild/Vite) : minification, cache-busting.
- Lint (ESLint) + formatage (Prettier) + CI GitHub Actions (lint + tests Phase A).
- `supabase/schema.sql` dépasse 800 lignes : envisager un découpage en
  `supabase/migrations/*.sql` numérotées si le fichier continue de grossir.

## 4. Règles de travail (process)

- **Une étape = un commit** clair, déployable seul.
- **Toujours** lancer la suite de tests (Phase A) avant de pousser.
- **Jamais** de refonte « big bang » : on remplace par petits morceaux vérifiables.
- Tout changement de `schema.sql` doit être **ré-exécutable** (`if not exists`,
  `create or replace`) et **non destructif**.

## 5. Ordre recommandé

**A → B** (sécurité immédiate) puis **E** (i18n, valeur produit) : **faites**,
ainsi que **C1** (découpage de l'interface).
Restent **C2** (modules ES) et **F** (industrialisation), utiles seulement
si l'app continue de grossir — voir `COORDINATION.md` pour leur priorité
actuelle face aux autres chantiers (croissance, dons, contenu).
