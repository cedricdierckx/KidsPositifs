/* =====================================================================
 * FamiTeam — Développement : contraintes, chantiers & modèles d'e-mails
 * ---------------------------------------------------------------------
 * Source unique du plan. Le contenu est volontairement en français : il
 * s'adresse à l'administrateur (back-office), pas aux familles.
 *
 * DEUX CONTRAINTES STRUCTURANTES (voir CROISSANCE_CONTRAINTES) :
 *   1. le projet ne peut pas devenir une activité professionnelle ;
 *   2. une heure par semaine, pas davantage.
 * Elles ne sont pas des commentaires : elles déterminent le périmètre de
 * chaque chantier (« coeur », « plus_tard », « hors ») et la durée estimée
 * de chaque étape, qui sert à composer la séance hebdomadaire de 60 min.
 *
 * L'avancement (étapes cochées, notes) n'est PAS stocké ici : il vit dans
 * app_config → clé "croissance" (JSON), écrite via la RPC set_app_config
 * réservée aux admins.
 *
 * Voir PLAN-COMMERCIAL.md pour l'analyse de marché et le business plan.
 * ===================================================================== */

/* ---------- Les deux contraintes, et ce qu'elles impliquent ---------- */
const CROISSANCE_CONTRAINTES = [
  {
    id: "pro", emoji: "⚖️", titre: "Ce ne peut pas devenir une activité professionnelle",
    detail: "La profession de notaire est incompatible avec l'exercice d'une activité commerciale. FamiTeam reste donc un projet personnel, non marchand par défaut.",
    consequences: [
      "Pas d'exploitation commerciale en nom propre : gratuit + dons, ou structure sans but lucratif.",
      "Les canaux qui supposent de vendre (employeurs, mutuelles, publicité payante, affiliation) sortent du périmètre.",
      "Ne jamais promouvoir l'app en s'appuyant sur le titre notarial : les deux mondes restent séparés.",
      "Le cadre exact se vérifie auprès de la Chambre : c'est la toute première étape du plan."
    ]
  },
  {
    id: "anonymat", emoji: "🕶️", titre: "Discrétion, et une app qui tourne seule",
    detail: "Le fondateur reste en retrait dans l'app et dans sa communication publique : pas de nom mis en avant, aucune organisation qui appellerait des sollicitations. En revanche, écrire à quelqu'un en son nom personnel — un blogueur, une directrice d'école — ne pose aucun problème : c'est un contact choisi, pas une exposition. Rien n'annonce jamais un refus de communiquer ; on fait simplement en sorte que le besoin d'écrire ne naisse pas.",
    consequences: [
      "Le produit répond avant qu'on ne demande : FAQ complète, export et suppression en libre-service, messages d'erreur explicites.",
      "Les e-mails aux familles sont signés « FamiTeam » et ne sollicitent pas de réponse — sans jamais dire qu'on n'en donnera pas.",
      "La boîte à idées est ouverte à toutes les familles, elle est accueillante et n'engage à rien : les idées sont revues par lots, pas au fil de l'eau. Aucune ne se perd.",
      "Les contacts sortants choisis (blogueurs, écoles, crèches) sont possibles en nom personnel ; ce qui reste écarté, c'est l'exposition subie : interviews, portraits, vidéos.",
      "Tout ce qui peut tourner seul tourne seul : vagues d'invitations, relances, parrainage, remerciements, rapport mensuel.",
      "L'identité de l'éditeur reste obligatoire sur les pages légales tant qu'il est responsable de traitement — seule une structure (ASBL) déplacerait cette mention."
    ]
  },
  {
    id: "temps", emoji: "⏱️", titre: "Une heure par semaine",
    detail: "52 heures par an. C'est la ressource la plus rare du projet : chaque étape du plan porte une durée estimée, et la séance hebdomadaire se compose à partir de ce budget.",
    consequences: [
      "Tout ce qui est récurrent doit être automatisé une fois, jamais refait à la main.",
      "Un plafond de familles est assumé : le support ne se délègue pas et il croît avec les usagers.",
      "Une seule action par semaine. Deux fronts en parallèle, c'est zéro front terminé.",
      "Les canaux à cycle long (vente B2B, publicité) coûtent plus d'heures qu'ils n'en rapportent."
    ]
  }
];

/* ---------- Le rituel : quatre semaines type, une heure chacune ---------- */
const CROISSANCE_RITUEL = [
  { id: "s1", titre: "Semaine 1 — Les chiffres", detail: "10 min : relever l'étoile du Nord et deux indicateurs. 50 min : la prochaine étape du chantier en cours." },
  { id: "s2", titre: "Semaine 2 — Un contact", detail: "Un seul e-mail de prescripteur (école, crèche, professionnel), personnalisé, envoyé. Puis on referme." },
  { id: "s3", titre: "Semaine 3 — Le produit", detail: "Une correction ou une amélioration issue des retours des familles. Rien d'autre." },
  { id: "s4", titre: "Semaine 4 — Les idées", detail: "Revue des idées reçues : trier, copier la consigne pour Claude Code, faire implémenter une amélioration. Les vagues d'invitations, les relances et les remerciements partent seuls : rien à faire de ce côté." }
];

/* ---------- Phases ---------- */
const CROISSANCE_PHASES = [
  { id: "p0", titre: "Phase 0 — Le cadre", sous: "Vérifier ce qu'on a le droit de faire, mesurer, automatiser. Avant tout le reste." },
  { id: "p1", titre: "Phase 1 — Traction organique", sous: "Faire venir des familles sans budget et sans y passer ses soirées." },
  { id: "p2", titre: "Phase 2 — Prescripteurs", sous: "Écoles, crèches, professionnels : ils parlent à notre place. Meilleur rapport heure/famille." },
  { id: "p3", titre: "Phase 3 — Tenir dans la durée", sous: "Rester gratuit, rester en règle, rester soutenable à une heure par semaine." },
  { id: "p4", titre: "Phase 4 — Hors périmètre (pour mémoire)", sous: "Incompatible avec les contraintes actuelles. Conservé au cas où le cadre changerait." }
];

/* ---------- Chantiers ----------
 * perimetre : "coeur" (à faire), "plus_tard" (si le temps le permet),
 *             "hors" (exclu par les contraintes, gardé pour mémoire).
 * min sur une étape : durée estimée en minutes (budget de la séance).
 * mail sur une étape : identifiant d'un modèle de CROISSANCE_MAILS. */
