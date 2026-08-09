# Registre des activités de traitement — FamiTeam

*Document interne, tenu au titre de l'article 30 du RGPD. Il n'est pas publié :
il est produit sur demande d'une autorité de contrôle.*

**Dernière mise à jour :** juillet 2026

---

## 1. Responsable du traitement

| | |
|---|---|
| Identité | Cédric Dierckx |
| Adresse | Peperstraat 38, 3080 Tervuren, Belgique |
| Contact | hello@fami.team |
| Délégué à la protection des données | Non désigné — non requis (art. 37 : ni autorité publique, ni suivi à grande échelle, ni traitement à grande échelle de catégories particulières) |

**Nature du projet.** Application web familiale gratuite, sans but lucratif,
sans publicité et sans revente de données, développée sur le temps libre de son
éditeur. Les frais (hébergement, nom de domaine, envoi d'e-mails) sont couverts
par des dons facultatifs. Il ne s'agit pas d'une activité professionnelle.

**Sur la dispense de l'article 30(5).** L'éditeur emploie moins de 250
personnes, mais le traitement n'est **pas occasionnel** (usage quotidien) et
porte sur des **données d'enfants**. La dispense est donc écartée par prudence
et le présent registre est tenu.

---

## 2. Traitements

### T1 — Comptes parents et authentification

| | |
|---|---|
| Finalité | Créer et sécuriser l'accès au compte du parent |
| Base légale | Exécution du contrat — art. 6.1.b |
| Personnes concernées | Parents utilisateurs |
| Catégories de données | Adresse e-mail, mot de passe (haché par Supabase Auth), horodatages de connexion |
| Destinataires | Supabase (sous-traitant) |
| Conservation | Tant que le compte existe ; suppression immédiate et définitive à la demande du parent |
| Mesures | HTTPS, mots de passe hachés, Row Level Security, accès administrateur restreint |

### T2 — Profils des enfants et activité quotidienne

| | |
|---|---|
| Finalité | Faire fonctionner l'application : afficher les missions adaptées à l'âge, l'avatar et les progrès |
| Base légale | Consentement du titulaire de l'autorité parentale — art. 6.1.a, lu avec l'art. 8 |
| Personnes concernées | Enfants de 2 à 7 ans, dont les profils sont créés et gérés par leur parent |
| Catégories de données | Prénom **ou surnom** au choix du parent ; **mois et année de naissance** (le jour n'est jamais demandé) ; sexe (détermine la coiffure par défaut de l'avatar) ; apparence de l'avatar ; couleur ; missions cochées, points et récompenses |
| Données **non** collectées | Nom de famille, photo, adresse, coordonnées de l'enfant, données de santé, géolocalisation, identifiants publicitaires |
| Destinataires | Supabase (sous-traitant). Aucune communication à des tiers |
| Conservation | Tant que le compte famille existe. Historique d'état limité aux 40 dernières sauvegardes |
| Mesures | Row Level Security (chaque famille n'accède qu'à ses données), minimisation à la conception, pseudonymisation encouragée dans l'interface (un surnom suffit) |

> **Minimisation, art. 5.1.c.** L'interface recommande explicitement un surnom
> et ne demande que le mois de naissance. Le champ « emoji » de l'enfant, devenu
> sans usage après le passage aux avatars, a été **supprimé** de l'état plutôt
> que conservé sans nécessité.

### T3 — Retours des familles (bugs et suggestions)

| | |
|---|---|
| Finalité | Corriger les anomalies et faire évoluer l'application |
| Base légale | Intérêt légitime — art. 6.1.f (améliorer un service gratuit à la demande de ses utilisateurs) |
| Personnes concernées | Parents qui écrivent volontairement |
| Catégories de données | Message libre, e-mail du compte, contexte technique (langue, version, navigateur) |
| Destinataires | Supabase (sous-traitant). Consulté uniquement par l'éditeur, depuis l'interface d'administration |
| Conservation | 24 mois à compter du traitement du retour |
| Mesures | Lecture réservée aux administrateurs (RLS), aucun envoi vers un outil tiers |

### T4 — Liste d'attente et invitations

| | |
|---|---|
| Finalité | Ouvrir les accès par vagues, pour que chaque famille démarre dans de bonnes conditions |
| Base légale | Mesures précontractuelles à la demande de la personne — art. 6.1.b |
| Personnes concernées | Candidats à l'inscription |
| Catégories de données | Adresse e-mail, date d'inscription, origine (`source`), jeton d'invitation, date d'invitation |
| Destinataires | Supabase (sous-traitant), OVH (acheminement de l'e-mail) |
| Conservation | Jusqu'à l'inscription ou au retrait de la liste ; au maximum 12 mois sans suite |
| Mesures | Aucune politique de lecture publique ; consultation par RPC réservée aux administrateurs |

### T5 — Mesure d'usage et statistiques

| | |
|---|---|
| Finalité | Savoir si l'application sert réellement, et à quel rythme la faire grandir |
| Base légale | Intérêt légitime — art. 6.1.f |
| Personnes concernées | Familles utilisatrices |
| Catégories de données | Compteurs **agrégés** : familles actives, ouvertures, taux d'activation, parrainages. Aucun profilage individuel |
| Destinataires | Supabase (sous-traitant) |
| Conservation | Agrégats sans limite ; événements bruts 90 jours |
| Mesures | Aucun traceur publicitaire, aucun outil d'analyse tiers, aucun cookie de mesure |

---

### T6 — Tableau d'honneur des familles (« L'Arbre des familles »)

| | |
|---|---|
| Finalité | Remercier publiquement, à l'intérieur de l'application, les familles qui en ont fait connaître d'autres |
| Base légale | **Consentement — art. 6.1.a**, retirable en un clic (art. 7.3). Recueilli par deux chemins : une case décochée par défaut dans l'application, **ou** le choix d'un nom de code à l'entrée du mode Défi — un geste libre, sans lequel on n'entre pas, et dont l'écran dit explicitement qu'il fait figurer au tableau |
| Personnes concernées | Familles qui ont coché la case, ou qui se sont donné un nom de code en entrant dans le mode Défi |
| Catégories de données | **Un nom d'équipe choisi par la famille** (24 caractères) et un nombre de familles amenées. Rien d'autre |
| Données **non** publiées | Le nom de la famille (`families.name`), l'adresse e-mail, le prénom d'un enfant, l'identité des familles amenées |
| Destinataires | Les autres familles **connectées** à l'application. Jamais le web public, jamais un tiers |
| Conservation | Tant que le consentement dure. Le retrait **efface le nom d'équipe** ; il n'en reste aucune trace |
| Mesures | Inscription refusée sans nom d'équipe (accepter sans pseudonyme reviendrait à publier le vrai nom) ; aucun rang attribué à une famille non consentante ; tableau masqué sous un seuil de familles consentantes ; retrait accessible depuis le tableau lui-même, en un clic, et effaçant le pseudonyme |

Le **code de parrainage** (`families.referral_code`) et le rattachement d'une
famille à son parrain (`referrals`) relèvent de **T4 — Liste d'attente et
invitations** : ce sont les mêmes finalité et base légale. Le parrain ne reçoit
jamais l'identité de la famille qu'il a amenée, seulement un compteur.

---

### T7 — Défis privés entre familles amies (« Les Arènes »)

| | |
|---|---|
| Finalité | Permettre à un cercle d'amis de se lancer un défi amical, à durée limitée, sur le nombre de familles qu'ils font découvrir |
| Base légale | **Consentement — art. 6.1.a.** On n'entre dans une arène qu'en saisissant son code **et** en choisissant un nom d'équipe : ce geste est le consentement |
| Personnes concernées | Familles ayant volontairement rejoint une arène |
| Catégories de données | **Un nom d'équipe choisi** (24 caractères), le nombre de familles amenées pendant l'arène, et le score qui en découle |
| Données **non** traitées | Le nom de la famille, l'adresse e-mail, l'identifiant interne des autres familles, et **toute donnée d'enfant — aucune n'entre dans le calcul** |
| Destinataires | Les **seuls autres membres de la même arène**. Une famille extérieure ne peut pas lire le classement |
| Conservation | Le temps de l'arène. Quitter l'arène **efface le nom d'équipe** immédiatement (art. 7.3) |
| Mesures | Dispositif hébergé sur une page **non référencée** (noindex, exclue de robots.txt et du plan du site), à laquelle aucune page publique ne renvoie ; aperçu public limité au nom de l'arène, au nombre d'équipes et au temps restant |

Ce dispositif est **délibérément séparé** de l'application : celle-ci ne
comporte aucun classement, et rien de ce qui précède n'y apparaît.

---

## 3. Sous-traitants

| Sous-traitant | Rôle | Localisation | Encadrement |
|---|---|---|---|
| Supabase Inc. | Base de données, authentification, fonctions serveur | UE — `eu-west-1` (Irlande) | Conditions de service + clauses contractuelles types |
| Vercel Inc. | Hébergement du site statique | Diffusion mondiale ; **ne reçoit aucune donnée de compte ni de profil** | Conditions de service + clauses contractuelles types |
| OVH SAS | Serveur SMTP sortant | UE (France) | Conditions de service |

Tout nouveau sous-traitant est ajouté à ce registre **et** à la politique de
confidentialité avant sa mise en service.

---

## 4. Droits des personnes

Les droits d'accès, de rectification, d'effacement et de portabilité s'exercent
**en libre-service, sans écrire à personne et sans délai** :

| Droit | Où | Effet |
|---|---|---|
| Accès et portabilité | Réglages → Mon compte → « Exporter » | Copie complète au format JSON |
| Rectification | Réglages → Profils | Modification immédiate |
| Effacement | Réglages → Mon compte → « Supprimer le compte » | Suppression définitive de la famille, de son état, de son historique et de ses invitations |
| Opposition / limitation | hello@fami.team | Traité au cas par cas |

Autorité de contrôle compétente : **Autorité de protection des données**,
rue de la Presse 35, 1000 Bruxelles — [autoriteprotectiondonnees.be](https://www.autoriteprotectiondonnees.be).

---

## 5. Sécurité (art. 32)

- Chiffrement en transit (HTTPS) sur l'ensemble des échanges.
- Row Level Security sur toutes les tables : une famille ne peut lire que ses
  propres lignes ; les fonctions d'administration vérifient `is_admin()`.
- Mots de passe hachés par Supabase Auth ; l'éditeur n'y a jamais accès.
- Sauvegardes automatiques de l'état familial (40 versions), restaurables par
  le parent lui-même.
- Aucun accès de sous-traitant aux données à des fins propres.

## 6. Violation de données (art. 33-34)

En cas de violation présentant un risque pour les personnes : notification à
l'Autorité de protection des données **dans les 72 heures**, et information des
familles concernées par e-mail si le risque est élevé. Les faits, leurs effets
et les mesures prises sont consignés à la suite du présent registre.

*Aucune violation à ce jour.*

---

## 7. Revue

Ce registre est revu **une fois par an**, et à chaque fois qu'une donnée
nouvelle est collectée ou qu'un sous-traitant change. La revue fait partie du
chantier 🛡️ « Conformité » du plan de développement.
