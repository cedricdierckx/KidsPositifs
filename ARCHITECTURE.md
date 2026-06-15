# 🏗️ FamiTeam — Architecture & feuille de route

Document vivant. Objectif : faire évoluer l'application **par petites touches
sûres**, sans jamais remettre en cause la **sûreté des données** (priorité n°1).

## 1. État actuel (vue d'ensemble)

Application **web vanilla** (sans framework), chargée par `index.html` :

| Fichier | Rôle |
|---|---|
| `js/config.js` | Clés Supabase (publiques, sécurité par RLS) |
| `js/data.js` | Données statiques : `APP_NOM`, enfants, missions, avatar, écosystème |
| `js/avatar.js` | Rendu vectoriel (SVG) des avatars |
| `js/app.js` | État de jeu + logique (missions, badges, écosystème, sûreté données) |
| `js/ui.js` | Rendu de tous les écrans |
| `js/auth.js` | Auth, familles, invitations, parrainage, **synchronisation** |
| `supabase/schema.sql` | Schéma BDD : tables, RLS, fonctions, déclencheurs |

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

### Phase A — Tests de non-régression (priorité, risque faible)
- Script Node headless (déjà utilisé ponctuellement) transformé en suite :
  - chargement des fichiers via `vm` + DOM stub ;
  - scénarios : crédit/décrédit mission, toggle, plan « jours suivants »,
    écosystème (prérequis, coûts), **sync** (anti inter-familles, anti-vide),
    migrations `normaliser` (anciens formats → nouveaux).
- But : pouvoir modifier sans peur. **À faire avant toute autre phase.**

### Phase B — Validation de schéma à l'écriture (risque faible)
- Une fonction `etatValide(e)` (children non vides, types corrects) appelée
  **avant chaque `sauvegardeCloud`** ; en cas d'échec → on bloque + on alerte.
- Renforce les garde-fous existants.

### Phase C — Découpage en modules (risque moyen)
- Passer les `js/*.js` en **modules ES** (`import`/`export`) au lieu de globals.
- Découper `ui.js` (gros fichier) en sous-vues : `ui/accueil.js`, `ui/missions.js`,
  `ui/avatar.js`, `ui/parents.js`, `ui/recovery.js`.
- Avantage : lisibilité, moins d'effets de bord globaux. **Nécessite la Phase A.**

### Phase D — Couche de données isolée (risque moyen)
- Regrouper toute la sync dans un seul module `store.js` (lecture/écriture,
  cache, realtime, garde-fous) avec une API claire : `store.charger(famille)`,
  `store.sauver()`, `store.restaurer(data)`.
- Le reste de l'app ne touche plus jamais Supabase directement.

### Phase E — Internationalisation (FR/EN/NL/DE) (risque faible, gros travail)
- Externaliser tous les textes dans `i18n/{fr,en,nl,de}.js` + helper `t("clé")`.
- Sélecteur de langue + détection `navigator.language`.
- Prérequis commercial pour le multi-pays.

### Phase F — Build & qualité (optionnel)
- Outil de build léger (esbuild/Vite) : minification, cache-busting.
- Lint (ESLint) + formatage (Prettier) + CI GitHub Actions (lint + tests Phase A).

## 4. Règles de travail (process)

- **Une étape = un commit** clair, déployable seul.
- **Toujours** lancer la suite de tests (Phase A) avant de pousser.
- **Jamais** de refonte « big bang » : on remplace par petits morceaux vérifiables.
- Tout changement de `schema.sql` doit être **ré-exécutable** (`if not exists`,
  `create or replace`) et **non destructif**.

## 5. Ordre recommandé

**A → B** (sécurité immédiate), puis **E** (i18n, valeur produit), puis **C/D**
(confort technique), enfin **F** (industrialisation). Les phases C/D ne sont
utiles que si l'app continue de grossir.
