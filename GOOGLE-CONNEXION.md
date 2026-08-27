# 🔑 Connexion par compte Google — marche à suivre

Le code est en place et **éteint**. Le bouton « Continuer avec Google » n'apparaît
pas tant que l'interrupteur n'est pas allumé, précisément pour qu'il ne s'affiche
jamais avant d'être utilisable.

Ordre à respecter : **Google Cloud → Supabase → l'interrupteur**. Allumer avant
d'avoir configuré ferait échouer chaque clic, pour toutes les familles.

---

## Vérifié : aucun compte à régler au préalable

J'avais d'abord signalé un risque — un parent gmail dont l'adresse n'aurait
jamais été confirmée ne retrouverait pas sa famille en passant par Google.
**Vérification faite, ce risque n'existe pas ici.**

Les cinq comptes `gmail.com` de la base :

| Adresse | État | Familles |
|---|---|---|
| cedric.dierckx@gmail.com | confirmé | 1 |
| cedric.dierckx.pro@gmail.com | confirmé | 1 |
| cedricetanouchka@gmail.com | confirmé | 1 |
| cedric.dierckx.bvba@gmail.com | *supprimé — compte fantôme* | — |
| damienvw@gmail.com | confirmé | 1 |

Le seul compte non confirmé était un compte de l'éditeur, jamais utilisé et
sans aucune famille. Il a été supprimé, avec un second du même genre
(`cedric.dierckx@belnot.be`) : deux comptes fantômes qui gonflaient le total à
12 alors que 10 seulement étaient réels — sur d'aussi petits nombres, cela
faussait la lecture de la traction.

**État vérifié après nettoyage : 10 comptes, 10 familles, 10 membres,
0 adresse non confirmée, aucune identité orpheline.**

Tous les comptes portant une famille sont confirmés, donc Supabase les
rattachera. **Rien à faire avant d'allumer.**

---

## 1. Google Cloud, écran par écran (≈ 25 min, une seule fois)

### Pourquoi on ne trouve pas « URI de redirection »

C'est la confusion la plus fréquente, et elle a une cause simple : **ce champ
n'est pas sur l'écran de consentement**. Google sépare deux objets distincts.

| Objet | Ce qu'il contient | Où |
|---|---|---|
| **L'écran de consentement** (Branding / Audience / Accès aux données) | Le nom de l'app, le logo, les liens légaux, les portées | `console.cloud.google.com/auth` |
| **Le client OAuth** | L'identifiant, le secret, **et les URI de redirection** | `console.cloud.google.com/auth/clients` |

Trois raisons de ne pas voir le champ :

1. vous êtes sur l'écran de consentement — il n'y est pas, par construction ;
2. le client OAuth n'est pas encore créé — il faut le créer d'abord ;
3. le client a été créé avec un **mauvais type d'application**. Le champ
   « URI de redirection autorisés » n'existe **que** pour le type
   **Application Web**. Un client « Application de bureau », « Android » ou
   « iOS » ne l'affiche pas du tout.

> Google a réorganisé cette console : l'ancien menu **API et services →
> Écran de consentement OAuth** s'appelle désormais **Google Auth Platform**,
> et les clients y sont sous **Clients** plutôt que sous **Identifiants**.
> Selon l'ancienneté de votre compte, vous verrez l'une ou l'autre présentation
> — les deux chemins mènent au même endroit, et l'ancienne adresse
> `console.cloud.google.com/apis/credentials` fonctionne toujours.

### 1.1 Le projet

<https://console.cloud.google.com> → sélecteur de projet en haut à gauche →
**Nouveau projet** → nom `FamiTeam` → **Créer**.

Vérifiez ensuite que **le sélecteur affiche bien `FamiTeam`** avant chaque
étape suivante : tout se configure par projet, et se tromper de projet est la
deuxième cause de « je ne retrouve pas ce que j'ai fait ».

### 1.2 L'écran de consentement

Adresse directe : <https://console.cloud.google.com/auth/overview>
(ancien chemin : **API et services → Écran de consentement OAuth**).

À la première visite, Google demande de le configurer :

- **Nom de l'application** : `FamiTeam`
- **E-mail d'assistance utilisateur** : votre adresse
- **Type d'utilisateur / Audience** : **Externe**
- **Coordonnées du développeur** : votre adresse
- **Branding** : logo facultatif ; liens à renseigner —
  - Page d'accueil : `https://fami.team`
  - Règles de confidentialité : `https://fami.team/confidentialite.html`
  - Conditions d'utilisation : `https://fami.team/mentions-legales.html`
- **Domaines autorisés** : `fami.team` puis `famiteam.com`

