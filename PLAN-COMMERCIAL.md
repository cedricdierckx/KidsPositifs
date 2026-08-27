# FamiTeam — Analyse de marché & plan de développement

> 🧭 Les chantiers **techniques** dérivés de ce plan (automatisation des
> e-mails, mesure, etc.) sont catalogués et priorisés dans `COORDINATION.md`,
> avec le modèle Claude recommandé pour chacun.

> 🔍 Le chantier *✍️ Contenu & référencement* (§ 4) est détaillé, avec un
> guide pas-à-pas, dans `PLAN-SEO.md`. Sa partie technique (balisage,
> sitemap) a été traitée le 25 août 2026 ; la partie contenu reste *plus
> tard*, pour les raisons du § 0.3.

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

### 0.2 « Discrétion, et une app qui tourne seule »

Le fondateur reste en retrait et souhaite que les sollicitations soient
**naturellement rares**. Règle d'écriture, appliquée partout : **rien n'annonce
jamais un refus de communiquer**. On ne dit pas « pas de support » — on fait en
sorte que le besoin d'écrire ne naisse pas.

Ce qui est **acquis** :

- le produit répond avant qu'on ne demande : FAQ complète, export et
  suppression **en libre-service**, réglages tous accessibles ;
- les e-mails aux familles sont signés **« FamiTeam »**, jamais d'un nom, et
  ne sollicitent pas de réponse — sans jamais dire qu'on n'en donnera pas ;
- la **boîte à idées** existe et elle est accueillante : elle n'engage à rien,
  et les idées sont revues **par lots**, une fois par mois (chantier récurrent
  *Revue des idées*), avec un bouton qui met les retours en forme de consigne
  prête à coller dans Claude Code.

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
d'applications) qui aide les enfants de **3 à 12 ans** à adopter des
comportements positifs, dans l'esprit de la parentalité bienveillante.

- L'enfant coche ses missions du jour, gagne des **cœurs 💛** et des
  **gouttes 💧**, fait grandir un **avatar** et un **écosystème**.
- Les missions **suivent l'âge** : le geste chez les petits (se brosser les
  dents, ranger), l'**initiative** chez les grands (aider sans qu'on le
  demande, régler un désaccord en parlant, préparer un repas). 59 missions au
  catalogue, dont 14 réservées aux 8 ans et plus.
- Les parents choisissent les missions, valident si besoin, et disposent d'un
  espace dédié : comportement du jour, compliment du jour, semaine papier.
- **Aucun point n'est jamais retiré.** En cas d'incident, l'enfant réalise un
  **geste de réparation**, et c'est ce geste qui est récompensé.
- Multi-familles, temps réel, hors-ligne, quatre langues, hébergement
  européen, aucune publicité.

Déjà construit : comptes, invitations, **parrainage illimité par code
permanent (lien + QR)**, **L'Arbre des familles** (paliers, jauge collective,
tableau d'honneur sur consentement, carte d'ami imprimable), **entonnoir
d'activation** et **réveil trimestriel des familles endormies**, **dépliant A5
pour les écoles**, liste d'attente, espace admin, retours utilisateurs,
statistiques d'usage, export et suppression des données, pages légales,
e-mails transactionnels, tutoriel, espace parents simplifié.

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
| **TAM** | Ménages francophones (BE + FR + CH + LU) avec ≥ 1 enfant de 3 à 12 ans | ≈ **6,3 M** | 50 % |
| **SAM** | Ceux qui cherchent activement un outil de routine/récompense | ≈ **1 000 000** | 40 % |
| **Cible réaliste** | Ce qu'une heure par semaine permet de servir correctement | ≈ **2 000 familles actives** | 50 % |

