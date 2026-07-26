# FamiTeam — Analyse de marché & plan de développement

> 🧭 Les chantiers **techniques** dérivés de ce plan (automatisation des
> e-mails, mesure, etc.) sont catalogués et priorisés dans `COORDINATION.md`,
> avec le modèle Claude recommandé pour chacun.

> Document de travail, révisé le 25 juillet 2026.
> Le **suivi d'avancement** vit dans l'application : espace parents → Admin →
> onglet **📈 Croissance**. Le plan détaillé (contraintes, chantiers, durées,
> e-mails) est défini dans `js/croissance.js`. Ce document porte l'analyse ;
> l'app porte l'exécution.

**Avertissement sur les chiffres.** Chaque estimation est suivie d'un degré de
certitude. Les données publiées sur ce marché varient d'un facteur deux selon
les cabinets ; les projections propres à FamiTeam sont des hypothèses de
travail, pas des prévisions.

---

## 0. Les trois contraintes — elles gouvernent tout le reste

Ce plan n'est pas un plan de start-up. Il est écrit sous trois contraintes
fermes, énoncées par le fondateur, et **toute recommandation qui les
contredirait est écartée d'office**.

### 0.1 « Cela ne peut pas devenir mon activité professionnelle »

Le fondateur est **notaire**. La profession est incompatible avec l'exercice
d'une activité commerciale. FamiTeam reste donc un **projet personnel, non
marchand par défaut**.

Conséquences, appliquées dans tout le document :

- **Pas d'abonnement payant, pas de vente B2B, pas d'affiliation, pas de
  publicité achetée.** Les chantiers correspondants sont marqués *hors
  périmètre* et conservés uniquement pour mémoire.
- Recette envisageable : **le don**, destiné à couvrir les frais techniques —
  et sous la forme que le cadre déontologique autorisera.
- **Séparation stricte** : ni le titre, ni l'étude, ni les coordonnées
  professionnelles n'apparaissent dans la communication du projet.
- Si le projet devait un jour dépasser ce cadre, les voies à examiner sont
  l'**ASBL**, la **cession de l'exploitation** à un tiers, ou une
  **participation passive** sans gestion.

**Certitude sur le principe d'incompatibilité : 85 %. Sur son application
exacte à une application gratuite développée sur temps libre : 45 %.** C'est
insuffisant pour engager quoi que ce soit : **la première étape du plan est
d'interroger la Chambre par écrit** (modèle d'e-mail `m_chambre` fourni). Tant
que la réponse n'est pas là, rien de ce qui touche à l'argent ne bouge.

### 0.2 « Le plus anonyme possible, sans obligation de répondre »

Le fondateur ne souhaite **ni être identifié, ni être contacté, ni s'engager à
répondre**. L'application doit fonctionner seule.

Ce qui est **acquis** :

- aucun service d'assistance ; la FAQ publique est l'aide de référence et la
  boîte à idées est **à sens unique**, sans réponse individuelle ;
- les e-mails aux familles sont signés **« FamiTeam »**, jamais d'un nom, et
  n'invitent plus à répondre ;
- **export et suppression en libre-service** : les droits RGPD s'exercent sans
  écrire à personne, ce qui réduit à presque rien le volume de demandes.

Ce qui **résiste**, et qu'il faut assumer :

- tant que le fondateur est **responsable de traitement**, son identité et une
  adresse doivent figurer dans les mentions légales et la politique de
  confidentialité (RGPD art. 13). **Seule une structure — une ASBL — déplacerait
  cette mention** vers la personne morale. Certitude : 90 %.
- une **adresse de contact reste obligatoire** pour l'exercice des droits. Elle
  peut rester une adresse de rôle (`hello@fami.team`), consultée quand il le
  souhaite, sans engagement de délai au-delà du légal.
- les canaux de croissance qui **exposent une personne** (presse, podcasts,
  ateliers en école, publications dans des communautés) deviennent
  incompatibles avec l'anonymat : ils passent en périmètre « plus tard ».
  Il reste le **parrainage**, le **bouche-à-oreille** et les **supports écrits**
  (dépliant, affiche, QR code) qui portent le nom du projet, pas celui d'une
  personne. C'est un vrai coût : la croissance sera plus lente.

### 0.3 « Une heure par semaine »

**52 heures par an.** C'est la ressource la plus rare du projet, plus rare que
l'argent. Conséquences :

- **Chaque étape du plan porte une durée estimée**, et l'onglet Croissance
  compose la séance hebdomadaire à partir de ce budget de 60 minutes.
