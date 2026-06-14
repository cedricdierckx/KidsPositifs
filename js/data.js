/* =====================================================================
 * KidsPositifs — Données de configuration
 * ---------------------------------------------------------------------
 * Inspiration pédagogique « Papa Positive » :
 *  - On valorise l'effort et la coopération, jamais la performance.
 *  - On ne retire JAMAIS de points (pas de punition par les points).
 *  - On dissuade les comportements négatifs par l'encouragement de
 *    leur opposé positif et par des « défis réparation » bienveillants.
 *  - Chaque enfant progresse à son rythme (programme évolutif par âge).
 * ===================================================================== */

/* ---- Les enfants (modifiables dans les Réglages) -------------------
 * naissance : date complète au format AAAA-MM-JJ
 * sexe      : "fille" ou "garcon"
 * ------------------------------------------------------------------- */
const ENFANTS_DEFAUT = [
  { id: "e2018", prenom: "Aîné(e)",   naissance: "2018-01-01", sexe: "garcon", emoji: "🧒", couleur: "#5b8def" },
  { id: "e2019", prenom: "Second(e)", naissance: "2019-01-01", sexe: "fille",  emoji: "👦", couleur: "#39c0a0" },
  { id: "e2021", prenom: "Troisième", naissance: "2021-01-01", sexe: "garcon", emoji: "🧑", couleur: "#f6a623" },
  { id: "e2023", prenom: "Petit(e)",  naissance: "2023-01-01", sexe: "fille",  emoji: "👶", couleur: "#e26d9b" }
];

/* ---- Catégories ---------------------------------------------------- */
const CATEGORIES = {
  famille: {
    id: "famille",
    nom: "Famille",
    emoji: "🏡",
    couleur: "#f6a623",
    monnaie: "Cœurs",
    monnaieEmoji: "💛",
    description: "Coups de cœur gagnés en aidant et en prenant soin des autres. Ils permettent de faire évoluer ton avatar !"
  },
  planete: {
    id: "planete",
    nom: "Planète",
    emoji: "🌍",
    couleur: "#39c0a0",
    monnaie: "Gouttes",
    monnaieEmoji: "💧",
    description: "Gouttes de vie gagnées en protégeant la nature. Elles font pousser ta graine en tout un écosystème !"
  }
};

/* ---- Tâches / comportements positifs ------------------------------
 * ageMin : âge minimum conseillé pour proposer la mission.
 * points : nombre de jetons gagnés.
 * type   : "quotidien" (renouvelable chaque jour) ou "ponctuel".
 * ------------------------------------------------------------------- */
const MISSIONS = [
  /* ---------------- FAMILLE ---------------- */
  { id: "table_mettre",  cat: "famille", emoji: "🍽️", titre: "Mettre la table",          ageMin: 3, points: 2, type: "quotidien" },
  { id: "table_debarr",  cat: "famille", emoji: "🧽", titre: "Débarrasser la table",      ageMin: 3, points: 2, type: "quotidien" },
  { id: "manger_propre", cat: "famille", emoji: "😋", titre: "Manger proprement",         ageMin: 2, points: 1, type: "quotidien" },
  { id: "ranger_chambre",cat: "famille", emoji: "🧸", titre: "Ranger sa chambre",         ageMin: 3, points: 3, type: "quotidien" },
  { id: "entraide",      cat: "famille", emoji: "🤝", titre: "Aider un frère/une sœur",   ageMin: 2, points: 3, type: "quotidien" },
  { id: "dire_merci",    cat: "famille", emoji: "🙏", titre: "Dire merci / s'il te plaît",ageMin: 2, points: 1, type: "quotidien" },
  { id: "calin",         cat: "famille", emoji: "🤗", titre: "Faire un câlin / réconforter",ageMin: 2, points: 1, type: "quotidien" },
  { id: "habiller_seul", cat: "famille", emoji: "👕", titre: "S'habiller tout(e) seul(e)",ageMin: 3, points: 2, type: "quotidien" },
  { id: "dents",         cat: "famille", emoji: "🪥", titre: "Se brosser les dents",       ageMin: 2, points: 1, type: "quotidien" },
  { id: "linge_panier",  cat: "famille", emoji: "🧺", titre: "Mettre son linge sale au panier", ageMin: 2, points: 1, type: "quotidien" },
  { id: "calme_colere",  cat: "famille", emoji: "🌬️", titre: "Se calmer en respirant",    ageMin: 4, points: 3, type: "quotidien" },
  { id: "ecouter",       cat: "famille", emoji: "👂", titre: "Écouter du premier coup",   ageMin: 4, points: 2, type: "quotidien" },

  /* ---------------- PLANÈTE ---------------- */
  { id: "lumiere",       cat: "planete", emoji: "💡", titre: "Éteindre la lumière",       ageMin: 2, points: 1, type: "quotidien" },
  { id: "eau_robinet",   cat: "planete", emoji: "🚰", titre: "Fermer le robinet",         ageMin: 2, points: 1, type: "quotidien" },
  { id: "pas_gaspiller", cat: "planete", emoji: "🍎", titre: "Finir son assiette / ne pas gaspiller", ageMin: 3, points: 2, type: "quotidien" },
  { id: "tri_dechets",   cat: "planete", emoji: "♻️", titre: "Trier les déchets",         ageMin: 4, points: 2, type: "quotidien" },
  { id: "compost",       cat: "planete", emoji: "🥕", titre: "Mettre au compost",         ageMin: 4, points: 1, type: "quotidien" },
  { id: "marche_velo",   cat: "planete", emoji: "🚲", titre: "Y aller à pied ou à vélo",  ageMin: 3, points: 2, type: "ponctuel" },
  { id: "arroser",       cat: "planete", emoji: "🪴", titre: "Arroser les plantes",       ageMin: 3, points: 2, type: "quotidien" },
  { id: "ramasser",      cat: "planete", emoji: "🧤", titre: "Ramasser un déchet dehors", ageMin: 3, points: 2, type: "ponctuel" },
  { id: "gourde",        cat: "planete", emoji: "🥤", titre: "Utiliser sa gourde",        ageMin: 2, points: 1, type: "quotidien" }
];

