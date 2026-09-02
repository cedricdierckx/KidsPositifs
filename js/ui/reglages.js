/* =====================================================================
 * FamiTeam — Interface : Réglages, retours, récupération
 * ---------------------------------------------------------------------
 * L'onglet Réglages (famille et compte), l'envoi d'un retour au fondateur
 * et l'écran de récupération d'une sauvegarde. Dernier module chargé,
 * comme il est le dernier onglet.
 *
 * Module de l'interface (ARCHITECTURE.md, phase C). Script classique,
 * comme tous les autres : les fonctions restent globales et s'appellent
 * entre modules sans import. L'ordre des balises dans index.html n'a
 * donc aucune conséquence — rien ne s'exécute au chargement.
 * ===================================================================== */
function vueReglages(c) {
  const totalAttente = Object.values(etat.enfants).reduce((s, e) => s + e.enAttente.length, 0);
  const exp = estModeExpert();

  // ----- Écran verrouillé (mode parents inactif) -----
  if (!modeParents) {
    const v = el("section", "carte");
    v.innerHTML = `<h1>${t("par.verrou.titre")}</h1>
      <p>${t("par.verrou.desc")}</p>
      ${totalAttente ? `<p class="note">${t("par.verrou.attente", { n: totalAttente })}</p>` : ""}
      <p class="note">${t("par.verrou.esprit")}</p>`;
    const b = el("button", "gros-bouton planete", t("par.verrou.activer"));
    b.onclick = activerModeParents;
    v.appendChild(b);
    c.appendChild(v);
    return;
  }

  // Rappel du soir (notification) : on rattrape le réglage déjà choisi
  // auprès du système une seule fois par session — jamais avant que le
  // parent ait déverrouillé cet espace, ET jamais de façon interactive ici
  // (voir synchroniserNotificationSoir) : aucune demande de permission ne
  // doit pouvoir surgir pendant qu'un enfant tient l'appareil, ni pendant
  // que ce même écran affiche d'autres boutons à portée de doigt.
  if (!_notifSoirSyncFaite) {
    _notifSoirSyncFaite = true;
    synchroniserNotificationSoir(false);
  }

  // ----- Bandeau mode parents actif -----
  // Ce bandeau annonce un ÉTAT et offre des réglages rares : il n'a pas à
  // occuper quatre lignes en haut de chaque écran parent. Le titre et la
  // sortie tiennent sur UNE ligne à eux deux ; Standard/Expert et la langue
  // ont chacun la leur, dessous — trois éléments sur la ligne du titre
  // (le libellé, le sélecteur Standard/Expert, ET Quitter) se disputaient la
  // largeur et rejetaient Quitter, seul, sur une ligne à moitié vide dès que
  // l'écran resserrait un peu : exactement ce qui donnait un air de brouillon.
  const banniere = el("section", "carte par-banniere");
  const entete = el("div", "par-entete");
  // Plus de pastille « activé » : le parent est sur l'écran parent, avec un
  // bouton « Quitter » juste à côté — elle ne disait rien de neuf, et c'est
  // elle qui empêchait le titre et la sortie de tenir sur une seule ligne.
  entete.innerHTML = `<h1>${t("par.actif.titre")}</h1>`;
  const bq = el("button", "btn-secondaire", t("par.actif.quitter"));
  bq.onclick = quitterModeParents;
  entete.appendChild(bq);
  banniere.appendChild(entete);
  // Standard/Expert sur sa propre ligne : le réglage le plus consulté de
  // l'espace parents, mais un réglage tout de même — pas un geste d'identité
  // ou de sortie, il n'a pas à se disputer leur ligne.
  const blocMode = el("div", "mode-bloc");
  blocMode.appendChild(toggleModeParents());
  banniere.appendChild(blocMode);
  // Sélecteur de langue « fun » : boutons drapeaux (plutôt qu'une liste).
  const blocLang = el("div", "langue-bloc");
  blocLang.innerHTML = `<span class="langue-titre">🌐 ${t("langue")}</span>`;
  blocLang.appendChild(selecteurLangueFun(() => rendre()));
  banniere.appendChild(blocLang);
  c.appendChild(banniere);

  // ----- Sous-menu (onglets) pour organiser l'espace parents -----
  const onglets = ongletsParents().map(id => [id, libelleOnglet(id)]);
  // Si l'onglet courant n'est plus visible (ex. passage en Standard), on revient
  // au 1ᵉʳ — sauf « enfants » : ce n'est plus un onglet de la barre une fois les
  // profils renseignés, mais on y accède quand même via un lien concret
  // (Premiers pas, bouton dans Réglages), sans jamais rebondir dessus.
  if (ongletParent !== "enfants" && !onglets.some(([id]) => id === ongletParent)) ongletParent = onglets[0][0];
  const nav = el("nav", "sous-nav");
  let btnActif = null;
  onglets.forEach(([id, label]) => {
    const b = el("button", "sous-nav-btn" + (ongletParent === id ? " actif" : ""), label);
    if (ongletParent === id) btnActif = b;
    if (id === "quotidien" && totalAttente) {
      const pin = el("span", "sous-nav-pin", String(totalAttente));
      b.appendChild(pin);
    }
    b.onclick = () => changerOngletParent(id);
    nav.appendChild(b);
  });
  c.appendChild(nav);
  // Centre l'onglet actif DANS la barre (défilement horizontal interne
  // uniquement) — surtout pas scrollIntoView, qui ferait remonter la page.
  if (btnActif) requestAnimationFrame(() => {
    try { nav.scrollLeft = btnActif.offsetLeft - (nav.clientWidth - btnActif.clientWidth) / 2; } catch (e) { /* ignore */ }
  });

  // Indicateur de position : flèches ◀ ▶ + points (le titre est déjà donné
  // par l'onglet actif surligné juste au-dessus — on évite le doublon).
  const idxOnglet = onglets.findIndex(([id]) => id === ongletParent);
  const indic = el("div", "parent-indic");
  const prevB = el("button", "parent-indic-fleche", "◀"); prevB.setAttribute("aria-label", t("a11y.precedent"));
  prevB.onclick = () => glisserVers(-1, () => changerOngletParentRelatif(-1));
  const nextB = el("button", "parent-indic-fleche", "▶"); nextB.setAttribute("aria-label", t("a11y.suivant"));
  nextB.onclick = () => glisserVers(1, () => changerOngletParentRelatif(1));
  const centre = el("div", "parent-indic-centre");
  centre.innerHTML = `<span class="parent-indic-dots">${onglets.map((_, k) =>
    `<span class="pi-dot${k === idxOnglet ? " on" : ""}"></span>`).join("")}</span>`;
  indic.appendChild(prevB); indic.appendChild(centre); indic.appendChild(nextB);
  c.appendChild(indic);

  /* ===== ONGLET : Aujourd'hui ===== */
  if (sectionVisible("quotidien")) {

  if (!exp) {
    // Mode simplifié : l'ordre suit le geste réel du parent — ce qu'il y a à
    // faire d'abord, les encouragements ensuite. Le compliment du jour passe
    // avant le rendez-vous du soir : c'est le mot à dire à l'enfant, la
    // première chose à voir. Pas de carte « Oups, ça arrive… » ici : elle
    // fait double emploi avec la pastille arc-en-ciel, accessible depuis
    // n'importe quel écran.
    const pp = blocPremiersPas();
    if (pp) c.appendChild(pp);
    if (totalAttente) c.appendChild(carteRepliable(blocAttente(totalAttente), "attente", true));
    const bm = blocBonMoment();
    if (bm) c.appendChild(carteRepliable(bm, "bonmoment", true));
    const j7 = blocArbreSeptiemeJour();
    if (j7) c.appendChild(carteRepliable(j7, "septiemejour", true));
    // Ouverte tant que rien n'est choisi, repliée ensuite — même logique que
    // la carte agenda juste en dessous. (Absente sur le web : réservée à
    // l'app installée.)
    const notif = blocNotificationSoir();
    if (notif) c.appendChild(carteRepliable(notif, "notif", !notifReglage()));
    c.appendChild(carteRepliable(blocComplimentDuJour(enfantActif()), "compliment", true));
    // Ouvert tant que rien n'est réglé, replié ensuite : la carte se fait
    // discrète pour celui qui a déjà répondu, et reste visible pour l'autre.
    c.appendChild(carteRepliable(blocRituelSoir(), "rituel", !rituelReglage()));
    // Pli par enfant : le sélecteur d'enfants ne fait pas partie de l'onglet
    // Aujourd'hui, mais reste accessible en permanence tout en haut de
    // l'écran — passer de Maria à Jojo ne doit donc pas hériter du pli que
    // Maria avait choisi.
    c.appendChild(carteRepliable(blocMissionsDuJour(enfantActif()), "missions-" + enfantActif().id, false));
    c.appendChild(carteRepliable(blocJournalActions(), "journal", false));
  } else {
    // ----- Compliment du jour : un mot d'encouragement concret à dire à
    // l'enfant, basé sur sa régularité/progression réelle (parentalité
    // positive). Tout en haut, au-dessus du rendez-vous du soir : c'est la
    // première chose à voir chaque jour. -----
    c.appendChild(carteRepliable(blocComplimentDuJour(enfantActif()), "compliment", true));

    // ----- Comportement de l'enfant (évaluation parent) -----
    // Sous le compliment, et en mode expert seulement : on lit d'abord ce
    // qu'on peut DIRE à l'enfant, on note ensuite — l'inverse installait la
    // notation comme le premier geste de la soirée.
    c.appendChild(carteRepliable(blocEval(enfantActif(), "parent"), "eval", true));

    // ----- Rappel du soir (notification) -----
    // (Absente sur le web : réservée à l'app installée.)
    const notifExp = blocNotificationSoir();
    if (notifExp) c.appendChild(carteRepliable(notifExp, "notif", !notifReglage()));

    // ----- Le rendez-vous du soir (rappel par l'agenda du parent) -----
    c.appendChild(carteRepliable(blocRituelSoir(), "rituel", !rituelReglage()));

    // ----- Le bon moment pour parler de l'app (après une carte débloquée) -----
    const bmExp = blocBonMoment();
    if (bmExp) c.appendChild(carteRepliable(bmExp, "bonmoment", true));
    const j7Exp = blocArbreSeptiemeJour();
    if (j7Exp) c.appendChild(carteRepliable(j7Exp, "septiemejour", true));

    // ----- Validations en attente (affichées seulement s'il y en a) -----
    if (totalAttente) c.appendChild(carteRepliable(blocAttente(totalAttente), "attente", true));

    // ----- Sélection groupée & tournantes : outils avancés -----
    // Repliées : ce sont les plus longues de l'espace parents, et elles ne
    // servent qu'au réglage, pas au geste quotidien.
    c.appendChild(carteRepliable(blocSelectionGroupee(), "selection", false));
    c.appendChild(carteRepliable(blocTournantes(), "tournantes", false));

    // ----- Missions du jour (sélection par les parents) -----
    // Pli par enfant : le sélecteur d'enfants ne fait pas partie de l'onglet
    // Aujourd'hui, mais reste accessible en permanence tout en haut de
    // l'écran — passer de Maria à Jojo ne doit donc pas hériter du pli que
    // Maria avait choisi.
    c.appendChild(carteRepliable(blocMissionsDuJour(enfantActif()), "missions-" + enfantActif().id, false));

    // ----- Corrections fines (ajustements/badges) -----
    c.appendChild(carteRepliable(blocCorrections(enfantActif()), "corrections", false));

    // ----- Journal des actions récentes (annulation) -----
    c.appendChild(carteRepliable(blocJournalActions(), "journal", false));
  }

  } /* fin onglet quotidien */

  /* ===== ONGLET : Statistiques (expert) ===== */
  if (sectionVisible("stats")) {
    c.appendChild(blocStatistiques());
  }

  /* ===== ONGLET : Soutien ===== */
  // Le don d'abord, entièrement facultatif ; la boîte à idées en bas — un
  // autre geste facultatif, tourné vers l'app plutôt que vers la famille.
  if (sectionVisible("soutien")) {
    c.appendChild(blocDon());
    c.appendChild(blocFeedback());
  }

  /* ===== ONGLET : Activités & récompenses ===== */
  if (sectionVisible("activites")) {
    // ----- Cartes surprises (activités famille) -----
    c.appendChild(blocCartesSurprisesParents());
    // En expert, cet onglet porte aussi le programme et la référence écosystème
    // (en simplifié, le programme vit dans « Réglages »).
    if (exp) {
      c.appendChild(blocProgramme());
      c.appendChild(blocEcoReference());
    }
  }

  /* ===== ONGLET : Semaine papier (à part entière, dans les deux modes) ===== */
  if (sectionVisible("papier")) {
    c.appendChild(el("p", "note", t("papier.pour_quoi")));
    c.appendChild(blocSemainePapier());
    c.appendChild(blocEncoderSemaine());
  }

  /* ===== ONGLET : Mes enfants ===== */
  if (sectionVisible("enfants")) {

  // ----- Profils -----
  Object.values(etat.enfants).forEach(enf => {
    const sec = el("section", "carte reglage-enfant");
    sec.style.setProperty("--c", enf.couleur);
    const enTete = el("div", "reglage-entete");
    enTete.innerHTML = `<h2>${vignetteEnfant(enf, "mini")} ${echapper(enf.prenom)}</h2>`;
    if (Object.keys(etat.enfants).length > 1) {
      const bSup = el("button", "mini-btn danger", t("profil.supprimer"));
      bSup.onclick = () => supprimerEnfant(enf.id);
      enTete.appendChild(bSup);
    }
    sec.appendChild(enTete);

    // Minimisation : un surnom suffit, et le mois de naissance suffit à adapter
    // l'âge. Moins de données réelles sur un enfant = moins de risque, pour un
    // service identique.
    const lPrenom = el("label", "champ", t("profil.prenom"));
    const iPrenom = el("input");
    iPrenom.value = enf.prenom;
    iPrenom.oninput = () => { majEnfant(enf.id, "prenom", iPrenom.value); rendreSelecteur(); };
    lPrenom.appendChild(iPrenom);
    lPrenom.appendChild(el("small", "champ-aide", t("profil.prenom_aide")));

    const lDate = el("label", "champ", t("profil.naissance"));
    const iDate = el("input");
    iDate.type = "month";                       // mois + année : le jour n'apporte rien
    iDate.value = (enf.naissance || "").slice(0, 7);
    iDate.max = aujourdHui().slice(0, 7); iDate.min = "2008-01";
    iDate.onchange = () => {
      const v = (iDate.value || "").slice(0, 7);
      majEnfant(enf.id, "naissance", v ? v + "-01" : enf.naissance);
      rendreSelecteur(); rendre();
    };
    lDate.appendChild(iDate);
    lDate.appendChild(el("small", "champ-aide", t("profil.naissance_aide")));

    const lSexe = el("label", "champ", t("profil.sexe"));
    const iSexe = el("div", "segmente");
    ["fille", "garcon"].forEach(s => {
      const b = el("button", "seg" + (enf.sexe === s ? " actif" : ""), s === "fille" ? t("profil.fille") : t("profil.garcon"));
      b.onclick = () => { majEnfant(enf.id, "sexe", s); rendre(); };
      iSexe.appendChild(b);
    });
    lSexe.appendChild(iSexe);

    // L'emoji d'enfant n'est plus affiché nulle part (l'avatar le remplace) :
    // le champ a donc disparu. La donnée reste en base, sans usage visible.

    const lCouleur = el("label", "champ", t("profil.couleur"));
    const iCouleur = el("input");
    iCouleur.type = "color"; iCouleur.value = enf.couleur;
    iCouleur.oninput = () => majEnfant(enf.id, "couleur", iCouleur.value);
    lCouleur.appendChild(iCouleur);

    const lDodo = el("label", "champ", t("profil.coucher"));
    const iDodo = el("input");
    iDodo.type = "time"; iDodo.value = enf.heureCoucher || "19:30";
    iDodo.onchange = () => { majEnfant(enf.id, "heureCoucher", iDodo.value || "19:30"); rendre(); };
    lDodo.appendChild(iDodo);

    const stats = el("p", "note", t("profil.stats", { age: age(enf), c: enf.coeursTotal, g: enf.gouttesTotal, e: nbTotalEspeces(enf), b: enf.badges.length }));

    [lPrenom, lDate, lSexe, lCouleur, lDodo, stats].forEach(x => sec.appendChild(x));
    c.appendChild(sec);
  });

  // ----- Ajouter un enfant -----
  const bAjout = el("button", "gros-bouton famille", t("profil.ajouter_enfant"));
  bAjout.onclick = () => { ajouterEnfant(); rendre(); };
  c.appendChild(bAjout);

  } /* fin onglet enfants */

  /* ===== ONGLET : Admin (réservé à l'administrateur) ===== */
  if (ongletParent === "admin" && typeof estAdmin !== "undefined" && estAdmin) {
    vueAdmin(c);
  }

  /* ===== Réglages : programme, famille, compte =====
   * Expert : « Activités » porte le programme, « Famille » et « Mon compte »
   * ont leur onglet. Simplifié : tout est ici, en dépliants pour rester lisible. */
  if (exp) {
    if (sectionVisible("famille")) sectionsFamille(c);
    if (ongletParent === "compte") sectionsCompte(c);
  } else if (ongletParent === "compte") {
    // Toutes les sections de Réglages portent la même signature visuelle
    // qu'ailleurs dans l'espace parents : une carte blanche, une ligne de
    // couleur à gauche, repliée par défaut (carteRepliable) — jamais la barre
    // plate de blocPliable, réservée aux sous-dépliants À L'INTÉRIEUR d'une
    // carte (« Comment ça marche ? », catégories de missions…), pas à un
    // sommaire de premier niveau.
    c.appendChild(carteRepliable(blocProgramme(), "std-prog", false));
    // « Mes enfants » : décisif à la création du compte (un lien concret vit
    // dans « Premiers pas »), puis rarement rouvert — une carte minimale,
    // pas un bouton isolé qui romprait le rythme des cartes voisines.
    const carteEnfants = el("section", "carte");
    carteEnfants.innerHTML = `<h2>${t("grp.enfants")}</h2><p class="note">${t("regl.enfants_note")}</p>`;
    const bEnfants = el("button", "btn-secondaire", t("regl.enfants_ouvrir"));
    bEnfants.onclick = () => changerOngletParent("enfants");
    carteEnfants.appendChild(bEnfants);
    c.appendChild(carteEnfants);
    // Famille : pas de dépliant englobant. Ses trois cartes se présentent
    // elles-mêmes, et se replient déjà — un pli dans un pli demanderait deux
    // gestes pour arriver au premier bouton.
    sectionsFamille(c);
    // Mon compte : même raison — ses propres cartes (compte, données,
    // récupération, zone de danger) sont déjà repliées individuellement.
    sectionsCompte(c);
  }
}