const CROISSANCE_CHANTIERS = [
  /* ===== Phase 0 — Le cadre ===== */
  {
    id: "c_cadre", phase: "p0", emoji: "⚖️", titre: "Cadre déontologique & juridique", perimetre: "coeur",
    but: "Savoir précisément ce qui est permis avant d'investir une heure de plus.",
    kpi: "Un cadre écrit, validé, qui ne se rediscute plus",
    etapes: [
      { id: "c_cadre_1", titre: "Écrire la question en cinq lignes", min: 20, detail: "Application gratuite, pas de recettes, dons éventuels, développée sur temps libre : est-ce compatible ? Sous quelle forme ?" , fait: true },
      { id: "c_cadre_2", titre: "Interroger la Chambre", min: 30, detail: "Tranché : un projet gratuit dont les frais sont couverts par des dons, développé sur temps libre, ne constitue pas une activité professionnelle. Le cadre ne se rediscute plus.", fait: true },
      { id: "c_cadre_3", titre: "Trancher la forme", min: 45, detail: "Tranché : projet personnel non marchand, financé par des dons, sans structure à créer. C'est la forme la plus simple qui tienne — une ASBL ne se justifierait que si les dons devaient être gérés collectivement.", fait: true },
      { id: "c_cadre_4", titre: "Séparer les deux mondes", min: 20, detail: "Ni le titre ni l'étude n'apparaissent dans la communication ; adresse et contact distincts." , fait: true },
      { id: "c_cadre_5", titre: "Mettre les pages légales en accord", min: 25, detail: "Mentions légales et politique de confidentialité doivent refléter la forme retenue." , fait: true }
    ]
  },
  {
    id: "c_mesure", phase: "p0", emoji: "📏", titre: "Socle de mesure", perimetre: "coeur",
    but: "Savoir en dix minutes par mois si l'app grandit et où elle fuit.",
    kpi: "Familles actives 7 j (étoile du Nord) · activation J+1",
    etapes: [
      { id: "c_mesure_1", titre: "Définir l'étoile du Nord", min: 10, detail: "Familles actives sur 7 jours. Tout le reste est secondaire.", fait: true },
      { id: "c_mesure_2", titre: "Vérifier les séries de l'onglet Stats", min: 15, detail: "usage_events et les graphiques d'activité doivent être cohérents." , fait: true },
      { id: "c_mesure_3", titre: "Mesurer l'activation J+1", min: 30, detail: "Part des familles inscrites ayant validé une mission le lendemain. Cible : 60 %." , fait: true },
      { id: "c_mesure_4", titre: "Tracer l'origine des inscriptions", min: 40, detail: "Champ source sur la liste d'attente : parrainage, école, presse, bouche-à-oreille." , fait: true },
      { id: "c_mesure_5", titre: "Relevé mensuel, pas hebdomadaire", min: 10, detail: "Fait : le rapport mensuel automatique envoie les cinq chiffres ; il ne reste qu'à noter une décision." , fait: true }
    ]
  },
  {
    id: "c_auto", phase: "p0", emoji: "🤖", titre: "Automatiser tout le récurrent", perimetre: "coeur",
    but: "Chaque geste répétitif automatisé une fois libère des heures pour toujours.",
    kpi: "Zéro envoi manuel récurrent · support < 15 min/semaine",
    etapes: [
      { id: "c_auto_1", titre: "E-mail de bienvenue automatique", min: 45, detail: "Fait : envoyé à la création de la famille, dès que l'interrupteur « envois automatiques » est armé (onglet Croissance).", mail: "m_bienvenue" , fait: true },
      { id: "c_auto_2", titre: "Relance d'activation J+3 automatique", min: 45, detail: "Fait : les familles sans aucune activité après 3 jours sont listées dans l'onglet et relancées une seule fois. À armer.", mail: "m_activation" , fait: true },
      { id: "c_auto_3", titre: "Rapport mensuel envoyé à l'admin", min: 40, detail: "Fait : envoyé à l'adresse de support le premier jour du mois où tu ouvres l'app. À armer." , fait: true },
      { id: "c_auto_4", titre: "FAQ publique pour absorber le support", min: 60, detail: "Fait : faq.html, quinze questions, liée depuis l'écran de connexion, les réglages et les pages légales." , fait: true },
      { id: "c_auto_5", titre: "Réponses types aux retours", min: 20, detail: "Fait : cinq réponses prêtes à copier dans l'onglet Croissance." , fait: true }
    ]
  },
  {
    id: "c_preuve", phase: "p0", emoji: "🪧", titre: "Page publique & preuve", perimetre: "coeur",
    but: "Un parent qui arrive comprend en dix secondes et a envie d'essayer.",
    kpi: "Visiteurs → inscription : 8 %",
    etapes: [
      { id: "c_preuve_1", titre: "Promesse en une phrase", min: 20, detail: "Fait : « Deux minutes par jour, en famille : FamiTeam valorise les comportements positifs des 2-7 ans, sans jamais retirer de points. » Sur la page publique et dans les balises sociales." , fait: true },
      { id: "c_preuve_2", titre: "Trois captures d'écran parlantes", min: 30, detail: "Fait : trois captures réelles (missions de l'enfant, avatar, écran du parent), générées depuis l'état de démonstration, sur la page publique." , fait: true },
      { id: "c_preuve_3", titre: "Recueillir trois témoignages", min: 25, detail: "Prénom, ville, une phrase concrète, accord écrit.", mail: "m_temoignage" },
      { id: "c_preuve_4", titre: "Expliquer « réparer plutôt que punir »", min: 35, detail: "Fait : bloc « Réparer plutôt que punir » sur la page publique, en mots simples, avec un lien vers la FAQ." , fait: true },
      { id: "c_preuve_5", titre: "Bases du référencement", min: 30, detail: "Fait : description, Open Graph complet, image de partage, canonical, données structurées SoftwareApplication, sitemap.xml et robots.txt." , fait: true }
    ]
  },
  {
    id: "c_activation", phase: "p0", emoji: "🚀", titre: "Activation & rétention", perimetre: "coeur",
    but: "Que la première soirée se passe bien : tout se gagne ou se perd là.",
    kpi: "Activation J+1 : 60 % · rétention J+30 : 35 %",
    etapes: [
      { id: "c_activation_1", titre: "Carte « Premiers pas » dans l'espace parents", min: 0, detail: "Fait : trois gestes, état réel, disparaît une fois faite.", fait: true },
      { id: "c_activation_2", titre: "Lire les cinq derniers retours", min: 15, detail: "Les familles disent où ça coince mieux que n'importe quelle statistique." },
      { id: "c_activation_3", titre: "Corriger le premier point de friction", min: 60, detail: "Un seul, celui qui revient le plus. Puis on remesure." },
      { id: "c_activation_4", titre: "Réveil trimestriel des familles endormies", min: 20, detail: "Un envoi par trimestre, jamais plus.", mail: "m_reactivation" },
      { id: "c_activation_5", titre: "Vérifier l'effet, sinon annuler", min: 15, detail: "Si la correction n'a rien changé, la retirer plutôt que d'empiler." }
    ]
  },

  /* ===== Phase 1 — Traction organique ===== */
  {
    id: "c_parrainage", phase: "p1", emoji: "🎁", titre: "Boucle de parrainage", perimetre: "coeur",
    but: "Le seul canal qui grandit sans consommer d'heures : chaque famille heureuse en amène une.",
    kpi: "Coefficient viral k > 0,4",
    etapes: [
      { id: "c_parrainage_1", titre: "Parrainage en place (3 familles/semaine)", min: 0, detail: "Fait : pastille 🎁, table referrals, quota hebdomadaire.", fait: true },
      { id: "c_parrainage_2", titre: "Demander au bon moment", min: 45, detail: "Fait : une carte « beau moment en famille » apparaît dans l'écran parents pendant les sept jours qui suivent une carte surprise débloquée — le moment où le parent est content. Proposée une seule fois, avec « Ne plus me le proposer ».", fait: true },
      { id: "c_parrainage_3", titre: "E-mail de demande de parrainage", min: 20, detail: "Fait : proposé une seule fois aux familles installées depuis trois semaines, actives, et qui n'ont encore créé aucun lien. Part avec les autres envois automatiques, quand ils sont armés.", mail: "m_parrainage", fait: true },
      { id: "c_parrainage_4", titre: "Remercier le parrain", min: 15, detail: "Fait : dès qu'un filleul crée sa famille, le parrain voit un « Merci & bravo ! » avec confettis à sa prochaine ouverture. Automatique, sans e-mail à écrire : c'est ce qui déclenche le deuxième parrainage.", fait: true },
      { id: "c_parrainage_5", titre: "Mesurer k une fois par mois", min: 10, detail: "Fait : le coefficient viral est calculé et affiché dans les chiffres du moment (filleuls sur 30 j ÷ familles actives 7 j). Sous 0,2, le produit n'est pas encore assez aimé.", fait: true }
    ]
  },
  {
    id: "c_waitlist", phase: "p1", emoji: "📨", titre: "Liste d'attente & vagues", perimetre: "coeur",
    but: "Transformer la rareté en atout, et garder le support sous contrôle.",
    kpi: "Liste d'attente → inscription : 40 % par vague",
    etapes: [
      { id: "c_waitlist_1", titre: "Cadencer les vagues sur le temps disponible", min: 15, detail: "Fait : dans Croissance » Vagues d'invitation, un interrupteur bascule les inscriptions « ouvertes à tous » ou « par vagues », et un champ fixe la taille (20 familles par défaut). Réglable sans redéploiement.", fait: true },
      { id: "c_waitlist_2", titre: "E-mail d'invitation de vague", min: 20, detail: "Fait : chaque candidat reçoit un lien personnel qui l'autorise à créer sa famille même quand les inscriptions sont fermées. Une vague par mois au maximum, verrou en base : impossible d'inviter deux fois la même personne.", mail: "m_waitlist_invit", fait: true },
      { id: "c_waitlist_3", titre: "Relance unique à J+7", min: 15, detail: "Fait : sept jours après l'invitation, si aucun compte n'a été créé, une relance part une seule fois. Jamais de deuxième — la table mails_auto le garantit.", mail: "m_waitlist_relance", fait: true },
      { id: "c_waitlist_4", titre: "Écouter les familles de la vague", min: 10, detail: "Fait : les retours arrivent tout seuls par le module de suggestions et sont dépouillés dans le chantier récurrent 💡 Revue des idées reçues. Pas d'appel téléphonique : le projet reste discret et le temps va au produit.", fait: true },
      { id: "c_waitlist_5", titre: "Décider de l'ouverture publique", min: 5, detail: "À décider soi-même. Les deux chiffres sont affichés : conversion des vagues (viser 40 %) et activation J+1 (viser 55 %). Au-dessus des deux, basculer l'interrupteur sur « ouvertes ». Pas avant." }
    ]
  },
  {
    id: "c_communaute", phase: "p1", emoji: "💬", titre: "Contacts choisis (blogs & comptes parentalité)", perimetre: "coeur",
    but: "Écrire soi-même, en son nom, à quelques voix que les parents lisent déjà. Un contact choisi n'expose pas : ce n'est ni une interview ni un portrait, et l'app reste signée « FamiTeam ».",
    kpi: "10 inscriptions/mois issues de ces contacts",
    etapes: [
      { id: "c_communaute_1", titre: "Dresser la liste des cinq destinataires", min: 20, detail: "Blogs et comptes francophones de parentalité positive lus par des parents de 2-7 ans — Papa Positive, Les Supers Parents, Cool Parents Make Happy Kids, Apprendre à éduquer, Maman Louve… Prendre l'adresse de contact sur leur site : cinq suffisent, quinze diluent." },
      { id: "c_communaute_2", titre: "Envoyer les cinq e-mails", min: 25, detail: "Le modèle est écrit : ne restent que le prénom et une phrase propre à chacun (ce qu'on a aimé chez lui). Un envoi groupé n'obtient jamais de réponse.", mail: "m_influence" },
      { id: "c_communaute_3", titre: "Relancer une seule fois, à quinze jours", min: 15, detail: "Une relance courte, puis on laisse tranquille. Le silence est une réponse.", mail: "m_influence_relance" },
      { id: "c_communaute_4", titre: "Repérer d'où viennent les familles", min: 5, detail: "Chaque destinataire reçoit un lien marqué (?src=). L'origine des inscriptions s'affiche dans les chiffres du moment : on voit qui a réellement amené des familles." },
      { id: "c_communaute_5", titre: "Abandonner ce qui ne prend pas", min: 10, detail: "Trois essais sans résultat : on note et on arrête. La règle vaut pour ce canal comme pour les autres." }
    ]
  },
  {
    id: "c_presse", phase: "p1", emoji: "📰", titre: "Presse & podcasts", perimetre: "plus_tard",
    but: "Un article = des années de bouche-à-oreille en une journée, pour deux heures de travail. ⚠️ Expose nommément le fondateur (interviews, citations) : incompatible avec l'anonymat souhaité. Conservé si un porte-parole ou une structure prend le relais.",
    kpi: "1 parution",
    etapes: [
      { id: "c_presse_1", titre: "Dossier de presse d'une page", min: 50, detail: "Histoire, chiffres, ce qui est différent, contact, visuels. Écrit une fois, resservi partout." },
      { id: "c_presse_2", titre: "Choisir cinq journalistes, pas vingt", min: 30, detail: "BE : RTBF, Le Soir « Famille », La Libre, Femmes d'Aujourd'hui, Flair." },
      { id: "c_presse_3", titre: "Un pitch personnalisé par média", min: 45, detail: "Jamais d'envoi groupé : une accroche par média, sinon zéro réponse.", mail: "m_presse" },
      { id: "c_presse_4", titre: "Deux podcasts parentalité", min: 30, detail: "Proposition d'épisode sur « réparer plutôt que punir ».", mail: "m_podcast" },
      { id: "c_presse_5", titre: "Prévoir la vague avant la parution", min: 20, detail: "Vérifier les quotas Supabase et le stock d'invitations : une parution non préparée est une parution gâchée." }
    ]
  },
  {
    id: "c_contenu", phase: "p1", emoji: "✍️", titre: "Contenu & référencement", perimetre: "plus_tard",
    but: "Répondre aux questions que les parents tapent la nuit. Rentable, mais lent : une heure par semaine n'y suffit pas tant que le reste n'est pas fait.",
    kpi: "3 articles piliers · 200 visites organiques/mois",
    etapes: [
      { id: "c_contenu_1", titre: "Choisir trois sujets seulement", min: 25, detail: "« routine du soir 3 ans », « punir ou réparer », « tableau de récompenses : bonne idée ? »." },
      { id: "c_contenu_2", titre: "Écrire le premier article", min: 60, detail: "1 200 mots, utile même sans l'app, appel à l'action discret." },
      { id: "c_contenu_3", titre: "Écrire le deuxième", min: 60, detail: "Un par mois maximum. Le rythme tenu vaut mieux que le rythme ambitieux." },
      { id: "c_contenu_4", titre: "Écrire le troisième", min: 60, detail: "Puis s'arrêter et mesurer avant d'en écrire d'autres." },
      { id: "c_contenu_5", titre: "Mesurer et décider", min: 15, detail: "Si les trois articles n'amènent rien en trois mois, le canal n'est pas pour nous." }
    ]
  },

  /* ===== Phase 2 — Prescripteurs ===== */
  {
    id: "c_ecoles", phase: "p2", emoji: "🏫", titre: "Écoles maternelles & primaires", perimetre: "coeur",
    but: "Une institutrice convaincue parle à vingt-cinq familles d'un coup. Le meilleur rendement horaire du plan.",
    kpi: "2 écoles · 40 familles issues des écoles",
    etapes: [
      { id: "c_ecoles_1", titre: "Commencer par l'école de ses enfants", min: 15, detail: "La confiance existe déjà : c'est le contact le moins coûteux et le plus probable." },
      { id: "c_ecoles_2", titre: "Dépliant A5 imprimable", min: 50, detail: "À glisser dans le cartable : QR code, promesse, gratuité, RGPD. Fait une fois, resservi partout." },
      { id: "c_ecoles_3", titre: "Contacter deux directions", min: 30, detail: "Proposer quinze minutes en réunion d'équipe.", mail: "m_ecole" },
      { id: "c_ecoles_4", titre: "Un pilote d'un trimestre", min: 60, detail: "Une seule école à la fois. Bilan écrit à la fin." },
      { id: "c_ecoles_5", titre: "Décider de recommencer ou non", min: 15, detail: "Si le pilote n'amène pas dix familles, chercher pourquoi avant d'en lancer un deuxième." }
    ]
  },
  {
    id: "c_creches", phase: "p2", emoji: "🧸", titre: "Crèches & accueil extrascolaire", perimetre: "coeur",
    but: "Toucher les parents d'enfants de 2-3 ans, le bas de notre tranche d'âge.",
    kpi: "2 structures partenaires",
    etapes: [
      { id: "c_creches_1", titre: "Repérer cinq structures proches", min: 20, detail: "Milieux d'accueil, écoles de devoirs, plaines de vacances." },
      { id: "c_creches_2", titre: "Contacter cinq structures", min: 35, detail: "Un e-mail chacune, personnalisé.", mail: "m_creche" },
      { id: "c_creches_3", titre: "Affiche + QR code en salle d'attente", min: 40, detail: "Support physique, coût nul, effet durable, aucun entretien." },
      { id: "c_creches_4", titre: "Un atelier parents, si demandé", min: 60, detail: "45 minutes sur la parentalité positive. À ne faire que si la structure le propose." },
      { id: "c_creches_5", titre: "Un QR code par lieu", min: 20, detail: "Pour savoir lequel fonctionne sans avoir à demander." }
    ]
  },
  {
    id: "c_pros", phase: "p2", emoji: "🩺", titre: "Professionnels de l'enfance", perimetre: "coeur",
    but: "Pédiatres, psychologues, logopèdes : leur recommandation vaut dix publicités.",
    kpi: "5 professionnels prescripteurs",
    etapes: [
      { id: "c_pros_1", titre: "Note d'une page fondée sur la recherche", min: 60, detail: "Renforcement positif, réparation, budget d'attention par âge, sources citées." },
      { id: "c_pros_2", titre: "Contacter cinq praticiens", min: 35, detail: "Priorité aux psychologues et logopèdes qui suivent des 2-7 ans.", mail: "m_pro_sante" },
      { id: "c_pros_3", titre: "Déposer des dépliants", min: 30, detail: "Salle d'attente : le parent a le temps de lire." },
      { id: "c_pros_4", titre: "Obtenir un avis professionnel citable", min: 25, detail: "Une citation nominative sur la page publique, avec accord écrit." },
      { id: "c_pros_5", titre: "Entretenir deux relations, pas dix", min: 15, detail: "Un message par trimestre à ceux qui recommandent vraiment." }
    ]
  },

  /* ===== Phase 3 — Tenir dans la durée ===== */
  {
    id: "c_modele", phase: "p3", emoji: "🕊️", titre: "Modèle : non marchand par défaut", perimetre: "coeur",
    but: "Couvrir les frais sans jamais transformer le projet en commerce.",
    kpi: "Frais couverts par les dons · zéro recette commerciale",
    etapes: [
      { id: "c_modele_1", titre: "Chiffrer le coût réel annuel", min: 20, detail: "Fait : 27 €/an aujourd'hui (domaine 15 €, e-mails 12 € ; base et site sur les paliers gratuits). Le détail et les dons reçus s'affichent dans « Coût, dons et plafond ». Mesuré : 410 Ko par famille, soit environ 1 000 familles avant que la base gratuite ne suffise plus (≈ 280 €/an de plus).", fait: true },
      { id: "c_modele_2", titre: "Écrire la promesse de gratuité", min: 20, detail: "Fait : « tout ce qui est gratuit aujourd'hui le restera, pour toutes les familles » — publié dans les mentions légales et la FAQ, avec l'engagement de ne jamais déplacer une fonction existante derrière un paiement.", fait: true },
      { id: "c_modele_3", titre: "Dons : cadre et transparence", min: 45, detail: "Fait : le don est un cadeau sans contrepartie (aucune fonction, aucune limite levée), sans reçu fiscal, et le surplus reste en réserve. Publié dans les mentions légales et la FAQ, rappelé sous le bouton de don.", fait: true },
      { id: "c_modele_4", titre: "Décider du plafond de familles", min: 25, detail: "Fait : 800 familles, réglable dans l'admin. Surtout, le plafond s'applique tout seul — au-delà, les inscriptions basculent en liste d'attente sans intervention, et le basculement ne se fait jamais dans l'autre sens par accident.", fait: true },
      { id: "c_modele_5", titre: "Prévoir la sortie", min: 30, detail: "Fait : reprise, ouverture du code, ou fermeture ordonnée — dans cet ordre. En cas de fermeture, deux mois de préavis par e-mail, export disponible pendant toute la période, puis suppression. Publié dans les mentions légales.", fait: true }
    ]
  },
  {
    id: "c_idees", phase: "p3", emoji: "💡", titre: "Revue des idées reçues", perimetre: "coeur",
    recurrent: "mois",
    but: "Transformer les retours des familles en améliorations — de l'app comme du plan de développement — une fois par mois, sans jamais s'engager auprès de qui que ce soit.",
    kpi: "Une revue par mois · une amélioration livrée · zéro retour perdu",
    etapes: [
      { id: "c_idees_1", titre: "Ouvrir l'onglet Retours", min: 5, detail: "Admin → Retours : la liste se charge toute seule et rassemble tous les retours reçus, sans exception. Le compteur indique ce qui reste à passer en revue." },
      { id: "c_idees_2", titre: "Copier la consigne pour Claude Code", min: 5, detail: "Le bouton « Consigne pour Claude Code » reprend TOUT ce qui n'est pas encore marqué « traité » — y compris ce qui a seulement été lu le mois dernier — avec le contexte du projet. Il ne reste qu'à coller." },
      { id: "c_idees_3", titre: "Lire le tri et les propositions", min: 15, detail: "Claude Code rend trois piles argumentées (maintenant / plus tard / non) et jusqu'à trois propositions pour le développement commercial. Rien n'est codé avant validation." },
      { id: "c_idees_4", titre: "Faire implémenter et vérifier", min: 30, detail: "Une amélioration à la fois, testée, poussée sur dev. Le reste attend le mois prochain." },
      { id: "c_idees_5", titre: "Marquer les retours comme traités", min: 5, detail: "Statut « traité » dans l'onglet Retours. Seul ce statut sort un retour de la revue : tant qu'il n'est pas mis, le retour revient le mois suivant." }
    ]
  },
  {
    id: "c_conformite", phase: "p3", emoji: "🛡️", titre: "Conformité (données d'enfants)", perimetre: "coeur",
    but: "Grandir sans créer de risque juridique. Non négociable, y compris pour un projet gratuit.",
    kpi: "Registre à jour · zéro incident",
    etapes: [
      { id: "c_conformite_1", titre: "Registre des traitements", min: 45, detail: "Fait : REGISTRE-TRAITEMENTS.md à la racine du dépôt. Cinq traitements décrits (comptes, profils d'enfants, retours, liste d'attente, mesure), bases légales, durées, sécurité, procédure de violation. Document interne, produit sur demande de l'autorité.", fait: true },
      { id: "c_conformite_2", titre: "Documenter les sous-traitants", min: 25, detail: "Fait : section « Sous-traitants » dans la politique de confidentialité (Supabase — UE eu-west-1, Vercel, OVH pour le SMTP), avec le rôle de chacun et les transferts hors UE encadrés.", fait: true },
      { id: "c_conformite_3", titre: "Minimiser les données", min: 20, detail: "Fait : surnom recommandé, mois de naissance seulement (le jour n'est jamais demandé), et l'emoji d'enfant — devenu sans usage depuis les avatars — est supprimé de l'état au lieu d'être conservé « au cas où ».", fait: true },
      { id: "c_conformite_4", titre: "Tester export et suppression", min: 20, detail: "Fait, et deux trous corrigés : l'export contient désormais le compte, la famille et les retours écrits (art. 15 et 20), et la suppression du compte anonymise les retours au lieu d'y laisser l'adresse e-mail. Vérifié sur la base réelle.", fait: true },
      { id: "c_conformite_5", titre: "Accessibilité, une passe", min: 40, detail: "Fait : contraste du gris de texte porté à 4,5:1 sur le fond de page (WCAG AA), précision des chiffres corrigée, et nom accessible ajouté aux boutons-icônes (corbeille, crayon, flèches, +/−) dans les quatre langues.", fait: true }
    ]
  },
  {
    id: "c_soutenabilite", phase: "p3", emoji: "🧘", titre: "Soutenabilité du fondateur", perimetre: "coeur",
    but: "Que le projet survive à une semaine chargée, à des vacances, à une lassitude.",
    kpi: "Aucune semaine à plus d'une heure · le projet tourne sans intervention",
    etapes: [
      { id: "c_soutenabilite_1", titre: "Poser le créneau dans l'agenda", min: 10, detail: "Une heure fixe, même jour, même heure. Un projet sans créneau meurt." },
      { id: "c_soutenabilite_2", titre: "Une action par semaine, pas trois", min: 5, detail: "La séance se compose depuis « Ma semaine » : ce qui n'entre pas dans l'heure attend." },
      { id: "c_soutenabilite_3", titre: "Mode vacances", min: 30, detail: "Vérifier que trois semaines sans intervention ne cassent rien (e-mails, quotas, sauvegardes)." },
      { id: "c_soutenabilite_4", titre: "Consigner les décisions", min: 10, detail: "Deux lignes dans les notes du chantier : dans six mois, on ne s'en souviendra pas." },
      { id: "c_soutenabilite_5", titre: "Bilan semestriel : continuer ou arrêter", min: 30, detail: "Question honnête, deux fois par an. Arrêter proprement est une option respectable." }
    ]
  },

  /* ===== Phase 4 — Hors périmètre (pour mémoire) ===== */
  {
    id: "c_paiement", phase: "p4", emoji: "🔐", titre: "Abonnement payant & facturation", perimetre: "hors",
    but: "Exclu : vendre un abonnement serait une activité commerciale. Conservé si le cadre change (ASBL, cession).",
    kpi: "—",
    etapes: [
      { id: "c_paiement_1", titre: "Le champ plan existe déjà en base", min: 0, detail: "families.plan et plan_status : techniquement, rien à refaire.", fait: true },
      { id: "c_paiement_2", titre: "Brancher Stripe", min: 60, detail: "À n'ouvrir que si la forme juridique le permet." },
      { id: "c_paiement_3", titre: "TVA et guichet unique (OSS)", min: 60, detail: "Vente aux particuliers dans l'UE : TVA du pays du client." },
      { id: "c_paiement_4", titre: "CGV, factures, résiliation", min: 60, detail: "Obligations de vente à distance." }
    ]
  },
  {
    id: "c_employeurs", phase: "p4", emoji: "🏢", titre: "Employeurs, mutuelles & CE", perimetre: "hors",
    but: "Exclu : vente B2B, cycle long, incompatible avec le cadre et avec une heure par semaine.",
    kpi: "—",
    etapes: [
      { id: "c_employeurs_1", titre: "Offre « avantage salarié »", min: 60, detail: "Modèle prêt à ressortir si le cadre change.", mail: "m_employeur" },
      { id: "c_employeurs_2", titre: "Mutuelles : avantage membre", min: 60, detail: "Partenamut, Solidaris, MC.", mail: "m_mutuelle" },
      { id: "c_employeurs_3", titre: "Convention d'une page", min: 45, detail: "Le frein est juridique, pas commercial." }
    ]
  },
  {
    id: "c_paye", phase: "p4", emoji: "📣", titre: "Acquisition payante", perimetre: "hors",
    but: "Exclu : dépenser en publicité pour un service gratuit n'a pas de retour, et suppose un budget.",
    kpi: "—",
    etapes: [
      { id: "c_paye_1", titre: "Prérequis jamais atteints ici", min: 0, detail: "Il faudrait une valeur vie client, donc des recettes.", fait: true },
      { id: "c_paye_2", titre: "Test Meta 300 €", min: 60, detail: "Pour mémoire." },
      { id: "c_paye_3", titre: "Test Search 300 €", min: 60, detail: "Pour mémoire." }
    ]
  },
  {
    id: "c_recompenses", phase: "p4", emoji: "🎟️", titre: "Partenariats récompenses (affiliation)", perimetre: "hors",
    but: "Exclu : les commissions d'affiliation sont des recettes commerciales, et la gestion des partenaires est chronophage.",
    kpi: "—",
    etapes: [
      { id: "c_recompenses_1", titre: "Partenaires possibles", min: 30, detail: "Zoos, cinémas, librairies jeunesse. Pour mémoire.", mail: "m_partenaire" },
      { id: "c_recompenses_2", titre: "Variante sans argent", min: 45, detail: "Un lieu peut offrir un avantage famille sans qu'aucune commission ne circule : cette variante-là resterait possible." },
      { id: "c_recompenses_3", titre: "Cadre éthique", min: 20, detail: "Aucune publicité dans l'écran enfant, quelle que soit la forme." }
    ]
  },
  {
    id: "c_langues", phase: "p4", emoji: "🌍", titre: "Marchés néerlandophone & germanophone", perimetre: "plus_tard",
    but: "L'app est déjà traduite : l'actif dort. Mais ouvrir un marché demande du temps qu'on n'a pas encore.",
    kpi: "20 % des familles hors francophonie",
    etapes: [
      { id: "c_langues_1", titre: "Relecture NL par un natif", min: 45, detail: "Une traduction approximative tue la confiance." },
      { id: "c_langues_2", titre: "Page publique en NL", min: 60, detail: "Flandre : voisine, concurrence faible." },
      { id: "c_langues_3", titre: "Un prescripteur néerlandophone", min: 45, detail: "Une école de Bruxelles suffit pour tester." }
    ]
  }
];

