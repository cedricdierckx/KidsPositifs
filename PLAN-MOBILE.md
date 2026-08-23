# 📱 Plan — Applications Android & iOS (Capacitor)

> 🚧 **Statut : terrain préparé.** La coquille native (Capacitor) est en
> place et se synchronise avec le code du site. Ce qui reste dépend de
> comptes/actifs que seule l'équipe FamiTeam peut fournir (voir §4).

Objectif : publier FamiTeam sur Google Play et l'App Store **sans jamais
risquer le site web existant**, en réutilisant tel quel le code de
`index.html` / `css/` / `js/`.

## 0. Architecture retenue (« option A »)

L'app embarque une **copie figée** du site (`npm run cap:sync`), pas une
fenêtre ouverte en permanence sur `fami.team`. Conséquence assumée : une
correction sur le site n'apparaît dans l'app qu'après une nouvelle
publication sur les stores — en échange, l'app fonctionne hors ligne et ne
soulève aucune question de conformité (Apple, règle 4.2) liée aux
applications qui ne font que réafficher un site web.

## 1. Déjà en place

- **Capacitor** installé et configuré (`capacitor.config.json` : appId
  `team.fami.app`, nom « FamiTeam »).
- `scripts/sync-www.mjs` (`npm run cap:sync`) : copie le site dans `www/`
  (généré, jamais commité) avant d'alimenter les projets natifs.
- `android/` : projet Gradle complet, prêt pour Android Studio.
- `ios/` : projet Xcode complet (Swift Package Manager, sans CocoaPods),
  prêt à ouvrir — mais uniquement compilable sur un Mac.
- **Détection d'environnement** (`js/auth.js`) : `estAppNative()` /
  `estProduction()` traitent correctement l'app installée comme la
  production (elle n'a pas de « déploiement de préaperçu »).
- **Retour des e-mails d'authentification** (lien magique, inscription,
  mot de passe oublié) : `urlRetourAuth()` renvoie vers `HOTE_PUBLIC`
  (`https://fami.team`) dans l'app, au lieu d'une adresse locale inutilisable.
- **Réception du lien dans l'app** (`initDeepLinkAuth()`, plugin
  `@capacitor/app`) : quand l'app est ouverte via ce lien, les jetons de
  session sont extraits et appliqués (`sb.auth.setSession`) — sans cette
  étape, cliquer le lien depuis l'app n'aurait eu aucun effet.
- **App Links Android** déclarés (`AndroidManifest.xml`, `autoVerify`) pour
  `fami.team` et `famiteam.com`.
- **Détection de conflit de synchro** (`js/store.js`) : deux appareils hors
  ligne qui modifient l'état en même temps ne s'écrasent plus en silence
  (voir commit dédié) — pertinent ici car les coupures prolongées
  deviennent courantes sur mobile.
- **Bibliothèque Supabase embarquée** (`js/vendor/supabase.js`) : elle venait
  d'un CDN, ce qui contredisait le hors-ligne annoncé au §0 — sans réseau, le
  script n'arrivait pas, la variable `supabase` restait indéfinie et l'app
  affichait « Configuration requise » au lieu de travailler sur son cache.
  Elle est désormais dans le dépôt, recopiée depuis `node_modules` par
  `npm run vendor:supabase` (à relancer après chaque montée de version).
- **Envoi vers l'agenda depuis l'app** (`js/ui.js`, `envoyerVersAgenda`) :
  la WebView ignore l'attribut `download` d'un lien, sans erreur — les deux
  boutons « agenda » (carte surprise et rendez-vous du soir) ne faisaient donc
  plus rien une fois l'app installée. Dans l'app, le `.ics` est écrit dans le
  cache (`@capacitor/filesystem`) puis ouvert par l'appareil
  (`@capacitor-community/file-opener`), qui propose l'import dans l'agenda ;
  si aucune application ne sait ouvrir un `.ics`, la feuille de partage
  (`@capacitor/share`) prend le relais. Sur le web, rien ne change.
  ⚠️ Ces trois greffons sont nouveaux : le prochain build doit passer par
  `npm install` puis `npm run cap:sync` (Gradle resynchronise tout seul).
- **Écran de démarrage web** (`js/demarrage.js`, `index.html`) : l'app attend
  la session Supabase avant de peindre son premier écran ; le `<body>` étant
  vide jusque-là, l'app installée affichait une page blanche de plusieurs
  secondes sur un réseau de téléphone. Un décor animé (étoile, ballons,
  petites phrases) prend maintenant ce temps-là, aux couleurs de l'écran de
  démarrage natif, et prévient si le réseau traîne.
- **Icône et écran de démarrage** (Android + iOS) : une étoile blanche sur
  le dégradé doré déjà utilisé pour les récompenses dans l'app — fidèle à
  l'identité existante, sans en inventer une nouvelle. Régénérable avec
  `npm run icon:generer`. Reste un « bon repli visuel », pas un vrai logo
  dessiné par un graphiste (voir §4, point 1 — non bloquant).

