/* =====================================================================
 * FamiTeam — « Le Défi » : arènes privées entre familles amies
 * ---------------------------------------------------------------------
 * Page secrète (defi.html), liée depuis nulle part, noindex et exclue par
 * robots.txt. On n'y arrive que par l'URL directe, ou par le lien d'arène
 * qu'un ami envoie.
 *
 * Pourquoi séparée du reste ? L'application publique tient une doctrine :
 * pas de classement, aucun perdant fabriqué, aucun enfant sollicité. Ici,
 * ce sont des ADULTES qui se connaissent et qui CHOISISSENT de se défier,
 * pour une durée limitée, dans une arène privée. Les deux choses peuvent
 * coexister parce que celle-ci est fermée, volontaire et invisible depuis
 * l'application.
 *
 * Trois règles tenues, ici comme en base :
 *   - aucun enfant n'entre dans le calcul, à aucun titre ;
 *   - le nom d'équipe est choisi, jamais le nom de famille ;
 *   - seuls les parrainages obtenus PENDANT l'arène comptent.
 *
 * Quatre langues, avec leur propre table : la page ne charge pas js/i18n.js
 * (3 500 lignes destinées à l'application) pour une cinquantaine de phrases.
 * Elle partage en revanche la clé `kp_langue`, donc le choix de langue fait
 * dans l'application vaut ici, et réciproquement.
 * ===================================================================== */

let sb = null, session = null, familleId = null;
const CLE_FAMILLE = "kp_famille_active";        // même clé que l'application
const CLE_LANGUE = "kp_langue";                 // idem : le choix est partagé
const CLE_ARENE = "kp_arene_en_attente";        // arène rejointe après inscription
const CLE_PARRAIN = "kp_pending_parrain_code";  // code de parrainage de l'hôte

const DEFI_LANGUES = { fr: "FR", en: "EN", nl: "NL", de: "DE" };