### 1.3 Les portées (« Accès aux données »)

Page **Accès aux données** → **Ajouter ou supprimer des champs
d'application** → ne cochez que :

```
openid
.../auth/userinfo.email
.../auth/userinfo.profile
```

Ce sont des portées **non sensibles** : aucune vérification Google, aucune
attente. Toute portée sensible (Gmail, Agenda, Drive…) déclencherait un examen
de plusieurs semaines — et nous n'en avons besoin d'aucune.

### 1.4 Publier l'application

Page **Audience** → si le statut indique **Test**, cliquez sur
**Publier l'application** pour passer **En production**.

C'est important : tant que l'app est en **Test**, **seuls les comptes ajoutés
manuellement comme utilisateurs de test** peuvent se connecter. Tous les
autres reçoivent une erreur `access_denied`. Avec des portées non sensibles,
la publication est immédiate et sans vérification.

### 1.5 Le client OAuth — c'est ici qu'est l'URI de redirection

Adresse directe : <https://console.cloud.google.com/auth/clients>
(ancien chemin : **API et services → Identifiants**).

1. **+ Créer un client** (ou **+ Créer des identifiants → ID client OAuth**).
2. **Type d'application** : **Application Web**.
   *C'est ce choix qui fait apparaître les deux champs suivants. Avec tout
   autre type, ils n'existent pas — c'est très probablement ce qui vous est
   arrivé.*
3. **Nom** : `FamiTeam web` (usage interne, invisible des parents).
4. **Origines JavaScript autorisées** → **+ Ajouter un URI**, quatre fois :
   ```
   https://fami.team
   https://www.fami.team
   https://famiteam.com
   https://www.famiteam.com
   ```
   Sans barre oblique finale, sans chemin.
5. **URI de redirection autorisés** → **+ Ajouter un URI**, **une seule** :
   ```
   https://ztraacsqtwslvcjfpdtp.supabase.co/auth/v1/callback
   ```
   Ce n'est pas une adresse de FamiTeam : c'est Supabase qui reçoit la réponse
   de Google, puis renvoie le parent chez nous. Elle doit être copiée au
   caractère près — une barre oblique en trop et Google refuse avec
   `redirect_uri_mismatch`.
6. **Créer**. Une fenêtre affiche l'**ID client** et le **Code secret** :
   copiez les deux. Le secret reste consultable ensuite en rouvrant le client.

> Un délai est normal : Google prévient qu'une modification d'URI peut mettre
> **de quelques minutes à quelques heures** à se propager. Si le premier essai
> échoue avec `redirect_uri_mismatch` alors que tout semble juste, attendez et
> réessayez avant de chercher une erreur ailleurs.

## 2. Supabase (≈ 10 min)

1. Tableau de bord → **Authentication → Providers → Google** : activer, coller
   le Client ID et le Client secret, enregistrer.
2. **Authentication → URL Configuration → Redirect URLs** : vérifier que la liste
   contient bien
   ```
   https://fami.team/**
   https://www.fami.team/**
   https://famiteam.com/**
   https://www.famiteam.com/**
   ```
3. **À contrôler pendant que vous y êtes** : le réglage de liaison automatique
   des identités. C'est lui qui décide si un parent déjà inscrit avec la même
   adresse retrouve sa famille ou repart de zéro. C'est le seul point que je
   n'ai pas pu vérifier depuis ici.

## 3. Allumer

Espace parents → **Admin → Config** → carte **« 🔑 Connexion des parents »**
→ cocher « Proposer la connexion par compte Google ».

Le réglage vit dans `app_config` : il prend effet **sans redéploiement**, et
s'éteint aussi vite s'il y a un souci.

---

## Ce que le code fait déjà pour vous

- **Création de compte incluse.** `apresConnexion()` ne regarde que la session,
  pas le moyen employé : une première connexion Google sans famille arrive sur
  le même écran « créez votre famille » qu'une inscription par e-mail.
- **Garde-fou « je crois avoir perdu mes enfants ».** Une première connexion par
  un fournisseur tiers, sans aucune famille, ne crée rien tout de suite : elle
  affiche un avertissement qui propose de repartir par l'e-mail, et **ferme la
  session Google** si le parent choisit cette porte.
- **La liste d'attente tient.** Quand les inscriptions sont fermées, Google ne
  sert pas de porte dérobée : le même écran le dit et ne propose pas de créer
  une famille.
- **Choix du compte forcé** (`prompt=select_account`) : un parent connecté à
  plusieurs comptes Google n'est pas reconnecté en silence avec le mauvais.