## 1 bis. Première installation sur un PC Windows, sans rien supposer

> **Avant de commencer : en avez-vous besoin ?** Pour vérifier un correctif,
> non — le site `fami.team` est toujours à jour, y compris sur le téléphone.
> Ce qui suit ne sert qu'à reconstruire l'**app installée**.

### A. Les trois programmes à installer (une seule fois)

| Programme | Où | Comment |
|---|---|---|
| **Node.js** | nodejs.org | Version **LTS**, puis Suivant → Suivant → Installer |
| **Git** | git-scm.com | Suivant partout, sans rien changer |
| **Android Studio** | developer.android.com/studio | ~1 Go. Au premier lancement, accepter l'installation du SDK proposée |

Pour vérifier que c'est en place : ouvrir **PowerShell** (touche Windows, taper
`powershell`, Entrée) et taper, une ligne à la fois :

```
node --version
git --version
```

Chaque commande doit répondre un numéro de version. Si l'une répond
« n'est pas reconnu », c'est que ce programme-là n'est pas installé, ou qu'il
faut fermer et rouvrir PowerShell.

### B. Récupérer le code (une seule fois)

Toujours dans PowerShell :

```
cd $HOME\Documents
git clone https://github.com/cedricdierckx/KidsPositifs.git
cd KidsPositifs
npm install
```

La dernière ligne prend quelques minutes.

### C. Préparer le téléphone (une seule fois)

1. **Paramètres → À propos du téléphone**
2. Appuyer **sept fois** sur **Numéro de build**. Un message annonce que vous
   êtes développeur.
3. **Paramètres → Système → Options pour les développeurs** → activer
   **Débogage USB**.
4. Brancher le téléphone au PC. Une fenêtre demande d'autoriser le débogage :
   **Autoriser**.

### D. Mettre à jour l'app (à refaire à chaque fois)

Téléphone branché, dans PowerShell :

```
cd $HOME\Documents\KidsPositifs
npm run android:maj
```

C'est tout. L'app se réinstalle par-dessus l'ancienne, **les données sont
conservées**.

### Si ça coince

| Message | Ce que ça veut dire |
|---|---|
| `npm n'est pas reconnu` | Node.js absent, ou PowerShell à rouvrir |
| `No target devices found` | Téléphone débranché, débogage USB éteint, ou autorisation refusée |
| `SDK location not found` | Ouvrir Android Studio une fois et laisser installer le SDK |
| `error: Your local changes…` | Des fichiers ont été modifiés sur le PC : taper `git stash` puis relancer |

---

## 2. Mettre à jour l'app Android déjà installée sur un téléphone

> ⚠️ **À retenir avant tout** : l'app embarque une **copie figée** du site.
> Une correction déployée sur fami.team **n'y apparaît pas**, jamais, tant
> qu'on n'a pas rebuildé. Tester dans l'app un correctif publié le matin même
> donnera toujours l'ancien comportement — et fera conclure à tort que le
> correctif ne marche pas.

### La façon courte

Téléphone connecté — câble **ou** sans fil (voir *Débogage sans fil*
ci-dessous, dans « Le détail, étape par étape » : `cap run android` voit les
mêmes appareils que *Run* dans Android Studio) —, puis, depuis le dossier du
projet :

```
npm run android:maj
```

Cette commande enchaîne les quatre étapes détaillées plus bas : `git pull`,
`npm install`, recopie du site dans `www/` + `android/`, build et installation
sur le téléphone. Elle passe par `cap run android` plutôt que par `gradlew`,
qui ne s'appelle pas de la même façon sous Windows.

Pour un APK à transférer sans câble : `npm run android:apk`, puis récupérer le
fichier sous `android/app/build/outputs/`.

### Pourquoi ce n'est pas plus simple, et ce qui le rendrait plus simple

Trois voies existent, et une seule est bonne à terme.

| Voie | Mise à jour | Le prix à payer |
|---|---|---|
| **Aujourd'hui** : site figé dans l'app | Rebuild + réinstallation | Lourd, mais l'app marche hors ligne |
| `server.url` vers fami.team | Instantanée | **Casse le hors-ligne**, et change l'origine : le cache local, le code PIN et la langue mémorisés repartent de zéro. À écarter |
| **Mises à jour à la volée** (greffon type `@capgo/capacitor-updater`) | Instantanée | Une dépendance de plus et un endroit où héberger les paquets — mais le hors-ligne est conservé |

La troisième est la vraie réponse le jour où l'app sera sur les stores : elle
permet de corriger un défaut sans repasser par une revue Google Play. Tant que
l'app n'est installée que sur vos propres téléphones, `npm run android:maj`
suffit.

### Le détail, étape par étape

```
git pull                     # récupérer le code à jour
npm install                  # indispensable si des greffons natifs ont été ajoutés
npm run cap:sync             # recopie le site dans www/, android/ et ios/
```