// Module de signalement (bug / suggestion) — réservé aux early adopters.
// Transmet par e-mail (mailto) à l'adresse de support.
// Adresse de support : configurable par l'admin (app_config), défaut hello@fami.team.
function emailSupport() {
  const cfg = (typeof configApp !== "undefined") ? configApp : {};
  return cfg.support_email || "hello@fami.team";
}
/* Retours des familles : aucun ne doit se perdre.
 * La base est le seul registre (elle alimente le module Retours de l'admin).
 * Si l'enregistrement échoue — hors ligne, serveur injoignable — le retour est
 * mis en file locale et repart tout seul à la prochaine ouverture de l'app.
 * Aucun e-mail n'est envoyé : tout est consulté depuis l'onglet Admin. */
const FB_FILE_KEY = "kp_retours_en_attente";

function fileRetours() {
  try { return JSON.parse(localStorage.getItem(FB_FILE_KEY) || "[]") || []; }
  catch (e) { return []; }
}
function fileRetoursEcrire(liste) {
  try { localStorage.setItem(FB_FILE_KEY, JSON.stringify(liste.slice(-50))); }
  catch (e) { /* stockage plein : on ne peut pas faire mieux */ }
}
// Enregistre un retour. Retourne true s'il est arrivé en base, false s'il a été
// mis en file locale — dans les deux cas, il n'est jamais perdu.
async function enregistrerRetour(retour) {
  if (typeof sb === "undefined" || !sb) return false;
  try {
    const { error } = await sb.rpc("submit_feedback", {
      p_type: retour.type, p_message: retour.message,
      p_context: retour.context, p_family: retour.famille || null
    });
    return !error;
  } catch (e) { return false; }
}
// Rejoue la file locale : appelée à chaque ouverture de l'app.
async function viderFileRetours() {
  const demo = (typeof modeDemo !== "undefined" && modeDemo);
  if (demo || typeof sb === "undefined" || !sb) return 0;
  const file = fileRetours();
  if (!file.length) return 0;
  const restants = [];
  let partis = 0;
  for (const r of file) {
    if (await enregistrerRetour(r)) partis++;
    else restants.push(r);          // toujours injoignable : on garde pour plus tard
  }
  fileRetoursEcrire(restants);
  return partis;
}

