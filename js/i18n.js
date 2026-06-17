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

/* ---- Phase E3 : espace parents ---- */
Object.assign(I18N.fr, {
  "par.verrou.titre": "⚙️ Espace parents",
  "par.verrou.desc": "Réservé aux parents : valider les actions, corriger les données, régler le programme.",
  "par.verrou.attente": "⏳ <strong>{n}</strong> action(s) en attente de validation.",
  "par.verrou.esprit": "💡 <strong>Esprit bienveillant</strong> : on valorise l'effort, jamais la performance. Les corrections servent à ajuster avec justesse, pas à punir.",
  "par.verrou.activer": "🔓 Activer le mode parents",
  "par.actif.titre": "⚙️ Mode parents", "par.actif.badge": "activé",
  "par.actif.quitter": "🔒 Quitter le mode parents",
  "par.attente.titre": "⏳ Actions à valider ({n})",
  "par.prog.titre": "🛠️ Réglages du programme",
  "par.prog.validation": "Validation parentale requise (les actions des enfants attendent votre confirmation)",
  "par.prog.changer_pin": "🔑 Changer le code PIN parent",
  "par.prog.definir_pin": "🔑 Définir un code PIN parent",
  "par.prog.astuce_pin": "💡 Astuce : définissez un code PIN pour protéger l'accès au mode parents.",
  "mdj.titre": "🗓️ Missions proposées — {enf}",
  "mdj.note": "Coche les missions à proposer. Ton choix s'applique à partir de cette date et <strong>pour tous les jours suivants</strong> (jusqu'à une prochaine modification).",
  "mdj.a_partir": "À partir du",
  "mdj.defaut": "↩️ Proposer la sélection par défaut (selon l'âge)",
  "mdj.ajouter_perso": "➕ Ajouter une mission personnalisée",
  "mdj.nom_ph": "Nom (ex. Ranger son vélo)", "mdj.emoji_ph": "Emoji",
  "mdj.ajouter": "Ajouter ✨", "mdj.suppr_perso": "Supprimer cette mission personnalisée",
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
  "fam.creer_invitation": "🔗 Créer un lien d'invitation", "fam.changer": "🔁 Changer / créer une famille",
  "parr.titre": "🎁 Parrainer une famille amie",
  "parr.note": "Offre {app} à des amis : avec ton lien de parrainage, ils créeront <strong>leur propre famille</strong>. Tu peux parrainer <strong>3 familles par semaine</strong>. Plus on est nombreux, plus on répand les ondes positives ! 🤝",
  "parr.quota_check": "Vérification de ton quota…", "parr.creer": "🎁 Créer un lien de parrainage",
  "parr.illimite": "👑 Compte administrateur : parrainages <strong>illimités</strong>.",
  "parr.restant": "Il te reste <strong>{n}</strong> parrainage(s) cette semaine.",
  "parr.partage": "Partage ce lien : ton ami créera sa propre famille. 💛",
  "parr.sujet": "Je t'offre {app} 🌟",
  "parr.corps": "Coucou !\n\nJe te parraine sur {app}, une appli bienveillante qui aide toute la famille à instaurer une ambiance positive et à s'aligner sur les tâches de la maison et la protection de la planète.\n\nOuvre ce lien pour créer ta propre famille :\n{lien}\n\nÀ très vite ! 🤝",
  "abo.titre": "⭐ Abonnement", "abo.offre": "Offre actuelle : <strong>{plan}</strong>",
  "abo.note": "Les paiements arriveront bientôt. Pour l'instant, tout est gratuit. 💛",
  "abo.gerer": "Gérer l'abonnement (bientôt)",
  "compte.titre": "👤 Compte", "compte.connecte": "Connecté en tant que <strong>{email}</strong>",
  "compte.deconnexion": "🚪 Se déconnecter",
  "donnees.titre": "Données (cette famille)", "donnees.exporter": "💾 Exporter la sauvegarde",
  "donnees.reset": "🗑️ Tout réinitialiser",
  "donnees.confirm_reset": "Tout effacer et recommencer à zéro ? (Cœurs, gouttes, avatars, écosystèmes)",
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
  "admin.charger": "📋 Charger toutes les familles", "admin.recharger": "🔄 Recharger les familles",
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
  "par.actif.quitter": "🔒 Exit parents mode",
  "par.attente.titre": "⏳ Actions to approve ({n})",
  "par.prog.titre": "🛠️ Program settings",
  "par.prog.validation": "Parental approval required (children's actions wait for your confirmation)",
  "par.prog.changer_pin": "🔑 Change parent PIN code",
  "par.prog.definir_pin": "🔑 Set a parent PIN code",
  "par.prog.astuce_pin": "💡 Tip: set a PIN code to protect access to parents mode.",
  "mdj.titre": "🗓️ Suggested missions — {enf}",
  "mdj.note": "Tick the missions to suggest. Your choice applies from this date and <strong>for all following days</strong> (until your next change).",
  "mdj.a_partir": "Starting from",
  "mdj.defaut": "↩️ Suggest the default selection (by age)",
  "mdj.ajouter_perso": "➕ Add a custom mission",
  "mdj.nom_ph": "Name (e.g. Tidy up the bike)", "mdj.emoji_ph": "Emoji",
  "mdj.ajouter": "Add ✨", "mdj.suppr_perso": "Delete this custom mission",
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
  "fam.creer_invitation": "🔗 Create an invite link", "fam.changer": "🔁 Switch / create a family",
  "parr.titre": "🎁 Refer a friend family",
  "parr.note": "Give {app} to friends: with your referral link, they'll create <strong>their own family</strong>. You can refer <strong>3 families per week</strong>. The more of us, the more positive vibes we spread! 🤝",
  "parr.quota_check": "Checking your quota…", "parr.creer": "🎁 Create a referral link",
  "parr.illimite": "👑 Admin account: <strong>unlimited</strong> referrals.",
  "parr.restant": "You have <strong>{n}</strong> referral(s) left this week.",
  "parr.partage": "Share this link: your friend will create their own family. 💛",
  "parr.sujet": "I'm giving you {app} 🌟",
  "parr.corps": "Hi there!\n\nI'm referring you to {app}, a kind app that helps the whole family build a positive vibe and align on chores and protecting the planet.\n\nOpen this link to create your own family:\n{lien}\n\nSee you soon! 🤝",
  "abo.titre": "⭐ Subscription", "abo.offre": "Current plan: <strong>{plan}</strong>",
  "abo.note": "Payments are coming soon. For now, everything is free. 💛",
  "abo.gerer": "Manage subscription (coming soon)",
  "compte.titre": "👤 Account", "compte.connecte": "Signed in as <strong>{email}</strong>",
  "compte.deconnexion": "🚪 Sign out",
  "donnees.titre": "Data (this family)", "donnees.exporter": "💾 Export backup",
  "donnees.reset": "🗑️ Reset everything",
  "donnees.confirm_reset": "Erase everything and start over? (Hearts, drops, avatars, ecosystems)",
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
  "admin.charger": "📋 Load all families", "admin.recharger": "🔄 Reload families",
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
  "par.actif.quitter": "🔒 Oudermodus verlaten",
  "par.attente.titre": "⏳ Goed te keuren acties ({n})",
  "par.prog.titre": "🛠️ Programma-instellingen",
  "par.prog.validation": "Goedkeuring door ouders vereist (acties van kinderen wachten op jouw bevestiging)",
  "par.prog.changer_pin": "🔑 Ouder-pincode wijzigen",
  "par.prog.definir_pin": "🔑 Ouder-pincode instellen",
  "par.prog.astuce_pin": "💡 Tip: stel een pincode in om de toegang tot de oudermodus te beveiligen.",
  "mdj.titre": "🗓️ Voorgestelde missies — {enf}",
  "mdj.note": "Vink de voor te stellen missies aan. Je keuze geldt vanaf deze datum en <strong>voor alle volgende dagen</strong> (tot je volgende wijziging).",
  "mdj.a_partir": "Vanaf",
  "mdj.defaut": "↩️ Standaardselectie voorstellen (op leeftijd)",
  "mdj.ajouter_perso": "➕ Eigen missie toevoegen",
  "mdj.nom_ph": "Naam (bv. Fiets opruimen)", "mdj.emoji_ph": "Emoji",
  "mdj.ajouter": "Toevoegen ✨", "mdj.suppr_perso": "Deze eigen missie verwijderen",
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
  "fam.creer_invitation": "🔗 Uitnodigingslink maken", "fam.changer": "🔁 Familie wisselen / aanmaken",
  "parr.titre": "🎁 Een vriendenfamilie aanbrengen",
  "parr.note": "Geef {app} cadeau aan vrienden: met jouw verwijzingslink maken ze <strong>hun eigen familie</strong> aan. Je kan <strong>3 families per week</strong> aanbrengen. Hoe meer we zijn, hoe meer positieve energie we verspreiden! 🤝",
  "parr.quota_check": "Je quotum wordt gecontroleerd…", "parr.creer": "🎁 Verwijzingslink maken",
  "parr.illimite": "👑 Beheerdersaccount: <strong>onbeperkt</strong> verwijzingen.",
  "parr.restant": "Je hebt nog <strong>{n}</strong> verwijzing(en) deze week.",
  "parr.partage": "Deel deze link: je vriend maakt zijn eigen familie aan. 💛",
  "parr.sujet": "Ik geef je {app} cadeau 🌟",
  "parr.corps": "Hoi!\n\nIk breng je aan bij {app}, een vriendelijke app die het hele gezin helpt om een positieve sfeer te creëren en samen te werken aan huishoudelijke taken en de bescherming van de planeet.\n\nOpen deze link om je eigen familie aan te maken:\n{lien}\n\nTot snel! 🤝",
  "abo.titre": "⭐ Abonnement", "abo.offre": "Huidig abonnement: <strong>{plan}</strong>",
  "abo.note": "Betalingen komen er binnenkort. Voorlopig is alles gratis. 💛",
  "abo.gerer": "Abonnement beheren (binnenkort)",
  "compte.titre": "👤 Account", "compte.connecte": "Ingelogd als <strong>{email}</strong>",
  "compte.deconnexion": "🚪 Uitloggen",
  "donnees.titre": "Gegevens (deze familie)", "donnees.exporter": "💾 Backup exporteren",
  "donnees.reset": "🗑️ Alles resetten",
  "donnees.confirm_reset": "Alles wissen en opnieuw beginnen? (Hartjes, druppels, avatars, ecosystemen)",
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
  "admin.charger": "📋 Alle families laden", "admin.recharger": "🔄 Families herladen",
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
  "par.actif.quitter": "🔒 Elternmodus verlassen",
  "par.attente.titre": "⏳ Zu genehmigende Aktionen ({n})",
  "par.prog.titre": "🛠️ Programmeinstellungen",
  "par.prog.validation": "Elterliche Genehmigung erforderlich (Aktionen der Kinder warten auf deine Bestätigung)",
  "par.prog.changer_pin": "🔑 Eltern-PIN ändern",
  "par.prog.definir_pin": "🔑 Eltern-PIN festlegen",
  "par.prog.astuce_pin": "💡 Tipp: Lege eine PIN fest, um den Zugang zum Elternmodus zu schützen.",
  "mdj.titre": "🗓️ Vorgeschlagene Missionen — {enf}",
  "mdj.note": "Wähle die vorzuschlagenden Missionen aus. Deine Auswahl gilt ab diesem Datum und <strong>für alle folgenden Tage</strong> (bis zur nächsten Änderung).",
  "mdj.a_partir": "Ab dem",
  "mdj.defaut": "↩️ Standardauswahl vorschlagen (nach Alter)",
  "mdj.ajouter_perso": "➕ Eigene Mission hinzufügen",
  "mdj.nom_ph": "Name (z. B. Fahrrad aufräumen)", "mdj.emoji_ph": "Emoji",
  "mdj.ajouter": "Hinzufügen ✨", "mdj.suppr_perso": "Diese eigene Mission löschen",
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
  "fam.creer_invitation": "🔗 Einladungslink erstellen", "fam.changer": "🔁 Familie wechseln / erstellen",
  "parr.titre": "🎁 Eine Freundesfamilie einladen",
  "parr.note": "Schenke {app} Freunden: mit deinem Empfehlungslink erstellen sie <strong>ihre eigene Familie</strong>. Du kannst <strong>3 Familien pro Woche</strong> einladen. Je mehr wir sind, desto mehr positive Energie verbreiten wir! 🤝",
  "parr.quota_check": "Dein Kontingent wird geprüft…", "parr.creer": "🎁 Empfehlungslink erstellen",
  "parr.illimite": "👑 Administratorkonto: <strong>unbegrenzte</strong> Empfehlungen.",
  "parr.restant": "Du hast diese Woche noch <strong>{n}</strong> Empfehlung(en) übrig.",
  "parr.partage": "Teile diesen Link: dein Freund erstellt seine eigene Familie. 💛",
  "parr.sujet": "Ich schenke dir {app} 🌟",
  "parr.corps": "Hallo!\n\nIch lade dich zu {app} ein, einer freundlichen App, die der ganzen Familie hilft, eine positive Stimmung zu schaffen und sich bei Hausarbeiten und dem Schutz des Planeten abzustimmen.\n\nÖffne diesen Link, um deine eigene Familie zu erstellen:\n{lien}\n\nBis bald! 🤝",
  "abo.titre": "⭐ Abonnement", "abo.offre": "Aktueller Plan: <strong>{plan}</strong>",
  "abo.note": "Zahlungen kommen bald. Vorerst ist alles kostenlos. 💛",
  "abo.gerer": "Abonnement verwalten (demnächst)",
  "compte.titre": "👤 Konto", "compte.connecte": "Angemeldet als <strong>{email}</strong>",
  "compte.deconnexion": "🚪 Abmelden",
  "donnees.titre": "Daten (diese Familie)", "donnees.exporter": "💾 Sicherung exportieren",
  "donnees.reset": "🗑️ Alles zurücksetzen",
  "donnees.confirm_reset": "Alles löschen und neu beginnen? (Herzen, Tropfen, Avatare, Ökosysteme)",
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
  "admin.charger": "📋 Alle Familien laden", "admin.recharger": "🔄 Familien neu laden",
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
  "defi.rep_ranger": "I make it right: I pick up what I dropped",
  "defi.rep_pardon": "I make it right: I say sorry",
  "defi.rep_calin": "I make it right: I do something kind",
  "defi.rep_aide": "I make it right: I help the person involved",
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
  "encour.7": "Your heart is full of kindness! 💖"
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
  "defi.rep_ranger": "Ik maak het goed: ik ruim op wat ik liet vallen",
  "defi.rep_pardon": "Ik maak het goed: ik bied mijn excuses aan",
  "defi.rep_calin": "Ik maak het goed: ik doe iets liefs",
  "defi.rep_aide": "Ik maak het goed: ik help de betrokken persoon",
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
  "encour.7": "Je hart is vol vriendelijkheid! 💖"
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
  "defi.rep_ranger": "Ich mache es wieder gut: ich räume auf, was mir hingefallen ist",
  "defi.rep_pardon": "Ich mache es wieder gut: ich entschuldige mich",
  "defi.rep_calin": "Ich mache es wieder gut: ich tue etwas Liebes",
  "defi.rep_aide": "Ich mache es wieder gut: ich helfe der betroffenen Person",
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
  "encour.7": "Dein Herz ist voller Freundlichkeit! 💖"
});

