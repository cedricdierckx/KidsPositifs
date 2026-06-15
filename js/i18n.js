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

langue = detecterLangue();