/* ---------- Traductions ---------- */
const DEFI_I18N = {
  fr: {
    "chargement": "Ouverture de l'arène…",
    "config_t": "⚙️ Configuration manquante",
    "config_d": "Renseignez le projet Supabase dans <code>js/config.js</code>.",
    "titre": "🏆 Le Défi",
    "ouvrir_app": "Ouvrir FamiTeam",
    "sans_famille": "Ce compte n'a pas encore de famille. Crée-la dans l'application, puis reviens.",
    "sans_lien": "Cette page ne s'ouvre qu'avec un lien d'arène, ou en étant connecté.",
    "introuvable_t": "🏆 Arène introuvable",
    "introuvable_d": "Ce code n'existe pas, ou l'arène a été supprimée.",
    "introuvable_toast": "Arène introuvable.",
    "defie": "Tu as été défié·e",
    "ouverte_par": "Arène ouverte par <strong>{hote}</strong>",
    "equipes": "équipe(s)",
    "jours": "jour(s) restant(s)",
    "terminee": "Cette arène est terminée.",
    "regle": "La règle est simple : <strong>celui qui fait découvrir {app} au plus grand nombre de familles gagne.</strong> Une famille qui reste compte quatre fois plus qu'une inscription sans lendemain.",
    "relever": "⚔️ Je relève le défi",
    "relever_note": "Crée ta famille sur {app} (c'est gratuit), puis rouvre ce lien : tu entreras dans l'arène.",
    "confidentiel": "Zone confidentielle",
    "intro": "Une arène privée, entre familles amies. Celui qui fait découvrir {app} au plus de familles gagne. Rien de tout ceci n'apparaît dans l'application.",
    "mes_arenes": "Tes arènes",
    "en_cours": "en cours", "close": "terminée",
    "rejoindre_t": "Rejoindre une arène",
    "code_ph": "Code reçu d'un ami",
    "entrer": "Entrer dans l'arène",
    "creer_t": "Créer ton arène",
    "nom_ph": "Nom de l'arène (ex. Le défi des voisins)",
    "pseudo_ph": "Le nom de ton équipe",
    "d14": "14 jours — sprint", "d30": "30 jours — la saison classique", "d90": "90 jours — la guerre longue",
    "ouvrir_arene": "⚔️ Ouvrir l'arène",
    "pseudo_note": "Le nom d'équipe est celui qui s'affichera au classement. Jamais ton nom de famille, jamais le prénom d'un enfant.",
    "manque_nom": "Donne un nom à ton arène.",
    "manque_pseudo": "Choisis le nom de ton équipe.",
    "choisis_pseudo": "Choisis ton nom d'équipe",
    "pseudo_ex": "Ex. Les Ouistitis",
    "entree_note": "Ce nom, et lui seul, s'affichera au classement de cette arène. Tu peux quitter l'arène à tout moment : ton nom d'équipe est alors effacé.",
    "retour": "← Retour",
    "arene_close": "Arène terminée",
    "classe": "{rang}<sup>e</sup> sur {total}",
    "non_classe": "pas encore classé",
    "encore": "Encore <strong>{n}</strong> points pour {emoji} {nom}.",
    "rang_max": "Rang maximal atteint. 🐉",
    "attente": "⏳ <strong>{n}</strong> points en attente : {f} famille(s) que tu as amenée(s) n'ont pas encore ouvert l'app trois jours. Chacune passera de 25 à 100 points quand elle prendra le pli.",
    "podium": "Le podium",
    "amene_t": "Amène du monde",
    "amene_d": "Chaque famille qui s'inscrit avec ton lien te rapporte <strong>25 points</strong>, puis <strong>100</strong> dès qu'elle a ouvert l'app trois jours différents. Choisis bien qui tu invites : le volume ne paie pas.",
    "lien_prep": "Préparation de ton lien…",
    "lien_ko": "Lien indisponible pour le moment.",
    "qr_ko": "QR code indisponible pour ce lien (trop long) — le lien ci-dessus fonctionne normalement.",
    "inviter_t": "Inviter dans l'arène",
    "inviter_d": "Ce lien-ci fait entrer un ami <strong>dans cette arène</strong>.",
    "copier": "Copier", "copie": "Lien copié.", "copie_ko": "Sélectionné : copie-le.",
    "code_arene": "Code de l'arène :",
    "retour_arenes": "← Mes arènes",
    "quitter": "Quitter cette arène",
    "quitter_conf": "Tu quittes l'arène et ton nom d'équipe est effacé. Continuer ?",
    "quitte": "Tu as quitté l'arène.",
    "reste_jh": "{j} j {h} h restantes", "urgence": "DERNIÈRE LIGNE DROITE",
    "ecart_devant": "🎯 À <strong>{n}</strong> points de <strong>{pseudo}</strong>. Une famille vivante suffit parfois.",
    "ecart_tete": "👑 Tu mènes de <strong>{n}</strong> points sur <strong>{pseudo}</strong>. Ne lâche rien.",
    "hf_titre": "Hauts faits",
    "hf_premier_sang": "Premier sang", "hf_premier_sang_d": "Première équipe à marquer dans cette arène",
    "hf_double": "Doublé", "hf_double_d": "Deux familles amenées le même jour",
    "hf_triple": "Triplé", "hf_triple_d": "Trois familles amenées le même jour",
    "hf_regulier": "Régulier", "hf_regulier_d": "Des arrivées sur trois jours différents",
    "hf_sansfaute": "Sans faute", "hf_sansfaute_d": "Trois familles amenées, toutes installées",
    "hf_leader": "En tête", "hf_leader_d": "Première place de l'arène",
    "amene_d2": "C'est <strong>exactement le lien de ta famille dans {app}</strong> — le même que dans l'application. Chaque famille qui s'inscrit avec compte dans <strong>toutes tes arènes en cours</strong>.",
    "r1": "Recrue", "r2": "Éclaireur", "r3": "Ambassadeur", "r4": "Champion", "r5": "Légende"
  },
  en: {
    "chargement": "Opening the arena…",
    "config_t": "⚙️ Configuration missing",
    "config_d": "Set up the Supabase project in <code>js/config.js</code>.",
    "titre": "🏆 The Challenge",
    "ouvrir_app": "Open FamiTeam",
    "sans_famille": "This account has no family yet. Create it in the app, then come back.",
    "sans_lien": "This page only opens with an arena link, or while signed in.",
    "introuvable_t": "🏆 Arena not found",
    "introuvable_d": "This code doesn't exist, or the arena was deleted.",
    "introuvable_toast": "Arena not found.",
    "defie": "You've been challenged",
    "ouverte_par": "Arena opened by <strong>{hote}</strong>",
    "equipes": "team(s)",
    "jours": "day(s) left",
    "terminee": "This arena is over.",
    "regle": "The rule is simple: <strong>whoever introduces {app} to the most families wins.</strong> A family that stays counts four times more than a sign-up with no tomorrow.",
    "relever": "⚔️ I accept the challenge",
    "relever_note": "Create your family on {app} (it's free), then reopen this link: you'll enter the arena.",
    "confidentiel": "Private zone",
    "intro": "A private arena, between friend families. Whoever introduces {app} to the most families wins. None of this appears in the app.",
    "mes_arenes": "Your arenas",
    "en_cours": "running", "close": "over",
    "rejoindre_t": "Join an arena",
    "code_ph": "Code from a friend",
    "entrer": "Enter the arena",
    "creer_t": "Create your arena",
    "nom_ph": "Arena name (e.g. The neighbours' challenge)",
    "pseudo_ph": "Your team name",
    "d14": "14 days — sprint", "d30": "30 days — the classic season", "d90": "90 days — the long war",
    "ouvrir_arene": "⚔️ Open the arena",
    "pseudo_note": "The team name is what shows on the leaderboard. Never your family name, never a child's first name.",
    "manque_nom": "Give your arena a name.",
    "manque_pseudo": "Choose your team name.",
    "choisis_pseudo": "Choose your team name",
    "pseudo_ex": "e.g. The Marmosets",
    "entree_note": "This name, and only this name, appears on this arena's leaderboard. You can leave at any time: your team name is then erased.",
    "retour": "← Back",
    "arene_close": "Arena over",
    "classe": "#{rang} of {total}",
    "non_classe": "not ranked yet",
    "encore": "<strong>{n}</strong> more points for {emoji} {nom}.",
    "rang_max": "Top rank reached. 🐉",
    "attente": "⏳ <strong>{n}</strong> points pending: {f} family/families you brought haven't opened the app on three days yet. Each goes from 25 to 100 points once they settle in.",
    "podium": "The podium",
    "amene_t": "Bring people in",
    "amene_d": "Every family signing up with your link earns you <strong>25 points</strong>, then <strong>100</strong> once they've opened the app on three different days. Choose well: volume doesn't pay.",
    "lien_prep": "Preparing your link…",
    "lien_ko": "Link unavailable right now.",
    "qr_ko": "QR code unavailable for this link (too long) — the link above works fine.",
    "inviter_t": "Invite into the arena",
    "inviter_d": "This link brings a friend <strong>into this arena</strong>.",
    "copier": "Copy", "copie": "Link copied.", "copie_ko": "Selected: copy it.",
    "code_arene": "Arena code:",
    "retour_arenes": "← My arenas",
    "quitter": "Leave this arena",
    "quitter_conf": "You'll leave the arena and your team name will be erased. Continue?",
    "quitte": "You left the arena.",
    "reste_jh": "{j}d {h}h left", "urgence": "FINAL STRETCH",
    "ecart_devant": "🎯 <strong>{n}</strong> points behind <strong>{pseudo}</strong>. Sometimes one settled family is enough.",
    "ecart_tete": "👑 You lead <strong>{pseudo}</strong> by <strong>{n}</strong> points. Don't ease off.",
    "hf_titre": "Feats",
    "hf_premier_sang": "First blood", "hf_premier_sang_d": "First team to score in this arena",
    "hf_double": "Double", "hf_double_d": "Two families brought on the same day",
    "hf_triple": "Triple", "hf_triple_d": "Three families brought on the same day",
    "hf_regulier": "Steady", "hf_regulier_d": "Arrivals on three different days",
    "hf_sansfaute": "Flawless", "hf_sansfaute_d": "Three families brought, all settled in",
    "hf_leader": "In the lead", "hf_leader_d": "First place in the arena",
    "amene_d2": "This is <strong>exactly your family's link in {app}</strong> — the same one as in the app. Every family signing up with it counts in <strong>all your running arenas</strong>.",
    "r1": "Rookie", "r2": "Scout", "r3": "Ambassador", "r4": "Champion", "r5": "Legend"
  },
  nl: {
    "chargement": "De arena wordt geopend…",
    "config_t": "⚙️ Configuratie ontbreekt",
    "config_d": "Stel het Supabase-project in via <code>js/config.js</code>.",
    "titre": "🏆 De Uitdaging",
    "ouvrir_app": "FamiTeam openen",
    "sans_famille": "Dit account heeft nog geen familie. Maak ze aan in de app en kom dan terug.",
    "sans_lien": "Deze pagina opent enkel met een arenalink, of wanneer je aangemeld bent.",
    "introuvable_t": "🏆 Arena niet gevonden",
    "introuvable_d": "Deze code bestaat niet, of de arena werd verwijderd.",
    "introuvable_toast": "Arena niet gevonden.",
    "defie": "Je bent uitgedaagd",
    "ouverte_par": "Arena geopend door <strong>{hote}</strong>",
    "equipes": "team(s)",
    "jours": "dag(en) te gaan",
    "terminee": "Deze arena is afgelopen.",
    "regle": "De regel is simpel: <strong>wie {app} aan de meeste families laat ontdekken, wint.</strong> Een familie die blijft telt vier keer zwaarder dan een inschrijving zonder vervolg.",
    "relever": "⚔️ Ik neem de uitdaging aan",
    "relever_note": "Maak je familie aan op {app} (het is gratis) en open deze link opnieuw: dan sta je in de arena.",
    "confidentiel": "Besloten zone",
    "intro": "Een besloten arena, tussen bevriende families. Wie {app} aan de meeste families laat ontdekken, wint. Niets hiervan verschijnt in de app.",
    "mes_arenes": "Jouw arena's",
    "en_cours": "loopt", "close": "afgelopen",
    "rejoindre_t": "Een arena binnengaan",
    "code_ph": "Code van een vriend",
    "entrer": "De arena binnengaan",
    "creer_t": "Jouw arena maken",
    "nom_ph": "Naam van de arena (bv. De burenuitdaging)",
    "pseudo_ph": "De naam van je team",
    "d14": "14 dagen — sprint", "d30": "30 dagen — het klassieke seizoen", "d90": "90 dagen — de lange oorlog",
    "ouvrir_arene": "⚔️ De arena openen",
    "pseudo_note": "De teamnaam is wat op het klassement verschijnt. Nooit je familienaam, nooit de voornaam van een kind.",
    "manque_nom": "Geef je arena een naam.",
    "manque_pseudo": "Kies de naam van je team.",
    "choisis_pseudo": "Kies je teamnaam",
    "pseudo_ex": "Bv. De Aapjes",
    "entree_note": "Alleen deze naam verschijnt op het klassement van deze arena. Je kan op elk moment vertrekken: je teamnaam wordt dan gewist.",
    "retour": "← Terug",
    "arene_close": "Arena afgelopen",
    "classe": "{rang}<sup>e</sup> van {total}",
    "non_classe": "nog niet geklasseerd",
    "encore": "Nog <strong>{n}</strong> punten voor {emoji} {nom}.",
    "rang_max": "Hoogste rang bereikt. 🐉",
    "attente": "⏳ <strong>{n}</strong> punten in wacht: {f} familie(s) die je aanbracht hebben de app nog geen drie dagen geopend. Elk gaat van 25 naar 100 punten zodra ze de draad oppakken.",
    "podium": "Het podium",
    "amene_t": "Breng volk mee",
    "amene_d": "Elke familie die zich met jouw link inschrijft levert je <strong>25 punten</strong> op, en <strong>100</strong> zodra ze de app op drie verschillende dagen heeft geopend. Kies goed wie je uitnodigt: volume loont niet.",
    "lien_prep": "Je link wordt klaargemaakt…",
    "lien_ko": "Link momenteel niet beschikbaar.",
    "qr_ko": "QR-code niet beschikbaar voor deze link (te lang) — de link hierboven werkt gewoon.",
    "inviter_t": "Uitnodigen in de arena",
    "inviter_d": "Deze link brengt een vriend <strong>in deze arena</strong>.",
    "copier": "Kopiëren", "copie": "Link gekopieerd.", "copie_ko": "Geselecteerd: kopieer hem.",
    "code_arene": "Code van de arena:",
    "retour_arenes": "← Mijn arena's",
    "quitter": "Deze arena verlaten",
    "quitter_conf": "Je verlaat de arena en je teamnaam wordt gewist. Doorgaan?",
    "quitte": "Je hebt de arena verlaten.",
    "reste_jh": "nog {j}d {h}u", "urgence": "LAATSTE RECHTE LIJN",
    "ecart_devant": "🎯 <strong>{n}</strong> punten achter <strong>{pseudo}</strong>. Soms volstaat één blijvende familie.",
    "ecart_tete": "👑 Je leidt met <strong>{n}</strong> punten op <strong>{pseudo}</strong>. Niet lossen.",
    "hf_titre": "Wapenfeiten",
    "hf_premier_sang": "Eerste bloed", "hf_premier_sang_d": "Eerste team dat scoorde in deze arena",
    "hf_double": "Dubbelslag", "hf_double_d": "Twee families op dezelfde dag aangebracht",
    "hf_triple": "Drieklapper", "hf_triple_d": "Drie families op dezelfde dag aangebracht",
    "hf_regulier": "Constant", "hf_regulier_d": "Aankomsten op drie verschillende dagen",
    "hf_sansfaute": "Foutloos", "hf_sansfaute_d": "Drie families aangebracht, allemaal gebleven",
    "hf_leader": "Aan kop", "hf_leader_d": "Eerste plaats in de arena",
    "amene_d2": "Dit is <strong>precies de link van je familie in {app}</strong> — dezelfde als in de app. Elke familie die zich ermee inschrijft telt in <strong>al je lopende arena's</strong>.",
    "r1": "Rekruut", "r2": "Verkenner", "r3": "Ambassadeur", "r4": "Kampioen", "r5": "Legende"
  },
  de: {
    "chargement": "Die Arena wird geöffnet…",
    "config_t": "⚙️ Konfiguration fehlt",
    "config_d": "Trage das Supabase-Projekt in <code>js/config.js</code> ein.",
    "titre": "🏆 Die Herausforderung",
    "ouvrir_app": "FamiTeam öffnen",
    "sans_famille": "Dieses Konto hat noch keine Familie. Lege sie in der App an und komm dann zurück.",
    "sans_lien": "Diese Seite öffnet nur mit einem Arena-Link oder im angemeldeten Zustand.",
    "introuvable_t": "🏆 Arena nicht gefunden",
    "introuvable_d": "Diesen Code gibt es nicht, oder die Arena wurde gelöscht.",
    "introuvable_toast": "Arena nicht gefunden.",
    "defie": "Du wurdest herausgefordert",
    "ouverte_par": "Arena eröffnet von <strong>{hote}</strong>",
    "equipes": "Team(s)",
    "jours": "Tag(e) übrig",
    "terminee": "Diese Arena ist beendet.",
    "regle": "Die Regel ist einfach: <strong>wer {app} den meisten Familien zeigt, gewinnt.</strong> Eine Familie, die bleibt, zählt viermal mehr als eine Anmeldung ohne Fortsetzung.",
    "relever": "⚔️ Ich nehme die Herausforderung an",
    "relever_note": "Lege deine Familie auf {app} an (kostenlos) und öffne diesen Link erneut: dann bist du in der Arena.",
    "confidentiel": "Vertraulicher Bereich",
    "intro": "Eine private Arena unter befreundeten Familien. Wer {app} den meisten Familien zeigt, gewinnt. Nichts davon erscheint in der App.",
    "mes_arenes": "Deine Arenen",
    "en_cours": "läuft", "close": "beendet",
    "rejoindre_t": "Einer Arena beitreten",
    "code_ph": "Code von einem Freund",
    "entrer": "Die Arena betreten",
    "creer_t": "Deine Arena erstellen",
    "nom_ph": "Name der Arena (z. B. Die Nachbarschafts-Challenge)",
    "pseudo_ph": "Der Name deines Teams",
    "d14": "14 Tage — Sprint", "d30": "30 Tage — die klassische Saison", "d90": "90 Tage — der lange Krieg",
    "ouvrir_arene": "⚔️ Die Arena eröffnen",
    "pseudo_note": "Der Teamname ist das, was in der Rangliste erscheint. Niemals dein Familienname, niemals der Vorname eines Kindes.",
    "manque_nom": "Gib deiner Arena einen Namen.",
    "manque_pseudo": "Wähle den Namen deines Teams.",
    "choisis_pseudo": "Wähle deinen Teamnamen",
    "pseudo_ex": "z. B. Die Äffchen",
    "entree_note": "Nur dieser Name erscheint in der Rangliste dieser Arena. Du kannst jederzeit gehen: dein Teamname wird dann gelöscht.",
    "retour": "← Zurück",
    "arene_close": "Arena beendet",
    "classe": "{rang}. von {total}",
    "non_classe": "noch nicht platziert",
    "encore": "Noch <strong>{n}</strong> Punkte für {emoji} {nom}.",
    "rang_max": "Höchster Rang erreicht. 🐉",
    "attente": "⏳ <strong>{n}</strong> Punkte ausstehend: {f} Familie(n), die du gebracht hast, haben die App noch nicht an drei Tagen geöffnet. Jede steigt von 25 auf 100 Punkte, sobald sie dranbleibt.",
    "podium": "Das Podium",
    "amene_t": "Bring Leute mit",
    "amene_d": "Jede Familie, die sich mit deinem Link anmeldet, bringt dir <strong>25 Punkte</strong>, und <strong>100</strong>, sobald sie die App an drei verschiedenen Tagen geöffnet hat. Wähle gut aus: Menge zahlt sich nicht aus.",
    "lien_prep": "Dein Link wird vorbereitet…",
    "lien_ko": "Link momentan nicht verfügbar.",
    "qr_ko": "QR-Code für diesen Link nicht verfügbar (zu lang) — der Link oben funktioniert normal.",
    "inviter_t": "In die Arena einladen",
    "inviter_d": "Dieser Link bringt einen Freund <strong>in diese Arena</strong>.",
    "copier": "Kopieren", "copie": "Link kopiert.", "copie_ko": "Markiert: kopiere ihn.",
    "code_arene": "Code der Arena:",
    "retour_arenes": "← Meine Arenen",
    "quitter": "Diese Arena verlassen",
    "quitter_conf": "Du verlässt die Arena und dein Teamname wird gelöscht. Fortfahren?",
    "quitte": "Du hast die Arena verlassen.",
    "reste_jh": "noch {j} T {h} Std", "urgence": "ZIELGERADE",
    "ecart_devant": "🎯 <strong>{n}</strong> Punkte hinter <strong>{pseudo}</strong>. Manchmal genügt eine Familie, die bleibt.",
    "ecart_tete": "👑 Du führst mit <strong>{n}</strong> Punkten vor <strong>{pseudo}</strong>. Nicht nachlassen.",
    "hf_titre": "Glanzstücke",
    "hf_premier_sang": "Erstes Blut", "hf_premier_sang_d": "Erstes Team, das in dieser Arena punktete",
    "hf_double": "Doppelschlag", "hf_double_d": "Zwei Familien am selben Tag gebracht",
    "hf_triple": "Dreierpack", "hf_triple_d": "Drei Familien am selben Tag gebracht",
    "hf_regulier": "Beständig", "hf_regulier_d": "Ankünfte an drei verschiedenen Tagen",
    "hf_sansfaute": "Fehlerfrei", "hf_sansfaute_d": "Drei Familien gebracht, alle geblieben",
    "hf_leader": "In Führung", "hf_leader_d": "Erster Platz der Arena",
    "amene_d2": "Das ist <strong>genau der Link deiner Familie in {app}</strong> — derselbe wie in der App. Jede Familie, die sich damit anmeldet, zählt in <strong>allen deinen laufenden Arenen</strong>.",
    "r1": "Rekrut", "r2": "Späher", "r3": "Botschafter", "r4": "Champion", "r5": "Legende"
  }
};

