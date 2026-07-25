/* =====================================================================
 * FamiTeam — Développement commercial : chantiers & modèles d'e-mails
 * ---------------------------------------------------------------------
 * Source unique du plan de croissance. Le contenu est volontairement en
 * français : il s'adresse à l'administrateur (back-office), pas aux
 * familles. Rien ici n'est visible des utilisateurs.
 *
 * L'avancement (étapes cochées, notes) n'est PAS stocké dans ce fichier :
 * il vit dans app_config → clé "croissance" (JSON), écrite via la RPC
 * set_app_config réservée aux admins. Ce fichier ne décrit que le plan.
 *
 * Voir PLAN-COMMERCIAL.md pour l'analyse de marché et le business plan.
 * ===================================================================== */

/* ---------- Phases : regroupent les chantiers dans le temps ---------- */
const CROISSANCE_PHASES = [
  { id: "p0", titre: "Phase 0 — Fondations", sous: "Mesurer, convertir, être crédible. Avant toute acquisition." },
  { id: "p1", titre: "Phase 1 — Traction organique", sous: "0 → 300 familles actives, sans budget publicitaire." },
  { id: "p2", titre: "Phase 2 — Prescripteurs (B2B2C)", sous: "Écoles, crèches, professionnels, mutuelles : ils parlent pour nous." },
  { id: "p3", titre: "Phase 3 — Monétisation", sous: "Premium, paiement, partenariats récompenses." },
  { id: "p4", titre: "Phase 4 — Échelle", sous: "Autres langues, acquisition payante, financements." }
];

/* ---------- Chantiers ----------
 * Chaque chantier : un but, un indicateur, des étapes ordonnées.
 * `mail` sur une étape = identifiant d'un modèle de CROISSANCE_MAILS. */
