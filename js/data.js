/* =====================================================================
 * FamiTeam — Données de configuration
 * ---------------------------------------------------------------------
 * Inspiration pédagogique (parentalité positive et bienveillante) :
 *  - On valorise l'effort et la coopération, jamais la performance.
 *  - On ne retire JAMAIS de points (pas de punition par les points).
 *  - On dissuade les comportements négatifs par l'encouragement de
 *    leur opposé positif et par des « défis réparation » bienveillants.
 *  - Chaque enfant progresse à son rythme (programme évolutif par âge).
 * ===================================================================== */

/* ---- Nom de l'application (défini à un seul endroit) --------------- */
const APP_NOM = "FamiTeam";

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
  { id: "lit_faire",     cat: "famille", emoji: "🛏️", titre: "Faire son lit",            ageMin: 3, points: 2, type: "quotidien" },
  { id: "ranger_jouets", cat: "famille", emoji: "🧹", titre: "Ranger les jouets",         ageMin: 2, points: 2, type: "quotidien" },
  { id: "partager",      cat: "famille", emoji: "🤲", titre: "Partager un jouet",         ageMin: 2, points: 2, type: "quotidien" },
  { id: "jouer_calme",   cat: "famille", emoji: "🧩", titre: "Jouer calmement",           ageMin: 2, points: 1, type: "quotidien" },
  { id: "chaussures",    cat: "famille", emoji: "👟", titre: "Mettre ses chaussures seul", ageMin: 3, points: 1, type: "quotidien" },
  { id: "aider_cuisine", cat: "famille", emoji: "🍳", titre: "Aider à cuisiner",          ageMin: 4, points: 2, type: "quotidien" },
  { id: "histoire",      cat: "famille", emoji: "📖", titre: "Écouter/lire une histoire", ageMin: 2, points: 1, type: "quotidien" },
  { id: "bonjour",       cat: "famille", emoji: "👋", titre: "Dire bonjour / au revoir",  ageMin: 2, points: 1, type: "quotidien" },
  { id: "aider_courses", cat: "famille", emoji: "🛒", titre: "Aider aux courses",         ageMin: 4, points: 2, type: "ponctuel" },
  { id: "coucher_lheure",cat: "famille", emoji: "🌙", titre: "Aller au lit à l'heure", ageMin: 2, points: 2, type: "quotidien", speciale: "coucher" },
  { id: "se_laver",      cat: "famille", emoji: "🛁", titre: "Se laver / prendre le bain", ageMin: 2, points: 1, type: "quotidien" },
  // --- Tâches pour les plus grands ---
  { id: "devoirs",       cat: "famille", emoji: "📚", titre: "Faire ses devoirs",          ageMin: 6, points: 3, type: "quotidien" },
  { id: "cartable",      cat: "famille", emoji: "🎒", titre: "Préparer son cartable",      ageMin: 5, points: 2, type: "quotidien" },
  { id: "plier_linge",   cat: "famille", emoji: "🧦", titre: "Ranger / plier son linge",   ageMin: 6, points: 2, type: "quotidien" },
  { id: "poubelle",      cat: "famille", emoji: "🗑️", titre: "Sortir les poubelles",      ageMin: 7, points: 2, type: "ponctuel" },

  /* ---------------- PLANÈTE ---------------- */
  { id: "lumiere",       cat: "planete", emoji: "💡", titre: "Éteindre la lumière",       ageMin: 2, points: 1, type: "quotidien" },
  { id: "eau_robinet",   cat: "planete", emoji: "🚰", titre: "Fermer le robinet",         ageMin: 2, points: 1, type: "quotidien" },
  { id: "pas_gaspiller", cat: "planete", emoji: "🍎", titre: "Finir son assiette / ne pas gaspiller", ageMin: 3, points: 2, type: "quotidien" },
  { id: "tri_dechets",   cat: "planete", emoji: "♻️", titre: "Trier les déchets",         ageMin: 4, points: 2, type: "quotidien" },
  { id: "compost",       cat: "planete", emoji: "🥕", titre: "Mettre au compost",         ageMin: 4, points: 1, type: "quotidien" },
  { id: "marche_velo",   cat: "planete", emoji: "🚲", titre: "Y aller à pied ou à vélo",  ageMin: 3, points: 2, type: "ponctuel" },
  { id: "arroser",       cat: "planete", emoji: "🪴", titre: "Arroser les plantes",       ageMin: 3, points: 2, type: "quotidien" },
  { id: "ramasser",      cat: "planete", emoji: "🧤", titre: "Ramasser un déchet dehors", ageMin: 3, points: 2, type: "ponctuel" },
  { id: "gourde",        cat: "planete", emoji: "🥤", titre: "Utiliser sa gourde",        ageMin: 2, points: 1, type: "quotidien" },
  { id: "douche_courte", cat: "planete", emoji: "🚿", titre: "Prendre une douche courte", ageMin: 4, points: 1, type: "quotidien" },
  { id: "jardiner",      cat: "planete", emoji: "🌻", titre: "Jardiner / semer",          ageMin: 3, points: 2, type: "ponctuel" },
  { id: "oiseaux",       cat: "planete", emoji: "🐦", titre: "Nourrir les oiseaux",       ageMin: 3, points: 1, type: "quotidien" },
  { id: "ecrans",        cat: "planete", emoji: "📺", titre: "Éteindre les écrans",       ageMin: 3, points: 1, type: "quotidien" },
  { id: "animaux",       cat: "planete", emoji: "🐾", titre: "S'occuper des animaux",     ageMin: 2, points: 2, type: "quotidien" },
  { id: "recup",         cat: "planete", emoji: "📦", titre: "Réutiliser au lieu de jeter", ageMin: 4, points: 1, type: "ponctuel" },
  // --- Tâches pour les plus grands ---
  { id: "chauffage",     cat: "planete", emoji: "🌡️", titre: "Baisser le chauffage",      ageMin: 6, points: 1, type: "quotidien" },
  { id: "transports",    cat: "planete", emoji: "🚌", titre: "Prendre les transports en commun", ageMin: 6, points: 2, type: "ponctuel" }
];

