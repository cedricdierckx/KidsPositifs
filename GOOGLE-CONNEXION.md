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
| cedric.dierckx.bvba@gmail.com | **non confirmé** | **0**, jamais connecté |
| damienvw@gmail.com | confirmé | 1 |

Le seul compte non confirmé est un compte de l'éditeur, jamais utilisé et sans
aucune famille : le rattacher ou non ne change rien, il est vide dans les deux
cas. Tous les comptes portant réellement une famille sont confirmés, donc
Supabase les rattachera.

**Rien à faire avant d'allumer.**

*(À nettoyer un jour, sans rapport avec Google : deux comptes fantômes de
l'éditeur — `cedric.dierckx.bvba@gmail.com` et `cedric.dierckx@belnot.be` —
jamais connectés, sans famille. Ils gonflent le total de 12 comptes alors que
10 seulement sont réels : sur d'aussi petits nombres, cela fausse la lecture
de la traction.)*

---

## 1. Google Cloud (≈ 25 min, une seule fois)

1. <https://console.cloud.google.com> → créer un projet, nom libre (`FamiTeam`).
2. **APIs & Services → OAuth consent screen** :
   - type **External**, statut **In production** ;
   - nom de l'application : `FamiTeam` ;
   - e-mail d'assistance et de contact : votre adresse ;
   - **Privacy policy** : `https://fami.team/confidentialite.html` ;
   - **Terms of service** : `https://fami.team/mentions-legales.html` ;
   - domaine autorisé : `fami.team` (ajoutez aussi `famiteam.com`).
3. **Scopes** : ne cochez que `email`, `profile`, `openid`. Ce sont des portées
   dites « non sensibles » : **aucune vérification Google n'est nécessaire**, et
   la mise en production est immédiate. N'ajoutez rien d'autre — la moindre
   portée sensible déclenche un examen de plusieurs semaines.
4. **Credentials → Create credentials → OAuth client ID**, type **Web application** :
   - **Authorized JavaScript origins** :
     ```
     https://fami.team
     https://www.fami.team
     https://famiteam.com
     https://www.famiteam.com
     ```
   - **Authorized redirect URI** — une seule, celle de Supabase, exactement :
     ```
     https://ztraacsqtwslvcjfpdtp.supabase.co/auth/v1/callback
     ```
5. Copiez le **Client ID** et le **Client secret**.

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

Espace parents → **Admin → Système** → cocher
« Proposer la connexion par compte Google ».

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
  Le code demande donc l'URL sans rediriger, et l'ouvre dans le navigateur du
  système (plugin Capacitor `Browser` s'il est présent, sinon onglet système).
  Le retour passe par les App Links déjà déclarés pour le lien magique.
  **Ce chemin n'a pas été essayé sur un appareil réel** — à valider avec la
  session qui travaille sur le mobile.

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