/* ---------- Modèles d'e-mails ---------- */
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

FamiTeam est gratuit, sans publicité, et le restera. C'est un projet personnel, mené sur du temps libre et sans équipe : il n'y a donc pas de service d'assistance. Les réponses aux questions courantes sont rassemblées ici : {lien}/faq.html

L'équipe est réduite à une personne, et l'app est faite pour tourner sans elle : tout se règle depuis l'espace parents, y compris l'export et la suppression de vos données.

FamiTeam — {lien}`
  },
  {
    id: "m_activation", titre: "Relance d'activation (J+3)", dest: "Famille inscrite sans aucune mission validée",
    quand: "Automatique à J+3, chantier Automatiser",
    sujet: "Un coup de main pour votre première soirée FamiTeam ?",
    corps: `Bonjour {prenom},

J'ai vu que votre famille était créée, mais que la première mission n'avait pas encore été cochée. C'est le moment le plus délicat, alors voici le raccourci :

Ce soir, avant le coucher, ouvrez FamiTeam avec votre enfant et cochez UNE seule chose qu'il a faite dans la journée. Une seule. Vous verrez son visage quand l'avatar bougera.

Si quelque chose vous a bloqué, la page des questions fréquentes couvre l'essentiel : {lien}/faq.html

FamiTeam — {lien}`
  },
  {
    id: "m_reactivation", titre: "Réveil d'une famille endormie", dest: "Famille sans activité depuis 30 jours",
    quand: "Chantier Activation, une fois par trimestre au maximum",
    sujet: "On vous a gardé votre place 🌱",
    corps: `Bonjour {prenom},

