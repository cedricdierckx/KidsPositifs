# PLAN-PARRAINAGE — « L'Arbre des familles »

*Comment faire grandir le nombre de parrainages sans trahir l'esprit du projet.*

> **Statut : ✅ mis en œuvre.** Les six lots sont livrés sur `dev`, et les deux
> migrations correspondantes sont **déjà appliquées sur la base de production**
> (`arbre_des_familles_code_permanent_paliers_tableau_honneur` puis
> `arbre_des_familles_search_path_gen_referral_code`). Les trois décisions du § 9 ont été
> tranchées : **« L'Arbre des familles »**, seuil du tableau d'honneur à
> **10 familles consentantes**, **saison annuelle** (année civile).
>
> **Deux écarts au plan ont été assumés en chemin, et ils sont documentés
> ici parce qu'ils corrigent le plan, pas parce qu'ils l'arrangent :**
>
> 1. **Les paliers ne débloquent plus d'espèce d'écosystème ni d'accessoire
>    d'avatar** (§ 2.B annonçait le contraire). Une récompense qui atterrit
>    chez l'enfant rétablit par la fenêtre le lien transactionnel entre son
>    plaisir et une inscription obtenue — exactement ce que le § 1.2 interdit.
>    La reconnaissance reste familiale et visuelle : un arbre qui se couvre de
>    feuilles. Un test verrouille la règle.
> 2. **Le lot 1 a été scindé en deux étapes de chantier** : aucune étape ne peut
>    dépasser 60 minutes, c'est la contrainte du budget d'une séance
>    hebdomadaire, et le test de cohérence du plan de croissance la fait
>    respecter.

---

## 0. L'état des lieux, mesuré et non estimé

Relevé le 4 août 2026 sur la base de production (`Projet FamiTeam`) :

| Grandeur | Valeur |
|---|---|
| Familles inscrites | **10** |
| Familles ouvrant l'app sur 7 jours | **2** |
| Liens de parrainage créés | **30** |
| Filleuls arrivés (famille créée) | **4** |
| Liste d'attente | 0 |
| Plafond en vigueur (§ 3.3 du plan commercial) | 800 familles |

**Certitude : 100 %** — ce sont des `count(*)`, pas des hypothèses.

Trois faits en découlent, et ils commandent tout le reste :

1. **La marge est réelle.** 10 familles pour un plafond de 800 : pousser le
   parrainage est cohérent avec le cadre, il n'y a aucun conflit à cette
   échelle. Le conflit n'apparaîtrait qu'aux alentours de 700.
2. **Le frein n'est pas le nombre de liens, c'est leur rendement.** 30 liens
   créés pour 4 filleuls : le geste « créer un lien » est déjà accompli, c'est
   la transmission qui casse. Un lien à usage unique, régénéré à chaque ami,
   est le suspect n° 1. **Certitude : 65 %.**
3. **Un classement est aujourd'hui impossible à afficher dignement.** Un « top
   10 » sur 10 familles dont 2 actives, c'est un tableau de 2 lignes à 0 ou 1
   filleul. Le dispositif doit donc être **construit maintenant et révélé plus
   tard**, sur seuil automatique (§ 2.C).

---

## 1. Les quatre garde-fous, avant toute mécanique

### 1.1 « Compétition » devient « défi » — et pourquoi ce n'est pas un
recul

La demande dit *compétition entre familles*. Le produit dit, dans son propre
README : « le progrès personnel plutôt que la compétition ». Un classement pur
crée mécaniquement 90 % de perdants : chaque famille hors du top 10 apprend
qu'elle est en bas. C'est l'inverse exact de la doctrine qui interdit déjà de
retirer un seul point à un enfant.

La sortie n'est pas d'abandonner le classement, c'est de **changer ce qui est
comparé** :

| Ce qu'on n'affiche jamais | Ce qu'on affiche à la place |
|---|---|
| « Vous êtes 47ᵉ sur 52 » | « Il vous manque **une** famille pour la branche suivante » |
| Un rang pour tout le monde | Un rang **seulement** pour qui l'a demandé (§ 1.3) |
| Un écart avec les autres | Un écart avec **son propre palier suivant** |
| Un gagnant unique | **Des paliers que tout le monde peut atteindre** (§ 2.B) |