const APP_NOM = "FamiTeam";
let langue = "fr";
/* Renforts de gamification : rangs hauts, objectif collectif, série,
 * retour de visite et hauts faits supplémentaires. */
Object.assign(DEFI_I18N.fr, {
  "r6": "Volcan",
  "r7": "Légende",
  "rang_gagne": "Nouveau rang : {nom} !",
  "dv_points": "⬆️ <strong>+{n}</strong> points depuis ta dernière visite",
  "dv_monte": "🚀 Tu es passé·e de la <strong>{n}ᵉ</strong> à la <strong>{m}ᵉ</strong> place",
  "dv_descend": "⚠️ Tu es passé·e de la <strong>{n}ᵉ</strong> à la <strong>{m}ᵉ</strong> place",
  "dv_arrivees": "🆕 <strong>{n}</strong> équipe(s) sont entrées dans l'arène",
  "dv_rien": "Rien n'a bougé depuis ta dernière visite. Une famille suffirait à changer ça.",
  "ecart_action": "→ {n} famille(s) installée(s) et tu passes devant.",
  "serie_on": "🔥 Série en cours : <strong>{n}</strong> jour(s)",
  "serie_off": "Aucune série en cours — une prise aujourd'hui la relance.",
  "derniere_journee": "⏰ DERNIÈRE JOURNÉE · {h} h",
  "col_titre": "🌍 L'objectif de l'arène",
  "col_note": "Celui-là, personne ne l'atteint seul : toutes les familles installées comptent, quelle que soit l'équipe.",
  "col_aucun": "Rien encore",
  "col_encore": "Encore <strong>{n}</strong> famille(s) et l'arène atteint {emoji} <strong>{nom}</strong>.",
  "col_max": "L'arène a tout atteint. Chapeau. 🏆",
  "pa1": "L'îlot",
  "pa2": "Le bosquet",
  "pa3": "La forêt",
  "pa4": "L'archipel",
  "pa5": "Le monde",
  "hf_marathon": "Marathon",
  "hf_marathon_d": "Cinq jours de chasse différents",
  "hf_serie": "Enchaînement",
  "hf_serie_d": "Deux jours d'affilée au moins",
  "hf_podium": "Podium",
  "hf_podium_d": "Dans les trois premières équipes",
  "hf_dominant": "Léviathan",
  "hf_dominant_d": "La moitié des points de l'arène"
});
Object.assign(DEFI_I18N.en, {
  "r6": "Volcano",
  "r7": "Legend",
  "rang_gagne": "New rank: {nom}!",
  "dv_points": "⬆️ <strong>+{n}</strong> points since your last visit",
  "dv_monte": "🚀 You moved from <strong>{n}th</strong> to <strong>{m}th</strong>",
  "dv_descend": "⚠️ You dropped from <strong>{n}th</strong> to <strong>{m}th</strong>",
  "dv_arrivees": "🆕 <strong>{n}</strong> team(s) entered the arena",
  "dv_rien": "Nothing has moved since your last visit. One family would change that.",
  "ecart_action": "→ {n} settled family/families and you're ahead.",
  "serie_on": "🔥 Current streak: <strong>{n}</strong> day(s)",
  "serie_off": "No streak running — one catch today restarts it.",
  "derniere_journee": "⏰ FINAL DAY · {h} h",
  "col_titre": "🌍 The arena's goal",
  "col_note": "Nobody reaches this one alone: every settled family counts, whichever team brought it.",
  "col_aucun": "Nothing yet",
  "col_encore": "<strong>{n}</strong> more family/families and the arena reaches {emoji} <strong>{nom}</strong>.",
  "col_max": "The arena reached everything. Hats off. 🏆",
  "pa1": "The islet",
  "pa2": "The grove",
  "pa3": "The forest",
  "pa4": "The archipelago",
  "pa5": "The world",
  "hf_marathon": "Marathon",
  "hf_marathon_d": "Five different hunting days",
  "hf_serie": "Chain",
  "hf_serie_d": "At least two days in a row",
  "hf_podium": "Podium",
  "hf_podium_d": "Among the top three teams",
  "hf_dominant": "Leviathan",
  "hf_dominant_d": "Half of the arena's points"
});
Object.assign(DEFI_I18N.nl, {
  "r6": "Vulkaan",
  "r7": "Legende",
  "rang_gagne": "Nieuwe rang: {nom}!",
  "dv_points": "⬆️ <strong>+{n}</strong> punten sinds je vorige bezoek",
  "dv_monte": "🚀 Je ging van de <strong>{n}e</strong> naar de <strong>{m}e</strong> plaats",
  "dv_descend": "⚠️ Je zakte van de <strong>{n}e</strong> naar de <strong>{m}e</strong> plaats",
  "dv_arrivees": "🆕 <strong>{n}</strong> team(s) zijn de arena binnengekomen",
  "dv_rien": "Er is niets veranderd sinds je vorige bezoek. Eén gezin zou dat veranderen.",
  "ecart_action": "→ {n} blijvend(e) gezin(nen) en je gaat eroverheen.",
  "serie_on": "🔥 Reeks bezig: <strong>{n}</strong> dag(en)",
  "serie_off": "Geen reeks bezig — één vangst vandaag start ze opnieuw.",
  "derniere_journee": "⏰ LAATSTE DAG · {h} u",
  "col_titre": "🌍 Het doel van de arena",
  "col_note": "Dit haalt niemand alleen: elk blijvend gezin telt, van welk team ook.",
  "col_aucun": "Nog niets",
  "col_encore": "Nog <strong>{n}</strong> gezin(nen) en de arena bereikt {emoji} <strong>{nom}</strong>.",
  "col_max": "De arena heeft alles bereikt. Petje af. 🏆",
  "pa1": "Het eilandje",
  "pa2": "Het bosje",
  "pa3": "Het woud",
  "pa4": "De archipel",
  "pa5": "De wereld",
  "hf_marathon": "Marathon",
  "hf_marathon_d": "Vijf verschillende jachtdagen",
  "hf_serie": "Aaneenschakeling",
  "hf_serie_d": "Minstens twee dagen op rij",
  "hf_podium": "Podium",
  "hf_podium_d": "Bij de drie beste teams",
  "hf_dominant": "Leviathan",
  "hf_dominant_d": "De helft van de punten van de arena"
});
Object.assign(DEFI_I18N.de, {
  "r6": "Vulkan",
  "r7": "Legende",
  "rang_gagne": "Neuer Rang: {nom}!",
  "dv_points": "⬆️ <strong>+{n}</strong> Punkte seit deinem letzten Besuch",
  "dv_monte": "🚀 Du bist vom <strong>{n}.</strong> auf den <strong>{m}.</strong> Platz gestiegen",
  "dv_descend": "⚠️ Du bist vom <strong>{n}.</strong> auf den <strong>{m}.</strong> Platz gefallen",
  "dv_arrivees": "🆕 <strong>{n}</strong> Team(s) sind in die Arena gekommen",
  "dv_rien": "Seit deinem letzten Besuch hat sich nichts bewegt. Eine Familie würde das ändern.",
  "ecart_action": "→ {n} bleibende Familie(n) und du ziehst vorbei.",
  "serie_on": "🔥 Laufende Serie: <strong>{n}</strong> Tag(e)",
  "serie_off": "Keine Serie am Laufen — ein Fang heute startet sie neu.",
  "derniere_journee": "⏰ LETZTER TAG · {h} Std.",
  "col_titre": "🌍 Das Ziel der Arena",
  "col_note": "Das schafft niemand allein: jede bleibende Familie zählt, egal von welchem Team.",
  "col_aucun": "Noch nichts",
  "col_encore": "Noch <strong>{n}</strong> Familie(n) und die Arena erreicht {emoji} <strong>{nom}</strong>.",
  "col_max": "Die Arena hat alles erreicht. Hut ab. 🏆",
  "pa1": "Das Eiland",
  "pa2": "Das Wäldchen",
  "pa3": "Der Wald",
  "pa4": "Der Archipel",
  "pa5": "Die Welt",
  "hf_marathon": "Marathon",
  "hf_marathon_d": "Fünf verschiedene Jagdtage",
  "hf_serie": "Kette",
  "hf_serie_d": "Mindestens zwei Tage hintereinander",
  "hf_podium": "Podium",
  "hf_podium_d": "Unter den ersten drei Teams",
  "hf_dominant": "Leviathan",
  "hf_dominant_d": "Die Hälfte der Punkte der Arena"
});

/* À qui s'adresse le Défi, et le merci qui va avec. */
Object.assign(DEFI_I18N.fr, {
  "contrib_t": "🤝 Cette page est pour vous",
  "contrib_d": "Le Défi n'est pas ouvert à tout le monde : il s'adresse aux <strong>contributeurs</strong> de {app} — celles et ceux qui le font connaître autour d'eux, et celles et ceux qui le soutiennent. C'est pour cela que le lien se transmet de la main à la main.",
  "contrib_merci": "{app} n'a ni budget, ni publicité, ni équipe. Il n'existe que parce que des parents en parlent à d'autres parents. Alors, simplement : <strong>merci</strong>. 💛",
  "top_merci": "Merci à chaque famille de ce tableau — et à toutes celles qui n'y figurent pas et font pourtant le même travail. 💛"
});
Object.assign(DEFI_I18N.en, {
  "contrib_t": "🤝 This page is for you",
  "contrib_d": "The Challenge isn't open to everyone: it's for {app}'s <strong>contributors</strong> — those who spread the word around them, and those who support it. That's why the link is passed hand to hand.",
  "contrib_merci": "{app} has no budget, no advertising, no team. It exists only because parents tell other parents about it. So, simply: <strong>thank you</strong>. 💛",
  "top_merci": "Thank you to every family on this board — and to all those who aren't on it and do the same work anyway. 💛"
});
Object.assign(DEFI_I18N.nl, {
  "contrib_t": "🤝 Deze pagina is voor jou",
  "contrib_d": "De Uitdaging staat niet voor iedereen open: ze is bedoeld voor de <strong>bijdragers</strong> van {app} — wie het in zijn omgeving bekendmaakt, en wie het steunt. Daarom wordt de link van hand tot hand doorgegeven.",
  "contrib_merci": "{app} heeft geen budget, geen reclame, geen team. Het bestaat alleen omdat ouders er met andere ouders over praten. Dus, eenvoudigweg: <strong>dank je</strong>. 💛",
  "top_merci": "Dank aan elk gezin op dit bord — en aan alle gezinnen die er niet op staan en toch hetzelfde werk doen. 💛"
});
Object.assign(DEFI_I18N.de, {
  "contrib_t": "🤝 Diese Seite ist für dich",
  "contrib_d": "Die Herausforderung steht nicht allen offen: sie richtet sich an die <strong>Mitwirkenden</strong> von {app} — an alle, die es in ihrem Umfeld bekannt machen, und an alle, die es unterstützen. Deshalb wird der Link von Hand zu Hand weitergegeben.",
  "contrib_merci": "{app} hat kein Budget, keine Werbung, kein Team. Es existiert nur, weil Eltern anderen Eltern davon erzählen. Also, ganz einfach: <strong>danke</strong>. 💛",
  "top_merci": "Danke an jede Familie auf dieser Tafel — und an alle, die nicht darauf stehen und dieselbe Arbeit leisten. 💛"
});