Vos données sont intactes : les cœurs, l'avatar et l'écosystème de {enfant} vous attendent exactement là où vous les avez laissés.

Depuis votre dernière visite : {nouveautes}.

Si FamiTeam ne vous convient pas, rien à faire : le compte peut rester en sommeil sans conséquence. Et si vous préférez tout effacer, cela se fait en deux clics dans Réglages → Mon compte, sans passer par nous.

FamiTeam — {lien}`
  },
  {
    id: "m_waitlist_invit", titre: "Invitation d'une vague (liste d'attente)", dest: "Personne inscrite sur la liste d'attente",
    quand: "Automatique : une vague par mois, aux plus anciens candidats jamais invités",
    sujet: "Votre place dans FamiTeam est ouverte 🎁",
    corps: `Bonjour,

Vous vous étiez inscrit·e sur la liste d'attente de FamiTeam. Votre place est ouverte : voici votre lien d'inscription personnel.

{lien_invitation}

FamiTeam aide les enfants de 2 à 7 ans à adopter des comportements positifs, dans l'esprit de la parentalité bienveillante : on encourage, on répare, on ne punit pas. C'est gratuit, sans publicité, et vos données restent en Europe.

Les accès s'ouvrent par petites vagues, pour que chaque famille démarre dans de bonnes conditions. Tout se règle depuis l'app, et les questions fréquentes sont rassemblées sur famiteam.com/faq.html

