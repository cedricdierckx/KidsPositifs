/* =====================================================================
 * FamiTeam — Internationalisation (i18n)
 * ---------------------------------------------------------------------
 * Langues : français, anglais, néerlandais, allemand.
 * Utilisation : t("cle", { var: valeur }).  Repli automatique sur le
 * français puis sur la clé elle-même si une traduction manque.
 * ===================================================================== */

const LANGUES = { fr: "Français", en: "English", nl: "Nederlands", de: "Deutsch" };
let langue = "fr";

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
    "auth.parrain_nomme": "🎁 {nom} t'invite à découvrir {app} ! Crée ton compte pour lancer ta propre famille.",
    "auth.msg_entre_email": "Entre ton adresse e-mail.",
    "auth.msg_email_envoye": "📧 E-mail envoyé ! Clique sur le lien reçu pour te connecter.",
    "auth.msg_compte_cree": "Compte créé. Vérifie ta boîte mail si une confirmation est demandée.",
    "auth.msg_invitation_only": "Inscription sur invitation uniquement. Rejoins la liste d'attente ci-dessous.",
    "auth.msg_attente_email": "Entre ton e-mail pour rejoindre la liste d'attente.",
    "auth.msg_attente_ok": "🎉 Merci ! Tu es sur la liste d'attente. On te préviendra dès qu'une place se libère.",
    "auth.erreur": "Erreur : {msg}"
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
    "auth.msg_compte_cree": "Account created. Check your inbox if a confirmation is required.",
    "auth.msg_invitation_only": "Sign-up is invitation-only. Join the waiting list below.",
    "auth.msg_attente_email": "Enter your e-mail to join the waiting list.",
    "auth.msg_attente_ok": "🎉 Thanks! You're on the waiting list. We'll let you know as soon as a spot opens up.",
    "auth.erreur": "Error: {msg}"
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
    "auth.msg_compte_cree": "Account aangemaakt. Controleer je mailbox als een bevestiging nodig is.",
    "auth.msg_invitation_only": "Registreren kan alleen op uitnodiging. Meld je hieronder aan voor de wachtlijst.",
    "auth.msg_attente_email": "Vul je e-mail in om je aan te melden voor de wachtlijst.",
    "auth.msg_attente_ok": "🎉 Bedankt! Je staat op de wachtlijst. We verwittigen je zodra er plaats vrijkomt.",
    "auth.erreur": "Fout: {msg}"
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
    "auth.msg_compte_cree": "Konto erstellt. Prüfe dein Postfach, falls eine Bestätigung nötig ist.",
    "auth.msg_invitation_only": "Registrierung nur auf Einladung. Trage dich unten in die Warteliste ein.",
    "auth.msg_attente_email": "Gib deine E-Mail ein, um dich in die Warteliste einzutragen.",
    "auth.msg_attente_ok": "🎉 Danke! Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.",
    "auth.erreur": "Fehler: {msg}"
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
  "cat.planete.desc": "Gouttes de vie gagnées en protégeant la nature. Elles font pousser ta graine en tout un écosystème !",
  "money.coeurs": "Cœurs", "money.gouttes": "Gouttes",
  "rep.titre": "🌈 Oups, ça arrive…",
  "rep.texte": "Pas de point en moins ! Quand quelque chose ne va pas, on <strong>répare</strong> et on gagne même un petit bonus.",
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
  "cat.planete.desc": "Drops of life earned by protecting nature. They grow your seed into a whole ecosystem!",
  "money.coeurs": "Hearts", "money.gouttes": "Drops",
  "rep.titre": "🌈 Oops, it happens…",
  "rep.texte": "No points taken away! When something goes wrong, we <strong>fix it</strong> and even earn a little bonus.",
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
  "cat.planete.desc": "Druppels leven verdiend door de natuur te beschermen. Ze laten je zaadje uitgroeien tot een heel ecosysteem!",
  "money.coeurs": "Hartjes", "money.gouttes": "Druppels",
  "rep.titre": "🌈 Oeps, dat gebeurt…",
  "rep.texte": "Geen punten eraf! Als er iets misgaat, <strong>maken we het goed</strong> en verdien je zelfs een kleine bonus.",
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
  "cat.planete.desc": "Tropfen Leben, die du durch den Schutz der Natur verdienst. Sie lassen dein Samenkorn zu einem ganzen Ökosystem wachsen!",
  "money.coeurs": "Herzen", "money.gouttes": "Tropfen",
  "rep.titre": "🌈 Hoppla, das passiert…",
  "rep.texte": "Keine Punkte weg! Wenn etwas schiefgeht, <strong>machen wir es wieder gut</strong> und verdienen sogar einen kleinen Bonus.",
  "eco.titre": "🌱 Mein lebendiges Ökosystem",
  "eco.intro": "Jedes Lebewesen ist eine <strong>Karte</strong> 🃏 mit seinen Bedürfnissen. Erschaffe zuerst 🌱 Pflanzen, dann 🐰 Pflanzenfresser, die sie fressen, dann 🦊 Fleischfresser. Ein 🐒 Affe braucht 10 Bäume und 1 Bananenbaum!",
  "eco.vide_court": "Erschaffe deine erste Pflanze 🌱",
  "eco.aucun_prereq": "Keine Voraussetzungen ☀️", "eco.creer": "➕ Erschaffen",
  "eco.plus_gouttes": "💧 Zu wenig Tropfen", "eco.verrouille": "🔒 Gesperrt"
});

langue = detecterLangue();