/* La porte d'entrée et le tableau mondial. */
Object.assign(DEFI_I18N.fr, {
  "porte_kicker": "Tu as trouvé une porte",
  "porte_titre": "Le Défi",
  "porte_intro": "Cette page n'est indiquée nulle part. Elle ne se trouve pas, elle se transmet — entre parents qui se connaissent. Ce qui s'y passe est un jeu d'adultes : faire découvrir {app} à d'autres familles, et compter les points.",
  "porte_r1": "Tu ouvres une arène, ou tu rejoins celle d'un ami avec son code.",
  "porte_r2": "Chaque famille que tu amènes rapporte des points. Une famille qui reste en vaut quatre fois plus.",
  "porte_r3": "À la fin de la saison, un seul nom est en haut du tableau.",
  "cloison_t": "🧱 Ce mur ne bouge pas",
  "cloison_1": "Rien de tout ceci n'apparaît dans {app} : ni classement, ni points, ni rivalité.",
  "cloison_2": "Tes enfants ne verront jamais cette page, ni son existence.",
  "cloison_3": "Aucun nom de famille, aucun prénom d'enfant n'y figure — seulement le nom de code que tu choisis maintenant.",
  "porte_pseudo_t": "Ton nom de code",
  "porte_pseudo_d": "C'est lui qui s'affichera dans les arènes et au tableau. Choisis-le drôle plutôt que vrai.",
  "porte_pseudo_ph": "ex. Les Loups du 3ᵉ",
  "porte_entrer": "🚪 Entrer",
  "porte_manque": "Il faut un nom de code pour entrer.",
  "porte_bienvenue": "Bienvenue, {pseudo}.",
  "changer_pseudo": "Nom de code : {pseudo} — le changer",
  "top_bouton": "🏆 Voir le tableau",
  "top_accroche": "Toutes les familles du monde qui ont choisi d'y figurer, ce mois-ci.",
  "top_titre": "🏆 Le Top 10 mondial",
  "top_sous": "Les dix familles qui ont fait découvrir l'app au plus grand nombre cette saison. Seules celles qui l'ont demandé y apparaissent.",
  "top_saison": "Saison {s}",
  "top_h": "Le tableau",
  "top_regle": "Une famille compte quand elle a ouvert l'app trois jours différents. Les inscriptions sans lendemain ne comptent pas.",
  "top_chargement": "Ouverture du tableau…",
  "top_indispo": "Tableau indisponible pour le moment.",
  "top_mon_rang": "{n}ᵉ mondiale",
  "top_sans_rang": "Hors tableau",
  "top_mes_familles": "{n} famille(s) installée(s) cette saison",
  "top_inscrit_note": "Tu figures au tableau sous le nom <strong>{pseudo}</strong>.",
  "top_hors_note": "Tu n'y figures pas. Tant que tu n'y es pas, aucun rang ne t'est attribué — ni bon, ni mauvais.",
  "top_inscrit": "Te voilà au tableau 🏆",
  "top_sortir": "Me retirer du tableau",
  "top_sortir_conf": "Tu n'apparaîtras plus au tableau et ton nom de code y sera effacé. Continuer ?",
  "top_sorti": "Tu n'es plus au tableau."
});
Object.assign(DEFI_I18N.en, {
  "porte_kicker": "You found a door",
  "porte_titre": "The Challenge",
  "porte_intro": "This page is linked from nowhere. It isn't found, it's passed on — between parents who know each other. What happens here is a grown-ups' game: getting other families to discover {app}, and keeping score.",
  "porte_r1": "You open an arena, or join a friend's with their code.",
  "porte_r2": "Every family you bring scores points. A family that stays is worth four times more.",
  "porte_r3": "At the end of the season, one name sits at the top.",
  "cloison_t": "🧱 This wall does not move",
  "cloison_1": "None of this appears in {app}: no ranking, no points, no rivalry.",
  "cloison_2": "Your children will never see this page, nor know it exists.",
  "cloison_3": "No family name, no child's first name appears here — only the code name you pick now.",
  "porte_pseudo_t": "Your code name",
  "porte_pseudo_d": "It's what shows in arenas and on the board. Pick funny over true.",
  "porte_pseudo_ph": "e.g. The Wolves of no. 3",
  "porte_entrer": "🚪 Enter",
  "porte_manque": "A code name is needed to enter.",
  "porte_bienvenue": "Welcome, {pseudo}.",
  "changer_pseudo": "Code name: {pseudo} — change it",
  "top_bouton": "🏆 See the board",
  "top_accroche": "Every family in the world who chose to appear, this month.",
  "top_titre": "🏆 The world Top 10",
  "top_sous": "The ten families who introduced the app to the most others this season. Only those who asked to appear are listed.",
  "top_saison": "Season {s}",
  "top_h": "The board",
  "top_regle": "A family counts once it has opened the app on three different days. Sign-ups with no follow-through don't count.",
  "top_chargement": "Opening the board…",
  "top_indispo": "Board unavailable right now.",
  "top_mon_rang": "{n}th worldwide",
  "top_sans_rang": "Not on the board",
  "top_mes_familles": "{n} settled family/families this season",
  "top_inscrit_note": "You appear on the board as <strong>{pseudo}</strong>.",
  "top_hors_note": "You're not on it. While you're not, no rank is assigned to you — good or bad.",
  "top_inscrit": "You're on the board 🏆",
  "top_sortir": "Remove me from the board",
  "top_sortir_conf": "You will no longer appear on the board and your code name will be erased from it. Continue?",
  "top_sorti": "You're off the board."
});
Object.assign(DEFI_I18N.nl, {
  "porte_kicker": "Je hebt een deur gevonden",
  "porte_titre": "De Uitdaging",
  "porte_intro": "Naar deze pagina verwijst niets. Ze wordt niet gevonden, ze wordt doorgegeven — tussen ouders die elkaar kennen. Wat hier gebeurt is een spel voor volwassenen: andere gezinnen {app} laten ontdekken, en de punten tellen.",
  "porte_r1": "Je opent een arena, of sluit je aan bij die van een vriend met zijn code.",
  "porte_r2": "Elk gezin dat je meebrengt levert punten op. Een gezin dat blijft telt vier keer zo zwaar.",
  "porte_r3": "Aan het einde van het seizoen staat er één naam bovenaan.",
  "cloison_t": "🧱 Deze muur beweegt niet",
  "cloison_1": "Niets hiervan verschijnt in {app}: geen klassement, geen punten, geen rivaliteit.",
  "cloison_2": "Je kinderen zullen deze pagina nooit zien, en niet weten dat ze bestaat.",
  "cloison_3": "Geen familienaam, geen voornaam van een kind komt hier voor — alleen de codenaam die je nu kiest.",
  "porte_pseudo_t": "Je codenaam",
  "porte_pseudo_d": "Die verschijnt in de arena's en op het bord. Kies liever grappig dan echt.",
  "porte_pseudo_ph": "bv. De Wolven van nr. 3",
  "porte_entrer": "🚪 Binnenkomen",
  "porte_manque": "Er is een codenaam nodig om binnen te komen.",
  "porte_bienvenue": "Welkom, {pseudo}.",
  "changer_pseudo": "Codenaam: {pseudo} — wijzigen",
  "top_bouton": "🏆 Bekijk het bord",
  "top_accroche": "Alle gezinnen ter wereld die ervoor kozen te verschijnen, deze maand.",
  "top_titre": "🏆 De wereld-top 10",
  "top_sous": "De tien gezinnen die de app dit seizoen aan de meeste anderen lieten ontdekken. Alleen wie erom vroeg staat er.",
  "top_saison": "Seizoen {s}",
  "top_h": "Het bord",
  "top_regle": "Een gezin telt zodra het de app op drie verschillende dagen heeft geopend. Inschrijvingen zonder vervolg tellen niet.",
  "top_chargement": "Het bord wordt geopend…",
  "top_indispo": "Bord momenteel niet beschikbaar.",
  "top_mon_rang": "{n}e wereldwijd",
  "top_sans_rang": "Niet op het bord",
  "top_mes_familles": "{n} blijvend(e) gezin(nen) dit seizoen",
  "top_inscrit_note": "Je staat op het bord als <strong>{pseudo}</strong>.",
  "top_hors_note": "Je staat er niet op. Zolang dat zo is, krijg je geen enkele rang — goed noch slecht.",
  "top_inscrit": "Je staat op het bord 🏆",
  "top_sortir": "Haal me van het bord",
  "top_sortir_conf": "Je verschijnt niet meer op het bord en je codenaam wordt er gewist. Doorgaan?",
  "top_sorti": "Je staat niet meer op het bord."
});
Object.assign(DEFI_I18N.de, {
  "porte_kicker": "Du hast eine Tür gefunden",
  "porte_titre": "Die Herausforderung",
  "porte_intro": "Auf diese Seite verweist nichts. Man findet sie nicht, man gibt sie weiter — unter Eltern, die sich kennen. Was hier geschieht, ist ein Spiel für Erwachsene: anderen Familien {app} zeigen und die Punkte zählen.",
  "porte_r1": "Du eröffnest eine Arena oder trittst der eines Freundes mit seinem Code bei.",
  "porte_r2": "Jede Familie, die du bringst, zählt Punkte. Eine Familie, die bleibt, zählt viermal mehr.",
  "porte_r3": "Am Ende der Saison steht ein einziger Name ganz oben.",
  "cloison_t": "🧱 Diese Mauer bewegt sich nicht",
  "cloison_1": "Nichts davon erscheint in {app}: kein Ranking, keine Punkte, keine Rivalität.",
  "cloison_2": "Deine Kinder werden diese Seite nie sehen und nichts von ihr wissen.",
  "cloison_3": "Kein Familienname, kein Vorname eines Kindes steht hier — nur der Deckname, den du jetzt wählst.",
  "porte_pseudo_t": "Dein Deckname",
  "porte_pseudo_d": "Er erscheint in den Arenen und auf der Tafel. Wähle lieber witzig als echt.",
  "porte_pseudo_ph": "z. B. Die Wölfe aus Nr. 3",
  "porte_entrer": "🚪 Eintreten",
  "porte_manque": "Zum Eintreten braucht es einen Decknamen.",
  "porte_bienvenue": "Willkommen, {pseudo}.",
  "changer_pseudo": "Deckname: {pseudo} — ändern",
  "top_bouton": "🏆 Tafel ansehen",
  "top_accroche": "Alle Familien weltweit, die sich diesen Monat dafür entschieden haben.",
  "top_titre": "🏆 Die Welt-Top-10",
  "top_sous": "Die zehn Familien, die die App diese Saison den meisten anderen gezeigt haben. Nur wer darum gebeten hat, steht darauf.",
  "top_saison": "Saison {s}",
  "top_h": "Die Tafel",
  "top_regle": "Eine Familie zählt, sobald sie die App an drei verschiedenen Tagen geöffnet hat. Anmeldungen ohne Fortsetzung zählen nicht.",
  "top_chargement": "Tafel wird geöffnet…",
  "top_indispo": "Tafel derzeit nicht verfügbar.",
  "top_mon_rang": "{n}. weltweit",
  "top_sans_rang": "Nicht auf der Tafel",
  "top_mes_familles": "{n} bleibende Familie(n) diese Saison",
  "top_inscrit_note": "Du stehst als <strong>{pseudo}</strong> auf der Tafel.",
  "top_hors_note": "Du stehst nicht darauf. Solange das so ist, wird dir kein Rang zugewiesen — weder gut noch schlecht.",
  "top_inscrit": "Du stehst auf der Tafel 🏆",
  "top_sortir": "Mich von der Tafel nehmen",
  "top_sortir_conf": "Du erscheinst nicht mehr auf der Tafel und dein Deckname wird dort gelöscht. Fortfahren?",
  "top_sorti": "Du bist nicht mehr auf der Tafel."
});

/* Le nom de code vaut inscription : plus de case a cocher separee. */
Object.assign(DEFI_I18N.fr, {
  "porte_pseudo_d": "C'est lui qui s'affichera dans les arènes et au tableau mondial : en le choisissant, tu y entres. Choisis-le drôle plutôt que vrai — jamais ton nom de famille, jamais le prénom d'un enfant.",
  "top_sous": "Les dix familles qui ont fait découvrir l'app au plus grand nombre cette saison, sous le nom de code qu'elles se sont donné.",
  "top_hors_note": "Tu n'y figures pas pour l'instant.",
  "top_retire_note": "Tu t'es retiré·e du tableau. Ton nom de code n'y apparaît plus, et aucun rang ne t'est attribué.",
  "top_revenir": "Réapparaître au tableau"
});
Object.assign(DEFI_I18N.en, {
  "porte_pseudo_d": "It's what shows in arenas and on the world board: by choosing it, you enter. Pick funny over true — never your family name, never a child's first name.",
  "top_sous": "The ten families who introduced the app to the most others this season, under the code name they gave themselves.",
  "top_hors_note": "You're not on it at the moment.",
  "top_retire_note": "You withdrew from the board. Your code name no longer appears there, and no rank is assigned to you.",
  "top_revenir": "Appear again on the board"
});
Object.assign(DEFI_I18N.nl, {
  "porte_pseudo_d": "Die verschijnt in de arena's en op het wereldbord: door hem te kiezen, doe je mee. Kies liever grappig dan echt — nooit je familienaam, nooit de voornaam van een kind.",
  "top_sous": "De tien gezinnen die de app dit seizoen aan de meeste anderen lieten ontdekken, onder de codenaam die ze zichzelf gaven.",
  "top_hors_note": "Je staat er momenteel niet op.",
  "top_retire_note": "Je hebt je van het bord teruggetrokken. Je codenaam staat er niet meer op en je krijgt geen enkele rang.",
  "top_revenir": "Weer op het bord verschijnen"
});
Object.assign(DEFI_I18N.de, {
  "porte_pseudo_d": "Er erscheint in den Arenen und auf der Welttafel: mit der Wahl trittst du ein. Wähle lieber witzig als echt — nie deinen Familiennamen, nie den Vornamen eines Kindes.",
  "top_sous": "Die zehn Familien, die die App diese Saison den meisten anderen gezeigt haben, unter dem Decknamen, den sie sich gegeben haben.",
  "top_hors_note": "Du stehst derzeit nicht darauf.",
  "top_retire_note": "Du hast dich von der Tafel zurückgezogen. Dein Deckname erscheint dort nicht mehr, und dir wird kein Rang zugewiesen.",
  "top_revenir": "Wieder auf der Tafel erscheinen"
});