FamiTeam`
  },
  {
    id: "m_waitlist_relance", titre: "Relance de vague (J+7)", dest: "Invité·e qui n'a pas créé sa famille",
    quand: "Automatique : sept jours après l'invitation, une seule fois",
    sujet: "Votre lien FamiTeam est encore valable",
    corps: `Bonjour,

Votre lien d'inscription est toujours actif : {lien_invitation}

Si ce n'est pas le bon moment, ignorez simplement cet e-mail : il n'y aura pas de deuxième relance.

FamiTeam`
  },
  {
    id: "m_parrainage", titre: "Demande de parrainage", dest: "Famille active depuis trois semaines",
    quand: "Chantier Parrainage, après un moment positif",
    sujet: "Une famille amie à qui offrir FamiTeam ?",
    corps: `Bonjour {prenom},

Cela fait quelques semaines que votre famille utilise FamiTeam. Merci — vous faites partie des premières familles, celles qui façonnent l'app.

Si vous connaissez une famille avec des enfants de 2 à 7 ans qui galère sur les routines du soir, vous pouvez lui offrir un accès : la pastille 🎁 en haut à gauche de l'app crée un lien de parrainage. Trois familles par semaine, gratuitement.

C'est la seule façon dont FamiTeam se fait connaître : pas de publicité, pas de budget, juste des parents qui en parlent à d'autres parents.

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
FamiTeam`
  },
  {
    id: "m_influence", titre: "Blog / compte parentalité", dest: "Blog ou compte francophone de parentalité positive",
    quand: "Chantier Contacts choisis, en nom personnel, jamais en envoi groupé",
    sujet: "Test honnête de FamiTeam — parentalité positive, 2-7 ans",
    corps: `Bonjour {prenom},

