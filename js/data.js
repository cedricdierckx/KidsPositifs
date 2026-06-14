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
 *  RÉCOMPENSE FAMILLE — Avatar vectoriel (SVG) personnalisable
 * ---------------------------------------------------------------------
 *  Chaque élément est dessiné à des coordonnées fixes (voir js/avatar.js),
 *  donc tout reste parfaitement aligné (yeux, lunettes, chapeau…).
 *  Les éléments se débloquent avec les Cœurs 💛.
 *  L'ordre des catégories ci-dessous est l'ordre d'affichage.
 * ===================================================================== */
const AVATAR_OPTIONS = {
  peau: [
    { id: "clair",  nom: "Clair",  cout: 0, hex: "#ffd9b3" },
    { id: "mate",   nom: "Mate",   cout: 0, hex: "#f0bd84" },
    { id: "doree",  nom: "Dorée",  cout: 0, hex: "#d99a5b" },
    { id: "brune",  nom: "Brune",  cout: 0, hex: "#a96b3e" },
    { id: "foncee", nom: "Foncée", cout: 0, hex: "#7a4a28" }
  ],
  coiffure: [
    { id: "court",    nom: "Cheveux courts", cout: 0 },
    { id: "couettes", nom: "Couettes",       cout: 0 },
    { id: "frange",   nom: "Frange",         cout: 0 },
    { id: "chignon",  nom: "Chignon",        cout: 10 },
    { id: "long",     nom: "Cheveux longs",  cout: 15 },
    { id: "boucle",   nom: "Bouclés",        cout: 15 },
    { id: "crete",    nom: "Crête",          cout: 25 },
    { id: "chauve",   nom: "Sans cheveux",   cout: 0 }
  ],
  cheveux: [
    { id: "brun",   nom: "Brun",   cout: 0,  hex: "#5b3a23" },
    { id: "noir",   nom: "Noir",   cout: 0,  hex: "#1c1c22" },
    { id: "blond",  nom: "Blond",  cout: 0,  hex: "#e7c067" },
    { id: "roux",   nom: "Roux",   cout: 10, hex: "#c2562d" },
    { id: "blanc",  nom: "Blanc",  cout: 12, hex: "#eef0f4" },
    { id: "rose",   nom: "Rose",   cout: 20, hex: "#ff7eb6" },
    { id: "bleu",   nom: "Bleu",   cout: 20, hex: "#4cb3e6" },
    { id: "vert",   nom: "Vert",   cout: 20, hex: "#5fc97a" }
  ],
  yeux: [
    { id: "ronds",   nom: "Ronds",      cout: 0 },
    { id: "joyeux",  nom: "Joyeux",     cout: 0 },
    { id: "clin",    nom: "Clin d'œil", cout: 10 },
    { id: "etoiles", nom: "Étoilés",    cout: 20 },
    { id: "coeur",   nom: "Cœurs",      cout: 20 }
  ],
  lunettes: [
    { id: "rien",    nom: "Aucunes",          cout: 0 },
    { id: "rondes",  nom: "Lunettes rondes",  cout: 10 },
    { id: "soleil",  nom: "Lunettes soleil",  cout: 12 },
    { id: "etoile",  nom: "Lunettes étoiles", cout: 25 }
  ],
  taches: [
    { id: "rien",   nom: "Aucune",            cout: 0 },
    { id: "taches", nom: "Taches de rousseur", cout: 8 }
  ],
  pilosite: [
    { id: "rien",      nom: "Aucune",     cout: 0 },
    { id: "moustache", nom: "Moustache",  cout: 15 },
    { id: "barbe",     nom: "Barbe",      cout: 20 }
  ],
  boucles: [
    { id: "rien",    nom: "Aucune",           cout: 0 },
    { id: "perles",  nom: "Perles",           cout: 12 },
    { id: "anneaux", nom: "Anneaux dorés",    cout: 12 },
    { id: "etoiles", nom: "Étoiles",          cout: 18 },
    { id: "coeurs",  nom: "Cœurs",            cout: 18 }
  ],
  chapeau: [
    { id: "rien",      nom: "Aucun",          cout: 0 },
    { id: "noeud",     nom: "Nœud",           cout: 8,  hex: "#ff6f91" },
    { id: "casquette", nom: "Casquette",      cout: 12, hex: "#3a7bd5" },
    { id: "bonnet",    nom: "Bonnet",         cout: 12, hex: "#e05a47" },
    { id: "couronne",  nom: "Couronne",       cout: 35, hex: "#f2c11b" },
    { id: "hautform",  nom: "Haut-de-forme",  cout: 25, hex: "#2b2b35" },
    { id: "diademe",   nom: "Diadème",        cout: 30, hex: "#7ed0ff" }
  ],
  accessoire: [
    { id: "rien",     emoji: "",    nom: "Aucun",   cout: 0 },
    { id: "fleur",    emoji: "🌸",  nom: "Fleur",   cout: 8 },
    { id: "ballon",   emoji: "🎈",  nom: "Ballon",  cout: 10 },
    { id: "etoile",   emoji: "⭐",  nom: "Étoile",  cout: 12 },
    { id: "baguette", emoji: "🪄",  nom: "Baguette magique", cout: 20 },
    { id: "guitare",  emoji: "🎸",  nom: "Guitare", cout: 30 },
    { id: "epee",     emoji: "⚔️",  nom: "Épée",    cout: 30 }
  ],
  compagnon: [
    { id: "rien",     emoji: "",    nom: "Aucun",     cout: 0 },
    { id: "chat",     emoji: "🐱",  nom: "Chaton",    cout: 20 },
    { id: "chien",    emoji: "🐶",  nom: "Chien",     cout: 20 },
    { id: "lapin",    emoji: "🐰",  nom: "Lapin",     cout: 20 },
    { id: "oiseau",   emoji: "🐦",  nom: "Oiseau",    cout: 18 },
    { id: "papillon", emoji: "🦋",  nom: "Papillon",  cout: 22 },
    { id: "dino",     emoji: "🦕",  nom: "Dinosaure", cout: 45 }
  ],
  fond: [
    { id: "ciel",      nom: "Ciel",      cout: 0,  hex: "#bfe3ff", motif: "" },
    { id: "nuit",      nom: "Nuit",      cout: 15, hex: "#34406e", motif: "🌙" },
    { id: "foret",     nom: "Forêt",     cout: 15, hex: "#cdeccf", motif: "🌳" },
    { id: "plage",     nom: "Plage",     cout: 20, hex: "#ffe7ad", motif: "🏖️" },
    { id: "arcenciel", nom: "Arc-en-ciel", cout: 35, hex: "#ffd6ec", motif: "🌈" },
    { id: "ocean",     nom: "Océan",     cout: 20, hex: "#9fe3e8", motif: "🐠" },
    { id: "bonbon",    nom: "Bonbons",   cout: 30, hex: "#ffd1e8", motif: "🍭" },
    { id: "ferme",     nom: "Ferme",     cout: 18, hex: "#bfe6a0", motif: "🐮" },
    { id: "espace",    nom: "Espace",    cout: 40, hex: "#241a52", motif: "⭐" }
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
