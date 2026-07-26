# 🛡️ Plan — Espace Admin v2

> ✅ **Statut : terminé** (lots A→G tous livrés sur `dev`). Conservé pour
> mémoire et pour la traçabilité des décisions (modèle Claude par lot, §9).
> Nouveaux chantiers : voir `COORDINATION.md`.

Document de travail (branche `dev`). Objectif : faire de l'onglet **Admin** de
l'espace parents un véritable **tableau de bord d'administration** de FamiTeam,
sans jamais mettre en péril les données des familles existantes.

## 0. État des lieux

L'accès est déjà conforme à l'exigence : l'onglet Admin n'apparaît que si
`is_admin()` est vrai (table `app_admins`, vérifiée côté base par RLS et dans
chaque RPC `admin_*`). Il est accessible depuis l'espace parents.

Existant dans l'onglet :
- liste des familles (plan free/premium, blocage, suppression, early adopters) ;
- liste d'attente (waitlist) avec approbation par lien de parrainage ;
- test d'envoi d'e-mail (send-mail / SMTP) ;
- configuration des dons Stripe ;
- gestion des blagues (4 langues) ;
- tableau de bord « science ».

Manques constatés :
- **aucune statistique** d'utilisation, de croissance ou d'activité ;
- les **retours utilisateurs** (table `feedback` + RPC `admin_list_feedback`)
  sont collectés **mais jamais affichés** — l'admin ne les voit pas ;
- aucune visibilité sur le **stockage** (base de données) ni l'**activité web** ;
- aucun outil d'**export/sauvegarde globale** ni de **guide de migration**.

## 1. Invariants de sûreté (aucune perte de données)

1. Tout changement de `schema.sql` est **additif et ré-exécutable**
   (`create table if not exists`, `create or replace function`,
   `add column if not exists`). **Jamais** de `drop` sur une table existante.
2. **Aucune modification** des chemins d'écriture de `family_state`
   (garde-fous `Store.ecritureAutorisee()` intouchés).
3. Les nouvelles RPC admin sont en **lecture seule** sur les données familles ;
   chacune commence par `if not is_admin() then raise exception`.
4. Suite de tests (`node test/run.js`, 72 tests) exécutée **avant chaque push** ;
   nouveaux tests ajoutés pour chaque lot.
5. Travail sur **`dev`** uniquement ; fusion dans `main` (= production Vercel)
   seulement après validation manuelle.
6. Avant toute exécution du SQL sur le projet Supabase de production :
   sauvegarde préalable (`supabase db dump` ou export Dashboard).

## 2. Lot A — Réorganisation de l'onglet en sous-sections

L'onglet Admin devient une navigation interne à 6 sous-sections :

| Sous-section | Contenu |
|---|---|
| 📊 Stats | chiffres clés, évolution, nouveaux membres (lots B/C) |
| 👨‍👩‍👧 Familles | liste actuelle des familles + waitlist (existant, déplacé) |
| 💬 Retours | bugs & suggestions des utilisateurs (lot D) |
| 🃏 Contenu | blagues + tableau « science » (existant, déplacé) |
| ⚙️ Config | test e-mail + liens Stripe (existant, déplacé) |
| 🛠️ Système | stockage, export, migration (lots E/F) |

Pur déplacement d'interface, **risque nul** pour les données.

## 3. Lot B — Statistiques d'utilisation & évolution générale

Nouvelles RPC (security definer, garde `is_admin()`) :

- `admin_stats()` → une ligne d'agrégats : familles totales, nouvelles
  familles (7 j / 30 j), membres totaux, enfants totaux (comptés dans
  `family_state.data->'enfants'`), familles actives (1 j / 7 j / 30 j via
  `family_state.updated_at`), répartition free/premium, parrainages acceptés,
  taille de la waitlist, nombre de retours non traités.
- `admin_series_inscriptions()` → inscriptions par semaine
  (`families.created_at`, 26 dernières semaines).
- `admin_series_activite()` → familles actives par semaine (déduites de
  `family_state_history.saved_at` — données déjà présentes, rien à collecter).
- `admin_list_families_recent(p_limit)` → derniers arrivés (nom, e-mail
  du propriétaire, date de création) — **nouvelle** RPC pour ne pas modifier
  la signature de `admin_list_families` existante.

Rendu : cartes de chiffres clés + mini-graphiques **SVG vanilla** (barres /
sparklines), cohérent avec le reste du code (aucune bibliothèque externe).

## 4. Lot C — Activité web (mesure côté application)

Une app statique ne « voit » pas les logs du serveur ; on mesure donc côté
client, sobrement :

- table additive `usage_events(day date, family_id uuid, kind text, count int)`
  avec clé `(day, family_id, kind)` ;
- un **ping quotidien** par famille à l'ouverture (1 upsert/jour, `kind='open'`),
  RLS : insert/update par les membres de la famille, select réservé admin ;
- donne les familles actives jour/semaine/mois **réelles** et la tendance.