Je suis {qui}, papa en Belgique. J'ai créé FamiTeam pour mes propres enfants, sur mon temps libre : une app où l'on encourage les comportements positifs des 2-7 ans sans jamais punir — quand quelque chose se passe mal, l'enfant répare, et c'est la réparation qui est récompensée.

Je vous écris parce que {raison_precise}.

Ma proposition est simple et sans argent : l'app est gratuite pour tout le monde, je ne vends rien. Vous testez en famille pendant deux semaines, et vous en parlez seulement si cela vous a réellement servi. Un avis négatif public me va très bien : cela m'indique quoi corriger.

Intéressé·e ? Je vous envoie le lien.

{qui}
FamiTeam — {lien}`
  },
  {
    id: "m_influence_relance", titre: "Relance d'un contact choisi (J+15)", dest: "Blog ou compte contacté quinze jours plus tôt",
    quand: "Chantier Contacts choisis, une seule fois",
    sujet: "Re : test honnête de FamiTeam",
    corps: `Bonjour {prenom},

Je me permets un mot de rappel, au cas où mon message serait passé au mauvais moment.

La proposition tient toujours : accès gratuit, aucun engagement, et vous n'en parlez que si cela vous a réellement servi.

Si le sujet n'est pas pour vous, n'y pensez plus : je ne relancerai pas davantage.

