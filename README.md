# 🌟 KidsPositifs

Un programme **évolutif et ludique** pour aider les enfants de **2 à 7 ans** à
adopter des comportements positifs — et à se détourner des négatifs — dans
l'esprit de la **parentalité positive et bienveillante**.

C'est une petite application web qui fonctionne dans le navigateur (tablette,
téléphone ou ordinateur). Chaque famille a son **compte** : on se connecte par
**e-mail**, les données sont **synchronisées en temps réel** entre tous les
appareils, et un cache local assure le fonctionnement même **hors-ligne**.

## 🔐 Comptes, familles & synchronisation (Supabase)

L'authentification et la base de données reposent sur **Supabase** :

- **Connexion par e-mail** : lien magique (sans mot de passe) **ou** e-mail +
  mot de passe, au choix.
- **Multi-familles** : un compte peut appartenir à plusieurs familles ; chaque
  famille a ses propres enfants, points, avatars et écosystèmes.
- **Lien d'invitation** : depuis l'espace parents, on génère un lien à envoyer
  à l'autre parent ; en l'ouvrant (après connexion), il rejoint la famille.
- **Lien de parrainage** 🎁 : chaque famille peut **parrainer 3 familles amies
  par semaine** (illimité pour le compte administrateur). L'ami qui ouvre le lien
  crée **sa propre famille** ; le parrainage est tracé (table `referrals`). Le
  concept est présenté de façon attractive sur la page d'accueil publique.
- **Sécurité** : chaque famille n'est accessible qu'à ses membres (règles RLS).
- **Abonnement** : le modèle de données prévoit déjà un `plan` par famille
  (`free` / `premium`) pour brancher **Stripe** plus tard, sans refonte.

### Mise en place (une seule fois)

