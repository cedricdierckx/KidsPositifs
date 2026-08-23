/* =====================================================================
 * FamiTeam — Internationalisation (i18n)
 * ---------------------------------------------------------------------
 * Langues : français, anglais, néerlandais, allemand.
 * Utilisation : t("cle", { var: valeur }).  Repli automatique sur le
 * français puis sur la clé elle-même si une traduction manque.
 * ===================================================================== */

const LANGUES = { fr: "Français", en: "English", nl: "Nederlands", de: "Deutsch" };
// Drapeaux en SVG inline (rendu identique partout, contrairement aux emojis
// drapeaux qui s'affichent « FR / GB / NL / DE » sous Windows).
const DRAPEAUX_SVG = {
  fr: `<svg class="dpx" viewBox="0 0 3 2" aria-hidden="true"><rect width="3" height="2" fill="#fff"/><rect width="1" height="2" fill="#0055A4"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>`,
  en: `<svg class="dpx" viewBox="0 0 60 30" aria-hidden="true"><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="3"/><path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/><path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/></svg>`,
  nl: `<svg class="dpx" viewBox="0 0 3 3" aria-hidden="true"><rect width="3" height="3" fill="#fff"/><rect width="3" height="1" fill="#AE1C28"/><rect y="2" width="3" height="1" fill="#21468B"/></svg>`,
  de: `<svg class="dpx" viewBox="0 0 3 3" aria-hidden="true"><rect width="3" height="1" fill="#000"/><rect y="1" width="3" height="1" fill="#DD0000"/><rect y="2" width="3" height="1" fill="#FFCE00"/></svg>`
};
function drapeau(l) { return DRAPEAUX_SVG[l] || ""; }
// detecterLangue() (definie plus bas, donc hissee) n'etait appelee de NULLE
// PART : `langue` restait a "fr" a chaque chargement. Le choix s'ecrivait bien
// dans le stockage local — definirLangue() le fait — mais rien ne le relisait,
// si bien qu'un rafraichissement ramenait tout le monde au francais. Et la
// langue du navigateur ne servait pas davantage : un parent neerlandophone
// atterrissait en francais a sa premiere visite.
let langue = detecterLangue();

const I18N = {
  fr: {
    "nav.accueil": "Accueil", "nav.famille": "Famille", "nav.planete": "Planète",
    "nav.avatar": "Avatar", "nav.parents": "Parents",
    "langue": "Langue",
    "auth.tagline": "Connecte-toi pour retrouver ta famille sur tous tes appareils.",
    "auth.email_ph": "email@exemple.com",
    "auth.mdp_ph": "Mot de passe",
    "auth.connexion": "Se connecter",
    "auth.lien_magique": "Utiliser un lien magique ✨",
    "auth.mot_de_passe": "Utiliser un mot de passe",
    "auth.creer_compte": "Créer mon compte",
    "auth.recevoir_lien": "Recevoir un lien magique ✨",
    "auth.pas_compte": "Pas de compte ? Créer un compte",
    "auth.deja_compte": "← J'ai déjà un compte",
    "auth.attente_note": "✨ Les inscriptions sont actuellement sur invitation uniquement. Demande un lien à une famille déjà inscrite, ou laisse ton e-mail pour être prévenu·e dès l'ouverture.",
    "auth.rejoindre_attente": "📝 Rejoindre la liste d'attente",
    "auth.demo": "🧪 Découvrir en démo (sans compte)",
    "auth.concept_titre": "🎁 Toute la famille, dans la même équipe",
    "auth.concept_texte": "{app} aide les parents à instaurer une ambiance positive à la maison et à aligner toute la famille sur les tâches du quotidien 🏡 et la protection de la planète 🌍 — en douceur, par l'encouragement. L'accès se fait sur invitation : chaque famille peut parrainer 3 familles amies par semaine. 🤝",
    "auth.parrain_generique": "🎁 Tu as été parrainé·e ! Crée ton compte pour lancer ta propre famille.",
    "auth.parrain_nomme": "🎁 {nom} t'invite(nt) à découvrir {app} ! Crée ton compte pour lancer ta propre famille.",
    "auth.msg_entre_email": "Entre ton adresse e-mail.",
    "auth.msg_email_envoye": "📧 E-mail envoyé ! Clique sur le lien reçu pour te connecter.",
    "auth.msg_compte_cree": "Compte créé ! Vérifie ta boîte mail (et le dossier spam) pour finaliser la création du compte.",
    "auth.msg_invitation_only": "Inscription sur invitation uniquement. Rejoins la liste d'attente ci-dessous.",
    "auth.msg_attente_email": "Entre ton e-mail pour rejoindre la liste d'attente.",
    "auth.msg_attente_ok": "🎉 Merci ! Tu es sur la liste d'attente. On te préviendra dès qu'une place se libère.",
    "auth.erreur": "Erreur : {msg}",
    "auth.mdp_oublie": "Mot de passe oublié ?",
    "auth.msg_reset_envoye": "📧 E-mail envoyé ! Clique sur le lien reçu pour choisir un nouveau mot de passe.",
    "auth.reset_titre": "🔑 Choisis un nouveau mot de passe",
    "auth.reset_ph": "Nouveau mot de passe (8 caractères min.)",
    "auth.reset_valider": "Enregistrer le mot de passe",
    "auth.reset_ok": "✅ Mot de passe mis à jour ! Tu es connecté·e.",
    "auth.reset_retour": "← Retour à la connexion",
    "auth.mdp_court": "Le mot de passe doit comporter au moins 8 caractères."
  },
  en: {
    "nav.accueil": "Home", "nav.famille": "Family", "nav.planete": "Planet",
    "nav.avatar": "Avatar", "nav.parents": "Parents",
    "langue": "Language",
    "auth.tagline": "Log in to find your family on all your devices.",
    "auth.email_ph": "email@example.com",
    "auth.mdp_ph": "Password",
    "auth.connexion": "Log in",
    "auth.lien_magique": "Use a magic link ✨",
    "auth.mot_de_passe": "Use a password",
    "auth.creer_compte": "Create my account",
    "auth.recevoir_lien": "Get a magic link ✨",
    "auth.pas_compte": "No account? Create one",
    "auth.deja_compte": "← I already have an account",
    "auth.attente_note": "✨ Sign-ups are currently invitation-only. Ask a member family for a link, or leave your e-mail to be notified when we open up.",
    "auth.rejoindre_attente": "📝 Join the waiting list",
    "auth.demo": "🧪 Try the demo (no account)",
    "auth.concept_titre": "🎁 The whole family, on the same team",
    "auth.concept_texte": "{app} helps parents build a positive atmosphere at home and get the whole family aligned on everyday chores 🏡 and protecting the planet 🌍 — gently, through encouragement. Access is invitation-only: each family can refer 3 friend families per week. 🤝",
    "auth.parrain_generique": "🎁 You've been referred! Create your account to start your own family.",
    "auth.parrain_nomme": "🎁 {nom} invites you to discover {app}! Create your account to start your own family.",
    "auth.msg_entre_email": "Enter your e-mail address.",
    "auth.msg_email_envoye": "📧 E-mail sent! Click the link to log in.",
    "auth.msg_compte_cree": "Account created! Check your inbox (and spam folder) to finalize your account.",
    "auth.msg_invitation_only": "Sign-up is invitation-only. Join the waiting list below.",
    "auth.msg_attente_email": "Enter your e-mail to join the waiting list.",
    "auth.msg_attente_ok": "🎉 Thanks! You're on the waiting list. We'll let you know as soon as a spot opens up.",
    "auth.erreur": "Error: {msg}",
    "auth.mdp_oublie": "Forgot your password?",
    "auth.msg_reset_envoye": "📧 E-mail sent! Click the link to choose a new password.",
    "auth.reset_titre": "🔑 Choose a new password",
    "auth.reset_ph": "New password (min. 8 characters)",
    "auth.reset_valider": "Save password",
    "auth.reset_ok": "✅ Password updated! You're logged in.",
    "auth.reset_retour": "← Back to login",
    "auth.mdp_court": "The password must be at least 8 characters long."
  },
  nl: {
    "nav.accueil": "Start", "nav.famille": "Gezin", "nav.planete": "Planeet",
    "nav.avatar": "Avatar", "nav.parents": "Ouders",
    "langue": "Taal",
    "auth.tagline": "Log in om je gezin op al je apparaten terug te vinden.",
    "auth.email_ph": "email@voorbeeld.com",
    "auth.mdp_ph": "Wachtwoord",
    "auth.connexion": "Inloggen",
    "auth.lien_magique": "Magische link gebruiken ✨",
    "auth.mot_de_passe": "Wachtwoord gebruiken",
    "auth.creer_compte": "Mijn account aanmaken",
    "auth.recevoir_lien": "Magische link ontvangen ✨",
    "auth.pas_compte": "Geen account? Maak er een aan",
    "auth.deja_compte": "← Ik heb al een account",
    "auth.attente_note": "✨ Registreren kan momenteel alleen op uitnodiging. Vraag een link aan een gezin dat al lid is, of laat je e-mail achter om verwittigd te worden.",
    "auth.rejoindre_attente": "📝 Aanmelden voor de wachtlijst",
    "auth.demo": "🧪 Probeer de demo (geen account)",
    "auth.concept_titre": "🎁 Het hele gezin, één team",
    "auth.concept_texte": "{app} helpt ouders een positieve sfeer thuis te creëren en het hele gezin op één lijn te krijgen voor de dagelijkse taken 🏡 en de bescherming van de planeet 🌍 — zachtjes, via aanmoediging. Toegang is op uitnodiging: elk gezin kan 3 bevriende gezinnen per week uitnodigen. 🤝",
    "auth.parrain_generique": "🎁 Je bent uitgenodigd! Maak je account aan om je eigen gezin te starten.",
    "auth.parrain_nomme": "🎁 {nom} nodigt je uit om {app} te ontdekken! Maak je account aan om je eigen gezin te starten.",
    "auth.msg_entre_email": "Vul je e-mailadres in.",
    "auth.msg_email_envoye": "📧 E-mail verzonden! Klik op de link om in te loggen.",
    "auth.msg_compte_cree": "Account aangemaakt! Controleer je mailbox (en spammap) om je account te voltooien.",
    "auth.msg_invitation_only": "Registreren kan alleen op uitnodiging. Meld je hieronder aan voor de wachtlijst.",
    "auth.msg_attente_email": "Vul je e-mail in om je aan te melden voor de wachtlijst.",
    "auth.msg_attente_ok": "🎉 Bedankt! Je staat op de wachtlijst. We verwittigen je zodra er plaats vrijkomt.",
    "auth.erreur": "Fout: {msg}",
    "auth.mdp_oublie": "Wachtwoord vergeten?",
    "auth.msg_reset_envoye": "📧 E-mail verzonden! Klik op de link om een nieuw wachtwoord te kiezen.",
    "auth.reset_titre": "🔑 Kies een nieuw wachtwoord",
    "auth.reset_ph": "Nieuw wachtwoord (min. 8 tekens)",
    "auth.reset_valider": "Wachtwoord opslaan",
    "auth.reset_ok": "✅ Wachtwoord bijgewerkt! Je bent ingelogd.",
    "auth.reset_retour": "← Terug naar inloggen",
    "auth.mdp_court": "Het wachtwoord moet minstens 8 tekens lang zijn."
  },
  de: {
    "nav.accueil": "Start", "nav.famille": "Familie", "nav.planete": "Planet",
    "nav.avatar": "Avatar", "nav.parents": "Eltern",
    "langue": "Sprache",
    "auth.tagline": "Melde dich an, um deine Familie auf all deinen Geräten wiederzufinden.",
    "auth.email_ph": "email@beispiel.com",
    "auth.mdp_ph": "Passwort",
    "auth.connexion": "Anmelden",
    "auth.lien_magique": "Magischen Link verwenden ✨",
    "auth.mot_de_passe": "Passwort verwenden",
    "auth.creer_compte": "Mein Konto erstellen",
    "auth.recevoir_lien": "Magischen Link erhalten ✨",
    "auth.pas_compte": "Kein Konto? Jetzt erstellen",
    "auth.deja_compte": "← Ich habe schon ein Konto",
    "auth.attente_note": "✨ Die Registrierung ist derzeit nur auf Einladung möglich. Bitte eine bereits registrierte Familie um einen Link, oder hinterlasse deine E-Mail, um benachrichtigt zu werden.",
    "auth.rejoindre_attente": "📝 Auf die Warteliste",
    "auth.demo": "🧪 Demo ausprobieren (ohne Konto)",
    "auth.concept_titre": "🎁 Die ganze Familie, ein Team",
    "auth.concept_texte": "{app} hilft Eltern, zu Hause eine positive Stimmung zu schaffen und die ganze Familie bei den täglichen Aufgaben 🏡 und beim Schutz des Planeten 🌍 an einem Strang ziehen zu lassen — sanft, durch Ermutigung. Der Zugang erfolgt auf Einladung: Jede Familie kann 3 befreundete Familien pro Woche einladen. 🤝",
    "auth.parrain_generique": "🎁 Du wurdest eingeladen! Erstelle dein Konto, um deine eigene Familie zu starten.",
    "auth.parrain_nomme": "🎁 {nom} lädt dich ein, {app} zu entdecken! Erstelle dein Konto, um deine eigene Familie zu starten.",
    "auth.msg_entre_email": "Gib deine E-Mail-Adresse ein.",
    "auth.msg_email_envoye": "📧 E-Mail gesendet! Klicke auf den Link, um dich anzumelden.",
    "auth.msg_compte_cree": "Konto erstellt! Prüfe dein Postfach (und den Spam-Ordner), um die Kontoerstellung abzuschließen.",
    "auth.msg_invitation_only": "Registrierung nur auf Einladung. Trage dich unten in die Warteliste ein.",
    "auth.msg_attente_email": "Gib deine E-Mail ein, um dich in die Warteliste einzutragen.",
    "auth.msg_attente_ok": "🎉 Danke! Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.",
    "auth.erreur": "Fehler: {msg}",
    "auth.mdp_oublie": "Passwort vergessen?",
    "auth.msg_reset_envoye": "📧 E-mail gesendet! Klicke auf den Link, um ein neues Passwort zu wählen.",
    "auth.reset_titre": "🔑 Wähle ein neues Passwort",
    "auth.reset_ph": "Neues Passwort (mind. 8 Zeichen)",
    "auth.reset_valider": "Passwort speichern",
    "auth.reset_ok": "✅ Passwort aktualisiert! Du bist angemeldet.",
    "auth.reset_retour": "← Zurück zur Anmeldung",
    "auth.mdp_court": "Das Passwort muss mindestens 8 Zeichen lang sein."
  }
};

function detecterLangue() {
  try {
    const stocke = localStorage.getItem("kp_langue");
    if (stocke && LANGUES[stocke]) return stocke;
  } catch {}
  const n = ((navigator && navigator.language) || "fr").slice(0, 2).toLowerCase();
  return LANGUES[n] ? n : "fr";
}
// Au chargement aussi, pas seulement lors d'un changement : `<html lang>`
// renseigne le navigateur, les lecteurs d'ecran et les moteurs.
try { if (typeof document !== "undefined" && document.documentElement) document.documentElement.lang = langue; } catch {}

function definirLangue(l) {
  if (!LANGUES[l]) return;
  langue = l;
  try { localStorage.setItem("kp_langue", l); } catch {}
  if (document.documentElement) document.documentElement.lang = l;
}
function t(cle, vars) {
  const table = I18N[langue] || I18N.fr;
  let s = (cle in table) ? table[cle]
        : (cle in I18N.fr ? I18N.fr[cle] : cle);
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

// Traduit un libellé de contenu (mission, espèce, option d'avatar...) dont la
// donnée de base (data.js) est en français. Cherche "prefix.id" dans la
// langue courante ; si absent (ou en français), retombe sur `fallback`.
function trData(prefix, id, fallback) {
  const table = I18N[langue];
  const k = prefix + "." + id;
  return (table && table[k]) || fallback;
}

/* ---- Phase E2 : écrans enfant (accueil, missions, écosystème, dodo) ---- */
Object.assign(I18N.fr, {
  "home.salut": "Salut {prenom} !", "home.ans": "{age} ans",
  "home.coeurs_label": "Cœurs à dépenser", "home.gouttes_label": "Gouttes de vie",
  "home.missions_famille": "🏡 Missions Famille", "home.missions_planete": "🌍 Missions Planète",
  "home.voir_tout": "Voir tout →", "home.mon_ecosysteme": "🌱 Mon écosystème",
  "home.eco_vide": "🌱 Ta nature attend tes premières plantes…",
  "home.etres_vivants": "{n} êtres vivants", "home.mes_badges": "🏆 Mes badges",
  "dodo.title": "Quand l'étoile arrive à la lune, c'est l'heure de dormir",
  "dodo.fait": "✅ Au lit à l'heure !", "dodo.attente": "⏳ En attente",
  "dodo.bouton": "Je vais au lit à l'heure 🌙 +{pts}💛",
  "dodo.jour": "Encore du temps pour jouer", "dodo.soir": "Le dodo approche",
  "dodo.nuit": "C'est l'heure de dormir",
  "missions.aucune": "Aucune mission prévue aujourd'hui pour cette catégorie.",
  "etat.attente": "⏳ En attente",
  "cat.famille.nom": "Famille", "cat.planete.nom": "Planète",
  "cat.famille.desc": "Coups de cœur gagnés en aidant et en prenant soin des autres. Ils permettent de faire évoluer ton avatar !",
  "cat.planete.desc": "Gouttes de vie gagnées en protégeant la nature. Goutte à goutte, tu construis ton écosystème !",
  "money.coeurs": "Cœurs", "money.gouttes": "Gouttes",
  "rep.titre": "🌈 Oups, ça arrive… — réparer plutôt que punir",
  "rep.texte": "Ici, on ne retire <strong>jamais</strong> de points. Quand il y a eu un incident (dispute, objet cassé, mot qui blesse), l'enfant fait un <strong>geste de réparation</strong> — et c'est ce geste qui lui rapporte un petit bonus 💛.",
  "rep.quand": "À utiliser juste après l'incident, avec {prenom} à côté de toi : tu coches le geste une fois qu'il est vraiment fait.",
  "rep.aide.titre": "❓ Comment ça marche ?",
  "rep.etape1": "<strong>Il vient de se passer quelque chose.</strong> On respire, on nomme calmement ce qui s'est passé, sans crier ni sanction.",
  "rep.etape2": "<strong>Vous choisissez ensemble un geste</strong> dans la liste ci-dessous (ranger, s'excuser, un geste doux, aider la personne), et l'enfant le réalise pour de vrai.",
  "rep.etape3": "<strong>Le geste fait, tu le coches ici</strong> : l'enfant gagne +1 ou +2 💛. On récompense la réparation, jamais l'incident.",
  "rep.aide.annuler": "Coché par erreur ? Reclique dessus dans l'heure pour annuler le bonus. Après une heure, le geste redevient disponible pour une prochaine fois.",
  "rep.aide.pourquoi": "Pourquoi pas de punition ? Retirer des points apprend surtout à cacher l'erreur. Réparer apprend à reconnaître son geste, à prendre soin de l'autre et à repartir du bon pied.",
  "eco.titre": "🌱 Mon écosystème vivant",
  "eco.intro": "Chaque être vivant est une <strong>carte</strong> 🃏 avec ses besoins. Crée d'abord les 🌱 plantes, puis les 🐰 herbivores qui les mangent, puis les 🦊 carnivores. Pour un 🐒 singe il faut 10 arbres et 1 bananier !",
  "eco.vide_court": "Crée ta première plante 🌱",
  "eco.aucun_prereq": "Aucun prérequis ☀️", "eco.creer": "➕ Créer",
  "eco.plus_gouttes": "💧 Plus de gouttes", "eco.verrouille": "🔒 Verrouillé"
});
Object.assign(I18N.en, {
  "home.salut": "Hi {prenom}!", "home.ans": "{age} yrs",
  "home.coeurs_label": "Hearts to spend", "home.gouttes_label": "Drops of life",
  "home.missions_famille": "🏡 Family missions", "home.missions_planete": "🌍 Planet missions",
  "home.voir_tout": "See all →", "home.mon_ecosysteme": "🌱 My ecosystem",
  "home.eco_vide": "🌱 Your nature is waiting for its first plants…",
  "home.etres_vivants": "{n} living beings", "home.mes_badges": "🏆 My badges",
  "dodo.title": "When the star reaches the moon, it's time to sleep",
  "dodo.fait": "✅ In bed on time!", "dodo.attente": "⏳ Pending",
  "dodo.bouton": "I'm going to bed on time 🌙 +{pts}💛",
  "dodo.jour": "Still time to play", "dodo.soir": "Bedtime is coming",
  "dodo.nuit": "Time to sleep",
  "missions.aucune": "No missions planned today for this category.",
  "etat.attente": "⏳ Pending",
  "cat.famille.nom": "Family", "cat.planete.nom": "Planet",
  "cat.famille.desc": "Hearts earned by helping and caring for others. Use them to grow your avatar!",
  "cat.planete.desc": "Drops of life earned by protecting nature. Drop by drop, you build your ecosystem!",
  "money.coeurs": "Hearts", "money.gouttes": "Drops",
  "rep.titre": "🌈 Oops, it happens… — repair rather than punish",
  "rep.texte": "Points are <strong>never</strong> taken away here. After an incident (an argument, something broken, a hurtful word), the child makes a <strong>repair gesture</strong> — and it is that gesture that earns a small 💛 bonus.",
  "rep.quand": "Use it right after the incident, with {prenom} next to you: tick the gesture once it has really been done.",
  "rep.aide.titre": "❓ How does it work?",
  "rep.etape1": "<strong>Something has just happened.</strong> Take a breath and calmly name what went on — no shouting, no sanction.",
  "rep.etape2": "<strong>Choose a gesture together</strong> from the list below (tidy up, apologise, a kind gesture, help the person), and the child actually does it.",
  "rep.etape3": "<strong>Once done, tick it here</strong>: the child earns +1 or +2 💛. We reward the repair, never the incident.",
  "rep.aide.annuler": "Ticked by mistake? Tap it again within the hour to cancel the bonus. After an hour the gesture becomes available again for next time.",
  "rep.aide.pourquoi": "Why no punishment? Taking points away mostly teaches children to hide their mistakes. Repairing teaches them to own the act, care for the other person and start afresh.",
  "eco.titre": "🌱 My living ecosystem",
  "eco.intro": "Every living being is a <strong>card</strong> 🃏 with its needs. First create 🌱 plants, then 🐰 herbivores that eat them, then 🦊 carnivores. A 🐒 monkey needs 10 trees and 1 banana tree!",
  "eco.vide_court": "Create your first plant 🌱",
  "eco.aucun_prereq": "No requirements ☀️", "eco.creer": "➕ Create",
  "eco.plus_gouttes": "💧 Not enough drops", "eco.verrouille": "🔒 Locked"
});
Object.assign(I18N.nl, {
  "home.salut": "Hoi {prenom}!", "home.ans": "{age} jaar",
  "home.coeurs_label": "Hartjes om te besteden", "home.gouttes_label": "Druppels leven",
  "home.missions_famille": "🏡 Gezinsmissies", "home.missions_planete": "🌍 Planeetmissies",
  "home.voir_tout": "Alles bekijken →", "home.mon_ecosysteme": "🌱 Mijn ecosysteem",
  "home.eco_vide": "🌱 Je natuur wacht op zijn eerste planten…",
  "home.etres_vivants": "{n} levende wezens", "home.mes_badges": "🏆 Mijn badges",
  "dodo.title": "Als de ster bij de maan komt, is het bedtijd",
  "dodo.fait": "✅ Op tijd in bed!", "dodo.attente": "⏳ In afwachting",
  "dodo.bouton": "Ik ga op tijd slapen 🌙 +{pts}💛",
  "dodo.jour": "Nog tijd om te spelen", "dodo.soir": "Bedtijd komt eraan",
  "dodo.nuit": "Tijd om te slapen",
  "missions.aucune": "Vandaag geen missies gepland voor deze categorie.",
  "etat.attente": "⏳ In afwachting",
  "cat.famille.nom": "Gezin", "cat.planete.nom": "Planeet",
  "cat.famille.desc": "Hartjes verdiend door te helpen en voor anderen te zorgen. Laat er je avatar mee groeien!",
  "cat.planete.desc": "Druppels leven verdiend door de natuur te beschermen. Druppel voor druppel bouw je je ecosysteem op!",
  "money.coeurs": "Hartjes", "money.gouttes": "Druppels",
  "rep.titre": "🌈 Oeps, dat gebeurt… — herstellen in plaats van straffen",
  "rep.texte": "Hier gaan er <strong>nooit</strong> punten af. Na een incident (ruzie, iets kapot, een kwetsend woord) doet het kind een <strong>herstelgebaar</strong> — en net dat gebaar levert een kleine 💛-bonus op.",
  "rep.quand": "Gebruik dit meteen na het incident, met {prenom} naast je: vink het gebaar pas af als het echt gedaan is.",
  "rep.aide.titre": "❓ Hoe werkt het?",
  "rep.etape1": "<strong>Er is net iets gebeurd.</strong> Even ademhalen en rustig benoemen wat er gebeurd is — zonder roepen, zonder straf.",
  "rep.etape2": "<strong>Kies samen een gebaar</strong> uit de lijst hieronder (opruimen, excuses aanbieden, een lief gebaar, de persoon helpen), en het kind doet het echt.",
  "rep.etape3": "<strong>Is het gedaan, vink je het hier af</strong>: het kind verdient +1 of +2 💛. We belonen het herstel, nooit het incident.",
  "rep.aide.annuler": "Per ongeluk afgevinkt? Klik er binnen het uur opnieuw op om de bonus te annuleren. Na een uur wordt het gebaar weer beschikbaar voor een volgende keer.",
  "rep.aide.pourquoi": "Waarom geen straf? Punten afnemen leert vooral om de fout te verbergen. Herstellen leert het kind zijn daad te erkennen, voor de ander te zorgen en met een propere lei verder te gaan.",
  "eco.titre": "🌱 Mijn levende ecosysteem",
  "eco.intro": "Elk levend wezen is een <strong>kaart</strong> 🃏 met zijn behoeften. Maak eerst 🌱 planten, dan 🐰 planteneters die ze opeten, dan 🦊 vleeseters. Een 🐒 aap heeft 10 bomen en 1 bananenboom nodig!",
  "eco.vide_court": "Maak je eerste plant 🌱",
  "eco.aucun_prereq": "Geen vereisten ☀️", "eco.creer": "➕ Maken",
  "eco.plus_gouttes": "💧 Te weinig druppels", "eco.verrouille": "🔒 Vergrendeld"
});
Object.assign(I18N.de, {
  "home.salut": "Hallo {prenom}!", "home.ans": "{age} Jahre",
  "home.coeurs_label": "Herzen zum Ausgeben", "home.gouttes_label": "Tropfen Leben",
  "home.missions_famille": "🏡 Familien-Missionen", "home.missions_planete": "🌍 Planeten-Missionen",
  "home.voir_tout": "Alle ansehen →", "home.mon_ecosysteme": "🌱 Mein Ökosystem",
  "home.eco_vide": "🌱 Deine Natur wartet auf ihre ersten Pflanzen…",
  "home.etres_vivants": "{n} Lebewesen", "home.mes_badges": "🏆 Meine Abzeichen",
  "dodo.title": "Wenn der Stern den Mond erreicht, ist Schlafenszeit",
  "dodo.fait": "✅ Pünktlich im Bett!", "dodo.attente": "⏳ Ausstehend",
  "dodo.bouton": "Ich gehe pünktlich ins Bett 🌙 +{pts}💛",
  "dodo.jour": "Noch Zeit zum Spielen", "dodo.soir": "Die Schlafenszeit naht",
  "dodo.nuit": "Zeit zu schlafen",
  "missions.aucune": "Heute keine Missionen für diese Kategorie geplant.",
  "etat.attente": "⏳ Ausstehend",
  "cat.famille.nom": "Familie", "cat.planete.nom": "Planet",
  "cat.famille.desc": "Herzen, die du durch Helfen und Fürsorge verdienst. Damit entwickelst du deinen Avatar weiter!",
  "cat.planete.desc": "Tropfen Leben, die du durch den Schutz der Natur verdienst. Tropfen für Tropfen baust du dein Ökosystem auf!",
  "money.coeurs": "Herzen", "money.gouttes": "Tropfen",
  "rep.titre": "🌈 Hoppla, das passiert… — wiedergutmachen statt bestrafen",
  "rep.texte": "Hier werden <strong>nie</strong> Punkte abgezogen. Nach einem Vorfall (Streit, etwas kaputt, ein verletzendes Wort) macht das Kind eine <strong>Geste der Wiedergutmachung</strong> — und genau diese Geste bringt einen kleinen 💛-Bonus.",
  "rep.quand": "Direkt nach dem Vorfall nutzen, mit {prenom} an deiner Seite: Hake die Geste erst ab, wenn sie wirklich erfolgt ist.",
  "rep.aide.titre": "❓ Wie funktioniert das?",
  "rep.etape1": "<strong>Gerade ist etwas passiert.</strong> Kurz durchatmen und ruhig benennen, was geschehen ist — ohne Schreien, ohne Strafe.",
  "rep.etape2": "<strong>Wählt gemeinsam eine Geste</strong> aus der Liste unten (aufräumen, sich entschuldigen, eine liebe Geste, der Person helfen), und das Kind führt sie wirklich aus.",
  "rep.etape3": "<strong>Ist sie erledigt, hakst du sie hier ab</strong>: Das Kind erhält +1 oder +2 💛. Belohnt wird die Wiedergutmachung, nie der Vorfall.",
  "rep.aide.annuler": "Versehentlich abgehakt? Innerhalb einer Stunde erneut antippen, um den Bonus zu stornieren. Nach einer Stunde steht die Geste wieder für das nächste Mal bereit.",
  "rep.aide.pourquoi": "Warum keine Strafe? Punkte abzuziehen lehrt vor allem, den Fehler zu verbergen. Wiedergutmachen lehrt, zur eigenen Tat zu stehen, sich um den anderen zu kümmern und neu zu beginnen.",
  "eco.titre": "🌱 Mein lebendiges Ökosystem",
  "eco.intro": "Jedes Lebewesen ist eine <strong>Karte</strong> 🃏 mit seinen Bedürfnissen. Erschaffe zuerst 🌱 Pflanzen, dann 🐰 Pflanzenfresser, die sie fressen, dann 🦊 Fleischfresser. Ein 🐒 Affe braucht 10 Bäume und 1 Bananenbaum!",
  "eco.vide_court": "Erschaffe deine erste Pflanze 🌱",
  "eco.aucun_prereq": "Keine Voraussetzungen ☀️", "eco.creer": "➕ Erschaffen",
  "eco.plus_gouttes": "💧 Zu wenig Tropfen", "eco.verrouille": "🔒 Gesperrt"
});

/* ---- Phase E3 : espace parents ---- */
Object.assign(I18N.fr, {
  "par.verrou.titre": "⚙️ Espace parents",
  "par.verrou.desc": "Réservé aux parents : valider les actions, corriger les données, régler le programme.",
  "par.verrou.attente": "⏳ <strong>{n}</strong> action(s) en attente de validation.",
  "par.verrou.esprit": "💡 <strong>Esprit bienveillant</strong> : on valorise l'effort, jamais la performance. Les corrections servent à ajuster avec justesse, pas à punir.",
  "par.verrou.activer": "🔓 Activer le mode parents",
  "par.actif.titre": "⚙️ Mode parents", "par.actif.badge": "activé",
  "par.actif.quitter": "🔒 Quitter",
  "par.attente.titre": "⏳ Actions à valider ({n})",
  "par.prog.titre": "🛠️ Réglages du programme",
  "par.prog.validation": "Validation parentale requise (les actions des enfants attendent votre confirmation)",
  "par.prog.changer_pin": "🔑 Changer le code PIN parent",
  "par.prog.definir_pin": "🔑 Définir un code PIN parent",
  "par.prog.astuce_pin": "💡 Astuce : définissez un code PIN pour protéger l'accès au mode parents.",
  "mdj.titre": "🗓️ Missions proposées — {enf}",
  "mdj.note": "Coche les missions à proposer. Ton choix s'applique à partir de cette date et <strong>pour tous les jours suivants</strong> (jusqu'à une prochaine modification).",
 "mdj.budget": "⏱️ Conseillé pour cet âge : ~{n} tâches/jour (≈ {min} min d'app, pas plus). Tu peux en cocher plus ou moins.",
  "mdj.compte": "✅ {sel} tâche(s) sélectionnée(s) sur ~{n} conseillées.",
  "mdj.trop": "⚠️ {sel} tâches sélectionnées — c'est plus que les ~{n} conseillées pour cet âge (plus de temps d'écran).",
  "mdj.a_partir": "À partir du",
  "mdj.defaut": "↩️ Proposer la sélection par défaut (selon l'âge)",
  "mdj.ajouter_perso": "➕ Ajouter une mission personnalisée",
  "mdj.nom_ph": "Nom (ex. Ranger son vélo)", "mdj.emoji_ph": "Emoji",
  "mdj.ajouter": "Ajouter ✨", "mdj.suppr_perso": "Supprimer cette mission personnalisée",
  "mdj.modifier": "Modifier cette mission", "mdj.enregistrer": "OK", "mdj.retablir": "Rétablir",
  "mdj.confirm_suppr": "Supprimer la mission « {nom} » ?",
  "cor.titre": "✏️ Corrections — {enf}",
  "cor.note": "Changez d'enfant avec les pastilles en haut. Ajustez les soldes ou corrigez l'historique (rétroactif).",
  "cor.corriger_jour": "Corriger les missions du jour",
  "cor.badges": "🏆 Badges", "cor.aucun_badge": "Aucun badge pour le moment.",
  "cor.retirer": "Retirer", "cor.reautoriser": "↩️ Réautoriser {n} badge(s) retiré(s)",
  "cor.effacer": "🧹 Effacer tous les badges",
  "ecoref.titre": "🌍 Écosystème — prérequis des espèces",
  "ecoref.note": "Pour information : ce dont chaque plante ou animal a besoin pour être créé (coût en Gouttes 💧 et prérequis).",
  "ecoref.aucun": "aucun prérequis",
  "profil.prenom": "Prénom", "profil.naissance": "Date de naissance", "profil.sexe": "Sexe",
  "profil.fille": "👧 Fille", "profil.garcon": "👦 Garçon", "profil.emoji": "Emoji",
  "profil.couleur": "Couleur", "profil.coucher": "Heure du coucher 🌙", "profil.supprimer": "🗑️ Supprimer",
  "profil.stats": "{age} ans · Total cumulé : 💛 {c} · 💧 {g} · 🌍 {e} · 🏆 {b} badges",
  "profil.ajouter_enfant": "➕ Ajouter un enfant",
  "profil.confirm_suppr": "Supprimer définitivement {enf} et toutes ses données (cœurs, gouttes, avatar, écosystème, badges) ? Cette action est irréversible.",
  "demo.titre": "🧪 Mode démo", "demo.desc": "Tu explores une <strong>famille de démonstration</strong>. Rien n'est enregistré en ligne.",
  "demo.creer": "Créer un compte / se connecter",
  "fam.titre": "👪 Famille", "fam.label": "Famille : <strong>{nom}</strong>",
  "fam.note": "Invite l'autre parent : partage-lui ce lien, il rejoindra cette famille après connexion.",
  "fam.creer_invitation": "🔗 Créer un lien d'invitation", "fam.changer": "🔁 Changer / créer une famille", "fam.inv_titre": "🔗 Invitations",
  // L'Arbre des familles : code de parrainage permanent (+ QR)
  "common.fermer": "Fermer",
  // La carte d'ami (préfixe cami.*, distinct de carte.* réservé aux cartes surprises)
  // Le tableau d'honneur : un mur de mercis, jamais un podium
  "hon.titre": "💛 Merci à ces familles",
  "hon.annee": "Cette année", "hon.tout": "Depuis le début",
  "hon.pas_encore": "Le tableau apparaîtra dès que <strong>{n}</strong> familles auront accepté d'y figurer (elles sont {actuel} aujourd'hui).",
  "hon.vide": "Personne n'a encore semé ce mois-ci. La place est libre. 🌱",
  "hon.mien": "De votre côté : <strong>{n}</strong> famille(s) vivent l'aventure grâce à vous.",
  "hon.ma_place": "Votre équipe est <strong>{rang}ᵉ</strong> — merci ! 💛",
  "hon.inscrite": "Votre équipe figure au tableau",
  "hon.non_inscrite": "Votre équipe n'y figure pas",
  "hon.consentement": "Rien n'est publié sans votre accord. Seul le nom d'équipe que vous choisissez apparaît — jamais votre nom de famille, jamais le prénom d'un enfant. Vous pouvez vous retirer à tout moment.",
  "hon.pseudo_ph": "Votre nom d'équipe (ex. Les Ouistitis)",
  "hon.pseudo_requis": "Choisissez d'abord un nom d'équipe.",
  "hon.rejoindre": "💛 Figurer au tableau",
  "hon.retirer": "Me retirer du tableau",
  "hon.retirer_conf": "Votre équipe disparaîtra du tableau et votre nom d'équipe sera effacé. Continuer ?",
  "hon.retiree": "Vous n'y figurez plus.",
  "hon.inscrite_ok": "Votre équipe figure au tableau 💛",
  "cami.titre": "🖨️ La carte d'ami",
  "cami.bouton": "Imprimer la carte d'ami de {prenom}",
  "cami.mode_emploi": "À imprimer, à colorier, et à donner à un copain. C'est son papa ou sa maman qui scannera le code.",
  "cami.moi": "Moi, c'est {prenom} !",
  "cami.invite": "Viens jouer avec moi sur {app} 🌳",
  "cami.colorier": "✏️ À toi de colorier !",
  "cami.parents_titre": "Pour les parents",
  "cami.parents_texte": "Scannez ce code pour créer votre propre famille sur {app} : gratuit, sans publicité, et vos données restent chez vous.",
  "cami.imprimer": "Imprimer",
  // Entonnoir d'activation (onglet Croissance)
  // Le dépliant A5 des écoles (espace admin → Croissance)
  "dep.titre": "🏫 Le dépliant des écoles",
  "dep.pourquoi": "Une feuille A5 à glisser dans les cartables. Une institutrice convaincue parle à vingt-cinq familles d'un coup — c'est le meilleur rendement horaire du plan.",
  "dep.bouton": "Préparer le dépliant",
  "dep.mode_emploi": "Nommez l'école : son nom apparaîtra dans « l'origine des inscriptions », et vous saurez laquelle a réellement amené des familles. Le dépliant ne contient aucun code de famille.",
  "dep.src_ph": "Nom de l'école (ex. sainte-marie)",
  "dep.promesse": "Deux minutes par jour, en famille : valoriser les comportements positifs des enfants de <strong>2 à 7 ans</strong>, sans jamais retirer de points.",
  "dep.p1": "<b>L'enfant</b> coche ses missions du soir, gagne des cœurs et fait grandir son avatar et son écosystème.",
  "dep.p2": "<b>Les parents</b> choisissent les missions, et reçoivent chaque jour un compliment concret à dire à leur enfant.",
  "dep.p3": "<b>Un écart ?</b> Aucun point n'est jamais retiré : l'enfant fait un geste de réparation, et c'est ce geste qui est valorisé.",
  "dep.gratuit": "Gratuit, sans publicité, sans abonnement. Rien à télécharger : cela s'ouvre dans le navigateur.",
  "dep.rgpd": "Données hébergées en Europe. Aucun nom de famille, aucune photo, aucune adresse d'enfant n'est demandé — un surnom et le mois de naissance suffisent. Aucun traceur publicitaire. Export et suppression complète en deux clics, sans avoir à écrire à quiconque.",
  "ent.titre": "Entonnoir d'activation",
  "ent.inscrites": "Familles inscrites",
  "ent.avec_enfant": "Ont créé un enfant",
  "ent.un_usage": "Ont essayé au moins une fois",
  "ent.trois_usages": "Y sont revenues trois fois",
  "ent.dix_usages": "Dix usages ou plus",
  "ent.actives_30j": "Actives sur 30 jours",
  "ent.perte": "<strong>{n}</strong> famille(s) ont essayé puis renoncé avant le troisième usage. C'est la perte la plus coûteuse : le produit les intéressait déjà.",
  "ent.endormies": "{n} famille(s) sans activité depuis plus de 30 jours.",
  "arbre.j7_titre": "🌳 Une semaine ! L'habitude est prise.",
  "arbre.j7_texte": "Sept jours, c'est le moment où ça tient. Une question, une seule : qui, autour de vous, mériterait de vivre ça ? <strong>Un nom suffit</strong> — {app} se fait connaître uniquement par des parents qui en parlent à d'autres parents.",
  "arbre.j7_bouton": "Offrir à une famille",
  "arbre.p1": "la graine", "arbre.p2": "la pousse", "arbre.p3": "l'arbre", "arbre.p4": "le verger",
  "arbre.palier_atteint": "Vous avez atteint <strong>{nom}</strong>",
  "arbre.palier_aucun": "Votre arbre attend sa première feuille",
  "arbre.compte": "{n} famille(s) vivent l'aventure grâce à vous.",
  "arbre.compte_detail": "{arrivees} famille(s) sont arrivées grâce à vous, dont <strong>{vivantes}</strong> qui ont pris le pli (une famille compte après trois jours d'utilisation).",
  "arbre.manque": "Encore <strong>{n}</strong> famille(s) et votre arbre atteint {emoji} <strong>{nom}</strong>.",
  "arbre.tout_atteint": "Votre arbre est au complet. Merci. 💛",
  "arbre.ensemble": "Ensemble : <strong>{n}</strong> familles sur {jalon}",
  "arbre.ensemble_note": "Le prochain palier fêté par tout le monde, en même temps.",
  "arbre.enfant_zero": "Ton arbre attend sa première feuille 🌱",
  "arbre.enfant_une": "Une famille amie a rejoint ton arbre ! 🌿",
  "arbre.enfant_n": "{n} familles amies font pousser ton arbre ! 🌳",
  "arbre.titre": "🌳 L'Arbre des familles",
  "arbre.modale_titre": "🌳 Inviter une famille amie",
  "arbre.modale_note": "Ton lien est <strong>permanent</strong> : partage-le autant de fois que tu veux — dans le groupe de l'école, par message, ou en montrant le QR code.",
  "arbre.code_label": "Le code de ta famille",
  "arbre.qr_note": "À montrer ou à imprimer : un parent le scanne, et il arrive directement chez toi. 🌳",
  "arbre.partage": "Chaque famille qui arrive fait pousser une branche de plus. 💛",
  "arbre.attente": "Préparation de ton code…",
  "arbre.indispo": "Ton code n'est pas disponible pour le moment. Réessaie dans un instant.",
  "arbre.regenerer": "Changer mon code",
  "arbre.regenerer_conf": "Ton ancien lien ne fonctionnera plus. Continuer ?",
  "arbre.regenere": "Nouveau code créé ✅",
  "parr.titre": "🎁 Parrainer une famille amie",
  "parr.note": "Offre {app} à des amis : avec ton lien de parrainage, ils créeront <strong>leur propre famille</strong>. Plus on est nombreux, plus on répand les ondes positives ! 🤝",
  "parr.quota_check": "Vérification de ton quota…", "parr.creer": "🎁 Créer un lien d'invitation",
  "parr.creer_n": "🎁 Créer un lien d'invitation ({n} restant·s)", "parr.epuise": "⏳ Quota atteint — reviens la semaine prochaine",
  "parr.illimite": "🎁 Parrainages <strong>illimités</strong> : invite autant de familles que tu veux !",
  "parr.restant": "Il te reste <strong>{n}</strong> parrainage(s) cette semaine.",
  "parr.partage": "Partage ce lien : ton ami créera sa propre famille. 💛",
  "parr.sujet": "Je t'offre {app}",
  "parr.corps": "Coucou !\n\nJe te parraine sur {app}, une appli bienveillante qui aide toute la famille à instaurer une ambiance positive et à s'aligner sur les tâches de la maison et la protection de la planète. Je te laisse découvrir 😄\n\nOuvre ce lien pour créer ta propre famille :\n{lien}\n\nUn souci pour créer ton compte ou utiliser l'application ? Écris-moi en réponse à cet e-mail, ou contacte hello@fami.team.\n\nÀ très vite !",
  "abo.titre": "⭐ Abonnement", "abo.offre": "Offre actuelle : <strong>{plan}</strong>",
  "abo.note": "Les paiements arriveront bientôt. Pour l'instant, tout est gratuit. 💛",
  "abo.gerer": "Gérer l'abonnement (bientôt)",
  "compte.bloque": "Ce compte a été bloqué par l'administrateur. Contacte hello@fami.team.",
  "compte.titre": "👤 Compte", "compte.connecte": "Connecté en tant que <strong>{email}</strong>",
  "compte.deconnexion": "🚪 Se déconnecter",
  "donnees.titre": "Données (cette famille)", "donnees.exporter": "💾 Exporter la sauvegarde",
  "donnees.reset": "🗑️ Tout réinitialiser",
  "donnees.confirm_reset": "Tout effacer et recommencer à zéro ? (Cœurs, gouttes, avatars, écosystèmes)",
  "suppr.zone_titre": "⚠️ Supprimer le compte famille",
  "suppr.avert": "Cette action est DÉFINITIVE et IRRÉVERSIBLE. Tout sera perdu : enfants, missions, cœurs, gouttes, avatars, écosystèmes, cartes FamiTeam, badges, historique et invitations. Les autres parents de la famille perdront aussi l'accès. Cette suppression ne peut pas être annulée.",
  "suppr.bouton": "🗑️ Supprimer définitivement le compte famille",
  "suppr.confirm1": "Supprimer définitivement la famille « {nom} » ? Tout sera perdu, sans retour possible.",
  "suppr.confirm2": "Pour confirmer, retape le nom exact de la famille : {nom}",
  "suppr.nom_incorrect": "Nom incorrect : suppression annulée.",
  "suppr.ok": "Compte famille supprimé. À bientôt !",
  "suppr.erreur": "Échec de la suppression : {msg}",
  "sync.conflit": "🔄 Deux appareils jouaient en même temps : la version la plus récente a été gardée. Rien n'est perdu — l'autre reste dans l'espace parents → Récupération.",
  "recup.titre": "🛟 Récupération de données",
  "recup.note": "Si des enfants ont disparu, retrouve ici les <strong>sauvegardes locales</strong> de cet appareil et restaure la bonne dans la <strong>famille actuellement ouverte</strong> ({nom}).",
  "recup.aucune_locale": "Aucune sauvegarde locale trouvée sur cet appareil.",
  "recup.restaurer": "♻️ Restaurer", "recup.enfants": "{n} enfant(s) : {liste}",
  "recup.maj": "maj {date}", "recup.confirm_local": "Restaurer ces {n} enfant(s) ({liste}) dans la famille « {fam} » ? Cela remplacera son contenu actuel.",
  "recup.cloud_titre": "☁️ Sauvegardes automatiques (cloud)",
  "recup.cloud_btn": "🔄 Afficher l'historique des sauvegardes",
  "recup.cloud_rafraichir": "🔄 Rafraîchir l'historique",
  "recup.cloud_aucune": "Aucune sauvegarde automatique pour l'instant.",
  "recup.confirm_cloud": "Restaurer cette sauvegarde du {date} ({n} enfant(s)) dans la famille actuelle ?",
  "recup.import_titre": "📥 Importer un fichier de sauvegarde",
  "admin.titre": "🛡️ Administration", "admin.note": "Accès à toutes les familles. À utiliser avec précaution.",
  "admin.nav_stats": "📊 Stats", "admin.nav_familles": "👨‍👩‍👧 Familles", "admin.nav_retours": "💬 Retours", "admin.nav_contenu": "🃏 Contenu", "admin.nav_config": "⚙️ Config", "admin.nav_systeme": "🛠️ Système",
  "admin.bientot": "Bientôt disponible", "admin.stats_desc": "Statistiques d'utilisation : familles, nouveaux membres, activité et évolution générale.", "admin.retours_desc": "Bugs signalés et suggestions d'amélioration envoyés par les familles.", "admin.systeme_desc": "Stockage, base de données, sauvegarde complète et migration vers d'autres serveurs.",
  "stats.charger": "📊 Charger les statistiques", "stats.recharger": "🔄 Recharger", "stats.aucune_donnee": "Aucune donnée pour le moment.",
  "stats.familles": "Familles", "stats.familles_nouv": "+{s7} sur 7 j · +{s30} sur 30 j", "stats.enfants": "Enfants", "stats.membres": "Parents / membres",
  "stats.actives": "Familles actives (7 j)", "stats.actives_detail": "{j1} aujourd'hui · {j30} sur 30 j",
  "stats.premium": "Comptes Premium", "stats.free_detail": "{n} en gratuit", "stats.parrainages": "Parrainages acceptés", "stats.attente": "Liste d'attente",
  "stats.retours": "Retours reçus", "stats.retours_detail": "{bugs} bug(s) · {sugg} suggestion(s)",
  "stats.inscriptions": "Inscriptions par semaine", "stats.activite": "Familles actives par semaine", "stats.recentes": "Derniers arrivants", "stats.inscrite_le": "inscrite le {date}",
  "stats.usage_titre": "Activité web (ouvertures)", "stats.usage_jour": "Actives aujourd'hui", "stats.usage_7j": "Actives (7 j)", "stats.usage_30j": "Actives (30 j)", "stats.usage_ouvertures": "Ouvertures (30 j)", "stats.usage_note": "Mesure côté application : une ouverture comptée par famille et par jour (approximatif).",
  "sys.stockage": "Stockage (base de données)", "sys.charger": "💾 Charger le stockage", "sys.recharger": "🔄 Recharger", "sys.db_total": "Base de données : {taille} au total", "sys.lignes": "{n} ligne(s)", "sys.reseau": "Réseau & bande passante", "sys.reseau_note": "La bande passante (Vercel) et le trafic (Supabase) ne sont pas accessibles depuis l'application : consultez-les directement dans les tableaux de bord.", "sys.dashboard_supabase": "Tableau de bord Supabase", "sys.dashboard_vercel": "Tableau de bord Vercel",
  "stats.dons_titre": "Dons (mesure réelle)", "stats.dons_total": "Total collecté", "stats.dons_30j": "30 derniers jours", "stats.dons_recurrent": "Récurrent (30 j)", "stats.dons_uniques": "Donateurs uniques", "stats.dons_nb": "{n} don(s) au total", "stats.dons_aucun": "Aucun don enregistré pour le moment (webhook non configuré, ou aucun don reçu).", "stats.dons_recurrent_court": "abonnement", "stats.dons_ponctuel": "ponctuel",
  "sys.migration": "Sauvegarde & migration", "sys.migration_note": "Exportez toutes les données (filet de sécurité, en plus des sauvegardes Supabase), téléchargez le code, et suivez le guide pour migrer FamiTeam ailleurs.", "sys.export": "Sauvegarde complète (JSON)", "sys.export_ok": "Sauvegarde téléchargée ✅", "sys.export_ko": "Téléchargement impossible.", "sys.code": "Télécharger le code (ZIP)", "sys.guide": "Guide de migration",
  "retours.charger": "💬 Charger les retours", "retours.recharger": "🔄 Recharger", "retours.aucun": "Aucun retour pour le moment.", "retours.compte": "{n} retour(s)",
  "retours.f_tous": "Tous", "retours.f_non_lus": "Non lus", "retours.f_bugs": "🐞 Bugs", "retours.f_suggestions": "💡 Suggestions",
  "retours.st_nouveau": "Nouveau", "retours.st_lu": "Lu", "retours.st_traite": "Traité",
  "retours.marquer_lu": "Lu", "retours.marquer_traite": "Traité", "retours.repondre": "Répondre",
  "retours.mail_sujet": "Votre retour sur {app}", "retours.mail_corps": "Bonjour,\n\nMerci pour votre message :\n« {message} »\n\n",
  "admin.charger": "📋 Charger toutes les familles", "admin.recharger": "🔄 Recharger les familles",
  "admin.ea_oui": "⭐ Early adopter", "admin.ea_non": "☆ Early adopter", "admin.ea_aide": "Early adopter : jamais de proposition de don.", "admin.bloquer": "🚫 Bloquer", "admin.debloquer": "✅ Débloquer", "admin.confirm_bloquer": "Bloquer le compte {email} ? Il ne pourra plus se connecter.", "admin.supprimer": "Supprimer la famille", "admin.confirm_suppr_compte": "Supprimer définitivement la famille « {nom} » et toutes ses données ?", "admin.confirm_suppr_nom": "Pour confirmer, retape le nom exact : {nom}", "admin.nom_incorrect": "Nom incorrect, suppression annulée.", "admin.supprime_ok": "Famille « {nom} » supprimée.", "admin.maj_ok": "Mise à jour effectuée.", "admin.blg_titre": "Blagues du jour", "admin.blg_note": "Une liste par langue. Ajoute ou supprime des blagues : les changements s'appliquent à toute l'app.", "admin.blg_desactivees": "Désactivée sur l'accueil pour l'instant (corpus en révision) — tu peux quand même préparer la liste ci-dessous.", "admin.blg_total": "{n} blague(s)", "admin.blg_q": "Question / devinette", "admin.blg_r": "Réponse (avec emoji)", "admin.blg_ajouter": "Ajouter", "admin.blg_ajoutee": "Blague ajoutée 🃏", "admin.blg_confirm_suppr": "Supprimer cette blague ?", "admin.blg_vide": "Remplis la question et la réponse.",
  "admin.familles": "{n} famille(s).", "admin.ouvrir": "Ouvrir", "admin.ouverte": "Ouverte",
  "admin.ouverte_toast": "Famille ouverte : {nom}",
  "admin.attente_titre": "📝 Liste d'attente", "admin.attente_charger": "📋 Charger la liste d'attente",
  "admin.attente_recharger": "🔄 Recharger la liste d'attente", "admin.candidats": "{n} candidat(s).",
  "admin.approuver": "✅ Approuver", "admin.approuve": "✅ approuvé·e — envoie-lui le lien :",
  "admin.suppr_attente": "Supprimer de la liste d'attente",
  "admin.confirm_suppr_attente": "Supprimer {email} de la liste d'attente ?",
  "admin.lien_acces": "Lien d'accès pour ce candidat.",
  "admin.bienvenue_sujet": "Bienvenue sur {app} 🌟",
  "admin.bienvenue_corps": "Bonne nouvelle ! Ton accès à {app} est ouvert.\n\nCrée ta famille ici :\n{lien}\n\nÀ très vite ! 🤝",
  "admin.inscrit_le": "inscrit le {date}",
  "common.creation": "Création…", "common.chargement": "Chargement…",
  "toast.mission_ajoutee": "Mission ajoutée ✨", "toast.sauv_restauree": "Sauvegarde restaurée ✅",
  "lien.copier": "📋 Copier le lien", "lien.copie": "✅ Copié !",
  "lien.envoyer_mail": "✉️ Envoyer par e-mail", "lien.valable": "Ce lien est valable 14 jours.",
  "lien.email_dest_ph": "E-mail du destinataire",
  "lien.envoye": "✅ Invitation envoyée à {email} depuis hello@fami.team.",
  "lien.envoi_repli": "Envoi automatique indisponible — ouverture de ton application e-mail…",
  "lien.envoi_erreur": "❌ Échec de l'envoi : {msg}",
  "lien.repli_mailto": "✉️ Ouvrir mon application e-mail à la place",
  "cat.famille.monnaie": "Cœurs", "cat.planete.monnaie": "Gouttes",
  "toast.annule": "Annulé : −{points} {emoji}",
  "toast.en_attente": "Bravo ! 🎉 À faire valider par un parent ⏳",
  "toast.nom_requis": "Donne un nom à la mission.",
  "toast.repare": "Bravo d'avoir réparé ! +{bonus} 💛",
  "toast.pas_assez_coeurs": "Pas encore assez de Cœurs 💛 — continue tes belles actions !",
  "toast.debloque": "Débloqué : {nom} ! 🎉",
  "toast.manque_prereq": "Pour créer {emoji} {nom}, il manque : {liste}.",
  "toast.pas_assez_gouttes": "Pas encore assez de Gouttes 💧 — continue tes gestes pour la planète !",
  "toast.nouvel_etre": "{emoji} Un(e) {nom} rejoint ton écosystème ! 🌍",
  "toast.nouveau_badge": "Nouveau badge : {emoji} {nom} !",
  "toast.gain": "{emoji} +{points} {monnaie} — {phrase}"
});

Object.assign(I18N.en, {
  "par.verrou.titre": "⚙️ Parents area",
  "par.verrou.desc": "For parents only: approve actions, correct data, adjust the program settings.",
  "par.verrou.attente": "⏳ <strong>{n}</strong> action(s) waiting for approval.",
  "par.verrou.esprit": "💡 <strong>Kind spirit</strong>: we value effort, never performance. Corrections are there to adjust fairly, never to punish.",
  "par.verrou.activer": "🔓 Enable parents mode",
  "par.actif.titre": "⚙️ Parents mode", "par.actif.badge": "on",
  "par.actif.quitter": "🔒 Exit",
  "par.attente.titre": "⏳ Actions to approve ({n})",
  "par.prog.titre": "🛠️ Program settings",
  "par.prog.validation": "Parental approval required (children's actions wait for your confirmation)",
  "par.prog.changer_pin": "🔑 Change parent PIN code",
  "par.prog.definir_pin": "🔑 Set a parent PIN code",
  "par.prog.astuce_pin": "💡 Tip: set a PIN code to protect access to parents mode.",
  "mdj.titre": "🗓️ Suggested missions — {enf}",
  "mdj.note": "Tick the missions to suggest. Your choice applies from this date and <strong>for all following days</strong> (until your next change).",
 "mdj.budget": "⏱️ Recommended for this age: ~{n} tasks/day (≈ {min} min of app, no more). You can tick more or fewer.",
  "mdj.compte": "✅ {sel} task(s) selected out of ~{n} recommended.",
  "mdj.trop": "⚠️ {sel} tasks selected — more than the ~{n} recommended for this age (more screen time).",
  "mdj.a_partir": "Starting from",
  "mdj.defaut": "↩️ Suggest the default selection (by age)",
  "mdj.ajouter_perso": "➕ Add a custom mission",
  "mdj.nom_ph": "Name (e.g. Tidy up the bike)", "mdj.emoji_ph": "Emoji",
  "mdj.ajouter": "Add ✨", "mdj.suppr_perso": "Delete this custom mission",
  "mdj.modifier": "Edit this mission", "mdj.enregistrer": "OK", "mdj.retablir": "Reset",
  "mdj.confirm_suppr": "Delete the mission \"{nom}\"?",
  "cor.titre": "✏️ Corrections — {enf}",
  "cor.note": "Switch child with the tabs above. Adjust balances or correct the history (retroactively).",
  "cor.corriger_jour": "Correct today's missions",
  "cor.badges": "🏆 Badges", "cor.aucun_badge": "No badges yet.",
  "cor.retirer": "Remove", "cor.reautoriser": "↩️ Restore {n} removed badge(s)",
  "cor.effacer": "🧹 Clear all badges",
  "ecoref.titre": "🌍 Ecosystem — species requirements",
  "ecoref.note": "For information: what each plant or animal needs to be created (cost in Drops 💧 and requirements).",
  "ecoref.aucun": "no requirements",
  "profil.prenom": "First name", "profil.naissance": "Date of birth", "profil.sexe": "Gender",
  "profil.fille": "👧 Girl", "profil.garcon": "👦 Boy", "profil.emoji": "Emoji",
  "profil.couleur": "Color", "profil.coucher": "Bedtime 🌙", "profil.supprimer": "🗑️ Delete",
  "profil.stats": "{age} years old · Total earned: 💛 {c} · 💧 {g} · 🌍 {e} · 🏆 {b} badges",
  "profil.ajouter_enfant": "➕ Add a child",
  "profil.confirm_suppr": "Permanently delete {enf} and all their data (hearts, drops, avatar, ecosystem, badges)? This action cannot be undone.",
  "demo.titre": "🧪 Demo mode", "demo.desc": "You're exploring a <strong>demo family</strong>. Nothing is saved online.",
  "demo.creer": "Create an account / sign in",
  "fam.titre": "👪 Family", "fam.label": "Family: <strong>{nom}</strong>",
  "fam.note": "Invite the other parent: share this link with them, they'll join this family after signing in.",
  "fam.creer_invitation": "🔗 Create an invite link", "fam.changer": "🔁 Switch / create a family", "fam.inv_titre": "🔗 Invitations",
  // The Family Tree: permanent referral code (+ QR)
  "common.fermer": "Close",
  // The friend card (cami.* prefix, distinct from carte.* used by surprise cards)
  // The honour board: a wall of thanks, never a podium
  "hon.titre": "💛 Thanks to these families",
  "hon.annee": "This year", "hon.tout": "All time",
  "hon.pas_encore": "The board will appear once <strong>{n}</strong> families have agreed to be listed (there are {actuel} today).",
  "hon.vide": "Nobody has sown yet this month. The spot is open. 🌱",
  "hon.mien": "On your side: <strong>{n}</strong> family/families are living the adventure thanks to you.",
  "hon.ma_place": "Your team is <strong>#{rang}</strong> — thank you! 💛",
  "hon.inscrite": "Your team is listed on the board",
  "hon.non_inscrite": "Your team is not listed",
  "hon.consentement": "Nothing is published without your agreement. Only the team name you choose appears — never your family name, never a child's first name. You can withdraw at any time.",
  "hon.pseudo_ph": "Your team name (e.g. The Marmosets)",
  "hon.pseudo_requis": "Choose a team name first.",
  "hon.rejoindre": "💛 Join the board",
  "hon.retirer": "Remove me from the board",
  "hon.retirer_conf": "Your team will disappear from the board and your team name will be erased. Continue?",
  "hon.retiree": "You are no longer listed.",
  "hon.inscrite_ok": "Your team is on the board 💛",
  "cami.titre": "🖨️ The friend card",
  "cami.bouton": "Print {prenom}'s friend card",
  "cami.mode_emploi": "Print it, colour it in, and give it to a friend. Their mum or dad will scan the code.",
  "cami.moi": "I'm {prenom}!",
  "cami.invite": "Come and play with me on {app} 🌳",
  "cami.colorier": "✏️ Your turn to colour!",
  "cami.parents_titre": "For parents",
  "cami.parents_texte": "Scan this code to create your own family on {app}: free, no ads, and your data stays yours.",
  "cami.imprimer": "Print",
  // Activation funnel (Growth tab)
  // The A5 school leaflet (admin → Growth)
  "dep.titre": "🏫 The school leaflet",
  "dep.pourquoi": "An A5 sheet to slip into schoolbags. One convinced teacher speaks to twenty-five families at once — the best return per hour in the plan.",
  "dep.bouton": "Prepare the leaflet",
  "dep.mode_emploi": "Name the school: its name will appear under \"where sign-ups come from\", so you'll know which one actually brought families. The leaflet contains no family code.",
  "dep.src_ph": "School name (e.g. saint-marys)",
  "dep.promesse": "Two minutes a day, as a family: recognising positive behaviour in children aged <strong>2 to 7</strong>, without ever taking points away.",
  "dep.p1": "<b>The child</b> ticks off evening missions, earns hearts and grows an avatar and an ecosystem.",
  "dep.p2": "<b>Parents</b> choose the missions and get a concrete compliment to say to their child every day.",
  "dep.p3": "<b>A slip-up?</b> No point is ever taken away: the child makes a repair gesture, and that gesture is what gets recognised.",
  "dep.gratuit": "Free, no ads, no subscription. Nothing to download: it opens in the browser.",
  "dep.rgpd": "Data hosted in Europe. No surname, no photo, no child's address is requested — a nickname and birth month are enough. No advertising trackers. Full export and deletion in two clicks, without having to write to anyone.",
  "ent.titre": "Activation funnel",
  "ent.inscrites": "Families signed up",
  "ent.avec_enfant": "Created a child",
  "ent.un_usage": "Tried it at least once",
  "ent.trois_usages": "Came back three times",
  "ent.dix_usages": "Ten uses or more",
  "ent.actives_30j": "Active over 30 days",
  "ent.perte": "<strong>{n}</strong> family/families tried it then gave up before the third use. That's the costliest loss: the product already interested them.",
  "ent.endormies": "{n} family/families with no activity for over 30 days.",
  "arbre.j7_titre": "🌳 One week! The habit has taken hold.",
  "arbre.j7_texte": "Seven days is when it sticks. One question, just one: who around you deserves to experience this? <strong>One name is enough</strong> — {app} gets known only through parents telling other parents.",
  "arbre.j7_bouton": "Give it to one family",
  "arbre.p1": "the seed", "arbre.p2": "the sprout", "arbre.p3": "the tree", "arbre.p4": "the orchard",
  "arbre.palier_atteint": "You've reached <strong>{nom}</strong>",
  "arbre.palier_aucun": "Your tree is waiting for its first leaf",
  "arbre.compte": "{n} family/families are living the adventure thanks to you.",
  "arbre.compte_detail": "{arrivees} family/families arrived thanks to you, <strong>{vivantes}</strong> of which got into the swing of it (a family counts after three days of use).",
  "arbre.manque": "<strong>{n}</strong> more family/families and your tree reaches {emoji} <strong>{nom}</strong>.",
  "arbre.tout_atteint": "Your tree is complete. Thank you. 💛",
  "arbre.ensemble": "Together: <strong>{n}</strong> families out of {jalon}",
  "arbre.ensemble_note": "The next milestone celebrated by everyone, at the same time.",
  "arbre.enfant_zero": "Your tree is waiting for its first leaf 🌱",
  "arbre.enfant_une": "A friend family joined your tree! 🌿",
  "arbre.enfant_n": "{n} friend families are growing your tree! 🌳",
  "arbre.titre": "🌳 The Family Tree",
  "arbre.modale_titre": "🌳 Invite a friend family",
  "arbre.modale_note": "Your link is <strong>permanent</strong>: share it as often as you like — in the school group chat, by message, or by showing the QR code.",
  "arbre.code_label": "Your family code",
  "arbre.qr_note": "Show it or print it: a parent scans it and lands straight at your place. 🌳",
  "arbre.partage": "Every family that arrives grows one more branch. 💛",
  "arbre.attente": "Preparing your code…",
  "arbre.indispo": "Your code isn't available right now. Try again in a moment.",
  "arbre.regenerer": "Change my code",
  "arbre.regenerer_conf": "Your old link will stop working. Continue?",
  "arbre.regenere": "New code created ✅",
  "parr.titre": "🎁 Refer a friend family",
  "parr.note": "Give {app} to friends: with your referral link, they'll create <strong>their own family</strong>. The more of us, the more positive vibes we spread! 🤝",
  "parr.quota_check": "Checking your quota…", "parr.creer": "🎁 Create an invite link",
  "parr.creer_n": "🎁 Create an invite link ({n} left)", "parr.epuise": "⏳ Quota reached — come back next week",
  "parr.illimite": "🎁 <strong>Unlimited</strong> referrals: invite as many families as you like!",
  "parr.restant": "You have <strong>{n}</strong> referral(s) left this week.",
  "parr.partage": "Share this link: your friend will create their own family. 💛",
  "parr.sujet": "I'm giving you {app}",
  "parr.corps": "Hi there!\n\nI'm referring you to {app}, a kind app that helps the whole family build a positive vibe and align on chores and protecting the planet. I'll let you discover it 😄\n\nOpen this link to create your own family:\n{lien}\n\nAny trouble creating your account or using the app? Just reply to this email, or contact hello@fami.team.\n\nSee you soon!",
  "abo.titre": "⭐ Subscription", "abo.offre": "Current plan: <strong>{plan}</strong>",
  "abo.note": "Payments are coming soon. For now, everything is free. 💛",
  "abo.gerer": "Manage subscription (coming soon)",
  "compte.bloque": "This account has been blocked by the administrator. Contact hello@fami.team.",
  "compte.titre": "👤 Account", "compte.connecte": "Signed in as <strong>{email}</strong>",
  "compte.deconnexion": "🚪 Sign out",
  "donnees.titre": "Data (this family)", "donnees.exporter": "💾 Export backup",
  "donnees.reset": "🗑️ Reset everything",
  "donnees.confirm_reset": "Erase everything and start over? (Hearts, drops, avatars, ecosystems)",
  "suppr.zone_titre": "⚠️ Delete family account",
  "suppr.avert": "This action is PERMANENT and IRREVERSIBLE. Everything will be lost: children, missions, hearts, drops, avatars, ecosystems, FamiTeam cards, badges, history and invitations. The other parents in the family will also lose access. This cannot be undone.",
  "suppr.bouton": "🗑️ Permanently delete the family account",
  "suppr.confirm1": "Permanently delete the family \"{nom}\"? Everything will be lost, with no way back.",
  "suppr.confirm2": "To confirm, retype the exact family name: {nom}",
  "suppr.nom_incorrect": "Incorrect name: deletion cancelled.",
  "suppr.ok": "Family account deleted. See you soon!",
  "suppr.erreur": "Deletion failed: {msg}",
  "sync.conflit": "🔄 Two devices were playing at the same time: the most recent version was kept. Nothing is lost — the other one is under Parents → Recovery.",
  "recup.titre": "🛟 Data recovery",
  "recup.note": "If children have disappeared, find the <strong>local backups</strong> of this device here and restore the right one into the <strong>currently open family</strong> ({nom}).",
  "recup.aucune_locale": "No local backup found on this device.",
  "recup.restaurer": "♻️ Restore", "recup.enfants": "{n} child(ren): {liste}",
  "recup.maj": "updated {date}", "recup.confirm_local": "Restore these {n} child(ren) ({liste}) into the family \"{fam}\"? This will replace its current content.",
  "recup.cloud_titre": "☁️ Automatic backups (cloud)",
  "recup.cloud_btn": "🔄 Show backup history",
  "recup.cloud_rafraichir": "🔄 Refresh history",
  "recup.cloud_aucune": "No automatic backup yet.",
  "recup.confirm_cloud": "Restore this backup from {date} ({n} child(ren)) into the current family?",
  "recup.import_titre": "📥 Import a backup file",
  "admin.titre": "🛡️ Administration", "admin.note": "Access to all families. Use with caution.",
  "admin.nav_stats": "📊 Stats", "admin.nav_familles": "👨‍👩‍👧 Families", "admin.nav_retours": "💬 Feedback", "admin.nav_contenu": "🃏 Content", "admin.nav_config": "⚙️ Config", "admin.nav_systeme": "🛠️ System",
  "admin.bientot": "Coming soon", "admin.stats_desc": "Usage statistics: families, new members, activity and overall trends.", "admin.retours_desc": "Reported bugs and improvement suggestions sent by families.", "admin.systeme_desc": "Storage, database, full backup and migration to other servers.",
  "stats.charger": "📊 Load statistics", "stats.recharger": "🔄 Reload", "stats.aucune_donnee": "No data yet.",
  "stats.familles": "Families", "stats.familles_nouv": "+{s7} in 7 d · +{s30} in 30 d", "stats.enfants": "Children", "stats.membres": "Parents / members",
  "stats.actives": "Active families (7 d)", "stats.actives_detail": "{j1} today · {j30} in 30 d",
  "stats.premium": "Premium accounts", "stats.free_detail": "{n} on free", "stats.parrainages": "Referrals accepted", "stats.attente": "Waitlist",
  "stats.retours": "Feedback received", "stats.retours_detail": "{bugs} bug(s) · {sugg} suggestion(s)",
  "stats.inscriptions": "Sign-ups per week", "stats.activite": "Active families per week", "stats.recentes": "Newest families", "stats.inscrite_le": "joined on {date}",
  "stats.usage_titre": "Web activity (app opens)", "stats.usage_jour": "Active today", "stats.usage_7j": "Active (7 d)", "stats.usage_30j": "Active (30 d)", "stats.usage_ouvertures": "Opens (30 d)", "stats.usage_note": "Measured client-side: one open counted per family per day (approximate).",
  "sys.stockage": "Storage (database)", "sys.charger": "💾 Load storage", "sys.recharger": "🔄 Reload", "sys.db_total": "Database: {taille} total", "sys.lignes": "{n} row(s)", "sys.reseau": "Network & bandwidth", "sys.reseau_note": "Bandwidth (Vercel) and traffic (Supabase) are not available from the app: check them directly in the dashboards.", "sys.dashboard_supabase": "Supabase dashboard", "sys.dashboard_vercel": "Vercel dashboard",
  "stats.dons_titre": "Donations (real measurement)", "stats.dons_total": "Total collected", "stats.dons_30j": "Last 30 days", "stats.dons_recurrent": "Recurring (30 d)", "stats.dons_uniques": "Unique donors", "stats.dons_nb": "{n} donation(s) total", "stats.dons_aucun": "No donation recorded yet (webhook not configured, or none received).", "stats.dons_recurrent_court": "subscription", "stats.dons_ponctuel": "one-time",
  "sys.migration": "Backup & migration", "sys.migration_note": "Export all data (a safety net on top of Supabase backups), download the code, and follow the guide to migrate FamiTeam elsewhere.", "sys.export": "Full backup (JSON)", "sys.export_ok": "Backup downloaded ✅", "sys.export_ko": "Download failed.", "sys.code": "Download the code (ZIP)", "sys.guide": "Migration guide",
  "retours.charger": "💬 Load feedback", "retours.recharger": "🔄 Reload", "retours.aucun": "No feedback yet.", "retours.compte": "{n} item(s)",
  "retours.f_tous": "All", "retours.f_non_lus": "Unread", "retours.f_bugs": "🐞 Bugs", "retours.f_suggestions": "💡 Suggestions",
  "retours.st_nouveau": "New", "retours.st_lu": "Read", "retours.st_traite": "Handled",
  "retours.marquer_lu": "Read", "retours.marquer_traite": "Handled", "retours.repondre": "Reply",
  "retours.mail_sujet": "Your feedback on {app}", "retours.mail_corps": "Hello,\n\nThank you for your message:\n“{message}”\n\n",
  "admin.charger": "📋 Load all families", "admin.recharger": "🔄 Reload families",
  "admin.ea_oui": "⭐ Early adopter", "admin.ea_non": "☆ Early adopter", "admin.ea_aide": "Early adopter: never offered donations.", "admin.bloquer": "🚫 Block", "admin.debloquer": "✅ Unblock", "admin.confirm_bloquer": "Block account {email}? They will no longer be able to log in.", "admin.supprimer": "Delete family", "admin.confirm_suppr_compte": "Permanently delete the family \u00ab {nom} \u00bb and all its data?", "admin.confirm_suppr_nom": "To confirm, retype the exact name: {nom}", "admin.nom_incorrect": "Wrong name, deletion cancelled.", "admin.supprime_ok": "Family \u00ab {nom} \u00bb deleted.", "admin.maj_ok": "Update done.", "admin.blg_titre": "Jokes of the day", "admin.blg_note": "One list per language. Add or remove jokes: changes apply to the whole app.", "admin.blg_desactivees": "Currently off on the home screen (corpus under review) — you can still prepare the list below.", "admin.blg_total": "{n} joke(s)", "admin.blg_q": "Question / riddle", "admin.blg_r": "Answer (with emoji)", "admin.blg_ajouter": "Add", "admin.blg_ajoutee": "Joke added 🃏", "admin.blg_confirm_suppr": "Delete this joke?", "admin.blg_vide": "Fill in both question and answer.",
  "admin.familles": "{n} family(ies).", "admin.ouvrir": "Open", "admin.ouverte": "Open",
  "admin.ouverte_toast": "Family opened: {nom}",
  "admin.attente_titre": "📝 Waiting list", "admin.attente_charger": "📋 Load waiting list",
  "admin.attente_recharger": "🔄 Reload waiting list", "admin.candidats": "{n} candidate(s).",
  "admin.approuver": "✅ Approve", "admin.approuve": "✅ approved — send them the link:",
  "admin.suppr_attente": "Remove from waiting list",
  "admin.confirm_suppr_attente": "Remove {email} from the waiting list?",
  "admin.lien_acces": "Access link for this candidate.",
  "admin.bienvenue_sujet": "Welcome to {app} 🌟",
  "admin.bienvenue_corps": "Good news! Your access to {app} is open.\n\nCreate your family here:\n{lien}\n\nSee you soon! 🤝",
  "admin.inscrit_le": "joined on {date}",
  "common.creation": "Creating…", "common.chargement": "Loading…",
  "toast.mission_ajoutee": "Mission added ✨", "toast.sauv_restauree": "Backup restored ✅",
  "lien.copier": "📋 Copy link", "lien.copie": "✅ Copied!",
  "lien.envoyer_mail": "✉️ Send by email", "lien.valable": "This link is valid for 14 days.",
  "lien.email_dest_ph": "Recipient's email",
  "lien.envoye": "✅ Invitation sent to {email} from hello@fami.team.",
  "lien.envoi_repli": "Automatic sending unavailable — opening your email app…",
  "lien.envoi_erreur": "❌ Sending failed: {msg}",
  "lien.repli_mailto": "✉️ Open my email app instead",
  "cat.famille.monnaie": "Hearts", "cat.planete.monnaie": "Drops",
  "toast.annule": "Cancelled: −{points} {emoji}",
  "toast.en_attente": "Well done! 🎉 Waiting for a parent's approval ⏳",
  "toast.nom_requis": "Give the mission a name.",
  "toast.repare": "Well done for making it right! +{bonus} 💛",
  "toast.pas_assez_coeurs": "Not enough Hearts yet 💛 — keep up your good deeds!",
  "toast.debloque": "Unlocked: {nom}! 🎉",
  "toast.manque_prereq": "To create {emoji} {nom}, you still need: {liste}.",
  "toast.pas_assez_gouttes": "Not enough Drops yet 💧 — keep up your good deeds for the planet!",
  "toast.nouvel_etre": "{emoji} A {nom} joins your ecosystem! 🌍",
  "toast.nouveau_badge": "New badge: {emoji} {nom}!",
  "toast.gain": "{emoji} +{points} {monnaie} — {phrase}"
});

Object.assign(I18N.nl, {
  "par.verrou.titre": "⚙️ Ouderruimte",
  "par.verrou.desc": "Alleen voor ouders: acties goedkeuren, gegevens corrigeren, het programma instellen.",
  "par.verrou.attente": "⏳ <strong>{n}</strong> actie(s) wachten op goedkeuring.",
  "par.verrou.esprit": "💡 <strong>Met een vriendelijke geest</strong>: we waarderen inzet, nooit prestatie. Correcties zijn er om eerlijk bij te stellen, niet om te straffen.",
  "par.verrou.activer": "🔓 Oudermodus inschakelen",
  "par.actif.titre": "⚙️ Oudermodus", "par.actif.badge": "actief",
  "par.actif.quitter": "🔒 Verlaten",
  "par.attente.titre": "⏳ Goed te keuren acties ({n})",
  "par.prog.titre": "🛠️ Programma-instellingen",
  "par.prog.validation": "Goedkeuring door ouders vereist (acties van kinderen wachten op jouw bevestiging)",
  "par.prog.changer_pin": "🔑 Ouder-pincode wijzigen",
  "par.prog.definir_pin": "🔑 Ouder-pincode instellen",
  "par.prog.astuce_pin": "💡 Tip: stel een pincode in om de toegang tot de oudermodus te beveiligen.",
  "mdj.titre": "🗓️ Voorgestelde missies — {enf}",
  "mdj.note": "Vink de voor te stellen missies aan. Je keuze geldt vanaf deze datum en <strong>voor alle volgende dagen</strong> (tot je volgende wijziging).",
 "mdj.budget": "⏱️ Aanbevolen voor deze leeftijd: ~{n} taken/dag (≈ {min} min app, niet meer). Je mag er meer of minder aanvinken.",
  "mdj.compte": "✅ {sel} taak/taken geselecteerd van ~{n} aanbevolen.",
  "mdj.trop": "⚠️ {sel} taken geselecteerd — meer dan de ~{n} aanbevolen voor deze leeftijd (meer schermtijd).",
  "mdj.a_partir": "Vanaf",
  "mdj.defaut": "↩️ Standaardselectie voorstellen (op leeftijd)",
  "mdj.ajouter_perso": "➕ Eigen missie toevoegen",
  "mdj.nom_ph": "Naam (bv. Fiets opruimen)", "mdj.emoji_ph": "Emoji",
  "mdj.ajouter": "Toevoegen ✨", "mdj.suppr_perso": "Deze eigen missie verwijderen",
  "mdj.modifier": "Deze missie bewerken", "mdj.enregistrer": "OK", "mdj.retablir": "Herstellen",
  "mdj.confirm_suppr": "De missie \"{nom}\" verwijderen?",
  "cor.titre": "✏️ Correcties — {enf}",
  "cor.note": "Wissel van kind met de tabbladen boven. Pas saldo's aan of corrigeer de geschiedenis (terugwerkend).",
  "cor.corriger_jour": "Missies van vandaag corrigeren",
  "cor.badges": "🏆 Badges", "cor.aucun_badge": "Nog geen badges.",
  "cor.retirer": "Verwijderen", "cor.reautoriser": "↩️ {n} verwijderde badge(s) herstellen",
  "cor.effacer": "🧹 Alle badges wissen",
  "ecoref.titre": "🌍 Ecosysteem — vereisten per soort",
  "ecoref.note": "Ter info: wat elke plant of dier nodig heeft om gemaakt te worden (kosten in Druppels 💧 en vereisten).",
  "ecoref.aucun": "geen vereisten",
  "profil.prenom": "Voornaam", "profil.naissance": "Geboortedatum", "profil.sexe": "Geslacht",
  "profil.fille": "👧 Meisje", "profil.garcon": "👦 Jongen", "profil.emoji": "Emoji",
  "profil.couleur": "Kleur", "profil.coucher": "Bedtijd 🌙", "profil.supprimer": "🗑️ Verwijderen",
  "profil.stats": "{age} jaar · Totaal verdiend: 💛 {c} · 💧 {g} · 🌍 {e} · 🏆 {b} badges",
  "profil.ajouter_enfant": "➕ Kind toevoegen",
  "profil.confirm_suppr": "{enf} en al zijn/haar gegevens definitief verwijderen (hartjes, druppels, avatar, ecosysteem, badges)? Dit kan niet ongedaan worden gemaakt.",
  "demo.titre": "🧪 Demomodus", "demo.desc": "Je verkent een <strong>demofamilie</strong>. Niets wordt online opgeslagen.",
  "demo.creer": "Account aanmaken / inloggen",
  "fam.titre": "👪 Familie", "fam.label": "Familie: <strong>{nom}</strong>",
  "fam.note": "Nodig de andere ouder uit: deel deze link, die persoon sluit zich na het inloggen aan bij deze familie.",
  "fam.creer_invitation": "🔗 Uitnodigingslink maken", "fam.changer": "🔁 Familie wisselen / aanmaken", "fam.inv_titre": "🔗 Uitnodigingen",
  // De Familieboom: permanente verwijzingscode (+ QR)
  "common.fermer": "Sluiten",
  // De vriendjeskaart (cami.*-prefix, los van carte.* voor verrassingskaarten)
  // Het eerbord: een muur van dankjes, nooit een podium
  "hon.titre": "💛 Dank aan deze families",
  "hon.annee": "Dit jaar", "hon.tout": "Sinds het begin",
  "hon.pas_encore": "Het bord verschijnt zodra <strong>{n}</strong> families ermee instemmen erop te staan (vandaag zijn er {actuel}).",
  "hon.vide": "Deze maand heeft nog niemand gezaaid. De plek is vrij. 🌱",
  "hon.mien": "Bij jou: <strong>{n}</strong> familie(s) beleven het avontuur dankzij jou.",
  "hon.ma_place": "Jouw team staat op plaats <strong>{rang}</strong> — bedankt! 💛",
  "hon.inscrite": "Jouw team staat op het bord",
  "hon.non_inscrite": "Jouw team staat er niet op",
  "hon.consentement": "Er wordt niets gepubliceerd zonder jouw akkoord. Alleen de teamnaam die je kiest verschijnt — nooit je familienaam, nooit de voornaam van een kind. Je kan je op elk moment terugtrekken.",
  "hon.pseudo_ph": "Jouw teamnaam (bv. De Aapjes)",
  "hon.pseudo_requis": "Kies eerst een teamnaam.",
  "hon.rejoindre": "💛 Op het bord komen",
  "hon.retirer": "Mij van het bord halen",
  "hon.retirer_conf": "Jouw team verdwijnt van het bord en je teamnaam wordt gewist. Doorgaan?",
  "hon.retiree": "Je staat er niet meer op.",
  "hon.inscrite_ok": "Jouw team staat op het bord 💛",
  "cami.titre": "🖨️ De vriendjeskaart",
  "cami.bouton": "Vriendjeskaart van {prenom} afdrukken",
  "cami.mode_emploi": "Afdrukken, inkleuren en aan een vriendje geven. Zijn of haar mama of papa scant de code.",
  "cami.moi": "Ik ben {prenom}!",
  "cami.invite": "Kom met mij spelen op {app} 🌳",
  "cami.colorier": "✏️ Nu mag jij kleuren!",
  "cami.parents_titre": "Voor de ouders",
  "cami.parents_texte": "Scan deze code om je eigen familie op {app} aan te maken: gratis, zonder reclame, en je gegevens blijven bij jou.",
  "cami.imprimer": "Afdrukken",
  // Activatietrechter (tabblad Groei)
  // De A5-schoolflyer (admin → Groei)
  "dep.titre": "🏫 De schoolflyer",
  "dep.pourquoi": "Een A5-blad voor de boekentas. Eén overtuigde kleuterleidster spreekt vijfentwintig families in één keer — het beste rendement per uur van het plan.",
  "dep.bouton": "Flyer voorbereiden",
  "dep.mode_emploi": "Geef de school een naam: die verschijnt bij « herkomst van de inschrijvingen », zodat je weet welke school echt families heeft aangebracht. De flyer bevat geen enkele familiecode.",
  "dep.src_ph": "Naam van de school (bv. sint-maria)",
  "dep.promesse": "Twee minuten per dag, als gezin: positief gedrag van kinderen van <strong>2 tot 7 jaar</strong> waarderen, zonder ooit punten af te nemen.",
  "dep.p1": "<b>Het kind</b> vinkt zijn avondmissies af, verdient hartjes en laat zijn avatar en ecosysteem groeien.",
  "dep.p2": "<b>De ouders</b> kiezen de missies en krijgen elke dag een concreet compliment om aan hun kind te zeggen.",
  "dep.p3": "<b>Een misstap?</b> Er wordt nooit een punt afgenomen: het kind doet een herstelgebaar, en dát gebaar wordt gewaardeerd.",
  "dep.gratuit": "Gratis, zonder reclame, zonder abonnement. Niets te downloaden: het opent in de browser.",
  "dep.rgpd": "Gegevens gehost in Europa. Geen familienaam, geen foto, geen adres van een kind wordt gevraagd — een bijnaam en de geboortemaand volstaan. Geen reclametrackers. Volledige export en verwijdering in twee klikken, zonder iemand te moeten schrijven.",
  "ent.titre": "Activatietrechter",
  "ent.inscrites": "Ingeschreven families",
  "ent.avec_enfant": "Hebben een kind aangemaakt",
  "ent.un_usage": "Hebben het minstens één keer geprobeerd",
  "ent.trois_usages": "Zijn drie keer teruggekomen",
  "ent.dix_usages": "Tien keer of meer",
  "ent.actives_30j": "Actief over 30 dagen",
  "ent.perte": "<strong>{n}</strong> familie(s) hebben het geprobeerd en zijn vóór het derde gebruik afgehaakt. Dat is het duurste verlies: het product interesseerde hen al.",
  "ent.endormies": "{n} familie(s) zonder activiteit sinds meer dan 30 dagen.",
  "arbre.j7_titre": "🌳 Een week! De gewoonte zit erin.",
  "arbre.j7_texte": "Na zeven dagen blijft het hangen. Eén vraag, slechts één: wie in je omgeving verdient het om dit mee te maken? <strong>Één naam is genoeg</strong> — {app} raakt enkel bekend doordat ouders het aan andere ouders vertellen.",
  "arbre.j7_bouton": "Aan één familie geven",
  "arbre.p1": "het zaadje", "arbre.p2": "de scheut", "arbre.p3": "de boom", "arbre.p4": "de boomgaard",
  "arbre.palier_atteint": "Je hebt <strong>{nom}</strong> bereikt",
  "arbre.palier_aucun": "Je boom wacht op zijn eerste blad",
  "arbre.compte": "{n} familie(s) beleven het avontuur dankzij jou.",
  "arbre.compte_detail": "{arrivees} familie(s) zijn dankzij jou gekomen, waarvan <strong>{vivantes}</strong> het echt hebben opgepikt (een familie telt na drie dagen gebruik).",
  "arbre.manque": "Nog <strong>{n}</strong> familie(s) en je boom bereikt {emoji} <strong>{nom}</strong>.",
  "arbre.tout_atteint": "Je boom is volgroeid. Bedankt. 💛",
  "arbre.ensemble": "Samen: <strong>{n}</strong> families van {jalon}",
  "arbre.ensemble_note": "De volgende mijlpaal wordt door iedereen samen gevierd.",
  "arbre.enfant_zero": "Je boom wacht op zijn eerste blad 🌱",
  "arbre.enfant_une": "Een vriendenfamilie is bij je boom gekomen! 🌿",
  "arbre.enfant_n": "{n} vriendenfamilies laten je boom groeien! 🌳",
  "arbre.titre": "🌳 De Familieboom",
  "arbre.modale_titre": "🌳 Een vriendenfamilie uitnodigen",
  "arbre.modale_note": "Je link is <strong>permanent</strong>: deel hem zo vaak als je wil — in de schoolgroep, per bericht, of door de QR-code te tonen.",
  "arbre.code_label": "De code van je familie",
  "arbre.qr_note": "Tonen of afdrukken: een ouder scant hem en komt rechtstreeks bij jou terecht. 🌳",
  "arbre.partage": "Elke familie die erbij komt, laat een tak extra groeien. 💛",
  "arbre.attente": "Je code wordt klaargemaakt…",
  "arbre.indispo": "Je code is momenteel niet beschikbaar. Probeer het straks opnieuw.",
  "arbre.regenerer": "Mijn code wijzigen",
  "arbre.regenerer_conf": "Je oude link zal niet meer werken. Doorgaan?",
  "arbre.regenere": "Nieuwe code aangemaakt ✅",
  "parr.titre": "🎁 Een vriendenfamilie aanbrengen",
  "parr.note": "Geef {app} cadeau aan vrienden: met jouw verwijzingslink maken ze <strong>hun eigen familie</strong> aan. Hoe meer we zijn, hoe meer positieve energie we verspreiden! 🤝",
  "parr.quota_check": "Je quotum wordt gecontroleerd…", "parr.creer": "🎁 Uitnodigingslink maken",
  "parr.creer_n": "🎁 Uitnodigingslink maken ({n} over)", "parr.epuise": "⏳ Quotum bereikt — kom volgende week terug",
  "parr.illimite": "🎁 <strong>Onbeperkt</strong> uitnodigen: nodig zoveel gezinnen uit als je wilt!",
  "parr.restant": "Je hebt nog <strong>{n}</strong> verwijzing(en) deze week.",
  "parr.partage": "Deel deze link: je vriend maakt zijn eigen familie aan. 💛",
  "parr.sujet": "Ik geef je {app} cadeau",
  "parr.corps": "Hoi!\n\nIk breng je aan bij {app}, een vriendelijke app die het hele gezin helpt om een positieve sfeer te creëren en samen te werken aan huishoudelijke taken en de bescherming van de planeet. Ik laat je het ontdekken 😄\n\nOpen deze link om je eigen familie aan te maken:\n{lien}\n\nProblemen om je account aan te maken of de app te gebruiken? Antwoord gewoon op deze e-mail, of contacteer hello@fami.team.\n\nTot snel!",
  "abo.titre": "⭐ Abonnement", "abo.offre": "Huidig abonnement: <strong>{plan}</strong>",
  "abo.note": "Betalingen komen er binnenkort. Voorlopig is alles gratis. 💛",
  "abo.gerer": "Abonnement beheren (binnenkort)",
  "compte.bloque": "Dit account is geblokkeerd door de beheerder. Contacteer hello@fami.team.",
  "compte.titre": "👤 Account", "compte.connecte": "Ingelogd als <strong>{email}</strong>",
  "compte.deconnexion": "🚪 Uitloggen",
  "donnees.titre": "Gegevens (deze familie)", "donnees.exporter": "💾 Backup exporteren",
  "donnees.reset": "🗑️ Alles resetten",
  "donnees.confirm_reset": "Alles wissen en opnieuw beginnen? (Hartjes, druppels, avatars, ecosystemen)",
  "suppr.zone_titre": "⚠️ Gezinsaccount verwijderen",
  "suppr.avert": "Deze actie is DEFINITIEF en ONOMKEERBAAR. Alles gaat verloren: kinderen, missies, hartjes, druppels, avatars, ecosystemen, FamiTeam-kaarten, badges, geschiedenis en uitnodigingen. De andere ouders verliezen ook de toegang. Dit kan niet ongedaan worden gemaakt.",
  "suppr.bouton": "🗑️ Gezinsaccount definitief verwijderen",
  "suppr.confirm1": "Het gezin \"{nom}\" definitief verwijderen? Alles gaat verloren, zonder weg terug.",
  "suppr.confirm2": "Typ ter bevestiging de exacte gezinsnaam opnieuw: {nom}",
  "suppr.nom_incorrect": "Onjuiste naam: verwijdering geannuleerd.",
  "suppr.ok": "Gezinsaccount verwijderd. Tot ziens!",
  "suppr.erreur": "Verwijderen mislukt: {msg}",
  "sync.conflit": "🔄 Twee toestellen speelden tegelijk: de meest recente versie is bewaard. Er gaat niets verloren — de andere staat bij Ouders → Herstel.",
  "recup.titre": "🛟 Gegevens herstellen",
  "recup.note": "Als kinderen verdwenen zijn, vind je hier de <strong>lokale backups</strong> van dit toestel en kan je de juiste herstellen in de <strong>nu geopende familie</strong> ({nom}).",
  "recup.aucune_locale": "Geen lokale backup gevonden op dit toestel.",
  "recup.restaurer": "♻️ Herstellen", "recup.enfants": "{n} kind(eren): {liste}",
  "recup.maj": "bijgewerkt {date}", "recup.confirm_local": "Deze {n} kind(eren) ({liste}) herstellen in de familie \"{fam}\"? Dit vervangt de huidige inhoud.",
  "recup.cloud_titre": "☁️ Automatische backups (cloud)",
  "recup.cloud_btn": "🔄 Backupgeschiedenis tonen",
  "recup.cloud_rafraichir": "🔄 Geschiedenis vernieuwen",
  "recup.cloud_aucune": "Nog geen automatische backup.",
  "recup.confirm_cloud": "Deze backup van {date} ({n} kind(eren)) herstellen in de huidige familie?",
  "recup.import_titre": "📥 Een backupbestand importeren",
  "admin.titre": "🛡️ Beheer", "admin.note": "Toegang tot alle families. Gebruik met zorg.",
  "admin.nav_stats": "📊 Stats", "admin.nav_familles": "👨‍👩‍👧 Families", "admin.nav_retours": "💬 Feedback", "admin.nav_contenu": "🃏 Inhoud", "admin.nav_config": "⚙️ Config", "admin.nav_systeme": "🛠️ Systeem",
  "admin.bientot": "Binnenkort beschikbaar", "admin.stats_desc": "Gebruiksstatistieken: families, nieuwe leden, activiteit en algemene evolutie.", "admin.retours_desc": "Gemelde bugs en verbetervoorstellen verstuurd door de families.", "admin.systeme_desc": "Opslag, database, volledige back-up en migratie naar andere servers.",
  "stats.charger": "📊 Statistieken laden", "stats.recharger": "🔄 Herladen", "stats.aucune_donnee": "Nog geen gegevens.",
  "stats.familles": "Families", "stats.familles_nouv": "+{s7} in 7 d · +{s30} in 30 d", "stats.enfants": "Kinderen", "stats.membres": "Ouders / leden",
  "stats.actives": "Actieve families (7 d)", "stats.actives_detail": "{j1} vandaag · {j30} in 30 d",
  "stats.premium": "Premium-accounts", "stats.free_detail": "{n} gratis", "stats.parrainages": "Aanvaarde peterschappen", "stats.attente": "Wachtlijst",
  "stats.retours": "Ontvangen feedback", "stats.retours_detail": "{bugs} bug(s) · {sugg} suggestie(s)",
  "stats.inscriptions": "Inschrijvingen per week", "stats.activite": "Actieve families per week", "stats.recentes": "Nieuwste families", "stats.inscrite_le": "ingeschreven op {date}",
  "stats.usage_titre": "Webactiviteit (openingen)", "stats.usage_jour": "Actief vandaag", "stats.usage_7j": "Actief (7 d)", "stats.usage_30j": "Actief (30 d)", "stats.usage_ouvertures": "Openingen (30 d)", "stats.usage_note": "Gemeten aan clientzijde: één opening per familie per dag (bij benadering).",
  "sys.stockage": "Opslag (database)", "sys.charger": "💾 Opslag laden", "sys.recharger": "🔄 Herladen", "sys.db_total": "Database: {taille} in totaal", "sys.lignes": "{n} rij(en)", "sys.reseau": "Netwerk & bandbreedte", "sys.reseau_note": "Bandbreedte (Vercel) en verkeer (Supabase) zijn niet beschikbaar vanuit de app: raadpleeg ze rechtstreeks in de dashboards.", "sys.dashboard_supabase": "Supabase-dashboard", "sys.dashboard_vercel": "Vercel-dashboard",
  "stats.dons_titre": "Giften (echte meting)", "stats.dons_total": "Totaal opgehaald", "stats.dons_30j": "Laatste 30 dagen", "stats.dons_recurrent": "Terugkerend (30 d)", "stats.dons_uniques": "Unieke gevers", "stats.dons_nb": "{n} gift(en) in totaal", "stats.dons_aucun": "Nog geen gift geregistreerd (webhook niet geconfigureerd, of nog geen ontvangen).", "stats.dons_recurrent_court": "abonnement", "stats.dons_ponctuel": "eenmalig",
  "sys.migration": "Back-up & migratie", "sys.migration_note": "Exporteer alle gegevens (vangnet naast de Supabase-back-ups), download de code en volg de gids om FamiTeam elders te migreren.", "sys.export": "Volledige back-up (JSON)", "sys.export_ok": "Back-up gedownload ✅", "sys.export_ko": "Downloaden mislukt.", "sys.code": "Code downloaden (ZIP)", "sys.guide": "Migratiegids",
  "retours.charger": "💬 Feedback laden", "retours.recharger": "🔄 Herladen", "retours.aucun": "Nog geen feedback.", "retours.compte": "{n} bericht(en)",
  "retours.f_tous": "Alle", "retours.f_non_lus": "Ongelezen", "retours.f_bugs": "🐞 Bugs", "retours.f_suggestions": "💡 Suggesties",
  "retours.st_nouveau": "Nieuw", "retours.st_lu": "Gelezen", "retours.st_traite": "Behandeld",
  "retours.marquer_lu": "Gelezen", "retours.marquer_traite": "Behandeld", "retours.repondre": "Antwoorden",
  "retours.mail_sujet": "Uw feedback over {app}", "retours.mail_corps": "Hallo,\n\nBedankt voor uw bericht:\n« {message} »\n\n",
  "admin.charger": "📋 Alle families laden", "admin.recharger": "🔄 Families herladen",
  "admin.ea_oui": "⭐ Early adopter", "admin.ea_non": "☆ Early adopter", "admin.ea_aide": "Early adopter: nooit donaties voorgesteld.", "admin.bloquer": "🚫 Blokkeren", "admin.debloquer": "✅ Deblokkeren", "admin.confirm_bloquer": "Account {email} blokkeren? Kan niet meer inloggen.", "admin.supprimer": "Gezin verwijderen", "admin.confirm_suppr_compte": "Het gezin \u00ab {nom} \u00bb en alle gegevens definitief verwijderen?", "admin.confirm_suppr_nom": "Typ ter bevestiging de exacte naam: {nom}", "admin.nom_incorrect": "Verkeerde naam, verwijdering geannuleerd.", "admin.supprime_ok": "Gezin \u00ab {nom} \u00bb verwijderd.", "admin.maj_ok": "Bijgewerkt.", "admin.blg_titre": "Moppen van de dag", "admin.blg_note": "Eén lijst per taal. Moppen toevoegen of verwijderen: wijzigingen gelden voor de hele app.", "admin.blg_desactivees": "Momenteel uitgeschakeld op het startscherm (corpus wordt herzien) — je kunt de lijst hieronder alvast voorbereiden.", "admin.blg_total": "{n} mop(pen)", "admin.blg_q": "Vraag / raadsel", "admin.blg_r": "Antwoord (met emoji)", "admin.blg_ajouter": "Toevoegen", "admin.blg_ajoutee": "Mop toegevoegd 🃏", "admin.blg_confirm_suppr": "Deze mop verwijderen?", "admin.blg_vide": "Vul vraag én antwoord in.",
  "admin.familles": "{n} familie(s).", "admin.ouvrir": "Openen", "admin.ouverte": "Geopend",
  "admin.ouverte_toast": "Familie geopend: {nom}",
  "admin.attente_titre": "📝 Wachtlijst", "admin.attente_charger": "📋 Wachtlijst laden",
  "admin.attente_recharger": "🔄 Wachtlijst herladen", "admin.candidats": "{n} kandida(a)t(en).",
  "admin.approuver": "✅ Goedkeuren", "admin.approuve": "✅ goedgekeurd — stuur deze link:",
  "admin.suppr_attente": "Van de wachtlijst verwijderen",
  "admin.confirm_suppr_attente": "{email} van de wachtlijst verwijderen?",
  "admin.lien_acces": "Toegangslink voor deze kandidaat.",
  "admin.bienvenue_sujet": "Welkom bij {app} 🌟",
  "admin.bienvenue_corps": "Goed nieuws! Je toegang tot {app} is geopend.\n\nMaak hier je familie aan:\n{lien}\n\nTot snel! 🤝",
  "admin.inscrit_le": "ingeschreven op {date}",
  "common.creation": "Aanmaken…", "common.chargement": "Laden…",
  "toast.mission_ajoutee": "Missie toegevoegd ✨", "toast.sauv_restauree": "Backup herstelden ✅",
  "lien.copier": "📋 Link kopiëren", "lien.copie": "✅ Gekopieerd!",
  "lien.envoyer_mail": "✉️ Per e-mail versturen", "lien.valable": "Deze link is 14 dagen geldig.",
  "lien.email_dest_ph": "E-mail van ontvanger",
  "lien.envoye": "✅ Uitnodiging verzonden naar {email} vanaf hello@fami.team.",
  "lien.envoi_repli": "Automatisch verzenden niet beschikbaar — je e-mailapp wordt geopend…",
  "lien.envoi_erreur": "❌ Verzenden mislukt: {msg}",
  "lien.repli_mailto": "✉️ Mijn e-mailapp openen in plaats daarvan",
  "cat.famille.monnaie": "Hartjes", "cat.planete.monnaie": "Druppels",
  "toast.annule": "Geannuleerd: −{points} {emoji}",
  "toast.en_attente": "Bravo! 🎉 Wacht op goedkeuring door een ouder ⏳",
  "toast.nom_requis": "Geef de missie een naam.",
  "toast.repare": "Goed gedaan om het goed te maken! +{bonus} 💛",
  "toast.pas_assez_coeurs": "Nog niet genoeg hartjes 💛 — ga door met je mooie acties!",
  "toast.debloque": "Ontgrendeld: {nom}! 🎉",
  "toast.manque_prereq": "Om {emoji} {nom} te maken, ontbreekt nog: {liste}.",
  "toast.pas_assez_gouttes": "Nog niet genoeg druppels 💧 — ga door met je acties voor de planeet!",
  "toast.nouvel_etre": "{emoji} Een {nom} sluit zich aan bij je ecosysteem! 🌍",
  "toast.nouveau_badge": "Nieuwe badge: {emoji} {nom}!",
  "toast.gain": "{emoji} +{points} {monnaie} — {phrase}"
});

Object.assign(I18N.de, {
  "par.verrou.titre": "⚙️ Elternbereich",
  "par.verrou.desc": "Nur für Eltern: Aktionen genehmigen, Daten korrigieren, das Programm einstellen.",
  "par.verrou.attente": "⏳ <strong>{n}</strong> Aktion(en) warten auf Genehmigung.",
  "par.verrou.esprit": "💡 <strong>Mit Wohlwollen</strong>: wir schätzen die Anstrengung, nie die Leistung. Korrekturen dienen dazu, fair anzupassen, nicht zu bestrafen.",
  "par.verrou.activer": "🔓 Elternmodus aktivieren",
  "par.actif.titre": "⚙️ Elternmodus", "par.actif.badge": "aktiv",
  "par.actif.quitter": "🔒 Verlassen",
  "par.attente.titre": "⏳ Zu genehmigende Aktionen ({n})",
  "par.prog.titre": "🛠️ Programmeinstellungen",
  "par.prog.validation": "Elterliche Genehmigung erforderlich (Aktionen der Kinder warten auf deine Bestätigung)",
  "par.prog.changer_pin": "🔑 Eltern-PIN ändern",
  "par.prog.definir_pin": "🔑 Eltern-PIN festlegen",
  "par.prog.astuce_pin": "💡 Tipp: Lege eine PIN fest, um den Zugang zum Elternmodus zu schützen.",
  "mdj.titre": "🗓️ Vorgeschlagene Missionen — {enf}",
  "mdj.note": "Wähle die vorzuschlagenden Missionen aus. Deine Auswahl gilt ab diesem Datum und <strong>für alle folgenden Tage</strong> (bis zur nächsten Änderung).",
 "mdj.budget": "⏱️ Empfohlen für dieses Alter: ~{n} Aufgaben/Tag (≈ {min} Min App, nicht mehr). Du kannst mehr oder weniger ankreuzen.",
  "mdj.compte": "✅ {sel} Aufgabe(n) ausgewählt von ~{n} empfohlenen.",
  "mdj.trop": "⚠️ {sel} Aufgaben ausgewählt — mehr als die ~{n} für dieses Alter empfohlenen (mehr Bildschirmzeit).",
  "mdj.a_partir": "Ab dem",
  "mdj.defaut": "↩️ Standardauswahl vorschlagen (nach Alter)",
  "mdj.ajouter_perso": "➕ Eigene Mission hinzufügen",
  "mdj.nom_ph": "Name (z. B. Fahrrad aufräumen)", "mdj.emoji_ph": "Emoji",
  "mdj.ajouter": "Hinzufügen ✨", "mdj.suppr_perso": "Diese eigene Mission löschen",
  "mdj.modifier": "Diese Mission bearbeiten", "mdj.enregistrer": "OK", "mdj.retablir": "Zurücksetzen",
  "mdj.confirm_suppr": "Die Mission „{nom}“ löschen?",
  "cor.titre": "✏️ Korrekturen — {enf}",
  "cor.note": "Wechsle das Kind mit den Reitern oben. Passe Guthaben an oder korrigiere den Verlauf (rückwirkend).",
  "cor.corriger_jour": "Heutige Missionen korrigieren",
  "cor.badges": "🏆 Abzeichen", "cor.aucun_badge": "Noch keine Abzeichen.",
  "cor.retirer": "Entfernen", "cor.reautoriser": "↩️ {n} entfernte(s) Abzeichen wiederherstellen",
  "cor.effacer": "🧹 Alle Abzeichen löschen",
  "ecoref.titre": "🌍 Ökosystem — Anforderungen der Arten",
  "ecoref.note": "Zur Information: was jede Pflanze oder jedes Tier benötigt, um erschaffen zu werden (Kosten in Tropfen 💧 und Voraussetzungen).",
  "ecoref.aucun": "keine Voraussetzungen",
  "profil.prenom": "Vorname", "profil.naissance": "Geburtsdatum", "profil.sexe": "Geschlecht",
  "profil.fille": "👧 Mädchen", "profil.garcon": "👦 Junge", "profil.emoji": "Emoji",
  "profil.couleur": "Farbe", "profil.coucher": "Schlafenszeit 🌙", "profil.supprimer": "🗑️ Löschen",
  "profil.stats": "{age} Jahre · Gesamt erhalten: 💛 {c} · 💧 {g} · 🌍 {e} · 🏆 {b} Abzeichen",
  "profil.ajouter_enfant": "➕ Kind hinzufügen",
  "profil.confirm_suppr": "{enf} und alle seine/ihre Daten endgültig löschen (Herzen, Tropfen, Avatar, Ökosystem, Abzeichen)? Dies kann nicht rückgängig gemacht werden.",
  "demo.titre": "🧪 Demomodus", "demo.desc": "Du erkundest eine <strong>Demofamilie</strong>. Es wird nichts online gespeichert.",
  "demo.creer": "Konto erstellen / anmelden",
  "fam.titre": "👪 Familie", "fam.label": "Familie: <strong>{nom}</strong>",
  "fam.note": "Lade den anderen Elternteil ein: teile diesen Link, er/sie tritt nach der Anmeldung dieser Familie bei.",
  "fam.creer_invitation": "🔗 Einladungslink erstellen", "fam.changer": "🔁 Familie wechseln / erstellen", "fam.inv_titre": "🔗 Einladungen",
  // Der Familienbaum: dauerhafter Empfehlungscode (+ QR)
  "common.fermer": "Schließen",
  // Die Freundeskarte (Präfix cami.*, getrennt von carte.* für Überraschungskarten)
  // Die Ehrentafel: eine Wand voller Dankeschön, niemals ein Podium
  "hon.titre": "💛 Danke an diese Familien",
  "hon.annee": "Dieses Jahr", "hon.tout": "Seit dem Anfang",
  "hon.pas_encore": "Die Tafel erscheint, sobald <strong>{n}</strong> Familien zugestimmt haben, darauf zu stehen (heute sind es {actuel}).",
  "hon.vide": "Diesen Monat hat noch niemand gesät. Der Platz ist frei. 🌱",
  "hon.mien": "Bei dir: <strong>{n}</strong> Familie(n) erleben das Abenteuer dank dir.",
  "hon.ma_place": "Dein Team ist auf Platz <strong>{rang}</strong> — danke! 💛",
  "hon.inscrite": "Dein Team steht auf der Tafel",
  "hon.non_inscrite": "Dein Team steht nicht darauf",
  "hon.consentement": "Ohne deine Zustimmung wird nichts veröffentlicht. Nur der von dir gewählte Teamname erscheint — niemals dein Familienname, niemals der Vorname eines Kindes. Du kannst dich jederzeit zurückziehen.",
  "hon.pseudo_ph": "Dein Teamname (z. B. Die Äffchen)",
  "hon.pseudo_requis": "Wähle zuerst einen Teamnamen.",
  "hon.rejoindre": "💛 Auf die Tafel",
  "hon.retirer": "Mich von der Tafel nehmen",
  "hon.retirer_conf": "Dein Team verschwindet von der Tafel und dein Teamname wird gelöscht. Fortfahren?",
  "hon.retiree": "Du stehst nicht mehr darauf.",
  "hon.inscrite_ok": "Dein Team steht auf der Tafel 💛",
  "cami.titre": "🖨️ Die Freundeskarte",
  "cami.bouton": "Freundeskarte von {prenom} drucken",
  "cami.mode_emploi": "Ausdrucken, ausmalen und einem Freund geben. Seine Mama oder sein Papa scannt den Code.",
  "cami.moi": "Ich bin {prenom}!",
  "cami.invite": "Komm mit mir auf {app} spielen 🌳",
  "cami.colorier": "✏️ Jetzt darfst du ausmalen!",
  "cami.parents_titre": "Für die Eltern",
  "cami.parents_texte": "Scanne diesen Code, um deine eigene Familie auf {app} zu erstellen: kostenlos, ohne Werbung, und deine Daten bleiben bei dir.",
  "cami.imprimer": "Drucken",
  // Aktivierungstrichter (Reiter Wachstum)
  // Der A5-Schulflyer (Admin → Wachstum)
  "dep.titre": "🏫 Der Schulflyer",
  "dep.pourquoi": "Ein A5-Blatt für die Schultasche. Eine überzeugte Erzieherin spricht mit fünfundzwanzig Familien auf einmal — der beste Stundenertrag des Plans.",
  "dep.bouton": "Flyer vorbereiten",
  "dep.mode_emploi": "Benenne die Schule: ihr Name erscheint unter « Herkunft der Anmeldungen », damit du weißt, welche wirklich Familien gebracht hat. Der Flyer enthält keinen Familiencode.",
  "dep.src_ph": "Name der Schule (z. B. sankt-maria)",
  "dep.promesse": "Zwei Minuten am Tag, als Familie: positives Verhalten von Kindern von <strong>2 bis 7 Jahren</strong> wertschätzen, ohne jemals Punkte abzuziehen.",
  "dep.p1": "<b>Das Kind</b> hakt seine Abendmissionen ab, verdient Herzen und lässt Avatar und Ökosystem wachsen.",
  "dep.p2": "<b>Die Eltern</b> wählen die Missionen und bekommen jeden Tag ein konkretes Kompliment, das sie ihrem Kind sagen können.",
  "dep.p3": "<b>Ein Ausrutscher?</b> Es wird nie ein Punkt abgezogen: das Kind macht eine Wiedergutmachung, und diese Geste wird gewürdigt.",
  "dep.gratuit": "Kostenlos, ohne Werbung, ohne Abo. Nichts herunterzuladen: es öffnet sich im Browser.",
  "dep.rgpd": "Daten in Europa gehostet. Kein Familienname, kein Foto, keine Adresse eines Kindes wird verlangt — ein Spitzname und der Geburtsmonat genügen. Keine Werbetracker. Vollständiger Export und Löschung in zwei Klicks, ohne jemandem schreiben zu müssen.",
  "ent.titre": "Aktivierungstrichter",
  "ent.inscrites": "Angemeldete Familien",
  "ent.avec_enfant": "Haben ein Kind angelegt",
  "ent.un_usage": "Haben es mindestens einmal versucht",
  "ent.trois_usages": "Sind dreimal zurückgekommen",
  "ent.dix_usages": "Zehn Nutzungen oder mehr",
  "ent.actives_30j": "Aktiv über 30 Tage",
  "ent.perte": "<strong>{n}</strong> Familie(n) haben es versucht und vor der dritten Nutzung aufgegeben. Das ist der teuerste Verlust: das Produkt hat sie schon interessiert.",
  "ent.endormies": "{n} Familie(n) ohne Aktivität seit mehr als 30 Tagen.",
  "arbre.j7_titre": "🌳 Eine Woche! Die Gewohnheit sitzt.",
  "arbre.j7_texte": "Nach sieben Tagen bleibt es hängen. Eine Frage, nur eine: wer in deinem Umfeld hätte es verdient, das zu erleben? <strong>Ein Name genügt</strong> — {app} wird nur bekannt, weil Eltern es anderen Eltern erzählen.",
  "arbre.j7_bouton": "Einer Familie schenken",
  "arbre.p1": "das Samenkorn", "arbre.p2": "der Sprössling", "arbre.p3": "der Baum", "arbre.p4": "der Obstgarten",
  "arbre.palier_atteint": "Du hast <strong>{nom}</strong> erreicht",
  "arbre.palier_aucun": "Dein Baum wartet auf sein erstes Blatt",
  "arbre.compte": "{n} Familie(n) erleben das Abenteuer dank dir.",
  "arbre.compte_detail": "{arrivees} Familie(n) sind dank dir dazugekommen, davon <strong>{vivantes}</strong> mit echtem Schwung (eine Familie zählt nach drei Tagen Nutzung).",
  "arbre.manque": "Noch <strong>{n}</strong> Familie(n) und dein Baum erreicht {emoji} <strong>{nom}</strong>.",
  "arbre.tout_atteint": "Dein Baum ist vollständig. Danke. 💛",
  "arbre.ensemble": "Gemeinsam: <strong>{n}</strong> Familien von {jalon}",
  "arbre.ensemble_note": "Der nächste Meilenstein wird von allen gemeinsam gefeiert.",
  "arbre.enfant_zero": "Dein Baum wartet auf sein erstes Blatt 🌱",
  "arbre.enfant_une": "Eine Freundesfamilie ist zu deinem Baum gekommen! 🌿",
  "arbre.enfant_n": "{n} Freundesfamilien lassen deinen Baum wachsen! 🌳",
  "arbre.titre": "🌳 Der Familienbaum",
  "arbre.modale_titre": "🌳 Eine Freundesfamilie einladen",
  "arbre.modale_note": "Dein Link ist <strong>dauerhaft</strong>: teile ihn so oft du willst — in der Schulgruppe, per Nachricht oder indem du den QR-Code zeigst.",
  "arbre.code_label": "Der Code deiner Familie",
  "arbre.qr_note": "Zeigen oder ausdrucken: ein Elternteil scannt ihn und landet direkt bei dir. 🌳",
  "arbre.partage": "Jede Familie, die dazukommt, lässt einen Zweig mehr wachsen. 💛",
  "arbre.attente": "Dein Code wird vorbereitet…",
  "arbre.indispo": "Dein Code ist gerade nicht verfügbar. Versuche es in einem Moment erneut.",
  "arbre.regenerer": "Meinen Code ändern",
  "arbre.regenerer_conf": "Dein alter Link wird nicht mehr funktionieren. Fortfahren?",
  "arbre.regenere": "Neuer Code erstellt ✅",
  "parr.titre": "🎁 Eine Freundesfamilie einladen",
  "parr.note": "Schenke {app} Freunden: mit deinem Empfehlungslink erstellen sie <strong>ihre eigene Familie</strong>. Je mehr wir sind, desto mehr positive Energie verbreiten wir! 🤝",
  "parr.quota_check": "Dein Kontingent wird geprüft…", "parr.creer": "🎁 Einladungslink erstellen",
  "parr.creer_n": "🎁 Einladungslink erstellen ({n} übrig)", "parr.epuise": "⏳ Kontingent erreicht — komm nächste Woche wieder",
  "parr.illimite": "🎁 <strong>Unbegrenzte</strong> Einladungen: lade so viele Familien ein, wie du willst!",
  "parr.restant": "Du hast diese Woche noch <strong>{n}</strong> Empfehlung(en) übrig.",
  "parr.partage": "Teile diesen Link: dein Freund erstellt seine eigene Familie. 💛",
  "parr.sujet": "Ich schenke dir {app}",
  "parr.corps": "Hallo!\n\nIch lade dich zu {app} ein, einer freundlichen App, die der ganzen Familie hilft, eine positive Stimmung zu schaffen und sich bei Hausarbeiten und dem Schutz des Planeten abzustimmen. Schau es dir einfach an 😄\n\nÖffne diesen Link, um deine eigene Familie zu erstellen:\n{lien}\n\nProbleme beim Erstellen deines Kontos oder bei der Nutzung der App? Antworte einfach auf diese E-Mail oder kontaktiere hello@fami.team.\n\nBis bald!",
  "abo.titre": "⭐ Abonnement", "abo.offre": "Aktueller Plan: <strong>{plan}</strong>",
  "abo.note": "Zahlungen kommen bald. Vorerst ist alles kostenlos. 💛",
  "abo.gerer": "Abonnement verwalten (demnächst)",
  "compte.bloque": "Dieses Konto wurde vom Administrator gesperrt. Kontaktiere hello@fami.team.",
  "compte.titre": "👤 Konto", "compte.connecte": "Angemeldet als <strong>{email}</strong>",
  "compte.deconnexion": "🚪 Abmelden",
  "donnees.titre": "Daten (diese Familie)", "donnees.exporter": "💾 Sicherung exportieren",
  "donnees.reset": "🗑️ Alles zurücksetzen",
  "donnees.confirm_reset": "Alles löschen und neu beginnen? (Herzen, Tropfen, Avatare, Ökosysteme)",
  "suppr.zone_titre": "⚠️ Familienkonto löschen",
  "suppr.avert": "Diese Aktion ist ENDGÜLTIG und UNWIDERRUFLICH. Alles geht verloren: Kinder, Missionen, Herzen, Tropfen, Avatare, Ökosysteme, FamiTeam-Karten, Abzeichen, Verlauf und Einladungen. Die anderen Eltern verlieren ebenfalls den Zugriff. Dies kann nicht rückgängig gemacht werden.",
  "suppr.bouton": "🗑️ Familienkonto endgültig löschen",
  "suppr.confirm1": "Die Familie \"{nom}\" endgültig löschen? Alles geht verloren, ohne Weg zurück.",
  "suppr.confirm2": "Gib zur Bestätigung den genauen Familiennamen erneut ein: {nom}",
  "suppr.nom_incorrect": "Falscher Name: Löschung abgebrochen.",
  "suppr.ok": "Familienkonto gelöscht. Bis bald!",
  "suppr.erreur": "Löschung fehlgeschlagen: {msg}",
  "sync.conflit": "🔄 Zwei Geräte spielten gleichzeitig: die neueste Version wurde behalten. Nichts geht verloren — die andere liegt unter Eltern → Wiederherstellung.",
  "recup.titre": "🛟 Datenwiederherstellung",
  "recup.note": "Falls Kinder verschwunden sind, findest du hier die <strong>lokalen Sicherungen</strong> dieses Geräts und kannst die richtige in der <strong>aktuell geöffneten Familie</strong> ({nom}) wiederherstellen.",
  "recup.aucune_locale": "Keine lokale Sicherung auf diesem Gerät gefunden.",
  "recup.restaurer": "♻️ Wiederherstellen", "recup.enfants": "{n} Kind(er): {liste}",
  "recup.maj": "aktualisiert am {date}", "recup.confirm_local": "Diese {n} Kind(er) ({liste}) in der Familie „{fam}“ wiederherstellen? Dies ersetzt den aktuellen Inhalt.",
  "recup.cloud_titre": "☁️ Automatische Sicherungen (Cloud)",
  "recup.cloud_btn": "🔄 Sicherungsverlauf anzeigen",
  "recup.cloud_rafraichir": "🔄 Verlauf aktualisieren",
  "recup.cloud_aucune": "Noch keine automatische Sicherung.",
  "recup.confirm_cloud": "Diese Sicherung vom {date} ({n} Kind(er)) in der aktuellen Familie wiederherstellen?",
  "recup.import_titre": "📥 Eine Sicherungsdatei importieren",
  "admin.titre": "🛡️ Verwaltung", "admin.note": "Zugriff auf alle Familien. Mit Vorsicht verwenden.",
  "admin.nav_stats": "📊 Statistik", "admin.nav_familles": "👨‍👩‍👧 Familien", "admin.nav_retours": "💬 Feedback", "admin.nav_contenu": "🃏 Inhalt", "admin.nav_config": "⚙️ Konfig", "admin.nav_systeme": "🛠️ System",
  "admin.bientot": "Bald verfügbar", "admin.stats_desc": "Nutzungsstatistiken: Familien, neue Mitglieder, Aktivität und allgemeine Entwicklung.", "admin.retours_desc": "Gemeldete Fehler und Verbesserungsvorschläge der Familien.", "admin.systeme_desc": "Speicher, Datenbank, vollständige Sicherung und Migration auf andere Server.",
  "stats.charger": "📊 Statistiken laden", "stats.recharger": "🔄 Neu laden", "stats.aucune_donnee": "Noch keine Daten.",
  "stats.familles": "Familien", "stats.familles_nouv": "+{s7} in 7 T · +{s30} in 30 T", "stats.enfants": "Kinder", "stats.membres": "Eltern / Mitglieder",
  "stats.actives": "Aktive Familien (7 T)", "stats.actives_detail": "{j1} heute · {j30} in 30 T",
  "stats.premium": "Premium-Konten", "stats.free_detail": "{n} kostenlos", "stats.parrainages": "Akzeptierte Empfehlungen", "stats.attente": "Warteliste",
  "stats.retours": "Erhaltenes Feedback", "stats.retours_detail": "{bugs} Fehler · {sugg} Vorschlag/Vorschläge",
  "stats.inscriptions": "Anmeldungen pro Woche", "stats.activite": "Aktive Familien pro Woche", "stats.recentes": "Neueste Familien", "stats.inscrite_le": "angemeldet am {date}",
  "stats.usage_titre": "Web-Aktivität (App-Öffnungen)", "stats.usage_jour": "Heute aktiv", "stats.usage_7j": "Aktiv (7 T)", "stats.usage_30j": "Aktiv (30 T)", "stats.usage_ouvertures": "Öffnungen (30 T)", "stats.usage_note": "Clientseitig gemessen: eine Öffnung pro Familie und Tag (ungefähr).",
  "sys.stockage": "Speicher (Datenbank)", "sys.charger": "💾 Speicher laden", "sys.recharger": "🔄 Neu laden", "sys.db_total": "Datenbank: {taille} insgesamt", "sys.lignes": "{n} Zeile(n)", "sys.reseau": "Netzwerk & Bandbreite", "sys.reseau_note": "Bandbreite (Vercel) und Traffic (Supabase) sind aus der App nicht verfügbar: bitte direkt in den Dashboards prüfen.", "sys.dashboard_supabase": "Supabase-Dashboard", "sys.dashboard_vercel": "Vercel-Dashboard",
  "stats.dons_titre": "Spenden (reale Messung)", "stats.dons_total": "Insgesamt gesammelt", "stats.dons_30j": "Letzte 30 Tage", "stats.dons_recurrent": "Wiederkehrend (30 T)", "stats.dons_uniques": "Einzelne Spender", "stats.dons_nb": "{n} Spende(n) insgesamt", "stats.dons_aucun": "Noch keine Spende erfasst (Webhook nicht konfiguriert, oder noch keine erhalten).", "stats.dons_recurrent_court": "Abo", "stats.dons_ponctuel": "einmalig",
  "sys.migration": "Sicherung & Migration", "sys.migration_note": "Exportieren Sie alle Daten (Sicherheitsnetz zusätzlich zu den Supabase-Backups), laden Sie den Code herunter und folgen Sie der Anleitung, um FamiTeam anderswohin zu migrieren.", "sys.export": "Vollständige Sicherung (JSON)", "sys.export_ok": "Sicherung heruntergeladen ✅", "sys.export_ko": "Download fehlgeschlagen.", "sys.code": "Code herunterladen (ZIP)", "sys.guide": "Migrationsanleitung",
  "retours.charger": "💬 Feedback laden", "retours.recharger": "🔄 Neu laden", "retours.aucun": "Noch kein Feedback.", "retours.compte": "{n} Meldung(en)",
  "retours.f_tous": "Alle", "retours.f_non_lus": "Ungelesen", "retours.f_bugs": "🐞 Fehler", "retours.f_suggestions": "💡 Vorschläge",
  "retours.st_nouveau": "Neu", "retours.st_lu": "Gelesen", "retours.st_traite": "Erledigt",
  "retours.marquer_lu": "Gelesen", "retours.marquer_traite": "Erledigt", "retours.repondre": "Antworten",
  "retours.mail_sujet": "Ihr Feedback zu {app}", "retours.mail_corps": "Hallo,\n\nvielen Dank für Ihre Nachricht:\n„{message}“\n\n",
  "admin.charger": "📋 Alle Familien laden", "admin.recharger": "🔄 Familien neu laden",
  "admin.ea_oui": "⭐ Early Adopter", "admin.ea_non": "☆ Early Adopter", "admin.ea_aide": "Early Adopter: nie Spenden vorschlagen.", "admin.bloquer": "🚫 Sperren", "admin.debloquer": "✅ Entsperren", "admin.confirm_bloquer": "Konto {email} sperren? Keine Anmeldung mehr möglich.", "admin.supprimer": "Familie löschen", "admin.confirm_suppr_compte": "Familie \u00ab {nom} \u00bb und alle Daten endgültig löschen?", "admin.confirm_suppr_nom": "Tippe zur Bestätigung den exakten Namen: {nom}", "admin.nom_incorrect": "Falscher Name, Löschung abgebrochen.", "admin.supprime_ok": "Familie \u00ab {nom} \u00bb gelöscht.", "admin.maj_ok": "Aktualisiert.", "admin.blg_titre": "Witze des Tages", "admin.blg_note": "Eine Liste pro Sprache. Witze hinzufügen oder löschen: Änderungen gelten für die ganze App.", "admin.blg_desactivees": "Derzeit auf der Startseite deaktiviert (Korpus wird überarbeitet) — du kannst die Liste unten trotzdem vorbereiten.", "admin.blg_total": "{n} Witz(e)", "admin.blg_q": "Frage / Rätsel", "admin.blg_r": "Antwort (mit Emoji)", "admin.blg_ajouter": "Hinzufügen", "admin.blg_ajoutee": "Witz hinzugefügt 🃏", "admin.blg_confirm_suppr": "Diesen Witz löschen?", "admin.blg_vide": "Bitte Frage und Antwort ausfüllen.",
  "admin.familles": "{n} Familie(n).", "admin.ouvrir": "Öffnen", "admin.ouverte": "Geöffnet",
  "admin.ouverte_toast": "Familie geöffnet: {nom}",
  "admin.attente_titre": "📝 Warteliste", "admin.attente_charger": "📋 Warteliste laden",
  "admin.attente_recharger": "🔄 Warteliste neu laden", "admin.candidats": "{n} Kandidat(en).",
  "admin.approuver": "✅ Genehmigen", "admin.approuve": "✅ genehmigt — sende diesen Link:",
  "admin.suppr_attente": "Von der Warteliste entfernen",
  "admin.confirm_suppr_attente": "{email} von der Warteliste entfernen?",
  "admin.lien_acces": "Zugangslink für diesen Kandidaten.",
  "admin.bienvenue_sujet": "Willkommen bei {app} 🌟",
  "admin.bienvenue_corps": "Gute Nachricht! Dein Zugang zu {app} ist freigeschaltet.\n\nErstelle hier deine Familie:\n{lien}\n\nBis bald! 🤝",
  "admin.inscrit_le": "registriert am {date}",
  "common.creation": "Wird erstellt…", "common.chargement": "Wird geladen…",
  "toast.mission_ajoutee": "Mission hinzugefügt ✨", "toast.sauv_restauree": "Sicherung wiederherstellt ✅",
  "lien.copier": "📋 Link kopieren", "lien.copie": "✅ Kopiert!",
  "lien.envoyer_mail": "✉️ Per E-Mail senden", "lien.valable": "Dieser Link ist 14 Tage gültig.",
  "lien.email_dest_ph": "E-Mail des Empfängers",
  "lien.envoye": "✅ Einladung an {email} von hello@fami.team gesendet.",
  "lien.envoi_repli": "Automatischer Versand nicht verfügbar — deine E-Mail-App wird geöffnet…",
  "lien.envoi_erreur": "❌ Versand fehlgeschlagen: {msg}",
  "lien.repli_mailto": "✉️ Stattdessen meine E-Mail-App öffnen",
  "cat.famille.monnaie": "Herzen", "cat.planete.monnaie": "Tropfen",
  "toast.annule": "Abgebrochen: −{points} {emoji}",
  "toast.en_attente": "Bravo! 🎉 Wartet auf die Genehmigung eines Elternteils ⏳",
  "toast.nom_requis": "Gib der Mission einen Namen.",
  "toast.repare": "Gut gemacht, dass du es wiedergutgemacht hast! +{bonus} 💛",
  "toast.pas_assez_coeurs": "Noch nicht genug Herzen 💛 — mach weiter mit deinen guten Taten!",
  "toast.debloque": "Freigeschaltet: {nom}! 🎉",
  "toast.manque_prereq": "Um {emoji} {nom} zu erschaffen, fehlt noch: {liste}.",
  "toast.pas_assez_gouttes": "Noch nicht genug Tropfen 💧 — mach weiter mit deinen Taten für den Planeten!",
  "toast.nouvel_etre": "{emoji} Ein(e) {nom} schließt sich deinem Ökosystem an! 🌍",
  "toast.nouveau_badge": "Neues Abzeichen: {emoji} {nom}!",
  "toast.gain": "{emoji} +{points} {monnaie} — {phrase}"
});

/* ---- Phase E4 : contenu (missions, écosystème, avatar, badges) — EN/NL/DE ---- */
Object.assign(I18N.en, {
  "mission.table_mettre": "Set the table", "mission.table_debarr": "Clear the table",
  "mission.manger_propre": "Eat neatly", "mission.ranger_chambre": "Tidy your room",
  "mission.entraide": "Help a brother/sister", "mission.dire_merci": "Say please / thank you",
  "mission.calin": "Give a hug / comfort someone", "mission.habiller_seul": "Get dressed by yourself",
  "mission.dents": "Brush your teeth", "mission.linge_panier": "Put dirty clothes in the basket",
  "mission.calme_colere": "Calm down by breathing", "mission.ecouter": "Listen the first time",
  "mission.lit_faire": "Make your bed", "mission.ranger_jouets": "Tidy up toys",
  "mission.partager": "Share a toy", "mission.jouer_calme": "Play calmly",
  "mission.faire_decouvrir": "Show a friend a game you love",
  "mission.chaussures": "Put on your shoes by yourself", "mission.aider_cuisine": "Help cook",
  "mission.histoire": "Listen to / read a story", "mission.bonjour": "Say hello / goodbye",
  "mission.aider_courses": "Help with shopping", "mission.coucher_lheure": "Go to bed on time",
  "mission.se_laver": "Wash / take a bath",
  "mission.lumiere": "Turn off the light", "mission.eau_robinet": "Turn off the tap",
  "mission.pas_gaspiller": "Finish your plate / don't waste food", "mission.tri_dechets": "Sort the waste",
  "mission.compost": "Add to the compost", "mission.marche_velo": "Walk or cycle there",
  "mission.arroser": "Water the plants", "mission.ramasser": "Pick up litter outside",
  "mission.gourde": "Use your water bottle", "mission.douche_courte": "Take a short shower",
  "mission.jardiner": "Garden / plant seeds", "mission.oiseaux": "Feed the birds",
  "mission.ecrans": "Turn off screens", "mission.animaux": "Take care of the animals",
  "mission.recup": "Reuse instead of throwing away",
  "mission.devoirs": "Do your homework", "mission.cartable": "Pack your school bag",
  "mission.plier_linge": "Tidy / fold your laundry", "mission.poubelle": "Take out the bins",
  "mission.chauffage": "Turn down the heating", "mission.transports": "Use public transport",
  "defi.rep_ranger": "I make it right: I pick up what I dropped",
  "defi.rep_pardon": "I make it right: I say sorry",
  "defi.rep_calin": "I make it right: I do something kind",
  "defi.rep_aide": "I make it right: I help the person involved",
  "defi.rep_nettoyer": "I make it right: I clean up the mess I made",
  "defi.rep_redemander": "I make it right: I calm down, then I ask nicely",
  "badge.coeur10": "Heart of gold", "badge.coeur50": "Super helper",
  "badge.eco_p": "Budding gardener", "badge.eco_h": "Friend of herbivores",
  "badge.eco_c": "Protector of predators", "badge.eco_chaine": "Complete food chain",
  "badge.semaine": "A week of effort",
  "tier.plantes": "Plants", "tier.herbivores": "Herbivores", "tier.carnivores": "Carnivores",
  "lecon.plantes": "Everything starts with plants 🌱: thanks to the sun, they make their own food. They feed the whole ecosystem.",
  "lecon.herbivores": "Herbivores 🐰 only eat plants. Each animal needs the right plants to live: create those first!",
  "lecon.carnivores": "Carnivores 🦊 eat herbivores. Once they're here, the food chain is complete: plants → herbivores → carnivores!",
  "espece.herbe": "Grass", "espece.trefle": "Clover", "espece.fleur": "Flower", "espece.ble": "Wheat",
  "espece.champignon": "Mushroom", "espece.cactus": "Cactus", "espece.arbre": "Tree",
  "espece.palmier": "Palm tree", "espece.bananier": "Banana tree",
  "espece.escargot": "Snail", "espece.chenille": "Caterpillar", "espece.coccinelle": "Ladybug",
  "espece.abeille": "Bee", "espece.papillon": "Butterfly", "espece.souris": "Mouse",
  "espece.lapin": "Rabbit", "espece.tortue": "Tortoise", "espece.ecureuil": "Squirrel",
  "espece.mouton": "Sheep", "espece.chevre": "Goat", "espece.cerf": "Deer",
  "espece.vache": "Cow", "espece.cheval": "Horse", "espece.kangourou": "Kangaroo",
  "espece.zebre": "Zebra", "espece.gazelle": "Gazelle", "espece.chameau": "Camel",
  "espece.autruche": "Ostrich", "espece.phacochere": "Warthog", "espece.girafe": "Giraffe",
  "espece.singe": "Monkey", "espece.elephant": "Elephant",
  "espece.grenouille": "Frog", "espece.araignee": "Spider", "espece.herisson": "Hedgehog",
  "espece.serpent": "Snake", "espece.hibou": "Owl", "espece.renard": "Fox",
  "espece.aigle": "Eagle", "espece.loup": "Wolf", "espece.crocodile": "Crocodile",
  "espece.ours": "Bear", "espece.tigre": "Tiger", "espece.leopard": "Leopard", "espece.lion": "Lion",
  "avatar.peau.clair": "Light", "avatar.peau.mate": "Tan", "avatar.peau.doree": "Golden",
  "avatar.peau.brune": "Brown", "avatar.peau.foncee": "Dark",
  "avatar.coiffure.court": "Short hair", "avatar.coiffure.couettes": "Pigtails",
  "avatar.coiffure.frange": "Fringe", "avatar.coiffure.chignon": "Bun",
  "avatar.coiffure.long": "Long hair", "avatar.coiffure.boucle": "Curly",
  "avatar.coiffure.crete": "Mohawk", "avatar.coiffure.chauve": "No hair",
  "avatar.cheveux.brun": "Brown", "avatar.cheveux.noir": "Black", "avatar.cheveux.blond": "Blond",
  "avatar.cheveux.roux": "Red", "avatar.cheveux.blanc": "White", "avatar.cheveux.rose": "Pink",
  "avatar.cheveux.bleu": "Blue", "avatar.cheveux.vert": "Green",
  "avatar.yeux.ronds": "Round", "avatar.yeux.joyeux": "Cheerful", "avatar.yeux.clin": "Wink",
  "avatar.yeux.etoiles": "Starry", "avatar.yeux.coeur": "Hearts",
  "avatar.lunettes.rien": "None", "avatar.lunettes.rondes": "Round glasses",
  "avatar.lunettes.soleil": "Sunglasses", "avatar.lunettes.etoile": "Star glasses",
  "avatar.lunettes.coeur": "Heart glasses", "avatar.lunettes.goutte": "Drop glasses",
  "avatar.taches.rien": "None", "avatar.taches.taches": "Freckles",
  "avatar.pilosite.rien": "None", "avatar.pilosite.moustache": "Moustache", "avatar.pilosite.barbe": "Beard",
  "avatar.boucles.rien": "None", "avatar.boucles.perles": "Pearls", "avatar.boucles.anneaux": "Gold hoops",
  "avatar.boucles.etoiles": "Stars", "avatar.boucles.coeurs": "Hearts",
  "avatar.chapeau.rien": "None", "avatar.chapeau.noeud": "Bow", "avatar.chapeau.casquette": "Cap",
  "avatar.chapeau.bonnet": "Beanie", "avatar.chapeau.couronne": "Crown",
  "avatar.chapeau.hautform": "Top hat", "avatar.chapeau.diademe": "Tiara",
  "avatar.accessoire.rien": "None", "avatar.accessoire.fleur": "Flower", "avatar.accessoire.ballon": "Balloon",
  "avatar.accessoire.etoile": "Star", "avatar.accessoire.baguette": "Magic wand",
  "avatar.accessoire.guitare": "Guitar", "avatar.accessoire.epee": "Sword",
  "avatar.compagnon.rien": "None", "avatar.compagnon.chat": "Kitten", "avatar.compagnon.chien": "Dog",
  "avatar.compagnon.lapin": "Rabbit", "avatar.compagnon.oiseau": "Bird",
  "avatar.compagnon.papillon": "Butterfly", "avatar.compagnon.dino": "Dinosaur",
  "avatar.fond.ciel": "Sky", "avatar.fond.nuit": "Night", "avatar.fond.foret": "Forest",
  "avatar.fond.plage": "Beach", "avatar.fond.arcenciel": "Rainbow", "avatar.fond.ocean": "Ocean",
  "avatar.fond.bonbon": "Candy", "avatar.fond.ferme": "Farm", "avatar.fond.espace": "Space",
  "encour.0": "Well done, you should be proud of yourself! 🌟",
  "encour.1": "What a lovely gesture, thank you! 💛",
  "encour.2": "You really made an effort, it shows! 👏",
  "encour.3": "Thanks to you the house looks lovelier! 🏡",
  "encour.4": "You take care of others, that's precious! 🤗",
  "encour.5": "The planet says thank you! 🌍",
  "encour.6": "Little by little, you're growing up! 🚀",
  "encour.7": "Your heart is full of kindness! 💖",
  "compliment_serie.0": "{prenom} has kept up « {mission} » {n} days in a row — what wonderful consistency! 🌟",
  "compliment_serie.1": "For {n} days now, {prenom} never forgets « {mission} ». A real habit is forming, well done to them! 💪",
  "compliment_serie.2": "{prenom} has stuck with « {mission} » for {n} days. That's exactly how good habits are born! 🌱",
  "compliment_serie.3": "{n} days in a row for « {mission} »: tell {prenom} you noticed the effort, it means a lot! 💛",
  "compliment_serie.4": "{prenom}'s perseverance on « {mission} » ({n} days in a row) deserves to be recognized today! 👏",
  "compliment_progres.0": "{prenom} is really improving on « {mission} »: {semaine} times this week versus {avant} last week. The effort is paying off! 🚀",
  "compliment_progres.1": "Great progress from {prenom} with « {mission} »: from {avant} to {semaine} times in one week. A kind word will make all the difference! 🌈",
  "compliment_progres.2": "{prenom} is improving day by day on « {mission} ». Show them you notice the progress — it's the best motivator! 🔑",
  "compliment_regularite.0": "{prenom} was active {n} days this week. Take a moment to praise them, even for the small things! 🤗",
  "compliment_regularite.1": "This week, {prenom} showed up {n} out of {total} days. It's the perfect time to value their consistency, not just the results! 💫",
  "compliment_regularite.2": "{prenom} is moving at their own pace, {n} active days this week. A simple “I'm proud of you” can change everything today! 💖",
  "compliment_bienvenue.0": "{prenom} is still discovering FamiTeam: every small step deserves to be noticed. A kind word today can start a great habit! 🌱",
  "compliment_bienvenue.1": "No streak to highlight yet for {prenom}, but it's the perfect moment to encourage them with a sincere compliment! 💛",
  "compliment_bienvenue.2": "{prenom} is starting their journey. Praise the effort rather than the result: that's what builds self-confidence! 🌟"
});

Object.assign(I18N.nl, {
  "mission.table_mettre": "De tafel dekken", "mission.table_debarr": "De tafel afruimen",
  "mission.manger_propre": "Netjes eten", "mission.ranger_chambre": "Je kamer opruimen",
  "mission.entraide": "Een broer/zus helpen", "mission.dire_merci": "Aub / dank je wel zeggen",
  "mission.calin": "Een knuffel geven / troosten", "mission.habiller_seul": "Jezelf aankleden",
  "mission.dents": "Je tanden poetsen", "mission.linge_panier": "Vuile kleren in de wasmand doen",
  "mission.calme_colere": "Kalmeren door te ademen", "mission.ecouter": "Meteen luisteren",
  "mission.lit_faire": "Je bed maken", "mission.ranger_jouets": "Speelgoed opruimen",
  "mission.partager": "Een speeltje delen", "mission.jouer_calme": "Rustig spelen",
  "mission.faire_decouvrir": "Een vriendje een spel laten ontdekken",
  "mission.chaussures": "Zelf je schoenen aandoen", "mission.aider_cuisine": "Helpen koken",
  "mission.histoire": "Een verhaal lezen/luisteren", "mission.bonjour": "Hallo / tot ziens zeggen",
  "mission.aider_courses": "Helpen met boodschappen", "mission.coucher_lheure": "Op tijd naar bed gaan",
  "mission.se_laver": "Je wassen / een bad nemen",
  "mission.lumiere": "Het licht uitdoen", "mission.eau_robinet": "De kraan dichtdraaien",
  "mission.pas_gaspiller": "Je bord leeg eten / niets verspillen", "mission.tri_dechets": "Afval sorteren",
  "mission.compost": "Bij het compost doen", "mission.marche_velo": "Te voet of met de fiets gaan",
  "mission.arroser": "De planten water geven", "mission.ramasser": "Afval buiten oprapen",
  "mission.gourde": "Je drinkfles gebruiken", "mission.douche_courte": "Kort douchen",
  "mission.jardiner": "Tuinieren / zaaien", "mission.oiseaux": "De vogels voeren",
  "mission.ecrans": "Schermen uitzetten", "mission.animaux": "Voor de dieren zorgen",
  "mission.recup": "Hergebruiken in plaats van weggooien",
  "mission.devoirs": "Je huiswerk maken", "mission.cartable": "Je schooltas klaarmaken",
  "mission.plier_linge": "Je was opbergen / opvouwen", "mission.poubelle": "De vuilnis buitenzetten",
  "mission.chauffage": "De verwarming lager zetten", "mission.transports": "Het openbaar vervoer nemen",
  "defi.rep_ranger": "Ik maak het goed: ik ruim op wat ik liet vallen",
  "defi.rep_pardon": "Ik maak het goed: ik bied mijn excuses aan",
  "defi.rep_calin": "Ik maak het goed: ik doe iets liefs",
  "defi.rep_aide": "Ik maak het goed: ik help de betrokken persoon",
  "defi.rep_nettoyer": "Ik maak het goed: ik maak schoon wat ik vuil maakte",
  "defi.rep_redemander": "Ik maak het goed: ik word rustig en vraag het dan vriendelijk",
  "badge.coeur10": "Gouden hart", "badge.coeur50": "Superhelper",
  "badge.eco_p": "Beginnende tuinier", "badge.eco_h": "Vriend van de herbivoren",
  "badge.eco_c": "Beschermer van de roofdieren", "badge.eco_chaine": "Volledige voedselketen",
  "badge.semaine": "Een week vol inzet",
  "tier.plantes": "Planten", "tier.herbivores": "Herbivoren", "tier.carnivores": "Carnivoren",
  "lecon.plantes": "Alles begint met planten 🌱: dankzij de zon maken ze hun eigen voedsel. Zij voeden het hele ecosysteem.",
  "lecon.herbivores": "Herbivoren 🐰 eten alleen planten. Elk dier heeft de juiste planten nodig om te leven: maak die eerst aan!",
  "lecon.carnivores": "Carnivoren 🦊 eten herbivoren. Eenmaal hier is de voedselketen compleet: planten → herbivoren → carnivoren!",
  "espece.herbe": "Gras", "espece.trefle": "Klaver", "espece.fleur": "Bloem", "espece.ble": "Graan",
  "espece.champignon": "Paddenstoel", "espece.cactus": "Cactus", "espece.arbre": "Boom",
  "espece.palmier": "Palmboom", "espece.bananier": "Bananenboom",
  "espece.escargot": "Slak", "espece.chenille": "Rups", "espece.coccinelle": "Lieveheersbeestje",
  "espece.abeille": "Bij", "espece.papillon": "Vlinder", "espece.souris": "Muis",
  "espece.lapin": "Konijn", "espece.tortue": "Schildpad", "espece.ecureuil": "Eekhoorn",
  "espece.mouton": "Schaap", "espece.chevre": "Geit", "espece.cerf": "Hert",
  "espece.vache": "Koe", "espece.cheval": "Paard", "espece.kangourou": "Kangoeroe",
  "espece.zebre": "Zebra", "espece.gazelle": "Gazelle", "espece.chameau": "Kameel",
  "espece.autruche": "Struisvogel", "espece.phacochere": "Wrattenzwijn", "espece.girafe": "Giraf",
  "espece.singe": "Aap", "espece.elephant": "Olifant",
  "espece.grenouille": "Kikker", "espece.araignee": "Spin", "espece.herisson": "Egel",
  "espece.serpent": "Slang", "espece.hibou": "Uil", "espece.renard": "Vos",
  "espece.aigle": "Arend", "espece.loup": "Wolf", "espece.crocodile": "Krokodil",
  "espece.ours": "Beer", "espece.tigre": "Tijger", "espece.leopard": "Luipaard", "espece.lion": "Leeuw",
  "avatar.peau.clair": "Licht", "avatar.peau.mate": "Getint", "avatar.peau.doree": "Goudkleurig",
  "avatar.peau.brune": "Bruin", "avatar.peau.foncee": "Donker",
  "avatar.coiffure.court": "Kort haar", "avatar.coiffure.couettes": "Staartjes",
  "avatar.coiffure.frange": "Pony", "avatar.coiffure.chignon": "Knot",
  "avatar.coiffure.long": "Lang haar", "avatar.coiffure.boucle": "Krullen",
  "avatar.coiffure.crete": "Hanenkam", "avatar.coiffure.chauve": "Geen haar",
  "avatar.cheveux.brun": "Bruin", "avatar.cheveux.noir": "Zwart", "avatar.cheveux.blond": "Blond",
  "avatar.cheveux.roux": "Rood", "avatar.cheveux.blanc": "Wit", "avatar.cheveux.rose": "Roze",
  "avatar.cheveux.bleu": "Blauw", "avatar.cheveux.vert": "Groen",
  "avatar.yeux.ronds": "Rond", "avatar.yeux.joyeux": "Blij", "avatar.yeux.clin": "Knipoog",
  "avatar.yeux.etoiles": "Sterren", "avatar.yeux.coeur": "Hartjes",
  "avatar.lunettes.rien": "Geen", "avatar.lunettes.rondes": "Ronde bril",
  "avatar.lunettes.soleil": "Zonnebril", "avatar.lunettes.etoile": "Sterrenbril",
  "avatar.lunettes.coeur": "Hartjesbril", "avatar.lunettes.goutte": "Druppelbril",
  "avatar.taches.rien": "Geen", "avatar.taches.taches": "Sproeten",
  "avatar.pilosite.rien": "Geen", "avatar.pilosite.moustache": "Snor", "avatar.pilosite.barbe": "Baard",
  "avatar.boucles.rien": "Geen", "avatar.boucles.perles": "Parels", "avatar.boucles.anneaux": "Gouden ringen",
  "avatar.boucles.etoiles": "Sterren", "avatar.boucles.coeurs": "Hartjes",
  "avatar.chapeau.rien": "Geen", "avatar.chapeau.noeud": "Strik", "avatar.chapeau.casquette": "Pet",
  "avatar.chapeau.bonnet": "Muts", "avatar.chapeau.couronne": "Kroon",
  "avatar.chapeau.hautform": "Hoge hoed", "avatar.chapeau.diademe": "Diadeem",
  "avatar.accessoire.rien": "Geen", "avatar.accessoire.fleur": "Bloem", "avatar.accessoire.ballon": "Ballon",
  "avatar.accessoire.etoile": "Ster", "avatar.accessoire.baguette": "Toverstaf",
  "avatar.accessoire.guitare": "Gitaar", "avatar.accessoire.epee": "Zwaard",
  "avatar.compagnon.rien": "Geen", "avatar.compagnon.chat": "Kitten", "avatar.compagnon.chien": "Hond",
  "avatar.compagnon.lapin": "Konijn", "avatar.compagnon.oiseau": "Vogel",
  "avatar.compagnon.papillon": "Vlinder", "avatar.compagnon.dino": "Dinosaurus",
  "avatar.fond.ciel": "Lucht", "avatar.fond.nuit": "Nacht", "avatar.fond.foret": "Bos",
  "avatar.fond.plage": "Strand", "avatar.fond.arcenciel": "Regenboog", "avatar.fond.ocean": "Oceaan",
  "avatar.fond.bonbon": "Snoep", "avatar.fond.ferme": "Boerderij", "avatar.fond.espace": "Ruimte",
  "encour.0": "Bravo, je mag fier zijn op jezelf! 🌟",
  "encour.1": "Wat een mooi gebaar, dankjewel! 💛",
  "encour.2": "Je hebt echt je best gedaan, dat is te zien! 👏",
  "encour.3": "Dankzij jou is het huis nog mooier! 🏡",
  "encour.4": "Je zorgt voor anderen, dat is kostbaar! 🤗",
  "encour.5": "De planeet zegt dankjewel! 🌍",
  "encour.6": "Stap voor stap word je groot! 🚀",
  "encour.7": "Je hart is vol vriendelijkheid! 💖",
  "compliment_serie.0": "{prenom} doet « {mission} » al {n} dagen na elkaar — wat een mooie regelmaat! 🌟",
  "compliment_serie.1": "{prenom} vergeet « {mission} » al {n} dagen niet meer. Er groeit een echte gewoonte, goed gedaan! 💪",
  "compliment_serie.2": "{prenom} blijft trouw aan « {mission} », al {n} dagen. Zo ontstaan precies goede gewoontes! 🌱",
  "compliment_serie.3": "{n} dagen op rij voor « {mission} »: zeg tegen {prenom} dat je dit hebt opgemerkt, het betekent veel! 💛",
  "compliment_serie.4": "De doorzettingskracht van {prenom} bij « {mission} » ({n} dagen op rij) verdient het om vandaag benoemd te worden! 👏",
  "compliment_progres.0": "{prenom} maakt echt vooruitgang met « {mission} »: {semaine} keer deze week tegenover {avant} vorige week. De inspanning loont! 🚀",
  "compliment_progres.1": "Mooie vooruitgang van {prenom} met « {mission} »: van {avant} naar {semaine} keer in één week. Een lief woordje maakt het verschil! 🌈",
  "compliment_progres.2": "{prenom} verbetert dag na dag bij « {mission} ». Laat merken dat je de vooruitgang ziet, dat is de beste motivatie! 🔑",
  "compliment_regularite.0": "{prenom} was deze week {n} dagen actief. Neem even de tijd om te feliciteren, ook voor de kleine dingen! 🤗",
  "compliment_regularite.1": "Deze week was {prenom} {n} van de {total} dagen aanwezig. Dit is het moment om de volharding te waarderen, niet alleen de resultaten! 💫",
  "compliment_regularite.2": "{prenom} gaat op eigen tempo vooruit, {n} actieve dagen deze week. Een simpel « ik ben trots op je » kan vandaag alles veranderen! 💖",
  "compliment_bienvenue.0": "{prenom} ontdekt FamiTeam nog: elke kleine stap verdient het om opgemerkt te worden. Een lief woordje vandaag kan een mooie gewoonte starten! 🌱",
  "compliment_bienvenue.1": "Nog geen reeks om te benoemen voor {prenom}, maar dit is het perfecte moment om aan te moedigen met een oprecht compliment! 💛",
  "compliment_bienvenue.2": "{prenom} begint aan het avontuur. Waardeer de inspanning in plaats van het resultaat: zo bouw je zelfvertrouwen op! 🌟"
});

Object.assign(I18N.de, {
  "mission.table_mettre": "Den Tisch decken", "mission.table_debarr": "Den Tisch abräumen",
  "mission.manger_propre": "Ordentlich essen", "mission.ranger_chambre": "Dein Zimmer aufräumen",
  "mission.entraide": "Einem Geschwister helfen", "mission.dire_merci": "Bitte / Danke sagen",
  "mission.calin": "Eine Umarmung geben / trösten", "mission.habiller_seul": "Sich allein anziehen",
  "mission.dents": "Zähne putzen", "mission.linge_panier": "Schmutzige Kleidung in den Korb legen",
  "mission.calme_colere": "Sich durch Atmen beruhigen", "mission.ecouter": "Beim ersten Mal zuhören",
  "mission.lit_faire": "Dein Bett machen", "mission.ranger_jouets": "Spielzeug aufräumen",
  "mission.partager": "Ein Spielzeug teilen", "mission.jouer_calme": "Ruhig spielen",
  "mission.faire_decouvrir": "Einem Freund ein Spiel zeigen, das du liebst",
  "mission.chaussures": "Allein die Schuhe anziehen", "mission.aider_cuisine": "Beim Kochen helfen",
  "mission.histoire": "Eine Geschichte hören/lesen", "mission.bonjour": "Hallo / auf Wiedersehen sagen",
  "mission.aider_courses": "Beim Einkaufen helfen", "mission.coucher_lheure": "Pünktlich ins Bett gehen",
  "mission.se_laver": "Sich waschen / baden",
  "mission.lumiere": "Das Licht ausschalten", "mission.eau_robinet": "Den Wasserhahn zudrehen",
  "mission.pas_gaspiller": "Den Teller leer essen / nichts verschwenden", "mission.tri_dechets": "Müll trennen",
  "mission.compost": "Auf den Kompost geben", "mission.marche_velo": "Zu Fuß oder mit dem Rad hinfahren",
  "mission.arroser": "Die Pflanzen gießen", "mission.ramasser": "Draußen Müll aufsammeln",
  "mission.gourde": "Deine Trinkflasche benutzen", "mission.douche_courte": "Kurz duschen",
  "mission.jardiner": "Gärtnern / säen", "mission.oiseaux": "Die Vögel füttern",
  "mission.ecrans": "Bildschirme ausschalten", "mission.animaux": "Sich um die Tiere kümmern",
  "mission.recup": "Wiederverwenden statt wegwerfen",
  "mission.devoirs": "Hausaufgaben machen", "mission.cartable": "Schultasche packen",
  "mission.plier_linge": "Wäsche aufräumen / falten", "mission.poubelle": "Müll rausbringen",
  "mission.chauffage": "Heizung runterdrehen", "mission.transports": "Öffentliche Verkehrsmittel nutzen",
  "defi.rep_ranger": "Ich mache es wieder gut: ich räume auf, was mir hingefallen ist",
  "defi.rep_pardon": "Ich mache es wieder gut: ich entschuldige mich",
  "defi.rep_calin": "Ich mache es wieder gut: ich tue etwas Liebes",
  "defi.rep_aide": "Ich mache es wieder gut: ich helfe der betroffenen Person",
  "defi.rep_nettoyer": "Ich mache es wieder gut: ich putze weg, was ich schmutzig gemacht habe",
  "defi.rep_redemander": "Ich mache es wieder gut: ich beruhige mich und frage dann freundlich",
  "badge.coeur10": "Goldenes Herz", "badge.coeur50": "Super-Helfer",
  "badge.eco_p": "Angehende(r) Gärtner(in)", "badge.eco_h": "Freund der Pflanzenfresser",
  "badge.eco_c": "Beschützer der Raubtiere", "badge.eco_chaine": "Vollständige Nahrungskette",
  "badge.semaine": "Eine Woche voller Einsatz",
  "tier.plantes": "Pflanzen", "tier.herbivores": "Pflanzenfresser", "tier.carnivores": "Fleischfresser",
  "lecon.plantes": "Alles beginnt mit den Pflanzen 🌱: dank der Sonne stellen sie ihre eigene Nahrung her. Sie ernähren das ganze Ökosystem.",
  "lecon.herbivores": "Pflanzenfresser 🐰 essen nur Pflanzen. Jedes Tier braucht die richtigen Pflanzen zum Leben: erschaffe sie zuerst!",
  "lecon.carnivores": "Fleischfresser 🦊 essen Pflanzenfresser. Sobald sie da sind, ist die Nahrungskette vollständig: Pflanzen → Pflanzenfresser → Fleischfresser!",
  "espece.herbe": "Gras", "espece.trefle": "Klee", "espece.fleur": "Blume", "espece.ble": "Weizen",
  "espece.champignon": "Pilz", "espece.cactus": "Kaktus", "espece.arbre": "Baum",
  "espece.palmier": "Palme", "espece.bananier": "Bananenbaum",
  "espece.escargot": "Schnecke", "espece.chenille": "Raupe", "espece.coccinelle": "Marienkäfer",
  "espece.abeille": "Biene", "espece.papillon": "Schmetterling", "espece.souris": "Maus",
  "espece.lapin": "Hase", "espece.tortue": "Schildkröte", "espece.ecureuil": "Eichhörnchen",
  "espece.mouton": "Schaf", "espece.chevre": "Ziege", "espece.cerf": "Hirsch",
  "espece.vache": "Kuh", "espece.cheval": "Pferd", "espece.kangourou": "Känguru",
  "espece.zebre": "Zebra", "espece.gazelle": "Gazelle", "espece.chameau": "Kamel",
  "espece.autruche": "Strauß", "espece.phacochere": "Warzenschwein", "espece.girafe": "Giraffe",
  "espece.singe": "Affe", "espece.elephant": "Elefant",
  "espece.grenouille": "Frosch", "espece.araignee": "Spinne", "espece.herisson": "Igel",
  "espece.serpent": "Schlange", "espece.hibou": "Eule", "espece.renard": "Fuchs",
  "espece.aigle": "Adler", "espece.loup": "Wolf", "espece.crocodile": "Krokodil",
  "espece.ours": "Bär", "espece.tigre": "Tiger", "espece.leopard": "Leopard", "espece.lion": "Löwe",
  "avatar.peau.clair": "Hell", "avatar.peau.mate": "Olivfarben", "avatar.peau.doree": "Golden",
  "avatar.peau.brune": "Braun", "avatar.peau.foncee": "Dunkel",
  "avatar.coiffure.court": "Kurzes Haar", "avatar.coiffure.couettes": "Zöpfe",
  "avatar.coiffure.frange": "Pony", "avatar.coiffure.chignon": "Dutt",
  "avatar.coiffure.long": "Langes Haar", "avatar.coiffure.boucle": "Lockig",
  "avatar.coiffure.crete": "Irokese", "avatar.coiffure.chauve": "Kein Haar",
  "avatar.cheveux.brun": "Braun", "avatar.cheveux.noir": "Schwarz", "avatar.cheveux.blond": "Blond",
  "avatar.cheveux.roux": "Rot", "avatar.cheveux.blanc": "Weiß", "avatar.cheveux.rose": "Rosa",
  "avatar.cheveux.bleu": "Blau", "avatar.cheveux.vert": "Grün",
  "avatar.yeux.ronds": "Rund", "avatar.yeux.joyeux": "Fröhlich", "avatar.yeux.clin": "Zwinkernd",
  "avatar.yeux.etoiles": "Sternförmig", "avatar.yeux.coeur": "Herzen",
  "avatar.lunettes.rien": "Keine", "avatar.lunettes.rondes": "Runde Brille",
  "avatar.lunettes.soleil": "Sonnenbrille", "avatar.lunettes.etoile": "Sternenbrille",
  "avatar.lunettes.coeur": "Herzbrille", "avatar.lunettes.goutte": "Tropfenbrille",
  "avatar.taches.rien": "Keine", "avatar.taches.taches": "Sommersprossen",
  "avatar.pilosite.rien": "Keine", "avatar.pilosite.moustache": "Schnurrbart", "avatar.pilosite.barbe": "Bart",
  "avatar.boucles.rien": "Keine", "avatar.boucles.perles": "Perlen", "avatar.boucles.anneaux": "Goldreifen",
  "avatar.boucles.etoiles": "Sterne", "avatar.boucles.coeurs": "Herzen",
  "avatar.chapeau.rien": "Keiner", "avatar.chapeau.noeud": "Schleife", "avatar.chapeau.casquette": "Kappe",
  "avatar.chapeau.bonnet": "Mütze", "avatar.chapeau.couronne": "Krone",
  "avatar.chapeau.hautform": "Zylinder", "avatar.chapeau.diademe": "Diadem",
  "avatar.accessoire.rien": "Keines", "avatar.accessoire.fleur": "Blume", "avatar.accessoire.ballon": "Luftballon",
  "avatar.accessoire.etoile": "Stern", "avatar.accessoire.baguette": "Zauberstab",
  "avatar.accessoire.guitare": "Gitarre", "avatar.accessoire.epee": "Schwert",
  "avatar.compagnon.rien": "Keiner", "avatar.compagnon.chat": "Kätzchen", "avatar.compagnon.chien": "Hund",
  "avatar.compagnon.lapin": "Hase", "avatar.compagnon.oiseau": "Vogel",
  "avatar.compagnon.papillon": "Schmetterling", "avatar.compagnon.dino": "Dinosaurier",
  "avatar.fond.ciel": "Himmel", "avatar.fond.nuit": "Nacht", "avatar.fond.foret": "Wald",
  "avatar.fond.plage": "Strand", "avatar.fond.arcenciel": "Regenbogen", "avatar.fond.ocean": "Ozean",
  "avatar.fond.bonbon": "Süßigkeiten", "avatar.fond.ferme": "Bauernhof", "avatar.fond.espace": "Weltraum",
  "encour.0": "Bravo, du kannst stolz auf dich sein! 🌟",
  "encour.1": "Was für eine schöne Geste, danke! 💛",
  "encour.2": "Du hast dich richtig bemüht, das sieht man! 👏",
  "encour.3": "Dank dir ist das Zuhause noch schöner! 🏡",
  "encour.4": "Du sorgst dich um andere, das ist wertvoll! 🤗",
  "encour.5": "Der Planet sagt danke! 🌍",
  "encour.6": "Schritt für Schritt wirst du groß! 🚀",
  "encour.7": "Dein Herz ist voller Freundlichkeit! 💖",
  "compliment_serie.0": "{prenom} macht « {mission} » schon {n} Tage in Folge — was für eine schöne Beständigkeit! 🌟",
  "compliment_serie.1": "Seit {n} Tagen vergisst {prenom} « {mission} » nie. Eine echte Gewohnheit entsteht, gut gemacht! 💪",
  "compliment_serie.2": "{prenom} bleibt seit {n} Tagen bei « {mission} » dran. Genau so entstehen gute Gewohnheiten! 🌱",
  "compliment_serie.3": "{n} Tage in Folge für « {mission} »: sag {prenom}, dass dir das aufgefallen ist, das bedeutet viel! 💛",
  "compliment_serie.4": "Die Beharrlichkeit von {prenom} bei « {mission} » ({n} Tage in Folge) verdient heute Anerkennung! 👏",
  "compliment_progres.0": "{prenom} macht bei « {mission} » wirklich Fortschritte: {semaine} Mal diese Woche gegenüber {avant} letzte Woche. Die Mühe zahlt sich aus! 🚀",
  "compliment_progres.1": "Schöner Fortschritt von {prenom} bei « {mission} »: von {avant} auf {semaine} Mal in einer Woche. Ein liebes Wort macht den Unterschied! 🌈",
  "compliment_progres.2": "{prenom} verbessert sich Tag für Tag bei « {mission} ». Zeig, dass du den Fortschritt bemerkst — das motiviert am meisten! 🔑",
  "compliment_regularite.0": "{prenom} war diese Woche {n} Tage aktiv. Nimm dir einen Moment zum Loben, auch für die kleinen Dinge! 🤗",
  "compliment_regularite.1": "Diese Woche war {prenom} {n} von {total} Tagen dabei. Der perfekte Moment, um die Beständigkeit zu würdigen, nicht nur die Ergebnisse! 💫",
  "compliment_regularite.2": "{prenom} geht in seinem/ihrem eigenen Tempo voran, {n} aktive Tage diese Woche. Ein einfaches „Ich bin stolz auf dich“ kann heute alles verändern! 💖",
  "compliment_bienvenue.0": "{prenom} entdeckt FamiTeam noch: jeder kleine Schritt verdient Beachtung. Ein liebes Wort heute kann eine schöne Gewohnheit starten! 🌱",
  "compliment_bienvenue.1": "Noch keine Serie zum Hervorheben bei {prenom}, aber der perfekte Moment, um mit einem ehrlichen Kompliment zu ermutigen! 💛",
  "compliment_bienvenue.2": "{prenom} beginnt sein/ihr Abenteuer. Lobe die Anstrengung statt des Ergebnisses: so entsteht Selbstvertrauen! 🌟"
});

/* ---- Touches d'humour (FR = repli depuis data.js ; ici EN/NL/DE) ---- */
Object.assign(I18N.en, {
  "taquin.0": "Champion! Even the socks are impressed 🧦",
  "taquin.1": "Bravo! You deserve a chocolate medal 🍫 (imaginary 😅)",
  "taquin.2": "Wow! The house shines so much we need sunglasses 😎",
  "taquin.3": "So strong! The unicorns are taking notes 🦄",
  "taquin.4": "And hop! Another little superhero step 🦸",
  "taquin.5": "Mission complete! Your invisible cape flutters in the wind 🌬️",
  "taquin.6": "Awesome! The dinosaurs would have been jealous 🦕",
  "taquin.7": "Top! You earn 1000 kindness points… and a hug 🤗",
  "vide.0": "Nothing here… the missions are napping 😴",
  "vide.1": "All empty! A gust of wind blew through 🌬️",
  "vide.2": "Oops, the hamster tidied everything up 🐹",
  "vide.3": "It's a desert for now… even the ants left 🐜",
  "vide.4": "Nothing to see here… except this little emoji 👀",
  "blague_q.0": "What's a gardener's worst nightmare?", "blague_r.0": "Telling tall tales… of beans! 🫘",
  "blague_q.1": "What does a snail say when riding a turtle?", "blague_r.1": "« Wheee, so fast! » 🐌",
  "blague_q.2": "Why don't fish like computers?", "blague_r.2": "They're scared of the Net! 🐟",
  "blague_q.3": "Which animal never tells the truth?", "blague_r.3": "The lizard — it always bluffs! 🦎",
  "blague_q.4": "What did one strawberry say on a horse?", "blague_r.4": "Giddy-up, berry! 🍓",
  "blague_q.5": "Why was the maths book sad?", "blague_r.5": "It had too many problems! 📘",
  "blague_q.6": "What's the funniest fruit?", "blague_r.6": "The peach — it's a real peach! 🍑",
  "blague_q.7": "What did one wall say to the other?", "blague_r.7": "« Meet you at the corner! » 🧱"
});
Object.assign(I18N.nl, {
  "taquin.0": "Kampioen! Zelfs de sokken zijn onder de indruk 🧦",
  "taquin.1": "Bravo! Je verdient een chocolademedaille 🍫 (denkbeeldig 😅)",
  "taquin.2": "Wauw! Het huis blinkt zo dat we een zonnebril nodig hebben 😎",
  "taquin.3": "Zo sterk! De eenhoorns maken notities 🦄",
  "taquin.4": "En hop! Weer een superheldenstapje 🦸",
  "taquin.5": "Missie voltooid! Je onzichtbare cape wappert in de wind 🌬️",
  "taquin.6": "Geweldig! De dino's zouden jaloers zijn 🦕",
  "taquin.7": "Top! Je verdient 1000 lieve punten… en een knuffel 🤗",
  "vide.0": "Niets hier… de opdrachten doen een dutje 😴",
  "vide.1": "Helemaal leeg! Er waaide een windvlaag voorbij 🌬️",
  "vide.2": "Oeps, de hamster heeft alles opgeruimd 🐹",
  "vide.3": "Voorlopig een woestijn… zelfs de mieren zijn weg 🐜",
  "vide.4": "Niets te zien hier… behalve deze kleine emoji 👀",
  "blague_q.0": "Wat is de nachtmerrie van een tuinman?", "blague_r.0": "Onzin verkopen… vol bonen! 🫘",
  "blague_q.1": "Wat zegt een slak op een schildpad?", "blague_r.1": "« Joepie, zo snel! » 🐌",
  "blague_q.2": "Waarom houden vissen niet van computers?", "blague_r.2": "Ze zijn bang voor het Net! 🐟",
  "blague_q.3": "Welk dier liegt altijd?", "blague_r.3": "De hagedis — die bluft altijd! 🦎",
  "blague_q.4": "Wat zegt een aardbei op een paard?", "blague_r.4": "Hop, hop, bessie! 🍓",
  "blague_q.5": "Waarom was het rekenboek verdrietig?", "blague_r.5": "Het had te veel problemen! 📘",
  "blague_q.6": "Wat is het grappigste fruit?", "blague_r.6": "De peer — echt een pereltje! 🍐",
  "blague_q.7": "Wat zegt de ene muur tegen de andere?", "blague_r.7": "« Tot bij de hoek! » 🧱"
});
Object.assign(I18N.de, {
  "taquin.0": "Champion! Sogar die Socken sind beeindruckt 🧦",
  "taquin.1": "Bravo! Du verdienst eine Schokomedaille 🍫 (eingebildet 😅)",
  "taquin.2": "Wow! Das Haus glänzt so sehr, wir brauchen eine Sonnenbrille 😎",
  "taquin.3": "So stark! Die Einhörner machen sich Notizen 🦄",
  "taquin.4": "Und hopp! Noch ein kleiner Superheldenschritt 🦸",
  "taquin.5": "Mission erfüllt! Dein unsichtbarer Umhang weht im Wind 🌬️",
  "taquin.6": "Klasse! Die Dinos wären neidisch gewesen 🦕",
  "taquin.7": "Top! Du bekommst 1000 Nettigkeitspunkte… und eine Umarmung 🤗",
  "vide.0": "Nichts hier… die Aufgaben machen ein Nickerchen 😴",
  "vide.1": "Alles leer! Ein Windstoß ist vorbeigezogen 🌬️",
  "vide.2": "Hoppla, der Hamster hat alles aufgeräumt 🐹",
  "vide.3": "Vorerst eine Wüste… sogar die Ameisen sind weg 🐜",
  "vide.4": "Nichts zu sehen hier… außer diesem kleinen Emoji 👀",
  "blague_q.0": "Was ist der Albtraum eines Gärtners?", "blague_r.0": "Käse erzählen… äh, Salat reden! 🥗",
  "blague_q.1": "Was sagt eine Schnecke auf einer Schildkröte?", "blague_r.1": "« Juhu, so schnell! » 🐌",
  "blague_q.2": "Warum mögen Fische keine Computer?", "blague_r.2": "Sie haben Angst vor dem Netz! 🐟",
  "blague_q.3": "Welches Tier sagt nie die Wahrheit?", "blague_r.3": "Die Eidechse — sie blufft immer! 🦎",
  "blague_q.4": "Was sagt eine Erdbeere auf einem Pferd?", "blague_r.4": "Hü, hü, Beere! 🍓",
  "blague_q.5": "Warum war das Mathebuch traurig?", "blague_r.5": "Es hatte zu viele Probleme! 📘",
  "blague_q.6": "Was ist das lustigste Obst?", "blague_r.6": "Die Birne — echt birnenstark! 🍐",
  "blague_q.7": "Was sagt eine Wand zur anderen?", "blague_r.7": "« Wir treffen uns an der Ecke! » 🧱"
});

/* =====================================================================
 * Cartes surprises (objectifs d'équipe) — ajouts i18n
 * ===================================================================== */
Object.assign(I18N.fr, {
  "cs.titre": "🎁 Cartes FamiTeam (en équipe)",
  "cs.sous": "Donnez vos Cœurs ensemble pour débloquer une activité en famille !",
  "cs.aucune": "Aucune carte pour l'instant. Les parents peuvent en ajouter dans l'espace parents.",
  "cs.recolte": "{recolte} / {cout} 💛",
  "cs.donner1": "Donner 1 💛",
  "cs.donner5": "Donner 5 💛",
  "cs.debloquee": "Débloquée ! 🎉",
  "cs.a_faire": "🎉 À faire en famille !",
  "cs.faite_btn": "✅ On l'a fait !",
  "cs.faite": "Réalisée 🥳",
  "cs.contributions": "Merci à tous ! 💛",
  "cs.reste": "Encore {reste} 💛 ensemble",
  "cs.gestion_titre": "🎁 Cartes FamiTeam (activités famille)",
  "cs.gestion_sous": "Définis les activités à débloquer en équipe et leur prix en Cœurs 💛.",
  "cs.f_titre": "Titre de l'activité",
  "cs.f_activite": "Description (ce que vous ferez)",
  "cs.f_emoji": "Emoji",
  "cs.f_cout": "Prix 💛",
  "cs.f_ajouter": "➕ Ajouter cette carte",
  "cs.supprimer": "Supprimer",
  "cs.reinit": "Réinitialiser",
  "cs.prix_label": "Prix",
  "toast.carte_debloquee": "{emoji} Carte débloquée : {titre} ! 🎉 À faire en famille !",
  "mail.carte_sujet": "{emoji} Carte FamiTeam débloquée : {titre} !",
  "mail.carte_corps": "Bonne nouvelle ! Vos enfants viennent de débloquer ensemble la carte FamiTeam « {titre} » ({cout} 💛). C'est le moment de la vivre en famille !",
  "mail.carte_contrib": "Qui a contribué :",
  "toast.carte_don": "Merci ! +{montant} {emoji} pour l'équipe",
  "toast.carte_ajoutee": "Carte FamiTeam ajoutée 🎁"
});

Object.assign(I18N.en, {
  "cs.titre": "🎁 FamiTeam cards (as a team)",
  "cs.sous": "Give your Hearts together to unlock a family activity!",
  "cs.aucune": "No cards yet. Parents can add some in the parents' area.",
  "cs.recolte": "{recolte} / {cout} 💛",
  "cs.donner1": "Give 1 💛",
  "cs.donner5": "Give 5 💛",
  "cs.debloquee": "Unlocked! 🎉",
  "cs.a_faire": "🎉 To do as a family!",
  "cs.faite_btn": "✅ We did it!",
  "cs.faite": "Done 🥳",
  "cs.contributions": "Thanks everyone! 💛",
  "cs.reste": "{reste} 💛 left together",
  "cs.gestion_titre": "🎁 FamiTeam cards (family activities)",
  "cs.gestion_sous": "Set the activities to unlock as a team and their price in Hearts 💛.",
  "cs.f_titre": "Activity title",
  "cs.f_activite": "Description (what you'll do)",
  "cs.f_emoji": "Emoji",
  "cs.f_cout": "Price 💛",
  "cs.f_ajouter": "➕ Add this card",
  "cs.supprimer": "Delete",
  "cs.reinit": "Reset",
  "cs.prix_label": "Price",
  "toast.carte_debloquee": "{emoji} Card unlocked: {titre}! 🎉 Time for a family activity!",
  "mail.carte_sujet": "{emoji} FamiTeam card unlocked: {titre}!",
  "mail.carte_corps": "Great news! Your children just unlocked the FamiTeam card “{titre}” together ({cout} 💛). Time to enjoy it as a family!",
  "mail.carte_contrib": "Who contributed:",
  "toast.carte_don": "Thanks! +{montant} {emoji} for the team",
  "toast.carte_ajoutee": "FamiTeam card added 🎁",
  "carte.cs_cine": "Movie night at home",
  "carte.cs_picnic": "Picnic in the park",
  "carte.cs_sortie": "Big surprise outing",
  "carteAct.cs_cine": "We pick a film together, with popcorn and a blanket!",
  "carteAct.cs_picnic": "We pack a snack and go play outside as a family.",
  "carteAct.cs_sortie": "A special outing chosen together (zoo, park, pool…)."
});

Object.assign(I18N.nl, {
  "cs.titre": "🎁 FamiTeam-kaarten (als team)",
  "cs.sous": "Geef samen jullie Hartjes om een gezinsactiviteit vrij te spelen!",
  "cs.aucune": "Nog geen kaarten. Ouders kunnen ze toevoegen in de oudersectie.",
  "cs.recolte": "{recolte} / {cout} 💛",
  "cs.donner1": "Geef 1 💛",
  "cs.donner5": "Geef 5 💛",
  "cs.debloquee": "Vrijgespeeld! 🎉",
  "cs.a_faire": "🎉 Samen als gezin doen!",
  "cs.faite_btn": "✅ We hebben het gedaan!",
  "cs.faite": "Gedaan 🥳",
  "cs.contributions": "Bedankt allemaal! 💛",
  "cs.reste": "Nog {reste} 💛 samen",
  "cs.gestion_titre": "🎁 FamiTeam-kaarten (gezinsactiviteiten)",
  "cs.gestion_sous": "Stel de activiteiten in om als team vrij te spelen en hun prijs in Hartjes 💛.",
  "cs.f_titre": "Titel van de activiteit",
  "cs.f_activite": "Beschrijving (wat jullie gaan doen)",
  "cs.f_emoji": "Emoji",
  "cs.f_cout": "Prijs 💛",
  "cs.f_ajouter": "➕ Deze kaart toevoegen",
  "cs.supprimer": "Verwijderen",
  "cs.reinit": "Opnieuw",
  "cs.prix_label": "Prijs",
  "toast.carte_debloquee": "{emoji} Kaart vrijgespeeld: {titre}! 🎉 Tijd voor een gezinsactiviteit!",
  "mail.carte_sujet": "{emoji} FamiTeam-kaart vrijgespeeld: {titre}!",
  "mail.carte_corps": "Goed nieuws! Jullie kinderen hebben samen de FamiTeam-kaart “{titre}” vrijgespeeld ({cout} 💛). Tijd om er samen van te genieten!",
  "mail.carte_contrib": "Wie heeft bijgedragen:",
  "toast.carte_don": "Bedankt! +{montant} {emoji} voor het team",
  "toast.carte_ajoutee": "FamiTeam-kaart toegevoegd 🎁",
  "carte.cs_cine": "Filmavond thuis",
  "carte.cs_picnic": "Picknick in het park",
  "carte.cs_sortie": "Grote verrassingsuitstap",
  "carteAct.cs_cine": "We kiezen samen een film, met popcorn en een dekentje!",
  "carteAct.cs_picnic": "We maken een hapje klaar en gaan samen buiten spelen.",
  "carteAct.cs_sortie": "Een speciaal uitje samen gekozen (dierentuin, park, zwembad…)."
});

Object.assign(I18N.de, {
  "cs.titre": "🎁 FamiTeam-Karten (im Team)",
  "cs.sous": "Gebt zusammen eure Herzen, um eine Familienaktivität freizuschalten!",
  "cs.aucune": "Noch keine Karten. Eltern können welche im Elternbereich hinzufügen.",
  "cs.recolte": "{recolte} / {cout} 💛",
  "cs.donner1": "1 💛 geben",
  "cs.donner5": "5 💛 geben",
  "cs.debloquee": "Freigeschaltet! 🎉",
  "cs.a_faire": "🎉 Als Familie machen!",
  "cs.faite_btn": "✅ Geschafft!",
  "cs.faite": "Erledigt 🥳",
  "cs.contributions": "Danke euch allen! 💛",
  "cs.reste": "Noch {reste} 💛 zusammen",
  "cs.gestion_titre": "🎁 FamiTeam-Karten (Familienaktivitäten)",
  "cs.gestion_sous": "Lege die Aktivitäten zum gemeinsamen Freischalten und ihren Preis in Herzen 💛 fest.",
  "cs.f_titre": "Titel der Aktivität",
  "cs.f_activite": "Beschreibung (was ihr machen werdet)",
  "cs.f_emoji": "Emoji",
  "cs.f_cout": "Preis 💛",
  "cs.f_ajouter": "➕ Diese Karte hinzufügen",
  "cs.supprimer": "Löschen",
  "cs.reinit": "Zurücksetzen",
  "cs.prix_label": "Preis",
  "toast.carte_debloquee": "{emoji} Karte freigeschaltet: {titre}! 🎉 Zeit für eine Familienaktivität!",
  "mail.carte_sujet": "{emoji} FamiTeam-Karte freigeschaltet: {titre}!",
  "mail.carte_corps": "Gute Nachrichten! Eure Kinder haben gemeinsam die FamiTeam-Karte „{titre}“ freigeschaltet ({cout} 💛). Zeit, sie als Familie zu erleben!",
  "mail.carte_contrib": "Wer beigetragen hat:",
  "toast.carte_don": "Danke! +{montant} {emoji} fürs Team",
  "toast.carte_ajoutee": "FamiTeam-Karte hinzugefügt 🎁",
  "carte.cs_cine": "Filmabend zu Hause",
  "carte.cs_picnic": "Picknick im Park",
  "carte.cs_sortie": "Großer Überraschungsausflug",
  "carteAct.cs_cine": "Wir wählen zusammen einen Film, mit Popcorn und Decke!",
  "carteAct.cs_picnic": "Wir packen einen Snack ein und spielen zusammen draußen.",
  "carteAct.cs_sortie": "Ein besonderer Ausflug zusammen gewählt (Zoo, Park, Schwimmbad…)."
});

/* ---- Réorganisation des onglets : teaser "ça arrive" ---- */
Object.assign(I18N.fr, { "soon.titre": "Oups, ça arrive ! 🚧", "soon.texte": "D'autres surprises pour la famille arrivent bientôt. Reste connecté·e ! 🎉" });
Object.assign(I18N.en, { "soon.titre": "Oops, coming soon! 🚧", "soon.texte": "More family surprises are on the way. Stay tuned! 🎉" });
Object.assign(I18N.nl, { "soon.titre": "Oeps, komt eraan! 🚧", "soon.texte": "Meer gezinsverrassingen zijn onderweg. Blijf kijken! 🎉" });
Object.assign(I18N.de, { "soon.titre": "Hoppla, kommt bald! 🚧", "soon.texte": "Weitere Familienüberraschungen sind unterwegs. Bleib dran! 🎉" });

/* ---- Cartes surprises : mode mystère + don de 10 ---- */
Object.assign(I18N.fr, { "cs.mystere": "Carte mystère", "cs.mystere_sous": "Remplissez la jauge ensemble pour la découvrir ! 🎁", "cs.donner10": "Donner 10 💛" });
Object.assign(I18N.en, { "cs.mystere": "Mystery card", "cs.mystere_sous": "Fill the bar together to reveal it! 🎁", "cs.donner10": "Give 10 💛" });
Object.assign(I18N.nl, { "cs.mystere": "Mysteriekaart", "cs.mystere_sous": "Vul samen de balk om hem te onthullen! 🎁", "cs.donner10": "Geef 10 💛" });
Object.assign(I18N.de, { "cs.mystere": "Geheimniskarte", "cs.mystere_sous": "Füllt zusammen den Balken, um sie zu enthüllen! 🎁", "cs.donner10": "10 💛 geben" });

/* ---- Badges : "comment l'obtenir" (FR via data.js) ---- */
Object.assign(I18N.en, {
  "badgeC.coeur10": "Earn 10 Hearts in total", "badgeC.coeur50": "Earn 50 Hearts in total",
  "badgeC.eco_p": "Create your 1st plant", "badgeC.eco_h": "Create your 1st herbivore",
  "badgeC.eco_c": "Create your 1st carnivore", "badgeC.eco_chaine": "A plant, a herbivore and a carnivore",
  "badgeC.semaine": "Be active on 7 different days"
});
Object.assign(I18N.nl, {
  "badgeC.coeur10": "Verdien 10 Hartjes in totaal", "badgeC.coeur50": "Verdien 50 Hartjes in totaal",
  "badgeC.eco_p": "Maak je 1e plant", "badgeC.eco_h": "Maak je 1e planteneter",
  "badgeC.eco_c": "Maak je 1e vleeseter", "badgeC.eco_chaine": "Een plant, een planteneter en een vleeseter",
  "badgeC.semaine": "Wees 7 verschillende dagen actief"
});
Object.assign(I18N.de, {
  "badgeC.coeur10": "Verdiene 10 Herzen insgesamt", "badgeC.coeur50": "Verdiene 50 Herzen insgesamt",
  "badgeC.eco_p": "Erschaffe deine 1. Pflanze", "badgeC.eco_h": "Erschaffe deinen 1. Pflanzenfresser",
  "badgeC.eco_c": "Erschaffe deinen 1. Fleischfresser", "badgeC.eco_chaine": "Eine Pflanze, ein Pflanzenfresser und ein Fleischfresser",
  "badgeC.semaine": "Sei an 7 verschiedenen Tagen aktiv"
});

/* ---- Espace parents : titres de groupes ---- */
Object.assign(I18N.fr, { "grp.quotidien": "📋 Aujourd'hui", "grp.papier": "📄 Semaine papier", "grp.activites": "🎁 Activités & récompenses", "grp.enfants": "👧 Mes enfants", "grp.famille": "👪 Famille & invitations", "grp.compte": "⚙️ Mon compte & données", "grp.admin": "🛡️ Admin", "grp.soutien": "💛 Soutien" });
Object.assign(I18N.en, { "grp.quotidien": "📋 Today", "grp.papier": "📄 Paper week", "grp.activites": "🎁 Activities & rewards", "grp.enfants": "👧 My children", "grp.famille": "👪 Family & invitations", "grp.compte": "⚙️ My account & data", "grp.admin": "🛡️ Admin", "grp.soutien": "💛 Support" });
Object.assign(I18N.nl, { "grp.quotidien": "📋 Vandaag", "grp.papier": "📄 Papieren week", "grp.activites": "🎁 Activiteiten & beloningen", "grp.enfants": "👧 Mijn kinderen", "grp.famille": "👪 Gezin & uitnodigingen", "grp.compte": "⚙️ Mijn account & gegevens", "grp.admin": "🛡️ Admin", "grp.soutien": "💛 Steun" });
Object.assign(I18N.de, { "grp.quotidien": "📋 Heute", "grp.papier": "📄 Papierwoche", "grp.activites": "🎁 Aktivitäten & Belohnungen", "grp.enfants": "👧 Meine Kinder", "grp.famille": "👪 Familie & Einladungen", "grp.compte": "⚙️ Mein Konto & Daten", "grp.admin": "🛡️ Admin", "grp.soutien": "💛 Unterstützung" });

/* ---- Semaine papier (suivi sans écran) ---- */
Object.assign(I18N.fr, {
  "papier.titre": "📄 Suivi papier de la semaine",
  "papier.intro": "Pour limiter le temps d'écran : suivez les missions sur papier toute la semaine, puis encodez-les ici une seule fois. L'app sert de mémoire et de statistiques.",
  "papier.format": "Choisis la mise en page à imprimer :", "papier.semaine_actuelle": "semaine en cours",
  "papier.imprimer_jours": "🖨️ Imprimer — 7 cases par jour",
  "papier.imprimer_total": "🖨️ Imprimer — 1 total par semaine",
  "papier.encodage_bientot": "💡 L'encodage de la feuille dans l'app arrive très bientôt.",
  "papier.semaine_du": "Semaine du {a} au {b}",
  "papier.total": "Total",
  "papier.feuille_intro": "Cochez chaque mission accomplie. En fin de semaine, un parent reporte le tout dans l'application (quelques minutes).",
  "papier.feuille_pied": "FamiTeam · fami.team — 💛 cœurs (Famille) · 💧 gouttes (Planète)",
  "papier.popup_bloque": "Autorise les fenêtres pop-up pour générer la feuille.",
  "papier.humeur": "Mon comportement du jour (entoure 😄 😐 😠)", "papier.humeur_jour": "Comment je me suis comporté",
  "papier.encoder_titre": "⌨️ Encoder la feuille de la semaine",
  "papier.encoder_note": "Reporte ici la feuille remplie. Choisis le niveau de détail.",
  "papier.mode_detaille": "Détaillé (stats complètes)", "papier.mode_express": "Express (juste les totaux)",
  "papier.express_note": "Totaux de la semaine pour {prenom} :",
  "papier.express_ajouter": "➕ Ajouter au solde", "papier.express_ok": "Totaux ajoutés pour {prenom} ✅",
  "papier.rien": "Rien à ajouter.", "papier.comportement": "Comportement du jour", "papier.hors_jour": "Jour non prévu pour cette tâche",
  "papier.detaille_note": "Touche une case pour cocher/décocher. Le comportement passe par 😄 → 😐 → 😠. Tout est annulable (Actions récentes)."
});
Object.assign(I18N.en, {
  "papier.titre": "📄 Paper tracking for the week",
  "papier.intro": "To limit screen time: track missions on paper all week, then enter them here just once. The app acts as memory and statistics.",
  "papier.format": "Choose the layout to print:", "papier.semaine_actuelle": "current week",
  "papier.imprimer_jours": "🖨️ Print — 7 boxes per day",
  "papier.imprimer_total": "🖨️ Print — 1 weekly total",
  "papier.encodage_bientot": "💡 Entering the sheet into the app is coming very soon.",
  "papier.semaine_du": "Week of {a} to {b}",
  "papier.total": "Total",
  "papier.feuille_intro": "Tick each completed mission. At the end of the week, a parent enters everything into the app (a few minutes).",
  "papier.feuille_pied": "FamiTeam · fami.team — 💛 hearts (Family) · 💧 drops (Planet)",
  "papier.popup_bloque": "Allow pop-ups to generate the sheet.",
  "papier.humeur": "My behavior each day (circle 😄 😐 😠)", "papier.humeur_jour": "How I behaved",
  "papier.encoder_titre": "⌨️ Enter the week's sheet",
  "papier.encoder_note": "Report the completed sheet here. Choose the level of detail.",
  "papier.mode_detaille": "Detailed (full stats)", "papier.mode_express": "Express (totals only)",
  "papier.express_note": "Weekly totals for {prenom}:",
  "papier.express_ajouter": "➕ Add to balance", "papier.express_ok": "Totals added for {prenom} ✅",
  "papier.rien": "Nothing to add.", "papier.comportement": "Daily behavior", "papier.hors_jour": "Day not scheduled for this task",
  "papier.detaille_note": "Tap a box to check/uncheck. Behavior cycles 😄 → 😐 → 😠. Everything is undoable (Recent actions)."
});
Object.assign(I18N.nl, {
  "papier.titre": "📄 Papieren weekoverzicht",
  "papier.intro": "Om schermtijd te beperken: volg de opdrachten de hele week op papier en voer ze hier één keer in. De app dient als geheugen en statistiek.",
  "papier.format": "Kies de af te drukken lay-out:", "papier.semaine_actuelle": "huidige week",
  "papier.imprimer_jours": "🖨️ Afdrukken — 7 vakjes per dag",
  "papier.imprimer_total": "🖨️ Afdrukken — 1 weektotaal",
  "papier.encodage_bientot": "💡 Het invoeren van het blad in de app komt zeer binnenkort.",
  "papier.semaine_du": "Week van {a} tot {b}",
  "papier.total": "Totaal",
  "papier.feuille_intro": "Vink elke voltooide opdracht aan. Aan het einde van de week voert een ouder alles in de app in (een paar minuten).",
  "papier.feuille_pied": "FamiTeam · fami.team — 💛 hartjes (Gezin) · 💧 druppels (Planeet)",
  "papier.popup_bloque": "Sta pop-ups toe om het blad te genereren.",
  "papier.humeur": "Mijn gedrag van de dag (omcirkel 😄 😐 😠)", "papier.humeur_jour": "Hoe ik me gedroeg",
  "papier.encoder_titre": "⌨️ Het weekblad invoeren",
  "papier.encoder_note": "Voer het ingevulde blad hier in. Kies het detailniveau.",
  "papier.mode_detaille": "Gedetailleerd (volledige stats)", "papier.mode_express": "Express (alleen totalen)",
  "papier.express_note": "Weektotalen voor {prenom}:",
  "papier.express_ajouter": "➕ Toevoegen aan saldo", "papier.express_ok": "Totalen toegevoegd voor {prenom} ✅",
  "papier.rien": "Niets toe te voegen.", "papier.comportement": "Gedrag van de dag", "papier.hors_jour": "Dag niet gepland voor deze taak",
  "papier.detaille_note": "Tik op een vakje om aan/uit te vinken. Gedrag wisselt 😄 → 😐 → 😠. Alles is omkeerbaar (Recente acties)."
});
Object.assign(I18N.de, {
  "papier.titre": "📄 Papier-Wochenübersicht",
  "papier.intro": "Um Bildschirmzeit zu begrenzen: Verfolge die Aufgaben die ganze Woche auf Papier und gib sie hier nur einmal ein. Die App dient als Gedächtnis und Statistik.",
  "papier.format": "Wähle das zu druckende Layout:", "papier.semaine_actuelle": "aktuelle Woche",
  "papier.imprimer_jours": "🖨️ Drucken — 7 Kästchen pro Tag",
  "papier.imprimer_total": "🖨️ Drucken — 1 Wochensumme",
  "papier.encodage_bientot": "💡 Die Eingabe des Blatts in die App kommt sehr bald.",
  "papier.semaine_du": "Woche vom {a} bis {b}",
  "papier.total": "Summe",
  "papier.feuille_intro": "Hake jede erledigte Aufgabe ab. Am Wochenende überträgt ein Elternteil alles in die App (ein paar Minuten).",
  "papier.feuille_pied": "FamiTeam · fami.team — 💛 Herzen (Familie) · 💧 Tropfen (Planet)",
  "papier.popup_bloque": "Erlaube Pop-ups, um das Blatt zu erstellen.",
  "papier.humeur": "Mein Verhalten am Tag (kreise 😄 😐 😠 ein)", "papier.humeur_jour": "Wie ich mich verhalten habe",
  "papier.encoder_titre": "⌨️ Das Wochenblatt eingeben",
  "papier.encoder_note": "Übertrage das ausgefüllte Blatt hier. Wähle den Detailgrad.",
  "papier.mode_detaille": "Detailliert (volle Statistik)", "papier.mode_express": "Express (nur Summen)",
  "papier.express_note": "Wochensummen für {prenom}:",
  "papier.express_ajouter": "➕ Zum Guthaben hinzufügen", "papier.express_ok": "Summen für {prenom} hinzugefügt ✅",
  "papier.rien": "Nichts hinzuzufügen.", "papier.comportement": "Verhalten des Tages", "papier.hors_jour": "Tag für diese Aufgabe nicht vorgesehen",
  "papier.detaille_note": "Tippe auf ein Kästchen zum An-/Abhaken. Verhalten wechselt 😄 → 😐 → 😠. Alles ist widerrufbar (Letzte Aktionen)."
});

/* ---- Journal des actions récentes (annulation) ---- */
Object.assign(I18N.fr, { "journal.titre": "↩️ Actions récentes", "journal.vide": "Aucune action récente à annuler.", "journal.note": "Tu peux annuler une action récente. Annuler une action ancienne annule aussi les plus récentes.", "journal.annuler": "Annuler", "journal.confirm_multi": "Cela annulera les {n} dernières actions. Continuer ?" });
Object.assign(I18N.en, { "journal.titre": "↩️ Recent actions", "journal.vide": "No recent action to undo.", "journal.note": "You can undo a recent action. Undoing an older one also undoes the more recent ones.", "journal.annuler": "Undo", "journal.confirm_multi": "This will undo the last {n} actions. Continue?" });
Object.assign(I18N.nl, { "journal.titre": "↩️ Recente acties", "journal.vide": "Geen recente actie om ongedaan te maken.", "journal.note": "Je kunt een recente actie ongedaan maken. Een oudere ongedaan maken doet ook de recentere ongedaan.", "journal.annuler": "Ongedaan", "journal.confirm_multi": "Dit maakt de laatste {n} acties ongedaan. Doorgaan?" });
Object.assign(I18N.de, { "journal.titre": "↩️ Letzte Aktionen", "journal.vide": "Keine kürzliche Aktion zum Rückgängigmachen.", "journal.note": "Du kannst eine kürzliche Aktion rückgängig machen. Eine ältere rückgängig zu machen, macht auch die neueren rückgängig.", "journal.annuler": "Rückgängig", "journal.confirm_multi": "Dies macht die letzten {n} Aktionen rückgängig. Fortfahren?" });

/* ---- Minuteur de temps d'écran + verrouillage PIN ---- */
Object.assign(I18N.fr, {
  "timer.titre": "⏱️ Minuteur d'écran", "timer.intro": "Au bout du temps choisi, l'application se verrouille (code PIN parental pour rouvrir).",
  "timer.duree": "Durée (minutes)", "timer.mode_enfant": "Par enfant (chacun son temps, qui se met en pause en changeant d'enfant et reprend là où il s'était arrêté)", "timer.mode_global": "Global (un seul temps pour tous)",
  "timer.demarrer": "▶️ Démarrer", "timer.lance": "Minuteur lancé ⏱️", "timer.sans_pin": "⚠️ Aucun code PIN défini : pense à en créer un (onglet Activités) pour empêcher le déverrouillage.",
  "timer.arret_titre": "Arrêter le minuteur", "timer.arret_pin": "Saisis le code PIN parental pour arrêter.", "timer.arret_confirm": "Arrêter le minuteur ?", "timer.pin_faux": "Code PIN incorrect 🔒",
  "timer.opt_titre": "⏱️ Minuteur", "timer.opt_arreter": "⏹️ Arrêter le minuteur", "timer.opt_ajouter": "Ou remettre du temps (+{min} min) :", "timer.opt_plus": "➕ Ajouter {min} min", "timer.temps_ajoute": "+{min} min ajoutées ⏱️", "timer.temps_ajoute_enf": "+{min} min pour {prenom} ⏱️",
  "verrou.titre": "Temps écoulé !", "verrou.texte": "C'est l'heure de faire une pause 😊 Demande à un parent pour continuer.", "verrou.sans_pin": "Aucun code PIN défini : tu peux déverrouiller directement.", "verrou.bouton": "🔓 Déverrouiller (parent)", "verrou.pin_titre": "🔒 Code PIN parental",
  "choix.titre": "Temps écoulé pour cet enfant !", "choix.texte": "Qui veut continuer ? (temps restant indiqué)", "choix.arreter": "Arrêter le minuteur",
  "prep.titre": "À toi, {prenom} !", "prep.sous": "Prépare-toi… ton temps démarre tout de suite 😊"
});
Object.assign(I18N.en, {
  "timer.titre": "⏱️ Screen timer", "timer.intro": "When the time is up, the app locks (parental PIN to reopen).",
  "timer.duree": "Duration (minutes)", "timer.mode_enfant": "Per child (each their own time; pauses when switching child and resumes where it left off)", "timer.mode_global": "Global (one shared time)",
  "timer.demarrer": "▶️ Start", "timer.lance": "Timer started ⏱️", "timer.sans_pin": "⚠️ No PIN set: create one (Activities tab) to prevent unlocking.",
  "timer.arret_titre": "Stop the timer", "timer.arret_pin": "Enter the parental PIN to stop.", "timer.arret_confirm": "Stop the timer?", "timer.pin_faux": "Wrong PIN 🔒",
  "timer.opt_titre": "⏱️ Timer", "timer.opt_arreter": "⏹️ Stop the timer", "timer.opt_ajouter": "Or add more time (+{min} min):", "timer.opt_plus": "➕ Add {min} min", "timer.temps_ajoute": "+{min} min added ⏱️", "timer.temps_ajoute_enf": "+{min} min for {prenom} ⏱️",
  "verrou.titre": "Time's up!", "verrou.texte": "Time for a break 😊 Ask a parent to continue.", "verrou.sans_pin": "No PIN set: you can unlock directly.", "verrou.bouton": "🔓 Unlock (parent)", "verrou.pin_titre": "🔒 Parental PIN",
  "choix.titre": "Time's up for this child!", "choix.texte": "Who wants to continue? (remaining time shown)", "choix.arreter": "Stop the timer",
  "prep.titre": "Your turn, {prenom}!", "prep.sous": "Get ready… your time starts now 😊"
});
Object.assign(I18N.nl, {
  "timer.titre": "⏱️ Schermtimer", "timer.intro": "Als de tijd om is, vergrendelt de app (ouderlijke PIN om te heropenen).",
  "timer.duree": "Duur (minuten)", "timer.mode_enfant": "Per kind (elk eigen tijd; pauzeert bij wisselen van kind en gaat verder waar het stopte)", "timer.mode_global": "Globaal (één gedeelde tijd)",
  "timer.demarrer": "▶️ Starten", "timer.lance": "Timer gestart ⏱️", "timer.sans_pin": "⚠️ Geen PIN ingesteld: maak er een aan (tabblad Activiteiten) om ontgrendelen te voorkomen.",
  "timer.arret_titre": "Timer stoppen", "timer.arret_pin": "Voer de ouderlijke PIN in om te stoppen.", "timer.arret_confirm": "Timer stoppen?", "timer.pin_faux": "Verkeerde PIN 🔒",
  "timer.opt_titre": "⏱️ Timer", "timer.opt_arreter": "⏹️ Timer stoppen", "timer.opt_ajouter": "Of tijd bijgeven (+{min} min):", "timer.opt_plus": "➕ {min} min toevoegen", "timer.temps_ajoute": "+{min} min toegevoegd ⏱️", "timer.temps_ajoute_enf": "+{min} min voor {prenom} ⏱️",
  "verrou.titre": "Tijd is om!", "verrou.texte": "Tijd voor een pauze 😊 Vraag een ouder om door te gaan.", "verrou.sans_pin": "Geen PIN ingesteld: je kunt direct ontgrendelen.", "verrou.bouton": "🔓 Ontgrendelen (ouder)", "verrou.pin_titre": "🔒 Ouderlijke PIN",
  "choix.titre": "Tijd is om voor dit kind!", "choix.texte": "Wie wil verdergaan? (resterende tijd weergegeven)", "choix.arreter": "Timer stoppen",
  "prep.titre": "Jouw beurt, {prenom}!", "prep.sous": "Maak je klaar… je tijd start zo 😊"
});
Object.assign(I18N.de, {
  "timer.titre": "⏱️ Bildschirm-Timer", "timer.intro": "Wenn die Zeit um ist, sperrt sich die App (Eltern-PIN zum Wiederöffnen).",
  "timer.duree": "Dauer (Minuten)", "timer.mode_enfant": "Pro Kind (jedes eigene Zeit; pausiert beim Wechsel und macht dort weiter, wo es aufgehört hat)", "timer.mode_global": "Global (eine gemeinsame Zeit)",
  "timer.demarrer": "▶️ Starten", "timer.lance": "Timer gestartet ⏱️", "timer.sans_pin": "⚠️ Keine PIN festgelegt: Lege eine an (Tab Aktivitäten), um das Entsperren zu verhindern.",
  "timer.arret_titre": "Timer stoppen", "timer.arret_pin": "Gib die Eltern-PIN ein, um zu stoppen.", "timer.arret_confirm": "Timer stoppen?", "timer.pin_faux": "Falsche PIN 🔒",
  "timer.opt_titre": "⏱️ Timer", "timer.opt_arreter": "⏹️ Timer stoppen", "timer.opt_ajouter": "Oder Zeit hinzufügen (+{min} Min):", "timer.opt_plus": "➕ {min} Min hinzufügen", "timer.temps_ajoute": "+{min} Min hinzugefügt ⏱️", "timer.temps_ajoute_enf": "+{min} Min für {prenom} ⏱️",
  "verrou.titre": "Zeit ist um!", "verrou.texte": "Zeit für eine Pause 😊 Frag ein Elternteil, um weiterzumachen.", "verrou.sans_pin": "Keine PIN festgelegt: Du kannst direkt entsperren.", "verrou.bouton": "🔓 Entsperren (Eltern)", "verrou.pin_titre": "🔒 Eltern-PIN",
  "choix.titre": "Zeit ist um für dieses Kind!", "choix.texte": "Wer möchte weitermachen? (verbleibende Zeit angezeigt)", "choix.arreter": "Timer stoppen",
  "prep.titre": "Du bist dran, {prenom}!", "prep.sous": "Mach dich bereit… deine Zeit startet gleich 😊"
});

/* ---- Réinitialisation du code PIN parental oublié (par e-mail) ---- */
Object.assign(I18N.fr, {
  "pin.oublie": "Code PIN oublié ?",
  "pin.reset_pas_email": "Aucune adresse e-mail de compte trouvée.",
  "pin.reset_envoi": "Envoi du code par e-mail…",
  "pin.reset_echec": "Échec de l'envoi de l'e-mail. {detail}",
  "pin.reset_sujet": "Réinitialisation de ton code PIN parental",
  "pin.reset_corps": "Bonjour,\n\nVoici ton code de vérification pour réinitialiser le code PIN parental de {app} : {code}\n\nSaisis ce code dans l'application pour choisir un nouveau code PIN.\nSi tu n'es pas à l'origine de cette demande, ignore cet e-mail.",
  "pin.reset_titre": "📧 Code reçu par e-mail",
  "pin.reset_sous": "Saisis le code envoyé à {email}.",
  "pin.reset_code_faux": "Code incorrect ✋",
  "pin.nouveau_titre": "🔑 Nouveau code PIN",
  "pin.nouveau_sous": "Choisis un nouveau code (laisse vide pour supprimer le PIN).",
  "pin.maj_ok": "Nouveau code PIN enregistré 🔒", "pin.efface_ok": "Code PIN supprimé",
  "pin.faux": "❌ Code PIN incorrect. Réessaie ou réinitialise-le ci-dessous."
});
Object.assign(I18N.en, {
  "pin.oublie": "Forgot your PIN?",
  "pin.reset_pas_email": "No account email address found.",
  "pin.reset_envoi": "Sending the code by email…",
  "pin.reset_echec": "Failed to send the email. {detail}",
  "pin.reset_sujet": "Reset your parental PIN",
  "pin.reset_corps": "Hello,\n\nHere is your verification code to reset the {app} parental PIN: {code}\n\nEnter this code in the app to choose a new PIN.\nIf you didn't request this, just ignore this email.",
  "pin.reset_titre": "📧 Code received by email",
  "pin.reset_sous": "Enter the code sent to {email}.",
  "pin.reset_code_faux": "Wrong code ✋",
  "pin.nouveau_titre": "🔑 New PIN",
  "pin.nouveau_sous": "Choose a new code (leave empty to remove the PIN).",
  "pin.maj_ok": "New PIN saved 🔒", "pin.efface_ok": "PIN removed",
  "pin.faux": "❌ Wrong PIN. Try again or reset it below."
});
Object.assign(I18N.nl, {
  "pin.oublie": "PIN vergeten?",
  "pin.reset_pas_email": "Geen e-mailadres van account gevonden.",
  "pin.reset_envoi": "Code per e-mail versturen…",
  "pin.reset_echec": "Verzenden van e-mail mislukt. {detail}",
  "pin.reset_sujet": "Je ouderlijke PIN opnieuw instellen",
  "pin.reset_corps": "Hallo,\n\nHier is je verificatiecode om de ouderlijke PIN van {app} opnieuw in te stellen: {code}\n\nVoer deze code in de app in om een nieuwe PIN te kiezen.\nHeb je dit niet aangevraagd, negeer dan deze e-mail.",
  "pin.reset_titre": "📧 Code per e-mail ontvangen",
  "pin.reset_sous": "Voer de code in die naar {email} is gestuurd.",
  "pin.reset_code_faux": "Verkeerde code ✋",
  "pin.nouveau_titre": "🔑 Nieuwe PIN",
  "pin.nouveau_sous": "Kies een nieuwe code (laat leeg om de PIN te verwijderen).",
  "pin.maj_ok": "Nieuwe PIN opgeslagen 🔒", "pin.efface_ok": "PIN verwijderd",
  "pin.faux": "❌ Verkeerde PIN. Probeer opnieuw of stel hem hieronder opnieuw in."
});
Object.assign(I18N.de, {
  "pin.oublie": "PIN vergessen?",
  "pin.reset_pas_email": "Keine Konto-E-Mail-Adresse gefunden.",
  "pin.reset_envoi": "Code wird per E-Mail gesendet…",
  "pin.reset_echec": "E-Mail konnte nicht gesendet werden. {detail}",
  "pin.reset_sujet": "Eltern-PIN zurücksetzen",
  "pin.reset_corps": "Hallo,\n\nHier ist dein Bestätigungscode, um die Eltern-PIN von {app} zurückzusetzen: {code}\n\nGib diesen Code in der App ein, um eine neue PIN zu wählen.\nWenn du das nicht angefordert hast, ignoriere diese E-Mail.",
  "pin.reset_titre": "📧 Code per E-Mail erhalten",
  "pin.reset_sous": "Gib den an {email} gesendeten Code ein.",
  "pin.reset_code_faux": "Falscher Code ✋",
  "pin.nouveau_titre": "🔑 Neue PIN",
  "pin.nouveau_sous": "Wähle einen neuen Code (leer lassen, um die PIN zu entfernen).",
  "pin.maj_ok": "Neue PIN gespeichert 🔒", "pin.efface_ok": "PIN entfernt",
  "pin.faux": "❌ Falsche PIN. Versuche es erneut oder setze sie unten zurück."
});

/* ---- Cartes surprises : visible/mystère ---- */
Object.assign(I18N.fr, { "cs.revele_label": "Activité visible par les enfants (sinon : surprise mystère 🎁)" });
Object.assign(I18N.en, { "cs.revele_label": "Activity visible to children (otherwise: mystery surprise 🎁)" });
Object.assign(I18N.nl, { "cs.revele_label": "Activiteit zichtbaar voor kinderen (anders: mysterieverrassing 🎁)" });
Object.assign(I18N.de, { "cs.revele_label": "Aktivität für Kinder sichtbar (sonst: Geheimnis-Überraschung 🎁)" });

/* ---- Cartes surprises : bibliothèque d'idées (parentalité positive) ---- */
Object.assign(I18N.fr, {
  "cs.idees_titre": "💡 Idées d'activités (parentalité positive)",
  "cs.idees_sous": "Des idées prêtes à l'emploi, essayées en famille. Touche ＋ pour l'ajouter.",
  "cs.taille_petite": "🟢 Petites (rapides, quotidiennes)",
  "cs.taille_moyenne": "🟡 Moyennes (sorties & projets)",
  "cs.taille_grande": "🔴 Grandes (grandes expériences)"
});
Object.assign(I18N.en, {
  "cs.idees_titre": "💡 Activity ideas (positive parenting)",
  "cs.idees_sous": "Ready-made ideas, tried out at home. Tap ＋ to add.",
  "cs.taille_petite": "🟢 Small (quick, everyday)",
  "cs.taille_moyenne": "🟡 Medium (outings & projects)",
  "cs.taille_grande": "🔴 Big (big experiences)",
  "idee.idc_histoire": "Special bedtime story", "ideeAct.idc_histoire": "Each child picks a book and we read all snuggled up together.",
  "idee.idc_cuisine": "Little chef workshop", "ideeAct.idc_cuisine": "We bake a snack or cookies together and enjoy them.",
  "idee.idc_jeux": "Board game night", "ideeAct.idc_jeux": "We get out the games and play all together (screen-free).",
  "idee.idc_boum": "Living-room dance party", "ideeAct.idc_boum": "Everyone picks a song and we dance like crazy!",
  "idee.idc_cabane": "Blanket fort adventure", "ideeAct.idc_cabane": "We build a fort (cushions/tent) and spend the evening in it.",
  "idee.idc_creatif": "Big arts & crafts session", "ideeAct.idc_creatif": "Painting, crafts, modelling clay: we create all together.",
  "idee.idc_velo": "Bike ride / nature walk", "ideeAct.idc_velo": "A bike ride or a walk to explore nature.",
  "idee.idc_picnic": "Picnic in the park", "ideeAct.idc_picnic": "We pack a basket and go play and eat outside.",
  "idee.idc_parc": "Theme park day", "ideeAct.idc_parc": "A big day of adventure and rides as a family.",
  "idee.idc_zoo": "Zoo or aquarium", "ideeAct.idc_zoo": "We go watch the animals and discover lots of things.",
  "idee.idc_eau": "Pool / beach day", "ideeAct.idc_eau": "Swimming, water games and sandcastles together.",
  "idee.idc_cine": "Cinema + a bite to eat", "ideeAct.idc_cine": "A movie at the cinema followed by a meal the kids choose."
});
Object.assign(I18N.nl, {
  "cs.idees_titre": "💡 Activiteitenideeën (positief opvoeden)",
  "cs.idees_sous": "Kant-en-klare ideeën, thuis uitgeprobeerd. Tik op ＋ om toe te voegen.",
  "cs.taille_petite": "🟢 Klein (snel, dagelijks)",
  "cs.taille_moyenne": "🟡 Middel (uitjes & projecten)",
  "cs.taille_grande": "🔴 Groot (grote ervaringen)",
  "idee.idc_histoire": "Speciaal verhaaltje voor het slapen", "ideeAct.idc_histoire": "Elk kind kiest een boek en we lezen lekker samen knus.",
  "idee.idc_cuisine": "Kleine-chef workshop", "ideeAct.idc_cuisine": "We bakken samen een hapje of koekjes en smullen ervan.",
  "idee.idc_jeux": "Bordspelavond", "ideeAct.idc_jeux": "We pakken de spellen en spelen samen (zonder scherm).",
  "idee.idc_boum": "Dansfeest in de woonkamer", "ideeAct.idc_boum": "Iedereen kiest een liedje en we dansen als gekken!",
  "idee.idc_cabane": "Hut & avontuurnacht", "ideeAct.idc_cabane": "We bouwen een hut (kussens/tent) en brengen er de avond door.",
  "idee.idc_creatif": "Grote knutselsessie", "ideeAct.idc_creatif": "Schilderen, knutselen, klei: we maken samen iets.",
  "idee.idc_velo": "Fietstocht / natuurwandeling", "ideeAct.idc_velo": "Een fietstocht of wandeling om de natuur te ontdekken.",
  "idee.idc_picnic": "Picknick in het park", "ideeAct.idc_picnic": "We maken een mand klaar en gaan buiten spelen en eten.",
  "idee.idc_parc": "Pretparkdag", "ideeAct.idc_parc": "Een grote dag vol avontuur en attracties met het gezin.",
  "idee.idc_zoo": "Dierentuin of aquarium", "ideeAct.idc_zoo": "We gaan dieren bekijken en ontdekken van alles.",
  "idee.idc_eau": "Zwembad- / stranddag", "ideeAct.idc_eau": "Zwemmen, waterspelletjes en zandkastelen samen.",
  "idee.idc_cine": "Bioscoop + hapje eten", "ideeAct.idc_cine": "Een film in de bioscoop en daarna een maaltijd gekozen door de kinderen."
});
Object.assign(I18N.de, {
  "cs.idees_titre": "💡 Aktivitätsideen (positive Erziehung)",
  "cs.idees_sous": "Fertige Ideen, in der Familie erprobt. Tippe auf ＋ zum Hinzufügen.",
  "cs.taille_petite": "🟢 Klein (schnell, täglich)",
  "cs.taille_moyenne": "🟡 Mittel (Ausflüge & Projekte)",
  "cs.taille_grande": "🔴 Groß (große Erlebnisse)",
  "idee.idc_histoire": "Besondere Gute-Nacht-Geschichte", "ideeAct.idc_histoire": "Jedes Kind wählt ein Buch und wir lesen alle zusammen gekuschelt.",
  "idee.idc_cuisine": "Kleiner-Koch-Werkstatt", "ideeAct.idc_cuisine": "Wir backen zusammen einen Snack oder Kekse und genießen sie.",
  "idee.idc_jeux": "Brettspielabend", "ideeAct.idc_jeux": "Wir holen die Spiele raus und spielen zusammen (ohne Bildschirm).",
  "idee.idc_boum": "Tanzparty im Wohnzimmer", "ideeAct.idc_boum": "Jeder wählt ein Lied und wir tanzen wie verrückt!",
  "idee.idc_cabane": "Höhle & Abenteuernacht", "ideeAct.idc_cabane": "Wir bauen eine Höhle (Kissen/Zelt) und verbringen den Abend darin.",
  "idee.idc_creatif": "Großer Bastel-Workshop", "ideeAct.idc_creatif": "Malen, basteln, Knete: wir gestalten zusammen.",
  "idee.idc_velo": "Radtour / Naturspaziergang", "ideeAct.idc_velo": "Eine Radtour oder ein Spaziergang, um die Natur zu entdecken.",
  "idee.idc_picnic": "Picknick im Park", "ideeAct.idc_picnic": "Wir packen einen Korb und gehen draußen spielen und essen.",
  "idee.idc_parc": "Freizeitpark-Tag", "ideeAct.idc_parc": "Ein großer Tag voller Abenteuer und Fahrgeschäfte als Familie.",
  "idee.idc_zoo": "Zoo oder Aquarium", "ideeAct.idc_zoo": "Wir beobachten Tiere und entdecken viele Dinge.",
  "idee.idc_eau": "Schwimmbad- / Strandtag", "ideeAct.idc_eau": "Schwimmen, Wasserspiele und Sandburgen zusammen.",
  "idee.idc_cine": "Kino + Essen gehen", "ideeAct.idc_cine": "Ein Kinofilm und danach ein Essen, das die Kinder auswählen."
});

/* ---- Nouveaux badges (noms + indices) ---- */
Object.assign(I18N.en, {
  "badge.coeur100": "Heart treasure", "badge.goutte10": "Little spring", "badge.goutte50": "Mighty river",
  "badge.eco_10": "Living little world", "badge.eco_25": "Nature guardian", "badge.mois": "A month of effort",
  "badge.don_coeur": "Sharing heart", "badge.equipe": "Team spirit",
  "badgeC.coeur100": "Earn 100 Hearts in total", "badgeC.goutte10": "Earn 10 Drops in total",
  "badgeC.goutte50": "Earn 50 Drops in total", "badgeC.eco_10": "Create 10 living beings",
  "badgeC.eco_25": "Create 25 living beings", "badgeC.mois": "Be active on 30 different days",
  "badgeC.don_coeur": "Give Hearts to a FamiTeam card", "badgeC.equipe": "Help unlock a FamiTeam card"
});
Object.assign(I18N.nl, {
  "badge.coeur100": "Hartenschat", "badge.goutte10": "Klein bronnetje", "badge.goutte50": "Grote rivier",
  "badge.eco_10": "Kleine levende wereld", "badge.eco_25": "Natuurbeschermer", "badge.mois": "Een maand inzet",
  "badge.don_coeur": "Deelhart", "badge.equipe": "Teamgeest",
  "badgeC.coeur100": "Verdien 100 Hartjes in totaal", "badgeC.goutte10": "Verdien 10 Druppels in totaal",
  "badgeC.goutte50": "Verdien 50 Druppels in totaal", "badgeC.eco_10": "Maak 10 levende wezens",
  "badgeC.eco_25": "Maak 25 levende wezens", "badgeC.mois": "Wees 30 verschillende dagen actief",
  "badgeC.don_coeur": "Geef Hartjes aan een FamiTeam-kaart", "badgeC.equipe": "Help een FamiTeam-kaart vrij te spelen"
});
Object.assign(I18N.de, {
  "badge.coeur100": "Herzschatz", "badge.goutte10": "Kleine Quelle", "badge.goutte50": "Großer Fluss",
  "badge.eco_10": "Kleine lebendige Welt", "badge.eco_25": "Naturhüter", "badge.mois": "Ein Monat Einsatz",
  "badge.don_coeur": "Teilendes Herz", "badge.equipe": "Teamgeist",
  "badgeC.coeur100": "Verdiene 100 Herzen insgesamt", "badgeC.goutte10": "Verdiene 10 Tropfen insgesamt",
  "badgeC.goutte50": "Verdiene 50 Tropfen insgesamt", "badgeC.eco_10": "Erschaffe 10 Lebewesen",
  "badgeC.eco_25": "Erschaffe 25 Lebewesen", "badgeC.mois": "Sei an 30 verschiedenen Tagen aktiv",
  "badgeC.don_coeur": "Gib Herzen für eine FamiTeam-Karte", "badgeC.equipe": "Hilf, eine FamiTeam-Karte freizuschalten"
});

/* ---- Module signalement bug / suggestion (early adopters) ---- */
Object.assign(I18N.fr, {
  "fb.titre": "🐞 Signaler un bug / 💡 Suggestion",
  "fb.sous": "Une idée, un souci ? Écrivez-le ici : tout est lu et alimente les mises à jour.",
  "fb.type_bug": "🐞 Bug", "fb.type_suggestion": "💡 Suggestion",
  "fb.message_ph": "Décris le bug ou ta suggestion…",
  "fb.envoyer": "Envoyer",
  "fb.vide": "Écris d'abord ton message.", "fb.merci": "Merci ! Votre message est bien arrivé.",
  "fb.plus_tard": "Merci ! Votre message est enregistré et partira dès le retour de la connexion."
});
Object.assign(I18N.en, {
  "fb.titre": "🐞 Report a bug / 💡 Suggestion",
  "fb.sous": "An idea, a problem? Write it here: everything is read and feeds the updates.",
  "fb.type_bug": "🐞 Bug", "fb.type_suggestion": "💡 Suggestion",
  "fb.message_ph": "Describe the bug or your suggestion…",
  "fb.envoyer": "Send",
  "fb.vide": "Write your message first.", "fb.merci": "Thanks! Your message arrived safely.",
  "fb.plus_tard": "Thanks! Your message is saved and will be sent as soon as you are back online."
});
Object.assign(I18N.nl, {
  "fb.titre": "🐞 Bug melden / 💡 Suggestie",
  "fb.sous": "Een idee of een probleem? Schrijf het hier: alles wordt gelezen en voedt de updates.",
  "fb.type_bug": "🐞 Bug", "fb.type_suggestion": "💡 Suggestie",
  "fb.message_ph": "Beschrijf de bug of je suggestie…",
  "fb.envoyer": "Versturen",
  "fb.vide": "Schrijf eerst je bericht.", "fb.merci": "Bedankt! Je bericht is goed aangekomen.",
  "fb.plus_tard": "Bedankt! Je bericht is bewaard en vertrekt zodra je weer online bent."
});
Object.assign(I18N.de, {
  "fb.titre": "🐞 Fehler melden / 💡 Vorschlag",
  "fb.sous": "Eine Idee oder ein Problem? Schreib es hier: alles wird gelesen und fließt in die Updates ein.",
  "fb.type_bug": "🐞 Fehler", "fb.type_suggestion": "💡 Vorschlag",
  "fb.message_ph": "Beschreibe den Fehler oder deinen Vorschlag…",
  "fb.envoyer": "Senden",
  "fb.vide": "Schreibe zuerst deine Nachricht.", "fb.merci": "Danke! Deine Nachricht ist gut angekommen.",
  "fb.plus_tard": "Danke! Deine Nachricht ist gespeichert und geht raus, sobald du wieder online bist."
});

/* ---- Cartes surprises : idées supplémentaires (traductions) ---- */
Object.assign(I18N.en, {
  "idee.idc_dessin": "Funny drawing contest", "ideeAct.idc_dessin": "We draw on a funny theme and show off our masterpieces.",
  "idee.idc_chasse": "Indoor treasure hunt", "ideeAct.idc_chasse": "Parents hide clues and we hunt for a little treasure.",
  "idee.idc_massage": "Cuddle & massage time", "ideeAct.idc_massage": "Gentle little massages and big hugs to calm music.",
  "idee.idc_yoga": "Animal yoga", "ideeAct.idc_yoga": "We copy animals doing funny yoga poses.",
  "idee.idc_photo": "Silly photo shoot", "ideeAct.idc_photo": "We make funny faces and poses for keepsake photos.",
  "idee.idc_gratitude": "Thank-you circle", "ideeAct.idc_gratitude": "Everyone says what they're proud of and thanks a family member.",
  "idee.idc_pyjama": "Pyjama & cosy night", "ideeAct.idc_pyjama": "Everyone in pyjamas, hot chocolate and little stories.",
  "idee.idc_bulles": "Bubble battle", "ideeAct.idc_bulles": "We blow soap bubbles and try to catch them.",
  "idee.idc_cinemaison": "Movie night at home", "ideeAct.idc_cinemaison": "We pick a film together, with popcorn and a blanket.",
  "idee.idc_jardin": "Let's plant together", "ideeAct.idc_jardin": "We plant seeds or take care of the garden and plants.",
  "idee.idc_patisserie": "Big baking session", "ideeAct.idc_patisserie": "We make a cake or cupcakes to decorate together.",
  "idee.idc_musee": "Museum visit", "ideeAct.idc_musee": "We explore a museum suited for children.",
  "idee.idc_ferme": "Farm visit", "ideeAct.idc_ferme": "We go see and feed the farm animals.",
  "idee.idc_oiseaux": "Bird house", "ideeAct.idc_oiseaux": "We build a nest box or a bird feeder.",
  "idee.idc_spectacle": "Home show", "ideeAct.idc_spectacle": "We prepare a little show (dance, theatre, magic) and perform it.",
  "idee.idc_bowling": "Bowling afternoon", "ideeAct.idc_bowling": "We go play a game of bowling all together.",
  "idee.idc_patinoire": "Ice skating outing", "ideeAct.idc_patinoire": "We put on skates and glide all together.",
  "idee.idc_mer": "Day at the seaside", "ideeAct.idc_mer": "A big beach day: sandcastles, swimming and ice cream.",
  "idee.idc_rando": "Nature hike & picnic", "ideeAct.idc_rando": "A big forest or mountain walk, with a picnic.",
  "idee.idc_safari": "Wildlife park / safari", "ideeAct.idc_safari": "We go watch bigger animals in a park.",
  "idee.idc_trampoline": "Trampoline park", "ideeAct.idc_trampoline": "A day jumping and climbing at an indoor park.",
  "idee.idc_train": "Train adventure", "ideeAct.idc_train": "We take the train to discover a new city.",
  "idee.idc_hotel": "Adventure night away", "ideeAct.idc_hotel": "A special night at a hotel or camping, a family adventure."
});
Object.assign(I18N.nl, {
  "idee.idc_dessin": "Grappige tekenwedstrijd", "ideeAct.idc_dessin": "We tekenen op een grappig thema en tonen onze meesterwerken.",
  "idee.idc_chasse": "Schattenjacht binnen", "ideeAct.idc_chasse": "Ouders verstoppen aanwijzingen en we zoeken een kleine schat.",
  "idee.idc_massage": "Knuffel- & massagemoment", "ideeAct.idc_massage": "Zachte massages en dikke knuffels op rustige muziek.",
  "idee.idc_yoga": "Dierenyoga", "ideeAct.idc_yoga": "We doen dieren na met grappige yogahoudingen.",
  "idee.idc_photo": "Gekke fotoshoot", "ideeAct.idc_photo": "We trekken gekke bekken en poses voor herinneringsfoto's.",
  "idee.idc_gratitude": "Dankjewel-kring", "ideeAct.idc_gratitude": "Iedereen zegt waar hij trots op is en bedankt een gezinslid.",
  "idee.idc_pyjama": "Pyjama- & knusavond", "ideeAct.idc_pyjama": "Iedereen in pyjama, warme chocomelk en verhaaltjes.",
  "idee.idc_bulles": "Bellengevecht", "ideeAct.idc_bulles": "We blazen zeepbellen en proberen ze te vangen.",
  "idee.idc_cinemaison": "Filmavond thuis", "ideeAct.idc_cinemaison": "We kiezen samen een film, met popcorn en een dekentje.",
  "idee.idc_jardin": "Samen planten", "ideeAct.idc_jardin": "We planten zaadjes of zorgen voor de tuin en de planten.",
  "idee.idc_patisserie": "Grote baksessie", "ideeAct.idc_patisserie": "We maken samen een taart of cupcakes om te versieren.",
  "idee.idc_musee": "Museumbezoek", "ideeAct.idc_musee": "We ontdekken een museum geschikt voor kinderen.",
  "idee.idc_ferme": "Boerderijbezoek", "ideeAct.idc_ferme": "We gaan de boerderijdieren bekijken en voeren.",
  "idee.idc_oiseaux": "Vogelhuisje", "ideeAct.idc_oiseaux": "We knutselen een nestkastje of voederplankje voor vogels.",
  "idee.idc_spectacle": "Huisvoorstelling", "ideeAct.idc_spectacle": "We maken een kleine show (dans, theater, goochelen) en spelen die.",
  "idee.idc_bowling": "Bowlingnamiddag", "ideeAct.idc_bowling": "We gaan samen een partijtje bowlen.",
  "idee.idc_patinoire": "Schaatsuitje", "ideeAct.idc_patinoire": "We trekken de schaatsen aan en glijden samen.",
  "idee.idc_mer": "Dag aan zee", "ideeAct.idc_mer": "Een grote stranddag: zandkastelen, zwemmen en ijsjes.",
  "idee.idc_rando": "Natuurwandeling & picknick", "ideeAct.idc_rando": "Een grote bos- of bergwandeling, met picknick.",
  "idee.idc_safari": "Dierenpark / safari", "ideeAct.idc_safari": "We gaan grotere dieren bekijken in een park.",
  "idee.idc_trampoline": "Trampolinepark", "ideeAct.idc_trampoline": "Een dag springen en klimmen in een indoorpark.",
  "idee.idc_train": "Treinavontuur", "ideeAct.idc_train": "We nemen de trein om een nieuwe stad te ontdekken.",
  "idee.idc_hotel": "Avontuurnacht elders", "ideeAct.idc_hotel": "Een speciale nacht in een hotel of camping, een gezinsavontuur."
});
Object.assign(I18N.de, {
  "idee.idc_dessin": "Lustiger Malwettbewerb", "ideeAct.idc_dessin": "Wir malen zu einem lustigen Thema und zeigen unsere Meisterwerke.",
  "idee.idc_chasse": "Schatzsuche drinnen", "ideeAct.idc_chasse": "Eltern verstecken Hinweise und wir suchen einen kleinen Schatz.",
  "idee.idc_massage": "Kuschel- & Massagezeit", "ideeAct.idc_massage": "Sanfte Massagen und dicke Umarmungen zu ruhiger Musik.",
  "idee.idc_yoga": "Tier-Yoga", "ideeAct.idc_yoga": "Wir ahmen Tiere mit lustigen Yoga-Posen nach.",
  "idee.idc_photo": "Lustiges Fotoshooting", "ideeAct.idc_photo": "Wir schneiden Grimassen und posieren für Erinnerungsfotos.",
  "idee.idc_gratitude": "Dankeschön-Kreis", "ideeAct.idc_gratitude": "Jeder sagt, worauf er stolz ist, und dankt einem Familienmitglied.",
  "idee.idc_pyjama": "Pyjama- & Kuschelabend", "ideeAct.idc_pyjama": "Alle im Pyjama, heiße Schokolade und kleine Geschichten.",
  "idee.idc_bulles": "Seifenblasen-Schlacht", "ideeAct.idc_bulles": "Wir pusten Seifenblasen und versuchen, sie zu fangen.",
  "idee.idc_cinemaison": "Filmabend zu Hause", "ideeAct.idc_cinemaison": "Wir wählen zusammen einen Film, mit Popcorn und Decke.",
  "idee.idc_jardin": "Gemeinsam pflanzen", "ideeAct.idc_jardin": "Wir pflanzen Samen oder kümmern uns um Garten und Pflanzen.",
  "idee.idc_patisserie": "Große Backsession", "ideeAct.idc_patisserie": "Wir backen zusammen einen Kuchen oder Cupcakes zum Verzieren.",
  "idee.idc_musee": "Museumsbesuch", "ideeAct.idc_musee": "Wir entdecken ein kinderfreundliches Museum.",
  "idee.idc_ferme": "Bauernhofbesuch", "ideeAct.idc_ferme": "Wir schauen uns die Bauernhoftiere an und füttern sie.",
  "idee.idc_oiseaux": "Vogelhäuschen", "ideeAct.idc_oiseaux": "Wir basteln einen Nistkasten oder ein Futterhaus für Vögel.",
  "idee.idc_spectacle": "Hausvorstellung", "ideeAct.idc_spectacle": "Wir bereiten eine kleine Show vor (Tanz, Theater, Zauberei) und führen sie auf.",
  "idee.idc_bowling": "Bowling-Nachmittag", "ideeAct.idc_bowling": "Wir spielen zusammen eine Runde Bowling.",
  "idee.idc_patinoire": "Schlittschuh-Ausflug", "ideeAct.idc_patinoire": "Wir ziehen die Schlittschuhe an und gleiten zusammen.",
  "idee.idc_mer": "Tag am Meer", "ideeAct.idc_mer": "Ein großer Strandtag: Sandburgen, Schwimmen und Eis.",
  "idee.idc_rando": "Naturwanderung & Picknick", "ideeAct.idc_rando": "Eine große Wald- oder Bergwanderung mit Picknick.",
  "idee.idc_safari": "Tierpark / Safari", "ideeAct.idc_safari": "Wir beobachten größere Tiere in einem Park.",
  "idee.idc_trampoline": "Trampolinpark", "ideeAct.idc_trampoline": "Ein Tag zum Springen und Klettern in einer Indoor-Halle.",
  "idee.idc_train": "Zug-Abenteuer", "ideeAct.idc_train": "Wir nehmen den Zug, um eine neue Stadt zu entdecken.",
  "idee.idc_hotel": "Abenteuernacht woanders", "ideeAct.idc_hotel": "Eine besondere Nacht im Hotel oder Camping, ein Familienabenteuer."
});

/* ---- Cartes surprises : réordonner ---- */
Object.assign(I18N.fr, { "cs.monter": "Monter", "cs.descendre": "Descendre" });
Object.assign(I18N.en, { "cs.monter": "Move up", "cs.descendre": "Move down" });
Object.assign(I18N.nl, { "cs.monter": "Omhoog", "cs.descendre": "Omlaag" });
Object.assign(I18N.de, { "cs.monter": "Nach oben", "cs.descendre": "Nach unten" });

/* ---- Badges : aucun encore gagné ---- */
Object.assign(I18N.fr, { "badges.aucun": "Pas encore de badge… Continue tes belles actions pour en gagner ! ✨" });
Object.assign(I18N.en, { "badges.aucun": "No badge yet… Keep up your great actions to earn some! ✨" });
Object.assign(I18N.nl, { "badges.aucun": "Nog geen badge… Blijf mooie dingen doen om er te verdienen! ✨" });
Object.assign(I18N.de, { "badges.aucun": "Noch kein Abzeichen… Mach weiter so, um welche zu verdienen! ✨" });

/* ---- Espace parents : statistiques ---- */
Object.assign(I18N.fr, {
  "grp.stats": "📊 Statistiques",
  "stats.titre": "📊 Évolution des enfants",
  "stats.sous": "Suis les progrès de chacun : points gagnés, badges, écosystème et régularité.",
  "stats.jours_actifs": "{n} j actifs",
  "stats.points_14j": "Points gagnés (14 derniers jours)",
  "stats.compare": "Cette semaine : {s} pts · semaine précédente : {p} pts",
  "stats.aucune": "Pas encore d'activité enregistrée. Les premiers progrès apparaîtront ici ! ✨"
});
Object.assign(I18N.en, {
  "grp.stats": "📊 Statistics",
  "stats.titre": "📊 Children's progress",
  "stats.sous": "Track everyone's progress: points earned, badges, ecosystem and consistency.",
  "stats.jours_actifs": "{n} active days",
  "stats.points_14j": "Points earned (last 14 days)",
  "stats.compare": "This week: {s} pts · previous week: {p} pts",
  "stats.aucune": "No activity recorded yet. First progress will appear here! ✨"
});
Object.assign(I18N.nl, {
  "grp.stats": "📊 Statistieken",
  "stats.titre": "📊 Vooruitgang van de kinderen",
  "stats.sous": "Volg ieders vooruitgang: verdiende punten, badges, ecosysteem en regelmaat.",
  "stats.jours_actifs": "{n} actieve dgn",
  "stats.points_14j": "Verdiende punten (laatste 14 dagen)",
  "stats.compare": "Deze week: {s} ptn · vorige week: {p} ptn",
  "stats.aucune": "Nog geen activiteit. De eerste vooruitgang verschijnt hier! ✨"
});
Object.assign(I18N.de, {
  "grp.stats": "📊 Statistiken",
  "stats.titre": "📊 Fortschritt der Kinder",
  "stats.sous": "Verfolge den Fortschritt aller: verdiente Punkte, Abzeichen, Ökosystem und Regelmäßigkeit.",
  "stats.jours_actifs": "{n} aktive Tage",
  "stats.points_14j": "Verdiente Punkte (letzte 14 Tage)",
  "stats.compare": "Diese Woche: {s} Pkt · Vorwoche: {p} Pkt",
  "stats.aucune": "Noch keine Aktivität. Der erste Fortschritt erscheint hier! ✨"
});

/* ---- Écosystème : scène vivante (vue d'ensemble fun) ---- */
Object.assign(I18N.fr, { "eco.monde_titre": "🌍 Mon petit monde vivant", "eco.monde_vide": "🌱 Ton monde est encore vide… Crée ta première plante en bas !" });
Object.assign(I18N.en, { "eco.monde_titre": "🌍 My little living world", "eco.monde_vide": "🌱 Your world is still empty… Create your first plant below!" });
Object.assign(I18N.nl, { "eco.monde_titre": "🌍 Mijn kleine levende wereld", "eco.monde_vide": "🌱 Je wereld is nog leeg… Maak hieronder je eerste plant!" });
Object.assign(I18N.de, { "eco.monde_titre": "🌍 Meine kleine lebendige Welt", "eco.monde_vide": "🌱 Deine Welt ist noch leer… Erschaffe unten deine erste Pflanze!" });

/* ---- Statistiques complémentaires (suivi) ---- */
Object.assign(I18N.fr, {
  "stats.serie": "Série {n} j (record {r})", "stats.regularite": "{n}/30 j actifs",
  "stats.moyenne": "{n} pts/j actif", "stats.depuis": "Il y a {n} j", "stats.actif_auj": "Actif aujourd'hui",
  "stats.equilibre": "Équilibre entraide 💛 / planète 💧", "stats.top": "Missions préférées"
});
Object.assign(I18N.en, {
  "stats.serie": "Streak {n} d (best {r})", "stats.regularite": "{n}/30 active d",
  "stats.moyenne": "{n} pts/active d", "stats.depuis": "{n} d ago", "stats.actif_auj": "Active today",
  "stats.equilibre": "Balance helping 💛 / planet 💧", "stats.top": "Favourite missions"
});
Object.assign(I18N.nl, {
  "stats.serie": "Reeks {n} d (record {r})", "stats.regularite": "{n}/30 actieve d",
  "stats.moyenne": "{n} ptn/actieve d", "stats.depuis": "{n} d geleden", "stats.actif_auj": "Vandaag actief",
  "stats.equilibre": "Balans helpen 💛 / planeet 💧", "stats.top": "Favoriete missies"
});
Object.assign(I18N.de, {
  "stats.serie": "Serie {n} T (Rekord {r})", "stats.regularite": "{n}/30 aktive T",
  "stats.moyenne": "{n} Pkt/aktiver T", "stats.depuis": "vor {n} T", "stats.actif_auj": "Heute aktiv",
  "stats.equilibre": "Balance Helfen 💛 / Planet 💧", "stats.top": "Lieblingsmissionen"
});

/* ---- Écosystème : niveaux de décor ---- */
Object.assign(I18N.fr, { "eco.niveau_desert": "🏜️ Désert", "eco.niveau_prairie": "🌳 Prairie", "eco.niveau_foret": "🌲 Forêt luxuriante" });
Object.assign(I18N.en, { "eco.niveau_desert": "🏜️ Desert", "eco.niveau_prairie": "🌳 Meadow", "eco.niveau_foret": "🌲 Lush forest" });
Object.assign(I18N.nl, { "eco.niveau_desert": "🏜️ Woestijn", "eco.niveau_prairie": "🌳 Weide", "eco.niveau_foret": "🌲 Weelderig bos" });
Object.assign(I18N.de, { "eco.niveau_desert": "🏜️ Wüste", "eco.niveau_prairie": "🌳 Wiese", "eco.niveau_foret": "🌲 Üppiger Wald" });

/* ---- Page d'accueil publique (landing) ---- */
Object.assign(I18N.fr, {
  "auth.form_titre": "Se connecter",
  "auth.form_titre_creer": "Crée le compte de ta famille",
  "auth.form_sous_creer": "Choisis ton adresse e-mail et un mot de passe pour lancer ta propre famille.",
  "auth.mdp_ph_creer": "Choisis un mot de passe",
  "auth.hero_titre": "Toute la famille dans la même équipe 💛",
  "auth.hero_sous": "{app} transforme les tâches du quotidien et la protection de la planète en une aventure positive, douce et motivante pour vos enfants.",
  "auth.feat1_t": "Des missions rigolotes", "auth.feat1_d": "Chacun gagne des Cœurs 💛 en aidant à la maison et des Gouttes 💧 en protégeant la nature.",
  "auth.feat2_t": "Des cartes FamiTeam", "auth.feat2_d": "Les enfants coopèrent pour débloquer ensemble de vraies activités en famille.",
  "auth.feat3_t": "Un écosystème vivant", "auth.feat3_d": "Leurs efforts font grandir un petit monde, des plantes jusqu'aux animaux.",
  "auth.feat4_t": "Que du positif", "auth.feat4_d": "Badges, encouragements et « défis réparation » : jamais de punition, on valorise l'effort.",
  "auth.feat5_t": "Sans écran, si vous préférez", "auth.feat5_d": "La semaine se coche à la main sur une feuille imprimée, sur le frigo ; un parent l'encode en une fois. Objectif : 3 minutes d'app par jour, et jamais de notification.",
  "auth.comment_titre": "Comment ça marche ?",
  "auth.etape1": "Crée ta famille et ajoute tes enfants.",
  "auth.etape2": "Les enfants réalisent leurs missions et gagnent des récompenses.",
  "auth.etape3": "Vous débloquez ensemble de beaux moments en famille."
});
Object.assign(I18N.en, {
  "auth.form_titre": "Sign in",
  "auth.form_titre_creer": "Create your family account",
  "auth.form_sous_creer": "Choose your email and a password to start your own family.",
  "auth.mdp_ph_creer": "Choose a password",
  "auth.hero_titre": "The whole family on the same team 💛",
  "auth.hero_sous": "{app} turns everyday chores and protecting the planet into a positive, gentle and motivating adventure for your children.",
  "auth.feat1_t": "Fun missions", "auth.feat1_d": "Everyone earns Hearts 💛 by helping at home and Drops 💧 by protecting nature.",
  "auth.feat2_t": "FamiTeam cards", "auth.feat2_d": "Children cooperate to unlock real family activities together.",
  "auth.feat3_t": "A living ecosystem", "auth.feat3_d": "Their efforts grow a little world, from plants to animals.",
  "auth.feat4_t": "All positive", "auth.feat4_d": "Badges, encouragement and 'repair challenges': no punishment, we value effort.",
  "auth.feat5_t": "Screen-free, if you prefer", "auth.feat5_d": "Tick the week by hand on a printed sheet on the fridge; a parent enters it all in one go. Target: 3 minutes of app a day, and never a notification.",
  "auth.comment_titre": "How does it work?",
  "auth.etape1": "Create your family and add your children.",
  "auth.etape2": "Children complete their missions and earn rewards.",
  "auth.etape3": "Together you unlock lovely family moments."
});
Object.assign(I18N.nl, {
  "auth.form_titre": "Aanmelden",
  "auth.form_titre_creer": "Maak het account van je gezin aan",
  "auth.form_sous_creer": "Kies je e-mailadres en een wachtwoord om je eigen gezin te starten.",
  "auth.mdp_ph_creer": "Kies een wachtwoord",
  "auth.hero_titre": "Het hele gezin in hetzelfde team 💛",
  "auth.hero_sous": "{app} maakt van dagelijkse taken en het beschermen van de planeet een positief, zacht en motiverend avontuur voor je kinderen.",
  "auth.feat1_t": "Leuke missies", "auth.feat1_d": "Iedereen verdient Hartjes 💛 door thuis te helpen en Druppels 💧 door de natuur te beschermen.",
  "auth.feat2_t": "FamiTeam-kaarten", "auth.feat2_d": "Kinderen werken samen om echte gezinsactiviteiten vrij te spelen.",
  "auth.feat3_t": "Een levend ecosysteem", "auth.feat3_d": "Hun inspanningen laten een kleine wereld groeien, van planten tot dieren.",
  "auth.feat4_t": "Alleen positief", "auth.feat4_d": "Badges, aanmoediging en 'herstel-uitdagingen': geen straf, we waarderen inzet.",
  "auth.feat5_t": "Zonder scherm, als u dat verkiest", "auth.feat5_d": "De week wordt met de hand afgevinkt op een geprint blad aan de koelkast; één ouder voert alles in één keer in. Doel: 3 minuten app per dag, en nooit een melding.",
  "auth.comment_titre": "Hoe werkt het?",
  "auth.etape1": "Maak je gezin aan en voeg je kinderen toe.",
  "auth.etape2": "Kinderen voltooien hun missies en verdienen beloningen.",
  "auth.etape3": "Samen ontgrendelen jullie mooie gezinsmomenten."
});
Object.assign(I18N.de, {
  "auth.form_titre": "Anmelden",
  "auth.form_titre_creer": "Erstelle das Konto deiner Familie",
  "auth.form_sous_creer": "Wähle deine E-Mail-Adresse und ein Passwort, um deine eigene Familie zu starten.",
  "auth.mdp_ph_creer": "Wähle ein Passwort",
  "auth.hero_titre": "Die ganze Familie in einem Team 💛",
  "auth.hero_sous": "{app} verwandelt Alltagsaufgaben und den Schutz des Planeten in ein positives, sanftes und motivierendes Abenteuer für deine Kinder.",
  "auth.feat1_t": "Lustige Missionen", "auth.feat1_d": "Jeder verdient Herzen 💛 durch Helfen zu Hause und Tropfen 💧 durch Naturschutz.",
  "auth.feat2_t": "FamiTeam-Karten", "auth.feat2_d": "Kinder arbeiten zusammen, um echte Familienaktivitäten freizuschalten.",
  "auth.feat3_t": "Ein lebendiges Ökosystem", "auth.feat3_d": "Ihre Mühe lässt eine kleine Welt wachsen, von Pflanzen bis zu Tieren.",
  "auth.feat4_t": "Nur Positives", "auth.feat4_d": "Abzeichen, Ermutigung und 'Wiedergutmachungs-Challenges': keine Strafe, wir würdigen den Einsatz.",
  "auth.feat5_t": "Ohne Bildschirm, wenn Sie möchten", "auth.feat5_d": "Die Woche wird von Hand auf einem ausgedruckten Blatt am Kühlschrank abgehakt; ein Elternteil trägt alles auf einmal ein. Ziel: 3 Minuten App pro Tag, und niemals eine Benachrichtigung.",
  "auth.comment_titre": "Wie funktioniert es?",
  "auth.etape1": "Erstelle deine Familie und füge deine Kinder hinzu.",
  "auth.etape2": "Kinder erfüllen ihre Missionen und verdienen Belohnungen.",
  "auth.etape3": "Gemeinsam schaltet ihr schöne Familienmomente frei."
});

/* ---- Soutien / don (facultatif) ---- */
Object.assign(I18N.fr, {
  "don.titre": "💛 Soutenir l'aventure",
  "don.gratuit": "✅ {app} est gratuite et sans publicité : elle ne vit que des dons.",
  "don.texte": "Cette application est créée par des parents, pour des parents 🤍. Sans publicité et sans revente de données, elle n'a d'autre ressource que les dons : ils couvrent le nom de domaine, l'envoi des e-mails et l'hébergement. Si elle vous est utile et que vous en avez envie, un petit geste aide à payer ces frais — en toute liberté, sans aucune obligation.",
  "don.bouton": "☕ Offrir un petit coup de pouce",
  "don.merci": "Merci du fond du cœur, quoi que vous décidiez ! 🙏"
});
Object.assign(I18N.en, {
  "don.titre": "💛 Support the adventure",
  "don.gratuit": "✅ {app} is free and ad-free: it runs on donations alone.",
  "don.texte": "This app is made by parents, for parents 🤍. With no advertising and no data selling, donations are its only resource: they cover the domain name, service emails and hosting. If it's useful to you and you feel like it, a small gift helps pay those costs — entirely your choice, no obligation.",
  "don.bouton": "☕ Chip in a little",
  "don.merci": "Thank you from the bottom of our hearts, whatever you decide! 🙏"
});
Object.assign(I18N.nl, {
  "don.titre": "💛 Steun het avontuur",
  "don.gratuit": "✅ {app} is gratis en zonder reclame: ze draait enkel op giften.",
  "don.texte": "Deze app is gemaakt door ouders, voor ouders 🤍. Zonder reclame en zonder verkoop van gegevens zijn giften de enige bron: ze dekken de domeinnaam, de service-e-mails en de hosting. Als ze nuttig voor je is en je het wil, helpt een klein gebaar die kosten te betalen — helemaal vrij, zonder enige verplichting.",
  "don.bouton": "☕ Geef een kleine boost",
  "don.merci": "Hartelijk dank, wat je ook beslist! 🙏"
});
Object.assign(I18N.de, {
  "don.titre": "💛 Das Abenteuer unterstützen",
  "don.gratuit": "✅ {app} ist kostenlos und werbefrei: sie lebt allein von Spenden.",
  "don.texte": "Diese App wird von Eltern für Eltern gemacht 🤍. Ohne Werbung und ohne Datenverkauf sind Spenden die einzige Einnahmequelle: Sie decken Domainname, Service-E-Mails und Hosting. Wenn sie dir nützt und du magst, hilft eine kleine Spende, diese Kosten zu tragen — ganz frei, ohne jede Verpflichtung.",
  "don.bouton": "☕ Eine Kleinigkeit beisteuern",
  "don.merci": "Von Herzen danke, wie auch immer du dich entscheidest! 🙏"
});

/* ---- Statistiques : dépenses & choix ---- */
Object.assign(I18N.fr, {
  "stats.depenses": "Dépenses : collectif 🎁 / individuel 🎨",
  "stats.depenses_detail": "Collectif (cartes) : {col} 💛 · Individuel (avatar) : {ind} 💛",
  "stats.cartes_choix": "Cartes FamiTeam soutenues", "stats.avatar_choix": "Styles d'avatar préférés"
});
Object.assign(I18N.en, {
  "stats.depenses": "Spending: collective 🎁 / individual 🎨",
  "stats.depenses_detail": "Collective (cards): {col} 💛 · Individual (avatar): {ind} 💛",
  "stats.cartes_choix": "FamiTeam cards supported", "stats.avatar_choix": "Favourite avatar styles"
});
Object.assign(I18N.nl, {
  "stats.depenses": "Uitgaven: collectief 🎁 / individueel 🎨",
  "stats.depenses_detail": "Collectief (kaarten): {col} 💛 · Individueel (avatar): {ind} 💛",
  "stats.cartes_choix": "Gesteunde FamiTeam-kaarten", "stats.avatar_choix": "Favoriete avatarstijlen"
});
Object.assign(I18N.de, {
  "stats.depenses": "Ausgaben: gemeinsam 🎁 / individuell 🎨",
  "stats.depenses_detail": "Gemeinsam (Karten): {col} 💛 · Individuell (Avatar): {ind} 💛",
  "stats.cartes_choix": "Unterstützte FamiTeam-Karten", "stats.avatar_choix": "Lieblings-Avatarstile"
});

/* ---- Statistiques : profil & lecture (comportement ↔ choix) ---- */
Object.assign(I18N.fr, {
  "stats.profil_titre": "🧭 Profil & lecture",
  "stats.profil_note": "Indicatif, pour nourrir le dialogue — ce n'est pas un diagnostic.",
  "stats.axe_entraide": "Entraide", "stats.axe_ecologie": "Écologie",
  "stats.axe_partage": "Partage", "stats.axe_soi": "Pour soi",
  "stats.lecture_debut": "Encore peu de données : laisse {prenom} jouer quelques jours pour voir son profil se dessiner. 🌱",
  "stats.lecture_sansdepense": "{prenom} s'investit dans ses missions. Dès qu'il/elle dépensera ses Cœurs, on pourra relier ses choix (partage vs personnalisation) à son comportement.",
  "stats.lecture_coherent_autres": "Comportement et choix convergent : {prenom} aide beaucoup ET partage volontiers ses Cœurs. Un profil tourné vers les autres. 💛",
  "stats.lecture_aide_garde": "{prenom} aide beaucoup, mais préfère garder ses Cœurs pour son avatar. Aider et se faire plaisir peuvent très bien coexister. 🎨",
  "stats.lecture_partage_peu_aide": "{prenom} partage volontiers ses Cœurs avec le collectif, même en faisant peu de missions d'entraide. Belle générosité ! 🎁",
  "stats.lecture_equilibre": "{prenom} montre un bel équilibre entre entraide, écologie, partage et plaisir personnel. ⚖️"
});
Object.assign(I18N.en, {
  "stats.profil_titre": "🧭 Profile & reading",
  "stats.profil_note": "Indicative, to spark dialogue — not a diagnosis.",
  "stats.axe_entraide": "Helping", "stats.axe_ecologie": "Ecology",
  "stats.axe_partage": "Sharing", "stats.axe_soi": "For self",
  "stats.lecture_debut": "Not much data yet: let {prenom} play a few days to see the profile emerge. 🌱",
  "stats.lecture_sansdepense": "{prenom} is engaged in their missions. Once they start spending Hearts, we can link their choices (sharing vs personalising) to their behaviour.",
  "stats.lecture_coherent_autres": "Behaviour and choices align: {prenom} helps a lot AND gladly shares their Hearts. An others-oriented profile. 💛",
  "stats.lecture_aide_garde": "{prenom} helps a lot but prefers keeping Hearts for their avatar. Helping and treating oneself can coexist. 🎨",
  "stats.lecture_partage_peu_aide": "{prenom} gladly shares Hearts with the group, even with few helping missions. Lovely generosity! 🎁",
  "stats.lecture_equilibre": "{prenom} shows a nice balance between helping, ecology, sharing and personal enjoyment. ⚖️"
});
Object.assign(I18N.nl, {
  "stats.profil_titre": "🧭 Profiel & duiding",
  "stats.profil_note": "Indicatief, om het gesprek te voeden — geen diagnose.",
  "stats.axe_entraide": "Helpen", "stats.axe_ecologie": "Ecologie",
  "stats.axe_partage": "Delen", "stats.axe_soi": "Voor zichzelf",
  "stats.lecture_debut": "Nog weinig gegevens: laat {prenom} een paar dagen spelen om het profiel te zien ontstaan. 🌱",
  "stats.lecture_sansdepense": "{prenom} zet zich in voor de missies. Zodra hij/zij Hartjes uitgeeft, kunnen we de keuzes (delen vs personaliseren) aan het gedrag koppelen.",
  "stats.lecture_coherent_autres": "Gedrag en keuzes komen overeen: {prenom} helpt veel ÉN deelt graag Hartjes. Een op anderen gericht profiel. 💛",
  "stats.lecture_aide_garde": "{prenom} helpt veel, maar houdt Hartjes liever voor de avatar. Helpen en jezelf verwennen kunnen samengaan. 🎨",
  "stats.lecture_partage_peu_aide": "{prenom} deelt graag Hartjes met de groep, zelfs met weinig hulpmissies. Mooie vrijgevigheid! 🎁",
  "stats.lecture_equilibre": "{prenom} toont een mooi evenwicht tussen helpen, ecologie, delen en persoonlijk plezier. ⚖️"
});
Object.assign(I18N.de, {
  "stats.profil_titre": "🧭 Profil & Deutung",
  "stats.profil_note": "Orientierend, um das Gespräch zu fördern — keine Diagnose.",
  "stats.axe_entraide": "Helfen", "stats.axe_ecologie": "Ökologie",
  "stats.axe_partage": "Teilen", "stats.axe_soi": "Für sich",
  "stats.lecture_debut": "Noch wenig Daten: lass {prenom} ein paar Tage spielen, damit das Profil sichtbar wird. 🌱",
  "stats.lecture_sansdepense": "{prenom} engagiert sich in den Missionen. Sobald Herzen ausgegeben werden, können wir die Entscheidungen (Teilen vs. Personalisieren) mit dem Verhalten verknüpfen.",
  "stats.lecture_coherent_autres": "Verhalten und Entscheidungen passen zusammen: {prenom} hilft viel UND teilt gern Herzen. Ein auf andere ausgerichtetes Profil. 💛",
  "stats.lecture_aide_garde": "{prenom} hilft viel, behält Herzen aber lieber für den Avatar. Helfen und sich etwas gönnen passen gut zusammen. 🎨",
  "stats.lecture_partage_peu_aide": "{prenom} teilt gern Herzen mit der Gruppe, selbst bei wenigen Hilfsmissionen. Schöne Großzügigkeit! 🎁",
  "stats.lecture_equilibre": "{prenom} zeigt eine schöne Balance zwischen Helfen, Ökologie, Teilen und persönlichem Vergnügen. ⚖️"
});

/* ---- Admin : configuration du don Stripe ---- */
Object.assign(I18N.fr, {
  "admin.don_titre": "💛 Don (Stripe)",
  "admin.don_note": "Colle ici ton lien de paiement Stripe (Payment Link). Il sera utilisé par le bouton « Soutenir l'aventure ». Laisse vide pour masquer le bouton.",
  "admin.don_label": "Lien de paiement Stripe",
  "admin.don_enregistrer": "Enregistrer le lien de don",
  "admin.don_ok": "Lien de don enregistré ✅"
});
Object.assign(I18N.en, {
  "admin.don_titre": "💛 Donation (Stripe)",
  "admin.don_note": "Paste your Stripe Payment Link here. It will be used by the 'Support the adventure' button. Leave empty to hide the button.",
  "admin.don_label": "Stripe payment link",
  "admin.don_enregistrer": "Save donation link",
  "admin.don_ok": "Donation link saved ✅"
});
Object.assign(I18N.nl, {
  "admin.don_titre": "💛 Donatie (Stripe)",
  "admin.don_note": "Plak hier je Stripe Payment Link. Hij wordt gebruikt door de knop 'Steun het avontuur'. Laat leeg om de knop te verbergen.",
  "admin.don_label": "Stripe-betaallink",
  "admin.don_enregistrer": "Donatielink opslaan",
  "admin.don_ok": "Donatielink opgeslagen ✅"
});
Object.assign(I18N.de, {
  "admin.don_titre": "💛 Spende (Stripe)",
  "admin.don_note": "Füge hier deinen Stripe Payment Link ein. Er wird vom Button „Das Abenteuer unterstützen“ verwendet. Leer lassen, um den Button auszublenden.",
  "admin.don_label": "Stripe-Zahlungslink",
  "admin.don_enregistrer": "Spendenlink speichern",
  "admin.don_ok": "Spendenlink gespeichert ✅"
});

/* ---- Admin : test d'envoi d'e-mail ---- */
Object.assign(I18N.fr, {
  "admin.mailtest_titre": "✉️ Test d'envoi d'e-mail",
  "admin.mailtest_note": "Envoie un vrai e-mail de test depuis hello@fami.team (via la fonction send-mail) pour vérifier que l'envoi fonctionne — même chemin que les invitations et les retours.",
  "admin.mailtest_dest": "Adresse de destination",
  "admin.mailtest_envoyer": "Envoyer un e-mail test",
  "admin.mailtest_ok": "✅ E-mail de test envoyé à {email}. Vérifie ta boîte (et les spams).",
  "admin.mailtest_ko": "❌ Échec : {msg}",
  "admin.mailtest_sujet": "{app} — e-mail de test ✅",
  "admin.mailtest_corps": "Bravo ! Si tu lis ce message, l'envoi d'e-mails depuis hello@fami.team fonctionne.\n\nEnvoyé le {date}.",
  "admin.mailtest_indispo": "Indisponible (non connecté).",
  "admin.mailtest_ko_http": "❌ Erreur {code} : {msg}",
  "admin.mailtest_ko_reseau": "❌ La requête n'a pas pu atteindre la fonction (réseau/CORS). Voir le diagnostic ci-dessous.",
  "admin.mailtest_aide_smtp": "vérifie les secrets SMTP de la fonction send-mail dans Supabase.",
  "admin.mailtest_aide_auth": "reconnecte-toi, ta session a peut-être expiré.",
  "admin.mailtest_aide_ovh": "la fonction joint OVH mais l'envoi échoue (mot de passe ou port OVH).",
  "admin.mailtest_diag_intro": "Copie ce diagnostic et colle-le dans la conversation pour obtenir de l'aide :",
  "admin.mailtest_copier": "📋 Copier le diagnostic"
});
Object.assign(I18N.en, {
  "admin.mailtest_titre": "✉️ Email test",
  "admin.mailtest_note": "Sends a real test email from hello@fami.team (via the send-mail function) to check that sending works — same path as invitations and feedback.",
  "admin.mailtest_dest": "Recipient address",
  "admin.mailtest_envoyer": "Send a test email",
  "admin.mailtest_ok": "✅ Test email sent to {email}. Check your inbox (and spam).",
  "admin.mailtest_ko": "❌ Failed: {msg}",
  "admin.mailtest_sujet": "{app} — test email ✅",
  "admin.mailtest_corps": "Well done! If you're reading this, sending emails from hello@fami.team works.\n\nSent on {date}.",
  "admin.mailtest_indispo": "Unavailable (not logged in).",
  "admin.mailtest_ko_http": "❌ Error {code}: {msg}",
  "admin.mailtest_ko_reseau": "❌ The request couldn't reach the function (network/CORS). See the diagnostic below.",
  "admin.mailtest_aide_smtp": "check the send-mail function's SMTP secrets in Supabase.",
  "admin.mailtest_aide_auth": "log in again, your session may have expired.",
  "admin.mailtest_aide_ovh": "the function reaches OVH but sending fails (OVH password or port).",
  "admin.mailtest_diag_intro": "Copy this diagnostic and paste it in the conversation to get help:",
  "admin.mailtest_copier": "📋 Copy diagnostic"
});
Object.assign(I18N.nl, {
  "admin.mailtest_titre": "✉️ E-mailtest",
  "admin.mailtest_note": "Stuurt een echte test-e-mail vanaf hello@fami.team (via de send-mail-functie) om te controleren of verzenden werkt — zelfde weg als uitnodigingen en feedback.",
  "admin.mailtest_dest": "Ontvangeradres",
  "admin.mailtest_envoyer": "Test-e-mail versturen",
  "admin.mailtest_ok": "✅ Test-e-mail verzonden naar {email}. Controleer je inbox (en spam).",
  "admin.mailtest_ko": "❌ Mislukt: {msg}",
  "admin.mailtest_sujet": "{app} — test-e-mail ✅",
  "admin.mailtest_corps": "Goed gedaan! Als je dit leest, werkt het verzenden van e-mails vanaf hello@fami.team.\n\nVerzonden op {date}.",
  "admin.mailtest_indispo": "Niet beschikbaar (niet ingelogd).",
  "admin.mailtest_ko_http": "❌ Fout {code}: {msg}",
  "admin.mailtest_ko_reseau": "❌ De aanvraag kon de functie niet bereiken (netwerk/CORS). Zie de diagnose hieronder.",
  "admin.mailtest_aide_smtp": "controleer de SMTP-secrets van de send-mail-functie in Supabase.",
  "admin.mailtest_aide_auth": "log opnieuw in, je sessie is mogelijk verlopen.",
  "admin.mailtest_aide_ovh": "de functie bereikt OVH maar verzenden mislukt (OVH-wachtwoord of poort).",
  "admin.mailtest_diag_intro": "Kopieer deze diagnose en plak ze in het gesprek voor hulp:",
  "admin.mailtest_copier": "📋 Diagnose kopiëren"
});
Object.assign(I18N.de, {
  "admin.mailtest_titre": "✉️ E-Mail-Test",
  "admin.mailtest_note": "Sendet eine echte Test-E-Mail von hello@fami.team (über die send-mail-Funktion), um zu prüfen, ob der Versand funktioniert — gleicher Weg wie Einladungen und Feedback.",
  "admin.mailtest_dest": "Empfängeradresse",
  "admin.mailtest_envoyer": "Test-E-Mail senden",
  "admin.mailtest_ok": "✅ Test-E-Mail an {email} gesendet. Prüfe dein Postfach (und Spam).",
  "admin.mailtest_ko": "❌ Fehlgeschlagen: {msg}",
  "admin.mailtest_sujet": "{app} — Test-E-Mail ✅",
  "admin.mailtest_corps": "Gut gemacht! Wenn du das liest, funktioniert der E-Mail-Versand von hello@fami.team.\n\nGesendet am {date}.",
  "admin.mailtest_indispo": "Nicht verfügbar (nicht angemeldet).",
  "admin.mailtest_ko_http": "❌ Fehler {code}: {msg}",
  "admin.mailtest_ko_reseau": "❌ Die Anfrage konnte die Funktion nicht erreichen (Netzwerk/CORS). Siehe Diagnose unten.",
  "admin.mailtest_aide_smtp": "prüfe die SMTP-Secrets der send-mail-Funktion in Supabase.",
  "admin.mailtest_aide_auth": "melde dich erneut an, deine Sitzung ist möglicherweise abgelaufen.",
  "admin.mailtest_aide_ovh": "die Funktion erreicht OVH, aber der Versand schlägt fehl (OVH-Passwort oder Port).",
  "admin.mailtest_diag_intro": "Kopiere diese Diagnose und füge sie ins Gespräch ein, um Hilfe zu erhalten:",
  "admin.mailtest_copier": "📋 Diagnose kopieren"
});

/* ---- Auto-évaluation / évaluation de la journée ---- */
Object.assign(I18N.fr, {
  "eval.titre_enfant": "Comment s'est passée ta journée ?",
  "eval.titre_parent": "Ton évaluation de la journée de {prenom} (facultatif)",
  "eval.bien": "Bien", "eval.moyen": "Moyen", "eval.mauvais": "Pas top",
  "stats.autoeval": "Auto-évaluation (30 j)", "stats.evalparent": "Évaluation parent (30 j)"
});
Object.assign(I18N.en, {
  "eval.titre_enfant": "How was your day?",
  "eval.titre_parent": "Your rating of {prenom}'s day (optional)",
  "eval.bien": "Good", "eval.moyen": "Okay", "eval.mauvais": "Not great",
  "stats.autoeval": "Self-assessment (30 d)", "stats.evalparent": "Parent rating (30 d)"
});
Object.assign(I18N.nl, {
  "eval.titre_enfant": "Hoe was je dag?",
  "eval.titre_parent": "Jouw beoordeling van de dag van {prenom} (optioneel)",
  "eval.bien": "Goed", "eval.moyen": "Oké", "eval.mauvais": "Niet top",
  "stats.autoeval": "Zelfevaluatie (30 d)", "stats.evalparent": "Ouderbeoordeling (30 d)"
});
Object.assign(I18N.de, {
  "eval.titre_enfant": "Wie war dein Tag?",
  "eval.titre_parent": "Deine Bewertung von {prenom}s Tag (optional)",
  "eval.bien": "Gut", "eval.moyen": "Okay", "eval.mauvais": "Nicht so gut",
  "stats.autoeval": "Selbsteinschätzung (30 T)", "stats.evalparent": "Elternbewertung (30 T)"
});

/* ---- Stats : frise ressenti enfant/parent ---- */
Object.assign(I18N.fr, { "stats.ressenti": "Ressenti jour par jour (14 j) — 🧒 enfant / 👤 parent" });
Object.assign(I18N.en, { "stats.ressenti": "Daily mood (14 d) — 🧒 child / 👤 parent" });
Object.assign(I18N.nl, { "stats.ressenti": "Dagelijks gevoel (14 d) — 🧒 kind / 👤 ouder" });
Object.assign(I18N.de, { "stats.ressenti": "Tägliches Gefühl (14 T) — 🧒 Kind / 👤 Eltern" });

/* ---- Évaluation : porte sur le COMPORTEMENT (corrige les libellés) ---- */
Object.assign(I18N.fr, {
  "eval.titre_enfant": "Comment je me suis comporté·e aujourd'hui ?",
  "eval.titre_parent": "Comportement de {prenom} aujourd'hui (facultatif)"
});
Object.assign(I18N.en, {
  "eval.titre_enfant": "How did I behave today?",
  "eval.titre_parent": "{prenom}'s behaviour today (optional)"
});
Object.assign(I18N.nl, {
  "eval.titre_enfant": "Hoe heb ik me vandaag gedragen?",
  "eval.titre_parent": "Gedrag van {prenom} vandaag (optioneel)"
});
Object.assign(I18N.de, {
  "eval.titre_enfant": "Wie habe ich mich heute verhalten?",
  "eval.titre_parent": "{prenom}s Verhalten heute (optional)"
});

/* ---- Évaluation parent : libellés des 3 derniers jours ---- */
Object.assign(I18N.fr, { "eval.aujourdhui": "Aujourd'hui", "eval.hier": "Hier", "eval.avant_hier": "Avant-hier" });
Object.assign(I18N.en, { "eval.aujourdhui": "Today", "eval.hier": "Yesterday", "eval.avant_hier": "2 days ago" });
Object.assign(I18N.nl, { "eval.aujourdhui": "Vandaag", "eval.hier": "Gisteren", "eval.avant_hier": "Eergisteren" });
Object.assign(I18N.de, { "eval.aujourdhui": "Heute", "eval.hier": "Gestern", "eval.avant_hier": "Vorgestern" });

/* ---- Dons : ponctuels & mensuels ---- */
Object.assign(I18N.fr, {
  "don.ponctuel": "Un geste ponctuel", "don.mensuel": "Soutien mensuel", "don.par_mois": "/mois", "don.mois": "mois",
  "admin.don_libre": "Lien montant libre (optionnel)",
  "admin.don_note": "Crée un Payment Link Stripe pour chaque montant (ponctuel ou abonnement mensuel) et colle l'URL correspondante. Les champs vides ne sont pas affichés aux parents."
});
Object.assign(I18N.en, {
  "don.ponctuel": "A one-time gift", "don.mensuel": "Monthly support", "don.par_mois": "/mo", "don.mois": "mo",
  "admin.don_libre": "Custom-amount link (optional)",
  "admin.don_note": "Create a Stripe Payment Link for each amount (one-time or monthly subscription) and paste its URL. Empty fields are hidden from parents."
});
Object.assign(I18N.nl, {
  "don.ponctuel": "Een eenmalige gift", "don.mensuel": "Maandelijkse steun", "don.par_mois": "/mnd", "don.mois": "mnd",
  "admin.don_libre": "Link vrij bedrag (optioneel)",
  "admin.don_note": "Maak voor elk bedrag een Stripe Payment Link (eenmalig of maandelijks abonnement) en plak de URL. Lege velden worden niet getoond aan ouders."
});
Object.assign(I18N.de, {
  "don.ponctuel": "Eine einmalige Gabe", "don.mensuel": "Monatliche Unterstützung", "don.par_mois": "/Mon.", "don.mois": "Mon.",
  "admin.don_libre": "Link mit freiem Betrag (optional)",
  "admin.don_note": "Erstelle für jeden Betrag einen Stripe Payment Link (einmalig oder monatliches Abo) und füge die URL ein. Leere Felder werden Eltern nicht angezeigt."
});

/* ---- Admin : lien d'aide Stripe ---- */
Object.assign(I18N.fr, { "admin.don_aide": "↗ Créer un lien de paiement sur Stripe" });
Object.assign(I18N.en, { "admin.don_aide": "↗ Create a payment link on Stripe" });
Object.assign(I18N.nl, { "admin.don_aide": "↗ Maak een betaallink op Stripe" });
Object.assign(I18N.de, { "admin.don_aide": "↗ Zahlungslink auf Stripe erstellen" });

/* Portail client Stripe : arrêter ou modifier un soutien mensuel depuis l'app. */
Object.assign(I18N.fr, {
  "don.gerer": "Gérer ou arrêter mon soutien mensuel",
  "admin.don_portail": "Portail client Stripe (gérer / arrêter un abonnement)",
  "admin.don_portail_aide": "↗ Activer le portail client sur Stripe"
});
Object.assign(I18N.en, {
  "don.gerer": "Manage or stop my monthly support",
  "admin.don_portail": "Stripe customer portal (manage / cancel a subscription)",
  "admin.don_portail_aide": "↗ Enable the customer portal on Stripe"
});
Object.assign(I18N.nl, {
  "don.gerer": "Mijn maandelijkse steun beheren of stopzetten",
  "admin.don_portail": "Stripe-klantenportaal (abonnement beheren / stopzetten)",
  "admin.don_portail_aide": "↗ Klantenportaal activeren op Stripe"
});
Object.assign(I18N.de, {
  "don.gerer": "Meine monatliche Unterstützung verwalten oder beenden",
  "admin.don_portail": "Stripe-Kundenportal (Abo verwalten / beenden)",
  "admin.don_portail_aide": "↗ Kundenportal bei Stripe aktivieren"
});

/* ---- Réglage : seuil d'affichage imagé ---- */
Object.assign(I18N.fr, { "par.prog.seuil_visuel": "Affichage imagé (sans chiffres) jusqu'à l'âge de" });
Object.assign(I18N.en, { "par.prog.seuil_visuel": "Picture display (no numbers) up to age" });
Object.assign(I18N.nl, { "par.prog.seuil_visuel": "Weergave met beeldjes (zonder cijfers) tot de leeftijd van" });
Object.assign(I18N.de, { "par.prog.seuil_visuel": "Bildanzeige (ohne Zahlen) bis zum Alter von" });

/* ---- Humour : réglage, blague du jour, répliques dodo ---- */
Object.assign(I18N.fr, {
  "par.prog.humour": "Touches d'humour (blagues, taquineries) 😄",
  "blague.titre": "🃏 La blague du jour", "blague.reveler": "Voir la réponse 👀", "blague.jaime": "J'adore !", "blague.bof": "Bof…", "compliment.titre": "Compliment du jour", "compliment.aide": "À dire à voix haute à ton enfant aujourd'hui — les encouragements précis ancrent les bonnes habitudes.",
  "dodo.fun_soir": "Psst… le marchand de sable chauffe les moteurs 😴",
  "dodo.fun_nuit": "Même les doudous sont déjà au lit 🧸"
});
Object.assign(I18N.en, {
  "par.prog.humour": "Humor touches (jokes, teasing) 😄",
  "blague.titre": "🃏 Joke of the day", "blague.reveler": "See the answer 👀", "blague.jaime": "Love it!", "blague.bof": "Meh…", "compliment.titre": "Compliment of the day", "compliment.aide": "Say this out loud to your child today — specific encouragement builds lasting habits.",
  "dodo.fun_soir": "Psst… the sandman is warming up 😴",
  "dodo.fun_nuit": "Even the teddies are already in bed 🧸"
});
Object.assign(I18N.nl, {
  "par.prog.humour": "Humortoetsen (grapjes, plagerijtjes) 😄",
  "blague.titre": "🃏 Mop van de dag", "blague.reveler": "Bekijk het antwoord 👀", "blague.jaime": "Toppie!", "blague.bof": "Bwah…", "compliment.titre": "Compliment van de dag", "compliment.aide": "Zeg dit vandaag hardop tegen je kind — specifieke aanmoediging bouwt blijvende gewoontes.",
  "dodo.fun_soir": "Psst… het zandmannetje warmt op 😴",
  "dodo.fun_nuit": "Zelfs de knuffels liggen al in bed 🧸"
});
Object.assign(I18N.de, {
  "par.prog.humour": "Humor-Elemente (Witze, Neckereien) 😄",
  "blague.titre": "🃏 Witz des Tages", "blague.reveler": "Antwort anzeigen 👀", "blague.jaime": "Super!", "blague.bof": "Naja…", "compliment.titre": "Kompliment des Tages", "compliment.aide": "Sag das heute laut zu deinem Kind — konkretes Lob schafft dauerhafte Gewohnheiten.",
  "dodo.fun_soir": "Psst… das Sandmännchen wärmt sich auf 😴",
  "dodo.fun_nuit": "Sogar die Kuscheltiere sind schon im Bett 🧸"
});

/* ---- Vérification des jours précédents (parent, depuis l'accueil) ---- */
Object.assign(I18N.fr, {
  "retro.activer": "🔧 Vérifier les jours précédents (parent)",
  "retro.pin_titre": "🔒 Code PIN parental",
  "retro.titre": "Vérifier les missions de {prenom}",
  "retro.quitter": "Terminer",
  "retro.aujourdhui": "aujourd'hui",
  "retro.note": "Touche une mission pour la cocher ou la décocher pour le jour affiché. Les soldes sont ajustés automatiquement.",
  "retro.modif_jour": "Tu modifies un jour précédent", "retro.note2": "Utilise ◀ ▶ pour changer de jour. Touche les missions ci-dessous pour les (dé)cocher pour ce jour.", "retro.terminer": "Terminer"
});
Object.assign(I18N.en, {
  "retro.activer": "🔧 Check previous days (parent)",
  "retro.pin_titre": "🔒 Parental PIN",
  "retro.titre": "Check {prenom}'s missions",
  "retro.quitter": "Done",
  "retro.aujourdhui": "today",
  "retro.note": "Tap a mission to check or uncheck it for the selected day. Balances adjust automatically.",
  "retro.modif_jour": "You are editing a previous day", "retro.note2": "Use ◀ ▶ to change day. Tap the missions below to (un)check them for that day.", "retro.terminer": "Done"
});
Object.assign(I18N.nl, {
  "retro.activer": "🔧 Vorige dagen controleren (ouder)",
  "retro.pin_titre": "🔒 Ouderlijke PIN",
  "retro.titre": "Opdrachten van {prenom} controleren",
  "retro.quitter": "Klaar",
  "retro.aujourdhui": "vandaag",
  "retro.note": "Tik op een opdracht om ze aan of uit te vinken voor de gekozen dag. Saldo's worden automatisch aangepast.",
  "retro.modif_jour": "Je bewerkt een vorige dag", "retro.note2": "Gebruik ◀ ▶ om van dag te wisselen. Tik op de opdrachten hieronder om ze voor die dag aan/uit te vinken.", "retro.terminer": "Klaar"
});
Object.assign(I18N.de, {
  "retro.activer": "🔧 Frühere Tage prüfen (Eltern)",
  "retro.pin_titre": "🔒 Eltern-PIN",
  "retro.titre": "Aufgaben von {prenom} prüfen",
  "retro.quitter": "Fertig",
  "retro.aujourdhui": "heute",
  "retro.note": "Tippe auf eine Aufgabe, um sie für den gewählten Tag an- oder abzuhaken. Guthaben wird automatisch angepasst.",
  "retro.modif_jour": "Du bearbeitest einen früheren Tag", "retro.note2": "Mit ◀ ▶ den Tag wechseln. Tippe unten auf die Aufgaben, um sie für diesen Tag an-/abzuhaken.", "retro.terminer": "Fertig"
});

/* ---- Planification des missions (jours / dates / enfants) ---- */
Object.assign(I18N.fr, {
  "planif.titre": "📅 Planification",
  "planif.tous": "Tous les jours", "planif.semaine": "Semaine", "planif.weekend": "Week-end",
  "planif.jours_courts": "L,M,M,J,V,S,D",
  "planif.du": "Du", "planif.au": "Au",
  "planif.enfants": "Enfants concernés",
  "planif.aide": "Rien de coché = mission active pour tous les enfants, tous les jours, sans limite de dates."
});
Object.assign(I18N.en, {
  "planif.titre": "📅 Scheduling",
  "planif.tous": "Every day", "planif.semaine": "Weekdays", "planif.weekend": "Weekend",
  "planif.jours_courts": "M,T,W,T,F,S,S",
  "planif.du": "From", "planif.au": "To",
  "planif.enfants": "Children concerned",
  "planif.aide": "Nothing selected = mission active for all children, every day, with no date limit."
});
Object.assign(I18N.nl, {
  "planif.titre": "📅 Planning",
  "planif.tous": "Elke dag", "planif.semaine": "Weekdagen", "planif.weekend": "Weekend",
  "planif.jours_courts": "M,D,W,D,V,Z,Z",
  "planif.du": "Van", "planif.au": "Tot",
  "planif.enfants": "Betrokken kinderen",
  "planif.aide": "Niets aangevinkt = opdracht actief voor alle kinderen, elke dag, zonder datumgrens."
});
Object.assign(I18N.de, {
  "planif.titre": "📅 Planung",
  "planif.tous": "Jeden Tag", "planif.semaine": "Wochentags", "planif.weekend": "Wochenende",
  "planif.jours_courts": "M,D,M,D,F,S,S",
  "planif.du": "Von", "planif.au": "Bis",
  "planif.enfants": "Betroffene Kinder",
  "planif.aide": "Nichts ausgewählt = Aufgabe für alle Kinder aktiv, jeden Tag, ohne Datumsgrenze."
});

/* ---- Personnalisation par enfant ---- */
Object.assign(I18N.fr, {
  "perso.titre": "🌱 Écosystème par enfant", "perso.note": "Active/désactive et ajuste le coût des plantes et animaux pour chaque enfant. Vide = valeur standard.",
  "perso.missions": "Missions (actif & points)", "perso.especes": "Plantes & animaux (actif & coût)",
  "perso.actif": "Actif pour cet enfant", "perso.points": "Points", "perso.reinit": "↩️ Tout réinitialiser"
});
Object.assign(I18N.en, {
  "perso.titre": "🌱 Ecosystem per child", "perso.note": "Enable/disable and adjust the cost of plants and animals for each child. Empty = standard value.",
  "perso.missions": "Missions (active & points)", "perso.especes": "Plants & animals (active & cost)",
  "perso.actif": "Active for this child", "perso.points": "Points", "perso.reinit": "↩️ Reset all"
});
Object.assign(I18N.nl, {
  "perso.titre": "🌱 Ecosysteem per kind", "perso.note": "Aan/uit en pas de kosten van planten en dieren per kind aan. Leeg = standaardwaarde.",
  "perso.missions": "Opdrachten (actief & punten)", "perso.especes": "Planten & dieren (actief & kosten)",
  "perso.actif": "Actief voor dit kind", "perso.points": "Punten", "perso.reinit": "↩️ Alles resetten"
});
Object.assign(I18N.de, {
  "perso.titre": "🌱 Ökosystem pro Kind", "perso.note": "Aktiviere/deaktiviere und passe die Kosten von Pflanzen und Tieren pro Kind an. Leer = Standardwert.",
  "perso.missions": "Aufgaben (aktiv & Punkte)", "perso.especes": "Pflanzen & Tiere (aktiv & Kosten)",
  "perso.actif": "Für dieses Kind aktiv", "perso.points": "Punkte", "perso.reinit": "↩️ Alles zurücksetzen"
});

/* ---- Tableau de bord « science » (admin) ---- */
Object.assign(I18N.fr, {
  "sci.titre": "🔬 Tableau de bord scientifique", "sci.note": "Paramètres fondés sur la psychologie, la pédagogie et la neurologie. Ajustables avec un comité d'experts ; appliqués à toute l'application.",
  "sci.ecran": "Temps d'écran (neurologie)", "sci.budget_min": "Minutes d'app/jour visées", "sci.taches_age": "Nombre de tâches/jour par âge", "sci.jusqua": "Jusqu'à {age} ans", "sci.part_famille": "Part Famille du budget (%)",
  "sci.incentives": "Incentives sains (motivation)", "sci.points_max": "Plafond de points par tâche", "sci.celebrer": "Micro-célébrations (confettis)",
  "sci.ages_missions": "Âge conseillé par mission (pédagogie)", "sci.ans": "ans",
  "sci.reperes": "Repères & propositions des experts", "sci.dom_psychologie": "Psychologie", "sci.dom_pedagogie": "Pédagogie", "sci.dom_neurologie": "Neurologie", "sci.propositions": "Propositions d'amélioration",
  "sci.enregistrer": "💾 Enregistrer pour toute l'app", "sci.enreg_cours": "Enregistrement…", "sci.enreg_ok": "Paramètres scientifiques enregistrés ✅", "sci.enreg_err": "Échec de l'enregistrement",
  "sci.diffusion": "Une ligne par idée. Les valeurs s'appliquent à toutes les familles au prochain chargement."
});
Object.assign(I18N.en, {
  "sci.titre": "🔬 Scientific dashboard", "sci.note": "Parameters grounded in psychology, pedagogy and neurology. Adjustable with an expert panel; applied across the whole app.",
  "sci.ecran": "Screen time (neurology)", "sci.budget_min": "Target app minutes/day", "sci.taches_age": "Tasks/day by age", "sci.jusqua": "Up to age {age}", "sci.part_famille": "Family share of budget (%)",
  "sci.incentives": "Healthy incentives (motivation)", "sci.points_max": "Max points per task", "sci.celebrer": "Micro-celebrations (confetti)",
  "sci.ages_missions": "Recommended age per mission (pedagogy)", "sci.ans": "yrs",
  "sci.reperes": "Expert guidance & proposals", "sci.dom_psychologie": "Psychology", "sci.dom_pedagogie": "Pedagogy", "sci.dom_neurologie": "Neurology", "sci.propositions": "Improvement proposals",
  "sci.enregistrer": "💾 Save for the whole app", "sci.enreg_cours": "Saving…", "sci.enreg_ok": "Scientific parameters saved ✅", "sci.enreg_err": "Save failed",
  "sci.diffusion": "One idea per line. Values apply to all families on next load."
});
Object.assign(I18N.nl, {
  "sci.titre": "🔬 Wetenschappelijk dashboard", "sci.note": "Parameters op basis van psychologie, pedagogie en neurologie. Aanpasbaar met een expertpanel; geldt voor de hele app.",
  "sci.ecran": "Schermtijd (neurologie)", "sci.budget_min": "Beoogde app-minuten/dag", "sci.taches_age": "Taken/dag per leeftijd", "sci.jusqua": "Tot {age} jaar", "sci.part_famille": "Gezinsdeel van budget (%)",
  "sci.incentives": "Gezonde prikkels (motivatie)", "sci.points_max": "Max. punten per taak", "sci.celebrer": "Micro-vieringen (confetti)",
  "sci.ages_missions": "Aanbevolen leeftijd per opdracht (pedagogie)", "sci.ans": "jaar",
  "sci.reperes": "Expertrichtlijnen & voorstellen", "sci.dom_psychologie": "Psychologie", "sci.dom_pedagogie": "Pedagogie", "sci.dom_neurologie": "Neurologie", "sci.propositions": "Verbetervoorstellen",
  "sci.enregistrer": "💾 Opslaan voor de hele app", "sci.enreg_cours": "Opslaan…", "sci.enreg_ok": "Wetenschappelijke parameters opgeslagen ✅", "sci.enreg_err": "Opslaan mislukt",
  "sci.diffusion": "Eén idee per regel. Waarden gelden voor alle gezinnen bij de volgende keer laden."
});
Object.assign(I18N.de, {
  "sci.titre": "🔬 Wissenschafts-Dashboard", "sci.note": "Parameter auf Basis von Psychologie, Pädagogik und Neurologie. Mit einem Expertengremium anpassbar; gilt für die ganze App.",
  "sci.ecran": "Bildschirmzeit (Neurologie)", "sci.budget_min": "Angestrebte App-Minuten/Tag", "sci.taches_age": "Aufgaben/Tag nach Alter", "sci.jusqua": "Bis {age} Jahre", "sci.part_famille": "Familienanteil am Budget (%)",
  "sci.incentives": "Gesunde Anreize (Motivation)", "sci.points_max": "Max. Punkte pro Aufgabe", "sci.celebrer": "Mikro-Feiern (Konfetti)",
  "sci.ages_missions": "Empfohlenes Alter pro Aufgabe (Pädagogik)", "sci.ans": "J.",
  "sci.reperes": "Experten-Hinweise & Vorschläge", "sci.dom_psychologie": "Psychologie", "sci.dom_pedagogie": "Pädagogik", "sci.dom_neurologie": "Neurologie", "sci.propositions": "Verbesserungsvorschläge",
  "sci.enregistrer": "💾 Für die ganze App speichern", "sci.enreg_cours": "Speichern…", "sci.enreg_ok": "Wissenschaftliche Parameter gespeichert ✅", "sci.enreg_err": "Speichern fehlgeschlagen",
  "sci.diffusion": "Eine Idee pro Zeile. Werte gelten beim nächsten Laden für alle Familien."
});

/* ---- Sélection groupée des missions (tous les enfants) ---- */
Object.assign(I18N.fr, {
  "grp_sel.titre": "🗂️ Sélection groupée", "grp_sel.note": "Coche les missions pour tous les enfants d'un coup. Les ⚠️ indiquent les missions au-delà de l'âge conseillé.",
  "grp_sel.recommande": "✨ Recommandé par âge", "grp_sel.tous": "Tout cocher", "grp_sel.aucun": "Tout décocher",
  "grp_sel.legende": "✅ adapté à l'âge · ⚠️ au-delà de l'âge conseillé", "grp_sel.des_ans": "dès {age} ans",
  "grp_sel.adapte": "Adapté à l'âge de {prenom}", "grp_sel.jeune": "Au-delà de l'âge conseillé pour {prenom}"
});
Object.assign(I18N.en, {
  "grp_sel.titre": "🗂️ Bulk selection", "grp_sel.note": "Tick missions for all children at once. ⚠️ marks missions above the recommended age.",
  "grp_sel.recommande": "✨ Recommended by age", "grp_sel.tous": "Select all", "grp_sel.aucun": "Clear all",
  "grp_sel.legende": "✅ age-appropriate · ⚠️ above recommended age", "grp_sel.des_ans": "from age {age}",
  "grp_sel.adapte": "Suitable for {prenom}'s age", "grp_sel.jeune": "Above the recommended age for {prenom}"
});
Object.assign(I18N.nl, {
  "grp_sel.titre": "🗂️ Groepsselectie", "grp_sel.note": "Vink opdrachten voor alle kinderen tegelijk aan. ⚠️ markeert opdrachten boven de aanbevolen leeftijd.",
  "grp_sel.recommande": "✨ Aanbevolen per leeftijd", "grp_sel.tous": "Alles aanvinken", "grp_sel.aucun": "Alles wissen",
  "grp_sel.legende": "✅ geschikt voor leeftijd · ⚠️ boven aanbevolen leeftijd", "grp_sel.des_ans": "vanaf {age} jaar",
  "grp_sel.adapte": "Geschikt voor de leeftijd van {prenom}", "grp_sel.jeune": "Boven de aanbevolen leeftijd voor {prenom}"
});
Object.assign(I18N.de, {
  "grp_sel.titre": "🗂️ Sammelauswahl", "grp_sel.note": "Hake Aufgaben für alle Kinder auf einmal ab. ⚠️ markiert Aufgaben über dem empfohlenen Alter.",
  "grp_sel.recommande": "✨ Nach Alter empfohlen", "grp_sel.tous": "Alle ankreuzen", "grp_sel.aucun": "Alle abwählen",
  "grp_sel.legende": "✅ altersgerecht · ⚠️ über empfohlenem Alter", "grp_sel.des_ans": "ab {age} Jahren",
  "grp_sel.adapte": "Passend für das Alter von {prenom}", "grp_sel.jeune": "Über dem empfohlenen Alter für {prenom}"
});

/* ---- Explications des réglages ---- */
Object.assign(I18N.fr, {
  "aide.validation": "Si activé, chaque mission cochée par l'enfant attend ton ✅ avant d'être comptée. Idéal pour les plus jeunes.",
  "aide.pin": "Protège l'espace parents et le déverrouillage du minuteur. Récupérable par e-mail si oublié.",
  "aide.seuil": "En dessous de cet âge, les quantités s'affichent en images (💛💛) plutôt qu'en chiffres, pour les non-lecteurs.",
  "aide.humour": "Ajoute des petites blagues et taquineries bienveillantes. À couper si tu préfères du sobre."
});
Object.assign(I18N.en, {
  "aide.validation": "If on, each mission ticked by the child waits for your ✅ before counting. Ideal for younger kids.",
  "aide.pin": "Protects the parents' area and timer unlock. Recoverable by email if forgotten.",
  "aide.seuil": "Below this age, amounts show as pictures (💛💛) rather than numbers, for non-readers.",
  "aide.humour": "Adds little kind jokes and teasing. Turn off if you prefer it plain."
});
Object.assign(I18N.nl, {
  "aide.validation": "Indien aan, wacht elke door het kind aangevinkte opdracht op jouw ✅ voordat ze telt. Ideaal voor de jongsten.",
  "aide.pin": "Beschermt de ouderomgeving en het ontgrendelen van de timer. Herstelbaar via e-mail indien vergeten.",
  "aide.seuil": "Onder deze leeftijd worden aantallen als plaatjes (💛💛) getoond i.p.v. cijfers, voor niet-lezers.",
  "aide.humour": "Voegt kleine vriendelijke grapjes toe. Uitschakelen als je het liever sober houdt."
});
Object.assign(I18N.de, {
  "aide.validation": "Wenn aktiv, wartet jede vom Kind angehakte Aufgabe auf dein ✅, bevor sie zählt. Ideal für die Kleinsten.",
  "aide.pin": "Schützt den Elternbereich und das Entsperren des Timers. Bei Vergessen per E-Mail wiederherstellbar.",
  "aide.seuil": "Unter diesem Alter werden Mengen als Bilder (💛💛) statt Zahlen angezeigt, für Nicht-Leser.",
  "aide.humour": "Fügt kleine freundliche Witze hinzu. Ausschalten, wenn du es schlicht magst."
});

/* ---- Mode parents (standard / expert) ---- */
Object.assign(I18N.fr, {
  "mode.titre": "Mode parents", "mode.standard": "Standard", "mode.expert": "Expert",
  "mode.aide_standard": "L'essentiel en 4 onglets : ce qu'il y a à faire aujourd'hui, mes enfants, les activités, les réglages.",
  "mode.aide_expert": "Outils avancés débloqués : planification par jours/dates, tournantes, sélection groupée, édition fine des missions, référence écosystème."
});
Object.assign(I18N.en, {
  "mode.titre": "Parent mode", "mode.standard": "Standard", "mode.expert": "Expert",
  "mode.aide_standard": "The essentials in 4 tabs: what to do today, my children, activities, settings.",
  "mode.aide_expert": "Advanced tools unlocked: day/date scheduling, rotations, bulk selection, fine mission editing, ecosystem reference."
});
Object.assign(I18N.nl, {
  "mode.titre": "Oudermodus", "mode.standard": "Standaard", "mode.expert": "Expert",
  "mode.aide_standard": "Het essentiële in 4 tabbladen: wat vandaag te doen valt, mijn kinderen, de activiteiten, de instellingen.",
  "mode.aide_expert": "Geavanceerde tools: planning per dag/datum, toerbeurten, groepsselectie, fijne bewerking van taken, ecosysteemreferentie."
});
Object.assign(I18N.de, {
  "mode.titre": "Elternmodus", "mode.standard": "Standard", "mode.expert": "Experte",
  "mode.aide_standard": "Das Wesentliche in 4 Reitern: was heute zu tun ist, meine Kinder, die Aktivitäten, die Einstellungen.",
  "mode.aide_expert": "Erweiterte Werkzeuge: Tages-/Datumsplanung, Wechsel, Sammelauswahl, feine Aufgabenbearbeitung, Ökosystem-Referenz."
});

/* ---- Tournantes de tâches ---- */
Object.assign(I18N.fr, {
  "rot.titre": "🔁 Tournantes de tâches", "rot.note": "Des tâches faites à tour de rôle par les enfants choisis (ex. la table, une semaine sur deux).",
  "rot.aucune": "Aucune tournante pour l'instant.", "rot.creer": "Créer une tournante", "rot.choix_missions": "Tâches concernées",
  "rot.choix_enfants": "Enfants (dans l'ordre de passage)", "rot.periode": "Rythme", "rot.par_semaine": "Chaque semaine", "rot.par_jour": "Chaque jour",
  "rot.valider": "✅ Créer la tournante", "rot.creee": "Tournante créée 🔁", "rot.confirm_suppr": "Supprimer cette tournante ?",
  "rot.tour": "Cette période : {prenom}", "rot.err_mission": "Choisis au moins une tâche.", "rot.err_enfants": "Choisis au moins un enfant.", "rot.jours_off": "Jours off (aucune tâche)", "rot.off": "Off :", "rot.off_auj": "Jour off aujourd\u2019hui",
  "rot.periode_aide": "\u00ab Chaque semaine \u00bb : un enfant garde la t\u00e2che toute la semaine, puis \u00e7a change. \u00ab Chaque jour \u00bb : \u00e7a change chaque jour.",
  "rot.priorite_aide": "Important : d\u00e9sactive ces t\u00e2ches dans la liste individuelle de chaque enfant concern\u00e9 (Enfants \u2192 Missions), sinon elles continueront \u00e0 appara\u00eetre tous les jours en plus de la tournante.",
});
Object.assign(I18N.en, {
  "rot.titre": "🔁 Task rotations", "rot.note": "Tasks done in turns by the chosen children (e.g. the table, every other week).",
  "rot.aucune": "No rotation yet.", "rot.creer": "Create a rotation", "rot.choix_missions": "Tasks involved",
  "rot.choix_enfants": "Children (in turn order)", "rot.periode": "Rhythm", "rot.par_semaine": "Weekly", "rot.par_jour": "Daily",
  "rot.valider": "✅ Create rotation", "rot.creee": "Rotation created 🔁", "rot.confirm_suppr": "Delete this rotation?",
  "rot.tour": "This period: {prenom}", "rot.err_mission": "Pick at least one task.", "rot.err_enfants": "Pick at least one child.", "rot.jours_off": "Off days (no task)", "rot.off": "Off:", "rot.off_auj": "Day off today",
  "rot.periode_aide": "\"Weekly\": one child keeps the task all week, then it changes. \"Daily\": it changes every day.",
  "rot.priorite_aide": "Important: turn off these tasks in each involved child's individual list (Children → Tasks), otherwise they'll keep appearing every day on top of the rotation.",
});
Object.assign(I18N.nl, {
  "rot.titre": "🔁 Taken bij toerbeurt", "rot.note": "Taken die om beurten door de gekozen kinderen worden gedaan (bv. de tafel, om de week).",
  "rot.aucune": "Nog geen toerbeurt.", "rot.creer": "Een toerbeurt maken", "rot.choix_missions": "Betrokken taken",
  "rot.choix_enfants": "Kinderen (in volgorde)", "rot.periode": "Ritme", "rot.par_semaine": "Wekelijks", "rot.par_jour": "Dagelijks",
  "rot.valider": "✅ Toerbeurt maken", "rot.creee": "Toerbeurt aangemaakt 🔁", "rot.confirm_suppr": "Deze toerbeurt verwijderen?",
  "rot.tour": "Deze periode: {prenom}", "rot.err_mission": "Kies minstens één taak.", "rot.err_enfants": "Kies minstens één kind.", "rot.jours_off": "Vrije dagen (geen taak)", "rot.off": "Vrij:", "rot.off_auj": "Vandaag vrij",
  "rot.periode_aide": "\"Wekelijks\": één kind doet de taak de hele week, daarna wisselt het. \"Dagelijks\": het wisselt elke dag.",
  "rot.priorite_aide": "Belangrijk: schakel deze taken uit in de individuele lijst van elk betrokken kind (Kinderen → Taken), anders blijven ze elke dag verschijnen naast de toerbeurt.",
});
Object.assign(I18N.de, {
  "rot.titre": "🔁 Aufgaben im Wechsel", "rot.note": "Aufgaben, die die gewählten Kinder abwechselnd erledigen (z. B. der Tisch, jede zweite Woche).",
  "rot.aucune": "Noch kein Wechsel.", "rot.creer": "Einen Wechsel erstellen", "rot.choix_missions": "Betroffene Aufgaben",
  "rot.choix_enfants": "Kinder (in Reihenfolge)", "rot.periode": "Rhythmus", "rot.par_semaine": "Wöchentlich", "rot.par_jour": "Täglich",
  "rot.valider": "✅ Wechsel erstellen", "rot.creee": "Wechsel erstellt 🔁", "rot.confirm_suppr": "Diesen Wechsel löschen?",
  "rot.tour": "Dieser Zeitraum: {prenom}", "rot.err_mission": "Wähle mindestens eine Aufgabe.", "rot.err_enfants": "Wähle mindestens ein Kind.", "rot.jours_off": "Freie Tage (keine Aufgabe)", "rot.off": "Frei:", "rot.off_auj": "Heute frei",
  "rot.periode_aide": "„Wöchentlich“: Ein Kind übernimmt die Aufgabe die ganze Woche, dann wechselt es. „Täglich“: Es wechselt jeden Tag.",
  "rot.priorite_aide": "Wichtig: Deaktiviere diese Aufgaben in der individuellen Liste jedes betroffenen Kindes (Kinder → Aufgaben), sonst erscheinen sie weiterhin täglich zusätzlich zum Wechsel.",
});

/* ---- Tutoriel d'accueil (visite guidée) ---- */
Object.assign(I18N.fr, {
  "tuto.passer": "Passer", "tuto.precedent": "← Précédent", "tuto.suivant": "Suivant →",
  "tuto.commencer": "C'est parti ! 🚀", "tuto.revoir": "🎓 Revoir le tutoriel",
  "tuto.s1_t": "Bienvenue dans FamiTeam ! 🌟",
  "tuto.s1_d": "Toute la famille dans la même équipe. On encourage les gestes positifs — <strong>jamais de punition</strong>. Laisse-moi te montrer en 30 secondes !",
  "tuto.s2_t": "Choisis ton enfant 👧",
  "tuto.s2_d": "Ici tu passes d'un enfant à l'autre. Astuce : tu peux aussi <strong>glisser (swipe)</strong> sur l'écran.",
  "tuto.s3_t": "Les missions du jour ✅",
  "tuto.s3_d": "<strong>Touche une mission</strong> comme celle-ci pour la valider : l'enfant gagne des <strong>cœurs 💛</strong> (Famille) et des <strong>gouttes 💧</strong> (Planète).",
  "tuto.s4_t": "Le minuteur d'écran ⏱️",
  "tuto.s4_d": "Lance un temps d'écran : à la fin, l'app se verrouille avec le code PIN parental.",
  "tuto.s5_t": "L'avatar 🎨",
  "tuto.s5_d": "Avec les <strong>cœurs</strong>, l'enfant personnalise son avatar (coiffures, lunettes…).",
  "tuto.s6_t": "L'écosystème 🌍",
  "tuto.s6_d": "Avec les <strong>gouttes</strong>, on fait grandir un véritable écosystème vivant (plantes, animaux…).",
  "tuto.s7_t": "L'espace parents ⚙️",
  "tuto.s7_d": "Code PIN, planification des missions, corrections, invitations… tout se règle ici.",
  "tuto.s8_t": "Un petit rituel en famille 🤝",
  "tuto.s8_d": "L'idéal : faire le point <strong>ensemble en fin de journée</strong>, quelques minutes — chaque jour, ou tous les 2-3 jours, comme il vous convient. À vous de voir, sans pression !"
});
Object.assign(I18N.en, {
  "tuto.passer": "Skip", "tuto.precedent": "← Back", "tuto.suivant": "Next →",
  "tuto.commencer": "Let's go! 🚀", "tuto.revoir": "🎓 Replay the tutorial",
  "tuto.s1_t": "Welcome to FamiTeam! 🌟",
  "tuto.s1_d": "The whole family on the same team. We encourage positive actions — <strong>never punishment</strong>. Let me show you in 30 seconds!",
  "tuto.s2_t": "Pick your child 👧",
  "tuto.s2_d": "Switch between children here. Tip: you can also <strong>swipe</strong> across the screen.",
  "tuto.s3_t": "Daily missions ✅",
  "tuto.s3_d": "<strong>Tap a mission</strong> like this one to complete it: the child earns <strong>hearts 💛</strong> (Family) and <strong>drops 💧</strong> (Planet).",
  "tuto.s4_t": "The screen timer ⏱️",
  "tuto.s4_d": "Start a screen time: when it's up, the app locks with the parental PIN.",
  "tuto.s5_t": "The avatar 🎨",
  "tuto.s5_d": "With <strong>hearts</strong>, the child customizes their avatar (hairstyles, glasses…).",
  "tuto.s6_t": "The ecosystem 🌍",
  "tuto.s6_d": "With <strong>drops</strong>, you grow a real living ecosystem (plants, animals…).",
  "tuto.s7_t": "The parents' area ⚙️",
  "tuto.s7_d": "PIN code, mission scheduling, corrections, invitations… it's all set up here.",
  "tuto.s8_t": "A little family ritual 🤝",
  "tuto.s8_d": "Ideally: review <strong>together at the end of the day</strong>, just a few minutes — every day, or every 2-3 days, whatever suits you. Up to you, no pressure!"
});
Object.assign(I18N.nl, {
  "tuto.passer": "Overslaan", "tuto.precedent": "← Terug", "tuto.suivant": "Volgende →",
  "tuto.commencer": "Aan de slag! 🚀", "tuto.revoir": "🎓 Tutorial opnieuw bekijken",
  "tuto.s1_t": "Welkom bij FamiTeam! 🌟",
  "tuto.s1_d": "Het hele gezin in één team. We moedigen positief gedrag aan — <strong>nooit straf</strong>. Ik laat het je in 30 seconden zien!",
  "tuto.s2_t": "Kies je kind 👧",
  "tuto.s2_d": "Hier wissel je tussen de kinderen. Tip: je kunt ook <strong>vegen (swipe)</strong> over het scherm.",
  "tuto.s3_t": "Dagelijkse opdrachten ✅",
  "tuto.s3_d": "<strong>Tik op een opdracht</strong> zoals deze om ze te voltooien: het kind verdient <strong>hartjes 💛</strong> (Gezin) en <strong>druppels 💧</strong> (Planeet).",
  "tuto.s4_t": "De schermtimer ⏱️",
  "tuto.s4_d": "Start een schermtijd: als die op is, vergrendelt de app met de ouderlijke PIN.",
  "tuto.s5_t": "De avatar 🎨",
  "tuto.s5_d": "Met <strong>hartjes</strong> personaliseert het kind zijn avatar (kapsels, brillen…).",
  "tuto.s6_t": "Het ecosysteem 🌍",
  "tuto.s6_d": "Met <strong>druppels</strong> laat je een echt levend ecosysteem groeien (planten, dieren…).",
  "tuto.s7_t": "De ouderomgeving ⚙️",
  "tuto.s7_d": "Pincode, opdrachtenplanning, correcties, uitnodigingen… alles stel je hier in.",
  "tuto.s8_t": "Een klein gezinsritueel 🤝",
  "tuto.s8_d": "Ideaal: samen <strong>aan het einde van de dag</strong> terugblikken, een paar minuten — elke dag, of om de 2-3 dagen, wat jullie uitkomt. Aan jullie, zonder druk!"
});
Object.assign(I18N.de, {
  "tuto.passer": "Überspringen", "tuto.precedent": "← Zurück", "tuto.suivant": "Weiter →",
  "tuto.commencer": "Los geht's! 🚀", "tuto.revoir": "🎓 Tutorial erneut ansehen",
  "tuto.s1_t": "Willkommen bei FamiTeam! 🌟",
  "tuto.s1_d": "Die ganze Familie in einem Team. Wir fördern positives Verhalten — <strong>keine Strafen</strong>. Ich zeige es dir in 30 Sekunden!",
  "tuto.s2_t": "Wähle dein Kind 👧",
  "tuto.s2_d": "Hier wechselst du zwischen den Kindern. Tipp: Du kannst auch über den Bildschirm <strong>wischen (swipe)</strong>.",
  "tuto.s3_t": "Tägliche Aufgaben ✅",
  "tuto.s3_d": "<strong>Tippe auf eine Aufgabe</strong> wie diese, um sie zu erledigen: das Kind verdient <strong>Herzen 💛</strong> (Familie) und <strong>Tropfen 💧</strong> (Planet).",
  "tuto.s4_t": "Der Bildschirm-Timer ⏱️",
  "tuto.s4_d": "Starte eine Bildschirmzeit: Ist sie um, sperrt sich die App mit der Eltern-PIN.",
  "tuto.s5_t": "Der Avatar 🎨",
  "tuto.s5_d": "Mit <strong>Herzen</strong> gestaltet das Kind seinen Avatar (Frisuren, Brillen…).",
  "tuto.s6_t": "Das Ökosystem 🌍",
  "tuto.s6_d": "Mit <strong>Tropfen</strong> lässt du ein echtes lebendiges Ökosystem wachsen (Pflanzen, Tiere…).",
  "tuto.s7_t": "Der Elternbereich ⚙️",
  "tuto.s7_d": "PIN-Code, Aufgabenplanung, Korrekturen, Einladungen… alles wird hier eingestellt.",
  "tuto.s8_t": "Ein kleines Familienritual 🤝",
  "tuto.s8_d": "Ideal: am <strong>Ende des Tages gemeinsam</strong> zurückblicken, ein paar Minuten — jeden Tag oder alle 2-3 Tage, wie es euch passt. Ganz wie ihr wollt, ohne Druck!"
});

/* ---- Admin : adresse de support ---- */
Object.assign(I18N.fr, { "admin.support_email": "Adresse de support (réception des retours)" });
Object.assign(I18N.en, { "admin.support_email": "Support address (receives feedback)" });
Object.assign(I18N.nl, { "admin.support_email": "Support-adres (ontvangt feedback)" });
Object.assign(I18N.de, { "admin.support_email": "Support-Adresse (empfängt Rückmeldungen)" });

/* ---- Espace parents simplifié : premiers pas & regroupements ---- */
Object.assign(I18N.fr, {
  "grp.reglages": "⚙️ Réglages",
  "regl.programme": "🎛️ Le programme (validation, code parent…)",
  "regl.famille": "👪 Ma famille & invitations",
  "regl.compte": "🔐 Mon compte & mes données",
  "papier.pour_quoi": "Facultatif : la semaine à imprimer, pour cocher à la main (frigo) puis encoder ici en une fois.",
  "pp.titre": "🚀 Premiers pas",
  "pp.sous": "Trois gestes et c'est parti. Compte deux minutes par jour, pas plus.",
  "pp.e1_t": "Renseigne tes enfants",
  "pp.e1_d": "Prénom et date de naissance : les missions et l'affichage s'adaptent tout seuls à l'âge.",
  "pp.e1_b": "Ouvrir « Mes enfants »",
  "pp.e2_t": "Choisis 2 ou 3 missions pour aujourd'hui",
  "pp.e2_d": "Juste en dessous ⬇️ Peu de missions = plus de réussites. Tu peux changer chaque jour.",
  "pp.e3_t": "Ce soir, coche avec ton enfant",
  "pp.e3_d": "Sur son écran d'accueil : il coche ce qu'il a fait, gagne des 💛 et fait grandir son avatar.",
  "pp.masquer": "Masquer ces conseils"
});
Object.assign(I18N.en, {
  "grp.reglages": "⚙️ Settings",
  "regl.programme": "🎛️ The programme (approval, parent code…)",
  "regl.famille": "👪 My family & invitations",
  "regl.compte": "🔐 My account & my data",
  "papier.pour_quoi": "Optional: the printable week, to tick by hand (on the fridge) and enter here in one go.",
  "pp.titre": "🚀 First steps",
  "pp.sous": "Three moves and you're set. Two minutes a day, no more.",
  "pp.e1_t": "Fill in your children",
  "pp.e1_d": "First name and date of birth: missions and display adapt to their age by themselves.",
  "pp.e1_b": "Open “My children”",
  "pp.e2_t": "Pick 2 or 3 missions for today",
  "pp.e2_d": "Right below ⬇️ Fewer missions means more wins. You can change them every day.",
  "pp.e3_t": "Tonight, tick them off with your child",
  "pp.e3_d": "On their home screen: they tick what they did, earn 💛 and grow their avatar.",
  "pp.masquer": "Hide these tips"
});
Object.assign(I18N.nl, {
  "grp.reglages": "⚙️ Instellingen",
  "regl.programme": "🎛️ Het programma (goedkeuring, oudercode…)",
  "regl.famille": "👪 Mijn gezin & uitnodigingen",
  "regl.compte": "🔐 Mijn account & mijn gegevens",
  "papier.pour_quoi": "Optioneel: de week om af te drukken, met de hand aan te vinken (koelkast) en hier in één keer in te voeren.",
  "pp.titre": "🚀 Eerste stappen",
  "pp.sous": "Drie handelingen en je bent vertrokken. Reken op twee minuten per dag, niet meer.",
  "pp.e1_t": "Vul je kinderen in",
  "pp.e1_d": "Voornaam en geboortedatum: de opdrachten en de weergave passen zich automatisch aan de leeftijd aan.",
  "pp.e1_b": "„Mijn kinderen” openen",
  "pp.e2_t": "Kies 2 of 3 opdrachten voor vandaag",
  "pp.e2_d": "Net hieronder ⬇️ Minder opdrachten = meer succes. Je mag elke dag wisselen.",
  "pp.e3_t": "Vink vanavond samen met je kind af",
  "pp.e3_d": "Op zijn startscherm: het kind vinkt af wat het deed, verdient 💛 en laat zijn avatar groeien.",
  "pp.masquer": "Deze tips verbergen"
});
Object.assign(I18N.de, {
  "grp.reglages": "⚙️ Einstellungen",
  "regl.programme": "🎛️ Das Programm (Bestätigung, Eltern-PIN…)",
  "regl.famille": "👪 Meine Familie & Einladungen",
  "regl.compte": "🔐 Mein Konto & meine Daten",
  "papier.pour_quoi": "Optional: die Woche zum Ausdrucken, per Hand abhaken (Kühlschrank) und hier in einem Zug eintragen.",
  "pp.titre": "🚀 Erste Schritte",
  "pp.sous": "Drei Handgriffe und es läuft. Rechne mit zwei Minuten pro Tag, nicht mehr.",
  "pp.e1_t": "Trage deine Kinder ein",
  "pp.e1_d": "Vorname und Geburtsdatum: Aufgaben und Anzeige passen sich dem Alter von selbst an.",
  "pp.e1_b": "„Meine Kinder“ öffnen",
  "pp.e2_t": "Wähle 2 oder 3 Aufgaben für heute",
  "pp.e2_d": "Direkt darunter ⬇️ Weniger Aufgaben = mehr Erfolge. Du kannst sie täglich ändern.",
  "pp.e3_t": "Heute Abend gemeinsam abhaken",
  "pp.e3_d": "Auf dem Startbildschirm des Kindes: es hakt ab, was es geschafft hat, erhält 💛 und lässt seinen Avatar wachsen.",
  "pp.masquer": "Diese Tipps ausblenden"
});

/* ---- Admin : développement commercial (onglet Croissance) ---- */
Object.assign(I18N.fr, {
  "admin.nav_croissance": "📈 Croissance",
  "croiss.titre": "📈 Développement commercial",
  "croiss.sous": "Le plan est découpé en chantiers indépendants, à faire les uns après les autres. Coche au fur et à mesure : l'avancement est partagé entre tes appareils.",
  "croiss.avancement": "{faites} étapes faites sur {total} ({pct} %)",
  "croiss.prochaine": "Prochaine action",
  "croiss.tout_fait": "🎉 Toutes les étapes du plan sont faites. Il est temps de réécrire le plan.",
  "croiss.doc": "Analyse de marché & business plan",
  "croiss.kpi_titre": "Les chiffres du moment",
  "croiss.kpi_sous": "Relevés en direct. L'étoile du Nord est la première tuile : tout le reste est secondaire.",
  "croiss.kpi_ko": "Chiffres indisponibles pour l'instant.",
  "croiss.kpi_actives": "Familles actives 7 j", "croiss.kpi_actives_p": "étoile du Nord",
  "croiss.kpi_familles": "Familles inscrites", "croiss.kpi_nouvelles": "Nouvelles (30 j)",
  "croiss.kpi_parrainages": "Parrainages acceptés", "croiss.kpi_attente": "Liste d'attente",
  "croiss.kpi_ouvertures": "Ouvertures (30 j)",
  "croiss.but": "But :", "croiss.kpi": "Indicateur :",
  "croiss.note": "Notes (contacts, décisions, ce qui a marché ou non)",
  "croiss.note_ph": "Ex. : école Saint-Joseph — rendez-vous le 12/09 avec la direction.",
  "croiss.note_ok": "Note enregistrée.",
  "croiss.voir_mail": "Modèle d'e-mail",
  "croiss.mails_titre": "✉️ Modèles d'e-mails",
  "croiss.mails_sous": "À personnaliser avant envoi : les mentions entre accolades doivent disparaître. Un e-mail non personnalisé reste sans effet.",
  "croiss.mail_dest": "Pour :", "croiss.mail_quand": "Quand :", "croiss.mail_sujet": "Objet :",
  "croiss.copier": "Copier le texte", "croiss.ouvrir_mail": "Ouvrir dans ma messagerie",
  "croiss.copie": "Texte copié.", "croiss.copie_ko": "Copie impossible : sélectionne le texte à la main.",
  "croiss.contraintes": "Mes deux contraintes",
  "croiss.semaine": "🗓️ Ma séance de la semaine",
  "croiss.semaine_sous": "Ce qui tient dans une heure, dans l'ordre du plan ({min} min au total). Ce qui n'y entre pas attend la semaine prochaine.",
  "croiss.reste": "il reste ≈ {h} h de travail, soit ≈ {sem} semaines",
  "croiss.hors": "hors périmètre",
  "croiss.plus_tard": "plus tard",
  "croiss.duree": "Durée :",
  "croiss.duree_val": "≈ {min} min",
  "croiss.kpi_activation": "Activation J+1",
  "croiss.kpi_activation_p": "sur {n} familles",
  "croiss.sources": "D'où viennent les inscriptions (90 j)",
  "croiss.sources_fam": "familles",
  "croiss.sources_att": "en attente",
  "croiss.url": "Accès direct : {url} (ouvre cet onglet, réservé à l'administrateur).",
  "croiss.err": "Enregistrement impossible."
});
Object.assign(I18N.en, {
  "admin.nav_croissance": "📈 Growth",
  "croiss.titre": "📈 Business development",
  "croiss.sous": "The plan is split into independent workstreams, to be done one after the other. Tick as you go: progress is shared across your devices.",
  "croiss.avancement": "{faites} of {total} steps done ({pct}%)",
  "croiss.prochaine": "Next action",
  "croiss.tout_fait": "🎉 Every step of the plan is done. Time to write a new plan.",
  "croiss.doc": "Market analysis & business plan",
  "croiss.kpi_titre": "Current numbers",
  "croiss.kpi_sous": "Read live. The North Star is the first tile: everything else is secondary.",
  "croiss.kpi_ko": "Numbers unavailable right now.",
  "croiss.kpi_actives": "Active families (7 d)", "croiss.kpi_actives_p": "North Star",
  "croiss.kpi_familles": "Registered families", "croiss.kpi_nouvelles": "New (30 d)",
  "croiss.kpi_parrainages": "Referrals accepted", "croiss.kpi_attente": "Waiting list",
  "croiss.kpi_ouvertures": "Openings (30 d)",
  "croiss.but": "Goal:", "croiss.kpi": "Metric:",
  "croiss.note": "Notes (contacts, decisions, what worked or not)",
  "croiss.note_ph": "E.g.: Saint-Joseph school — meeting the head on 12/09.",
  "croiss.note_ok": "Note saved.",
  "croiss.voir_mail": "Email template",
  "croiss.mails_titre": "✉️ Email templates",
  "croiss.mails_sous": "Personalise before sending: the parts in braces must go. A generic email falls flat.",
  "croiss.mail_dest": "To:", "croiss.mail_quand": "When:", "croiss.mail_sujet": "Subject:",
  "croiss.copier": "Copy the text", "croiss.ouvrir_mail": "Open in my mail app",
  "croiss.copie": "Text copied.", "croiss.copie_ko": "Copy failed: please select the text manually.",
  "croiss.contraintes": "My two constraints",
  "croiss.semaine": "🗓️ This week's session",
  "croiss.semaine_sous": "What fits in one hour, in plan order ({min} min in total). Whatever doesn't fit waits for next week.",
  "croiss.reste": "≈ {h} h of work left, i.e. ≈ {sem} weeks",
  "croiss.hors": "out of scope",
  "croiss.plus_tard": "later",
  "croiss.duree": "Duration:",
  "croiss.duree_val": "≈ {min} min",
  "croiss.kpi_activation": "Day-1 activation",
  "croiss.kpi_activation_p": "out of {n} families",
  "croiss.sources": "Where sign-ups come from (90 d)",
  "croiss.sources_fam": "families",
  "croiss.sources_att": "waiting",
  "croiss.url": "Direct link: {url} (opens this tab, admins only).",
  "croiss.err": "Could not save."
});
Object.assign(I18N.nl, {
  "admin.nav_croissance": "📈 Groei",
  "croiss.titre": "📈 Commerciële ontwikkeling",
  "croiss.sous": "Het plan bestaat uit onafhankelijke werven, één voor één af te werken. Vink aan naarmate je vordert: de voortgang wordt tussen je toestellen gedeeld.",
  "croiss.avancement": "{faites} van {total} stappen klaar ({pct} %)",
  "croiss.prochaine": "Volgende actie",
  "croiss.tout_fait": "🎉 Alle stappen van het plan zijn klaar. Tijd voor een nieuw plan.",
  "croiss.doc": "Marktanalyse & businessplan",
  "croiss.kpi_titre": "De cijfers van het moment",
  "croiss.kpi_sous": "Live opgehaald. De Noordster staat vooraan: al de rest is bijzaak.",
  "croiss.kpi_ko": "Cijfers momenteel niet beschikbaar.",
  "croiss.kpi_actives": "Actieve gezinnen (7 d)", "croiss.kpi_actives_p": "Noordster",
  "croiss.kpi_familles": "Ingeschreven gezinnen", "croiss.kpi_nouvelles": "Nieuw (30 d)",
  "croiss.kpi_parrainages": "Aanvaarde peterschappen", "croiss.kpi_attente": "Wachtlijst",
  "croiss.kpi_ouvertures": "Openingen (30 d)",
  "croiss.but": "Doel:", "croiss.kpi": "Indicator:",
  "croiss.note": "Notities (contacten, beslissingen, wat werkte of niet)",
  "croiss.note_ph": "Bv.: school Sint-Jozef — afspraak op 12/09 met de directie.",
  "croiss.note_ok": "Notitie bewaard.",
  "croiss.voir_mail": "E-mailmodel",
  "croiss.mails_titre": "✉️ E-mailmodellen",
  "croiss.mails_sous": "Personaliseer vóór het versturen: de delen tussen accolades moeten weg. Een onpersoonlijke e-mail heeft geen effect.",
  "croiss.mail_dest": "Voor:", "croiss.mail_quand": "Wanneer:", "croiss.mail_sujet": "Onderwerp:",
  "croiss.copier": "Tekst kopiëren", "croiss.ouvrir_mail": "In mijn mailprogramma openen",
  "croiss.copie": "Tekst gekopieerd.", "croiss.copie_ko": "Kopiëren mislukt: selecteer de tekst manueel.",
  "croiss.contraintes": "Mijn twee beperkingen",
  "croiss.semaine": "🗓️ Mijn sessie van deze week",
  "croiss.semaine_sous": "Wat in één uur past, in de volgorde van het plan ({min} min in totaal). Wat er niet in past, wacht tot volgende week.",
  "croiss.reste": "nog ≈ {h} u werk, oftewel ≈ {sem} weken",
  "croiss.hors": "buiten bereik",
  "croiss.plus_tard": "later",
  "croiss.duree": "Duur:",
  "croiss.duree_val": "≈ {min} min",
  "croiss.kpi_activation": "Activering dag 1",
  "croiss.kpi_activation_p": "op {n} gezinnen",
  "croiss.sources": "Waar de inschrijvingen vandaan komen (90 d)",
  "croiss.sources_fam": "gezinnen",
  "croiss.sources_att": "wachtend",
  "croiss.url": "Rechtstreekse link: {url} (opent dit tabblad, enkel voor beheerders).",
  "croiss.err": "Bewaren mislukt."
});
Object.assign(I18N.de, {
  "admin.nav_croissance": "📈 Wachstum",
  "croiss.titre": "📈 Geschäftsentwicklung",
  "croiss.sous": "Der Plan besteht aus unabhängigen Baustellen, eine nach der anderen. Hake ab, während du vorankommst: Der Fortschritt wird zwischen deinen Geräten geteilt.",
  "croiss.avancement": "{faites} von {total} Schritten erledigt ({pct} %)",
  "croiss.prochaine": "Nächster Schritt",
  "croiss.tout_fait": "🎉 Alle Schritte des Plans sind erledigt. Zeit für einen neuen Plan.",
  "croiss.doc": "Marktanalyse & Businessplan",
  "croiss.kpi_titre": "Die aktuellen Zahlen",
  "croiss.kpi_sous": "Live abgerufen. Der Nordstern steht zuerst: alles andere ist zweitrangig.",
  "croiss.kpi_ko": "Zahlen derzeit nicht verfügbar.",
  "croiss.kpi_actives": "Aktive Familien (7 T)", "croiss.kpi_actives_p": "Nordstern",
  "croiss.kpi_familles": "Registrierte Familien", "croiss.kpi_nouvelles": "Neu (30 T)",
  "croiss.kpi_parrainages": "Angenommene Patenschaften", "croiss.kpi_attente": "Warteliste",
  "croiss.kpi_ouvertures": "Öffnungen (30 T)",
  "croiss.but": "Ziel:", "croiss.kpi": "Kennzahl:",
  "croiss.note": "Notizen (Kontakte, Entscheidungen, was funktioniert hat und was nicht)",
  "croiss.note_ph": "Z. B.: Schule Sankt Josef — Termin am 12.09. mit der Leitung.",
  "croiss.note_ok": "Notiz gespeichert.",
  "croiss.voir_mail": "E-Mail-Vorlage",
  "croiss.mails_titre": "✉️ E-Mail-Vorlagen",
  "croiss.mails_sous": "Vor dem Versand anpassen: Die Teile in geschweiften Klammern müssen weg. Eine unpersönliche E-Mail verpufft.",
  "croiss.mail_dest": "An:", "croiss.mail_quand": "Wann:", "croiss.mail_sujet": "Betreff:",
  "croiss.copier": "Text kopieren", "croiss.ouvrir_mail": "In meinem Mailprogramm öffnen",
  "croiss.copie": "Text kopiert.", "croiss.copie_ko": "Kopieren fehlgeschlagen: Text bitte manuell markieren.",
  "croiss.contraintes": "Meine zwei Einschränkungen",
  "croiss.semaine": "🗓️ Meine Sitzung dieser Woche",
  "croiss.semaine_sous": "Was in eine Stunde passt, in der Reihenfolge des Plans (insgesamt {min} Min.). Was nicht hineinpasst, wartet bis nächste Woche.",
  "croiss.reste": "noch ≈ {h} Std. Arbeit, also ≈ {sem} Wochen",
  "croiss.hors": "außerhalb des Rahmens",
  "croiss.plus_tard": "später",
  "croiss.duree": "Dauer:",
  "croiss.duree_val": "≈ {min} Min.",
  "croiss.kpi_activation": "Aktivierung Tag 1",
  "croiss.kpi_activation_p": "von {n} Familien",
  "croiss.sources": "Woher die Anmeldungen kommen (90 T)",
  "croiss.sources_fam": "Familien",
  "croiss.sources_att": "wartend",
  "croiss.url": "Direktlink: {url} (öffnet diesen Reiter, nur für Administratoren).",
  "croiss.err": "Speichern fehlgeschlagen."
});

/* ---- Tournantes : qui fait quoi, quand, jusqu'à quand (réécriture) ---- */
Object.assign(I18N.fr, {
  "rot.phrase": "{taches} — à tour de rôle, {rythme}, entre {enfants}.",
  "rot.phrase_off": "Sauf {jours}.",
  "rot.rythme_jour": "chaque jour",
  "rot.rythme_semaine": "chaque semaine",
  "rot.et": "et",
  "rot.en_cours": "En ce moment : {prenom}, jusqu'au {jour}.",
  "rot.ensuite": "Ensuite : {prenom}.",
  "rot.apercu": "Prochains tours",
  "rot.depuis": "Tournante commencée le {jour}.",
  "rot.bascule": "Le tour change le…",
  "rot.bascule_aide": "Chaque {jour}, la tâche passe à l'enfant suivant.",
  "rot.apercu_creation": "Ce que ça donnera",
  "rot.moi_titre": "C'est ton tour !",
  "rot.autre_titre": "C'est le tour de {prenom}",
  "rot.jusqu_a": "Jusqu'à {jour}.",
  "rot.ensuite_enf": "Ensuite, ce sera {prenom}.",
  "rot.ton_tour": "Ton tour revient {jour}.",
  "rot.off_titre": "Pas de tour aujourd'hui",
  "rot.off_txt": "C'est un jour de congé : personne ne s'en occupe.",
  "rot.badge": "C'est ton tour",
  "rot.priorite_aide": "Pour les enfants de la tournante, la tâche n'apparaît que le jour de leur tour : rien d'autre à régler. Les enfants qui n'en font pas partie la gardent comme d'habitude.",
});
Object.assign(I18N.en, {
  "rot.phrase": "{taches} — taking turns, {rythme}, between {enfants}.",
  "rot.phrase_off": "Except {jours}.",
  "rot.rythme_jour": "every day",
  "rot.rythme_semaine": "every week",
  "rot.et": "and",
  "rot.en_cours": "Right now: {prenom}, until {jour}.",
  "rot.ensuite": "Next: {prenom}.",
  "rot.apercu": "Upcoming turns",
  "rot.depuis": "Rotation started on {jour}.",
  "rot.bascule": "The turn changes on…",
  "rot.bascule_aide": "Every {jour}, the task moves to the next child.",
  "rot.apercu_creation": "How it will look",
  "rot.moi_titre": "It's your turn!",
  "rot.autre_titre": "It's {prenom}'s turn",
  "rot.jusqu_a": "Until {jour}.",
  "rot.ensuite_enf": "Then it will be {prenom}.",
  "rot.ton_tour": "Your turn comes back on {jour}.",
  "rot.off_titre": "No turn today",
  "rot.off_txt": "It's a day off: nobody takes care of it.",
  "rot.badge": "It's your turn",
  "rot.priorite_aide": "For the children in the rotation, the task only shows up on their turn — nothing else to set. Children outside the rotation keep it as usual.",
});
Object.assign(I18N.nl, {
  "rot.phrase": "{taches} — om beurten, {rythme}, tussen {enfants}.",
  "rot.phrase_off": "Behalve {jours}.",
  "rot.rythme_jour": "elke dag",
  "rot.rythme_semaine": "elke week",
  "rot.et": "en",
  "rot.en_cours": "Op dit moment: {prenom}, tot {jour}.",
  "rot.ensuite": "Daarna: {prenom}.",
  "rot.apercu": "Volgende beurten",
  "rot.depuis": "Toerbeurt gestart op {jour}.",
  "rot.bascule": "De beurt wisselt op…",
  "rot.bascule_aide": "Elke {jour} gaat de taak naar het volgende kind.",
  "rot.apercu_creation": "Zo wordt het",
  "rot.moi_titre": "Het is jouw beurt!",
  "rot.autre_titre": "Het is de beurt van {prenom}",
  "rot.jusqu_a": "Tot {jour}.",
  "rot.ensuite_enf": "Daarna is {prenom} aan de beurt.",
  "rot.ton_tour": "Jouw beurt komt terug op {jour}.",
  "rot.off_titre": "Vandaag geen beurt",
  "rot.off_txt": "Het is een rustdag: niemand doet het.",
  "rot.badge": "Het is jouw beurt",
  "rot.priorite_aide": "Voor de kinderen in de toerbeurt verschijnt de taak alleen op hun beurt — verder niets in te stellen. Kinderen buiten de toerbeurt houden ze zoals gewoonlijk.",
});
Object.assign(I18N.de, {
  "rot.phrase": "{taches} — abwechselnd, {rythme}, zwischen {enfants}.",
  "rot.phrase_off": "Außer {jours}.",
  "rot.rythme_jour": "jeden Tag",
  "rot.rythme_semaine": "jede Woche",
  "rot.et": "und",
  "rot.en_cours": "Gerade: {prenom}, bis {jour}.",
  "rot.ensuite": "Danach: {prenom}.",
  "rot.apercu": "Nächste Runden",
  "rot.depuis": "Wechsel begonnen am {jour}.",
  "rot.bascule": "Der Wechsel erfolgt am…",
  "rot.bascule_aide": "Jeden {jour} geht die Aufgabe an das nächste Kind.",
  "rot.apercu_creation": "So wird es aussehen",
  "rot.moi_titre": "Du bist dran!",
  "rot.autre_titre": "{prenom} ist dran",
  "rot.jusqu_a": "Bis {jour}.",
  "rot.ensuite_enf": "Danach ist {prenom} dran.",
  "rot.ton_tour": "Du bist wieder dran am {jour}.",
  "rot.off_titre": "Heute keine Runde",
  "rot.off_txt": "Heute ist frei: niemand kümmert sich darum.",
  "rot.badge": "Du bist dran",
  "rot.priorite_aide": "Für die Kinder im Wechsel erscheint die Aufgabe nur an ihrem Tag — sonst ist nichts einzustellen. Kinder außerhalb des Wechsels behalten sie wie gewohnt.",
});

/* ---- Tournantes : le tour qui commence demain ---- */
Object.assign(I18N.fr, {
  "rot.ton_tour_demain": "Demain, ce sera ton tour !", "rot.section_famille": "Chez tes frères et sœurs",
});
Object.assign(I18N.en, {
  "rot.ton_tour_demain": "Tomorrow it's your turn!", "rot.section_famille": "For your brothers and sisters",
});
Object.assign(I18N.nl, {
  "rot.ton_tour_demain": "Morgen ben jij aan de beurt!", "rot.section_famille": "Bij je broers en zussen",
});
Object.assign(I18N.de, {
  "rot.ton_tour_demain": "Morgen bist du dran!", "rot.section_famille": "Bei deinen Geschwistern",
});

/* ---- Envois automatiques & réponses types (admin) ---- */
Object.assign(I18N.fr, {
  "croiss.envois_titre": "🤖 Envois automatiques",
  "croiss.envois_sous": "Bienvenue, relance d'activation et rapport mensuel. Un e-mail parti ne se rattrape pas : rien ne part tant que l'interrupteur est coupé, et un même envoi ne peut jamais partir deux fois.",
  "croiss.envois_switch": "Armer les envois automatiques",
  "croiss.envois_on": "Armés : la bienvenue part à la création d'une famille ; les relances et le rapport partent à ta première ouverture de l'app chaque jour.",
  "croiss.envois_off": "Coupés : aucun e-mail automatique n'est envoyé. Tu peux quand même voir ci-dessous qui serait relancé.",
  "croiss.file_titre": "{n} famille(s) à relancer",
  "croiss.file_vide": "Personne à relancer : toutes les familles inscrites ont démarré. 🎉",
  "croiss.file_jours": "inscrite depuis {n} j",
  "croiss.file_envoyer": "Envoyer les {n} relances maintenant",
  "croiss.file_confirm": "Envoyer {n} e-mail(s) de relance ? Cette action est irréversible.",
  "croiss.file_bloque": "Arme d'abord les envois ci-dessus pour pouvoir envoyer.",
  "croiss.mails_partis": "{n} e-mail(s) envoyé(s).",
  "croiss.reponses_titre": "Réponses types au support",
  "croiss.reponses_sous": "À copier-coller puis adapter en une ligne. Le support doit coûter des secondes, pas des minutes.",
});
Object.assign(I18N.en, {
  "croiss.envois_titre": "🤖 Automatic emails",
  "croiss.envois_sous": "Welcome, activation reminder and monthly report. A sent email cannot be recalled: nothing goes out while the switch is off, and the same email can never be sent twice.",
  "croiss.envois_switch": "Arm automatic emails",
  "croiss.envois_on": "Armed: the welcome goes out when a family is created; reminders and the report go out the first time you open the app each day.",
  "croiss.envois_off": "Off: no automatic email is sent. You can still see below who would be reminded.",
  "croiss.file_titre": "{n} family/families to remind",
  "croiss.file_vide": "Nobody to remind: every registered family has started. 🎉",
  "croiss.file_jours": "registered {n} d ago",
  "croiss.file_envoyer": "Send the {n} reminders now",
  "croiss.file_confirm": "Send {n} reminder email(s)? This cannot be undone.",
  "croiss.file_bloque": "Arm the emails above first to be able to send.",
  "croiss.mails_partis": "{n} email(s) sent.",
  "croiss.reponses_titre": "Canned support replies",
  "croiss.reponses_sous": "Copy, paste, adapt in one line. Support should cost seconds, not minutes.",
});
Object.assign(I18N.nl, {
  "croiss.envois_titre": "🤖 Automatische e-mails",
  "croiss.envois_sous": "Welkom, activeringsherinnering en maandrapport. Een verzonden e-mail haal je niet terug: er vertrekt niets zolang de schakelaar uit staat, en dezelfde e-mail kan nooit twee keer vertrekken.",
  "croiss.envois_switch": "Automatische e-mails inschakelen",
  "croiss.envois_on": "Ingeschakeld: het welkom vertrekt bij het aanmaken van een gezin; herinneringen en rapport vertrekken bij je eerste opening van de app per dag.",
  "croiss.envois_off": "Uit: er wordt geen enkele automatische e-mail verzonden. Je ziet hieronder wel wie herinnerd zou worden.",
  "croiss.file_titre": "{n} gezin(nen) te herinneren",
  "croiss.file_vide": "Niemand te herinneren: alle ingeschreven gezinnen zijn gestart. 🎉",
  "croiss.file_jours": "{n} d ingeschreven",
  "croiss.file_envoyer": "De {n} herinneringen nu versturen",
  "croiss.file_confirm": "{n} herinneringsmail(s) versturen? Dit kan niet ongedaan gemaakt worden.",
  "croiss.file_bloque": "Schakel eerst de e-mails hierboven in om te kunnen versturen.",
  "croiss.mails_partis": "{n} e-mail(s) verzonden.",
  "croiss.reponses_titre": "Standaardantwoorden voor support",
  "croiss.reponses_sous": "Kopiëren, plakken, in één regel aanpassen. Support mag seconden kosten, geen minuten.",
});
Object.assign(I18N.de, {
  "croiss.envois_titre": "🤖 Automatische E-Mails",
  "croiss.envois_sous": "Willkommen, Aktivierungserinnerung und Monatsbericht. Eine gesendete E-Mail lässt sich nicht zurückholen: Solange der Schalter aus ist, geht nichts raus, und dieselbe E-Mail kann nie zweimal rausgehen.",
  "croiss.envois_switch": "Automatische E-Mails scharfschalten",
  "croiss.envois_on": "Scharf: Die Willkommensmail geht beim Anlegen einer Familie raus; Erinnerungen und Bericht beim ersten Öffnen der App pro Tag.",
  "croiss.envois_off": "Aus: Es wird keine automatische E-Mail versendet. Wer erinnert würde, siehst du trotzdem unten.",
  "croiss.file_titre": "{n} Familie(n) zu erinnern",
  "croiss.file_vide": "Niemand zu erinnern: Alle registrierten Familien sind gestartet. 🎉",
  "croiss.file_jours": "seit {n} T registriert",
  "croiss.file_envoyer": "Die {n} Erinnerungen jetzt senden",
  "croiss.file_confirm": "{n} Erinnerungs-E-Mail(s) senden? Das lässt sich nicht rückgängig machen.",
  "croiss.file_bloque": "Schalte oben zuerst die E-Mails scharf, um senden zu können.",
  "croiss.mails_partis": "{n} E-Mail(s) gesendet.",
  "croiss.reponses_titre": "Standardantworten für den Support",
  "croiss.reponses_sous": "Kopieren, einfügen, in einer Zeile anpassen. Support soll Sekunden kosten, nicht Minuten.",
});

/* ---- Minimisation : surnom accepté, naissance au mois ---- */
Object.assign(I18N.fr, {
  "profil.prenom": "Prénom ou surnom",
  "profil.naissance": "Naissance (mois et année)",
  "profil.prenom_aide": "Un surnom suffit (« Loulou », « P'tit chef ») : moins de données réelles enregistrées, même expérience pour l'enfant.",
  "profil.naissance_aide": "Le mois suffit : il sert uniquement à adapter les missions et l'affichage à l'âge.",
});
Object.assign(I18N.en, {
  "profil.prenom": "First name or nickname",
  "profil.naissance": "Birth (month and year)",
  "profil.prenom_aide": "A nickname is enough: less real data stored, same experience for the child.",
  "profil.naissance_aide": "The month is enough: it only serves to adapt missions and display to the age.",
});
Object.assign(I18N.nl, {
  "profil.prenom": "Voornaam of bijnaam",
  "profil.naissance": "Geboorte (maand en jaar)",
  "profil.prenom_aide": "Een bijnaam volstaat: minder echte gegevens bewaard, dezelfde ervaring voor het kind.",
  "profil.naissance_aide": "De maand volstaat: die dient enkel om opdrachten en weergave aan de leeftijd aan te passen.",
});
Object.assign(I18N.de, {
  "profil.prenom": "Vorname oder Spitzname",
  "profil.naissance": "Geburt (Monat und Jahr)",
  "profil.prenom_aide": "Ein Spitzname genügt: weniger echte Daten gespeichert, gleiches Erlebnis für das Kind.",
  "profil.naissance_aide": "Der Monat genügt: Er dient nur dazu, Aufgaben und Anzeige dem Alter anzupassen.",
});

/* ---- Boîte à idées : accueillante, sans engagement affiché ---- */
Object.assign(I18N.fr, {
  "fb.titre": "💡 Boîte à idées",
  "fb.sous": "Une remarque, une idée, un détail qui coince ? Écris-le ici : chaque message rejoint la liste des améliorations passées en revue à chaque mise à jour.",
  "fb.message_ph": "Ce qui te ferait plaisir, ou ce qui t'a gêné…",
});
Object.assign(I18N.en, {
  "fb.titre": "💡 Idea box",
  "fb.sous": "A remark, an idea, a detail that bothers you? Write it here: every message joins the list of improvements reviewed at each update.",
  "fb.message_ph": "What would help you, or what got in your way…",
});
Object.assign(I18N.nl, {
  "fb.titre": "💡 Ideeënbus",
  "fb.sous": "Een opmerking, een idee, een detail dat stoort? Schrijf het hier: elk bericht komt op de lijst met verbeteringen die bij elke update wordt bekeken.",
  "fb.message_ph": "Wat je zou helpen, of wat je stoorde…",
});
Object.assign(I18N.de, {
  "fb.titre": "💡 Ideenbox",
  "fb.sous": "Eine Bemerkung, eine Idee, ein störendes Detail? Schreib es hier: Jede Nachricht kommt auf die Liste der Verbesserungen, die bei jedem Update durchgesehen wird.",
  "fb.message_ph": "Was dir helfen würde, oder was dich gestört hat…",
});

/* ---- Revue des idées : consigne pour Claude Code, chantier récurrent ---- */
Object.assign(I18N.fr, {
  "retours.consigne": "Consigne pour Claude Code",
  "retours.consigne_aide": "Met les retours non lus en forme de consigne prête à coller dans Claude Code : contexte du projet, garde-fous, et demande de trier avant de coder.",
  "retours.consigne_vide": "Aucun retour non lu à mettre en forme.",
  "croiss.recurrent": "chaque mois",
});
Object.assign(I18N.en, {
  "retours.consigne": "Prompt for Claude Code",
  "retours.consigne_aide": "Turns unread feedback into a prompt ready to paste into Claude Code: project context, guardrails, and a request to triage before coding.",
  "retours.consigne_vide": "No unread feedback to format.",
  "croiss.recurrent": "every month",
});
Object.assign(I18N.nl, {
  "retours.consigne": "Instructie voor Claude Code",
  "retours.consigne_aide": "Zet ongelezen feedback om in een instructie klaar om in Claude Code te plakken: projectcontext, grenzen, en de vraag eerst te sorteren.",
  "retours.consigne_vide": "Geen ongelezen feedback om op te maken.",
  "croiss.recurrent": "elke maand",
});
Object.assign(I18N.de, {
  "retours.consigne": "Anweisung für Claude Code",
  "retours.consigne_aide": "Wandelt ungelesene Rückmeldungen in eine Anweisung um, die sich direkt in Claude Code einfügen lässt: Projektkontext, Leitplanken und die Bitte, vor dem Programmieren zu sortieren.",
  "retours.consigne_vide": "Keine ungelesenen Rückmeldungen zum Aufbereiten.",
  "croiss.recurrent": "jeden Monat",
});

/* ---- Page publique : promesse, captures réelles, principe ---- */
Object.assign(I18N.fr, {
  "auth.hero_sous": "Deux minutes par jour, en famille : {app} valorise les comportements positifs des enfants de 2 à 7 ans, sans jamais retirer de points.",
  "auth.shot1": "L'enfant coche ce qu'il a fait et gagne des Cœurs 💛",
  "auth.shot1_alt": "Écran de l'enfant : la liste des missions du jour, chacune avec les cœurs qu'elle rapporte.",
  "auth.shot2": "Ses efforts font grandir son avatar 🎨",
  "auth.shot2_alt": "Écran avatar : le personnage de l'enfant et les éléments qu'il peut débloquer avec ses cœurs.",
  "auth.shot3": "Le parent choisit et valide, en deux minutes ⚙️",
  "auth.shot3_alt": "Espace parents : les premiers pas et le choix des missions proposées pour la journée.",
  "auth.principe_titre": "🌈 Réparer plutôt que punir",
  "auth.principe_1": "Ici, <strong>aucun point n'est jamais retiré</strong>. Quand quelque chose se passe mal — une dispute, un objet cassé, un mot qui blesse — l'enfant choisit un <strong>geste de réparation</strong> : ranger, s'excuser, aider la personne concernée. Et c'est ce geste-là qui est récompensé.",
  "auth.principe_2": "Pourquoi ? Parce que retirer des points apprend surtout à cacher l'erreur. Réparer apprend à reconnaître son geste, à prendre soin de l'autre, et à repartir du bon pied.",
  "auth.principe_faq": "Voir toutes les questions fréquentes →",
});
Object.assign(I18N.en, {
  "auth.hero_sous": "Two minutes a day, together: {app} rewards positive behaviour in children aged 2 to 7 — and never takes points away.",
  "auth.shot1": "The child ticks what they did and earns Hearts 💛",
  "auth.shot1_alt": "Child screen: the day's missions, each with the hearts it earns.",
  "auth.shot2": "Their efforts grow their avatar 🎨",
  "auth.shot2_alt": "Avatar screen: the child's character and the items they can unlock with their hearts.",
  "auth.shot3": "The parent picks and approves, in two minutes ⚙️",
  "auth.shot3_alt": "Parents' area: the first steps and the choice of missions offered for the day.",
  "auth.principe_titre": "🌈 Repair rather than punish",
  "auth.principe_1": "Here, <strong>points are never taken away</strong>. When something goes wrong — an argument, something broken, a hurtful word — the child chooses a <strong>repair gesture</strong>: tidy up, apologise, help the person concerned. And it is that gesture which is rewarded.",
  "auth.principe_2": "Why? Because taking points away mostly teaches children to hide the mistake. Repairing teaches them to own the act, care for the other person, and start afresh.",
  "auth.principe_faq": "See all frequently asked questions →",
});
Object.assign(I18N.nl, {
  "auth.hero_sous": "Twee minuten per dag, samen: {app} waardeert positief gedrag bij kinderen van 2 tot 7 jaar — en neemt nooit punten af.",
  "auth.shot1": "Het kind vinkt af wat het deed en verdient Hartjes 💛",
  "auth.shot1_alt": "Kinderscherm: de opdrachten van de dag, elk met de hartjes die ze opbrengen.",
  "auth.shot2": "Zijn inspanningen laten zijn avatar groeien 🎨",
  "auth.shot2_alt": "Avatarscherm: het figuurtje van het kind en wat het met zijn hartjes kan vrijspelen.",
  "auth.shot3": "De ouder kiest en keurt goed, in twee minuten ⚙️",
  "auth.shot3_alt": "Ouderomgeving: de eerste stappen en de keuze van de opdrachten voor de dag.",
  "auth.principe_titre": "🌈 Herstellen in plaats van straffen",
  "auth.principe_1": "Hier gaan er <strong>nooit punten af</strong>. Als er iets misgaat — ruzie, iets kapot, een kwetsend woord — kiest het kind een <strong>herstelgebaar</strong>: opruimen, excuses aanbieden, de betrokken persoon helpen. En net dat gebaar wordt belond.",
  "auth.principe_2": "Waarom? Omdat punten afnemen vooral leert om de fout te verbergen. Herstellen leert het kind zijn daad te erkennen, voor de ander te zorgen en met een propere lei verder te gaan.",
  "auth.principe_faq": "Alle veelgestelde vragen bekijken →",
});
Object.assign(I18N.de, {
  "auth.hero_sous": "Zwei Minuten am Tag, gemeinsam: {app} bestärkt positives Verhalten bei Kindern von 2 bis 7 Jahren — und zieht nie Punkte ab.",
  "auth.shot1": "Das Kind hakt ab, was es geschafft hat, und verdient Herzen 💛",
  "auth.shot1_alt": "Kinder-Bildschirm: die Aufgaben des Tages, jede mit den Herzen, die sie bringt.",
  "auth.shot2": "Seine Anstrengungen lassen den Avatar wachsen 🎨",
  "auth.shot2_alt": "Avatar-Bildschirm: die Figur des Kindes und was es mit seinen Herzen freischalten kann.",
  "auth.shot3": "Die Eltern wählen und bestätigen, in zwei Minuten ⚙️",
  "auth.shot3_alt": "Elternbereich: die ersten Schritte und die Auswahl der Aufgaben für den Tag.",
  "auth.principe_titre": "🌈 Wiedergutmachen statt bestrafen",
  "auth.principe_1": "Hier werden <strong>nie Punkte abgezogen</strong>. Wenn etwas schiefgeht — Streit, etwas kaputt, ein verletzendes Wort — wählt das Kind eine <strong>Geste der Wiedergutmachung</strong>: aufräumen, sich entschuldigen, der betroffenen Person helfen. Und genau diese Geste wird belohnt.",
  "auth.principe_2": "Warum? Weil Punkteabzug vor allem lehrt, den Fehler zu verbergen. Wiedergutmachen lehrt, zur eigenen Tat zu stehen, sich um den anderen zu kümmern und neu zu beginnen.",
  "auth.principe_faq": "Alle häufigen Fragen ansehen →",
});

/* ---- Parrainage : coefficient viral ---- */
Object.assign(I18N.fr, {
  "croiss.kpi_k": "Coefficient viral k",
  "croiss.kpi_k_p": "cible > 0,4",
  "croiss.kpi_parrainages_p": "dont {n} sur 30 j",
});
Object.assign(I18N.en, {
  "croiss.kpi_k": "Viral coefficient k",
  "croiss.kpi_k_p": "target > 0.4",
  "croiss.kpi_parrainages_p": "of which {n} in 30 d",
});
Object.assign(I18N.nl, {
  "croiss.kpi_k": "Virale coëfficiënt k",
  "croiss.kpi_k_p": "doel > 0,4",
  "croiss.kpi_parrainages_p": "waarvan {n} op 30 d",
});
Object.assign(I18N.de, {
  "croiss.kpi_k": "Viraler Koeffizient k",
  "croiss.kpi_k_p": "Ziel > 0,4",
  "croiss.kpi_parrainages_p": "davon {n} in 30 T",
});

/* ---- Parrainage : demander au bon moment ---- */
Object.assign(I18N.fr, {
  "bm.titre": "🎉 Beau moment en famille !",
  "bm.texte": "Vous venez de débloquer cette activité ensemble. Si l'envie vous prend, vous pouvez offrir {app} à une famille amie — c'est la seule façon dont l'app se fait connaître.",
  "bm.bouton": "Offrir à une famille amie",
  "bm.masquer": "Ne plus me le proposer",
});
Object.assign(I18N.en, {
  "bm.titre": "🎉 A lovely family moment!",
  "bm.texte": "You just unlocked this activity together. If you feel like it, you can offer {app} to a family you know — it is the only way the app gets known.",
  "bm.bouton": "Offer it to a family you know",
  "bm.masquer": "Don't suggest this again",
});
Object.assign(I18N.nl, {
  "bm.titre": "🎉 Mooi gezinsmoment!",
  "bm.texte": "Jullie hebben deze activiteit samen vrijgespeeld. Als je wil, kan je {app} aan een bevriend gezin geven — zo raakt de app bekend.",
  "bm.bouton": "Aan een bevriend gezin geven",
  "bm.masquer": "Niet meer voorstellen",
});
Object.assign(I18N.de, {
  "bm.titre": "🎉 Ein schöner Familienmoment!",
  "bm.texte": "Ihr habt diese Aktivität gemeinsam freigespielt. Wenn du magst, kannst du {app} einer befreundeten Familie schenken — nur so wird die App bekannt.",
  "bm.bouton": "Einer befreundeten Familie schenken",
  "bm.masquer": "Nicht mehr vorschlagen",
});

/* ---- Vagues d'invitation (liste d'attente) ---- */
Object.assign(I18N.fr, {
  "vag.titre": "📨 Vagues d'invitation",
  "vag.sous": "Les accès s'ouvrent par petites vagues : chaque famille démarre accompagnée, et le support reste tenable.",
  "vag.switch": "Inscriptions par vagues (liste d'attente)",
  "vag.mode_ouvert": "Les inscriptions sont ouvertes à tous. La liste d'attente n'est pas proposée.",
  "vag.mode_vagues": "Seuls les invités, les parrainés et les candidats d'une vague peuvent créer une famille. Les autres rejoignent la liste d'attente.",
  "vag.taille": "Familles par vague",
  "vag.taille_aide": "{n} familles par mois : c'est ce qu'une heure par semaine permet d'accompagner.",
  "vag.kpi_invites": "Invités",
  "vag.kpi_taux": "Conversion",
  "vag.kpi_taux_p": "{n} familles créées",
  "vag.kpi_attente": "En attente",
  "vag.critere_ok": "Conversion à {taux} % : au-dessus de 40 %, l'ouverture publique se tient.",
  "vag.critere_non": "Conversion à {taux} % : sous 40 %, mieux vaut garder les vagues.",
  "vag.rien_a_inviter": "Personne à inviter pour l'instant.",
  "vag.prochaine": "Prochaine vague : {n} candidat·e(s)",
  "vag.jours": "invité·e depuis {n} j",
  "vag.envoyer": "Envoyer la vague ({n})",
  "vag.confirm": "Envoyer l'invitation à {n} candidat·e(s) ?",
  "vag.relances": "Relance à J+7 : {n} candidat·e(s)",
  "vag.relancer": "Relancer une seule fois ({n})",
});
Object.assign(I18N.en, {
  "vag.titre": "📨 Invitation waves",
  "vag.sous": "Access opens in small waves: every family gets a proper start, and support stays manageable.",
  "vag.switch": "Sign-ups by waves (waiting list)",
  "vag.mode_ouvert": "Sign-ups are open to everyone. The waiting list is not offered.",
  "vag.mode_vagues": "Only invited, referred and wave candidates can create a family. Everyone else joins the waiting list.",
  "vag.taille": "Families per wave",
  "vag.taille_aide": "{n} families a month: that is what one hour a week can support.",
  "vag.kpi_invites": "Invited",
  "vag.kpi_taux": "Conversion",
  "vag.kpi_taux_p": "{n} families created",
  "vag.kpi_attente": "Waiting",
  "vag.critere_ok": "Conversion at {taux} %: above 40 %, opening publicly holds up.",
  "vag.critere_non": "Conversion at {taux} %: below 40 %, better keep the waves.",
  "vag.rien_a_inviter": "Nobody to invite right now.",
  "vag.prochaine": "Next wave: {n} candidate(s)",
  "vag.jours": "invited {n} d ago",
  "vag.envoyer": "Send the wave ({n})",
  "vag.confirm": "Send the invitation to {n} candidate(s)?",
  "vag.relances": "Day-7 reminder: {n} candidate(s)",
  "vag.relancer": "Remind once only ({n})",
});
Object.assign(I18N.nl, {
  "vag.titre": "📨 Uitnodigingsgolven",
  "vag.sous": "Toegang gaat open in kleine golven: elk gezin start begeleid en de ondersteuning blijft haalbaar.",
  "vag.switch": "Inschrijvingen in golven (wachtlijst)",
  "vag.mode_ouvert": "Inschrijvingen staan open voor iedereen. De wachtlijst wordt niet aangeboden.",
  "vag.mode_vagues": "Alleen uitgenodigde, doorverwezen en golfkandidaten kunnen een gezin aanmaken. De anderen komen op de wachtlijst.",
  "vag.taille": "Gezinnen per golf",
  "vag.taille_aide": "{n} gezinnen per maand: dat is wat één uur per week toelaat.",
  "vag.kpi_invites": "Uitgenodigd",
  "vag.kpi_taux": "Conversie",
  "vag.kpi_taux_p": "{n} gezinnen aangemaakt",
  "vag.kpi_attente": "Op de wachtlijst",
  "vag.critere_ok": "Conversie op {taux} %: boven 40 % is publiek openen verantwoord.",
  "vag.critere_non": "Conversie op {taux} %: onder 40 % beter de golven behouden.",
  "vag.rien_a_inviter": "Voorlopig niemand om uit te nodigen.",
  "vag.prochaine": "Volgende golf: {n} kandidaat/kandidaten",
  "vag.jours": "{n} d uitgenodigd",
  "vag.envoyer": "Golf versturen ({n})",
  "vag.confirm": "De uitnodiging naar {n} kandidaat/kandidaten versturen?",
  "vag.relances": "Herinnering op dag 7: {n} kandidaat/kandidaten",
  "vag.relancer": "Eén keer herinneren ({n})",
});
Object.assign(I18N.de, {
  "vag.titre": "📨 Einladungswellen",
  "vag.sous": "Der Zugang öffnet in kleinen Wellen: jede Familie startet begleitet, und der Support bleibt tragbar.",
  "vag.switch": "Anmeldungen in Wellen (Warteliste)",
  "vag.mode_ouvert": "Die Anmeldungen sind für alle offen. Die Warteliste wird nicht angeboten.",
  "vag.mode_vagues": "Nur eingeladene, empfohlene und Wellen-Kandidaten können eine Familie anlegen. Alle anderen kommen auf die Warteliste.",
  "vag.taille": "Familien pro Welle",
  "vag.taille_aide": "{n} Familien pro Monat: mehr lässt eine Stunde pro Woche nicht zu.",
  "vag.kpi_invites": "Eingeladen",
  "vag.kpi_taux": "Umwandlung",
  "vag.kpi_taux_p": "{n} Familien angelegt",
  "vag.kpi_attente": "Auf der Warteliste",
  "vag.critere_ok": "Umwandlung bei {taux} %: über 40 % ist die öffentliche Öffnung tragfähig.",
  "vag.critere_non": "Umwandlung bei {taux} %: unter 40 % besser bei den Wellen bleiben.",
  "vag.rien_a_inviter": "Derzeit niemand einzuladen.",
  "vag.prochaine": "Nächste Welle: {n} Kandidat(en)",
  "vag.jours": "seit {n} T eingeladen",
  "vag.envoyer": "Welle senden ({n})",
  "vag.confirm": "Die Einladung an {n} Kandidat(en) senden?",
  "vag.relances": "Erinnerung an Tag 7: {n} Kandidat(en)",
  "vag.relancer": "Nur einmal erinnern ({n})",
});

/* ---- Retours : compteur de ce qui reste à passer en revue ---- */
Object.assign(I18N.fr, {
  "retours.restant": "{n} retour(s) encore à passer en revue.",
  "retours.restant_zero": "Tous les retours ont été traités.",
});
Object.assign(I18N.en, {
  "retours.restant": "{n} item(s) still to review.",
  "retours.restant_zero": "All feedback has been handled.",
});
Object.assign(I18N.nl, {
  "retours.restant": "Nog {n} bericht(en) te bekijken.",
  "retours.restant_zero": "Alle feedback is behandeld.",
});
Object.assign(I18N.de, {
  "retours.restant": "Noch {n} Meldung(en) zu prüfen.",
  "retours.restant_zero": "Alle Rückmeldungen sind bearbeitet.",
});

/* ---- Accessibilité : noms accessibles des boutons-icônes ---- */
Object.assign(I18N.fr, {
  "a11y.supprimer": "Supprimer", "a11y.modifier": "Modifier",
  "a11y.precedent": "Précédent", "a11y.suivant": "Suivant",
  "a11y.ajouter_un": "Ajouter un point", "a11y.retirer_un": "Retirer un point",
  "a11y.valider": "Valider",
  "a11y.refuser": "Refuser",
});
Object.assign(I18N.en, {
  "a11y.supprimer": "Delete", "a11y.modifier": "Edit",
  "a11y.precedent": "Previous", "a11y.suivant": "Next",
  "a11y.ajouter_un": "Add a point", "a11y.retirer_un": "Remove a point",
  "a11y.valider": "Confirm",
  "a11y.refuser": "Decline",
});
Object.assign(I18N.nl, {
  "a11y.supprimer": "Verwijderen", "a11y.modifier": "Bewerken",
  "a11y.precedent": "Vorige", "a11y.suivant": "Volgende",
  "a11y.ajouter_un": "Een punt toevoegen", "a11y.retirer_un": "Een punt verwijderen",
  "a11y.valider": "Bevestigen",
  "a11y.refuser": "Weigeren",
});
Object.assign(I18N.de, {
  "a11y.supprimer": "Löschen", "a11y.modifier": "Bearbeiten",
  "a11y.precedent": "Zurück", "a11y.suivant": "Weiter",
  "a11y.ajouter_un": "Einen Punkt hinzufügen", "a11y.retirer_un": "Einen Punkt entfernen",
  "a11y.valider": "Bestätigen",
  "a11y.refuser": "Ablehnen",
});

/* ---- Coût, capacité et soutien (admin » Croissance) ---- */
Object.assign(I18N.fr, {
  "cout.titre": "🕊️ Coût, dons et plafond",
  "cout.sous": "Ce que le projet coûte réellement, ce que les dons couvrent, et la place qui reste avant le plafond.",
  "cout.domaine": "Nom de domaine", "cout.domaine_n": "famiteam.com, renouvellement annuel",
  "cout.mail": "Envoi d'e-mails", "cout.mail_n": "boîte et SMTP sortant",
  "cout.base": "Base de données", "cout.base_n": "palier gratuit Supabase, tant qu'il suffit",
  "cout.site": "Hébergement du site", "cout.site_n": "palier gratuit Vercel, projet non marchand",
  "cout.gratuit": "0 €", "cout.total": "Total par an",
  "cout.dons": "Dons reçus", "cout.dons_p": "{n} don(s)",
  "cout.couverture": "Frais couverts", "cout.couverture_p": "sur {total} par an",
  "cout.equilibre_ok": "Les frais de l'année sont couverts. Tout don supplémentaire reste en réserve pour l'année suivante — il n'y a rien à en tirer d'autre.",
  "cout.equilibre_non": "Les frais ne sont pas encore couverts ; ils restent à charge de l'éditeur. C'est assumé : le don est facultatif et l'app est gratuite pour toutes les familles.",
  "cout.plafond": "Familles", "cout.plafond_p": "{pct} % du plafond",
  "cout.base_pleine": "Base remplie", "cout.base_pleine_p": "{u} sur {max} gratuits",
  "cout.plafond_libre": "Encore {reste} familles avant le plafond. Au-delà, les inscriptions passeront d'elles-mêmes en liste d'attente.",
  "cout.plafond_atteint": "Plafond atteint : les inscriptions sont passées en liste d'attente. Mieux vaut attendre son tour qu'un service qui ne suit plus.",
  "cout.plafond_reglage": "Plafond de familles",
  "cout.plafond_aide": "Deux limites le fixent : le temps de support (une heure par semaine) et les 500 Mo gratuits de la base, soit environ 1 000 familles.",
  "cap.bascule": "Plafond atteint : les inscriptions passent en liste d'attente.",
});
Object.assign(I18N.en, {
  "cout.titre": "🕊️ Cost, donations and cap",
  "cout.sous": "What the project really costs, what donations cover, and how much room is left before the cap.",
  "cout.domaine": "Domain name", "cout.domaine_n": "famiteam.com, yearly renewal",
  "cout.mail": "Email sending", "cout.mail_n": "mailbox and outgoing SMTP",
  "cout.base": "Database", "cout.base_n": "Supabase free tier, while it is enough",
  "cout.site": "Site hosting", "cout.site_n": "Vercel free tier, non-commercial project",
  "cout.gratuit": "€0", "cout.total": "Total per year",
  "cout.dons": "Donations received", "cout.dons_p": "{n} donation(s)",
  "cout.couverture": "Costs covered", "cout.couverture_p": "out of {total} a year",
  "cout.equilibre_ok": "This year's costs are covered. Any further donation stays in reserve for next year — there is nothing else to draw from it.",
  "cout.equilibre_non": "Costs are not covered yet; the editor carries them. That is by design: donating is optional and the app is free for every family.",
  "cout.plafond": "Families", "cout.plafond_p": "{pct} % of the cap",
  "cout.base_pleine": "Database used", "cout.base_pleine_p": "{u} of {max} free",
  "cout.plafond_libre": "{reste} families to go before the cap. Beyond it, sign-ups switch to a waiting list on their own.",
  "cout.plafond_atteint": "Cap reached: sign-ups have switched to a waiting list. Waiting your turn beats a service that can no longer keep up.",
  "cout.plafond_reglage": "Family cap",
  "cout.plafond_aide": "Two limits set it: support time (one hour a week) and the 500 MB free database tier, i.e. roughly 1,000 families.",
  "cap.bascule": "Cap reached: sign-ups switch to a waiting list.",
});
Object.assign(I18N.nl, {
  "cout.titre": "🕊️ Kosten, giften en plafond",
  "cout.sous": "Wat het project echt kost, wat de giften dekken, en hoeveel plaats er rest voor het plafond.",
  "cout.domaine": "Domeinnaam", "cout.domaine_n": "famiteam.com, jaarlijkse verlenging",
  "cout.mail": "E-mailverzending", "cout.mail_n": "mailbox en uitgaande SMTP",
  "cout.base": "Databank", "cout.base_n": "gratis Supabase-niveau, zolang het volstaat",
  "cout.site": "Hosting van de site", "cout.site_n": "gratis Vercel-niveau, niet-commercieel project",
  "cout.gratuit": "€ 0", "cout.total": "Totaal per jaar",
  "cout.dons": "Ontvangen giften", "cout.dons_p": "{n} gift(en)",
  "cout.couverture": "Kosten gedekt", "cout.couverture_p": "op {total} per jaar",
  "cout.equilibre_ok": "De kosten van dit jaar zijn gedekt. Elke extra gift blijft in reserve voor volgend jaar — er valt niets anders uit te halen.",
  "cout.equilibre_non": "De kosten zijn nog niet gedekt; de uitgever draagt ze. Dat is bewust: geven is vrijwillig en de app is gratis voor alle gezinnen.",
  "cout.plafond": "Gezinnen", "cout.plafond_p": "{pct} % van het plafond",
  "cout.base_pleine": "Databank gevuld", "cout.base_pleine_p": "{u} van {max} gratis",
  "cout.plafond_libre": "Nog {reste} gezinnen voor het plafond. Daarna gaan de inschrijvingen vanzelf naar een wachtlijst.",
  "cout.plafond_atteint": "Plafond bereikt: de inschrijvingen staan op wachtlijst. Wachten op je beurt is beter dan een dienst die niet meer volgt.",
  "cout.plafond_reglage": "Plafond aantal gezinnen",
  "cout.plafond_aide": "Twee grenzen bepalen het: de ondersteuningstijd (één uur per week) en de 500 MB gratis databank, dus ongeveer 1 000 gezinnen.",
  "cap.bascule": "Plafond bereikt: de inschrijvingen gaan naar een wachtlijst.",
});
Object.assign(I18N.de, {
  "cout.titre": "🕊️ Kosten, Spenden und Obergrenze",
  "cout.sous": "Was das Projekt wirklich kostet, was die Spenden decken, und wie viel Platz bis zur Obergrenze bleibt.",
  "cout.domaine": "Domainname", "cout.domaine_n": "famiteam.com, jährliche Verlängerung",
  "cout.mail": "E-Mail-Versand", "cout.mail_n": "Postfach und ausgehendes SMTP",
  "cout.base": "Datenbank", "cout.base_n": "kostenlose Supabase-Stufe, solange sie reicht",
  "cout.site": "Hosting der Website", "cout.site_n": "kostenlose Vercel-Stufe, nicht kommerzielles Projekt",
  "cout.gratuit": "0 €", "cout.total": "Gesamt pro Jahr",
  "cout.dons": "Erhaltene Spenden", "cout.dons_p": "{n} Spende(n)",
  "cout.couverture": "Kosten gedeckt", "cout.couverture_p": "von {total} pro Jahr",
  "cout.equilibre_ok": "Die Kosten dieses Jahres sind gedeckt. Jede weitere Spende bleibt als Reserve für das nächste Jahr — mehr ist daraus nicht zu holen.",
  "cout.equilibre_non": "Die Kosten sind noch nicht gedeckt; der Herausgeber trägt sie. Das ist so gewollt: Spenden ist freiwillig und die App ist für alle Familien kostenlos.",
  "cout.plafond": "Familien", "cout.plafond_p": "{pct} % der Obergrenze",
  "cout.base_pleine": "Datenbank belegt", "cout.base_pleine_p": "{u} von {max} kostenlos",
  "cout.plafond_libre": "Noch {reste} Familien bis zur Obergrenze. Danach wechseln die Anmeldungen von selbst auf eine Warteliste.",
  "cout.plafond_atteint": "Obergrenze erreicht: die Anmeldungen laufen über eine Warteliste. Warten ist besser als ein Dienst, der nicht mehr mitkommt.",
  "cout.plafond_reglage": "Obergrenze Familien",
  "cout.plafond_aide": "Zwei Grenzen setzen sie: die Support-Zeit (eine Stunde pro Woche) und die 500 MB der kostenlosen Datenbank, also etwa 1 000 Familien.",
  "cap.bascule": "Obergrenze erreicht: die Anmeldungen laufen über eine Warteliste.",
});

/* ---- Dons : transparence (ce qu'ils financent, ce qu'ils ne donnent pas) ---- */
Object.assign(I18N.fr, {
  "don.transparence": "Les dons couvrent uniquement les frais (domaine, e-mails, hébergement) et n'ouvrent aucune fonction : donner ou non ne change rien à l'app.",
  "don.en_savoir": "En savoir plus",
});
Object.assign(I18N.en, {
  "don.transparence": "Donations only cover running costs (domain, emails, hosting) and unlock nothing: giving or not changes nothing in the app.",
  "don.en_savoir": "Learn more",
});
Object.assign(I18N.nl, {
  "don.transparence": "Giften dekken enkel de kosten (domein, e-mails, hosting) en openen geen functies: geven of niet verandert niets aan de app.",
  "don.en_savoir": "Meer weten",
});
Object.assign(I18N.de, {
  "don.transparence": "Spenden decken nur die Kosten (Domain, E-Mails, Hosting) und schalten nichts frei: ob du spendest oder nicht, ändert nichts an der App.",
  "don.en_savoir": "Mehr erfahren",
});

/* ---- Décisions à prendre & mode pause (admin » Croissance) ---- */
Object.assign(I18N.fr, {
  "dec.titre": "🧭 Décisions à prendre",
  "dec.sous": "Elles n'apparaissent que lorsque la situation les appelle. Chaque option est chiffrée, l'une est recommandée : une minute suffit à trancher.",
  "dec.aucune": "Rien à décider pour l'instant. Le projet tourne tout seul.",
  "dec.recommande": "recommandé",
  "dec.confirm": "Retenir cette option : « {choix} » ?",
  "dec.enregistree": "Décision enregistrée.",
  "dec.prises": "Décisions déjà prises ({n})",
  "dec.revenir": "Revenir dessus",
  "dec.revenir_confirm": "Rouvrir cette décision ? Elle réapparaîtra si la situation le justifie encore.",
  "dec.journal": "Ce qui s'est appliqué tout seul",
  "dec.journal_sous": "Chaque changement automatique est consigné ici et signalé par e-mail, une seule fois.",
  "dec.chg_notifie": "signalé par e-mail",
  "dec.chg_non_notifie": "non signalé",
  "pause.titre": "🧘 Pause et avertissements",
  "pause.sous": "Le projet doit survivre à une semaine chargée : pendant une pause, plus rien ne part et rien ne bascule. L'app continue de fonctionner normalement pour les familles.",
  "pause.notifs": "M'avertir par e-mail à chaque changement",
  "pause.notifs_on": "Chaque changement qui s'applique tout seul donne lieu à un e-mail, une seule fois, avec les décisions éventuelles et le lien vers cette page.",
  "pause.notifs_off": "Aucun avertissement. Les changements restent consignés dans le journal ci-dessus.",
  "pause.jusqua": "En pause jusqu'au",
  "pause.active": "Pause active jusqu'au {jour} : aucun e-mail ne part, aucune vague, aucun basculement de plafond.",
  "pause.inactive": "Aucune pause en cours. Laissez la date vide pour reprendre le cours normal.",
});
Object.assign(I18N.en, {
  "dec.titre": "🧭 Decisions to make",
  "dec.sous": "They only appear when the situation calls for them. Every option is spelled out, one is recommended: a minute is enough to decide.",
  "dec.aucune": "Nothing to decide right now. The project is running on its own.",
  "dec.recommande": "recommended",
  "dec.confirm": "Go with this option: “{choix}”?",
  "dec.enregistree": "Decision saved.",
  "dec.prises": "Decisions already made ({n})",
  "dec.revenir": "Reopen",
  "dec.revenir_confirm": "Reopen this decision? It will come back if the situation still warrants it.",
  "dec.journal": "What applied on its own",
  "dec.journal_sous": "Every automatic change is logged here and reported by email, once only.",
  "dec.chg_notifie": "reported by email",
  "dec.chg_non_notifie": "not reported",
  "pause.titre": "🧘 Pause and alerts",
  "pause.sous": "The project must survive a busy week: during a pause nothing goes out and nothing switches. The app keeps working normally for families.",
  "pause.notifs": "Email me on every change",
  "pause.notifs_on": "Every change that applies on its own triggers one email, once, with any decisions and the link to this page.",
  "pause.notifs_off": "No alerts. Changes are still logged above.",
  "pause.jusqua": "Paused until",
  "pause.active": "Pause active until {jour}: no email goes out, no wave, no cap switch.",
  "pause.inactive": "No pause running. Leave the date empty to resume as usual.",
});
Object.assign(I18N.nl, {
  "dec.titre": "🧭 Te nemen beslissingen",
  "dec.sous": "Ze verschijnen alleen wanneer de situatie erom vraagt. Elke optie is uitgewerkt, één is aanbevolen: een minuut volstaat.",
  "dec.aucune": "Voorlopig niets te beslissen. Het project draait vanzelf.",
  "dec.recommande": "aanbevolen",
  "dec.confirm": "Deze optie kiezen: « {choix} »?",
  "dec.enregistree": "Beslissing bewaard.",
  "dec.prises": "Al genomen beslissingen ({n})",
  "dec.revenir": "Heropenen",
  "dec.revenir_confirm": "Deze beslissing heropenen? Ze komt terug als de situatie het nog rechtvaardigt.",
  "dec.journal": "Wat vanzelf is toegepast",
  "dec.journal_sous": "Elke automatische wijziging staat hier en wordt één keer per e-mail gemeld.",
  "dec.chg_notifie": "gemeld per e-mail",
  "dec.chg_non_notifie": "niet gemeld",
  "pause.titre": "🧘 Pauze en meldingen",
  "pause.sous": "Het project moet een drukke week overleven: tijdens een pauze vertrekt er niets en schakelt er niets om. De app blijft normaal werken voor de gezinnen.",
  "pause.notifs": "Mail mij bij elke wijziging",
  "pause.notifs_on": "Elke wijziging die vanzelf gebeurt geeft één e-mail, met de eventuele beslissingen en de link naar deze pagina.",
  "pause.notifs_off": "Geen meldingen. Wijzigingen blijven hierboven geregistreerd.",
  "pause.jusqua": "In pauze tot",
  "pause.active": "Pauze actief tot {jour}: geen e-mail, geen golf, geen plafondomschakeling.",
  "pause.inactive": "Geen pauze bezig. Laat de datum leeg om normaal verder te gaan.",
});
Object.assign(I18N.de, {
  "dec.titre": "🧭 Zu treffende Entscheidungen",
  "dec.sous": "Sie erscheinen nur, wenn die Lage es verlangt. Jede Option ist beziffert, eine ist empfohlen: eine Minute genügt.",
  "dec.aucune": "Derzeit nichts zu entscheiden. Das Projekt läuft von allein.",
  "dec.recommande": "empfohlen",
  "dec.confirm": "Diese Option wählen: „{choix}“?",
  "dec.enregistree": "Entscheidung gespeichert.",
  "dec.prises": "Bereits getroffene Entscheidungen ({n})",
  "dec.revenir": "Erneut öffnen",
  "dec.revenir_confirm": "Diese Entscheidung erneut öffnen? Sie kommt zurück, wenn die Lage es weiter rechtfertigt.",
  "dec.journal": "Was von allein wirksam wurde",
  "dec.journal_sous": "Jede automatische Änderung wird hier festgehalten und einmalig per E-Mail gemeldet.",
  "dec.chg_notifie": "per E-Mail gemeldet",
  "dec.chg_non_notifie": "nicht gemeldet",
  "pause.titre": "🧘 Pause und Hinweise",
  "pause.sous": "Das Projekt muss eine volle Woche überstehen: während einer Pause geht nichts raus und nichts schaltet um. Die App läuft für die Familien normal weiter.",
  "pause.notifs": "Mich bei jeder Änderung per E-Mail benachrichtigen",
  "pause.notifs_on": "Jede Änderung, die von allein wirksam wird, löst eine einzige E-Mail aus — mit den etwaigen Entscheidungen und dem Link zu dieser Seite.",
  "pause.notifs_off": "Keine Hinweise. Änderungen bleiben oben festgehalten.",
  "pause.jusqua": "Pause bis",
  "pause.active": "Pause aktiv bis {jour}: keine E-Mail, keine Welle, keine Umschaltung der Obergrenze.",
  "pause.inactive": "Keine Pause aktiv. Datum leer lassen, um normal fortzufahren.",
});

/* ---- Aperçu (dev, déploiement de test) : aucun envoi ---- */
Object.assign(I18N.fr, {
  "apercu.titre": "🧪 Aperçu — aucun e-mail ne partira",
  "apercu.detail": "Vous êtes sur {hote}, pas sur la production. Les e-mails aux familles, les vagues d'invitation et le basculement automatique du plafond sont suspendus, alors que la base est bien celle de production. Le test d'envoi et le code PIN restent actifs.",
});
Object.assign(I18N.en, {
  "apercu.titre": "🧪 Preview — no email will be sent",
  "apercu.detail": "You are on {hote}, not on production. Emails to families, invitation waves and the automatic cap switch are suspended, even though the database is the production one. The send test and the PIN code still work.",
});
Object.assign(I18N.nl, {
  "apercu.titre": "🧪 Voorbeeld — er vertrekt geen e-mail",
  "apercu.detail": "Je zit op {hote}, niet op productie. E-mails naar gezinnen, uitnodigingsgolven en de automatische plafondomschakeling zijn opgeschort, ook al is de databank die van productie. De verzendtest en de pincode blijven werken.",
});
Object.assign(I18N.de, {
  "apercu.titre": "🧪 Vorschau — es geht keine E-Mail raus",
  "apercu.detail": "Du bist auf {hote}, nicht auf der Produktion. E-Mails an Familien, Einladungswellen und die automatische Umschaltung der Obergrenze sind ausgesetzt, obwohl die Datenbank die der Produktion ist. Sendetest und PIN-Code funktionieren weiter.",
});

/* Arbre des familles : ce que c'est, en une phrase. Et le partage de la
   carte de l'enfant, quand l'impression n'est pas le bon geste. */
Object.assign(I18N.fr, {
  "arbre.explication": "Chaque famille à qui vous faites découvrir {app} devient une feuille de votre arbre. Il n'y a rien à gagner et personne à dépasser : l'arbre montre seulement ce que votre famille a semé autour d'elle.",
  "cami.partager": 'Partager',
  "cami.partage_titre": 'Une invitation de {prenom}',
  "cami.partage_texte": '{prenom} vous invite à essayer {app} en famille. Ouvrez ce lien pour créer la vôtre :'
});
Object.assign(I18N.en, {
  "arbre.explication": 'Every family you introduce to {app} becomes a leaf on your tree. There is nothing to win and no one to overtake: the tree simply shows what your family has sown around it.',
  "cami.partager": 'Share',
  "cami.partage_titre": 'An invitation from {prenom}',
  "cami.partage_texte": '{prenom} invites you to try {app} as a family. Open this link to create your own:'
});
Object.assign(I18N.nl, {
  "arbre.explication": 'Elk gezin dat je {app} laat ontdekken wordt een blad aan je boom. Er valt niets te winnen en niemand voorbij te steken: de boom toont enkel wat jouw gezin rondom zich heeft gezaaid.',
  "cami.partager": 'Delen',
  "cami.partage_titre": 'Een uitnodiging van {prenom}',
  "cami.partage_texte": '{prenom} nodigt je uit om {app} met je gezin te proberen. Open deze link om je eigen gezin aan te maken:'
});
Object.assign(I18N.de, {
  "arbre.explication": 'Jede Familie, der ihr {app} zeigt, wird zu einem Blatt an eurem Baum. Es gibt nichts zu gewinnen und niemanden zu überholen: Der Baum zeigt nur, was eure Familie um sich herum gesät hat.',
  "cami.partager": 'Teilen',
  "cami.partage_titre": 'Eine Einladung von {prenom}',
  "cami.partage_texte": '{prenom} lädt dich ein, {app} mit deiner Familie auszuprobieren. Öffne diesen Link, um eure eigene zu erstellen:'
});

/* Rendez-vous d'une carte surprise gagnee : date, agenda, decompte. */
Object.assign(I18N.fr, {
  "cs.rdv_titre": "📅 Quand fait-on cette activité ?",
  "cs.rdv_note": "La date apparaît chez les enfants sous forme de décompte. L'agenda reçoit un événement de 2 h, ou la journée entière si vous ne mettez pas d'heure.",
  "cs.rdv_agenda": "Ajouter à mon agenda",
  "cs.rdv_dans": "Dans {n} dodos !",
  "cs.rdv_demain": "C'est demain !",
  "cs.rdv_aujourdhui": "C'est aujourd'hui ! 🎉",
  "cs.rdv_passe": "C'était prévu — à marquer comme fait",
  "cs.rdv_sans_date": "Choisis d'abord une date.",
  "cs.rdv_echec": "Impossible de créer le fichier d'agenda."
});
Object.assign(I18N.en, {
  "cs.rdv_titre": "📅 When are we doing this?",
  "cs.rdv_note": "Children see the date as a countdown. Your calendar gets a 2-hour event, or a whole day if you leave the time empty.",
  "cs.rdv_agenda": "Add to my calendar",
  "cs.rdv_dans": "In {n} sleeps!",
  "cs.rdv_demain": "It's tomorrow!",
  "cs.rdv_aujourdhui": "It's today! 🎉",
  "cs.rdv_passe": "It was planned — mark it as done",
  "cs.rdv_sans_date": "Pick a date first.",
  "cs.rdv_echec": "Could not create the calendar file."
});
Object.assign(I18N.nl, {
  "cs.rdv_titre": "📅 Wanneer doen we dit?",
  "cs.rdv_note": "Kinderen zien de datum als een aftelling. Je agenda krijgt een gebeurtenis van 2 uur, of een hele dag als je geen uur invult.",
  "cs.rdv_agenda": "Aan mijn agenda toevoegen",
  "cs.rdv_dans": "Over {n} nachtjes!",
  "cs.rdv_demain": "Het is morgen!",
  "cs.rdv_aujourdhui": "Het is vandaag! 🎉",
  "cs.rdv_passe": "Het stond gepland — vink het af",
  "cs.rdv_sans_date": "Kies eerst een datum.",
  "cs.rdv_echec": "Kon het agendabestand niet maken."
});
Object.assign(I18N.de, {
  "cs.rdv_titre": "📅 Wann machen wir das?",
  "cs.rdv_note": "Kinder sehen das Datum als Countdown. Dein Kalender bekommt einen 2-Stunden-Termin, oder einen ganzen Tag, wenn du keine Uhrzeit angibst.",
  "cs.rdv_agenda": "Zu meinem Kalender hinzufügen",
  "cs.rdv_dans": "In {n} Mal schlafen!",
  "cs.rdv_demain": "Morgen ist es so weit!",
  "cs.rdv_aujourdhui": "Heute ist es so weit! 🎉",
  "cs.rdv_passe": "War geplant — als erledigt markieren",
  "cs.rdv_sans_date": "Wähle zuerst ein Datum.",
  "cs.rdv_echec": "Kalenderdatei konnte nicht erstellt werden."
});

/* Partage de la carte d'ami sur ordinateur : image + lien. */
Object.assign(I18N.fr, {
  "cami.partage_ordi": "🖼️ Image enregistrée et lien copié !"
});
Object.assign(I18N.en, {
  "cami.partage_ordi": "🖼️ Image saved and link copied!"
});
Object.assign(I18N.nl, {
  "cami.partage_ordi": "🖼️ Afbeelding opgeslagen en link gekopieerd!"
});
Object.assign(I18N.de, {
  "cami.partage_ordi": "🖼️ Bild gespeichert und Link kopiert!"
});

/* Arbre des familles expliqué aux enfants, et repli si le QR manque. */
Object.assign(I18N.fr, {
  "arbre.enfant_expli": "Quand tu montres {app} à un copain et que sa famille l'essaie, une nouvelle feuille pousse sur ton arbre. 🌱",
  "cami.sans_qr": "Le code se recopie à la main — le carré à scanner n'a pas pu être créé."
});
Object.assign(I18N.en, {
  "arbre.enfant_expli": "When you show {app} to a friend and their family tries it, a new leaf grows on your tree. 🌱",
  "cami.sans_qr": "Type the code by hand — the square to scan could not be created."
});
Object.assign(I18N.nl, {
  "arbre.enfant_expli": "Als je {app} aan een vriendje laat zien en hun gezin probeert het, groeit er een nieuw blad aan je boom. 🌱",
  "cami.sans_qr": "Typ de code met de hand — het vierkantje om te scannen kon niet worden gemaakt."
});
Object.assign(I18N.de, {
  "arbre.enfant_expli": "Wenn du {app} einem Freund zeigst und seine Familie es ausprobiert, wächst ein neues Blatt an deinem Baum. 🌱",
  "cami.sans_qr": "Den Code von Hand abtippen — das Quadrat zum Scannen konnte nicht erstellt werden."
});

/* Planifier une carte gagnee depuis la vue famille, sous code PIN. */
Object.assign(I18N.fr, {
  "cs.rdv_planifier": "Choisir la date",
  "cs.rdv_modifier": "Changer la date",
  "cs.rdv_pin": "🔒 Code parent pour fixer la date"
});
Object.assign(I18N.en, {
  "cs.rdv_planifier": "Pick the date",
  "cs.rdv_modifier": "Change the date",
  "cs.rdv_pin": "🔒 Parent code to set the date"
});
Object.assign(I18N.nl, {
  "cs.rdv_planifier": "Datum kiezen",
  "cs.rdv_modifier": "Datum wijzigen",
  "cs.rdv_pin": "🔒 Oudercode om de datum te kiezen"
});
Object.assign(I18N.de, {
  "cs.rdv_planifier": "Datum wählen",
  "cs.rdv_modifier": "Datum ändern",
  "cs.rdv_pin": "🔒 Elterncode, um das Datum zu setzen"
});

/* Le tiroir des activites deja faites. */
Object.assign(I18N.fr, { "cs.faites_titre": "✅ Déjà faites · {n}" });
Object.assign(I18N.en, { "cs.faites_titre": "✅ Already done · {n}" });
Object.assign(I18N.nl, { "cs.faites_titre": "✅ Al gedaan · {n}" });
Object.assign(I18N.de, { "cs.faites_titre": "✅ Schon gemacht · {n}" });

/* Pastille d'acces direct aux gestes de reparation. */
Object.assign(I18N.fr, { "rep.pastille": "Oups, ça arrive… — réparer", "rep.pin_titre": "🔒 Code parent pour créditer une réparation" });
Object.assign(I18N.en, { "rep.pastille": "Oops, it happens… — make it right", "rep.pin_titre": "🔒 Parent code to credit a repair" });
Object.assign(I18N.nl, { "rep.pastille": "Oeps, dat gebeurt… — goedmaken", "rep.pin_titre": "🔒 Oudercode om een herstel toe te kennen" });
Object.assign(I18N.de, { "rep.pastille": "Ups, das passiert… — wiedergutmachen", "rep.pin_titre": "🔒 Elterncode, um eine Reparatur anzurechnen" });

/* Tutoriel : la pastille de reparation, parti pris central de l'app. */
Object.assign(I18N.fr, {
  "tuto.rep_t": "Oups, ça arrive… 🌈",
  "tuto.rep_d": "Cette pastille ouvre les <strong>gestes de réparation</strong>. Quand quelque chose se passe mal — un objet cassé, un mot qui blesse — l'enfant choisit comment réparer, et c'est ce geste-là qui rapporte des cœurs. <strong>Aucun point n'est jamais retiré.</strong>"
});
Object.assign(I18N.en, {
  "tuto.rep_t": "Oops, it happens… 🌈",
  "tuto.rep_d": "This button opens the <strong>repair gestures</strong>. When something goes wrong — something broken, a hurtful word — the child picks how to make it right, and that gesture is what earns hearts. <strong>No point is ever taken away.</strong>"
});
Object.assign(I18N.nl, {
  "tuto.rep_t": "Oeps, dat gebeurt… 🌈",
  "tuto.rep_d": "Deze knop opent de <strong>herstelgebaren</strong>. Als er iets misgaat — iets gebroken, een kwetsend woord — kiest het kind hoe het dat goedmaakt, en dát gebaar levert hartjes op. <strong>Er wordt nooit een punt afgenomen.</strong>"
});
Object.assign(I18N.de, {
  "tuto.rep_t": "Ups, das passiert… 🌈",
  "tuto.rep_d": "Diese Taste öffnet die <strong>Wiedergutmachungen</strong>. Wenn etwas schiefgeht — etwas zerbrochen, ein verletzendes Wort — wählt das Kind, wie es das wieder gut macht, und genau diese Tat bringt Herzen. <strong>Es wird nie ein Punkt abgezogen.</strong>"
});

/* Tutoriel : les cartes FamiTeam, seul objectif collectif de l'app. */
Object.assign(I18N.fr, {
  "tuto.cartes_t": "Les cartes FamiTeam 🎁",
  "tuto.cartes_d": "Ici, les enfants mettent leurs <strong>cœurs en commun</strong> pour débloquer une vraie activité en famille : cinéma maison, pique-nique, grande sortie. C'est le seul objectif qu'aucun d'eux n'atteint seul. Les parents décident des activités et fixent la date une fois la carte gagnée. <strong>Vous choisissez si l'activité reste une surprise ou non.</strong>"
});
Object.assign(I18N.en, {
  "tuto.cartes_t": "FamiTeam cards 🎁",
  "tuto.cartes_d": "Here the children <strong>pool their hearts</strong> to unlock a real family activity: movie night, picnic, a big outing. It's the one goal none of them reaches alone. Parents choose the activities and set the date once a card is earned. <strong>You decide whether the activity stays a surprise or not.</strong>"
});
Object.assign(I18N.nl, {
  "tuto.cartes_t": "FamiTeam-kaarten 🎁",
  "tuto.cartes_d": "Hier leggen de kinderen hun <strong>hartjes samen</strong> om een echte gezinsactiviteit vrij te spelen: filmavond, picknick, een grote uitstap. Het is het enige doel dat niemand alleen haalt. Ouders kiezen de activiteiten en bepalen de datum zodra een kaart verdiend is. <strong>Jij beslist of de activiteit een verrassing blijft of niet.</strong>"
});
Object.assign(I18N.de, {
  "tuto.cartes_t": "FamiTeam-Karten 🎁",
  "tuto.cartes_d": "Hier legen die Kinder ihre <strong>Herzen zusammen</strong>, um eine echte Familienaktivität freizuschalten: Kinoabend, Picknick, ein großer Ausflug. Es ist das einzige Ziel, das keines allein erreicht. Eltern wählen die Aktivitäten und legen das Datum fest, sobald eine Karte verdient ist. <strong>Du entscheidest, ob die Aktivität eine Überraschung bleibt oder nicht.</strong>"
});

/* ---- Le rendez-vous du soir : rappel délégué à l'agenda du parent ----
 * On n'écrit nulle part « notification » comme une promesse : le texte dit
 * l'inverse, et c'est le seul argument qui rassure un parent méfiant. */
Object.assign(I18N.fr, {
  "rituel.titre": "⏰ Le rendez-vous du soir",
  "rituel.intro": "FamiTeam ne vous enverra jamais de notification. Déposez plutôt un rendez-vous de cinq minutes dans <strong>votre</strong> agenda : c'est lui qui vous préviendra.",
  "rituel.rythme": "À quel rythme ?",
  "rituel.r_quotidien": "Chaque jour",
  "rituel.r_deux_jours": "Tous les deux jours",
  "rituel.r_trois_jours": "Tous les trois jours",
  "rituel.r_hebdo": "Une fois par semaine (feuille papier)",
  "rituel.heure": "À quelle heure ?",
  "rituel.conseil": "Conseillé : {h}",
  "rituel.ajouter": "📅 Déposer dans mon agenda",
  "rituel.ok": "Rendez-vous déposé. Ouvrez le fichier pour l'ajouter à votre agenda 📅",
  "rituel.echec": "Votre navigateur a refusé le téléchargement.",
  "rituel.resume": "Rappel réglé : {r}, à {h}",
  "rituel.jamais": "Aucun rappel réglé",
  "rituel.note": "Le fichier va dans votre agenda, pas chez nous. Pour arrêter, supprimez l'événement.",
  "rituel.sujet": "🌟 FamiTeam — le petit moment",
  "rituel.corps": "Deux minutes avec les enfants : cocher les missions du jour.\nfami.team"
});
Object.assign(I18N.en, {
  "rituel.titre": "⏰ The evening appointment",
  "rituel.intro": "FamiTeam will never send you a notification. Drop a five-minute appointment into <strong>your own</strong> calendar instead: your calendar reminds you.",
  "rituel.rythme": "How often?",
  "rituel.r_quotidien": "Every day",
  "rituel.r_deux_jours": "Every two days",
  "rituel.r_trois_jours": "Every three days",
  "rituel.r_hebdo": "Once a week (paper sheet)",
  "rituel.heure": "At what time?",
  "rituel.conseil": "Suggested: {h}",
  "rituel.ajouter": "📅 Add to my calendar",
  "rituel.ok": "Appointment ready. Open the file to add it to your calendar 📅",
  "rituel.echec": "Your browser refused the download.",
  "rituel.resume": "Reminder set: {r}, at {h}",
  "rituel.jamais": "No reminder set",
  "rituel.note": "The file goes into your calendar, not to us. To stop, delete the event.",
  "rituel.sujet": "🌟 FamiTeam — the little moment",
  "rituel.corps": "Two minutes with the children: tick off today's missions.\nfami.team"
});
Object.assign(I18N.nl, {
  "rituel.titre": "⏰ De afspraak van de avond",
  "rituel.intro": "FamiTeam stuurt u nooit een melding. Zet liever een afspraak van vijf minuten in <strong>uw eigen</strong> agenda: die verwittigt u.",
  "rituel.rythme": "Hoe vaak?",
  "rituel.r_quotidien": "Elke dag",
  "rituel.r_deux_jours": "Om de twee dagen",
  "rituel.r_trois_jours": "Om de drie dagen",
  "rituel.r_hebdo": "Eén keer per week (papieren blad)",
  "rituel.heure": "Op welk uur?",
  "rituel.conseil": "Aangeraden: {h}",
  "rituel.ajouter": "📅 In mijn agenda zetten",
  "rituel.ok": "Afspraak klaar. Open het bestand om het aan uw agenda toe te voegen 📅",
  "rituel.echec": "Uw browser weigerde de download.",
  "rituel.resume": "Herinnering ingesteld: {r}, om {h}",
  "rituel.jamais": "Geen herinnering ingesteld",
  "rituel.note": "Het bestand gaat naar uw agenda, niet naar ons. Om te stoppen verwijdert u het item.",
  "rituel.sujet": "🌟 FamiTeam — het kleine moment",
  "rituel.corps": "Twee minuten met de kinderen: de missies van vandaag aanvinken.\nfami.team"
});
Object.assign(I18N.de, {
  "rituel.titre": "⏰ Der Abendtermin",
  "rituel.intro": "FamiTeam schickt Ihnen niemals eine Benachrichtigung. Legen Sie stattdessen einen Fünf-Minuten-Termin in <strong>Ihren eigenen</strong> Kalender: dieser erinnert Sie.",
  "rituel.rythme": "Wie oft?",
  "rituel.r_quotidien": "Jeden Tag",
  "rituel.r_deux_jours": "Alle zwei Tage",
  "rituel.r_trois_jours": "Alle drei Tage",
  "rituel.r_hebdo": "Einmal pro Woche (Papierblatt)",
  "rituel.heure": "Um welche Uhrzeit?",
  "rituel.conseil": "Empfohlen: {h}",
  "rituel.ajouter": "📅 In meinen Kalender legen",
  "rituel.ok": "Termin bereit. Öffnen Sie die Datei, um sie Ihrem Kalender hinzuzufügen 📅",
  "rituel.echec": "Ihr Browser hat den Download abgelehnt.",
  "rituel.resume": "Erinnerung eingestellt: {r}, um {h}",
  "rituel.jamais": "Keine Erinnerung eingestellt",
  "rituel.note": "Die Datei geht in Ihren Kalender, nicht zu uns. Zum Beenden löschen Sie den Termin.",
  "rituel.sujet": "🌟 FamiTeam — der kleine Moment",
  "rituel.corps": "Zwei Minuten mit den Kindern: die Missionen von heute abhaken.\nfami.team"
});

/* ---- Accueil public : barre de langues et liens de bas de carte ---- */
Object.assign(I18N.fr, {
  "auth.langues": "Choix de la langue",
  "auth.lien_faq": "Questions fréquentes",
  "auth.lien_legal": "Mentions légales",
  "auth.lien_confid": "Confidentialité",
});
Object.assign(I18N.en, {
  "auth.langues": "Language",
  "auth.lien_faq": "FAQ",
  "auth.lien_legal": "Legal notice",
  "auth.lien_confid": "Privacy",
});
Object.assign(I18N.nl, {
  "auth.langues": "Taalkeuze",
  "auth.lien_faq": "Veelgestelde vragen",
  "auth.lien_legal": "Juridische info",
  "auth.lien_confid": "Privacy",
});
Object.assign(I18N.de, {
  "auth.langues": "Sprachauswahl",
  "auth.lien_faq": "Häufige Fragen",
  "auth.lien_legal": "Impressum",
  "auth.lien_confid": "Datenschutz",
});