/* Le tableau porte le nombre de familles qu'il contient : Top 2, 3, … 10. */
Object.assign(DEFI_I18N.fr, { "top_sous": "Les familles qui ont fait découvrir l'app au plus grand nombre cette saison, sous le nom de code qu'elles se sont donné." });
Object.assign(DEFI_I18N.en, { "top_sous": "The families who introduced the app to the most others this season, under the code name they gave themselves." });
Object.assign(DEFI_I18N.nl, { "top_sous": "De gezinnen die de app dit seizoen aan de meeste anderen lieten ontdekken, onder de codenaam die ze zichzelf gaven." });
Object.assign(DEFI_I18N.de, { "top_sous": "Die Familien, die die App diese Saison den meisten anderen gezeigt haben, unter dem Decknamen, den sie sich gegeben haben." });
Object.assign(DEFI_I18N.fr, {
  "top_titre_n": "🏆 Le Top {n} mondial",
  "top_grandit": "Ce tableau grandit avec vous : encore <strong>{reste}</strong> famille(s) inscrite(s) et il passera au <strong>Top 10</strong>.",
  "top_premiere_t": "La première place est vide",
  "top_premiere_d": "Personne n'a encore marqué cette saison. La toute première famille que vous amenez vous met en tête du tableau."
});
Object.assign(DEFI_I18N.en, {
  "top_titre_n": "🏆 The world Top {n}",
  "top_grandit": "This board grows with you: <strong>{reste}</strong> more registered family/families and it becomes a <strong>Top 10</strong>.",
  "top_premiere_t": "First place is empty",
  "top_premiere_d": "Nobody has scored yet this season. The very first family you bring puts you at the top of the board."
});
Object.assign(DEFI_I18N.nl, {
  "top_titre_n": "🏆 De wereld-top {n}",
  "top_grandit": "Dit bord groeit met jullie mee: nog <strong>{reste}</strong> ingeschreven gezin(nen) en het wordt een <strong>top 10</strong>.",
  "top_premiere_t": "De eerste plaats is leeg",
  "top_premiere_d": "Niemand heeft dit seizoen al gescoord. Het allereerste gezin dat je meebrengt zet je bovenaan het bord."
});
Object.assign(DEFI_I18N.de, {
  "top_titre_n": "🏆 Die Welt-Top-{n}",
  "top_grandit": "Diese Tafel wächst mit euch: noch <strong>{reste}</strong> eingetragene Familie(n) und sie wird zur <strong>Top-10</strong>.",
  "top_premiere_t": "Der erste Platz ist frei",
  "top_premiere_d": "Diese Saison hat noch niemand gepunktet. Die allererste Familie, die du bringst, setzt dich an die Spitze der Tafel."
});

function langueInitiale() {
  try {
    const stocke = localStorage.getItem(CLE_LANGUE);
    if (stocke && DEFI_I18N[stocke]) return stocke;
  } catch (e) { /* stockage indisponible */ }
  const nav = ((typeof navigator !== "undefined" && navigator.language) || "fr").slice(0, 2).toLowerCase();
  return DEFI_I18N[nav] ? nav : "fr";
}
function definirLangueDefi(l) {
  if (!DEFI_I18N[l]) return;
  langue = l;
  try { localStorage.setItem(CLE_LANGUE, l); } catch (e) { /* stockage indisponible */ }
  if (document.documentElement) document.documentElement.lang = l;
}
// `app` est toujours disponible : c'est le nom du produit, présent dans presque
// toutes les phrases d'accroche.
function tD(cle, vars) {
  const table = DEFI_I18N[langue] || DEFI_I18N.fr;
  let s = (table[cle] !== undefined) ? table[cle] : (DEFI_I18N.fr[cle] || cle);
  const v = Object.assign({ app: APP_NOM }, vars || {});
  Object.keys(v).forEach(k => { s = s.split("{" + k + "}").join(v[k]); });
  return s;
}

/* Paliers de l'arène : ils ne servent qu'à donner du relief au score, et
 * n'ouvrent aucun droit. Le dernier est volontairement hors d'atteinte
 * ordinaire — c'est le sel de la chose. */
/* Sept rangs plutôt que cinq : une échelle qui se termine trop tôt cesse de
 * tirer. Les deux derniers sont hors de portée d'une seule saison — c'est
 * voulu, ils donnent un horizon. */
const DEFI_RANGS = [
  { seuil: 0,    cle: "r1", emoji: "🥚" },
  { seuil: 100,  cle: "r2", emoji: "🔥" },
  { seuil: 250,  cle: "r3", emoji: "⚡" },
  { seuil: 500,  cle: "r4", emoji: "👑" },
  { seuil: 1000, cle: "r5", emoji: "🐉" },
  { seuil: 2000, cle: "r6", emoji: "🌋" },
  { seuil: 4000, cle: "r7", emoji: "🏆" }
];

/* Palier collectif de l'arène : au-dessus de la rivalité, un objectif que
 * personne n'atteint seul. Sans lui, les dernières équipes n'ont plus rien à
 * jouer dès que l'écart se creuse — et ce sont elles qui décrochent. */
const DEFI_PALIERS_ARENE = [
  { seuil: 5,   cle: "pa1", emoji: "🌱" },
  { seuil: 15,  cle: "pa2", emoji: "🌿" },
  { seuil: 30,  cle: "pa3", emoji: "🌳" },
  { seuil: 60,  cle: "pa4", emoji: "🏝️" },
  { seuil: 120, cle: "pa5", emoji: "🌍" }
];
function palierArene(n) {
  let p = null;
  DEFI_PALIERS_ARENE.forEach(x => { if ((n || 0) >= x.seuil) p = x; });
  return p;
}
function palierAreneSuivant(n) {
  return DEFI_PALIERS_ARENE.find(x => (n || 0) < x.seuil) || null;
}

/* Série en cours : nombre de jours consécutifs, en remontant depuis aujourd'hui
 * ou hier, où l'équipe a amené au moins une famille. On tolère la veille pour
 * ne pas casser une série à cause de l'heure qu'il est. */
function jourCle(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function serieEnCours(joursListe, aujourdhui) {
  const jours = new Set(Array.isArray(joursListe) ? joursListe : []);
  if (!jours.size) return 0;
  const base = aujourdhui ? new Date(aujourdhui + "T00:00:00") : new Date();
  const cle0 = jourCle(base);
  const veille = new Date(base); veille.setDate(veille.getDate() - 1);
  // Point de départ : aujourd'hui si marqué, sinon hier. Au-delà, la série est rompue.
  let curseur;
  if (jours.has(cle0)) curseur = new Date(base);
  else if (jours.has(jourCle(veille))) curseur = veille;
  else return 0;
  let n = 0;
  while (jours.has(jourCle(curseur))) { n++; curseur.setDate(curseur.getDate() - 1); }
  return n;
}

/* Grille des N derniers jours : une case par jour, pleine si l'équipe a marqué.
 * C'est le même ressort qu'un calendrier d'habitude — on ne veut pas de trou. */
function grilleJours(joursListe, n, aujourdhui) {
  const jours = new Set(Array.isArray(joursListe) ? joursListe : []);
  const base = aujourdhui ? new Date(aujourdhui + "T00:00:00") : new Date();
  const cases = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base); d.setDate(d.getDate() - i);
    const cle = jourCle(d);
    cases.push({ cle, marque: jours.has(cle), aujourdhui: i === 0 });
  }
  return cases;
}

/* Mémoire de la dernière visite, par arène et dans CE navigateur. Rien ne part
 * en base : c'est un repère personnel, pas une donnée partagée. Sans lui, une
 * arène consultée deux fois de suite est identique — et il n'y a plus de raison
 * de revenir. */
const DEFI_SNAP_CLE = "kp_defi_visite_";
function lireVisite(code) {
  try { return JSON.parse(localStorage.getItem(DEFI_SNAP_CLE + code) || "null"); }
  catch (e) { return null; }
}
function ecrireVisite(code, snap) {
  try { localStorage.setItem(DEFI_SNAP_CLE + code, JSON.stringify(snap)); } catch (e) { /* stockage plein */ }
}
function rangDe(points) {
  let r = DEFI_RANGS[0];
  DEFI_RANGS.forEach(x => { if ((points || 0) >= x.seuil) r = x; });
  return r;
}
function rangSuivant(points) {
  return DEFI_RANGS.find(x => (points || 0) < x.seuil) || null;
}

/* Hauts faits : calculés à partir des compteurs renvoyés par la base, donc
 * toujours vrais. Aucun n'ouvre de droit — ils existent pour donner du relief à
 * ce qui se passe réellement dans l'arène. */
const DEFI_HAUTS_FAITS = [
  { cle: "hf_premier_sang", emoji: "🩸", test: (e) => !!e.premier_sang },
  { cle: "hf_double",       emoji: "⚡", test: (e) => (e.meilleur_jour || 0) >= 2 },
  { cle: "hf_triple",       emoji: "🔥", test: (e) => (e.meilleur_jour || 0) >= 3 },
  { cle: "hf_regulier",     emoji: "📅", test: (e) => (e.jours || 0) >= 3 },
  { cle: "hf_marathon",     emoji: "🏃", test: (e) => (e.jours || 0) >= 5 },
  { cle: "hf_serie",        emoji: "🔗", test: (e, i, t, c) => (c && c.serie || 0) >= 2 },
  { cle: "hf_sansfaute",    emoji: "💎", test: (e) => (e.vivantes || 0) >= 3 && !(e.en_route || 0) },
  { cle: "hf_podium",       emoji: "🏅", test: (e, i) => i >= 0 && i < 3 && (e.points || 0) > 0 },
  { cle: "hf_dominant",     emoji: "🐋", test: (e, i, t, c) => (c && c.part || 0) >= 50 },
  { cle: "hf_leader",       emoji: "👑", test: (e, i) => i === 0 && (e.points || 0) > 0 }
];

/* Les liens d'arène sont faits pour être ENVOYÉS à quelqu'un : ils ne doivent
 * donc jamais dépendre de l'origine courante. Depuis un aperçu de déploiement,
 * ils porteraient une URL d'aperçu, et dépasseraient au passage la capacité du
 * QR — qui disparaîtrait sans bruit. On écrit le domaine officiel le plus
 * court, ce qui laisse de la marge à l'encodeur. */
const APP_DEFI = "FamiTeam";          // nom de l'application, cité dans les textes
const DEFI_BASE = "https://fami.team/defi.html";

