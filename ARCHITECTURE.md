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
| `js/i18n.js` | Traductions FR/EN/NL/DE + helper `t("clé")` |
| `js/data.js` | Données statiques : `APP_NOM`, enfants, missions, avatar, écosystème |
| `js/avatar.js` | Rendu vectoriel (SVG) des avatars |
| `js/croissance.js` | Données du plan de développement (chantiers, e-mails) — voir `PLAN-COMMERCIAL.md` |
| `js/app.js` | État de jeu + logique (missions, badges, écosystème, sûreté données) |
| `js/store.js` | Couche de données isolée : sync `family_state(_history)`, garde-fous d'écriture |
| `js/ui.js` | Rendu de tous les écrans (espace enfant, parents, admin) |
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
- **88 tests** au 26/07/2026 (`node test/run.js`). Ne couvre pas encore `js/ui.js`
  (voir chantier « Étendre le banc d'essai à ui.js » dans `COORDINATION.md`).

### Phase B — Validation de schéma à l'écriture (risque faible) ✅ FAIT
- `etatValide(e)` (enfants non vides, types corrects) appelée **avant chaque**
  écriture cloud, centralisée dans `Store.ecritureAutorisee()` (Phase D).

### Phase C — Découpage en modules (risque moyen) — pas commencé
- Passer les `js/*.js` en **modules ES** (`import`/`export`) au lieu de globals.
- Découper `ui.js` (très gros fichier, ~4000 lignes) en sous-vues :
  `ui/accueil.js`, `ui/missions.js`, `ui/avatar.js`, `ui/parents.js`,
  `ui/admin.js`, `ui/recovery.js`.
- Avantage : lisibilité, moins d'effets de bord globaux. **Nécessite la Phase A**
  (faite) — risque désormais couvert par la suite de tests, mais `ui.js` lui-même
  n'est pas testé (cf. Phase A) : à faire prudemment, petit module à la fois.

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
Restent **C** (modularisation) et **F** (industrialisation), utiles seulement
si l'app continue de grossir — voir `COORDINATION.md` pour leur priorité
actuelle face aux autres chantiers (croissance, dons, contenu).