Complément externe (sans code) : activer **Vercel Web Analytics** dans le
dashboard Vercel pour les visites anonymes de la page publique. La sous-section
Système affichera des liens directs vers les dashboards Vercel et Supabase.

## 5. Lot D — Retours utilisateurs & suggestions

- Affichage enfin de `admin_list_feedback()` : liste triée (récent d'abord),
  filtre bug / suggestion, e-mail de l'auteur, contexte.
- Colonne additive `status` (`nouveau` / `lu` / `traité`) sur `feedback`
  + RPC `admin_set_feedback_status(p_id, p_status)`.
- Badge « n non lus » sur la sous-section 💬 Retours.
- Bouton « répondre » : ouvre un brouillon via la fonction send-mail
  (même chemin que les invitations) prérempli avec le message d'origine.

## 6. Lot E — Stockage & réseau

- RPC `admin_db_stats()` : taille totale de la base (`pg_database_size`),
  taille et nombre de lignes **par table** (`pg_total_relation_size`),
  affichées dans 🛠️ Système. Faisabilité élevée (~90 %) — fonctions standard
  PostgreSQL accessibles en security definer.
- **Limite honnête** : la bande passante Vercel et l'egress Supabase ne sont
  pas exposés à une application cliente sans jeton de management. Première
  étape : afficher les tailles BDD + liens directs vers les deux dashboards.
  Étape optionnelle ultérieure : edge function `admin-metrics` appelant la
  Supabase Management API avec un jeton stocké en secret (faisabilité ~70 %,
  à confirmer).

## 7. Lot F — Export global & guide de migration

- **`MIGRATION.md`** (à la racine) : guide pas-à-pas pour déplacer FamiTeam
  vers d'autres serveurs, quel que soit l'hébergeur cible :
  1. cloner le dépôt (`git clone`) ou télécharger l'archive GitHub ;
  2. créer le nouveau projet Supabase (ou instance auto-hébergée) et exécuter
     `supabase/schema.sql` (idempotent) ;
  3. **transférer les données** : `pg_dump`/`supabase db dump` depuis l'ancien
     projet, restauration sur le nouveau, **vérification des comptages**
     (familles, membres, états, historique) avant toute bascule ;
  4. déployer les edge functions (`send-mail`, `delete-account`) + secrets SMTP ;
  5. installer les templates e-mail (`supabase/email-templates/`) ;
  6. renseigner `js/config.js` (URL + clé anon du nouveau projet) ;
  7. déployer le front sur l'hébergeur statique choisi (Vercel, Netlify,
     nginx…) ; configurer les Redirect URLs d'authentification ;
  8. basculer le DNS `famiteam.com` en dernier, après validation complète.
- Bouton **« Sauvegarde complète (JSON) »** dans 🛠️ Système : RPC
  `admin_export_all()` retournant familles, membres (e-mails), états de jeu,
  historique récent, config, feedback, referrals — téléchargé en un fichier
  JSON daté. Filet indépendant de `pg_dump`, utilisable pour vérification
  croisée après migration.
- Bouton **« Télécharger le code »** : lien vers l'archive ZIP GitHub du
  dépôt (nécessite d'être connecté à GitHub, dépôt privé) + rappel de la
  commande `git clone` dans MIGRATION.md.

## 8. Lot G — i18n & tests

- Toutes les nouvelles chaînes en **FR/EN/NL/DE** dans `js/i18n.js`.
- Tests ajoutés : agrégation des stats sur données factices, rendu des
  sous-sections, refus des RPC admin sans droit (simulation), non-régression
  complète.

## 9. Ordre des commits & modèle IA recommandé

Objectif d'efficacité : réserver les modèles coûteux aux étapes où une erreur
coûte cher (SQL, RLS, données), utiliser les modèles économiques pour le
mécanique (traductions, documentation).

| # | Commit | Modèle conseillé | Effort |
|---|---|---|---|
| 1 | Ce plan | Sonnet 5 | moyen |
| 2 | Lot A — sous-sections admin (UI pure) | Sonnet 5 | moyen |
| 3 | Lot B — SQL : RPC stats + séries | **Opus 4.8** | élevé (sécurité RLS) |
| 4 | Lot B — UI : cartes + graphiques SVG | Sonnet 5 | moyen |
| 5 | Lot C — table `usage_events` + ping | **Opus 4.8** | élevé (nouveau chemin d'écriture) |
| 6 | Lot D — UI retours + statut | Sonnet 5 | moyen |
| 7 | Lot E — `admin_db_stats` + Système | Sonnet 5 | moyen |
| 8 | Lot F — MIGRATION.md | Sonnet 5 | moyen |
| 9 | Lot F — `admin_export_all` + boutons | **Opus 4.8** | élevé (export intégral) |
| 10 | Lot G — i18n EN/NL/DE | Haiku 4.5 | faible (mécanique) |
| 11 | Lot G — tests | Sonnet 5 | moyen |

Ordre recommandé : A → B → D (valeur immédiate), puis C → E → F, enfin G.
Chaque commit est livrable et réversible individuellement.