Le top 10 existe donc, mais comme **tableau d'honneur** — un mur de mercis,
pas un podium — et il est doublé d'une **jauge collective** qui fait de la
croissance un objectif commun et non un affrontement. **Certitude que ce
recadrage est nécessaire à la cohérence de la marque : 85 %.**

### 1.2 Ce qu'on ne demandera jamais à un enfant

La demande dit *que les enfants soient stimulés à parler de FamiTeam autour
d'eux*. C'est légitime — c'est même le canal le plus naturel qui existe — mais
il faut poser la limite avec précision, parce qu'elle est à la fois juridique
et éducative.

**Le juridique.** La directive 2005/29/CE (annexe I, point 28) interdit *en
toutes circonstances* d'inciter directement des enfants à acheter, ou à
persuader leurs parents d'acheter. FamiTeam étant gratuite et non marchande,
la lettre du texte ne s'applique probablement pas (**certitude : 70 %**). Mais
un dispositif qui *récompenserait* un enfant de 4 ans pour avoir amené une
famille serait examiné avec sévérité par n'importe quelle autorité de
protection des consommateurs ou des données (**certitude : 90 %**). Et le
RGPD ferme la porte à l'idée voisine : un enfant ne peut pas collecter les
coordonnées d'un camarade.

**L'éducatif.** Rémunérer une conversion en 💛, c'est exactement la « logique
transactionnelle » que le plan commercial reproche à NeatKid. Ce serait
apprendre à un enfant que son amitié a une valeur d'échange.

**La ligne retenue, sans ambiguïté :**

- ✅ L'enfant reçoit **quelque chose à montrer** dont il est fier (sa carte
  d'ami, § 2.F), et voit **l'arbre commun grandir** quand une famille arrive.
- ✅ Une mission de **générosité** entre au catalogue — *faire découvrir un jeu
  à un copain* — rémunérée comme n'importe quelle autre mission, **jamais
  conditionnée à une inscription**.
- ❌ Aucun point, aucun badge, aucun décompte lié à une inscription obtenue.
- ❌ Aucun classement entre enfants, ni au sein d'une famille, ni entre familles.
- ❌ Aucune donnée d'un camarade n'est jamais saisie dans l'app.

La transmission passe donc **par les parents** : l'enfant montre son avatar au
parc, le parent d'en face demande au parent, le parent transmet le lien. C'est
plus lent, et c'est la seule version défendable.

### 1.3 Le classement et le RGPD

`families.name` contient souvent un patronyme (« Famille Dierckx »). L'afficher
dans un classement, c'est **publier une donnée personnelle** : il faut une base
légale, et seul le **consentement** tient ici (art. 6.1.a et 7 RGPD).

Conséquences de conception, non négociables :

- **Opt-in explicite**, décoché par défaut, révocable en un clic ;
- le tableau n'affiche **jamais** `families.name` mais un **pseudonyme
  d'équipe** choisi par la famille (24 caractères, « Les Ouistitis ») ;
- **aucun prénom d'enfant** n'y figure, jamais ;
- le tableau est visible **des familles connectées uniquement**, pas du web
  public — moindre exposition pour le même effet motivant ;
- `REGISTRE-TRAITEMENTS.md` et `confidentialite.html` doivent être complétés
  (art. 30) **dans le même lot** que la mise en service.

**Certitude que ce cadre est requis : 90 %.**

### 1.4 Aucun prix matériel, aucun tirage au sort

Trois raisons convergentes, et elles sont dirimantes :

1. Un colis à expédier suppose une adresse et un expéditeur : **incompatible
   avec l'anonymat du fondateur** (§ 0.2 du plan commercial).
2. Un concours doté relève en Belgique d'un **règlement de concours** et
   frôle la réglementation des loteries. **Certitude : 75 %.**
3. Toute logistique consomme l'heure hebdomadaire, la ressource la plus rare.

