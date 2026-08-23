# 🔑 Connexion par compte Google — marche à suivre

Le code est en place et **éteint**. Le bouton « Continuer avec Google » n'apparaît
pas tant que l'interrupteur n'est pas allumé, précisément pour qu'il ne s'affiche
jamais avant d'être utilisable.

Ordre à respecter : **Google Cloud → Supabase → l'interrupteur**. Allumer avant
d'avoir configuré ferait échouer chaque clic, pour toutes les familles.

---

## Avant tout : un compte à régler

Sur vos 12 comptes, **5 sont des adresses `gmail.com`** — donc 5 parents
susceptibles de cliquer sur le bouton. Supabase ne rattache une identité Google à
un compte existant **que si l'adresse e-mail a déjà été confirmée**.

Or **l'un de ces 5 comptes gmail n'a jamais confirmé son adresse**. Si cette
personne clique sur « Continuer avec Google », elle arrivera dans un compte neuf
et vide, et croira avoir perdu ses enfants.

Deux façons de traiter cela, au choix :

- lui demander de cliquer le lien de confirmation resté dans sa boîte (ou lui en
  renvoyer un) **avant** d'allumer l'interrupteur ;
- ou confirmer l'adresse depuis le tableau de bord Supabase → Authentication →
  Users.

Le garde-fou décrit plus bas rattrape le cas si rien n'est fait, mais il vaut
mieux ne pas avoir à s'en servir.

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