/* =====================================================================
 * Cartes surprises (objectifs d'équipe) — ajouts i18n
 * ===================================================================== */
Object.assign(I18N.fr, {
  "cs.titre": "🎁 Cartes surprises (en équipe)",
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
  "cs.gestion_titre": "🎁 Cartes surprises (activités famille)",
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
  "toast.carte_don": "Merci ! +{montant} {emoji} pour l'équipe",
  "toast.carte_ajoutee": "Carte surprise ajoutée 🎁"
});

Object.assign(I18N.en, {
  "cs.titre": "🎁 Surprise cards (as a team)",
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
  "cs.gestion_titre": "🎁 Surprise cards (family activities)",
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
  "toast.carte_don": "Thanks! +{montant} {emoji} for the team",
  "toast.carte_ajoutee": "Surprise card added 🎁",
  "carte.cs_cine": "Movie night at home",
  "carte.cs_picnic": "Picnic in the park",
  "carte.cs_sortie": "Big surprise outing",
  "carteAct.cs_cine": "We pick a film together, with popcorn and a blanket!",
  "carteAct.cs_picnic": "We pack a snack and go play outside as a family.",
  "carteAct.cs_sortie": "A special outing chosen together (zoo, park, pool…)."
});

Object.assign(I18N.nl, {
  "cs.titre": "🎁 Verrassingskaarten (als team)",
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
  "cs.gestion_titre": "🎁 Verrassingskaarten (gezinsactiviteiten)",
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
  "toast.carte_don": "Bedankt! +{montant} {emoji} voor het team",
  "toast.carte_ajoutee": "Verrassingskaart toegevoegd 🎁",
  "carte.cs_cine": "Filmavond thuis",
  "carte.cs_picnic": "Picknick in het park",
  "carte.cs_sortie": "Grote verrassingsuitstap",
  "carteAct.cs_cine": "We kiezen samen een film, met popcorn en een dekentje!",
  "carteAct.cs_picnic": "We maken een hapje klaar en gaan samen buiten spelen.",
  "carteAct.cs_sortie": "Een speciaal uitje samen gekozen (dierentuin, park, zwembad…)."
});