Les récompenses sont donc **intégralement dans l'app et gratuites** — et,
correction apportée à la mise en œuvre (voir l'encadré de statut) : elles
restent **familiales**. Ni espèce d'écosystème, ni accessoire d'avatar : tout ce
qui atterrit chez l'enfant rétablirait le lien entre son plaisir et une
inscription obtenue. Il reste l'arbre qui se garnit et la mention au tableau
d'honneur.

---

## 2. Le dispositif retenu : sept briques

### A. Le lien permanent de famille (+ QR) — *la brique qui rapporte le plus*

Aujourd'hui : un clic = un jeton à usage unique. Pour inviter six familles, il
faut six allers-retours. C'est très probablement là que se perdent les 26
liens sans filleul.

Demain : **un code unique et permanent par famille** (`FT-K7M2QX`), donc

- un lien unique à coller dans le groupe WhatsApp de l'école, une fois ;
- un **QR code** affichable à l'écran et imprimable ;
- une ligne `referrals` créée **à l'usage** (au moment où un filleul s'inscrit),
  ce qui rend le décompte exact au lieu d'être gonflé par les liens morts.

Le mécanisme actuel à jeton unique est **conservé** (il sert aux invitations
nominatives). **Gain attendu sur le taux de transmission : ×2 à ×4, certitude
55 %.**

### B. Les paliers d'effort — tout le monde peut gagner

| Filleuls *qualifiés* | Palier | Ce qui se débloque *(tel que livré)* |
|---|---|---|
| 1 | 🌱 **La graine** | Une première feuille sur l'arbre de la famille |
| 3 | 🌿 **La pousse** | L'arbre se garnit ; le palier est nommé dans l'espace parents |
| 5 | 🌳 **L'arbre** | L'arbre se garnit encore |
| 10 | 🏞️ **Le verger** | Arbre complet, et « +N » au-delà de dix feuilles |