/* ---- Priorité des missions pour la sélection PAR DÉFAUT ------------
 * Plus le chiffre est petit, plus la mission est jugée essentielle.
 * Par défaut (si les parents n'ont rien réglé), on propose les missions
 * adaptées à l'âge les plus prioritaires (5 à 10 par catégorie).
 * ------------------------------------------------------------------- */
const PRIO_DEFAUT = {
  // Famille
  dents: 1, ranger_jouets: 1, coucher_lheure: 1, dire_merci: 2, manger_propre: 2,
  partager: 2, entraide: 2, ranger_chambre: 2, table_mettre: 3, calin: 3,
  bonjour: 3, habiller_seul: 3, ecouter: 3, se_laver: 3, table_debarr: 4,
  histoire: 4, lit_faire: 4, jouer_calme: 4, calme_colere: 4, chaussures: 5,
  linge_panier: 5, aider_cuisine: 6, aider_courses: 7,
  devoirs: 2, cartable: 3, plier_linge: 4, poubelle: 5,
  // Planète
  lumiere: 1, eau_robinet: 1, gourde: 2, pas_gaspiller: 2, tri_dechets: 2,
  ecrans: 3, arroser: 3, compost: 3, douche_courte: 3, oiseaux: 4,
  animaux: 2, marche_velo: 4, ramasser: 4, jardiner: 5, recup: 5,
  chauffage: 3, transports: 4
};
const NB_DEFAUT_PAR_CAT = 8; // nombre de missions proposées par défaut par catégorie

/* ---- Budget de temps d'usage (≈ 3 minutes / jour maximum) ----------
 * Pour rester fidèle à l'esprit « peu d'écran », la sélection PAR DÉFAUT
 * de missions est limitée selon l'âge : peu de tâches chez les petits,
 * un peu plus chez les grands. Cocher tout reste possible côté parent.
 * ------------------------------------------------------------------- */
const BUDGET_MIN_JOUR = 3;     // minutes d'usage app/jour visées
// Nombre total de missions/jour conseillé par âge (cochable en ~3 min).
const TACHES_PAR_AGE = [
  { max: 3, n: 8 },   // ≤ 3 ans : 8 tâches
  { max: 5, n: 10 },  // 4-5 ans : 10
  { max: 7, n: 12 },  // 6-7 ans : 12
  { max: 99, n: 14 }  // 8 ans + : 14
];

/* =====================================================================
 *  TABLEAU DE BORD « SCIENCE » (admin) — paramètres fondés sur la
 *  recherche en psychologie, pédagogie et neurologie.
 * ---------------------------------------------------------------------
 *  Source de vérité unique, ajustable par l'administrateur (et un comité
 *  d'experts) pour refléter l'état de la science. Stocké dans app_config
 *  (clé "science") ; les valeurs ci-dessous sont les défauts.
 * ===================================================================== */
const SCIENCE_DEFAUT = {
  // — Temps d'écran (neurologie / pédiatrie) —
  budgetMinJour: 3,                 // minutes d'app/jour visées
  tachesParAge: [                   // nb de tâches/jour conseillé par âge
    { max: 3, n: 8 }, { max: 5, n: 10 }, { max: 7, n: 12 }, { max: 99, n: 14 }
  ],
  partFamille: 0.6,                 // répartition Famille/Planète du budget
  // — Incentives sains (psychologie de la motivation) —
  pointsMax: 5,                     // plafond conseillé de points par tâche (évite la surenchère)
  celebrer: true,                   // micro-célébrations (confettis) : oui/non
  // — Âge minimal conseillé par mission (override le catalogue) —
  ageMission: {},                   // { missionId: ageMin }
  // — Repères & propositions par discipline (texte affiché aux parents) —
  principes: {
    psychologie: [
      "Renforcement positif : on valorise les progrès, jamais de punition ni de retrait de points.",
      "Autonomie & sentiment de compétence : l'enfant choisit et coche lui-même ses missions.",
      "Récompenses non matérielles (avatar, écosystème) pour préserver la motivation intrinsèque."
    ],
    pedagogie: [
      "Peu de tâches à la fois, adaptées à l'âge, pour rester atteignables.",
      "Régularité douce : un petit rituel quotidien ou tous les 2-3 jours suffit.",
      "Le suivi papier est encouragé ; l'app sert de mémoire, pas d'outil quotidien d'écran."
    ],
    neurologie: [
      "Limiter fortement le temps d'écran chez les jeunes enfants (≈ 3 min/jour ici).",
      "Éviter les boucles addictives : pas de notifications, pas de scores compétitifs entre enfants.",
      "Des récompenses prévisibles et calmes, pas de hasard à effet « machine à sous »."
    ]
  },
  propositions: [
    "Ajouter un rappel doux en fin de journée selon le rythme choisi par la famille.",
    "Proposer des packs de missions validés par tranche d'âge.",
    "Mesurer le temps réel passé dans l'app pour vérifier l'objectif des 3 min/jour."
  ]
};

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
    { id: "roux",   nom: "Roux",   cout: 0,  hex: "#c2562d" },
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
    { id: "rondes",  nom: "Lunettes rondes",  cout: 0 },
    { id: "soleil",  nom: "Lunettes soleil",  cout: 12 },
    { id: "etoile",  nom: "Lunettes étoiles", cout: 25 },
    { id: "coeur",   nom: "Lunettes cœurs",   cout: 20 },
    { id: "goutte",  nom: "Lunettes gouttes", cout: 20 }
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
 *   2) Les HERBIVORES — qui mangent des plantes
 *   3) Les CARNIVORES — qui mangent des herbivores
 *
 *  Chaque espèce est une CARTE avec ses propres PRÉREQUIS (`prereq`) :
 *  une liste d'autres êtres vivants nécessaires (et en quelle quantité)
 *  avant de pouvoir la créer. Exemples :
 *    - un Singe 🐒 réclame 10 arbres 🌳 et 1 bananier 🍌 ;
 *    - un Lion 🦁 réclame 5 gazelles 🦌, 1 autruche 🦤 et 1 phacochère 🐗.
 *  Cela enseigne, en jouant, les vraies dépendances de la chaîne
 *  alimentaire. Chaque création coûte aussi des Gouttes 💧 (`cout`).
 *
 *  `prereq` = { especeId: quantité }. Les ids référencés doivent exister
 *  dans TIERS_ECO. L'ordre plantes → herbivores → carnivores est donc
 *  garanti naturellement par les prérequis eux-mêmes.
 * ===================================================================== */