Object.assign(I18N.de, {
  "cs.titre": "🎁 Überraschungskarten (im Team)",
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
  "cs.gestion_titre": "🎁 Überraschungskarten (Familienaktivitäten)",
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
  "toast.carte_don": "Danke! +{montant} {emoji} fürs Team",
  "toast.carte_ajoutee": "Überraschungskarte hinzugefügt 🎁",
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
Object.assign(I18N.fr, { "grp.quotidien": "📋 Au quotidien", "grp.activites": "🎯 Activités & règles du jeu", "grp.enfants": "👧 Les enfants", "grp.famille": "👪 Famille & invitations", "grp.compte": "⚙️ Mon compte & données" });
Object.assign(I18N.en, { "grp.quotidien": "📋 Daily", "grp.activites": "🎯 Activities & game rules", "grp.enfants": "👧 The children", "grp.famille": "👪 Family & invitations", "grp.compte": "⚙️ My account & data" });
Object.assign(I18N.nl, { "grp.quotidien": "📋 Dagelijks", "grp.activites": "🎯 Activiteiten & spelregels", "grp.enfants": "👧 De kinderen", "grp.famille": "👪 Gezin & uitnodigingen", "grp.compte": "⚙️ Mijn account & gegevens" });
Object.assign(I18N.de, { "grp.quotidien": "📋 Täglich", "grp.activites": "🎯 Aktivitäten & Spielregeln", "grp.enfants": "👧 Die Kinder", "grp.famille": "👪 Familie & Einladungen", "grp.compte": "⚙️ Mein Konto & Daten" });

/* ---- Cartes surprises : visible/mystère ---- */
Object.assign(I18N.fr, { "cs.revele_label": "Activité visible par les enfants (sinon : surprise mystère 🎁)" });
Object.assign(I18N.en, { "cs.revele_label": "Activity visible to children (otherwise: mystery surprise 🎁)" });
Object.assign(I18N.nl, { "cs.revele_label": "Activiteit zichtbaar voor kinderen (anders: mysterieverrassing 🎁)" });
Object.assign(I18N.de, { "cs.revele_label": "Aktivität für Kinder sichtbar (sonst: Geheimnis-Überraschung 🎁)" });

/* ---- Cartes surprises : bibliothèque d'idées (parentalité positive) ---- */
Object.assign(I18N.fr, {
  "cs.idees_titre": "💡 Idées d'activités (parentalité positive)",
  "cs.idees_sous": "Inspirées de Papa Positive et de psychologues. Touche ＋ pour l'ajouter.",
  "cs.taille_petite": "🟢 Petites (rapides, quotidiennes)",
  "cs.taille_moyenne": "🟡 Moyennes (sorties & projets)",
  "cs.taille_grande": "🔴 Grandes (grandes expériences)"
});
Object.assign(I18N.en, {
  "cs.idees_titre": "💡 Activity ideas (positive parenting)",
  "cs.idees_sous": "Inspired by positive-parenting experts and psychologists. Tap ＋ to add.",
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
  "cs.idees_sous": "Geïnspireerd door positief-opvoedexperts en psychologen. Tik op ＋ om toe te voegen.",
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
  "cs.idees_sous": "Inspiriert von Experten für positive Erziehung und Psychologen. Tippe auf ＋ zum Hinzufügen.",
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
  "badgeC.don_coeur": "Give Hearts to a surprise card", "badgeC.equipe": "Help unlock a surprise card"
});
Object.assign(I18N.nl, {
  "badge.coeur100": "Hartenschat", "badge.goutte10": "Klein bronnetje", "badge.goutte50": "Grote rivier",
  "badge.eco_10": "Kleine levende wereld", "badge.eco_25": "Natuurbeschermer", "badge.mois": "Een maand inzet",
  "badge.don_coeur": "Deelhart", "badge.equipe": "Teamgeest",
  "badgeC.coeur100": "Verdien 100 Hartjes in totaal", "badgeC.goutte10": "Verdien 10 Druppels in totaal",
  "badgeC.goutte50": "Verdien 50 Druppels in totaal", "badgeC.eco_10": "Maak 10 levende wezens",
  "badgeC.eco_25": "Maak 25 levende wezens", "badgeC.mois": "Wees 30 verschillende dagen actief",
  "badgeC.don_coeur": "Geef Hartjes aan een verrassingskaart", "badgeC.equipe": "Help een verrassingskaart vrij te spelen"
});
Object.assign(I18N.de, {
  "badge.coeur100": "Herzschatz", "badge.goutte10": "Kleine Quelle", "badge.goutte50": "Großer Fluss",
  "badge.eco_10": "Kleine lebendige Welt", "badge.eco_25": "Naturhüter", "badge.mois": "Ein Monat Einsatz",
  "badge.don_coeur": "Teilendes Herz", "badge.equipe": "Teamgeist",
  "badgeC.coeur100": "Verdiene 100 Herzen insgesamt", "badgeC.goutte10": "Verdiene 10 Tropfen insgesamt",
  "badgeC.goutte50": "Verdiene 50 Tropfen insgesamt", "badgeC.eco_10": "Erschaffe 10 Lebewesen",
  "badgeC.eco_25": "Erschaffe 25 Lebewesen", "badgeC.mois": "Sei an 30 verschiedenen Tagen aktiv",
  "badgeC.don_coeur": "Gib Herzen für eine Überraschungskarte", "badgeC.equipe": "Hilf, eine Überraschungskarte freizuschalten"
});

/* ---- Module signalement bug / suggestion (early adopters) ---- */
Object.assign(I18N.fr, {
  "fb.titre": "🐞 Signaler un bug / 💡 Suggestion",
  "fb.sous": "Réservé aux premiers utilisateurs. Merci de nous aider à améliorer FamiTeam !",
  "fb.type_bug": "🐞 Bug", "fb.type_suggestion": "💡 Suggestion",
  "fb.message_ph": "Décris le bug ou ta suggestion…",
  "fb.envoyer": "✉️ Envoyer par e-mail",
  "fb.vide": "Écris d'abord ton message.", "fb.merci": "Merci ! Ton e-mail va s'ouvrir."
});
Object.assign(I18N.en, {
  "fb.titre": "🐞 Report a bug / 💡 Suggestion",
  "fb.sous": "Available to early adopters. Thanks for helping us improve FamiTeam!",
  "fb.type_bug": "🐞 Bug", "fb.type_suggestion": "💡 Suggestion",
  "fb.message_ph": "Describe the bug or your suggestion…",
  "fb.envoyer": "✉️ Send by email",
  "fb.vide": "Write your message first.", "fb.merci": "Thanks! Your email app will open."
});
Object.assign(I18N.nl, {
  "fb.titre": "🐞 Bug melden / 💡 Suggestie",
  "fb.sous": "Voor early adopters. Bedankt dat je FamiTeam helpt verbeteren!",
  "fb.type_bug": "🐞 Bug", "fb.type_suggestion": "💡 Suggestie",
  "fb.message_ph": "Beschrijf de bug of je suggestie…",
  "fb.envoyer": "✉️ Verstuur per e-mail",
  "fb.vide": "Schrijf eerst je bericht.", "fb.merci": "Bedankt! Je e-mailapp gaat open."
});
Object.assign(I18N.de, {
  "fb.titre": "🐞 Fehler melden / 💡 Vorschlag",
  "fb.sous": "Für Early Adopters. Danke, dass du FamiTeam verbessern hilfst!",
  "fb.type_bug": "🐞 Fehler", "fb.type_suggestion": "💡 Vorschlag",
  "fb.message_ph": "Beschreibe den Fehler oder deinen Vorschlag…",
  "fb.envoyer": "✉️ Per E-Mail senden",
  "fb.vide": "Schreibe zuerst deine Nachricht.", "fb.merci": "Danke! Deine E-Mail-App öffnet sich."
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
  "auth.hero_titre": "Toute la famille dans la même équipe 💛",
  "auth.hero_sous": "{app} transforme les tâches du quotidien et la protection de la planète en une aventure positive, douce et motivante pour vos enfants.",
  "auth.feat1_t": "Des missions rigolotes", "auth.feat1_d": "Chacun gagne des Cœurs 💛 en aidant à la maison et des Gouttes 💧 en protégeant la nature.",
  "auth.feat2_t": "Des cartes surprises", "auth.feat2_d": "Les enfants coopèrent pour débloquer ensemble de vraies activités en famille.",
  "auth.feat3_t": "Un écosystème vivant", "auth.feat3_d": "Leurs efforts font grandir un petit monde, des plantes jusqu'aux animaux.",
  "auth.feat4_t": "Que du positif", "auth.feat4_d": "Badges, encouragements et « défis réparation » : jamais de punition, on valorise l'effort.",
  "auth.comment_titre": "Comment ça marche ?",
  "auth.etape1": "Crée ta famille et ajoute tes enfants.",
  "auth.etape2": "Les enfants réalisent leurs missions et gagnent des récompenses.",
  "auth.etape3": "Vous débloquez ensemble de beaux moments en famille."
});
Object.assign(I18N.en, {
  "auth.form_titre": "Sign in",
  "auth.hero_titre": "The whole family on the same team 💛",
  "auth.hero_sous": "{app} turns everyday chores and protecting the planet into a positive, gentle and motivating adventure for your children.",
  "auth.feat1_t": "Fun missions", "auth.feat1_d": "Everyone earns Hearts 💛 by helping at home and Drops 💧 by protecting nature.",
  "auth.feat2_t": "Surprise cards", "auth.feat2_d": "Children cooperate to unlock real family activities together.",
  "auth.feat3_t": "A living ecosystem", "auth.feat3_d": "Their efforts grow a little world, from plants to animals.",
  "auth.feat4_t": "All positive", "auth.feat4_d": "Badges, encouragement and 'repair challenges': no punishment, we value effort.",
  "auth.comment_titre": "How does it work?",
  "auth.etape1": "Create your family and add your children.",
  "auth.etape2": "Children complete their missions and earn rewards.",
  "auth.etape3": "Together you unlock lovely family moments."
});
Object.assign(I18N.nl, {
  "auth.form_titre": "Aanmelden",
  "auth.hero_titre": "Het hele gezin in hetzelfde team 💛",
  "auth.hero_sous": "{app} maakt van dagelijkse taken en het beschermen van de planeet een positief, zacht en motiverend avontuur voor je kinderen.",
  "auth.feat1_t": "Leuke missies", "auth.feat1_d": "Iedereen verdient Hartjes 💛 door thuis te helpen en Druppels 💧 door de natuur te beschermen.",
  "auth.feat2_t": "Verrassingskaarten", "auth.feat2_d": "Kinderen werken samen om echte gezinsactiviteiten vrij te spelen.",
  "auth.feat3_t": "Een levend ecosysteem", "auth.feat3_d": "Hun inspanningen laten een kleine wereld groeien, van planten tot dieren.",
  "auth.feat4_t": "Alleen positief", "auth.feat4_d": "Badges, aanmoediging en 'herstel-uitdagingen': geen straf, we waarderen inzet.",
  "auth.comment_titre": "Hoe werkt het?",
  "auth.etape1": "Maak je gezin aan en voeg je kinderen toe.",
  "auth.etape2": "Kinderen voltooien hun missies en verdienen beloningen.",
  "auth.etape3": "Samen ontgrendelen jullie mooie gezinsmomenten."
});
Object.assign(I18N.de, {
  "auth.form_titre": "Anmelden",
  "auth.hero_titre": "Die ganze Familie in einem Team 💛",
  "auth.hero_sous": "{app} verwandelt Alltagsaufgaben und den Schutz des Planeten in ein positives, sanftes und motivierendes Abenteuer für deine Kinder.",
  "auth.feat1_t": "Lustige Missionen", "auth.feat1_d": "Jeder verdient Herzen 💛 durch Helfen zu Hause und Tropfen 💧 durch Naturschutz.",
  "auth.feat2_t": "Überraschungskarten", "auth.feat2_d": "Kinder arbeiten zusammen, um echte Familienaktivitäten freizuschalten.",
  "auth.feat3_t": "Ein lebendiges Ökosystem", "auth.feat3_d": "Ihre Mühe lässt eine kleine Welt wachsen, von Pflanzen bis zu Tieren.",
  "auth.feat4_t": "Nur Positives", "auth.feat4_d": "Abzeichen, Ermutigung und 'Wiedergutmachungs-Challenges': keine Strafe, wir würdigen den Einsatz.",
  "auth.comment_titre": "Wie funktioniert es?",
  "auth.etape1": "Erstelle deine Familie und füge deine Kinder hinzu.",
  "auth.etape2": "Kinder erfüllen ihre Missionen und verdienen Belohnungen.",
  "auth.etape3": "Gemeinsam schaltet ihr schöne Familienmomente frei."
});

/* ---- Soutien / don (facultatif) ---- */
Object.assign(I18N.fr, {
  "don.titre": "💛 Soutenir l'aventure",
  "don.gratuit": "✅ {app} est gratuite, et le restera.",
  "don.texte": "Cette application est créée par des parents, pour des parents 🤍. L'héberger et la faire vivre a un petit coût. Si elle vous est utile et que vous en avez envie, un petit don nous aide à la garder gratuite et à l'améliorer — en toute liberté, sans aucune obligation.",
  "don.bouton": "☕ Offrir un petit coup de pouce",
  "don.merci": "Merci du fond du cœur, quoi que vous décidiez ! 🙏"
});
Object.assign(I18N.en, {
  "don.titre": "💛 Support the adventure",
  "don.gratuit": "✅ {app} is free, and will stay free.",
  "don.texte": "This app is made by parents, for parents 🤍. Hosting and maintaining it has a small cost. If it's useful to you and you feel like it, a small donation helps us keep it free and improve it — entirely your choice, no obligation.",
  "don.bouton": "☕ Chip in a little",
  "don.merci": "Thank you from the bottom of our hearts, whatever you decide! 🙏"
});
Object.assign(I18N.nl, {
  "don.titre": "💛 Steun het avontuur",
  "don.gratuit": "✅ {app} is gratis en blijft gratis.",
  "don.texte": "Deze app is gemaakt door ouders, voor ouders 🤍. Hosting en onderhoud kosten een beetje. Als ze nuttig voor je is en je het wil, helpt een kleine gift ons om ze gratis te houden en te verbeteren — helemaal vrij, zonder enige verplichting.",
  "don.bouton": "☕ Geef een kleine boost",
  "don.merci": "Hartelijk dank, wat je ook beslist! 🙏"
});
Object.assign(I18N.de, {
  "don.titre": "💛 Das Abenteuer unterstützen",
  "don.gratuit": "✅ {app} ist kostenlos und bleibt es.",
  "don.texte": "Diese App wird von Eltern für Eltern gemacht 🤍. Hosting und Pflege kosten ein wenig. Wenn sie dir nützt und du magst, hilft uns eine kleine Spende, sie kostenlos zu halten und zu verbessern — ganz frei, ohne jede Verpflichtung.",
  "don.bouton": "☕ Eine Kleinigkeit beisteuern",
  "don.merci": "Von Herzen danke, wie auch immer du dich entscheidest! 🙏"
});

/* ---- Statistiques : dépenses & choix ---- */
Object.assign(I18N.fr, {
  "stats.depenses": "Dépenses : collectif 🎁 / individuel 🎨",
  "stats.depenses_detail": "Collectif (cartes) : {col} 💛 · Individuel (avatar) : {ind} 💛",
  "stats.cartes_choix": "Cartes surprises soutenues", "stats.avatar_choix": "Styles d'avatar préférés"
});
Object.assign(I18N.en, {
  "stats.depenses": "Spending: collective 🎁 / individual 🎨",
  "stats.depenses_detail": "Collective (cards): {col} 💛 · Individual (avatar): {ind} 💛",
  "stats.cartes_choix": "Surprise cards supported", "stats.avatar_choix": "Favourite avatar styles"
});
Object.assign(I18N.nl, {
  "stats.depenses": "Uitgaven: collectief 🎁 / individueel 🎨",
  "stats.depenses_detail": "Collectief (kaarten): {col} 💛 · Individueel (avatar): {ind} 💛",
  "stats.cartes_choix": "Gesteunde verrassingskaarten", "stats.avatar_choix": "Favoriete avatarstijlen"
});
Object.assign(I18N.de, {
  "stats.depenses": "Ausgaben: gemeinsam 🎁 / individuell 🎨",
  "stats.depenses_detail": "Gemeinsam (Karten): {col} 💛 · Individuell (Avatar): {ind} 💛",
  "stats.cartes_choix": "Unterstützte Überraschungskarten", "stats.avatar_choix": "Lieblings-Avatarstile"
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