/* ---- Défis « réparation » (alternative bienveillante à la punition)
 * Quand un comportement négatif apparaît, on ne retire pas de points :
 * on propose à l'enfant un petit défi positif pour réparer / apprendre.
 * ------------------------------------------------------------------- */
const DEFIS_REPARATION = [
  { id: "rep_ranger",  emoji: "🧹", titre: "Je répare : je range ce que j'ai fait tomber", bonus: 1 },
  { id: "rep_pardon",  emoji: "💬", titre: "Je répare : je présente mes excuses",          bonus: 1 },
  { id: "rep_calin",   emoji: "🤗", titre: "Je répare : je fais un geste doux",            bonus: 1 },
  { id: "rep_aide",    emoji: "🤝", titre: "Je répare : j'aide la personne concernée",     bonus: 2 }
];

/* =====================================================================
 *  RÉCOMPENSE FAMILLE — Avatar évolutif
 *  L'enfant débloque des éléments d'avatar avec ses Cœurs.
 * ===================================================================== */
const AVATAR_OPTIONS = {
  base: [
    { id: "fille",  emoji: "👧", nom: "Visage fille",  cout: 0 },
    { id: "garcon", emoji: "👦", nom: "Visage garçon", cout: 0 },
    { id: "bebe",   emoji: "👶", nom: "Bébé",          cout: 0 },
    { id: "robot",  emoji: "🤖", nom: "Robot",         cout: 25 },
    { id: "licorne",emoji: "🦄", nom: "Licorne",       cout: 40 },
    { id: "chat",   emoji: "🐱", nom: "Chaton",        cout: 30 },
    { id: "dragon", emoji: "🐲", nom: "Dragon",        cout: 60 }
  ],
  chapeau: [
    { id: "rien",     emoji: "",   nom: "Sans chapeau", cout: 0 },
    { id: "casquette",emoji: "🧢", nom: "Casquette",    cout: 10 },
    { id: "couronne", emoji: "👑", nom: "Couronne",     cout: 35 },
    { id: "hautform", emoji: "🎩", nom: "Haut-de-forme",cout: 20 },
    { id: "graduation",emoji: "🎓",nom: "Diplôme",      cout: 25 }
  ],
  accessoire: [
    { id: "rien",    emoji: "",   nom: "Aucun",        cout: 0 },
    { id: "lunettes",emoji: "🕶️", nom: "Lunettes",     cout: 10 },
    { id: "etoile",  emoji: "⭐", nom: "Étoile",       cout: 15 },
    { id: "ballon",  emoji: "🎈", nom: "Ballon",       cout: 12 },
    { id: "guitare", emoji: "🎸", nom: "Guitare",      cout: 30 },
    { id: "epee",    emoji: "⚔️", nom: "Épée",         cout: 30 }
  ],
  compagnon: [
    { id: "rien",   emoji: "",   nom: "Aucun",      cout: 0 },
    { id: "chien",  emoji: "🐶", nom: "Chien",      cout: 20 },
    { id: "lapin",  emoji: "🐰", nom: "Lapin",      cout: 20 },
    { id: "oiseau", emoji: "🐦", nom: "Oiseau",     cout: 18 },
    { id: "dino",   emoji: "🦕", nom: "Dinosaure",  cout: 45 },
    { id: "papillon",emoji: "🦋",nom: "Papillon",   cout: 22 }
  ],
  fond: [
    { id: "ciel",    emoji: "🌤️", nom: "Ciel",      cout: 0 },
    { id: "nuit",    emoji: "🌙", nom: "Nuit étoilée",cout: 15 },
    { id: "plage",   emoji: "🏖️", nom: "Plage",     cout: 20 },
    { id: "espace",  emoji: "🚀", nom: "Espace",     cout: 40 },
    { id: "chateau", emoji: "🏰", nom: "Château",    cout: 35 }
  ]
};