function blocFeedback() {
  const sec = el("section", "carte feedback-carte");
  sec.innerHTML = `<h2>${t("fb.titre")}</h2><p class="note">${t("fb.sous")}</p>`;
  const selType = el("select", "fb-type");
  selType.innerHTML = `<option value="bug">${t("fb.type_bug")}</option>
    <option value="suggestion">${t("fb.type_suggestion")}</option>`;
  const ta = el("textarea", "fb-message");
  ta.placeholder = t("fb.message_ph"); ta.rows = 4;
  const b = el("button", "btn-secondaire", t("fb.envoyer"));
  b.onclick = async () => {
    const msg = ta.value.trim();
    if (!msg) { toast(t("fb.vide"), "info"); return; }
    const retour = {
      type: selType.value === "bug" ? "bug" : "suggestion",
      message: msg,
      famille: (typeof familleId !== "undefined") ? familleId : null,
      context: {
        famille: familleActive ? familleActive.name : null,
        langue, version: ETAT_VERSION, ua: navigator.userAgent || ""
      }
    };
    const demo = (typeof modeDemo !== "undefined" && modeDemo);
    b.disabled = true; b.textContent = t("common.creation");
    const ok = demo ? true : await enregistrerRetour(retour);
    // Échec : on met en file locale plutôt que de perdre le message.
    if (!ok) fileRetoursEcrire(fileRetours().concat([retour]));
    b.disabled = false; b.textContent = t("fb.envoyer");
    ta.value = "";
    toast(t(ok ? "fb.merci" : "fb.plus_tard"), "succes");
  };
  sec.appendChild(selType); sec.appendChild(ta); sec.appendChild(b);
  return sec;
}

