# 🌟 KidsPositifs

Un programme **évolutif et ludique** pour aider les enfants de **2 à 7 ans** à
adopter des comportements positifs — et à se détourner des négatifs — dans
l'esprit de la pédagogie **« Papa Positive »** (parentalité positive et
bienveillante).

C'est une petite application web, **100 % hors-ligne** : tout fonctionne dans le
navigateur (tablette, téléphone ou ordinateur) et les données sont enregistrées
**localement** sur l'appareil (aucun compte, aucun envoi sur internet).

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
l'onglet **⚙️ Parents**, tu peux modifier les prénoms, l'année de naissance,
l'emoji et la couleur de chacun. Les missions proposées **s'adaptent
automatiquement à l'âge** de chaque enfant.

## 🎮 Comment ça marche (la gamification)

Deux catégories, deux monnaies, deux récompenses qui **évoluent dans le temps** :

| Catégorie | Monnaie | Récompense évolutive |
|-----------|---------|----------------------|
| 🏡 **Famille** (entraide, mettre/débarrasser la table, manger proprement, ranger sa chambre, dire merci…) | 💛 Cœurs | **Avatar personnalisable** : personnage, chapeau, accessoire, compagnon, décor à débloquer |
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

## 📁 Structure

```
index.html        Page de l'application
css/style.css     Styles (interface tactile, lisible par de jeunes enfants)
js/data.js        Configuration : enfants, catégories, missions, récompenses
js/app.js         Logique : état, sauvegarde locale, actions
js/ui.js          Rendu des différents écrans
```

## 🔧 Personnaliser

Tout se règle dans `js/data.js` :
- **Ajouter une mission** : ajoute un objet dans `MISSIONS` (catégorie, emoji,
  titre, âge minimum, points, type `quotidien`/`ponctuel`).
- **Ajouter un élément d'avatar** : complète `AVATAR_OPTIONS`.
- **Modifier l'écosystème** : ajuste les paliers de `ECOSYSTEME_PALIERS`.

Dans l'onglet Parents, tu peux **exporter** une sauvegarde JSON ou **tout
réinitialiser**.

> ⚠️ L'âge est calculé à partir de la constante `ANNEE_REF` dans `js/app.js`
> (2026). Mets-la à jour au fil des années.