const CROISSANCE_CHANTIERS = [
  /* ===== Phase 0 — Fondations ===== */
  {
    id: "c_mesure", phase: "p0", emoji: "📏", titre: "Socle de mesure",
    but: "Savoir, chaque lundi en 2 minutes, si l'app grandit et où elle fuit.",
    kpi: "Familles actives 7 j (étoile du Nord) · activation J+1 · rétention J+30",
    etapes: [
      { id: "c_mesure_1", titre: "Définir l'étoile du Nord et l'écrire ici", detail: "Familles actives sur 7 jours. Tout le reste est secondaire." },
      { id: "c_mesure_2", titre: "Vérifier le ping d'usage et les séries admin", detail: "usage_events + admin_series_usage alimentent bien les graphiques Stats." },
      { id: "c_mesure_3", titre: "Mesurer l'activation J+1", detail: "Part des familles inscrites qui ont validé au moins une mission le lendemain. Cible : 60 %." },
      { id: "c_mesure_4", titre: "Tracer l'origine des inscriptions", detail: "Ajouter un champ source (parrainage / presse / école / bouche-à-oreille) à la liste d'attente." },
      { id: "c_mesure_5", titre: "Rituel du lundi", detail: "10 min : relever les 3 chiffres, noter une décision dans le chantier concerné." }
    ]
  },
  {
    id: "c_preuve", phase: "p0", emoji: "🪧", titre: "Page publique & preuve",
    but: "Un parent qui arrive comprend en 10 secondes et a envie d'essayer.",
    kpi: "Visiteurs → inscription : 8 % · temps sur page > 40 s",
    etapes: [
      { id: "c_preuve_1", titre: "Promesse en une phrase", detail: "« Une ambiance positive à la maison, 2 minutes par jour. » À tester sur 5 parents non initiés." },
      { id: "c_preuve_2", titre: "Trois captures d'écran parlantes", detail: "L'écran enfant, l'avatar qui grandit, l'écran parent du soir." },
      { id: "c_preuve_3", titre: "Récolter 5 témoignages de familles bêta", detail: "Prénom + ville + une phrase concrète. Accord écrit par e-mail.", mail: "m_temoignage" },
      { id: "c_preuve_4", titre: "Section « pourquoi réparer plutôt que punir »", detail: "C'est le différenciateur : l'expliquer avec des mots simples, pas de jargon." },
      { id: "c_preuve_5", titre: "Bases SEO", detail: "Titre, description, Open Graph, sitemap, données structurées SoftwareApplication." }
    ]
  },
  {
    id: "c_activation", phase: "p0", emoji: "🚀", titre: "Activation & rétention",
    but: "Que la 1ʳᵉ soirée se passe bien : c'est là que tout se gagne ou se perd.",
    kpi: "Activation J+1 : 60 % · rétention J+30 : 35 %",
    etapes: [
      { id: "c_activation_1", titre: "Carte « Premiers pas » dans l'espace parents", detail: "Fait : trois gestes, état réel, disparaît une fois faite.", fait: true },
      { id: "c_activation_2", titre: "E-mail de bienvenue J+0", detail: "Envoyé à la création de la famille, avec les 3 gestes.", mail: "m_bienvenue" },
      { id: "c_activation_3", titre: "Relance d'activation J+3 si aucune mission validée", detail: "Un seul e-mail, ton bienveillant, un lien direct.", mail: "m_activation" },
      { id: "c_activation_4", titre: "Réveil des familles inactives depuis 30 jours", detail: "Une fois par trimestre, jamais plus.", mail: "m_reactivation" },
      { id: "c_activation_5", titre: "Mesurer l'effet de chaque envoi", detail: "Comparer l'activation des familles relancées et des autres." }
    ]
  },

  /* ===== Phase 1 — Traction organique ===== */
  {
    id: "c_waitlist", phase: "p1", emoji: "📨", titre: "Liste d'attente & vagues d'invitations",
    but: "Transformer la rareté (sur invitation) en atout : des vagues, du soin, des retours.",
    kpi: "Liste d'attente → inscription : 40 % par vague",
    etapes: [
      { id: "c_waitlist_1", titre: "Cadencer les vagues", detail: "Une vague toutes les 2 semaines, 20 à 50 familles, pour rester capable de répondre." },
      { id: "c_waitlist_2", titre: "E-mail d'invitation de vague", detail: "Personnalisé, avec le lien d'invitation et ce qu'on attend en retour.", mail: "m_waitlist_invit" },
      { id: "c_waitlist_3", titre: "Relance à J+7 des non-inscrits", detail: "Une seule relance, puis on laisse tranquille.", mail: "m_waitlist_relance" },
      { id: "c_waitlist_4", titre: "Appeler 5 familles par vague", detail: "15 minutes au téléphone valent 100 réponses de questionnaire." },
      { id: "c_waitlist_5", titre: "Décider de l'ouverture publique", detail: "Quand activation J+1 > 55 % et zéro bogue bloquant sur 2 vagues." }
    ]
  },
  {
    id: "c_parrainage", phase: "p1", emoji: "🎁", titre: "Boucle de parrainage",
    but: "Chaque famille heureuse en amène une. C'est le seul canal gratuit qui compose.",
    kpi: "Coefficient viral k > 0,4 · 30 % des familles actives parrainent",
    etapes: [
      { id: "c_parrainage_1", titre: "Parrainage en place (3 familles/semaine)", detail: "Fait : pastille 🎁, table referrals, quota hebdomadaire.", fait: true },
      { id: "c_parrainage_2", titre: "Demander au bon moment", detail: "Après une carte surprise débloquée : le parent est content, c'est là qu'on demande." },
      { id: "c_parrainage_3", titre: "E-mail de demande de parrainage", detail: "Aux familles actives depuis 3 semaines.", mail: "m_parrainage" },
      { id: "c_parrainage_4", titre: "Remercier le parrain", detail: "Notification quand un filleul rejoint (déjà en place) + un mot personnel." },
      { id: "c_parrainage_5", titre: "Mesurer k", detail: "Filleuls inscrits ÷ familles actives, par mois." }
    ]
  },
  {
    id: "c_communaute", phase: "p1", emoji: "💬", titre: "Communautés de parents",
    but: "Être présent là où les parents demandent déjà de l'aide, sans faire de la publicité.",
    kpi: "20 inscriptions/mois issues des communautés",
    etapes: [
      { id: "c_communaute_1", titre: "Lister 15 groupes/forums", detail: "Groupes Facebook de parents BE/FR, subreddits, forums d'écoles, groupes WhatsApp de classe." },
      { id: "c_communaute_2", titre: "Lire et aider pendant 2 semaines sans rien vendre", detail: "La crédibilité d'abord, sinon c'est du spam." },
      { id: "c_communaute_3", titre: "Publier l'histoire, pas le produit", detail: "« J'ai construit ça pour mes enfants » convertit mieux qu'une liste de fonctions." },
      { id: "c_communaute_4", titre: "Micro-influence parentalité (5 comptes)", detail: "Comptes de 2 000 à 20 000 abonnés, accès gratuit à vie contre un test honnête.", mail: "m_influence" },
      { id: "c_communaute_5", titre: "Noter ce qui marche", detail: "Un canal qui n'amène rien en 3 essais est abandonné." }
    ]
  },
  {
    id: "c_contenu", phase: "p1", emoji: "✍️", titre: "Contenu & référencement",
    but: "Répondre aux questions que les parents tapent la nuit sur leur téléphone.",
    kpi: "12 articles publiés · 500 visites organiques/mois à 6 mois",
    etapes: [
      { id: "c_contenu_1", titre: "Choisir 12 sujets piliers", detail: "« routine du soir 3 ans », « punir ou réparer », « tableau de récompenses : bonne idée ? », « crise du coucher »." },
      { id: "c_contenu_2", titre: "Écrire 1 article par semaine", detail: "1 200 mots, utile sans l'app, avec un appel à l'action discret." },
      { id: "c_contenu_3", titre: "Traduire les 4 meilleurs en NL", detail: "La Flandre est à 30 minutes et personne n'y va." },
      { id: "c_contenu_4", titre: "Newsletter mensuelle", detail: "Un conseil concret + une nouveauté. Aux familles ET à la liste d'attente." },
      { id: "c_contenu_5", titre: "Mesurer par article", detail: "Garder les formats qui amènent des inscriptions, arrêter les autres." }
    ]
  },
  {
    id: "c_presse", phase: "p1", emoji: "📰", titre: "Presse & podcasts",
    but: "Un article dans un média familial = 2 à 5 ans de bouche-à-oreille en une journée.",
    kpi: "3 parutions · 1 passage podcast",
    etapes: [
      { id: "c_presse_1", titre: "Dossier de presse (1 page + captures)", detail: "Histoire, chiffres, ce qui est différent, contact, visuels en haute définition." },
      { id: "c_presse_2", titre: "Liste de 20 journalistes/rubriques famille", detail: "BE : RTBF, Le Soir « Famille », La Libre, Femmes d'Aujourd'hui, Flair. FR : Parents, Magicmaman, Doctissimo Famille." },
      { id: "c_presse_3", titre: "Pitch presse personnalisé", detail: "Jamais d'envoi groupé : une accroche par média.", mail: "m_presse" },
      { id: "c_presse_4", titre: "Podcasts parentalité", detail: "5 émissions francophones, proposition d'épisode sur « réparer plutôt que punir ».", mail: "m_podcast" },
      { id: "c_presse_5", titre: "Prévoir la charge", detail: "Vérifier les quotas Supabase et le nombre d'invitations avant toute parution." }
    ]
  },

  /* ===== Phase 2 — Prescripteurs ===== */
  {
    id: "c_ecoles", phase: "p2", emoji: "🏫", titre: "Écoles maternelles & primaires",
    but: "Une institutrice convaincue parle à 25 familles d'un coup.",
    kpi: "3 écoles pilotes · 60 familles issues des écoles",
    etapes: [
      { id: "c_ecoles_1", titre: "Choisir 10 écoles de proximité", detail: "Commencer par celles de ses propres enfants : la confiance existe déjà." },
      { id: "c_ecoles_2", titre: "Préparer un dépliant A5 imprimable", detail: "À glisser dans le cartable : QR code, promesse, gratuité, RGPD." },
      { id: "c_ecoles_3", titre: "Contacter les directions", detail: "Proposer une présentation de 15 minutes en réunion d'équipe.", mail: "m_ecole" },
      { id: "c_ecoles_4", titre: "Faire 3 pilotes d'un trimestre", detail: "Accompagnement direct, bilan écrit à la fin, témoignage de l'enseignant." },
      { id: "c_ecoles_5", titre: "Décider d'une offre école", detail: "Gratuit pour les familles ? Licence classe payante ? À trancher avec les chiffres des pilotes." }
    ]
  },
  {
    id: "c_creches", phase: "p2", emoji: "🧸", titre: "Crèches & accueil extrascolaire",
    but: "Toucher les parents d'enfants de 2-3 ans, exactement le bas de notre tranche d'âge.",
    kpi: "5 structures partenaires",
    etapes: [
      { id: "c_creches_1", titre: "Repérer les réseaux", detail: "BE : ONE (Fédération Wallonie-Bruxelles), Kind en Gezin en Flandre. FR : PMI, réseaux de crèches privées." },
      { id: "c_creches_2", titre: "Contacter 15 structures", detail: "Milieux d'accueil, écoles de devoirs, plaines de vacances.", mail: "m_creche" },
      { id: "c_creches_3", titre: "Proposer un atelier parents", detail: "45 minutes sur la parentalité positive, l'app en démonstration à la fin." },
      { id: "c_creches_4", titre: "Affiche + QR code en salle d'attente", detail: "Support physique, coût quasi nul, effet durable." },
      { id: "c_creches_5", titre: "Mesurer par structure", detail: "Un QR code par lieu pour savoir ce qui fonctionne." }
    ]
  },
  {
    id: "c_pros", phase: "p2", emoji: "🩺", titre: "Professionnels de l'enfance",
    but: "Pédiatres, psychologues, logopèdes : leur recommandation vaut dix publicités.",
    kpi: "10 professionnels prescripteurs",
    etapes: [
      { id: "c_pros_1", titre: "Écrire une note d'une page fondée sur la recherche", detail: "Renforcement positif, réparation, budget d'attention par âge. Sources citées." },
      { id: "c_pros_2", titre: "Contacter 20 praticiens", detail: "Priorité aux psychologues et logopèdes qui suivent des 2-7 ans.", mail: "m_pro_sante" },
      { id: "c_pros_3", titre: "Fournir 20 dépliants par cabinet", detail: "Salle d'attente : le parent a le temps de lire." },
      { id: "c_pros_4", titre: "Recueillir 2 avis de professionnels", detail: "Citation nominative sur la page publique, avec accord écrit." },
      { id: "c_pros_5", titre: "Mutuelles & assurances", detail: "BE : Partenamut, Solidaris, MC. Avantage membre « parentalité ».", mail: "m_mutuelle" }
    ]
  },
  {
    id: "c_employeurs", phase: "p2", emoji: "🏢", titre: "Employeurs & comités d'entreprise",
    but: "Un canal B2B2C où l'employeur paie et où les familles reçoivent.",
    kpi: "2 employeurs pilotes · 100 familles",
    etapes: [
      { id: "c_employeurs_1", titre: "Construire une offre « avantage salarié »", detail: "Prix par salarié et par an, facturation unique, aucune donnée transmise à l'employeur." },
      { id: "c_employeurs_2", titre: "Contacter 10 RH / CE", detail: "PME locales et grandes structures avec politique parentale.", mail: "m_employeur" },
      { id: "c_employeurs_3", titre: "Prévoir une page de convention simple", detail: "Une page, pas quinze : le frein est juridique, pas commercial." },
      { id: "c_employeurs_4", titre: "Pilote de 3 mois", detail: "Suivi d'usage anonymisé, bilan chiffré à l'employeur." },
      { id: "c_employeurs_5", titre: "Décider de poursuivre", detail: "Le cycle de vente B2B est long : abandonner si aucun signal en 3 mois." }
    ]
  },

  /* ===== Phase 3 — Monétisation ===== */
  {
    id: "c_modele", phase: "p3", emoji: "💶", titre: "Modèle & prix",
    but: "Gagner de l'argent sans jamais trahir la promesse faite aux premières familles.",
    kpi: "Conversion payante 6-8 % des familles actives · seuil de rentabilité atteint",
    etapes: [
      { id: "c_modele_1", titre: "Graver la promesse des early adopters", detail: "Gratuit à vie pour les familles inscrites avant l'ouverture du premium. À écrire noir sur blanc." },
      { id: "c_modele_2", titre: "Choisir le périmètre gratuit / premium", detail: "Hypothèse : gratuit complet pour 2 enfants ; premium = enfants illimités, statistiques, semaine papier, thèmes d'avatar." },
      { id: "c_modele_3", titre: "Fixer le prix de départ", detail: "Hypothèse : 3,49 €/mois ou 29 €/an. À tester sur deux vagues avant de figer." },
      { id: "c_modele_4", titre: "Interroger 20 familles sur le prix", detail: "« À partir de quel prix serait-ce trop cher ? » puis « trop bon marché pour être sérieux ? »." },
      { id: "c_modele_5", titre: "Annoncer le premium proprement", detail: "Aux familles existantes d'abord, sans surprise ni compte à rebours.", mail: "m_premium" }
    ]
  },
  {
    id: "c_paiement", phase: "p3", emoji: "🔐", titre: "Paiement & facturation",
    but: "Encaisser sans y passer ses soirées, et rester en règle.",
    kpi: "Paiement en 3 clics · 0 litige · TVA déclarée",
    etapes: [
      { id: "c_paiement_1", titre: "Brancher Stripe (le champ plan existe déjà)", detail: "La base prévoit families.plan et plan_status : pas de refonte à prévoir." },
      { id: "c_paiement_2", titre: "Essai de 14 jours sans carte", detail: "Cohérent avec la promesse de confiance ; conversion essai → payant attendue : 40 %." },
      { id: "c_paiement_3", titre: "TVA et guichet unique (OSS)", detail: "Vente à des particuliers dans l'UE : TVA du pays du client. À valider avec le comptable." },
      { id: "c_paiement_4", titre: "Factures automatiques et conditions de vente", detail: "Page CGV, droit de rétractation, résiliation en un clic." },
      { id: "c_paiement_5", titre: "Suivi des recettes dans l'admin", detail: "Abonnés, revenu mensuel récurrent, résiliations, en une carte." }
    ]
  },
  {
    id: "c_recompenses", phase: "p3", emoji: "🎟️", titre: "Partenariats récompenses",
    but: "Faire des cartes surprises de vraies sorties, et en tirer un revenu d'affiliation.",
    kpi: "5 partenaires · 1 000 €/an de commissions",
    etapes: [
      { id: "c_recompenses_1", titre: "Choisir des partenaires qui ont du sens", detail: "Zoos, parcs, cinémas, librairies jeunesse, piscines. Jamais de malbouffe ni de jouets à pile." },
      { id: "c_recompenses_2", titre: "Proposer le partenariat", detail: "Carte surprise sponsorisée : visibilité contre réduction famille.", mail: "m_partenaire" },
      { id: "c_recompenses_3", titre: "Cadre éthique écrit", detail: "Aucune publicité dans l'écran enfant. Le parent choisit, l'enfant ne voit pas de marque." },
      { id: "c_recompenses_4", titre: "Tester sur une région", detail: "Bruxelles + Brabant wallon d'abord, mesurer l'usage réel des bons." },
      { id: "c_recompenses_5", titre: "Décider d'étendre ou d'arrêter", detail: "Si moins de 5 % des familles utilisent un bon, ce n'est pas un canal." }
    ]
  },

  /* ===== Phase 4 — Échelle ===== */
  {
    id: "c_langues", phase: "p4", emoji: "🌍", titre: "Marchés néerlandophone & germanophone",
    but: "L'app est déjà traduite en 4 langues : c'est un actif dormant.",
    kpi: "20 % des familles hors francophonie",
    etapes: [
      { id: "c_langues_1", titre: "Vérifier la qualité NL et DE", detail: "Relecture par un locuteur natif : une traduction approximative tue la confiance." },
      { id: "c_langues_2", titre: "Page publique en NL", detail: "Flandre : marché voisin, concurrence faible sur la parentalité positive." },
      { id: "c_langues_3", titre: "Répliquer la boucle communautaire en NL", detail: "Groupes de parents flamands, Kind en Gezin, écoles néerlandophones de Bruxelles." },
      { id: "c_langues_4", titre: "Tester la Suisse et le Luxembourg", detail: "Pouvoir d'achat élevé, francophones, très peu de concurrence locale." },
      { id: "c_langues_5", titre: "Décider du 3ᵉ marché", detail: "Sur données réelles d'inscription, pas sur intuition." }
    ]
  },
  {
    id: "c_paye", phase: "p4", emoji: "📣", titre: "Acquisition payante",
    but: "N'allumer la publicité que quand la boucle organique est prouvée.",
    kpi: "Coût d'acquisition < un tiers de la valeur vie client",
    etapes: [
      { id: "c_paye_1", titre: "Attendre les prérequis", detail: "Rétention J+30 > 35 % ET conversion payante mesurée. Sinon, c'est acheter un seau percé." },
      { id: "c_paye_2", titre: "Calculer la valeur vie client", detail: "Prix × durée d'abonnement moyenne × marge. Fixe le plafond du coût d'acquisition." },
      { id: "c_paye_3", titre: "Tester 300 € sur Meta", detail: "Deux audiences (parents 25-45 BE/FR), trois accroches, un seul objectif : l'inscription." },
      { id: "c_paye_4", titre: "Tester 300 € en Search", detail: "Requêtes d'intention : « routine enfant », « tableau de récompenses »." },
      { id: "c_paye_5", titre: "Couper ou monter", detail: "Aucune montée en budget sans coût d'acquisition sous le plafond pendant 2 semaines." }
    ]
  },
  {
    id: "c_finance", phase: "p4", emoji: "🏦", titre: "Financements & aides",
    but: "Financer le temps de développement sans céder le contrôle.",
    kpi: "1 aide obtenue",
    etapes: [
      { id: "c_finance_1", titre: "Recenser les aides belges", detail: "Bruxelles : hub.brussels, Innoviris. Wallonie : chèques-entreprises, Digital Wallonia. Flandre : VLAIO." },
      { id: "c_finance_2", titre: "Vérifier l'éligibilité avant d'écrire", detail: "La plupart des dossiers échouent sur un critère administratif, pas sur l'idée." },
      { id: "c_finance_3", titre: "Demander un rendez-vous d'information", detail: "Un conseiller relit le dossier gratuitement : c'est le meilleur retour sur temps investi.", mail: "m_subvention" },
      { id: "c_finance_4", titre: "Préparer le dossier chiffré", detail: "Réutiliser PLAN-COMMERCIAL.md : marché, modèle, prévisionnel à 3 ans." },
      { id: "c_finance_5", titre: "Décider du statut juridique", detail: "Indépendant complémentaire, société, ASBL : dépend des recettes et de l'ambition. Avec le comptable." }
    ]
  },
  {
    id: "c_conformite", phase: "p4", emoji: "🛡️", titre: "Conformité à l'échelle",
    but: "Grandir sans créer de risque juridique sur des données d'enfants.",
    kpi: "0 incident · registre à jour",
    etapes: [
      { id: "c_conformite_1", titre: "Registre des traitements", detail: "Obligatoire dès qu'on traite des données d'enfants, même minimales." },
      { id: "c_conformite_2", titre: "Sous-traitants et lieu d'hébergement", detail: "Supabase (UE), Vercel, SMTP : à documenter dans la politique de confidentialité." },
      { id: "c_conformite_3", titre: "Minimisation des données", detail: "Prénom et date de naissance suffisent. Toute nouvelle donnée doit se justifier." },
      { id: "c_conformite_4", titre: "Droits des personnes", detail: "Export et suppression existent déjà : les documenter et tester une fois par an." },
      { id: "c_conformite_5", titre: "Accessibilité", detail: "Contrastes, taille des cibles tactiles, lecteur d'écran sur les parcours clés." }
    ]
  }
];

