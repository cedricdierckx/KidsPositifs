# 🚚 FamiTeam — Guide de migration

Ce document explique comment déplacer **l'intégralité de FamiTeam** vers
d'autres serveurs (autre projet Supabase, autre hébergeur statique), **sans
perdre aucune donnée** des familles existantes.

> **Priorité absolue : la sûreté des données.** On ne bascule le DNS de
> production qu'**en dernier**, après avoir vérifié que tout fonctionne sur la
> nouvelle infrastructure.

## 0. Vue d'ensemble

FamiTeam a deux composants :

| Composant | Rôle | Où le migrer |
|---|---|---|
| **Front statique** (`index.html`, `js/`, `css/`) | l'application dans le navigateur | n'importe quel hébergeur statique (Vercel, Netlify, Cloudflare Pages, nginx…) |
| **Supabase** (base PostgreSQL + Auth + Edge Functions) | comptes, données, e-mails | nouveau projet Supabase **ou** instance auto-hébergée |

La **source de vérité** est la base Supabase (table `family_state`). Le front
est sans état : il se contente de lire `js/config.js`.

---

## 1. Récupérer le code

**Option A — cloner le dépôt (recommandé) :**

```bash
git clone https://github.com/cedricdierckx/kidspositifs.git famiteam
cd famiteam
```

**Option B — archive ZIP :** depuis l'espace Admin → 🛠️ Système →
« Télécharger le code (ZIP) », ou directement sur GitHub (bouton *Code →
Download ZIP*). Le dépôt étant privé, une connexion GitHub autorisée est
requise.

---

## 2. Créer le nouveau projet Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (ou démarrer une
   instance auto-hébergée).
2. Dans **SQL Editor**, coller et exécuter **tout** `supabase/schema.sql`.
   Le script est **idempotent** (`create ... if not exists`,
   `create or replace`) : il crée tables, RLS, fonctions, déclencheurs et
   l'historique automatique, sans rien détruire.
3. Renseigner la table `app_admins` avec votre e-mail administrateur
   (le script insère déjà un e-mail par défaut ; adaptez-le).

---

## 3. Transférer les données (étape critique)

> Faites-le **avant** de basculer les utilisateurs. Vérifiez les comptages à
> chaque étape.

### 3.a Sauvegarde de l'ancienne base

```bash
# Dump complet de l'ancien projet (schéma + données)
supabase db dump --db-url "postgresql://…ANCIEN…" -f famiteam-old.sql
# ou, table par table pour les données applicatives uniquement :
pg_dump "postgresql://…ANCIEN…" \
  -t public.families -t public.family_members \
  -t public.family_state -t public.family_state_history \
  -t public.invites -t public.referrals -t public.waitlist \
  -t public.feedback -t public.app_config -t public.usage_events \
  --data-only --column-inserts -f famiteam-data.sql
```

En complément (filet de sécurité indépendant), l'espace Admin → 🛠️ Système →
« **Sauvegarde complète (JSON)** » télécharge toutes les données applicatives
en un fichier JSON daté, utile pour **vérification croisée**.

### 3.b Migrer les comptes d'authentification

Les familles référencent `auth.users`. Deux cas :

- **Même organisation Supabase** : utilisez la fonctionnalité de migration
  d'utilisateurs de Supabase, ou l'API Admin Auth pour recréer les utilisateurs
  en conservant leurs `id` (indispensable : `families.owner_id` et
  `family_members.user_id` pointent vers ces `id`).
- **Auto-hébergé** : exportez/importez la table `auth.users` (au minimum `id`,
  `email`, et les identifiants de connexion) selon la documentation Supabase.

> ⚠️ Les `id` des utilisateurs **doivent être préservés**, sinon le lien
> famille ↔ propriétaire ↔ membres est rompu.

### 3.c Restaurer les données applicatives

```bash
psql "postgresql://…NOUVEAU…" -f famiteam-data.sql
```

### 3.d Vérifier les comptages (obligatoire)

Comparez l'ancien et le nouveau projet :

```sql
select
  (select count(*) from families)              as familles,
  (select count(*) from family_members)        as membres,
  (select count(*) from family_state)          as etats,
  (select count(*) from family_state_history)  as historique,
  (select count(*) from referrals)             as parrainages,
  (select count(*) from feedback)              as retours;
```

Les nombres doivent être **identiques**. En cas d'écart, **ne pas basculer** :
diagnostiquer d'abord.

---