*(Le plan annonçait ici des espèces d'écosystème et des accessoires d'avatar :
ils ont été retirés, voir l'encadré de statut en tête de document.)*

Un palier ne se perd jamais (cohérent avec « aucun point n'est jamais
retiré »). Rien ici ne dépend des autres familles : **c'est ce qui rend le
dispositif positif malgré le classement.**

### C. Le tableau d'honneur (top 10) — saisonnier, sur consentement, sous seuil

- **Deux tableaux** : la **saison en cours** (mois calendaire) et **tous les
  temps**. Sans saison, la première famille arrivée gagne à vie et le tableau
  démotive tous les suivants. **Certitude que la saison est indispensable :
  80 %.**
- **Consentement requis** pour y figurer (§ 1.3). Une famille non consentante
  voit son propre compteur et ses paliers, mais n'apparaît pas et **ne se voit
  attribuer aucun rang**.
- **Seuil d'apparition automatique** : le tableau ne s'affiche qu'à partir de
  **10 familles consentantes** (décision du fondateur ; réglable via
  `app_config.classement_seuil`).
  En dessous, seuls les paliers et la jauge sont visibles. Aucune intervention
  manuelle : c'est le même mécanisme que le plafond de familles.
- **Vocabulaire** : « Merci à ces familles », pas « Meilleures familles ». Une
  ligne = un pseudonyme, un nombre, un emoji de palier. Pas de flèches, pas de
  « ▲ 3 places ».

### D. La jauge collective

Une barre unique, la même pour tout le monde : **« Ensemble, nous accompagnons
X familles »**, avec des jalons à 25 / 50 / 100 / 250 / 500. Chaque jalon
franchi déclenche une carte de remerciement pour **toutes** les familles.

Volontairement **pas de jauge vers 800** : afficher un plafond comme objectif,
c'est promettre une fête au moment précis où les inscriptions basculent en
liste d'attente.

### E. La relance des familles actives depuis 7 jours

C'est la demande centrale, et l'existant ne la couvre pas : la proposition
automatique actuelle (`admin_parrainages_a_proposer`) cible les familles
installées depuis **trois semaines**. Une famille convaincue au bout de 7 jours
attend donc 14 jours de trop.

**Définition retenue de « famille convaincue »** : au moins **5 jours
d'ouverture distincts**, et une première ouverture il y a **au moins 7 jours**.
Calculée sur `usage_events` seul — **aucune donnée d'enfant n'est lue**.

Trois gestes, tous automatiques :

1. **Dans l'app** : la carte « beau moment » existante (`blocBonMoment`) est
   doublée d'une variante « 7ᵉ jour », affichée une seule fois, refermable
   définitivement. Le texte ne demande pas *le maximum* de familles : il
   demande **une** famille — *« Qui, autour de vous, mériterait de vivre ça ? »*
   La demande d'un maximum fait fuir ; la demande d'un nom fait agir.
   **Certitude : 70 %.**
2. **Un e-mail** (`m_parrainage_actif`), une seule fois, dans le train des
   envois automatiques existants, avec le lien permanent **déjà inclus** —
   rien à créer, rien à chercher.
3. **Après le premier filleul** : le remerciement existant
   (`feterParrainage`) annonce le palier suivant. C'est le moment où le
   deuxième parrainage coûte le moins cher à obtenir.

### F. Le volet enfant : la carte d'ami

Une **carte imprimable** (une page A5, feuille de style d'impression) portant :

- l'**avatar de l'enfant** tel qu'il l'a construit, en grand ;
- son **prénom** (jamais son nom) ;
- une phrase à sa hauteur : *« Viens jouer avec moi sur FamiTeam »* ;
- des **zones à colorier** — la carte est faite pour être finie à la main ;
- le **QR code du lien permanent de la famille**, discret, en bas.

L'enfant la donne à un copain. Le parent du copain scanne. **Certitude que
c'est le seul format à la fois efficace et défendable pour cet âge : 75 %.**

Et une mission au catalogue, catégorie 🏡 Famille, `ageMin: 4`, 2 💛 :
**« Faire découvrir un jeu à un copain »**. Une vraie compétence sociale, qui
se valide même si personne ne s'inscrit. C'est la condition de son honnêteté.

### G. Le filleul « qui compte » — anti-fraude et alignement

Un classement invite à la fabrication de fausses familles. Le remède est aussi
celui qui aligne le dispositif sur l'étoile du Nord du projet :

> **Un filleul compte quand sa famille est vivante** : famille créée **et**
> app ouverte **3 jours différents**.

Conséquences : créer 20 comptes jetables ne rapporte rien ; et le classement
récompense **les familles bien choisies**, pas le volume de liens. Le compteur
affiché distingue « invitées » et « installées », pour rester lisible.

**Certitude que ce garde-fou est la décision la plus importante du plan : 85 %.**

---

## 3. Ce que cela change en base

```sql
-- Code permanent, un par famille
alter table public.families add column if not exists referral_code text unique;

-- Consentement au tableau d'honneur (décoché par défaut)
alter table public.families add column if not exists classement_optin boolean not null default false;
alter table public.families add column if not exists classement_pseudo text;

-- Trace du code utilisé + saison
alter table public.referrals add column if not exists via_code text;
```

Nouvelles fonctions (toutes `security definer`, `search_path = public`) :

| Fonction | Rôle |
|---|---|
| `referral_code_famille(uuid)` | Crée le code au premier appel, le renvoie ensuite |
| `referral_info_par_code(text)` | Nom du parrain pour la page d'accueil (existant, par code) |
| `claim_referral_code(text, uuid)` | Crée la ligne `referrals` à l'inscription du filleul |
| `parrainage_bilan(uuid)` | Invitées / installées / palier / palier suivant, pour **sa** famille |
| `classement_parrainages(text)` | Top 10 consentants (saison ou tous les temps) + seuil |
| `definir_classement_optin(uuid, boolean, text)` | Consentement + pseudonyme |
| `parrainage_jauge()` | Total collectif + prochain jalon |
| `admin_parrainages_actifs_a_relancer()` | Familles convaincues à 7 jours, 0 filleul, jamais relancées |

Qualification calculée **en direct** (pas de tâche planifiée, pas de colonne à
maintenir) : à 800 familles au maximum, le coût de la requête est négligeable.

**Rien n'est supprimé, rien n'est renommé** : le parrainage à jeton unique
continue de fonctionner pendant et après. Aucune perte de données possible.
**Certitude : 95 %.**

---

## 4. Ce que cela change dans l'app

| Fichier | Nature de la modification |
|---|---|
| `supabase/schema.sql` | 3 colonnes, 8 fonctions, 2 `grant` |
| `js/auth.js` | Lecture du code permanent, `?p=CODE` en plus de `?parrain=`, appel de `claim_referral_code` |
| `js/ui/parrainage.js` | Modale de parrainage refondue (code + QR + partage), section « Arbre des familles » (paliers, jauge, tableau), variante 7ᵉ jour de `blocBonMoment`, carte d'ami imprimable |
| `js/data.js` | 4 badges de palier, 1 mission de générosité |
| `js/app.js` | Attribution des badges de palier dans `verifierBadges` |
| `js/i18n.js` | Clés `arbre.*`, `parr.*` complétées, **4 langues** |
| `css/style.css` | Tableau d'honneur, jauge, `@media print` (n'existe pas encore) |
| `js/croissance.js` | Chantier `c_arbre` en phase 1, 6 étapes |
| `test/run.js` | Paliers, qualification, seuil, parité i18n |
| `REGISTRE-TRAITEMENTS.md`, `confidentialite.html`, `faq.html`, `PLAN-COMMERCIAL.md` | Mise en accord |

Le QR code doit être généré **sans dépendance externe** (aucune n'existe
aujourd'hui dans le projet, et une CDN casserait le hors-ligne) : encodeur
QR minimal en SVG, ≈ 120 lignes. **Certitude que c'est faisable proprement :
80 %.**

---

## 5. Découpage en lots

Un lot = un commit = une chose qui fonctionne seule. Durées au budget d'une
heure par semaine.

| Lot | Contenu | Durée | Modèle recommandé |
|---|---|---|---|
| **1** | Code permanent + QR + modale refondue + `?p=` | 75 min | **Opus 5** — touche `auth.js`, la base et l'inscription ; une erreur ici bloque des créations de compte |
| **2** | Paliers, badges, `parrainage_bilan`, jauge collective | 60 min | **Sonnet 5** — catalogue et affichage, motifs déjà établis |
| **3** | Relance 7ᵉ jour : RPC + carte in-app + e-mail | 50 min | **Sonnet 5** — calque exact de l'automatisation existante |
| **4** | Carte d'ami imprimable + mission de générosité | 55 min | **Sonnet 5** — CSS d'impression et données |
| **5** | Tableau d'honneur : opt-in, pseudonyme, saisons, seuil | 70 min | **Opus 5** — consentement RGPD et exposition de données entre familles |
| **6** | Registre des traitements, confidentialité, FAQ, tests, plan commercial | 45 min | **Sonnet 5** — rédaction et tests |

**Total ≈ 5 h 55, soit six séances.** Les lots 1 à 4 valent déjà à 10 familles.
Les lots 5 et 6 ne produisent d'effet visible qu'au-delà de 20 familles
consentantes — mais le lot 5 doit être écrit **avant** que le seuil ne tombe,
pas pendant.

Ordre impératif : **1 avant 2**, **5 après 6** si le temps manque (on peut
vivre sans tableau ; on ne peut pas afficher un tableau sans registre à jour).

---

## 6. Les cinq chiffres à suivre

| Chiffre | Où | Cible |
|---|---|---|
| Coefficient viral *k* (déjà mesuré) | Croissance | > 0,4 |
| Part des familles actives ayant ≥ 1 filleul installé | Stats *(nouveau)* | > 25 % |
| Taux de transmission (codes partagés ÷ familles actives) | Stats *(nouveau)* | > 50 % |
| Taux d'installation (filleuls installés ÷ invités) | Stats *(nouveau)* | > 40 % |
| Familles consentant au tableau | Stats *(nouveau)* | > 30 % |

Si, trois mois après le lot 3, *k* reste sous 0,2, **la conclusion n'est pas
qu'il faut plus de mécanique** : c'est que le produit n'est pas encore assez
aimé pour être offert. On retire alors le tableau plutôt que d'empiler
(règle `c_activation_5` : « vérifier l'effet, sinon annuler »).

---

## 7. Risques, et la parade

| Risque | Probabilité | Parade, déjà dans le plan |
|---|---|---|
| Le tableau met les familles mal à l'aise | Moyenne | Opt-in, pseudonyme, aucun rang pour les non-inscrits, retrait en un clic |
| Fausses familles pour monter au tableau | Moyenne | Filleul qualifié = 3 jours d'ouverture (§ 2.G) |
| Un enfant se sent responsable d'un échec de recrutement | Faible mais grave | Aucun décompte côté enfant, aucun point lié à une inscription |
| Le succès percute le plafond de 800 | Faible à cette échelle | Bascule automatique en liste d'attente, déjà en place ; le compteur continue de compter les invitées |
| Le lien permanent fuite publiquement | Moyenne | Aucun risque de données : il ne fait que créer une famille tierce. Révocable (régénération du code) |
| Six lots pour un effet nul | Réelle | Les lots 1 et 3 se mesurent seuls en trois semaines ; on s'arrête là si *k* ne bouge pas |

---

## 8. Ce que je recommande de ne pas faire

- **Pas de classement public sur le web.** Bénéfice marketing faible,
  exposition RGPD réelle.
- **Pas de « X places gagnées cette semaine ».** C'est le vocabulaire du jeu
  concurrentiel, celui que le produit refuse ailleurs.
- **Pas de notification poussée pour relancer un parrainage.** La règle
  « sollicitations naturellement rares » l'interdit.
- **Pas de récompense à l'enfant pour une inscription obtenue** (§ 1.2).
- **Pas de tirage au sort, pas de lot** (§ 1.4).

---

## 9. Trois décisions à trancher

1. **Le mot.** *« L'Arbre des familles »* (proposé, cohérent avec l'écosystème
   déjà présent) ou *« La Chaîne des familles »* (le badge `eco_chaine` existe
   déjà, risque de confusion) ? → **Retenu : L'Arbre des familles.**
2. **Le seuil du tableau d'honneur.** 20 familles consentantes serait un choix
   de prudence ; 10 le rend visible plus vite, au risque d'un tableau maigre.
   → **Retenu : 10.**
3. **La saison.** Mensuelle (proposé à l'origine) ou trimestrielle — une saison courte
   relance souvent, une saison longue laisse le temps d'y arriver.
   → **Retenu d'abord : mensuelle. Révisé ensuite : annuelle (année civile).**
   Un mois s'est avéré trop court pour qu'une famille ait le temps d'en amener
   plusieurs : le tableau repartait de zéro avant d'avoir pris. L'année laisse
   le temps de construire, sans qu'une première place se gagne à vie.

**Réponses données :** *L'Arbre des familles*, **seuil 10**, **saison
annuelle**. Le seuil est réglable sans migration
(`app_config.classement_seuil`) ; la saison est calculée à la volée.

---

## 10. Ce qui reste à faire de la main du fondateur

Le code est en place ; deux gestes ne peuvent pas être automatisés :

| Geste | État |
|---|---|
| Appliquer le schéma sur la base de production | ✅ **fait** — deux migrations, compteurs vérifiés identiques avant/après, et **aucune famille inscrite au tableau d'honneur par la migration** (0 consentement, 0 pseudonyme) |
| Déployer le code applicatif sur `main` | ⏳ à décider — le dispositif est sur `dev` |
| Armer les envois automatiques (`app_config.mails_auto`) | ⏳ à vérifier — l'e-mail du 7ᵉ jour ne partira pas tant que l'interrupteur est fermé, c'est le garde-fou voulu |

Et une vérification à faire une fois en production : **imprimer réellement une
carte d'ami et scanner son QR code avec un téléphone.** Le code a été validé par
un décodeur indépendant après rendu navigateur, mais l'encre sur le papier est
le seul juge de la taille retenue (30 mm de côté).

---

## 11. Ce que la mise en production a révélé, et qui déplace le diagnostic

Le § 0 attribuait le faible rendement à la **transmission** du lien (certitude
65 %). La mesure faite après application oblige à corriger.

Les quatre filleuls arrivés totalisent, **toutes sources de preuve de vie
réunies** (jours d'ouverture mesurés, jours d'archivage d'état, dernière
activité), **1, 0, 2 et 1 jours de vie**. Aucun n'atteint les trois jours de la
règle de qualification. L'un n'a même jamais créé de profil d'enfant.

Ce n'est pas un défaut de mesure : `usage_events` ne collecte que depuis le
25 juillet 2026, mais les deux autres sources sont bien antérieures et
concordent. **Certitude : 90 %.**

Conséquence : **le lien de parrainage fonctionnait déjà** — quatre familles ont
bien été créées — **mais aucune n'a pris**. Le goulot n'est donc pas seulement
la transmission, c'est l'**activation de la famille invitée**. Le chantier
`c_activation` devient au moins aussi important que celui-ci, et l'Arbre des
familles n'en produira son effet plein qu'une fois l'activation réparée.

Corollaire pratique : **l'arbre affichera zéro feuille pour tout le monde au
premier jour.** C'est voulu, et c'est honnête — mais il faut le savoir avant de
conclure que le dispositif ne marche pas.