// Outil de récupération : restaurer une sauvegarde locale ou un fichier JSON.
function blocRecuperation() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("recup.titre")}</h2>
    <p class="note">${t("recup.note", { nom: familleActive ? echapper(familleActive.name) : "—" })}</p>`;

  const sauvegardes = (typeof listerSauvegardesLocales === "function") ? listerSauvegardesLocales() : [];
  if (!sauvegardes.length) {
    sec.appendChild(el("p", "note", t("recup.aucune_locale")));
  } else {
    sauvegardes.forEach(s => {
      const d = s.maj ? new Date(s.maj).toLocaleString("fr-BE") : "—";
      const ligne = el("div", "admin-item");
      ligne.innerHTML = `<div class="adm-info"><strong>${t("recup.enfants", { n: s.nb, liste: echapper(s.prenoms.join(", ")) })}</strong>
        <small>${t("recup.maj", { date: d })}</small></div>`;
      const b = el("button", "mini-btn ok", t("recup.restaurer"));
      b.onclick = () => {
        if (confirm(t("recup.confirm_local", { n: s.nb, liste: s.prenoms.join(", "), fam: familleActive ? familleActive.name : "?" })))
          restaurerSauvegarde(s.brut);
      };
      ligne.appendChild(b);
      sec.appendChild(ligne);
    });
  }

  // Historique automatique côté serveur (sauvegardes ponctuelles).
  sec.appendChild(el("p", "sous-titre", t("recup.cloud_titre")));
  const zoneCloud = el("div", "admin-liste");
  const bCloud = el("button", "btn-secondaire", t("recup.cloud_btn"));
  bCloud.onclick = async () => {
    bCloud.disabled = true; bCloud.textContent = t("common.chargement");
    const hist = (typeof listerHistoriqueCloud === "function") ? await listerHistoriqueCloud() : [];
    bCloud.disabled = false; bCloud.textContent = t("recup.cloud_rafraichir");
    zoneCloud.innerHTML = "";
    if (!hist.length) { zoneCloud.appendChild(el("p", "note", t("recup.cloud_aucune"))); return; }
    hist.forEach(h => {
      const d = h.saved_at ? new Date(h.saved_at).toLocaleString("fr-BE") : "—";
      const ligne = el("div", "admin-item");
      ligne.innerHTML = `<div class="adm-info"><strong>${t("recup.enfants", { n: h.nb, liste: echapper(h.prenoms.join(", ")) })}</strong>
        <small>${d}</small></div>`;
      const b = el("button", "mini-btn ok", t("recup.restaurer"));
      b.onclick = () => {
        if (confirm(t("recup.confirm_cloud", { date: d, n: h.nb })))
          restaurerSauvegarde(JSON.stringify(h.data));
      };
      ligne.appendChild(b);
      zoneCloud.appendChild(ligne);
    });
  };
  sec.appendChild(bCloud); sec.appendChild(zoneCloud);

  // Import depuis un fichier JSON (sauvegarde exportée).
  sec.appendChild(el("p", "sous-titre", t("recup.import_titre")));
  const inp = el("input"); inp.type = "file"; inp.accept = "application/json,.json";
  inp.onchange = () => { if (inp.files && inp.files[0]) importerSauvegardeFichier(inp.files[0]); };
  sec.appendChild(inp);
  return sec;
}