const TIERS_ECO = [
  {
    id: "plantes",
    nom: "Plantes",
    emoji: "🌱",
    lecon: "Tout commence par les plantes 🌱 : grâce au soleil, elles fabriquent leur propre nourriture. Ce sont elles qui nourrissent tout l'écosystème.",
    especes: [
      { id: "herbe",      emoji: "🌿", nom: "Herbe",       cout: 2,  prereq: {} },
      { id: "trefle",     emoji: "🍀", nom: "Trèfle",      cout: 2,  prereq: {} },
      { id: "fleur",      emoji: "🌸", nom: "Fleur",       cout: 3,  prereq: {} },
      { id: "ble",        emoji: "🌾", nom: "Blé",         cout: 3,  prereq: {} },
      { id: "champignon", emoji: "🍄", nom: "Champignon",  cout: 4,  prereq: {} },
      { id: "cactus",     emoji: "🌵", nom: "Cactus",      cout: 5,  prereq: {} },
      { id: "arbre",      emoji: "🌳", nom: "Arbre",       cout: 7,  prereq: {} },
      { id: "palmier",    emoji: "🌴", nom: "Palmier",     cout: 10, prereq: { arbre: 2 } },
      { id: "bananier",   emoji: "🍌", nom: "Bananier",    cout: 12, prereq: { arbre: 2 } }
    ]
  },
  {
    id: "herbivores",
    nom: "Herbivores",
    emoji: "🐰",
    lecon: "Les herbivores 🐰 ne mangent que des plantes. Chaque animal a besoin des bonnes plantes pour vivre : crée-les d'abord !",
    especes: [
      { id: "escargot",  emoji: "🐌",  nom: "Escargot",   cout: 5,   prereq: { herbe: 2 } },
      { id: "chenille",  emoji: "🐛",  nom: "Chenille",   cout: 5,   prereq: { fleur: 1 } },
      { id: "coccinelle",emoji: "🐞",  nom: "Coccinelle", cout: 6,   prereq: { fleur: 2 } },
      { id: "abeille",   emoji: "🐝",  nom: "Abeille",    cout: 8,   prereq: { fleur: 3 } },
      { id: "papillon",  emoji: "🦋",  nom: "Papillon",   cout: 8,   prereq: { fleur: 2 } },
      { id: "souris",    emoji: "🐭",  nom: "Souris",     cout: 8,   prereq: { ble: 2 } },
      { id: "lapin",     emoji: "🐰",  nom: "Lapin",      cout: 12,  prereq: { herbe: 3, trefle: 1 } },
      { id: "tortue",    emoji: "🐢",  nom: "Tortue",     cout: 12,  prereq: { herbe: 2, fleur: 1 } },
      { id: "ecureuil",  emoji: "🐿️", nom: "Écureuil",   cout: 13,  prereq: { arbre: 1, champignon: 1 } },
      { id: "mouton",    emoji: "🐑",  nom: "Mouton",     cout: 16,  prereq: { herbe: 5 } },
      { id: "chevre",    emoji: "🐐",  nom: "Chèvre",     cout: 16,  prereq: { herbe: 3, arbre: 1 } },
      { id: "cerf",      emoji: "🦌",  nom: "Cerf",       cout: 22,  prereq: { herbe: 4, arbre: 1 } },
      { id: "vache",     emoji: "🐄",  nom: "Vache",      cout: 24,  prereq: { herbe: 6 } },
      { id: "cheval",    emoji: "🐴",  nom: "Cheval",     cout: 26,  prereq: { herbe: 5, ble: 2 } },
      { id: "kangourou", emoji: "🦘",  nom: "Kangourou",  cout: 26,  prereq: { herbe: 5 } },
      { id: "zebre",     emoji: "🦓",  nom: "Zèbre",      cout: 28,  prereq: { herbe: 6 } },
      { id: "gazelle",   emoji: "🦌",  nom: "Gazelle",    cout: 30,  prereq: { herbe: 4 } },
      { id: "chameau",   emoji: "🐪",  nom: "Chameau",    cout: 34,  prereq: { cactus: 2, herbe: 3 } },
      { id: "autruche",  emoji: "🦤",  nom: "Autruche",   cout: 40,  prereq: { herbe: 3, ble: 1 } },
      { id: "phacochere",emoji: "🐗",  nom: "Phacochère", cout: 40,  prereq: { herbe: 3, champignon: 1 } },
      { id: "girafe",    emoji: "🦒",  nom: "Girafe",     cout: 55,  prereq: { arbre: 4 } },
      { id: "singe",     emoji: "🐒",  nom: "Singe",      cout: 60,  prereq: { arbre: 10, bananier: 1 } },
      { id: "elephant",  emoji: "🐘",  nom: "Éléphant",   cout: 80,  prereq: { arbre: 3, herbe: 6 } }
    ]
  },
  {
    id: "carnivores",
    nom: "Carnivores",
    emoji: "🦊",
    lecon: "Les carnivores 🦊 mangent les herbivores. Une fois là, la chaîne alimentaire est complète : plantes → herbivores → carnivores !",
    especes: [
      { id: "grenouille",emoji: "🐸",  nom: "Grenouille", cout: 12,  prereq: { chenille: 1, escargot: 1 } },
      { id: "araignee",  emoji: "🕷️", nom: "Araignée",   cout: 12,  prereq: { papillon: 1, abeille: 1 } },
      { id: "herisson",  emoji: "🦔",  nom: "Hérisson",   cout: 16,  prereq: { escargot: 2 } },
      { id: "serpent",   emoji: "🐍",  nom: "Serpent",    cout: 24,  prereq: { souris: 2 } },
      { id: "hibou",     emoji: "🦉",  nom: "Hibou",      cout: 32,  prereq: { souris: 3 } },
      { id: "renard",    emoji: "🦊",  nom: "Renard",     cout: 45,  prereq: { lapin: 2, souris: 1 } },
      { id: "aigle",     emoji: "🦅",  nom: "Aigle",      cout: 55,  prereq: { lapin: 2, souris: 2 } },
      { id: "loup",      emoji: "🐺",  nom: "Loup",       cout: 80,  prereq: { cerf: 1, lapin: 2 } },
      { id: "crocodile", emoji: "🐊",  nom: "Crocodile",  cout: 90,  prereq: { zebre: 1, souris: 2 } },
      { id: "ours",      emoji: "🐻",  nom: "Ours",       cout: 110, prereq: { lapin: 2, abeille: 2 } },
      { id: "tigre",     emoji: "🐅",  nom: "Tigre",      cout: 160, prereq: { cerf: 2, zebre: 1 } },
      { id: "leopard",   emoji: "🐆",  nom: "Léopard",    cout: 180, prereq: { gazelle: 2, singe: 1 } },
      { id: "lion",      emoji: "🦁",  nom: "Lion",       cout: 400, prereq: { gazelle: 5, autruche: 1, phacochere: 1 } }
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

/* ---- Touches d'humour bon enfant (désactivables par les parents) ----
 * Corpus de repli en français ; traduits via i18n (trData).
 * - TAQUINERIES : félicitations rigolotes (mêlées aux ENCOURAGEMENTS).
 * - MESSAGES_VIDES : états vides présentés avec le sourire.
 * - BLAGUES : devinettes pour la « blague du jour » ({ q: question, r: réponse }). */
const TAQUINERIES = [
  "Champion(ne) ! Même les chaussettes sont impressionnées 🧦",
  "Bravo ! Tu mérites une médaille en chocolat 🍫 (imaginaire 😅)",
  "Waouh ! La maison brille presque trop, on met des lunettes 😎",
  "Trop fort(e) ! Les licornes prennent des notes 🦄",
  "Et hop ! Encore un petit pas de super-héros 🦸",
  "Mission accomplie ! Ton cape invisible flotte au vent 🌬️",
  "Génial ! Les dinosaures auraient été jaloux 🦕",
  "Top ! Tu gagnes 1000 points de gentillesse… et un câlin 🤗"
];
const MESSAGES_VIDES = [
  "Rien ici… les missions font la sieste 😴",
  "C'est tout vide ! Un courant d'air est passé 🌬️",
  "Oups, le hamster a tout rangé 🐹",
  "Pour l'instant c'est désert… même les fourmis sont parties 🐜",
  "Rien à voir ici… à part ce petit emoji 👀"
];
const BLAGUES_DEFAUT = {
  fr: [
  { q: "Qu'est-ce qui est jaune et qui attend ?", r: "Jonathan ! 🍌" },
  { q: "Qu'est-ce qui est jaune et qui attend… aussi ?", r: "Jonathan le bananier ! 🍌" },
  { q: "Que dit un café qui arrive en retard au travail ?", r: "« Désolé, j'étais dans le pétrin… euh, dans la tasse ! » ☕" },
  { q: "Pourquoi les plongeurs plongent-ils toujours en arrière ?", r: "Parce que sinon ils tombent dans le bateau ! 🤿" },
  { q: "Quel est l'animal le plus heureux ?", r: "Le hibou, parce que sa femme est chouette ! 🦉" },
  { q: "Que se disent deux chats amoureux ?", r: "« On est félins pour l'autre ! » 🐱" },
  { q: "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ?", r: "Un chat-mallow… non, un chat-peint de Noël ! 🎄🐈" },
  { q: "Pourquoi les abeilles ont-elles du miel collant ?", r: "Parce qu'elles utilisent un peigne qui n'a pas de dents ! 🐝" },
  { q: "Quel est le comble pour un électricien ?", r: "Ne pas être au courant ! ⚡" },
  { q: "Que fait une vache quand elle ferme les yeux ?", r: "Du lait concentré ! 🐄" },
  { q: "Pourquoi est-ce que les squelettes ne se battent jamais entre eux ?", r: "Ils n'ont pas le cœur à ça ! 💀" },
  { q: "Quel est le sport préféré des insectes ?", r: "Le criquet ! 🦗" },
  { q: "Que dit un zéro à un huit ?", r: "« Eh, jolie ceinture ! » 8️⃣" },
  { q: "Pourquoi le ballon de foot est-il toujours fatigué ?", r: "Parce que tout le monde lui tape dessus ! ⚽" },
  { q: "Quel est le fruit qui voyage le plus ?", r: "Le kiwi, parce qu'il a toujours son passeport… euh, son duvet ! 🥝" },
  { q: "Que dit un crocodile qui vend des lunettes ?", r: "« Lacoste, c'est moins cher chez moi ! » 🐊" },
  { q: "Pourquoi les poules ne sont-elles jamais perdues ?", r: "Parce qu'elles ont toujours leur GPS… le coq-pit ! 🐔" },
  { q: "Comment s'appelle un dinosaure qui dort ?", r: "Un dino-ronfle ! 🦕" },
  { q: "Quel est le comble pour un fantôme ?", r: "Avoir une peur bleue ! 👻" },
  { q: "Que dit une maman tomate à son bébé tomate qui traîne ?", r: "« Allez, ketchup ! » 🍅" },
  { q: "Pourquoi les pingouins portent-ils un nœud papillon ?", r: "Parce qu'ils sont toujours bien habillés en costard ! 🐧" },
  { q: "Quel légume fait peur aux pirates ?", r: "Le chou-fleur… non, le navet à l'abordage ! 🥦" },
  { q: "Que dit un mouton à l'autre pour Noël ?", r: "« Joyeux Noël, je te souhaite plein de bêêêlles choses ! » 🐑" },
  { q: "Pourquoi l'ordinateur est-il allé chez le docteur ?", r: "Parce qu'il avait attrapé un virus ! 💻" },
  { q: "Quel est le gâteau préféré des momies ?", r: "Le roulé… égyptien ! 🎂" },
  { q: "Que fait un canard dans un magasin ?", r: "Il dit : « Mettez ça sur mon compte… de plumes ! » 🦆" },
  { q: "Pourquoi les girafes ont-elles un long cou ?", r: "Parce qu'elles ont les pieds qui sentent mauvais ! 🦒" },
  { q: "Qu'est-ce qu'un crocodile qui surveille la pharmacie ?", r: "Un croco-dile de garde ! 🐊" },
  { q: "Que dit une imprimante à une autre imprimante ?", r: "« Dis donc, c'est ta feuille ou c'est la mienne ? » 🖨️" },
  { q: "Pourquoi les manchots ne prennent-ils jamais l'avion ?", r: "Parce qu'ils préfèrent voyager en costard-cravate ! 🐧" },
  { q: "Quel est le comble pour un pâtissier ?", r: "Avoir du pain sur la planche ! 🥐" },
  { q: "Que dit un oignon quand il se cogne ?", r: "« Aïe, j'ai mal à mes pelures ! » 🧅" },
  { q: "Pourquoi les profs de maths adorent-ils les parcs ?", r: "Parce qu'il y a plein de bancs… euh, de problèmes à résoudre ! ➗" },
  { q: "Quel est l'animal qui fait le plus de bruit en classe ?", r: "Le ouistiti, parce qu'il n'arrête pas de faire « cheese » ! 🐒" },
  { q: "Que se passe-t-il quand deux yaourts se rencontrent ?", r: "Rien… ils restent nature ! 🥛" },
  { q: "Pourquoi le citron a-t-il appelé les pompiers ?", r: "Parce qu'il était pressé ! 🍋" },
  { q: "Que dit un haricot vert à un haricot rouge ?", r: "« T'as pris un coup de soleil ou quoi ? » 🫘" },
  { q: "Comment range-t-on un éléphant dans un frigo ?", r: "On ouvre la porte, on met l'éléphant, et on referme ! 🐘" },
  { q: "Et comment range-t-on une girafe dans le frigo ?", r: "On sort d'abord l'éléphant ! 🦒" },
  { q: "Quel est le pays préféré des fantômes ?", r: "La Boo-livie ! 👻" },
  { q: "Pourquoi les abeilles bourdonnent-elles ?", r: "Parce qu'elles ne connaissent pas les paroles ! 🐝" },
  { q: "Que dit un escargot sur le dos d'une tortue ?", r: "« Youhou ! Ça déménage ! » 🐌" },
  { q: "Quel est le dessert préféré des sorcières ?", r: "La tarte aux pommes… empoisonnées ! 🧙" },
  { q: "Pourquoi le robot est-il fâché ?", r: "Parce qu'on lui a tapé sur le système ! 🤖" },
  { q: "Comment appelle-t-on un chien magicien ?", r: "Un labra-cadabra-dor ! 🐶✨" },
  { q: "Pourquoi les bananes ne sont-elles jamais seules ?", r: "Parce qu'elles vont toujours en régime ! 🍌" },
  { q: "Que dit une fraise à une autre fraise ?", r: "« C'est de ta faute si on est dans le pétrin… euh, dans la confiture ! » 🍓" },
  { q: "Quel est le comble pour un jardinier ?", r: "Raconter des salades ! 🥗" },
  { q: "Pourquoi les poissons vivent-ils dans l'eau salée ?", r: "Parce que dans l'eau poivrée, ils éternuent ! 🐟" },
  { q: "Que fait un escargot quand il est en colère ?", r: "Il bave de rage… mais doucement ! 🐌" },
  { q: "Quel est le animal le plus fort en calcul ?", r: "Le pou, parce qu'il fait des additions sur la tête ! 🧮" },
  { q: "Pourquoi le facteur a-t-il toujours chaud ?", r: "Parce qu'il distribue des lettres brûlantes ! ✉️" }
  ],
  en: [
  { q: "Why did the teddy bear say no to dessert?", r: "Because it was already stuffed! 🧸" },
  { q: "What do you call a dinosaur that is sleeping?", r: "A dino-snore! 🦕" },
  { q: "Why can't your nose be 12 inches long?", r: "Because then it would be a foot! 👃" },
  { q: "What do you call cheese that isn't yours?", r: "Nacho cheese! 🧀" },
  { q: "Why did the cookie go to the doctor?", r: "Because it felt crummy! 🍪" },
  { q: "What do you call a bear with no teeth?", r: "A gummy bear! 🐻" },
  { q: "Why did the bicycle fall over?", r: "Because it was two-tired! 🚲" },
  { q: "What do you call a fish wearing a bowtie?", r: "So-fish-ticated! 🐟" },
  { q: "Why did the banana go to the party?", r: "Because it was a-peeling! 🍌" },
  { q: "What did one wall say to the other wall?", r: "« I'll meet you at the corner! » 🧱" },
  { q: "Why don't eggs tell jokes?", r: "They'd crack each other up! 🥚" },
  { q: "What do you call a sleeping dinosaur snack?", r: "A dino-snore-us! 🦖" },
  { q: "How do you make an octopus laugh?", r: "With ten-tickles! 🐙" }
  ],
  nl: [
  { q: "Wat is groen en springt door het bos?", r: "Een springspruitje! 🥦" },
  { q: "Waarom kan een fiets niet zelf staan?", r: "Omdat hij twee-moe is! 🚲" },
  { q: "Wat zegt een slak op de rug van een schildpad?", r: "« Joehoe, wat gaat dat hard! » 🐌" },
  { q: "Hoe noem je een berenklas?", r: "Een knuffel-klas! 🐻" },
  { q: "Waarom zijn de visjes zo slim?", r: "Omdat ze in scholen zwemmen! 🐟" },
  { q: "Wat doet een koe in het donker?", r: "Boe roepen! 🐄" },
  { q: "Waarom huilt de ui?", r: "Omdat zijn vriendje gepeld werd! 🧅" },
  { q: "Wat zegt het ene muurtje tegen het andere?", r: "« Tot in de hoek! » 🧱" },
  { q: "Wat is geel en kan niet zwemmen?", r: "Een graafmachine! 🚜" },
  { q: "Hoe noem je een toverhond?", r: "Een labra-goochel-dor! 🐶✨" },
  { q: "Waarom was de computer ziek?", r: "Hij had een virus gevangen! 💻" }
  ],
  de: [
  { q: "Was ist grün und klopft an die Tür?", r: "Ein Klopfsalat! 🥗" },
  { q: "Warum kann ein Fahrrad nicht alleine stehen?", r: "Weil es zu müde ist! 🚲" },
  { q: "Was sagt ein Wal zum anderen?", r: "« Schwimmst du oft hier vorbei? » 🐋" },
  { q: "Wie nennt man einen schlafenden Dino?", r: "Ein Dino-schnarch! 🦕" },
  { q: "Warum weint die Zwiebel?", r: "Weil ihr Freund geschält wurde! 🧅" },
  { q: "Was macht eine Kuh im Dunkeln?", r: "Sie macht Muuuh! 🐄" },
  { q: "Was sagt eine Wand zur anderen Wand?", r: "« Wir treffen uns an der Ecke! » 🧱" },
  { q: "Warum war der Computer beim Arzt?", r: "Er hatte einen Virus! 💻" },
  { q: "Wie nennt man einen Zauberhund?", r: "Einen Labra-zauber-dor! 🐶✨" },
  { q: "Was ist gelb und kann nicht schwimmen?", r: "Ein Bagger! 🚜" },
  { q: "Warum sind Bienen so gut frisiert?", r: "Weil sie immer einen Honig-Kamm haben! 🐝" }
  ]
};
// Compatibilité : l'ancienne constante pointe sur la liste française.
const BLAGUES = BLAGUES_DEFAUT.fr;

/* ---- Catalogue des badges (pour l'affichage : gagnés + à débloquer) ----
 * Doit rester synchronisé avec les conditions d'attribution dans
 * app.js → verifierBadges(). 'comment' = comment l'obtenir (motivation). */
const BADGES_CATALOGUE = [
  // Cœurs (famille)
  { id: "coeur10",    emoji: "💛", nom: "Cœur d'or",                   comment: "Gagne 10 Cœurs en tout" },
  { id: "coeur50",    emoji: "🏅", nom: "Super entraide",             comment: "Gagne 50 Cœurs en tout" },
  { id: "coeur100",   emoji: "💖", nom: "Trésor du cœur",            comment: "Gagne 100 Cœurs en tout" },
  // Gouttes (planète)
  { id: "goutte10",   emoji: "💧", nom: "Petite source",             comment: "Gagne 10 Gouttes en tout" },
  { id: "goutte50",   emoji: "🌊", nom: "Grande rivière",            comment: "Gagne 50 Gouttes en tout" },
  // Écosystème
  { id: "eco_p",      emoji: "🌱", nom: "Jardinier en herbe",        comment: "Crée ta 1ʳᵉ plante" },
  { id: "eco_h",      emoji: "🐰", nom: "Ami des herbivores",        comment: "Crée ton 1ᵉʳ herbivore" },
  { id: "eco_c",      emoji: "🦊", nom: "Protecteur des prédateurs", comment: "Crée ton 1ᵉʳ carnivore" },
  { id: "eco_chaine", emoji: "🔗", nom: "Chaîne alimentaire complète", comment: "Une plante, un herbivore et un carnivore" },
  { id: "eco_10",     emoji: "🌳", nom: "Petit monde vivant",        comment: "Crée 10 êtres vivants" },
  { id: "eco_25",     emoji: "🏞️", nom: "Gardien de la nature",      comment: "Crée 25 êtres vivants" },
  // Régularité
  { id: "semaine",    emoji: "📅", nom: "Une semaine d'efforts",     comment: "Sois actif 7 jours différents" },
  { id: "mois",       emoji: "🗓️", nom: "Un mois d'efforts",         comment: "Sois actif 30 jours différents" },
  // Esprit d'équipe (cartes surprises)
  { id: "don_coeur",  emoji: "🎁", nom: "Cœur partageur",            comment: "Donne des Cœurs à une carte surprise" },
  { id: "equipe",     emoji: "🤝", nom: "Esprit d'équipe",          comment: "Aide à débloquer une carte surprise" }
];

/* ---- Cartes surprises (objectifs d'équipe) ------------------------
 * Activités à faire EN FAMILLE, débloquées ensemble : les enfants
 * donnent volontairement des Cœurs 💛 à une carte commune jusqu'à
 * atteindre son prix. Les parents peuvent les modifier dans l'espace
 * parents. Prix échelonnés : petit / moyen / grand.
 * ------------------------------------------------------------------- */
// coutParEnfant : le prix par défaut est calculé = coutParEnfant × nombre
// d'enfants de la famille (petit / moyen / grand objectif d'équipe).
const CARTES_SURPRISES_DEFAUT = [
  { id: "cs_cine",     emoji: "🍿", titre: "Soirée cinéma maison",   activite: "On choisit un film tous ensemble, avec popcorn et couverture !", coutParEnfant: 50 },
  { id: "cs_picnic",   emoji: "🧺", titre: "Pique-nique au parc",    activite: "On prépare un goûter et on va jouer dehors en famille.",        coutParEnfant: 200 },
  { id: "cs_sortie",   emoji: "🎢", titre: "Grande sortie surprise", activite: "Une sortie spéciale choisie ensemble (zoo, parc, piscine…).",   coutParEnfant: 1000 }
];

/* ---- Idées d'activités à proposer aux parents ---------------------
 * Inspirées de la parentalité positive (Papa Positive, Faber & Mazlish)
 * et des recommandations de psychologues : du temps de qualité, de la
 * connexion, sans écran, qui crée des souvenirs. Les parents les ajoutent
 * en un clic. taille → coût par enfant : petite 50 / moyenne 200 / grande 1000.
 * ------------------------------------------------------------------- */
const IDEES_CARTES = [
  // Petites : connexion du quotidien, rapides, gratuites.
  { id: "idc_histoire", taille: "petite", emoji: "📖", coutParEnfant: 50,  titre: "Histoire du soir spéciale", activite: "Chaque enfant choisit un livre et on lit tous ensemble, bien blottis." },
  { id: "idc_cuisine",  taille: "petite", emoji: "🍪", coutParEnfant: 50,  titre: "Atelier petit chef",        activite: "On prépare un goûter ou des biscuits ensemble, et on se régale." },
  { id: "idc_jeux",     taille: "petite", emoji: "🧩", coutParEnfant: 50,  titre: "Soirée jeux de société",    activite: "On sort les jeux et on joue tous ensemble (sans écran)." },
  { id: "idc_boum",     taille: "petite", emoji: "💃", coutParEnfant: 50,  titre: "Boum dans le salon",        activite: "Chacun choisit une chanson et on danse comme des fous !" },
  // Moyennes : projets et sorties de proximité.
  { id: "idc_cabane",   taille: "moyenne", emoji: "🏕️", coutParEnfant: 200,  titre: "Cabane & nuit aventure",   activite: "On construit une cabane (coussins/tente) et on y passe la soirée." },
  { id: "idc_creatif",  taille: "moyenne", emoji: "🎨", coutParEnfant: 200,  titre: "Grand atelier créatif",    activite: "Peinture, bricolage, pâte à modeler : on crée tous ensemble." },
  { id: "idc_velo",     taille: "moyenne", emoji: "🚲", coutParEnfant: 200,  titre: "Balade vélo / nature",     activite: "Une sortie à vélo ou une balade pour explorer la nature." },
  { id: "idc_picnic",   taille: "moyenne", emoji: "🧺", coutParEnfant: 200,  titre: "Pique-nique au parc",      activite: "On prépare un panier et on va jouer et manger dehors." },
  // Grandes : grandes expériences mémorables.
  { id: "idc_parc",     taille: "grande", emoji: "🎢", coutParEnfant: 1000, titre: "Journée parc d'attractions", activite: "Une grande journée d'aventure et de manèges en famille." },
  { id: "idc_zoo",      taille: "grande", emoji: "🦁", coutParEnfant: 1000, titre: "Zoo ou aquarium",           activite: "On part observer les animaux et découvrir plein de choses." },
  { id: "idc_eau",      taille: "grande", emoji: "🏊", coutParEnfant: 1000, titre: "Journée piscine / plage",   activite: "Baignade, jeux d'eau et châteaux de sable en famille." },
  { id: "idc_cine",     taille: "grande", emoji: "🎬", coutParEnfant: 1000, titre: "Cinéma + petit restau",     activite: "Un film au cinéma suivi d'un repas choisi par les enfants." },

  // ----- Petites (suite) -----
  { id: "idc_dessin",    taille: "petite", emoji: "🖍️", coutParEnfant: 50, titre: "Concours de dessin rigolo", activite: "On dessine sur un thème rigolo et on expose nos chefs-d'œuvre." },
  { id: "idc_chasse",    taille: "petite", emoji: "🔎", coutParEnfant: 50, titre: "Chasse au trésor maison",   activite: "Les parents cachent des indices et on cherche un petit trésor." },
  { id: "idc_massage",   taille: "petite", emoji: "💆", coutParEnfant: 50, titre: "Moment câlin & massage",    activite: "Petits massages doux et gros câlins sur une musique calme." },
  { id: "idc_yoga",      taille: "petite", emoji: "🧘", coutParEnfant: 50, titre: "Yoga des animaux",          activite: "On imite les animaux en faisant des postures de yoga rigolotes." },
  { id: "idc_photo",     taille: "petite", emoji: "📸", coutParEnfant: 50, titre: "Séance photos rigolotes",   activite: "On fait des grimaces et des poses pour des photos souvenirs." },
  { id: "idc_gratitude", taille: "petite", emoji: "🙏", coutParEnfant: 50, titre: "Cercle des mercis",         activite: "Chacun dit ce dont il est fier et remercie quelqu'un de la famille." },
  { id: "idc_pyjama",    taille: "petite", emoji: "🛌", coutParEnfant: 50, titre: "Soirée pyjama & cocooning", activite: "Tout le monde en pyjama, chocolat chaud et petites histoires." },
  { id: "idc_bulles",    taille: "petite", emoji: "🫧", coutParEnfant: 50, titre: "Bataille de bulles",        activite: "On souffle des bulles de savon et on essaie de les attraper." },

  // ----- Moyennes (suite) -----
  { id: "idc_cinemaison", taille: "moyenne", emoji: "🍿", coutParEnfant: 200, titre: "Soirée cinéma maison",   activite: "On choisit un film tous ensemble, avec popcorn et couverture." },
  { id: "idc_jardin",     taille: "moyenne", emoji: "🌻", coutParEnfant: 200, titre: "Plantons ensemble",      activite: "On plante des graines ou on s'occupe du jardin et des plantes." },
  { id: "idc_patisserie", taille: "moyenne", emoji: "🧁", coutParEnfant: 200, titre: "Grande pâtisserie",      activite: "On prépare un gâteau ou des cupcakes à décorer ensemble." },
  { id: "idc_musee",      taille: "moyenne", emoji: "🖼️", coutParEnfant: 200, titre: "Visite d'un musée",      activite: "On découvre un musée adapté aux enfants." },
  { id: "idc_ferme",      taille: "moyenne", emoji: "🐮", coutParEnfant: 200, titre: "Visite d'une ferme",     activite: "On va voir et nourrir les animaux de la ferme." },
  { id: "idc_oiseaux",    taille: "moyenne", emoji: "🐦", coutParEnfant: 200, titre: "Cabane à oiseaux",       activite: "On bricole un nichoir ou une mangeoire pour les oiseaux." },
  { id: "idc_spectacle",  taille: "moyenne", emoji: "🎭", coutParEnfant: 200, titre: "Spectacle maison",       activite: "On prépare un petit spectacle (danse, théâtre, magie) et on le joue." },
  { id: "idc_bowling",    taille: "moyenne", emoji: "🎳", coutParEnfant: 200, titre: "Après-midi bowling",     activite: "On va faire une partie de bowling tous ensemble." },
  { id: "idc_patinoire",  taille: "moyenne", emoji: "⛸️", coutParEnfant: 200, titre: "Patinoire en famille",   activite: "On chausse les patins et on glisse tous ensemble." },

  // ----- Grandes (suite) -----
  { id: "idc_mer",        taille: "grande", emoji: "🏖️", coutParEnfant: 1000, titre: "Journée à la mer",      activite: "Une grande journée à la plage : châteaux, baignade et glaces." },
  { id: "idc_rando",      taille: "grande", emoji: "🥾", coutParEnfant: 1000, titre: "Rando nature & pique-nique", activite: "Une grande balade en forêt ou en montagne, avec pique-nique." },
  { id: "idc_safari",     taille: "grande", emoji: "🦒", coutParEnfant: 1000, titre: "Parc animalier / safari", activite: "On part observer de plus grands animaux dans un parc." },
  { id: "idc_trampoline", taille: "grande", emoji: "🤸", coutParEnfant: 1000, titre: "Parc de trampolines",    activite: "Une journée à sauter et grimper dans un parc indoor." },
  { id: "idc_train",      taille: "grande", emoji: "🚂", coutParEnfant: 1000, titre: "Aventure en train",      activite: "On prend le train pour découvrir une nouvelle ville." },
  { id: "idc_hotel",      taille: "grande", emoji: "🏨", coutParEnfant: 1000, titre: "Nuit aventure ailleurs", activite: "Une nuit spéciale à l'hôtel ou en camping, en aventure familiale." }
];