/* ---------- Modèles d'e-mails ----------
 * `dest` : à qui. `quand` : à quel moment de quel chantier.
 * Les {accolades} sont à remplacer avant envoi ; l'admin peut copier le
 * texte ou ouvrir son client de messagerie pré-rempli. */
const CROISSANCE_MAILS = [
  {
    id: "m_bienvenue", titre: "Bienvenue (J+0)", dest: "Parent qui vient de créer sa famille",
    quand: "Automatique, à la création de la famille",
    sujet: "Bienvenue dans FamiTeam 🌟 — vos trois premiers gestes",
    corps: `Bonjour {prenom},

Merci d'avoir créé votre famille sur FamiTeam. Voici les trois seuls gestes à connaître :

1. Renseignez le prénom et la date de naissance de vos enfants — les missions s'adaptent toutes seules à leur âge.
2. Choisissez 2 ou 3 missions pour aujourd'hui. Peu de missions, c'est plus de réussites.
3. Ce soir, cochez avec votre enfant : il gagne des cœurs et fait grandir son avatar.

Comptez deux minutes par jour, pas plus. Rien n'est à installer, tout se synchronise entre vos appareils.

Un principe, si vous n'en retenez qu'un : ici, on ne retire jamais de points. Quand quelque chose se passe mal, on répare — et c'est le geste de réparation qui est récompensé.

Une question, une idée, un bogue ? Répondez simplement à cet e-mail, je lis tout.

Cédric
FamiTeam — {lien}`
  },
  {
    id: "m_activation", titre: "Relance d'activation (J+3)", dest: "Famille inscrite sans aucune mission validée",
    quand: "Chantier Activation, automatique à J+3",
    sujet: "Un coup de main pour votre première soirée FamiTeam ?",
    corps: `Bonjour {prenom},

J'ai vu que votre famille était créée, mais que la première mission n'avait pas encore été cochée. C'est le moment le plus délicat, alors voici le raccourci :

Ce soir, avant le coucher, ouvrez FamiTeam avec votre enfant et cochez UNE seule chose qu'il a faite dans la journée. Une seule. Vous verrez son visage quand l'avatar bougera.

Si quelque chose vous a bloqué — un écran pas clair, une question de confiance, un doute sur l'âge de vos enfants — dites-le moi en répondant à cet e-mail. Cela m'aide à améliorer l'app pour tout le monde.

Cédric
FamiTeam — {lien}`
  },
  {
    id: "m_reactivation", titre: "Réveil d'une famille inactive", dest: "Famille sans activité depuis 30 jours",
    quand: "Chantier Activation, une fois par trimestre au maximum",
    sujet: "On vous a gardé votre place 🌱",
    corps: `Bonjour {prenom},

Vos données sont intactes : les cœurs, l'avatar et l'écosystème de {enfant} vous attendent exactement là où vous les avez laissés.

Depuis votre dernière visite : {nouveautes}.

Si FamiTeam ne vous convient pas, dites-le moi franchement en une ligne — je préfère une critique utile à un compte endormi. Et si vous voulez tout effacer, cela se fait en deux clics dans Réglages → Mon compte.

Cédric
FamiTeam — {lien}`
  },
  {
    id: "m_waitlist_invit", titre: "Invitation d'une vague (liste d'attente)", dest: "Personne inscrite sur la liste d'attente",
    quand: "Chantier Liste d'attente, à chaque vague",
    sujet: "Votre place dans FamiTeam est ouverte 🎁",
    corps: `Bonjour,

Vous vous étiez inscrit·e sur la liste d'attente de FamiTeam. Votre place est ouverte : voici votre lien d'inscription personnel.

{lien_invitation}

FamiTeam aide les enfants de 2 à 7 ans à adopter des comportements positifs, dans l'esprit de la parentalité bienveillante : on encourage, on répare, on ne punit pas. C'est gratuit, sans publicité, et vos données restent en Europe.

Une seule chose en échange : si quelque chose vous gêne pendant la première semaine, écrivez-le moi. J'ouvre les accès par petites vagues précisément pour pouvoir répondre à chacun.

Cédric
FamiTeam`
  },
  {
    id: "m_waitlist_relance", titre: "Relance de vague (J+7)", dest: "Invité·e qui n'a pas créé sa famille",
    quand: "Chantier Liste d'attente, une seule fois",
    sujet: "Votre lien FamiTeam est encore valable",
    corps: `Bonjour,

Votre lien d'inscription est toujours actif : {lien_invitation}

Si ce n'est pas le bon moment, ignorez simplement cet e-mail — je ne relancerai pas une deuxième fois. Et si quelque chose vous a fait hésiter (le prix, les données, l'âge de vos enfants), répondez-moi en une ligne : c'est précieux.

Cédric
FamiTeam`
  },
  {
    id: "m_parrainage", titre: "Demande de parrainage", dest: "Famille active depuis 3 semaines",
    quand: "Chantier Parrainage, après un moment positif",
    sujet: "Une famille amie à qui offrir FamiTeam ?",
    corps: `Bonjour {prenom},

Cela fait trois semaines que votre famille utilise FamiTeam, et {enfant} a déjà gagné {coeurs} cœurs. Merci — vous faites partie des premières familles, celles qui façonnent l'app.

Si vous connaissez une famille avec des enfants de 2 à 7 ans qui galère sur les routines du soir, vous pouvez lui offrir un accès : la pastille 🎁 en haut à gauche de l'app crée un lien de parrainage. Trois familles par semaine, gratuitement.

C'est aujourd'hui la seule façon de nous faire connaître : pas de publicité, pas de budget marketing. Juste des parents qui en parlent à d'autres parents.

Cédric
FamiTeam — {lien}`
  },
  {
    id: "m_temoignage", titre: "Demande de témoignage", dest: "Famille active et satisfaite",
    quand: "Chantier Page publique & preuve",
    sujet: "Deux phrases sur votre expérience FamiTeam ?",
    corps: `Bonjour {prenom},

Je prépare la page d'accueil publique de FamiTeam et je préfère y mettre de vraies phrases de parents plutôt que mes arguments.

Accepteriez-vous de répondre en deux ou trois phrases à ceci :
— Comment se passaient les fins de journée avant ?
— Qu'est-ce qui a changé, concrètement ?

Je publierais uniquement votre prénom et votre ville (par exemple « Sophie, Namur »), jamais le prénom de vos enfants ni de photo. Vous relisez avant publication, et vous pouvez demander le retrait à tout moment.

Merci beaucoup,
Cédric
FamiTeam`
  },
  {
    id: "m_influence", titre: "Micro-influence parentalité", dest: "Compte Instagram/TikTok parentalité (2 000 à 20 000 abonnés)",
    quand: "Chantier Communautés",
    sujet: "Test honnête de FamiTeam — parentalité positive, 2-7 ans",
    corps: `Bonjour {prenom},

Je suis {qui}, papa et développeur en Belgique. J'ai créé FamiTeam pour mes propres enfants : une app où l'on encourage les comportements positifs des 2-7 ans sans jamais punir — quand quelque chose se passe mal, l'enfant répare, et c'est la réparation qui est récompensée.

Je suis votre compte parce que {raison_precise}.

Ma proposition est simple et sans contrepartie financière : je vous ouvre un accès complet gratuit à vie, vous testez en famille pendant deux semaines, et vous en parlez seulement si cela vous a réellement servi. Un avis négatif public me va très bien : cela m'indique quoi corriger.

Intéressé·e ? Je vous envoie le lien d'accès.

{qui}
FamiTeam — {lien}`
  },
  {
    id: "m_presse", titre: "Pitch presse", dest: "Journaliste rubrique famille / éducation",
    quand: "Chantier Presse, jamais en envoi groupé",
    sujet: "Réparer plutôt que punir : une app belge pour les 2-7 ans",
    corps: `Bonjour {prenom},

J'ai lu votre article « {article} » et c'est pour cela que je vous écris plutôt qu'à la rédaction en général.

Je suis {qui}, développeur et papa en Belgique. J'ai construit FamiTeam, une application familiale gratuite pour les enfants de 2 à 7 ans, avec un parti pris qui va à l'encontre des tableaux de récompenses classiques : aucun point n'est jamais retiré. Quand un incident survient (une dispute, un objet cassé), l'enfant choisit un geste de réparation — et c'est ce geste qui est récompensé.

Deux angles qui peuvent vous intéresser :
— La punition mesurée contre la réparation : ce que dit la recherche en parentalité positive, et à quoi cela ressemble dans une app utilisée deux minutes par jour.
— Un logiciel familial fait en Belgique, sans publicité, sans revente de données, hébergé en Europe, à contre-courant du modèle américain.

Chiffres actuels : {familles} familles, {langues} langues, gratuit. Je peux vous ouvrir un accès complet, vous fournir des captures en haute définition et mettre des familles utilisatrices en contact avec vous.

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_podcast", titre: "Proposition podcast", dest: "Animateur/animatrice de podcast parentalité",
    quand: "Chantier Presse",
    sujet: "Épisode possible : pourquoi retirer des points ne marche pas",
    corps: `Bonjour {prenom},

J'écoute {podcast} et l'épisode sur {episode} m'a marqué.

Je vous propose un sujet d'épisode, pas une promotion : « pourquoi retirer des points à un enfant lui apprend surtout à cacher ses erreurs — et ce qu'on peut faire à la place ». Je peux parler concrètement de la réparation, du budget d'attention selon l'âge (quelques minutes par jour suffisent), et de ce que j'ai vu échouer en construisant une app pour mes propres enfants.

Je suis développeur, papa de {nb_enfants} enfants, et je ne vends rien : FamiTeam est gratuite. Je suis disponible en visioconférence ou à {ville}.

{qui}
FamiTeam — {lien}`
  },
  {
    id: "m_ecole", titre: "Prise de contact école", dest: "Direction d'école maternelle ou primaire",
    quand: "Chantier Écoles",
    sujet: "Outil gratuit de parentalité positive pour les familles de votre école",
    corps: `Madame, Monsieur,

Je suis {qui}, parent {lien_ecole} et développeur. J'ai créé FamiTeam, une application familiale gratuite qui aide les enfants de 2 à 7 ans à adopter des comportements positifs à la maison : entraide, autonomie, respect du vivant.

Le principe tient en une phrase : on ne retire jamais de points ; quand quelque chose se passe mal, l'enfant répare et c'est la réparation qui est valorisée.

Ce que je propose, sans aucune contrepartie financière :
— une présentation de 15 minutes à votre équipe, au moment qui vous convient ;
— un dépliant A5 à remettre aux parents qui le souhaitent, avec un QR code ;
— un accès complet gratuit pour les familles de l'école.

Points d'attention que vous vous posez sûrement : aucune publicité, aucune revente de données, hébergement en Europe, aucune donnée d'enfant demandée au-delà du prénom et de l'année de naissance, et l'école n'a accès à rien.

Je reste à votre disposition pour un appel de dix minutes.

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_creche", titre: "Prise de contact crèche / extrascolaire", dest: "Responsable de milieu d'accueil",
    quand: "Chantier Crèches",
    sujet: "Atelier parents gratuit : encourager sans punir (2-7 ans)",
    corps: `Bonjour,

Je suis {qui}, papa et développeur. Je propose aux milieux d'accueil un atelier gratuit de 45 minutes pour les parents : « encourager sans punir — que faire quand ça dérape ».

L'atelier est indépendant de tout produit : on y parle de renforcement positif, de réparation, et du peu de temps qu'il faut réellement y consacrer chaque jour. En fin de séance, je montre FamiTeam, l'application gratuite que j'ai développée pour mes propres enfants, pour celles et ceux que cela intéresse.

Aucune publicité, aucune revente de données, hébergement en Europe.

Seriez-vous intéressé·e pour une date à {ville} ? Je m'adapte à vos horaires, y compris en soirée.

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_pro_sante", titre: "Professionnel de l'enfance", dest: "Pédiatre, psychologue, logopède, coach parental",
    quand: "Chantier Professionnels",
    sujet: "Support gratuit pour les familles que vous accompagnez (2-7 ans)",
    corps: `Bonjour Docteur / Madame / Monsieur,

Je suis {qui}, développeur et papa. J'ai construit FamiTeam, un outil familial gratuit pour les 2-7 ans, fondé sur le renforcement positif : les comportements souhaités sont valorisés, aucun point n'est jamais retiré, et les incidents se règlent par un geste de réparation.

Je vous joins une note d'une page sur les principes retenus et leurs sources. Je serais heureux d'avoir votre regard critique : si quelque chose vous paraît discutable sur le plan du développement de l'enfant, je veux le savoir et le corriger.

Si l'outil vous semble utile, je peux vous fournir des dépliants pour votre salle d'attente et un accès complet gratuit pour les familles que vous suivez.

Avec mes respectueuses salutations,
{qui}
{telephone} — {lien}`
  },
  {
    id: "m_mutuelle", titre: "Mutuelle / assurance", dest: "Responsable avantages membres",
    quand: "Chantier Professionnels",
    sujet: "Avantage membre « parentalité positive » — proposition de partenariat",
    corps: `Bonjour {prenom},

Je suis {qui}, fondateur de FamiTeam, une application familiale belge pour les enfants de 2 à 7 ans, centrée sur la parentalité positive : encourager, réparer, ne pas punir.

Votre catalogue d'avantages membres comporte déjà {avantage_existant}. Je propose de le compléter par un avantage numérique à coût maîtrisé pour vous et à valeur immédiate pour vos affiliés : accès premium offert aux familles membres, avec un code dédié qui nous permet de mesurer l'usage réel.

Nos garanties : hébergement européen, aucune publicité, aucune revente de données, aucune donnée de santé, et aucune donnée nominative transmise à votre organisation.

Puis-je vous présenter cela en vingt minutes, en visioconférence ?

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_employeur", titre: "Employeur / comité d'entreprise", dest: "Responsable RH ou délégation du personnel",
    quand: "Chantier Employeurs",
    sujet: "Un avantage concret pour vos collaborateurs parents",
    corps: `Bonjour {prenom},

Les fins de journée sont le moment le plus difficile pour les parents de jeunes enfants, et cela se voit au travail le lendemain.

FamiTeam est une application familiale belge pour les enfants de 2 à 7 ans : deux minutes par soir, en famille, pour valoriser les comportements positifs sans punir. Je propose aux employeurs un accès premium pour leurs collaborateurs parents, facturé une fois par an, au prix de {prix} par collaborateur.

Ce que vous n'aurez pas à gérer : aucune donnée personnelle ne vous est transmise, aucune installation, aucun compte à administrer — un simple code d'activation.

Un pilote de trois mois sur un service volontaire vous permettrait de juger sur pièces. Puis-je vous en parler vingt minutes ?

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_partenaire", titre: "Partenaire récompense (sortie famille)", dest: "Zoo, cinéma, parc, librairie jeunesse, piscine",
    quand: "Chantier Partenariats récompenses",
    sujet: "Votre sortie comme récompense familiale dans FamiTeam",
    corps: `Bonjour,

FamiTeam est une application familiale belge où les enfants de 2 à 7 ans gagnent, par leurs efforts du quotidien, des « cartes surprises » : des sorties en famille que les parents débloquent avec eux.

Je cherche des lieux comme {lieu} pour devenir ces récompenses. Le principe est simple : votre sortie apparaît comme objectif d'équipe pour les familles de la région ; en échange, vous proposez un avantage famille (réduction, entrée offerte pour un enfant, atelier).

Deux garanties auxquelles je ne dérogerai pas : aucune publicité n'apparaît dans l'écran des enfants — c'est le parent qui choisit les récompenses — et aucune donnée n'est transmise à qui que ce soit.

Cela vous amène des familles motivées, à un coût nul jusqu'à la visite. Puis-je vous appeler cette semaine ?

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_premium", titre: "Annonce du premium", dest: "Toutes les familles inscrites avant l'ouverture du premium",
    quand: "Chantier Modèle & prix, avant toute mise en place du paiement",
    sujet: "FamiTeam reste gratuit pour vous — voici pourquoi je vous écris quand même",
    corps: `Bonjour {prenom},

FamiTeam va proposer une formule payante à partir du {date}. Un point important avant tout le reste : cela ne vous concerne pas. Votre famille fait partie des premières, celles qui ont essuyé les bogues et envoyé des idées. Votre accès reste **complet et gratuit, à vie**. Aucune carte à enregistrer, aucune date limite, rien à faire.

Pourquoi une formule payante alors ? Pour payer l'hébergement et les envois d'e-mails, et pour que l'app puisse continuer sans publicité et sans revente de données. Les nouvelles familles auront un usage gratuit complet jusqu'à deux enfants, et une formule à {prix} pour les familles nombreuses et les statistiques avancées.

Ce qui ne changera jamais : pas de publicité, pas de revente de données, et vos données exportables ou supprimables en deux clics.

Merci d'avoir été là au début. Si une chose vous paraît injuste dans ce qui précède, répondez-moi : je préfère l'entendre maintenant.

Cédric
FamiTeam — {lien}`
  },
  {
    id: "m_subvention", titre: "Demande de rendez-vous (aide publique)", dest: "Conseiller hub.brussels, Digital Wallonia, VLAIO…",
    quand: "Chantier Financements",
    sujet: "Demande de rendez-vous d'information — projet numérique familial",
    corps: `Bonjour,

Je développe FamiTeam, une application web familiale destinée aux enfants de 2 à 7 ans, fondée sur la parentalité positive. Le produit fonctionne, il est utilisé par {familles} familles, il est traduit en quatre langues et hébergé en Europe. Je suis actuellement seul sur le projet, en {statut}.

Je souhaite un rendez-vous d'information pour identifier l'aide la plus adaptée à cette étape (montée en charge technique, mise en conformité, ouverture au marché néerlandophone) et vérifier mon éligibilité avant de constituer un dossier.

Je peux vous transmettre à l'avance une note de deux pages : marché, modèle économique, prévisionnel à trois ans, et emploi précis du financement demandé.

Quelles sont vos disponibilités dans les deux prochaines semaines ?

{qui}
{telephone} — {lien}`
  }
];

// Chantiers d'une phase donnée (utilitaire d'affichage).
function chantiersDePhase(phaseId) {
  return CROISSANCE_CHANTIERS.filter(c => c.phase === phaseId);
}
// Modèle d'e-mail par identifiant.
function mailCroissance(id) {
  return CROISSANCE_MAILS.find(m => m.id === id) || null;
}