const $ = (s) => document.querySelector(s);
const hote = () => document.getElementById("defi");
function echapper(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "defi-toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
function param(n) { return new URLSearchParams(location.search).get(n); }
function lienArene(code) { return DEFI_BASE + "?a=" + encodeURIComponent(code); }
/* Le lien de recrutement est EXACTEMENT celui de la famille dans l'application :
 * il n'y en a qu'un à connaître, et chaque famille qui s'inscrit avec compte
 * dans toutes les arènes en cours. Le classement compte les filleuls de la
 * famille sur la période de l'arène, sans se soucier du lien emprunté. */
const DEFI_HOTE_APP = "https://fami.team/";
function lienFamille(code) { return DEFI_HOTE_APP + "?p=" + encodeURIComponent(code); }

// Nom de code du parent, choisi à la porte. Local à ce navigateur : il sert de
// pseudonyme par défaut dans les arènes et au tableau, jamais de consentement.
const CLE_PSEUDO = "kp_defi_pseudo";
function pseudoMemorise() {
  try { return (localStorage.getItem(CLE_PSEUDO) || "").trim(); } catch (e) { return ""; }
}
function memoriserPseudo(v) {
  try { localStorage.setItem(CLE_PSEUDO, String(v || "").slice(0, 24)); } catch (e) { /* stockage plein */ }
}

// Saison courante, au format que la base attend pour le classement mensuel.
function saisonCourante() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

// Temps restant en jours + heures : un compte à rebours qui bouge chaque heure
// presse plus qu'un nombre de jours qui stagne.
function resteDetail(fin) {
  const ms = new Date(fin).getTime() - Date.now();
  if (!(ms > 0)) return null;
  const h = Math.floor(ms / 3600000);
  return { jours: Math.floor(h / 24), heures: h % 24, urgent: h <= 48 };
}

/* ---------- Démarrage ---------- */
document.addEventListener("DOMContentLoaded", demarrer);

// Écran courant, pour pouvoir le redessiner à l'identique après un changement
// de langue sans repasser par le réseau quand ce n'est pas nécessaire.
let redessiner = null;

async function demarrer() {
  definirLangueDefi(langueInitiale());
  const cfg = window.KP_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || typeof supabase === "undefined") {
    return ecran(`<h1>${tD("config_t")}</h1><p class="defi-note">${tD("config_d")}</p>`);
  }
  sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  // Le lien d'arène porte aussi le code de parrainage de l'hôte : l'ami qui
  // s'inscrit depuis ce lien est rattaché à celui qui l'a défié.
  const p = param("p");
  if (p) { try { localStorage.setItem(CLE_PARRAIN, p.toUpperCase()); } catch (e) {} }
  const codeUrl = (param("a") || "").toUpperCase();
  if (codeUrl) { try { localStorage.setItem(CLE_ARENE, codeUrl); } catch (e) {} }

  const { data } = await sb.auth.getSession();
  session = data && data.session;

  if (!session) { redessiner = () => ecranVisiteur(codeUrl); return redessiner(); }
  await chargerFamille();
  if (!familleId) {
    redessiner = () => ecran(`<h1>${tD("titre")}</h1>
      <p class="defi-note">${tD("sans_famille")}</p>
      <a class="defi-btn" href="/">${tD("ouvrir_app")}</a>`);
    return redessiner();
  }
  const enAttente = codeUrl || (localStorage.getItem(CLE_ARENE) || "");
  // La porte ne s'ouvre qu'une fois, et jamais devant quelqu'un qui arrive par
  // un lien d'arène : on ne fait pas patienter un invité sur un formulaire.
  if (!pseudoMemorise() && !enAttente) return ecranPorte(() => ecranAccueil());
  if (enAttente) return ecranArene(enAttente);
  ecranAccueil();
}

async function chargerFamille() {
  const { data: membres } = await sb.from("family_members").select("family_id");
  if (!membres || !membres.length) return;
  let choisie = null;
  try { choisie = localStorage.getItem(CLE_FAMILLE); } catch (e) {}
  const ids = membres.map(m => m.family_id);
  familleId = (choisie && ids.includes(choisie)) ? choisie : ids[0];
}

// Sélecteur de langue, présent sur tous les écrans : un ami néerlandophone qui
// reçoit le lien doit pouvoir basculer sans chercher.
function barreLangues() {
  return `<div class="defi-langues">` + Object.keys(DEFI_LANGUES).map(l =>
    `<button class="defi-lg${l === langue ? " actif" : ""}" data-lg="${l}">${DEFI_LANGUES[l]}</button>`
  ).join("") + `</div>`;
}
function ecran(html) {
  hote().innerHTML = barreLangues() + html;
  hote().querySelectorAll(".defi-lg").forEach(b => {
    b.onclick = () => {
      if (b.dataset.lg === langue) return;
      definirLangueDefi(b.dataset.lg);
      if (typeof redessiner === "function") redessiner();
    };
  });
}

/* ---------- Le visiteur sans compte : l'accroche ---------- */
async function ecranVisiteur(code) {
  if (!code) {
    return ecran(`<h1>${tD("titre")}</h1><p class="defi-note">${tD("sans_lien")}</p>
      <a class="defi-btn" href="/">${tD("ouvrir_app")}</a>`);
  }
  const { data } = await sb.rpc("arene_apercu", { p_code: code });
  redessiner = () => dessinerVisiteur(data);
  dessinerVisiteur(data);
}
function dessinerVisiteur(data) {
  if (!data) {
    return ecran(`<h1>${tD("introuvable_t")}</h1><p class="defi-note">${tD("introuvable_d")}</p>
      <a class="defi-btn" href="/">${tD("ouvrir_app")}</a>`);
  }
  const fini = data.terminee;
  ecran(`
    <div class="defi-hero">
      <p class="defi-kicker">${tD("defie")}</p>
      <h1 class="defi-titre">${echapper(data.nom)}</h1>
      <p class="defi-hote-nom">${tD("ouverte_par", { hote: echapper(data.hote || "?") })}</p>
      <div class="defi-compteurs">
        <div class="defi-compteur"><span class="defi-chiffre">${data.equipes}</span><span class="defi-libelle">${tD("equipes")}</span></div>
        <div class="defi-compteur"><span class="defi-chiffre">${fini ? "—" : data.jours_restants}</span><span class="defi-libelle">${tD("jours")}</span></div>
      </div>
      ${fini ? `<p class="defi-note">${tD("terminee")}</p>` : `
      <p class="defi-regle">${tD("regle")}</p>
      <a class="defi-btn defi-btn-xl" href="/">${tD("relever")}</a>
      <p class="defi-note">${tD("relever_note")}</p>`}
    </div>`);
}

/* ---------- La porte ----------
 * Premier écran, une seule fois. Il tient trois rôles : poser l'ambiance (on
 * n'est plus dans FamiTeam), dire en trois lignes ce qu'est le Défi, et
 * dissiper la seule inquiétude sérieuse d'un parent — que cela déteigne sur
 * l'application de ses enfants. Le nom de code demandé n'est ni le nom de
 * famille ni un prénom : il sert de pseudonyme par défaut dans les arènes.
 */
function ecranPorte(suite) {
  const actuel = pseudoMemorise();
  redessiner = () => ecranPorte(suite);
  ecran(`
    <div class="defi-porte">
      <div class="defi-porte-halo" aria-hidden="true"></div>
      <p class="defi-kicker">${tD("porte_kicker")}</p>
      <h1 class="defi-porte-titre">${tD("porte_titre")}</h1>
      <p class="defi-porte-intro">${tD("porte_intro", { app: APP_DEFI })}</p>

      <ol class="defi-porte-regles">
        <li><span>1</span>${tD("porte_r1")}</li>
        <li><span>2</span>${tD("porte_r2")}</li>
        <li><span>3</span>${tD("porte_r3")}</li>
      </ol>

      <section class="defi-bloc defi-cloison">
        <h2>${tD("cloison_t")}</h2>
        <ul class="defi-cloison-l">
          <li>${tD("cloison_1", { app: APP_DEFI })}</li>
          <li>${tD("cloison_2")}</li>
          <li>${tD("cloison_3")}</li>
        </ul>
      </section>

      <section class="defi-bloc defi-merci">
        <h2>${tD("contrib_t")}</h2>
        <p class="defi-merci-p">${tD("contrib_d", { app: APP_DEFI })}</p>
        <p class="defi-merci-forte">${tD("contrib_merci", { app: APP_DEFI })}</p>
      </section>

      <section class="defi-bloc">
        <h2>${tD("porte_pseudo_t")}</h2>
        <p class="defi-note">${tD("porte_pseudo_d")}</p>
        <input id="defi-porte-pseudo" class="defi-champ" maxlength="24"
               placeholder="${tD("porte_pseudo_ph")}" value="${echapper(actuel)}">
        <button id="defi-porte-ok" class="defi-btn defi-btn-xl">${tD("porte_entrer")}</button>
      </section>
    </div>`);

  $("#defi-porte-ok").onclick = async () => {
    const v = ($("#defi-porte-pseudo").value || "").trim();
    if (!v) { $("#defi-porte-pseudo").focus(); return toast(tD("porte_manque")); }
    memoriserPseudo(v);
    // Le nom de code VAUT inscription au tableau : on ne repose pas la question
    // ailleurs. C'est un consentement par l'acte, comme entrer dans une arène —
    // d'où la phrase qui le dit juste au-dessus du champ. Best-effort : si la
    // base refuse, le nom de code sert quand même aux arènes.
    if (familleId) {
      try { await sb.rpc("definir_classement_optin", { p_family: familleId, p_optin: true, p_pseudo: v }); }
      catch (e) { /* le tableau attendra ; les arènes, non */ }
    }
    toast(tD("porte_bienvenue", { pseudo: v }));
    suite();
  };
  const champ = $("#defi-porte-pseudo");
  if (champ) champ.onkeydown = (e) => { if (e.key === "Enter") $("#defi-porte-ok").click(); };
}

/* ---------- Le tableau mondial ----------
 * Il ne s'invente rien : c'est le classement saisonnier déjà tenu en base pour
 * le tableau d'honneur de l'application, avec sa règle de consentement. Deux
 * points s'y jouent : une famille qui n'a pas consenti VOIT le tableau mais ne
 * reçoit aucun rang — « 47ᵉ sur 52 » ne se dit pas — et le tableau reste fermé
 * tant que trop peu de familles y figurent, faute de quoi le premier arrivé
 * gagnerait par défaut. */
async function ecranTop() {
  ecran(`<p class="defi-chargement">${tD("top_chargement")}</p>`);
  const saison = saisonCourante();
  const { data, error } = await sb.rpc("classement_parrainages", { p_saison: saison });
  if (error || !data) { toast(error ? error.message : tD("top_indispo")); return ecranAccueil(); }
  redessiner = () => dessinerTop(data, saison);
  dessinerTop(data, saison);
}

