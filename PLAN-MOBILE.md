# 📱 Plan — Applications Android & iOS (Capacitor)

> 🚧 **Statut : terrain préparé.** La coquille native (Capacitor) est en
> place et se synchronise avec le code du site. Ce qui reste dépend de
> comptes/actifs que seule l'équipe FamiTeam peut fournir (voir §3).

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

## 2. Comment relancer la synchro après une modification du site

```
npm run cap:sync      # copie www/ à jour + met à jour android/ et ios/
```
À faire avant chaque ouverture d'Android Studio / Xcode pour builder une
nouvelle version.

## 3. Ce qu'il reste — et qui ne dépend que de vous

| # | Élément | Pourquoi je ne peux pas le faire moi-même |
|---|---|---|
| 1 | **Icône et écran de démarrage** réels (FamiTeam n'a aujourd'hui aucun logo graphique, seulement le texte « 🌟 FamiTeam ») | Choix de marque — à valider avec vous avant de le figer sur les stores |
| 2 | **Compte Google Play Console** (25 $, paiement unique) + création d'un **keystore de signature** | Nécessite vos identifiants Google et un paiement |
| 3 | **Empreinte SHA-256** du keystore → à coller dans `.well-known/assetlinks.json` (actuellement un espace réservé) | Dépend du keystore du point 2 |
| 4 | **Compte Apple Developer** (99 $/an) | Nécessite vos identifiants Apple et un paiement |
| 5 | **Team ID Apple** → à coller dans `.well-known/apple-app-site-association` (actuellement un espace réservé) | Dépend du compte du point 4 |
| 6 | **Capacité « Associated Domains »** à activer dans Xcode (Signing & Capabilities → + Capability → `applinks:fami.team`, `applinks:famiteam.com`) | Se fait en un clic dans Xcode, sur un Mac — je risquerais de corrompre le projet en l'éditant à l'aveugle sans pouvoir compiler pour vérifier |

Tant que 3 et 5 ne sont pas complétés, les liens d'e-mail continueront de
s'ouvrir dans le navigateur plutôt que dans l'app — sans casser quoi que ce
soit : c'est exactement le comportement actuel, donc aucune régression.

## 4. Prochaine étape suggérée

Lancer `android/` dans Android Studio pour un premier build sur émulateur
(aucun compte requis pour ça) — voir la conversation pour les étapes.