Puis dans **Android Studio** (ouvrir le dossier `android/`) :

1. *File → Sync Project with Gradle Files* — obligatoire après un
   `npm install` qui ajoute un greffon : sans cela, Gradle compile l'ancienne
   liste de dépendances et le greffon manque à l'exécution.
2. Téléphone connecté (câble **ou** sans fil, voir ci-dessous), puis
   *Run* (▶) — le téléphone apparaît dans la liste des appareils, en haut de
   la fenêtre. L'app s'installe par-dessus l'ancienne : les données sont
   conservées.

### Débogage sans fil (une seule fois par réseau Wi-Fi)

Le téléphone et l'ordinateur doivent être sur le **même réseau Wi-Fi**.

Sur le téléphone : *Paramètres → Options pour les développeurs* (si absent,
*À propos du téléphone* → taper 7 fois sur *Numéro de build*) →
**Débogage sans fil** → l'activer → *Associer l'appareil avec un code QR*
(ou *Associer avec un code d'appairage*, selon les modèles).

Dans Android Studio : bandeau supérieur → menu des appareils → **Pair Devices
Using Wi-Fi** → scanner le QR code affiché sur le téléphone avec l'appareil
photo qu'Android Studio ouvre à l'écran. L'appairage ne se refait plus tant
que les deux restent sur le même réseau ; changer de Wi-Fi (ou redémarrer le
téléphone) demande parfois de le refaire.

Une fois apparié, le téléphone reste visible dans la liste des appareils de
Run — plus besoin du câble, y compris pour les builds suivants.

Sans Android Studio ouvert, la même chose en ligne de commande — une fois
l'appairage ci-dessus déjà fait :

```
adb pair 192.168.1.XX:XXXXX          # adresse + code affichés sur le téléphone
adb connect 192.168.1.XX:XXXXX       # adresse affichée sous "Débogage sans fil"
cd android && ./gradlew installDebug
```

Pour un APK à transférer à la main (sans câble) :
*Build → Build Bundle(s) / APK(s) → Build APK(s)*, puis copier
`android/app/build/outputs/apk/debug/app-debug.apk` sur le téléphone.

**Trois pièges :**
- une app **debug** et une app **release** ne portent pas la même signature :
  passer de l'une à l'autre exige de désinstaller d'abord (et les données
  locales partent avec — la famille est sur Supabase, mais autant se
  reconnecter en connaissance de cause) ;
- `versionCode` vaut encore `1` dans `android/app/build.gradle`. Tant qu'on
  installe soi-même, c'est sans effet ; **Google Play refuse en revanche deux
  envois avec le même `versionCode`** : l'incrémenter (et faire suivre
  `versionName`) fait partie de chaque publication ;
- vider le cache de la WebView n'est pas nécessaire : les fichiers sont
  versionnés (`?v=NNN`, incrémenté à chaque changement), un nouveau build
  sert donc bien le nouveau code.

## 3. Comment relancer la synchro après une modification du site

```
npm run cap:sync      # copie www/ à jour + met à jour android/ et ios/
```
À faire avant chaque ouverture d'Android Studio / Xcode pour builder une
nouvelle version.

## 4. Ce qu'il reste — et qui ne dépend que de vous

| # | Élément | Pourquoi je ne peux pas le faire moi-même |
|---|---|---|
| 1 | **Un vrai logo dessiné** (l'étoile actuelle est un repli fidèle à l'identité existante, pas une création graphique) — *non bloquant, remplaçable à tout moment via `npm run icon:generer`* | Choix de marque — à valider avec vous avant de le figer durablement sur les stores |
| 2 | **Compte Google Play Console** (25 $, paiement unique) + création d'un **keystore de signature** | Nécessite vos identifiants Google et un paiement |
| 3 | **Empreinte SHA-256** du keystore → à coller dans `.well-known/assetlinks.json` (actuellement un espace réservé) | Dépend du keystore du point 2 |
| 4 | **Compte Apple Developer** (99 $/an) | Nécessite vos identifiants Apple et un paiement |
| 5 | **Team ID Apple** → à coller dans `.well-known/apple-app-site-association` (actuellement un espace réservé) | Dépend du compte du point 4 |
| 6 | **Capacité « Associated Domains »** à activer dans Xcode (Signing & Capabilities → + Capability → `applinks:fami.team`, `applinks:famiteam.com`) | Se fait en un clic dans Xcode, sur un Mac — je risquerais de corrompre le projet en l'éditant à l'aveugle sans pouvoir compiler pour vérifier |

Tant que 3 et 5 ne sont pas complétés, les liens d'e-mail continueront de
s'ouvrir dans le navigateur plutôt que dans l'app — sans casser quoi que ce
soit : c'est exactement le comportement actuel, donc aucune régression.

## 5. Prochaine étape suggérée

Lancer `android/` dans Android Studio pour un premier build sur émulateur
(aucun compte requis pour ça) — voir la conversation pour les étapes.