{qui}
FamiTeam — {lien}`
  },
  {
    id: "m_presse", titre: "Pitch presse", dest: "Journaliste rubrique famille / éducation",
    quand: "Chantier Presse, jamais en envoi groupé",
    sujet: "Réparer plutôt que punir : une app belge gratuite pour les 2-7 ans",
    corps: `Bonjour {prenom},

J'ai lu votre article « {article} » et c'est pour cela que je vous écris plutôt qu'à la rédaction en général.

Je suis {qui}, papa en Belgique. J'ai construit FamiTeam sur mon temps libre : une application familiale gratuite pour les enfants de 2 à 7 ans, avec un parti pris qui va à l'encontre des tableaux de récompenses classiques : aucun point n'est jamais retiré. Quand un incident survient (une dispute, un objet cassé), l'enfant choisit un geste de réparation — et c'est ce geste qui est récompensé.

Deux angles qui peuvent vous intéresser :
— La punition mesurée contre la réparation : ce que dit la recherche en parentalité positive, et à quoi cela ressemble dans une app utilisée deux minutes par jour.
— Un logiciel familial fait en Belgique, gratuit, sans publicité, sans revente de données, hébergé en Europe, à contre-courant du modèle américain.

Chiffres actuels : {familles} familles, {langues} langues, gratuit et sans modèle payant prévu. Je peux vous ouvrir un accès complet, fournir des captures en haute définition et mettre des familles utilisatrices en contact avec vous.

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

Je suis papa de {nb_enfants} enfants et je ne vends rien : FamiTeam est gratuite et le restera. Je suis disponible en visioconférence ou à {ville}.

{qui}
FamiTeam — {lien}`
  },
  {
    id: "m_ecole", titre: "Prise de contact école", dest: "Direction d'école maternelle ou primaire",
    quand: "Chantier Écoles",
    sujet: "Outil gratuit de parentalité positive pour les familles de votre école",
    corps: `Madame, Monsieur,

Je suis {qui}, parent {lien_ecole}. J'ai créé sur mon temps libre FamiTeam, une application familiale gratuite qui aide les enfants de 2 à 7 ans à adopter des comportements positifs à la maison : entraide, autonomie, respect du vivant.

Le principe tient en une phrase : on ne retire jamais de points ; quand quelque chose se passe mal, l'enfant répare et c'est la réparation qui est valorisée.

Ce que je propose, sans aucune contrepartie financière — l'app est gratuite et je ne vends rien :
— une présentation de quinze minutes à votre équipe, au moment qui vous convient ;
— un dépliant A5 à remettre aux parents qui le souhaitent, avec un QR code ;
— un accès complet pour les familles de l'école.

Points d'attention que vous vous posez sûrement : aucune publicité, aucune revente de données, hébergement en Europe, aucune donnée d'enfant demandée au-delà du prénom et de l'année de naissance, et l'école n'a accès à rien.

Je reste à votre disposition pour un appel de dix minutes.

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_creche", titre: "Prise de contact crèche / extrascolaire", dest: "Responsable de milieu d'accueil",
    quand: "Chantier Crèches",
    sujet: "Outil gratuit pour les parents : encourager sans punir (2-7 ans)",
    corps: `Bonjour,

Je suis {qui}, papa. J'ai développé sur mon temps libre FamiTeam, une application familiale gratuite pour les enfants de 2 à 7 ans, fondée sur le renforcement positif : on encourage, on répare, on ne punit pas.

Je vous propose simplement de la faire connaître aux parents de votre structure : une affiche avec un QR code en salle d'attente, ou un dépliant. Aucune contrepartie, aucune publicité, aucune revente de données — l'app est gratuite et le restera.

Si un atelier parents de 45 minutes vous intéresse (« encourager sans punir : que faire quand ça dérape »), je peux aussi le proposer, en soirée de préférence.

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_pro_sante", titre: "Professionnel de l'enfance", dest: "Pédiatre, psychologue, logopède, coach parental",
    quand: "Chantier Professionnels",
    sujet: "Support gratuit pour les familles que vous accompagnez (2-7 ans)",
    corps: `Bonjour Docteur / Madame / Monsieur,

Je suis {qui}, papa, et j'ai construit sur mon temps libre FamiTeam, un outil familial gratuit pour les 2-7 ans, fondé sur le renforcement positif : les comportements souhaités sont valorisés, aucun point n'est jamais retiré, et les incidents se règlent par un geste de réparation.

Je vous joins une note d'une page sur les principes retenus et leurs sources. Je serais heureux d'avoir votre regard critique : si quelque chose vous paraît discutable sur le plan du développement de l'enfant, je veux le savoir et le corriger.

Si l'outil vous semble utile, je peux vous fournir des dépliants pour votre salle d'attente. L'app est gratuite, sans publicité, et je ne vends rien.

Avec mes respectueuses salutations,
{qui}
{telephone} — {lien}`
  },
  {
    id: "m_mutuelle", titre: "Mutuelle / assurance (hors périmètre)", dest: "Responsable avantages membres",
    quand: "Conservé si le cadre juridique change",
    sujet: "Avantage membre « parentalité positive » — proposition de partenariat",
    corps: `Bonjour {prenom},

Je suis {qui}, à l'origine de FamiTeam, une application familiale belge pour les enfants de 2 à 7 ans, centrée sur la parentalité positive : encourager, réparer, ne pas punir.

Votre catalogue d'avantages membres comporte déjà {avantage_existant}. Je propose de le compléter par un avantage numérique à coût maîtrisé pour vous et à valeur immédiate pour vos affiliés, avec un code dédié permettant de mesurer l'usage réel.