Méthode : au 1ᵉʳ janvier 2025, la Belgique comptait ≈ **36,7 % de ménages avec
enfants** ([Statbel](https://statbel.fgov.be/en/news/belgium-had-36-one-person-households-01-january-2025)),
soit ≈ 1,8 M. La tranche 3-12 ans couvre **dix années sur les dix-huit** de la
minorité ; à répartition uniforme cela donnerait 56 % des ménages avec enfants,
ramenés à **≈ 50 %** par le même coefficient de prudence que celui appliqué à
l'ancienne tranche — soit **≈ 900 000 ménages belges**. La France en compte
≈ 5,3 M, la Suisse romande et le Luxembourg ≈ 250 000.

**Avertissement sur ce recalcul (certitude 50 %, contre 65 % pour l'ancienne
estimation).** Le passage de 2-7 à 3-12 ans multiplie la cible théorique par
**≈ 1,67**, mais ce facteur est une **dérivation propre**, obtenue en
élargissant la bande d'âge à structure de ménages constante — il ne provient
d'aucune source publiée. Il est à manier avec prudence.

**Et il ne change rien au plan.** La ligne qui gouverne réellement les
décisions est la troisième : **2 000 familles actives**, plafond fixé non par
le marché mais par l'heure hebdomadaire et par la facture Supabase (§ 3.3).
Un marché théorique 1,67 fois plus grand ne desserre ni l'un ni l'autre.

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

**Effet de l'élargissement à 12 ans sur ce tableau (certitude 60 %).** Tant
que la cible s'arrêtait à 7 ans, FamiTeam n'affrontait aucun de ces
concurrents sur leur cœur de cible. En montant à 12 ans, il chevauche
désormais **OurHome** (pensé 8-14) et **NeatKid** (5-8). Deux lectures, et
elles jouent en sens contraire :

- *À notre avantage* : sur cette tranche, les concurrents sont soit datés et
  anglophones (OurHome), soit franchement transactionnels — NeatKid paie les
  corvées en argent de poche, ce qui est l'exact opposé de la doctrine de
  FamiTeam. Un parent qui refuse de monnayer l'entraide n'a, à notre
  connaissance, aucune option francophone.
- *À notre désavantage* : c'est aussi la tranche où l'enfant commence à juger
  ce qu'on lui propose. L'univers de récompense (avatar à chapeaux, cartes
  d'animaux, décompte « en dodos », confettis) a été dessiné pour des petits.
  **Le risque qu'un enfant de 10-12 ans le trouve « bébé » est réel et non
  mesuré.** C'est le premier point à vérifier auprès d'une famille réelle
  avant d'investir quoi que ce soit dans l'acquisition sur cette tranche.

### 2.3 Ce qui distingue réellement FamiTeam

1. **Réparer plutôt que punir** — aucun concurrent n'en fait un principe.
2. **La tranche 3-12 ans en un seul outil** : affichage imagé pour les
   non-lecteurs chez les petits, missions d'initiative chez les grands. Une
   famille n'a pas à changer d'application quand l'aîné grandit — et une
   fratrie de 4 et 11 ans tient dans la même app, chacun à son niveau.
3. **Double boucle** : l'avatar et l'écosystème sont **individuels** (chaque
   enfant a les siens) ; les **cartes FamiTeam** sont le seul dispositif
   **collectif**, où les Cœurs de la fratrie se mettent en commun.
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

### 3.2 bis Ce que le projet coûte réellement

| Poste | Aujourd'hui | Quand cela change |
|---|---|---|
| Nom de domaine (famiteam.com) | 15 €/an | jamais |
| Boîte + SMTP sortant (OVH) | 12 €/an | volume d'envois très élevé |
| Base de données (Supabase) | **0 €** — palier gratuit | ≈ 1 000 familles → ≈ 280 €/an |
| Hébergement du site (Vercel) | **0 €** — palier gratuit | usage commercial (exclu ici) |
| **Total** | **≈ 27 €/an** | **≈ 307 €/an au-delà de 1 000 familles** |

Ces chiffres, les dons reçus et le taux de couverture sont affichés en continu
dans l'onglet Croissance (« Coût, dons et plafond ») : rien à retenir, rien à
recalculer.

### 3.3 Les deux plafonds : le support et la facture

C'est le calcul structurant de ce plan. En supposant que **1 % des familles
actives écrivent chaque mois** et que chaque réponse prenne **5 minutes** :

| Familles actives | Messages/mois | Temps de support | Part de l'heure hebdomadaire |
|---|---|---|---|
| 300 | 3 | ≈ 15 min/mois | 6 % |
| 1 000 | 10 | ≈ 50 min/mois | 20 % |
| **2 000** | **20** | **≈ 1 h 40/mois** | **40 %** |
| 5 000 | 50 | ≈ 4 h/mois | 100 % — plus rien pour le reste |

**Certitude : 50 %** (le taux de sollicitation est une hypothèse). Le plafond
lié au support se situe donc autour de **2 000 familles actives**, et il se
recule uniquement par la FAQ et les réponses types — pas par l'effort.

#### Correction : la limite technique arrive avant celle du support

Mesuré sur la base réelle (14 Mo, 10 familles) : une famille occupe environ
**410 Ko** à son régime stable — 40 Ko d'état courant et ~370 Ko d'historique,
ce dernier étant plafonné à 40 versions par famille. Le palier **gratuit de
Supabase est de 500 Mo**.

| | Plafond | Ce qui se passe au-delà |
|---|---|---|
| Base de données gratuite | **≈ 1 000 familles** | Supabase Pro : ≈ 280 €/an |
| Temps de support | ≈ 2 000 familles | Le service se dégrade |

**C'est donc l'argent qui contraint en premier, pas le support** — l'inverse de
ce que ce plan supposait. Sans dons, le premier vrai choix se présente vers
1 000 familles : payer ≈ 280 €/an de sa poche, ou s'arrêter là. C'est
exactement ce que les dons doivent couvrir, et c'est la seule raison pour
laquelle ils existent.

**Décision.** Plafond fixé à **800 familles**, réglable dans l'admin — une
marge délibérée sous les 1 000, pour voir venir. Il **s'applique tout seul** :
au-delà, les inscriptions basculent en liste d'attente sans intervention.
Attendre son tour est plus honnête qu'un service qui ne suit plus.

### 3.3 bis Ce que la mesure a corrigé : le goulot n'est pas l'acquisition

Relevé sur la base de production le 5 août 2026, sur les dix premières familles :

| Étape | Familles | Part |
|---|---|---|
| Inscrites | 10 | 100 % |
| Ont créé un enfant | 10 | **100 %** |
| Ont essayé au moins une fois | 10 | **100 %** |
| Y sont revenues **trois** fois | 2 | **20 %** |
| Actives sur 30 jours | 2 | 20 % |

**Certitude : 100 %** sur les comptages ; l'interprétation qui suit est à 85 %.

L'accueil ne pose aucun problème : tout le monde entre, crée un enfant et
essaie. **Huit familles sur dix renoncent entre le premier et le troisième
usage.** Et les quatre familles amenées par parrainage se comportent de la même
façon : aucune n'a atteint trois jours d'usage.

Conséquence sur les priorités : **tout euro d'attention consacré à
l'acquisition avant d'avoir réparé le troisième soir est gaspillé.** Le plan
plaçait l'activation en phase 0 — la mesure confirme que c'est bien là, et que
ce chantier n'est pas terminé : l'entonnoir est désormais mesuré et affiché,
mais la cause du décrochage reste à trouver, et la boîte à idées est vide
(aucun retour reçu à ce jour). Il faudra donc la chercher autrement :
observation directe d'une famille, ou question posée à celles qui ont décroché.

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
| **1 — Traction organique** | 🌳 L'Arbre des familles · 📨 Liste d'attente · 💬 Communautés · 📰 Presse & podcasts | cœur |
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
et de **L'Arbre des familles** (qui tourne tout seul une fois branché ; le
détail du dispositif et de ses garde-fous est dans `PLAN-PARRAINAGE.md`). Le contenu et le
référencement, très rentables sur le papier, sont trop lents pour une heure
par semaine : ils attendent — leur guide détaillé et leur socle technique
(fait le 25 août 2026) sont dans `PLAN-SEO.md`.

**Règle d'arrêt.** Tout canal testé trois fois sans résultat est abandonné et
noté comme tel dans l'onglet Croissance.

### Le rituel hebdomadaire

Une heure, même jour, même heure, en quatre semaines type :

| Semaine | Contenu |
|---|---|
| 1 | **Les chiffres** — 10 min de relevé, 50 min sur la prochaine étape |
| 2 | **Un contact** — un seul e-mail de prescripteur, personnalisé, envoyé |
| 3 | **Le produit** — une correction issue des retours des familles |
| 4 | **Les idées** — trier les retours, en faire implémenter un par Claude Code |

Les vagues d'invitations, la relance à J+7, la proposition de parrainage et le
remerciement au parrain **partent seuls** : aucune de ces quatre semaines n'a
à s'en occuper.

---

## 5. Les e-mails

Dix-huit modèles prêts à l'emploi dans `js/croissance.js`, consultables et
copiables dans **Admin → Croissance → Modèles d'e-mails**, chacun rattaché à
l'étape qui le déclenche :

| Moment | Modèles |
|---|---|
| Cadre | **question à la Chambre** (le tout premier envoi du plan) |
| Cycle de vie famille | bienvenue J+0 · relance d'activation J+3 · réveil à 30 j · demande de parrainage · demande de témoignage |
| Liste d'attente | invitation de vague *(automatique, une par mois)* · relance J+7 *(automatique, une seule)* |
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
