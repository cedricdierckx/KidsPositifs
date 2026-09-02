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
| `js/ui/*.js` | Rendu de tous les écrans, **17 modules** (espace enfant, parents, admin) — phase C |
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
- **288 tests** au 02/09/2026 (`node test/run.js`). L'interface (`js/ui/`) est
  contrôlée par lecture de son **texte source** (une cinquantaine d'assertions,
  via `sourceUi()`), mais n'est toujours pas **exécutée** dans la `vm` : voir
  le chantier 10 de `COORDINATION.md`, qui reste ouvert.

### Phase B — Validation de schéma à l'écriture (risque faible) ✅ FAIT
- `etatValide(e)` (enfants non vides, types corrects) appelée **avant chaque**
  écriture cloud, centralisée dans `Store.ecritureAutorisee()` (Phase D).

### Phase C — Découpage en modules (risque moyen) ✅ FAIT pour l'interface
- `js/ui.js` (7 841 lignes) est découpé en **17 modules** sous `js/ui/`, un par
  domaine : `pin`, `parrainage`, `partage`, `notifications`, `squelette`,
  `minuteur`, `admin`, `admin-croissance`, `noyau`, `accueil`, `feuille`,
  `enfant`, `statistiques`, `famille`, `parents`, `parents-accueil`, `reglages`.
- **Aucune ligne de code n'a été réécrite** : le découpage est un pur
  déplacement, vérifié ligne à ligne contre l'ancien fichier. Un seul bloc
  change de voisin (`modaleParrainage`, rapproché du reste du parrainage).
- Trois garde-fous nouveaux (`test/run.js`) : `index.html` et `test/harness.js`
  doivent s'accorder sur la liste ET l'ordre des modules ; les modules
  concaténés doivent former un script valide (c'est là que se verrait un
  `const` déclaré deux fois dans deux fichiers — page blanche en scripts
  classiques) ; et **aucun module ne s'exécute au chargement**.
- Ce dernier point est ce qui rend le découpage réversible : comme rien ne
  tourne au chargement, l'ordre des balises `<script>` est un confort de
  lecture, pas une dépendance.

**Ce qui n'a délibérément PAS été fait : le passage aux `import`/`export`.**
La phase prévoyait aussi de convertir les `js/*.js` en modules ES. C'est
écarté pour l'instant, pour trois raisons concrètes et non par prudence
générale :
1. `test/harness.js` charge les fichiers en les **concaténant** dans un même
   script `vm` — c'est cette portée lexicale partagée qui laisse les 288 tests
   appeler n'importe quelle fonction. `import`/`export` sont interdits dans un
   `vm.Script` : la conversion démolirait le banc d'essai, c'est-à-dire
   exactement le filet qui protège le reste.
2. `index.html` injecte le fichier de langue par `document.write` **pendant
   l'analyse**, pour en garantir l'ordre ; un `<script type="module">` est
   différé par nature et ne peut pas écrire dans le document.
3. Les modules ES sont soumis au CORS : ils ne se chargent pas depuis
   `file://`, ce qui ferait perdre l'ouverture directe d'`index.html`.
Le bénéfice annoncé de la phase (lisibilité, fichiers de taille humaine) est
acquis par le découpage seul ; `import`/`export` en apporterait un second
(portée close), au prix des trois points ci-dessus. À rouvrir avec la phase F
(build), qui répondrait aux trois d'un coup.

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

**A → B** (sécurité immédiate) puis **E** (i18n, valeur produit) : **faites**.
**C** est faite pour l'interface (découpage de `js/ui/`), sauf son volet
`import`/`export`, gelé et motivé ci-dessus. Reste **F** (industrialisation),
utile seulement si l'app continue de grossir — et qui lèverait au passage les
trois obstacles au volet ES de la phase C. Voir `COORDINATION.md` pour la
priorité actuelle face aux autres chantiers (croissance, dons, contenu).
