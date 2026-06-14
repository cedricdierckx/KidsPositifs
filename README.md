# 🌟 KidsPositifs

Un programme **évolutif et ludique** pour aider les enfants de **2 à 7 ans** à
adopter des comportements positifs — et à se détourner des négatifs — dans
l'esprit de la pédagogie **« Papa Positive »** (parentalité positive et
bienveillante).

C'est une petite application web qui fonctionne dans le navigateur (tablette,
téléphone ou ordinateur). Les données sont **synchronisées entre tous les
appareils** de la famille grâce à un simple **code famille** partagé, avec un
cache local qui assure le fonctionnement même **hors-ligne**.

## 🔄 Synchronisation entre appareils

Au premier lancement, l'appli demande un **code famille** (ex.
`famille-dierckx`). Saisissez **le même code** sur chaque appareil : ils
partageront alors les mêmes Cœurs, Gouttes, avatars et écosystèmes. Les
modifications sont envoyées automatiquement et chaque appareil se rafraîchit
toutes les ~12 secondes (et au retour sur l'onglet).

> Données peu sensibles (points de comportement) : pas de compte ni d'email.
> Toute personne connaissant le code voit les données — gardez-le en famille.

### Configuration du stockage (Vercel + Upstash KV)

Le site est déployé sur Vercel (https://kids-positifs.vercel.app/). La synchro
repose sur une fonction serverless (`api/state.js`) et une base **Upstash for
Redis / Vercel KV** :

1. Dans le dashboard Vercel du projet → onglet **Storage** → **Create
   Database** → **Upstash for Redis** (ou « KV »), puis **Connect** au projet.
2. Vercel ajoute alors automatiquement les variables d'environnement
   `KV_REST_API_URL` et `KV_REST_API_TOKEN` (l'API accepte aussi
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
3. **Redeploy** le projet. C'est prêt : la synchro fonctionne.

Tant que ces variables ne sont pas configurées, l'appli continue de fonctionner
en local sur chaque appareil (sans synchro), et l'API renvoie un message
explicite.

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

Côté Planète, l'enfant **construit la nature dans le bon ordre**, comme dans la
réalité :

1. 🌱 **Les plantes** d'abord (elles captent l'énergie du soleil).
2. 🐰 **Les herbivores** ensuite — débloqués seulement quand il y a **assez de
   plantes** pour les nourrir.
3. 🦊 **Les carnivores** enfin — débloqués seulement quand il y a **assez
   d'herbivores**.

À chaque niveau, l'enfant **choisit** parmi plusieurs espèces ce qu'il veut
créer, en dépensant ses Gouttes 💧. Il comprend ainsi, en jouant, que chaque
maillon dépend du précédent. La configuration (niveaux, espèces, quantités
requises) se règle dans `TIERS_ECO` (`js/data.js`).

## 🌈 L'esprit « Papa Positive »

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
- Modification des profils, réglages de synchro et données.

> L'avatar et l'emoji de chaque enfant **suivent automatiquement le sexe** (et
> l'âge pour les tout-petits), tant qu'ils n'ont pas été personnalisés.

## 📁 Structure

```
index.html        Page de l'application
css/style.css     Styles (interface tactile, lisible par de jeunes enfants)
js/data.js        Configuration : enfants, catégories, missions, récompenses
js/avatar.js      Rendu vectoriel (SVG) des avatars, parfaitement alignés
js/app.js         Logique : état, synchronisation, calcul d'âge, actions
js/ui.js          Rendu des différents écrans (dont l'écran code famille)
api/state.js      Fonction serverless de synchro (Vercel + Upstash KV)
vercel.json       Configuration du déploiement Vercel
```

## 🔧 Personnaliser

Tout se règle dans `js/data.js` :
- **Ajouter une mission** : ajoute un objet dans `MISSIONS` (catégorie, emoji,
  titre, âge minimum, points, type `quotidien`/`ponctuel`).
- **Ajouter un élément d'avatar** : complète `AVATAR_OPTIONS`.
- **Modifier l'écosystème** : ajuste les paliers de `ECOSYSTEME_PALIERS`.

Dans l'onglet Parents, tu peux **changer de code famille**, **exporter** une
sauvegarde JSON ou **tout réinitialiser**.

> L'âge se calcule automatiquement à partir de la date de naissance, il n'y a
> rien à mettre à jour au fil des années.