function dessinerTop(d, saison) {
  const top = Array.isArray(d.top) ? d.top : [];
  const medaille = (i) => ["🥇", "🥈", "🥉"][i] || String(i + 1);
  const maxi = top.length ? Math.max(...top.map(x => x.n || 0)) : 0;
  const aMoi = (x) => d.moi_inscrite && d.mon_pseudo && x.pseudo === d.mon_pseudo;

  const podium = top.slice(0, 3).map((x, i) => `
    <div class="defi-marche defi-marche-${i + 1}${aMoi(x) ? " defi-moi" : ""}">
      <span class="defi-medaille">${medaille(i)}</span>
      <span class="defi-pseudo">${echapper(x.pseudo)}</span>
      <span class="defi-points">${x.n}</span>
      <span class="defi-part" style="width:${maxi ? Math.round((x.n / maxi) * 100) : 0}%"></span>
    </div>`).join("");

  const reste = top.slice(3).map((x, i) => `
    <li class="defi-rangee${aMoi(x) ? " defi-moi" : ""}">
      <span class="defi-place">${i + 4}</span>
      <span class="defi-pseudo">${echapper(x.pseudo)}</span>
      <span class="defi-points">${x.n}</span>
    </li>`).join("");

  // Mon état : mon compte est toujours le mien ; mon rang, seulement si j'ai
  // consenti à figurer.
  const moi = `
    <section class="defi-bloc defi-moi-bloc">
      <div class="defi-moi-haut">
        <span class="defi-rang-emoji">${d.mon_rang ? "🎖️" : "🫥"}</span>
        <div>
          <p class="defi-rang-nom">${d.mon_rang ? tD("top_mon_rang", { n: d.mon_rang }) : tD("top_sans_rang")}</p>
          <p class="defi-note">${tD("top_mes_familles", { n: d.mien || 0 })}</p>
        </div>
        <span class="defi-score">${d.mien || 0}</span>
      </div>
      ${d.moi_inscrite
        ? `<p class="defi-note">${tD("top_inscrit_note", { pseudo: echapper(d.mon_pseudo || "") })}</p>
           <button id="defi-top-sortir" class="defi-lien defi-lien-danger">${tD("top_sortir")}</button>`
        : `<p class="defi-note">${tD("top_retire_note")}</p>
           <button id="defi-top-entrer" class="defi-btn">${tD("top_revenir")}</button>`}
    </section>`;

  // Le tableau porte le nombre de familles qu'il contient : Top 2, Top 3, puis
  // Top 10 quand il est plein. Un tableau vide qu'on cache n'attire personne ;
  // un Top 2 qui grandit sous les yeux, si — et chaque nouvelle arrivante en
  // change le titre.
  const plein = Math.min(10, top.length);
  const titre = plein > 0 ? tD("top_titre_n", { n: plein }) : tD("top_titre");

  ecran(`
    <div class="defi-hero defi-hero-serre">
      <p class="defi-kicker">${tD("top_saison", { s: saison })}</p>
      <h1 class="defi-titre">${titre}</h1>
      <p class="defi-note">${tD("top_sous")}</p>
    </div>

    ${top.length
      ? `<section class="defi-bloc"><h2>${tD("top_h")}</h2>
           <div class="defi-podium">${podium}</div>
           ${reste ? `<ol class="defi-liste">${reste}</ol>` : ""}
           ${plein < 10 ? `<p class="defi-grandit">${tD("top_grandit", { n: plein, reste: 10 - plein })}</p>` : ""}
           <p class="defi-note">${tD("top_regle")}</p></section>`
      : `<section class="defi-bloc defi-premiere">
           <p class="defi-premiere-emoji">🥇</p>
           <h2>${tD("top_premiere_t")}</h2>
           <p class="defi-note">${tD("top_premiere_d")}</p>
         </section>`}

    ${moi}

    <p class="defi-merci-pied">${tD("top_merci")}</p>
    <button class="defi-lien" id="defi-top-retour">${tD("retour_arenes")}</button>`);

  $("#defi-top-retour").onclick = ecranAccueil;
  const bEntrer = $("#defi-top-entrer");
  // Ce bouton ne sert plus qu'à revenir après un retrait volontaire : on
  // réutilise le nom de code déjà choisi à la porte, sans reposer la question.
  if (bEntrer) bEntrer.onclick = async () => {
    const v = pseudoMemorise();
    if (!v) return ecranPorte(() => ecranTop());
    const { error } = await sb.rpc("definir_classement_optin",
      { p_family: familleId, p_optin: true, p_pseudo: v });
    if (error) return toast(error.message);
    memoriserPseudo(v);
    toast(tD("top_inscrit"));
    ecranTop();
  };
  const bSortir = $("#defi-top-sortir");
  if (bSortir) bSortir.onclick = async () => {
    if (!confirm(tD("top_sortir_conf"))) return;
    const { error } = await sb.rpc("definir_classement_optin",
      { p_family: familleId, p_optin: false, p_pseudo: null });
    if (error) return toast(error.message);
    toast(tD("top_sorti"));
    ecranTop();
  };
}

/* ---------- L'accueil d'une famille connectée ---------- */
async function ecranAccueil() {
  const { data: miennes } = await sb.rpc("arene_mes_arenes", { p_family: familleId });
  const liste = Array.isArray(miennes) ? miennes : [];
  redessiner = () => dessinerAccueil(liste);
  dessinerAccueil(liste);
}
function dessinerAccueil(liste) {
  const cartes = liste.map(a => `
    <button class="defi-arene-l" data-code="${echapper(a.code)}">
      <span class="defi-arene-nom">${echapper(a.nom)}</span>
      <span class="defi-arene-meta">${a.equipes} ${tD("equipes")} · ${a.terminee ? tD("close") : tD("en_cours")}</span>
    </button>`).join("");

  ecran(`
    <div class="defi-hero">
      <p class="defi-kicker">${tD("confidentiel")}</p>
      <h1 class="defi-titre">${tD("titre")}</h1>
      <p class="defi-regle">${tD("intro")}</p>
    </div>
    ${liste.length ? `<section class="defi-bloc"><h2>${tD("mes_arenes")}</h2><div class="defi-arenes">${cartes}</div></section>` : ""}
    <section class="defi-bloc">
      <h2>${tD("rejoindre_t")}</h2>
      <input id="defi-code" class="defi-champ" placeholder="${tD("code_ph")}" maxlength="12">
      <button id="defi-rejoindre" class="defi-btn">${tD("entrer")}</button>
    </section>
    <section class="defi-bloc">
      <h2>${tD("creer_t")}</h2>
      <input id="defi-nom" class="defi-champ" placeholder="${tD("nom_ph")}" maxlength="40">
      <input id="defi-pseudo" class="defi-champ" placeholder="${tD("pseudo_ph")}" maxlength="24" value="${echapper(pseudoMemorise())}">
      <select id="defi-duree" class="defi-champ">
        <option value="14">${tD("d14")}</option>
        <option value="30" selected>${tD("d30")}</option>
        <option value="90">${tD("d90")}</option>
      </select>
      <button id="defi-creer" class="defi-btn defi-btn-xl">${tD("ouvrir_arene")}</button>
      <p class="defi-note">${tD("pseudo_note")}</p>
    </section>
    <section class="defi-bloc defi-bloc-top">
      <h2>${tD("top_titre")}</h2>
      <p class="defi-note">${tD("top_accroche")}</p>
      <button id="defi-vers-top" class="defi-btn">${tD("top_bouton")}</button>
    </section>
    <button class="defi-lien" id="defi-changer-pseudo">${tD("changer_pseudo", { pseudo: echapper(pseudoMemorise() || "—") })}</button>`);

  hote().querySelectorAll(".defi-arene-l").forEach(b =>
    b.onclick = () => ecranArene(b.dataset.code));

  $("#defi-vers-top").onclick = ecranTop;
  $("#defi-changer-pseudo").onclick = () => ecranPorte(() => ecranAccueil());

  $("#defi-rejoindre").onclick = () => {
    const c = ($("#defi-code").value || "").trim().toUpperCase();
    if (!c) { $("#defi-code").focus(); return; }
    ecranArene(c);
  };
  $("#defi-creer").onclick = async () => {
    const nom = ($("#defi-nom").value || "").trim();
    const pseudo = ($("#defi-pseudo").value || "").trim();
    if (!nom) { $("#defi-nom").focus(); return toast(tD("manque_nom")); }
    if (!pseudo) { $("#defi-pseudo").focus(); return toast(tD("manque_pseudo")); }
    memoriserPseudo(pseudo);
    const { data, error } = await sb.rpc("arene_creer", {
      p_family: familleId, p_nom: nom, p_jours: parseInt($("#defi-duree").value, 10), p_pseudo: pseudo
    });
    if (error) return toast(error.message);
    ecranArene(data.code);
  };
}

/* ---------- L'arène : classement, podium, invitation ---------- */
async function ecranArene(code) {
  ecran(`<p class="defi-chargement">${tD("chargement")}</p>`);
  let cls = null, err = null;
  try {
    const r = await sb.rpc("arene_classement", { p_code: code, p_family: familleId });
    cls = r.data; err = r.error;
  } catch (e) { err = e; }

  // Pas encore membre : on propose d'entrer, avec l'aperçu comme accroche.
  if (err) {
    const { data: ap } = await sb.rpc("arene_apercu", { p_code: code });
    if (!ap) {
      toast(tD("introuvable_toast"));
      try { localStorage.removeItem(CLE_ARENE); } catch (e) {}
      return ecranAccueil();
    }
    redessiner = () => dessinerEntree(code, ap);
    return dessinerEntree(code, ap);
  }
  try { localStorage.removeItem(CLE_ARENE); } catch (e) {}
  redessiner = () => dessinerArene(cls);
  dessinerArene(cls);
}

function dessinerEntree(code, ap) {
  const fini = ap.terminee;
  ecran(`
    <div class="defi-hero">
      <p class="defi-kicker">${tD("defie")}</p>
      <h1 class="defi-titre">${echapper(ap.nom)}</h1>
      <p class="defi-hote-nom">${tD("ouverte_par", { hote: echapper(ap.hote || "?") })} ·
        ${ap.equipes} ${tD("equipes")} · ${fini ? tD("arene_close") : ap.jours_restants + " " + tD("jours")}</p>
    </div>
    ${fini ? `<section class="defi-bloc"><p class="defi-note">${tD("terminee")}</p></section>` : `
    <section class="defi-bloc">
      <h2>${tD("choisis_pseudo")}</h2>
      <input id="defi-pseudo2" class="defi-champ" placeholder="${tD("pseudo_ex")}" maxlength="24" value="${echapper(pseudoMemorise())}">
      <button id="defi-entrer" class="defi-btn defi-btn-xl">⚔️ ${tD("entrer")}</button>
      <p class="defi-note">${tD("entree_note")}</p>
    </section>`}
    <button class="defi-lien" id="defi-retour">${tD("retour")}</button>`);
  $("#defi-retour").onclick = ecranAccueil;
  const b = $("#defi-entrer");
  if (b) b.onclick = async () => {
    const pseudo = ($("#defi-pseudo2").value || "").trim();
    if (!pseudo) { $("#defi-pseudo2").focus(); return toast(tD("manque_pseudo")); }
    const { error } = await sb.rpc("arene_rejoindre", { p_code: code, p_family: familleId, p_pseudo: pseudo });
    if (error) return toast(error.message);
    ecranArene(code);
  };
}

/* Ce qui a changé depuis la dernière ouverture. C'est le bloc qui donne une
 * raison de revenir : sans lui, deux visites successives se ressemblent. On ne
 * l'affiche jamais à la première visite — il n'y aurait rien à comparer. */
function blocDepuisVisite(cls, moi, iMoi, equipes) {
  const av = lireVisite(cls.code);
  if (!av) return "";
  const dPts = (moi.points || 0) - (av.points || 0);
  const dRang = (av.rang || 0) - (iMoi + 1);          // positif = on est monté
  const nouvelles = Math.max(0, equipes.length - (av.equipes || 0));
  const morceaux = [];
  if (dPts > 0) morceaux.push(tD("dv_points", { n: dPts }));
  if (dRang > 0) morceaux.push(tD("dv_monte", { n: av.rang, m: iMoi + 1 }));
  else if (dRang < 0) morceaux.push(tD("dv_descend", { n: av.rang, m: iMoi + 1 }));
  if (nouvelles > 0) morceaux.push(tD("dv_arrivees", { n: nouvelles }));
  if (!morceaux.length) {
    // Rien n'a bougé : le dire est plus mobilisateur que de masquer le bloc.
    return `<p class="defi-depuis defi-depuis-calme">${tD("dv_rien")}</p>`;
  }
  const classe = dRang < 0 ? " defi-depuis-perte" : " defi-depuis-gain";
  return `<p class="defi-depuis${classe}">${morceaux.join(" · ")}</p>`;
}

/* Objectif collectif : le total de familles installées par TOUTE l'arène. Une
 * équipe distancée continue d'y contribuer, donc continue de jouer. */
function blocPalierArene(equipes) {
  const total = equipes.reduce((n, e) => n + (e.vivantes || 0), 0);
  const atteint = palierArene(total), suivant = palierAreneSuivant(total);
  const bas = atteint ? atteint.seuil : 0;
  const haut = suivant ? suivant.seuil : Math.max(total, 1);
  const part = Math.max(2, Math.min(100, Math.round(((total - bas) / (haut - bas)) * 100)));
  return `<section class="defi-bloc defi-collectif">
    <h2>${tD("col_titre")}</h2>
    <p class="defi-note">${tD("col_note")}</p>
    <div class="defi-col-haut">
      <span class="defi-col-emoji">${atteint ? atteint.emoji : "🥚"}</span>
      <span class="defi-col-nom">${atteint ? tD(atteint.cle) : tD("col_aucun")}</span>
      <span class="defi-col-n">${total}</span>
    </div>
    <div class="defi-jauge"><div class="defi-jauge-r defi-jauge-col" style="width:${part}%"></div></div>
    <p class="defi-note">${suivant
      ? tD("col_encore", { n: suivant.seuil - total, emoji: suivant.emoji, nom: tD(suivant.cle) })
      : tD("col_max")}</p>
  </section>`;
}