- **App mobile** : Google refuse l'authentification dans une WebView embarquée.
  Le code demande donc l'URL sans rediriger, et l'ouvre dans un onglet Chrome
  personnalisé (plugin `@capacitor/browser`, mécanisme recommandé par Google
  et Supabase pour ce cas précis). Le retour passe par les App Links déjà
  déclarés pour le lien magique ; l'onglet se referme tout seul une fois de
  retour dans l'app (`fermerNavigateurExterne()`, `js/auth.js`).
  ⚠️ Essayé sur un appareil réel une première fois avec `@capacitor/browser`
  absent des dépendances : `ouvrirDehors()` retombait alors sur
  `window.open(url, "_system")`, et la connexion Google ne revenait jamais
  dans l'app — elle restait affichée dans Chrome. Dépendance ajoutée.
  ⚠️ Deuxième essai, dépendance en place cette fois : toujours pas de retour
  dans l'app. Diagnostic par `adb` (`pm path` + `apksigner verify --print-certs`
  sur le `.aab` réellement installé depuis Play Store, sur deux pistes
  distinctes — Interne tests ET Test fermé) : le certificat qui signe l'APK
  livré par Google Play (`CN=Android, OU=Android, O=Google Inc.`, empreinte
  `C0:B6:AA:...:87:F5`) ne correspondait à AUCUNE des deux empreintes déjà
  dans `assetlinks.json` (ni la clé d'upload, ni la clé de signature Play
  « classique » affichée dans Play Console → Beveiligd met Play →
  App-ondertekening). Cause exacte non éclaircie avec certitude — peut-être
  liée à la livraison optimisée par scission (base.apk + splits par langue/
  densité) — mais le correctif est direct : cette troisième empreinte a été
  ajoutée à `assetlinks.json` telle quelle. Si un doute revient un jour,
  refaire ce diagnostic `apksigner` sur l'APK réellement installé plutôt que
  de se fier aux seules empreintes affichées dans Play Console : les deux
  peuvent diverger.
  ⚠️ Troisième essai, cause réelle trouvée : `adb shell pm get-app-links
  team.fami.app` affichait un code numérique (`1024`) pour fami.team ET
  famiteam.com au lieu du mot `verified` — jamais vérifiés, quelle que soit
  la piste ou l'empreinte. Diagnostic confirmé en interrogeant directement
  l'API Google `digitalassetlinks.googleapis.com/v1/statements:list` (celle
  qu'Android utilise en interne) : `fami.team` est parfaitement valide, mais
  `famiteam.com` échoue avec `ERROR_CODE_REDIRECT` — ce domaine redirige
  entièrement vers fami.team (y compris `/.well-known/assetlinks.json`
  lui-même), et Google refuse par sécurité de suivre une redirection lors de
  cette vérification précise. Les deux domaines étant déclarés dans le même
  `<intent-filter android:autoVerify="true">`, l'échec de famiteam.com
  empêchait fami.team d'être marqué "verified" à son tour. **Correctif** :
  famiteam.com retiré du manifeste (`AndroidManifest.xml`) — aucun lien
  généré par l'app ne pointe vers ce domaine (`HOTE_PUBLIC = fami.team`,
  `js/auth.js`), il n'a donc rien à faire dans ce bloc. Confirmé en local en
  forçant l'état de vérification (`adb shell pm set-app-links --package
  team.fami.app 1 all`) : une fois "verified", le lien revient bien dans
  l'app — la mécanique de code était donc déjà correcte, seule la
  vérification de domaine bloquait.
  ✅ **Confirmé en conditions réelles** : nouvelle release (versionCode 375)
  publiée sur Test fermé, app désinstallée puis réinstallée depuis Play
  Store (donc sans le forçage `adb` manuel), connexion Google testée avec
  succès — retour dans l'app. Le problème est clos.

## Ce qui a été mis à jour côté conformité

- `REGISTRE-TRAITEMENTS.md` — traitement « Compte parent » : Google Ireland Ltd
  ajouté comme destinataire, **uniquement si le parent choisit ce moyen**.
- `confidentialite.html` — Google ajouté aux sous-traitants, avec ce qu'il
  reçoit (adresse e-mail et identifiant de compte) et ce qu'il ne reçoit pas
  (rien sur les enfants), et le rappel que la connexion par e-mail reste
  disponible et équivalente.

## Un point qui n'en est pas un

La règle **App Store 4.8** n'impose « Se connecter avec Apple » que si la
connexion par un tiers est la **seule** option proposée. FamiTeam garde l'e-mail
et le lien magique : rien à ajouter pour publier sur iOS.