Nos garanties : hébergement européen, aucune publicité, aucune revente de données, aucune donnée de santé, et aucune donnée nominative transmise à votre organisation.

Puis-je vous présenter cela en vingt minutes, en visioconférence ?

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_employeur", titre: "Employeur / comité d'entreprise (hors périmètre)", dest: "Responsable RH ou délégation du personnel",
    quand: "Conservé si le cadre juridique change",
    sujet: "Un avantage concret pour vos collaborateurs parents",
    corps: `Bonjour {prenom},

Les fins de journée sont le moment le plus difficile pour les parents de jeunes enfants, et cela se voit au travail le lendemain.

FamiTeam est une application familiale belge pour les enfants de 2 à 7 ans : deux minutes par soir, en famille, pour valoriser les comportements positifs sans punir. Je propose aux employeurs un accès pour leurs collaborateurs parents, sans aucune donnée personnelle transmise à l'entreprise, sans installation et sans compte à administrer — un simple code d'activation.

Un pilote de trois mois sur un service volontaire vous permettrait de juger sur pièces. Puis-je vous en parler vingt minutes ?

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_partenaire", titre: "Partenaire récompense (hors périmètre)", dest: "Zoo, cinéma, parc, librairie jeunesse, piscine",
    quand: "Conservé pour la variante sans flux financier",
    sujet: "Votre sortie comme récompense familiale dans FamiTeam",
    corps: `Bonjour,

FamiTeam est une application familiale belge gratuite où les enfants de 2 à 7 ans gagnent, par leurs efforts du quotidien, des « cartes surprises » : des sorties en famille que les parents débloquent avec eux.

Je cherche des lieux comme {lieu} pour devenir ces récompenses. Le principe : votre sortie apparaît comme objectif d'équipe pour les familles de la région ; en échange, vous proposez un avantage famille (réduction, entrée offerte pour un enfant, atelier). Aucun flux financier entre nous, aucune commission.

Deux garanties : aucune publicité n'apparaît dans l'écran des enfants — c'est le parent qui choisit les récompenses — et aucune donnée n'est transmise à qui que ce soit.

Puis-je vous appeler cette semaine ?

{qui}
{telephone} — {lien}`
  },
  {
    id: "m_chambre", titre: "Question à la Chambre (déontologie)", dest: "Chambre des notaires",
    quand: "Chantier Cadre, tout premier envoi du plan",
    sujet: "Demande d'avis — développement d'une application familiale gratuite sur temps libre",
    corps: `Madame, Monsieur,

Je développe sur mon temps libre, depuis {date_debut}, une application familiale gratuite destinée aux enfants de 2 à 7 ans (parentalité positive). Elle est aujourd'hui utilisée par {familles} familles.

Le projet n'a aucune finalité lucrative : l'accès est gratuit, il n'y a ni publicité, ni revente de données, ni abonnement. Les frais techniques, de l'ordre de {couts} par an, sont supportés personnellement ; la seule recette envisagée serait un bouton de don destiné à les couvrir.

Je souhaite m'assurer de la compatibilité de cette activité avec mes obligations professionnelles, et notamment :
1. la simple mise à disposition gratuite d'une application développée à titre personnel appelle-t-elle une réserve ?
2. l'ouverture d'un bouton de don destiné à couvrir les seuls frais techniques modifie-t-elle l'analyse ?
3. si le projet devait un jour dépasser ce cadre, quelle forme (ASBL, cession à un tiers, participation passive) recommanderiez-vous d'examiner ?
4. quelles précautions attendez-vous quant à la séparation entre ce projet et ma fonction (absence de mention du titre, de l'étude, coordonnées distinctes) ?

Je m'engage naturellement à me conformer à votre position et à suspendre toute évolution du projet dans l'attente de votre réponse.

Je vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée.

{qui}`
  },
  {
    id: "m_reprise", titre: "Proposition de reprise du projet", dest: "Personne ou structure susceptible de reprendre l'exploitation",
    quand: "Chantier Modèle, étape « prévoir la sortie »",
    sujet: "Reprendre FamiTeam ?",
    corps: `Bonjour {prenom},

FamiTeam est une application familiale gratuite pour les enfants de 2 à 7 ans, que j'ai développée sur mon temps libre. Elle fonctionne, elle est utilisée par {familles} familles, elle est traduite en quatre langues et hébergée en Europe.

Je ne peux pas — et ne souhaite pas — en faire une activité professionnelle. Plutôt que de la laisser s'éteindre faute de temps, je préfère chercher qui pourrait la reprendre et lui donner la suite qu'elle mérite.

Ce qui serait transmis : le code, la base, le nom de domaine, la documentation, et mon accompagnement pendant la transition. Ce à quoi je tiens : la gratuité pour les familles déjà inscrites, l'absence de publicité, et le respect des données des enfants.

Si le sujet vous parle, en parlerions-nous ?

{qui}
{telephone} — {lien}`
  }
];

/* ---------- Utilitaires (rendu & tests) ---------- */
/* Clé d'avancement d'une étape. Pour un chantier récurrent, la clé porte la
 * période : le chantier se re-décoche donc tout seul au mois suivant, sans
 * rien effacer de l'historique. `moisCourant` est fourni par l'appelant
 * (l'horloge n'appartient pas à ce fichier de données). */
function cleEtapeCroissance(chantier, etape, moisCourant) {
  if (chantier && chantier.recurrent === "mois" && moisCourant) return etape.id + "@" + moisCourant;
  return etape.id;
}

// Chantiers d'une phase donnée.
function chantiersDePhase(phaseId) {
  return CROISSANCE_CHANTIERS.filter(c => c.phase === phaseId);
}
// Modèle d'e-mail par identifiant.
function mailCroissance(id) {
  return CROISSANCE_MAILS.find(m => m.id === id) || null;
}
// Durée estimée d'un chantier, en minutes.
function dureeChantier(ch) {
  return ch.etapes.reduce((s, e) => s + (e.min || 0), 0);
}
/* Compose la séance de la semaine : les prochaines étapes du périmètre
 * « cœur », dans l'ordre du plan, tant qu'elles tiennent dans le budget.
 * `estFaite(etape)` est fourni par l'appelant (l'avancement vit ailleurs). */
function seanceDeLaSemaine(estFaite, budgetMin) {
  const budget = budgetMin || 60;
  const choix = [];
  let total = 0;
  for (const ph of CROISSANCE_PHASES) {
    for (const ch of chantiersDePhase(ph.id)) {
      if (ch.perimetre !== "coeur") continue;
      for (const e of ch.etapes) {
        if (estFaite(e, ch)) continue;
        const d = e.min || 15;
        if (total + d > budget) return choix.length ? choix : [{ chantier: ch, etape: e }];
        choix.push({ chantier: ch, etape: e });
        total += d;
      }
    }
  }
  return choix;
}