/* Grille des quatorze derniers jours. Un trou se voit ; c'est tout l'intérêt. */
function blocSerie(moi, serie) {
  const cases = grilleJours(moi.jours_liste, 14).map(c =>
    `<span class="defi-jour${c.marque ? " on" : ""}${c.aujourdhui ? " auj" : ""}" title="${c.cle}"></span>`).join("");
  return `<div class="defi-serie">
    <p class="defi-serie-t">${serie > 0 ? tD("serie_on", { n: serie }) : tD("serie_off")}</p>
    <div class="defi-jours">${cases}</div>
  </div>`;
}

/* Le compte à rebours en fin de course : sous 24 h, on ne dit plus « il reste »
 * mais « c'est aujourd'hui ». */
function texteChrono(cls, chrono) {
  if (cls.terminee || !chrono) return { txt: tD("arene_close"), classe: "" };
  if (chrono.jours === 0) return { txt: tD("derniere_journee", { h: chrono.heures }), classe: " defi-final" };
  const base = tD("reste_jh", { j: chrono.jours, h: chrono.heures });
  return { txt: chrono.urgent ? base + " · " + tD("urgence") : base, classe: chrono.urgent ? " defi-urgent" : "" };
}

/* Compte croissant du score : trois cents points qui défilent se remarquent,
 * trois cents points affichés d'emblée, non. */
function animerNombre(noeud, de, a) {
  if (!noeud || de === a) return;
  const t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : null;
  if (t0 === null) { noeud.textContent = String(a); return; }
  const duree = 900;
  const pas = (t) => {
    const k = Math.min(1, (t - t0) / duree);
    const doux = 1 - Math.pow(1 - k, 3);
    noeud.textContent = String(Math.round(de + (a - de) * doux));
    if (k < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

/* Montée de rang : le seul endroit où la page se permet une fête. */
function feterRang(rang) {
  const b = document.createElement("div");
  b.className = "defi-fanfare";
  b.innerHTML = `<span class="defi-fanfare-emoji">${rang.emoji}</span>
    <span>${tD("rang_gagne", { nom: tD(rang.cle) })}</span>`;
  document.body.appendChild(b);
  setTimeout(() => b.classList.add("partir"), 2600);
  setTimeout(() => b.remove(), 3400);
}

function dessinerArene(cls) {
  const equipes = Array.isArray(cls.equipes) ? cls.equipes : [];
  const moi = equipes.find(e => e.moi) || { points: 0, vivantes: 0, en_route: 0 };
  const monRang = equipes.findIndex(e => e.moi) + 1;
  const rang = rangDe(moi.points), suivant = rangSuivant(moi.points);
  const partRang = suivant
    ? Math.round(((moi.points - rang.seuil) / (suivant.seuil - rang.seuil)) * 100) : 100;
  const medaille = (i) => ["🥇", "🥈", "🥉"][i] || String(i + 1);

  // Le premier sang revient à l'équipe qui a marqué la première dans l'arène.
  const avecDate = equipes.filter(e => e.premiere_le);
  const premier = avecDate.length
    ? avecDate.reduce((a, b) => (new Date(a.premiere_le) <= new Date(b.premiere_le) ? a : b)) : null;
  equipes.forEach(e => { e.premier_sang = !!(premier && e === premier); });

  // L'écart avec l'équipe DEVANT : c'est le chiffre qui fait revenir. Quand on
  // mène, on affiche l'avance sur le second — même ressort, sens inverse.
  const iMoi = equipes.findIndex(e => e.moi);
  let ecart = "";
  if (iMoi === 0 && equipes.length > 1) {
    ecart = `<p class="defi-ecart defi-ecart-tete">${tD("ecart_tete", { n: moi.points - equipes[1].points, pseudo: echapper(equipes[1].pseudo) })}</p>`;
  } else if (iMoi > 0) {
    const devant = equipes[iMoi - 1];
    const manque = devant.points - moi.points;
    // Converti en familles : « 150 points » ne dit pas quoi faire, « 2 familles » si.
    const nFam = Math.max(1, Math.ceil((manque + 1) / 100));
    ecart = `<p class="defi-ecart">${tD("ecart_devant", { n: manque, pseudo: echapper(devant.pseudo) })}
      <br><strong>${tD("ecart_action", { n: nFam })}</strong></p>`;
  }

  // Hauts faits : verrouillés tant qu'ils ne sont pas obtenus, pour qu'on voie
  // ce qu'il reste à décrocher.
  const serie = serieEnCours(moi.jours_liste);
  const totalPts = equipes.reduce((n, e) => n + (e.points || 0), 0);
  const ctx = { serie, part: totalPts > 0 ? Math.round((moi.points / totalPts) * 100) : 0 };
  const faits = DEFI_HAUTS_FAITS.map(f => {
    const acquis = f.test(moi, iMoi, equipes, ctx);
    return `<span class="defi-fait${acquis ? " acquis" : ""}" title="${tD(f.cle + "_d")}">
      <span class="defi-fait-emoji">${f.emoji}</span>
      <span class="defi-fait-nom">${tD(f.cle)}</span></span>`;
  }).join("");

  // Part du total de l'arène : la domination se voit d'un coup d'œil.
  const part = (e) => (totalPts > 0 ? Math.round((e.points / totalPts) * 100) : 0);
  const chrono = resteDetail(cls.fin);
  const tempo = texteChrono(cls, chrono);
  const avant = lireVisite(cls.code);

  const podium = equipes.slice(0, 3).map((e, i) => `
    <div class="defi-marche defi-marche-${i + 1}${e.moi ? " defi-moi" : ""}">
      <span class="defi-medaille">${medaille(i)}</span>
      <span class="defi-pseudo">${echapper(e.pseudo)}${e.premier_sang ? ' <span class="defi-sang" title="' + tD("hf_premier_sang_d") + '">🩸</span>' : ""}</span>
      <span class="defi-points">${e.points}</span>
      <span class="defi-part" style="width:${part(e)}%"></span>
    </div>`).join("");

  const reste = equipes.slice(3).map((e, i) => `
    <li class="defi-rangee${e.moi ? " defi-moi" : ""}">
      <span class="defi-place">${i + 4}</span>
      <span class="defi-pseudo">${echapper(e.pseudo)}</span>
      <span class="defi-detail">${e.vivantes}×100${e.en_route ? ` + ${e.en_route}×25` : ""}</span>
      <span class="defi-points">${e.points}</span>
    </li>`).join("");

  ecran(`
    <div class="defi-hero defi-hero-serre">
      <p class="defi-kicker${tempo.classe}">${tempo.txt}</p>
      <h1 class="defi-titre">${echapper(cls.nom)}</h1>
    </div>
    ${blocDepuisVisite(cls, moi, iMoi, equipes)}

    <section class="defi-bloc defi-moi-bloc">
      <div class="defi-moi-haut">
        <span class="defi-rang-emoji">${rang.emoji}</span>
        <div>
          <p class="defi-rang-nom">${tD(rang.cle)}</p>
          <p class="defi-note">${monRang ? tD("classe", { rang: monRang, total: equipes.length }) : tD("non_classe")}</p>
        </div>
        <span class="defi-score">${moi.points}</span>
      </div>
      ${suivant ? `<div class="defi-jauge"><div class="defi-jauge-r" style="width:${Math.max(2, partRang)}%"></div></div>
        <p class="defi-note">${tD("encore", { n: suivant.seuil - moi.points, emoji: suivant.emoji, nom: tD(suivant.cle) })}</p>`
      : `<p class="defi-note">${tD("rang_max")}</p>`}
      ${moi.en_route ? `<p class="defi-attente">${tD("attente", { n: moi.en_route * 75, f: moi.en_route })}</p>` : ""}
      ${ecart}
      ${blocSerie(moi, serie)}
    </section>

    ${blocPalierArene(equipes)}

    ${faits ? `<section class="defi-bloc"><h2>${tD("hf_titre")}</h2>
      <div class="defi-faits">${faits}</div></section>` : ""}

    ${equipes.length ? `<section class="defi-bloc">
      <h2>${tD("podium")}</h2>
      <div class="defi-podium">${podium}</div>
      ${reste ? `<ol class="defi-liste">${reste}</ol>` : ""}
    </section>` : ""}

    <section class="defi-bloc">
      <h2>${tD("amene_t")}</h2>
      <p class="defi-note">${tD("amene_d2")}</p>
      <p class="defi-note">${tD("amene_d")}</p>
      <div id="defi-invit" class="defi-invit"><p class="defi-note">${tD("lien_prep")}</p></div>
    </section>

    <section class="defi-bloc">
      <h2>${tD("inviter_t")}</h2>
      <p class="defi-note">${tD("inviter_d")}</p>
      <div class="defi-copie">
        <input class="defi-champ" id="defi-lien-arene" readonly value="${echapper(lienArene(cls.code))}">
        <button class="defi-btn" id="defi-copier">${tD("copier")}</button>
      </div>
      <p class="defi-note">${tD("code_arene")} <strong class="defi-code">${echapper(cls.code)}</strong></p>
    </section>

    <button class="defi-lien" id="defi-retour">${tD("retour_arenes")}</button>
    <button class="defi-lien defi-lien-danger" id="defi-quitter">${tD("quitter")}</button>`);

  // Le score défile depuis la valeur de la dernière visite ; une montée de rang
  // se fête. Puis seulement on enregistre le nouvel état — sinon la comparaison
  // se ferait contre elle-même.
  const noeudScore = $(".defi-score");
  if (noeudScore) animerNombre(noeudScore, avant ? (avant.points || 0) : 0, moi.points || 0);
  if (avant && rangDe(avant.points || 0).cle !== rang.cle && (moi.points || 0) > (avant.points || 0)) {
    feterRang(rang);
  }
  ecrireVisite(cls.code, { points: moi.points || 0, rang: iMoi + 1, equipes: equipes.length, le: new Date().toISOString() });

  $("#defi-retour").onclick = ecranAccueil;
  $("#defi-copier").onclick = () => copier($("#defi-lien-arene"));
  $("#defi-quitter").onclick = async () => {
    if (!confirm(tD("quitter_conf"))) return;
    const { error } = await sb.rpc("arene_quitter", { p_code: cls.code, p_family: familleId });
    if (error) return toast(error.message);
    toast(tD("quitte"));
    ecranAccueil();
  };

  // Le lien de recrutement : code de parrainage de la famille + code d'arène,
  // pour que l'ami inscrit soit rattaché ET atterrisse dans la bonne arène.
  chargerLienRecrutement();
}

async function copier(champ) {
  try { await navigator.clipboard.writeText(champ.value); toast(tD("copie")); }
  catch (e) { champ.select(); toast(tD("copie_ko")); }
}

async function chargerLienRecrutement() {
  const zone = document.getElementById("defi-invit");
  if (!zone) return;
  const { data: code, error } = await sb.rpc("referral_code_famille", { p_family: familleId });
  if (error || !code) { zone.innerHTML = `<p class="defi-note">${tD("lien_ko")}</p>`; return; }
  // EXACTEMENT le lien de la famille dans l'application : un seul lien à
  // connaître, et chaque inscription qu'il produit compte dans toutes les
  // arènes en cours.
  const lien = lienFamille(code);
  const qr = (typeof qrSvg === "function") ? qrSvg(lien, { classe: "defi-qr" }) : null;
  // Si le QR ne peut pas être produit, on le DIT : un carré qui disparaît sans
  // explication est pire que pas de carré du tout.
  zone.innerHTML = `
    <div class="defi-copie">
      <input class="defi-champ" id="defi-lien-recrue" readonly value="${echapper(lien)}">
      <button class="defi-btn" id="defi-copier2">${tD("copier")}</button>
    </div>
    ${qr ? `<div class="defi-qr-cadre">${qr}</div>` : `<p class="defi-note">${tD("qr_ko")}</p>`}`;
  const b = document.getElementById("defi-copier2");
  if (b) b.onclick = () => copier(document.getElementById("defi-lien-recrue"));
}

// Export pour le banc d'essai (aucun effet dans le navigateur).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFI_RANGS, rangDe, rangSuivant, DEFI_I18N, DEFI_LANGUES, tD };
}