1. Crée un projet sur [supabase.com](https://supabase.com) (offre gratuite).
2. Dans **SQL Editor**, colle et exécute le contenu de `supabase/schema.sql`
   (tables, RLS, fonctions, invitations, temps réel).
3. Dans **Project Settings → API**, copie *Project URL* et la clé *anon public*,
   et renseigne-les dans `js/config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
   Ces valeurs sont publiques par conception (la sécurité est assurée par RLS).
4. Dans **Authentication → URL Configuration**, ajoute l'URL du site
   (https://kids-positifs.vercel.app/) aux *Redirect URLs* (pour les liens
   magiques), puis déploie.

Tant que `js/config.js` n'est pas renseigné, l'appli affiche un écran de
configuration expliquant la marche à suivre.

## ▶️ Lancer l'application

Ouvre simplement le fichier `index.html` dans un navigateur.

Pour une utilisation sur tablette, tu peux aussi servir le dossier localement :

```bash
cd KidsPositifs
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

Astuce : sur smartphone/tablette, « Ajouter à l'écran d'accueil » crée une icône
comme une vraie application.

## 👨‍👩‍👧‍👦 Les enfants

Quatre profils sont pré-configurés (nés en 2018, 2019, 2021, 2023). Dans
l'onglet **⚙️ Parents**, tu peux modifier le prénom, la **date de naissance
complète**, le **sexe** (👧 fille / 👦 garçon), l'emoji et la couleur de chacun.
Les missions proposées **s'adaptent automatiquement à l'âge** (calculé à partir
de la date de naissance), et l'avatar de base est proposé selon le sexe.

## 🎮 Comment ça marche (la gamification)

Deux catégories, deux monnaies, deux récompenses qui **évoluent dans le temps** :

| Catégorie | Monnaie | Récompense évolutive |
|-----------|---------|----------------------|
| 🏡 **Famille** (entraide, mettre/débarrasser la table, manger proprement, ranger sa chambre, dire merci…) | 💛 Cœurs | **Avatar vectoriel personnalisable** : peau, coiffure, couleur de cheveux, yeux, lunettes, chapeau, accessoire, compagnon, décor |
| 🌍 **Planète** (éteindre la lumière, fermer le robinet, ne pas gaspiller, trier, arroser…) | 💧 Gouttes | **Écosystème éducatif** : l'enfant dépense ses Gouttes pour bâtir une **chaîne alimentaire** |

Chaque mission validée déclenche encouragements et confettis. Des **badges**
récompensent les efforts dans la durée.

### 🌍 L'écosystème éducatif (chaîne alimentaire)

Côté Planète, chaque être vivant est une **carte** 🃏 (plus de **40 espèces** :
plantes 🌱, herbivores 🐰, carnivores 🦊). Pour créer une espèce, il faut :

1. réunir ses **prérequis** — d'autres êtres vivants précis, en quantité (la
   carte les affiche avec ✓ quand c'est bon) ;
2. payer son **coût** en Gouttes 💧.

Les prérequis enseignent les **vraies dépendances** de la chaîne alimentaire.
Par exemple :

- un 🐒 **Singe** réclame **10 arbres** 🌳 et **1 bananier** 🍌 ;
- un 🦁 **Lion** réclame **5 gazelles** 🦌, **1 autruche** 🦤 et **1 phacochère** 🐗.

L'ordre nature (plantes → herbivores → carnivores) découle automatiquement des
prérequis. Toute la configuration (espèces, emojis, coûts, prérequis) se règle
dans `TIERS_ECO` (`js/data.js`) : `prereq: { especeId: quantité }`.

## 🌈 L'esprit bienveillant

Le système est volontairement conçu pour rester **bienveillant** :

- **On valorise l'effort et la coopération**, jamais la performance.
- **On ne retire jamais de points** : pas de punition par les points.
- Face à un comportement négatif, on propose un **« défi réparation »**
  (s'excuser, réparer, aider…) qui apporte même un petit bonus — l'enfant
  apprend à réparer plutôt qu'à être puni.
- Chaque enfant a **son propre avatar et son propre écosystème** : on encourage
  le progrès personnel plutôt que la compétition entre frères et sœurs.

## 👪 Mode parents

L'onglet **⚙️ Parents** est verrouillé par défaut. En l'activant (avec un
**code parent** facultatif), on accède à :

- **Validation des actions** : si l'option « validation parentale requise » est
  activée, chaque action d'un enfant attend la **confirmation d'un parent** avant
  de créditer les points (une pastille indique le nombre d'actions en attente).
- **Code PIN** : on peut protéger l'accès au mode parents par un code PIN.
- **Ajustement manuel** des Cœurs 💛 et Gouttes 💧 (boutons −/+ ou saisie directe).
- **Correction rétroactive** : choisir une date et ajouter/retirer des missions
  validées ce jour-là ; les soldes sont recalculés automatiquement.
- **Gestion des badges** : retirer un badge (il ne sera pas ré-attribué),
  réautoriser les badges retirés, ou tout effacer.
- **Missions du jour** : pour chaque enfant et chaque date, cocher les missions
  à proposer. Par défaut, une **sélection pertinente selon l'âge** (les plus
  prioritaires, ~8 par catégorie) est proposée ; les parents l'ajustent ensuite.
- **Heure du coucher** : réglable par enfant. La page d'accueil affiche un
  bandeau « dodo » dont l'**ambiance change selon l'heure** (☀️ jour → 🌇 bientôt
  l'heure → 🌙 nuit étoilée), avec la mission « aller au lit à l'heure ».
- **Gestion des enfants** : ajouter un enfant (➕) ou en supprimer un à tout
  moment. À la **création d'une famille**, on choisit directement le **nombre
  d'enfants** souhaité.
- Modification des profils, réglages de synchro et données.

### 🛡️ Compte administrateur

Un compte **administrateur** (table `app_admins`) peut **lister toutes les
familles** et **naviguer entre elles** depuis l'onglet Parents → Administration
(la famille actuellement ouverte est mise en évidence ✅), et basculer leur plan.

### 💾 Pérennité des données

La version est désormais **officielle**. L'état de chaque famille est stocké en
JSON (`family_state.data`) et porté par une **version de schéma** (`ETAT_VERSION`).
Toutes les migrations de la fonction `normaliser()` sont **strictement additives**
(on n'efface jamais de données existantes), de sorte qu'une future mise à jour de
l'application **ne fait jamais perdre la progression** d'une famille. La synchro
résout les conflits via l'horodatage `maj` (la version la plus récente gagne).

> **Correction d'erreur** : un 1ᵉʳ clic sur une mission la valide ; un 2ᵉ clic
> l'annule et **retire les points** correspondants (ou annule la demande en
> attente). Vaut pour toutes les missions (quotidiennes comme ponctuelles).

> **Animation de badge** : l'obtention d'un nouveau badge déclenche une
> animation festive (badge qui surgit + confettis).

> **Mode démo** : depuis l'écran de connexion, « 🧪 Découvrir en démo » ouvre une
> famille de démonstration pré-remplie, entièrement hors-ligne (rien n'est
> enregistré en ligne) — idéal pour tester sans créer de compte.

> L'avatar et l'emoji de chaque enfant **suivent automatiquement le sexe** (et
> l'âge pour les tout-petits), tant qu'ils n'ont pas été personnalisés.

## 📁 Structure

```
index.html           Page de l'application
css/style.css        Styles (interface tactile, lisible par de jeunes enfants)
js/config.js         Clés Supabase (URL + clé anon) — à renseigner
js/data.js           Configuration : enfants, catégories, missions, récompenses
js/avatar.js         Rendu vectoriel (SVG) des avatars, parfaitement alignés
js/app.js            Logique de jeu : état, calcul d'âge, actions, badges
js/ui.js             Rendu des différents écrans de l'application
js/auth.js           Comptes, familles, invitations, synchro Supabase, démarrage
supabase/schema.sql  Schéma de la base (tables, RLS, fonctions, invitations)
vercel.json          Configuration du déploiement Vercel
```

## 🔧 Personnaliser

Tout se règle dans `js/data.js` :
- **Ajouter une mission** : ajoute un objet dans `MISSIONS` (catégorie, emoji,
  titre, âge minimum, points, type `quotidien`/`ponctuel`).
- **Ajouter un élément d'avatar** : complète `AVATAR_OPTIONS`.
- **Ajouter une espèce** : complète `TIERS_ECO` (emoji, nom, `cout`, et
  `prereq: { especeId: quantité }`).

Dans l'onglet Parents, tu peux **changer de code famille**, **exporter** une
sauvegarde JSON ou **tout réinitialiser**.

> L'âge se calcule automatiquement à partir de la date de naissance, il n'y a
> rien à mettre à jour au fil des années.
