# FamiTeam — Analyse de marché & business plan

> Document de travail, révisé le 25 juillet 2026.
> Le **suivi d'avancement** vit dans l'application : espace parents → Admin →
> onglet **📈 Croissance**. Le plan détaillé (chantiers, étapes, e-mails) est
> défini dans `js/croissance.js`. Ce document porte l'analyse ; l'app porte
> l'exécution.

**Avertissement sur les chiffres.** Chaque estimation est suivie d'un degré de
certitude. Les données publiées sur le marché des applications de parentalité
varient d'un facteur deux selon les cabinets ; les projections de FamiTeam sont
des hypothèses de travail à confronter au réel, pas des prévisions.

---

## 1. Le produit en une page

FamiTeam est une application **web** (aucun téléchargement, aucun magasin
d'applications) qui aide les enfants de **2 à 7 ans** à adopter des
comportements positifs, dans l'esprit de la parentalité bienveillante.

- L'enfant coche ses missions du jour, gagne des **cœurs 💛** (famille) et des
  **gouttes 💧** (planète), fait grandir un **avatar** et un **écosystème**.
- Les parents choisissent les missions, valident si besoin, et disposent d'un
  espace dédié : comportement du jour, compliment du jour, semaine papier.
- **Aucun point n'est jamais retiré.** En cas d'incident, l'enfant réalise un
  **geste de réparation**, et c'est ce geste qui est récompensé.
- Multi-familles, temps réel entre appareils, fonctionnement hors-ligne,
  quatre langues (FR, EN, NL, DE), hébergement européen, aucune publicité.

### Ce qui est déjà construit (actif, pas projet)

Comptes et familles, invitations, **parrainage 3 familles/semaine**, liste
d'attente, rôles admin, retours utilisateurs, statistiques d'usage, export de
données, suppression de compte, pages légales, e-mails transactionnels,
tutoriel, espace parents simplifié. Le champ `plan` (`free`/`premium`) existe
déjà en base : **brancher un paiement ne demande pas de refonte** (certitude
95 %, vérifié dans `supabase/schema.sql`).

---

## 2. Analyse de marché

### 2.1 Taille du marché

Le marché mondial des applications de parentalité est estimé entre **1,1 et
1,9 milliard USD en 2026**, avec une croissance annuelle de **11 à 13 %**
([Coherent Market Insights](https://www.coherentmarketinsights.com/industry-reports/global-parenting-apps-market),
[InsightAce](https://www.insightaceanalytic.com/report/parenting-apps-market/3219),
[Business Research Insights](https://www.businessresearchinsights.com/market-reports/parenting-apps-market-113806)).
L'écart entre sources reflète des périmètres différents (suivi de grossesse,
contrôle parental, organisation familiale). **Certitude sur l'ordre de
grandeur : 75 % ; sur le chiffre exact : 40 %.**

Ce chiffre mondial n'est pas notre marché. Le nôtre se calcule par le bas :

| Niveau | Périmètre | Estimation | Certitude |
|---|---|---|---|
| **TAM** | Ménages francophones (BE + FR + CH + LU) avec ≥ 1 enfant de 2 à 7 ans | ≈ **3,8 M ménages** | 65 % |
| **SAM** | Parmi eux, ceux qui cherchent activement un outil de routine/récompense | ≈ **600 000** | 50 % |
| **SOM à 3 ans** | Part atteignable sans budget publicitaire significatif | ≈ **10 000 familles inscrites** | 45 % |

Méthode : la Belgique comptait au 1ᵉʳ janvier 2025 environ **36,7 % de ménages
avec enfants** (18,5 % couples mariés, 8,2 % cohabitants, 10 % familles
monoparentales — [Statbel](https://statbel.fgov.be/en/news/belgium-had-36-one-person-households-01-january-2025)),
soit ≈ 1,8 M ménages ; la tranche 2-7 ans en représente environ **30 %**, soit
**≈ 540 000 ménages belges**. La France, à population six fois supérieure et
structure familiale comparable, en compte **≈ 3,2 M**. Suisse romande et
Luxembourg ajoutent ≈ 150 000.

### 2.2 Concurrence

| Concurrent | Positionnement | Prix observé | Faiblesse exploitable |
|---|---|---|---|
| **Cozi** | Calendrier familial partagé (US) | Gratuit + ~30 $/an | Organisation des parents, rien pour l'enfant de 3 ans |
| **OurHome** | Tâches + points, gamifié | Gratuit | Interface datée, pensée pour les 8-14 ans, anglophone |
| **FamilyApp** | Organisation familiale FR | jusqu'à ~15 €/mois | Cher, orienté scolaire (devoirs, notes) |
| **Famille.click** | Tâches gamifiées FR | Gratuit | Peu de doctrine éducative, portée limitée |
| **NeatKid** | Corvées enfants 5-8 ans, récompense = argent de poche | Gratuit + achats | Récompense monétaire, logique transactionnelle |
| **Nipto** | Partage du ménage entre adultes | Gratuit + premium | Ne s'adresse pas aux enfants |
| Tableaux de gommettes papier | Le vrai concurrent | ~0 € | Gratuit, tangible, mais s'essouffle en trois semaines |

Sources : [Panda Productif](https://pandaproductif.fr/9-applications-pour-faciliter-quotidien-familles/),
[Maman Vogue](https://mamanvogue.fr/maternite/etre-maman/organisateur-de-tache-familial/),
[MyTribeFamily](https://mytribefamily.com/blog/meilleures-applications-gestion-famille-2026),
[Famille.click](https://www.famille.click/), [FamilyApp](https://family-app.fr/),
[NeatKid (App Store)](https://apps.apple.com/us/app/neatkid-t%C3%A2che-m%C3%A9nag%C3%A8re-enfant/id6480269902?l=fr-FR),
[Nipto (App Store)](https://apps.apple.com/fr/app/nipto-partage-du-m%C3%A9nage/id1504877473).
**Certitude sur les prix relevés : 45 %** (tarifs changeants, à revérifier avant
toute décision de prix).

**Le vrai concurrent n'est pas une app : c'est le tableau de gommettes sur le
frigo** — et l'abandon au bout de trois semaines. Notre argument n'est donc pas
« mieux que l'app X » mais « ça tient dans la durée, parce que ça ne punit
jamais et que ça prend deux minutes ».

### 2.3 Ce qui nous distingue réellement

1. **Réparer plutôt que punir.** Aucun concurrent identifié n'en fait un
   principe explicite. C'est un angle éditorial et presse à lui seul.
2. **La tranche 2-7 ans**, avec affichage imagé pour les non-lecteurs
   (quantités en emojis sous un seuil d'âge). La concurrence commence à 6-8 ans.
3. **Double boucle de motivation** : avatar (individuel) *et* écosystème
   vivant (collectif, planète) — une dimension éducative absente ailleurs.
4. **Web, pas magasin d'applications.** Aucune commission de 15-30 %, mise à
   jour instantanée, pas de validation Apple. Contrepartie : la découverte ne
   profite pas du référencement des stores — c'est notre principale faiblesse
   d'acquisition, et la raison d'être des chantiers Contenu et Prescripteurs.
5. **Confiance** : hébergement européen, aucune publicité, aucune revente,
   export et suppression en deux clics, quatre langues.

### 2.4 Risques

| Risque | Gravité | Parade |
|---|---|---|
| Acquisition atone hors magasins d'applications | Élevée | Prescripteurs (écoles, crèches, pros) + contenu + parrainage |
| Lassitude après 3-4 semaines | Élevée | Cartes surprises, avatar, écosystème, compliment du jour ; mesurer J+30 |
| Un géant copie le principe | Moyenne | Vitesse et niche ; l'avantage est éditorial, pas technique |
| Données d'enfants : incident ou méfiance | Élevée | Minimisation déjà en place, RLS, registre des traitements (chantier Conformité) |
| Solo-fondateur : disponibilité | Élevée | Chantiers séquentiels, jamais deux fronts à la fois |
| Gratuité perçue comme « non sérieux » | Faible | Formule payante lisible + promesse gratuite à vie aux early adopters |

---

## 3. Business plan

### 3.1 Modèle économique

**Freemium sobre**, avec trois sources possibles, dans cet ordre :

1. **Abonnement famille** — hypothèse : gratuit complet jusqu'à 2 enfants ;
   **3,49 €/mois ou 29 €/an** pour enfants illimités, statistiques avancées,
   semaine papier, thèmes d'avatar. *Prix à valider auprès de 20 familles
   avant toute mise en œuvre (chantier Modèle & prix).*
2. **B2B2C** — employeurs, mutuelles, écoles : licence annuelle par famille
   couverte, facturation unique, aucune donnée transmise au payeur.
3. **Partenariats récompenses** — commissions d'affiliation sur les sorties
   familiales, sans aucune publicité dans l'écran enfant.

**Les dons existants restent** : ils financent déjà l'hébergement et
n'engagent personne.

### 3.2 Structure de coûts (annuelle, hors temps fondateur)

| Poste | Aujourd'hui | À 10 000 familles |
|---|---|---|
| Supabase | 0 € (offre gratuite) | ≈ 300 € |
| Vercel | 0 € | ≈ 240 € |
| Domaine + e-mail SMTP | ≈ 60 € | ≈ 150 € |
| Comptable / juridique | 0 € | ≈ 800 € |
| **Total** | **≈ 60 €** | **≈ 1 500 €** |

**Certitude : 70 %.** Conséquence décisive : **le seuil de rentabilité se situe
autour de 50 abonnés annuels.** Ce n'est pas un projet qui a besoin de lever
des fonds ; c'est un projet qui a besoin de familles.

### 3.3 Prévisionnel à trois ans (scénario médian)

| | An 1 (2026-27) | An 2 (2027-28) | An 3 (2028-29) |
|---|---|---|---|
| Familles inscrites (cumul) | 1 000 | 6 000 | 20 000 |
| Familles actives 7 j | 400 | 2 400 | 8 000 |
| Taux d'abonnement (des actives) | — (gratuit) | 6 % | 8 % |
| Abonnés payants | 0 | 145 | 640 |
| Revenu abonnements | 0 € | ≈ 4 200 € | ≈ 18 600 € |
| B2B2C | 0 € | ≈ 1 000 € | ≈ 8 000 € |
| Dons + affiliation | ≈ 300 € | ≈ 800 € | ≈ 2 500 € |
| **Recettes** | **≈ 300 €** | **≈ 6 000 €** | **≈ 29 100 €** |
| Charges | ≈ 100 € | ≈ 600 € | ≈ 1 500 € |
| **Résultat** | **≈ 200 €** | **≈ 5 400 €** | **≈ 27 600 €** |

**Certitude : 35 %** — c'est un scénario, pas une prévision. Les deux
hypothèses les plus fragiles sont le taux d'abonnement (6-8 %) et la croissance
du nombre d'inscrits.

Repères de marché pour la conversion : les applications en freemium
convertissent médianement **2,1 % à J+35**, contre 10,7 % en paywall dur ; un
essai gratuit converti en abonnement se situe entre **38 et 54 %**
([RevenueCat, State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps),
[Adapty](https://adapty.io/blog/app-store-conversion-rate/)). **Certitude : 90 %
sur les benchmarks, 55 % sur leur transposabilité à une app web familiale.**
Notre hypothèse de 6-8 % se justifie par un ciblage sur les familles *actives*
(et non sur tous les inscrits), mais elle reste optimiste : un scénario bas à
3 % donnerait ≈ 7 000 € en An 3, ce qui couvre encore largement les charges.

### 3.4 Indicateurs de pilotage

- **Étoile du Nord : familles actives sur 7 jours.**
- Activation J+1 (au moins une mission validée) — cible **60 %**.
- Rétention J+30 — cible **35 %**.
- Coefficient viral k (filleuls ÷ familles actives) — cible **> 0,4**.
- Conversion payante des familles actives — cible **6-8 %**.
- Coût d'acquisition < **un tiers** de la valeur vie client.

---

## 4. Les chantiers

Le plan d'exécution est découpé en **chantiers indépendants**, réalisables les
uns après les autres. Chacun a un but, un indicateur et des étapes cochables.
Le détail exact vit dans `js/croissance.js` et s'affiche dans **Admin →
Croissance**, où l'avancement est enregistré (`app_config`, clé `croissance`).

| Phase | Chantiers |
|---|---|
| **0 — Fondations** | Socle de mesure · Page publique & preuve · Activation & rétention |
| **1 — Traction organique** | Liste d'attente & vagues · Parrainage · Communautés · Contenu & SEO · Presse & podcasts |
| **2 — Prescripteurs** | Écoles · Crèches & extrascolaire · Professionnels de l'enfance · Employeurs & CE |
| **3 — Monétisation** | Modèle & prix · Paiement & facturation · Partenariats récompenses |
| **4 — Échelle** | Marchés NL/DE · Acquisition payante · Financements & aides · Conformité |

**Ordre recommandé.** Ne pas commencer par l'acquisition. La séquence qui
protège le temps du fondateur est : *mesurer* (phase 0) → *faire venir sans
payer* (phase 1) → *faire parler les prescripteurs* (phase 2) → *encaisser*
(phase 3) → *changer d'échelle* (phase 4). Un chantier de phase N+1 lancé
avant que la phase N ne donne ses chiffres coûte deux fois plus cher.

**Règle d'arrêt.** Tout canal testé trois fois sans résultat est abandonné et
noté comme tel dans l'onglet Croissance. C'est ce qui distingue un plan d'une
liste de vœux.

---

## 5. Les e-mails

Dix-huit modèles prêts à l'emploi sont fournis dans `js/croissance.js` et
consultables (copie en un clic, ouverture du client de messagerie pré-rempli)
dans **Admin → Croissance → Modèles d'e-mails** :

| Moment | Modèles |
|---|---|
| Cycle de vie famille | bienvenue J+0 · relance d'activation J+3 · réveil à 30 j · demande de parrainage · demande de témoignage |
| Liste d'attente | invitation de vague · relance J+7 |
| Notoriété | micro-influence · pitch presse · proposition podcast |
| Prescripteurs | école · crèche · professionnel de santé · mutuelle · employeur |
| Monétisation | partenaire récompense · annonce du premium |
| Financement | demande de rendez-vous (aide publique) |

Ils sont rédigés en français (l'administrateur écrit depuis la Belgique
francophone). Une version néerlandaise sera nécessaire au chantier *Marchés
NL/DE*. Les mentions entre `{accolades}` sont à personnaliser avant envoi :
**un e-mail non personnalisé se voit et ne reçoit pas de réponse.**

---

## 6. Décisions à prendre (par ordre d'urgence)

1. **Ouvrir publiquement ou rester sur invitation ?** Critère proposé :
   activation J+1 > 55 % sur deux vagues consécutives.
2. **Le périmètre gratuit.** « Gratuit jusqu'à 2 enfants » est une hypothèse ;
   « gratuit, premium = confort » en est une autre, plus fidèle à l'esprit du
   projet et probablement moins rentable. À trancher avant tout paiement.
3. **Le statut juridique** (indépendant complémentaire, société, ASBL) :
   dépend du niveau de recettes visé — à voir avec un comptable dès les
   premiers encaissements.
4. **Le temps disponible par semaine.** C'est la vraie contrainte du plan.
   À deux heures par semaine, la phase 1 prend un an ; à huit heures, un
   trimestre.