## 4. Déployer les Edge Functions

Les fonctions vivent dans `supabase/functions/` (`send-mail`,
`delete-account`, `stripe-webhook`).

```bash
supabase functions deploy send-mail
supabase functions deploy delete-account
# stripe-webhook reçoit des appels de Stripe (pas de jeton Supabase) :
# la vérification JWT doit être désactivée pour CETTE fonction précise.
supabase functions deploy stripe-webhook --no-verify-jwt
```

Reconfigurer les **secrets** (SMTP notamment) sur le nouveau projet :

```bash
supabase secrets set SMTP_HOST=… SMTP_USER=… SMTP_PASS=… SMTP_FROM=…
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_…
```

Puis, dans le nouveau compte Stripe (ou le même si inchangé) → **Developers →
Webhooks → Add endpoint**, renseigner l'URL de `stripe-webhook` et sélectionner
les événements `checkout.session.completed` et `invoice.paid`.

Installer les **modèles d'e-mail** (`supabase/email-templates/`) dans
**Authentication → Email Templates** (confirmation, lien magique, réinitialisation).

---

## 5. Configurer et déployer le front

1. Renseigner `js/config.js` avec l'**URL** et la **clé anon** du nouveau
   projet Supabase (valeurs publiques par conception ; la sécurité est assurée
   par RLS).
2. Déployer les fichiers statiques chez l'hébergeur choisi :
   - **Vercel/Netlify/Cloudflare Pages** : connecter le dépôt, aucun build
     requis (site statique). `vercel.json` fournit déjà les en-têtes de cache.
   - **nginx/Apache** : copier `index.html`, `js/`, `css/` dans la racine web.
3. Dans **Supabase → Authentication → URL Configuration**, ajouter les URL du
   nouveau site aux **Redirect URLs** (indispensable pour les liens magiques).

---

## 6. Recette avant bascule

Sur la nouvelle URL (avant de toucher au DNS de production) :

- [ ] connexion par e-mail (lien magique **et** mot de passe) ;
- [ ] une famille existante voit bien ses enfants, points et écosystème ;
- [ ] une modification est **synchronisée** (rechargement sur un autre appareil) ;
- [ ] l'espace Admin s'affiche pour un administrateur et les statistiques se
      chargent ;
- [ ] l'historique (`family_state_history`) est présent (filet anti-perte) ;
- [ ] un envoi d'e-mail de test (Admin → Config) fonctionne.

---

## 7. Basculer le domaine (en dernier)

Une fois la recette **entièrement validée** :

1. Pointer `famiteam.com` vers le nouvel hébergeur (DNS).
2. Vérifier les Redirect URLs d'authentification pour le domaine définitif.
3. Surveiller les premières connexions réelles.
4. Conserver l'ancienne infrastructure **en lecture** quelques jours, le temps
   de confirmer que tout est stable, avant de la décommissionner.

---

## Annexe — Inventaire des données

| Table | Contenu | Sensibilité |
|---|---|---|
| `families` | familles, plan d'abonnement | moyenne |
| `family_members` | liens utilisateur ↔ famille | moyenne |
| `family_state` | **état de jeu** (enfants, points, écosystème) — le cœur | **haute** |
| `family_state_history` | 40 instantanés/famille (anti-perte) | **haute** |
| `invites` / `referrals` | invitations & parrainages (`referrals.via_code` = code permanent utilisé) | faible |
| `waitlist` | e-mails en liste d'attente | moyenne |
| `feedback` | bugs & suggestions | faible |
| `app_config` | réglages globaux (liens Stripe, blagues…) | faible |
| `usage_events` | activité (ouvertures) agrégée | faible |
| `donations` | dons reçus (Stripe), alimentée par le webhook | moyenne |

Trois colonnes ont été ajoutées à `families` par « L'Arbre des familles » :
`referral_code` (code de parrainage permanent, index unique partiel),
`classement_optin` et `classement_pseudo`. **`classement_optin` matérialise un
consentement RGPD** : une restauration qui le remettrait à `true` par erreur
publierait un nom d'équipe sans accord. En cas de restauration partielle, cette
colonne doit être remise à `false` si le doute existe — la famille peut se
réinscrire en un clic, l'inverse n'est pas réparable.
| `auth.users` | comptes (géré par Supabase) | **haute** |

Toute migration doit préserver en priorité `family_state`,
`family_state_history` et `auth.users`, ainsi que la **cohérence de leurs
identifiants**.
