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
const DEFI_RANGS = [
  { seuil: 0,    cle: "r1", emoji: "🥚" },
  { seuil: 100,  cle: "r2", emoji: "🔥" },
  { seuil: 250,  cle: "r3", emoji: "⚡" },
  { seuil: 500,  cle: "r4", emoji: "👑" },
  { seuil: 1000, cle: "r5", emoji: "🐉" }
];
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
  { cle: "hf_premier_sang", emoji: "🩸", test: (e, i, t) => !!e.premier_sang },
  { cle: "hf_double",       emoji: "⚡", test: (e) => (e.meilleur_jour || 0) >= 2 },
  { cle: "hf_triple",       emoji: "🔥", test: (e) => (e.meilleur_jour || 0) >= 3 },
  { cle: "hf_regulier",     emoji: "📅", test: (e) => (e.jours || 0) >= 3 },
  { cle: "hf_sansfaute",    emoji: "💎", test: (e) => (e.vivantes || 0) >= 3 && !(e.en_route || 0) },
  { cle: "hf_leader",       emoji: "👑", test: (e, i) => i === 0 && (e.points || 0) > 0 }
];

/* Les liens d'arène sont faits pour être ENVOYÉS à quelqu'un : ils ne doivent
 * donc jamais dépendre de l'origine courante. Depuis un aperçu de déploiement,
 * ils porteraient une URL d'aperçu, et dépasseraient au passage la capacité du
 * QR — qui disparaîtrait sans bruit. On écrit le domaine officiel le plus
 * court, ce qui laisse de la marge à l'encodeur. */
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
      <input id="defi-pseudo" class="defi-champ" placeholder="${tD("pseudo_ph")}" maxlength="24">
      <select id="defi-duree" class="defi-champ">
        <option value="14">${tD("d14")}</option>
        <option value="30" selected>${tD("d30")}</option>
        <option value="90">${tD("d90")}</option>
      </select>
      <button id="defi-creer" class="defi-btn defi-btn-xl">${tD("ouvrir_arene")}</button>
      <p class="defi-note">${tD("pseudo_note")}</p>
    </section>`);

  hote().querySelectorAll(".defi-arene-l").forEach(b =>
    b.onclick = () => ecranArene(b.dataset.code));

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
      <input id="defi-pseudo2" class="defi-champ" placeholder="${tD("pseudo_ex")}" maxlength="24">
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
    ecart = `<p class="defi-ecart">${tD("ecart_devant", { n: devant.points - moi.points, pseudo: echapper(devant.pseudo) })}</p>`;
  }

  // Hauts faits : verrouillés tant qu'ils ne sont pas obtenus, pour qu'on voie
  // ce qu'il reste à décrocher.
  const faits = DEFI_HAUTS_FAITS.map(f => {
    const acquis = f.test(moi, iMoi, equipes);
    return `<span class="defi-fait${acquis ? " acquis" : ""}" title="${tD(f.cle + "_d")}">
      <span class="defi-fait-emoji">${f.emoji}</span>
      <span class="defi-fait-nom">${tD(f.cle)}</span></span>`;
  }).join("");

  // Part du total de l'arène : la domination se voit d'un coup d'œil.
  const total = equipes.reduce((n, e) => n + (e.points || 0), 0);
  const part = (e) => (total > 0 ? Math.round((e.points / total) * 100) : 0);
  const chrono = resteDetail(cls.fin);

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
      <p class="defi-kicker${chrono && chrono.urgent ? " defi-urgent" : ""}">${
        cls.terminee ? tD("arene_close")
        : (chrono ? tD("reste_jh", { j: chrono.jours, h: chrono.heures }) + (chrono.urgent ? " · " + tD("urgence") : "")
                  : tD("arene_close"))}</p>
      <h1 class="defi-titre">${echapper(cls.nom)}</h1>
    </div>

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
    </section>

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