/* =====================================================================
 *  RÉCOMPENSE PLANÈTE — Écosystème éducatif (chaîne alimentaire)
 * ---------------------------------------------------------------------
 *  L'enfant CONSTRUIT son écosystème dans l'ordre de la nature :
 *   1) Les PLANTES (les producteurs : elles captent la lumière du soleil)
 *   2) Les HERBIVORES — débloqués seulement quand il y a assez de plantes
 *      (les plantes les nourrissent)
 *   3) Les CARNIVORES — débloqués seulement quand il y a assez d'herbivores
 *      (les herbivores les nourrissent)
 *  À chaque étape l'enfant a plusieurs CHOIX d'espèces à créer.
 *  Chaque création coûte des Gouttes 💧 (monnaie dépensable).
 *
 *  TIERS_ECO est ORDONNÉ : chaque niveau exige une quantité minimale
 *  d'êtres vivants du niveau précédent (champ `requis`).
 * ===================================================================== */
const TIERS_ECO = [
  {
    id: "plantes",
    nom: "Plantes",
    emoji: "🌱",
    requis: 0,            // toujours disponible
    lecon: "Tout commence par les plantes 🌱 : grâce au soleil, elles fabriquent leur propre nourriture. Ce sont elles qui nourrissent tout l'écosystème.",
    especes: [
      { id: "herbe",  emoji: "🌿", nom: "Herbe",   cout: 3 },
      { id: "trefle", emoji: "🍀", nom: "Trèfle",  cout: 3 },
      { id: "fleur",  emoji: "🌷", nom: "Fleur",   cout: 4 },
      { id: "ble",    emoji: "🌾", nom: "Blé",     cout: 4 },
      { id: "arbre",  emoji: "🌳", nom: "Arbre",   cout: 6 }
    ]
  },
  {
    id: "herbivores",
    nom: "Herbivores",
    emoji: "🐰",
    requis: 4,            // il faut au moins 4 plantes
    lecon: "Les herbivores 🐰 mangent les plantes. Il faut donc assez de plantes pour les nourrir avant qu'ils arrivent !",
    especes: [
      { id: "escargot", emoji: "🐌", nom: "Escargot", cout: 4 },
      { id: "abeille",  emoji: "🐝", nom: "Abeille",  cout: 5 },
      { id: "papillon", emoji: "🦋", nom: "Papillon", cout: 5 },
      { id: "lapin",    emoji: "🐰", nom: "Lapin",    cout: 7 },
      { id: "cerf",     emoji: "🦌", nom: "Cerf",     cout: 9 }
    ]
  },
  {
    id: "carnivores",
    nom: "Carnivores",
    emoji: "🦊",
    requis: 4,            // il faut au moins 4 herbivores
    lecon: "Les carnivores 🦊 mangent les herbivores. Une fois qu'ils sont là, la chaîne alimentaire est complète : plantes → herbivores → carnivores !",
    especes: [
      { id: "herisson", emoji: "🦔", nom: "Hérisson", cout: 7 },
      { id: "serpent",  emoji: "🐍", nom: "Serpent",  cout: 8 },
      { id: "hibou",    emoji: "🦉", nom: "Hibou",    cout: 9 },
      { id: "renard",   emoji: "🦊", nom: "Renard",   cout: 10 },
      { id: "aigle",    emoji: "🦅", nom: "Aigle",    cout: 12 }
    ]
  }
];

/* ---- Phrases d'encouragement (pédagogie positive) ----------------- */
const ENCOURAGEMENTS = [
  "Bravo, tu peux être fier(e) de toi ! 🌟",
  "Quel beau geste, merci ! 💛",
  "Tu as fait un vrai effort, ça se voit ! 👏",
  "Grâce à toi la maison est plus belle ! 🏡",
  "Tu prends soin des autres, c'est précieux ! 🤗",
  "La planète te dit merci ! 🌍",
  "Petit à petit, tu deviens un(e) grand(e) ! 🚀",
  "Ton cœur est rempli de gentillesse ! 💖"
];