- **Tout ce qui est récurrent doit être automatisé une fois** (e-mails de
  bienvenue et de relance, rapport mensuel, FAQ) — sinon le temps disponible
  part en gestes répétitifs.
- **Un plafond de familles est assumé** (voir § 3.3) : le support croît avec
  les usagers et ne se délègue pas.
- **Une seule action par semaine.** Deux chantiers menés en parallèle, c'est
  zéro chantier terminé.
- Les canaux à cycle long — vente aux employeurs, mutuelles, publicité —
  coûtent plus d'heures qu'ils n'en rapportent : écartés.

Le plan « cœur » représente **≈ 35 heures**, soit **environ neuf mois** à ce
rythme. C'est le calendrier réaliste, et il est affiché en tête de l'onglet.

---

## 1. Le produit en une page

FamiTeam est une application **web** (aucun téléchargement, aucun magasin
d'applications) qui aide les enfants de **2 à 7 ans** à adopter des
comportements positifs, dans l'esprit de la parentalité bienveillante.

- L'enfant coche ses missions du jour, gagne des **cœurs 💛** et des
  **gouttes 💧**, fait grandir un **avatar** et un **écosystème**.
- Les parents choisissent les missions, valident si besoin, et disposent d'un
  espace dédié : comportement du jour, compliment du jour, semaine papier.
- **Aucun point n'est jamais retiré.** En cas d'incident, l'enfant réalise un
  **geste de réparation**, et c'est ce geste qui est récompensé.
- Multi-familles, temps réel, hors-ligne, quatre langues, hébergement
  européen, aucune publicité.

Déjà construit : comptes, invitations, **parrainage 3 familles/semaine**,
liste d'attente, espace admin, retours utilisateurs, statistiques d'usage,
export et suppression des données, pages légales, e-mails transactionnels,
tutoriel, espace parents simplifié.

---

## 2. Analyse de marché

### 2.1 Taille du marché

Marché mondial des applications de parentalité : **1,1 à 1,9 Md USD en 2026**,
croissance **11 à 13 %/an**
([Coherent Market Insights](https://www.coherentmarketinsights.com/industry-reports/global-parenting-apps-market),
[InsightAce](https://www.insightaceanalytic.com/report/parenting-apps-market/3219),
[Business Research Insights](https://www.businessresearchinsights.com/market-reports/parenting-apps-market-113806)).
**Certitude sur l'ordre de grandeur : 75 % ; sur le chiffre exact : 40 %.**

Ce chiffre est sans objet direct ici : le projet ne vise pas une part de
marché mais un nombre de familles servies. Il sert seulement à situer le
contexte.

| Niveau | Périmètre | Estimation | Certitude |
|---|---|---|---|
| **TAM** | Ménages francophones (BE + FR + CH + LU) avec ≥ 1 enfant de 2 à 7 ans | ≈ **3,8 M** | 65 % |
| **SAM** | Ceux qui cherchent activement un outil de routine/récompense | ≈ **600 000** | 50 % |
| **Cible réaliste** | Ce qu'une heure par semaine permet de servir correctement | ≈ **2 000 familles actives** | 50 % |

Méthode : au 1ᵉʳ janvier 2025, la Belgique comptait ≈ **36,7 % de ménages avec
enfants** ([Statbel](https://statbel.fgov.be/en/news/belgium-had-36-one-person-households-01-january-2025)),
soit ≈ 1,8 M ; la tranche 2-7 ans en représente ≈ 30 %, soit **≈ 540 000
ménages belges**. La France en compte ≈ 3,2 M, la Suisse romande et le
Luxembourg ≈ 150 000.

### 2.2 Concurrence

| Concurrent | Positionnement | Prix observé | Faiblesse exploitable |
|---|---|---|---|
| **Cozi** | Calendrier familial partagé (US) | Gratuit + ~30 $/an | Pour les parents, rien pour l'enfant de 3 ans |
| **OurHome** | Tâches + points, gamifié | Gratuit | Interface datée, pensée 8-14 ans, anglophone |
| **FamilyApp** | Organisation familiale FR | jusqu'à ~15 €/mois | Cher, orienté scolaire |
| **Famille.click** | Tâches gamifiées FR | Gratuit | Peu de doctrine éducative |
| **NeatKid** | Corvées 5-8 ans, récompense = argent de poche | Gratuit + achats | Logique transactionnelle |
| **Nipto** | Partage du ménage entre adultes | Gratuit + premium | Ne s'adresse pas aux enfants |
| Tableau de gommettes papier | **Le vrai concurrent** | ~0 € | Gratuit et tangible, mais s'essouffle en trois semaines |

Sources : [Panda Productif](https://pandaproductif.fr/9-applications-pour-faciliter-quotidien-familles/),
[Maman Vogue](https://mamanvogue.fr/maternite/etre-maman/organisateur-de-tache-familial/),
[MyTribeFamily](https://mytribefamily.com/blog/meilleures-applications-gestion-famille-2026),
[Famille.click](https://www.famille.click/), [FamilyApp](https://family-app.fr/),
[NeatKid](https://apps.apple.com/us/app/neatkid-t%C3%A2che-m%C3%A9nag%C3%A8re-enfant/id6480269902?l=fr-FR),
[Nipto](https://apps.apple.com/fr/app/nipto-partage-du-m%C3%A9nage/id1504877473).
**Certitude sur les prix : 45 %.**

**Le fait d'être gratuit et non marchand n'est pas un handicap face à ces
concurrents : c'est un argument.** Aucun d'eux ne peut promettre « gratuit,
sans publicité, sans revente de données, et sans intérêt commercial à vous
retenir ».

### 2.3 Ce qui distingue réellement FamiTeam

1. **Réparer plutôt que punir** — aucun concurrent n'en fait un principe.
2. **La tranche 2-7 ans**, avec affichage imagé pour les non-lecteurs.
3. **Double boucle** avatar (individuel) et écosystème (collectif).
4. **Web, pas magasin d'applications** : mise à jour instantanée, aucune
   commission. Contrepartie : la découverte ne profite pas des stores — d'où
   les chantiers Prescripteurs.
5. **Désintéressement démontrable** : projet personnel, gratuit, sans modèle
   payant prévu. C'est un angle presse à lui seul.

### 2.4 Risques

| Risque | Gravité | Parade |
|---|---|---|
| Cadre déontologique mal évalué | **Élevée** | Chantier *Cadre* en tout premier ; rien ne bouge avant la réponse |
| Le temps manque, le projet s'éteint | **Élevée** | Automatiser le récurrent ; séance d'une heure ; plan de sortie écrit |
| Support qui déborde avec le nombre de familles | Élevée | FAQ, réponses types, plafond assumé, liste d'attente |
| Lassitude des familles après 3-4 semaines | Moyenne | Cartes surprises, avatar, écosystème ; mesurer J+30 |
| Données d'enfants : incident ou méfiance | Élevée | Minimisation, RLS, registre des traitements |
| Acquisition atone hors magasins | Moyenne | Prescripteurs + parrainage (canaux à faible coût horaire) |

---

## 3. Modèle : non marchand, soutenable

### 3.1 Ce qui rentre

Rien, par défaut. Éventuellement des **dons** destinés à couvrir les frais,
sous la forme que la Chambre validera. Aucun abonnement, aucune facturation,
aucune commission.

### 3.2 Ce qui sort

| Poste | Aujourd'hui | À 2 000 familles |
|---|---|---|
| Supabase | 0 € (offre gratuite) | ≈ 300 € |
| Vercel | 0 € | ≈ 0 à 240 € |
| Domaine + SMTP | ≈ 60 € | ≈ 150 € |
| **Total annuel** | **≈ 60 €** | **≈ 450 à 700 €** |

**Certitude : 70 %.** L'ordre de grandeur est celui d'un abonnement de
téléphonie : le projet est finançable sur fonds propres sans difficulté, et
quelques dons suffiraient à l'équilibrer.

### 3.3 Le vrai plafond n'est pas l'argent, c'est le support

C'est le calcul structurant de ce plan. En supposant que **1 % des familles
actives écrivent chaque mois** et que chaque réponse prenne **5 minutes** :

| Familles actives | Messages/mois | Temps de support | Part de l'heure hebdomadaire |
|---|---|---|---|
| 300 | 3 | ≈ 15 min/mois | 6 % |
| 1 000 | 10 | ≈ 50 min/mois | 20 % |
| **2 000** | **20** | **≈ 1 h 40/mois** | **40 %** |
| 5 000 | 50 | ≈ 4 h/mois | 100 % — plus rien pour le reste |

**Certitude : 50 %** (le taux de sollicitation est une hypothèse). Conclusion :
**le plafond soutenable se situe autour de 2 000 familles actives**, et il se
recule uniquement par la FAQ et les réponses types — pas par l'effort. Au-delà,
mieux vaut une liste d'attente qu'un service dégradé.

### 3.4 Trajectoire visée (familles, pas euros)

| | An 1 | An 2 | An 3 |
|---|---|---|---|
| Familles inscrites (cumul) | 400 | 1 200 | 3 000 |
| Familles actives 7 j | 150 | 500 | 1 500 |
| Heures investies | 52 | 52 | 52 |
| Frais annuels | ≈ 100 € | ≈ 250 € | ≈ 500 € |

**Certitude : 30 %.** L'indicateur de réussite n'est pas la croissance : c'est
le rapport **familles servies ÷ heures investies**, et le fait que le projet
tourne encore au bout de trois ans.

---

## 4. Les chantiers

19 chantiers, répartis en cinq phases, avec un **périmètre explicite** :
*cœur* (à faire), *plus tard* (si le temps le permet), *hors périmètre*
(exclu par les contraintes, conservé pour mémoire). Détail exact et suivi dans
**Admin → Croissance**.

| Phase | Chantiers | Périmètre |
|---|---|---|
| **0 — Le cadre** | ⚖️ Cadre déontologique · 📏 Socle de mesure · 🤖 Automatiser le récurrent · 🪧 Page publique & preuve · 🚀 Activation | cœur |
| **1 — Traction organique** | 🎁 Parrainage · 📨 Liste d'attente · 💬 Communautés · 📰 Presse & podcasts | cœur |
| | ✍️ Contenu & référencement | plus tard |
| **2 — Prescripteurs** | 🏫 Écoles · 🧸 Crèches · 🩺 Professionnels de l'enfance | cœur |
| **3 — Tenir dans la durée** | 🕊️ Modèle non marchand · 🛡️ Conformité · 🧘 Soutenabilité du fondateur | cœur |
| **4 — Pour mémoire** | 🔐 Abonnement · 🏢 Employeurs & mutuelles · 📣 Publicité · 🎟️ Affiliation | hors périmètre |
| | 🌍 Marchés NL/DE | plus tard |

**Ordre imposé.** Le chantier *Cadre déontologique* passe avant tout le reste :
il peut invalider des pans entiers du plan, et il ne coûte que deux heures.
Ensuite : mesurer, automatiser, puis faire venir des familles.

**Le meilleur rendement horaire** est du côté des **prescripteurs** (une
directrice d'école parle à vingt-cinq familles pour trente minutes de travail)
et du **parrainage** (qui tourne tout seul une fois branché). Le contenu et le
référencement, très rentables sur le papier, sont trop lents pour une heure
par semaine : ils attendent.

**Règle d'arrêt.** Tout canal testé trois fois sans résultat est abandonné et
noté comme tel dans l'onglet Croissance.

### Le rituel hebdomadaire

Une heure, même jour, même heure, en quatre semaines type :

| Semaine | Contenu |
|---|---|
| 1 | **Les chiffres** — 10 min de relevé, 50 min sur la prochaine étape |
| 2 | **Un contact** — un seul e-mail de prescripteur, personnalisé, envoyé |
| 3 | **Le produit** — une correction issue des retours des familles |
| 4 | **Les familles** — répondre, relancer une vague, remercier un parrain |

---

## 5. Les e-mails

Dix-huit modèles prêts à l'emploi dans `js/croissance.js`, consultables et
copiables dans **Admin → Croissance → Modèles d'e-mails**, chacun rattaché à
l'étape qui le déclenche :

| Moment | Modèles |
|---|---|
| Cadre | **question à la Chambre** (le tout premier envoi du plan) |
| Cycle de vie famille | bienvenue J+0 · relance d'activation J+3 · réveil à 30 j · demande de parrainage · demande de témoignage |
| Liste d'attente | invitation de vague · relance J+7 |
| Notoriété | micro-influence · pitch presse · proposition podcast |
| Prescripteurs | école · crèche · professionnel de l'enfance |
| Continuité | **proposition de reprise du projet** |
| Pour mémoire (hors périmètre) | mutuelle · employeur · partenaire récompense |

Tous ont été réécrits pour être cohérents avec le cadre : ils annoncent que
l'app est gratuite, développée sur temps libre, et qu'aucune vente n'est en
jeu. Les mentions entre `{accolades}` sont à personnaliser — **un e-mail
générique ne reçoit pas de réponse.**

---

## 6. Décisions à prendre, par ordre

1. **Poser la question à la Chambre** (2 h, modèle fourni). Tout en dépend.
2. **Fixer le créneau hebdomadaire** dans l'agenda. Un projet sans créneau
   meurt, quel que soit le plan.
3. **Assumer un plafond** de familles et le dire publiquement le moment venu :
   une liste d'attente est plus honnête qu'un support qui ne répond plus.
4. **Écrire le plan de sortie tant que tout va bien** : céder le projet,
   ouvrir le code, ou fermer proprement en rendant leurs données aux familles.
   Le modèle d'e-mail `m_reprise` est là pour ça. Ce n'est pas du pessimisme :
   c'est ce qui protège les familles qui auront fait confiance.
