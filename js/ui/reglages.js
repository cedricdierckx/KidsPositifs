/* =====================================================================
 * FamiTeam — Espace parents : onglets, premiers pas, rituel du soir, compte
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * L'ossature de l'espace parents : onglets et cartes repliables, mode
 * Standard/Expert, premiers pas, rituel du soir, validations en attente,
 * réglages du programme, famille et invitations, compte et données.
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

// Onglet actif de l'espace parents (session, non synchronisé).
let ongletParent = "quotidien";

// ---------- Cartes repliables (espace parents) ----------
// L'espace parents empile des cartes très longues — la liste des missions, le
// journal des annulations, les tournantes — au point qu'atteindre la suivante
// demande plusieurs écrans de défilement. On les replie derrière leur propre
// titre, avec <details>/<summary> : c'est natif, accessible au clavier et aux
// lecteurs d'écran, et cela ne coûte pas une ligne de script au dépliage.
//
// L'état d'ouverture est mémorisé pour la durée de la session : rendre()
// reconstruit tout le DOM à la moindre action, et une carte qui se refermerait
// après chaque clic serait plus pénible que pas de pli du tout.
const plisParent = new Map();          // clé de carte → ouverte (booléen)

function carteRepliable(sec, cle, ouvertParDefaut) {
  if (!sec) return sec;
  const titre = sec.querySelector("h2");
  if (!titre) return sec;              // sans titre, rien à quoi accrocher le pli
  const det = el("details", "carte-pli");
  det.id = "pli-" + cle;
  det.open = plisParent.has(cle) ? plisParent.get(cle) : !!ouvertParDefaut;
  const som = el("summary", "carte-pli-t");
  som.appendChild(titre);              // le <h2> lui-même : on garde la sémantique de titre
  const corps = el("div", "carte-pli-c");
  while (sec.firstChild) corps.appendChild(sec.firstChild);
  det.appendChild(som);
  det.appendChild(corps);
  sec.appendChild(det);
  det.addEventListener("toggle", () => plisParent.set(cle, det.open));
  return sec;
}

// Mode parents : Standard (simple) ou Expert (outils avancés). Par défaut
// Expert pour l'admin ; sinon Standard, sauf préférence enregistrée.
function estModeExpert() {
  if (etat.reglages && typeof etat.reglages.modeExpert === "boolean") return etat.reglages.modeExpert;
  return (typeof estAdmin !== "undefined" && estAdmin);
}
function definirModeExpert(v) {
  if (!etat.reglages) etat.reglages = {};
  etat.reglages.modeExpert = !!v;
  sauver(); rendre();
}
// Liste des onglets visibles selon le mode (et l'admin).
//   Mode simplifié : 4 onglets seulement, dans l'ordre où un parent qui
//     découvre l'app en a besoin (aujourd'hui → mes enfants → activités →
//     réglages). Rien n'est perdu : la semaine papier, le programme, la
//     famille et le compte sont regroupés dans ces onglets (cf. sectionVisible).
//   Mode expert : un onglet par sujet, plus les statistiques.
function ongletsParents() {
  const admin = (typeof estAdmin !== "undefined" && estAdmin);
  // Le soutien a son propre onglet plutôt qu'une carte au milieu du quotidien :
  // un appel au don n'a pas à s'intercaler entre deux gestes de la journée, et
  // le parent qui le cherche sait où le trouver. L'onglet n'existe pas tant que
  // le don n'est pas proposé à cette famille (early adopters, première semaine).
  const soutien = (typeof donDisponible !== "function" || donDisponible());
  // « Mes enfants » est décisif à la création du compte (prénom, date de
  // naissance…) puis rarement rouvert : une fois les profils renseignés, il
  // quitte la barre d'onglets — un bouton dans Réglages et le lien de
  // « Premiers pas » restent la voie d'accès.
  const enfants = !profilsRenseignes();
  if (!estModeExpert()) {
    const ids = ["quotidien"];
    if (enfants) ids.push("enfants");
    ids.push("activites", "compte");
    if (soutien) ids.push("soutien");
    // Semaine papier : menu à part entière, juste avant Admin — jamais un
    // dépliant caché sous un autre onglet.
    ids.push("papier");
    if (admin) ids.push("admin");
    return ids;
  }
  const ids = ["quotidien", "activites"];
  if (enfants) ids.push("enfants");
  ids.push("famille", "compte", "stats");
  if (soutien) ids.push("soutien");
  ids.push("papier");
  if (admin) ids.push("admin");
  return ids;
}
const LIBELLES_ONGLETS = {
  quotidien: "grp.quotidien", papier: "grp.papier", activites: "grp.activites",
  enfants: "grp.enfants", famille: "grp.famille", compte: "grp.compte",
  stats: "grp.stats", admin: "grp.admin", soutien: "grp.soutien"
};
// Libellé d'un onglet : en mode simplifié, « Mon compte & données » devient
// « Réglages » puisqu'il regroupe aussi le programme, la famille et le mode.
function libelleOnglet(id) {
  if (id === "compte" && !estModeExpert()) return t("grp.reglages");
  return t(LIBELLES_ONGLETS[id]);
}
// Une « section » est un bloc de contenu ; en mode simplifié plusieurs
// sections partagent un même onglet.
function sectionVisible(section) {
  const exp = estModeExpert();
  switch (section) {
    case "papier":  return ongletParent === "papier";  // onglet à part entière, dans les deux modes
    // Famille & invitations : onglet dédié en expert, dans « Réglages » sinon.
    case "famille": return ongletParent === (exp ? "famille" : "compte");
    case "stats":   return exp && ongletParent === "stats";  // outil avancé
    default:        return ongletParent === section;
  }
}

// Change l'onglet parent affiché ET remonte en haut de page : rester scrollé
// plus bas qu'où on était sur le précédent onglet serait déroutant, chaque
// section démarrant son propre contenu depuis le haut.
function changerOngletParent(id) {
  ongletParent = id;
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") window.scrollTo(0, 0);
  rendre();
}
// Change d'onglet parent d'un cran (dir = +1 suivant, -1 précédent), en boucle.
function changerOngletParentRelatif(dir) {
  const ids = ongletsParents();
  const i = Math.max(0, ids.indexOf(ongletParent));
  changerOngletParent(ids[(i + dir + ids.length) % ids.length]);
}

// Bandeau "mode démo" (remplace les sections compte/famille en démo).
function bandeauDemo() {
  const d = el("section", "carte");
  d.innerHTML = `<h2>${t("demo.titre")}</h2><p>${t("demo.desc")}</p>`;
  const bq = el("button", "gros-bouton planete", t("demo.creer"));
  bq.onclick = () => location.reload();
  d.appendChild(bq);
  return d;
}

/* ---------- Premiers pas (mode simplifié) ----------
 * Carte d'accueil pour un parent qui découvre FamiTeam : trois gestes, dans
 * l'ordre, avec l'état réel de chacun (fait / à faire). Disparaît d'elle-même
 * quand les trois sont faits, ou si le parent la masque. */

// Les prénoms d'usine (« Aîné(e) », « Petit(e) »…) signalent un profil pas
// encore renseigné.
function profilsRenseignes() {
  const defauts = (typeof ENFANTS_DEFAUT !== "undefined") ? ENFANTS_DEFAUT.map(e => e.prenom) : [];
  return Object.values(etat.enfants).every(e =>
    e.prenom && e.prenom.trim() && !defauts.includes(e.prenom.trim()));
}
// Le parent a-t-il déjà composé une liste de missions (au lieu du défaut) ?
function missionsChoisies() {
  return Object.values(etat.enfants).some(e => planEffectif(e, aujourdHui()) !== null);
}
// Une mission a-t-elle déjà été validée aujourd'hui (la boucle tourne) ?
// Une mission a-t-elle DÉJÀ été validée un jour, n'importe lequel — pas
// seulement aujourd'hui. Ce pas de « Premiers pas » atteste que le geste du
// soir a déjà eu lieu au moins une fois : comme les deux précédents (profils
// renseignés, missions choisies), une fois vrai ça le reste, et la carte
// entière peut disparaître pour de bon plutôt que de ressurgir chaque
// matin tant que rien n'a encore été coché ce jour-là.
function journeeEntamee() {
  return Object.values(etat.enfants).some(e =>
    e.journal && Object.values(e.journal).some(jour => Object.keys(jour || {}).length > 0));
}

function blocPremiersPas() {
  if (etat.reglages && etat.reglages.premiersPasVus) return null;
  const etapes = [
    { fait: profilsRenseignes(), titre: t("pp.e1_t"), desc: t("pp.e1_d"), onglet: "enfants", bouton: t("pp.e1_b") },
    { fait: missionsChoisies(),  titre: t("pp.e2_t"), desc: t("pp.e2_d"), pli: "missions", bouton: t("pp.e2_b") },
    { fait: journeeEntamee(),    titre: t("pp.e3_t"), desc: t("pp.e3_d"), sortir: true, bouton: t("pp.e3_b") }
  ];
  if (etapes.every(e => e.fait)) return null;      // plus rien à expliquer

  const sec = el("section", "carte premiers-pas");
  sec.innerHTML = `<h2>${t("pp.titre")}</h2><p class="note">${t("pp.sous")}</p>`;
  const liste = el("ol", "pp-liste");
  etapes.forEach((e, i) => {
    const li = el("li", "pp-etape" + (e.fait ? " fait" : ""));
    li.innerHTML = `<span class="pp-num">${e.fait ? "✅" : (i + 1)}</span>
      <span class="pp-corps"><strong>${e.titre}</strong><small>${e.desc}</small></span>`;
    // Chaque étape a un bouton concret vers l'action exacte à faire, pas
    // seulement la première : ouvrir l'onglet, déplier la carte des missions
    // (même onglet, juste en dessous), ou quitter le mode parents pour
    // retrouver l'écran où l'enfant coche vraiment ses missions.
    if (!e.fait && e.onglet) {
      const b = el("button", "mini-btn", e.bouton);
      b.onclick = () => changerOngletParent(e.onglet);
      li.querySelector(".pp-corps").appendChild(b);
    } else if (!e.fait && e.pli) {
      const b = el("button", "mini-btn", e.bouton);
      b.onclick = () => {
        plisParent.set(e.pli, true);
        rendre();
        const cible = document.getElementById("pli-" + e.pli);
        if (cible) cible.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      li.querySelector(".pp-corps").appendChild(b);
    } else if (!e.fait && e.sortir) {
      const b = el("button", "mini-btn", e.bouton);
      // quitterModeParents() seul ne fait que reverrouiller l'espace parents
      // — sur l'onglet Réglages, l'écran suivant restait celui du cadenas,
      // pas l'accueil de l'enfant que ce bouton promet.
      b.onclick = () => { etat.vue = "accueil"; quitterModeParents(); };
      li.querySelector(".pp-corps").appendChild(b);
    }
    liste.appendChild(li);
  });
  sec.appendChild(liste);
  const bTuto = el("button", "btn-secondaire", t("tuto.revoir"));
  bTuto.onclick = () => lancerTuto();
  sec.appendChild(bTuto);
  const bMasquer = el("button", "lien-oubli", t("pp.masquer"));
  bMasquer.onclick = () => {
    if (!etat.reglages) etat.reglages = {};
    etat.reglages.premiersPasVus = true;
    sauver(); rendre();
  };
  sec.appendChild(bMasquer);
  return sec;
}

/* ----- Le rendez-vous du soir : la voie agenda, en complément de la notification -----
 * « On n'y pense pas systématiquement » est la première raison d'abandon
 * donnée par les familles ; voir blocNotificationSoir ci-dessous pour la
 * réponse par défaut. Celle-ci reste offerte pour le parent qui préfère un
 * rendez-vous qui lui appartient, dans SON agenda, plutôt qu'un rappel
 * dépendant de l'application : il choisit son rythme et son heure, et c'est
 * son agenda qui le prévient.
 *
 * Conséquence assumée : nous ne saurons jamais s'il l'a fait ni s'il l'a
 * supprimé. C'est le prix d'un rappel qui n'appartient pas à l'application. */
function rituelReglage() {
  const r = (etat.reglages && etat.reglages.rituel) || null;
  if (!r || RITUEL_RYTHMES.indexOf(r.rythme) < 0 || !heureValide(r.heure)) return null;
  return r;
}

function blocRituelSoir() {
  const regle = rituelReglage();
  const sec = el("section", "carte rituel");
  // L'état se lit dans le titre : replié, ce bloc doit tout de même dire si
  // un rappel est réglé, sinon le parent le rouvre pour rien.
  const etatTxt = regle
    ? t("rituel.resume", { r: t("rituel.r_" + regle.rythme), h: regle.heure })
    : t("rituel.jamais");
  sec.innerHTML = `<h2>${t("rituel.titre")}<span class="rituel-etat">${echapper(etatTxt)}</span></h2>
    <p class="note">${t("rituel.intro")}</p>`;

  const conseillee = heureRituelConseillee();
  const choix = regle || { rythme: "quotidien", heure: conseillee };

  // Les deux champs tiennent sur une ligne : empilés, ils faisaient à eux
  // seuls un tiers de la hauteur de la carte pour deux réglages triviaux.
  const grille = el("div", "rituel-grille");

  const lR = el("label", "champ", t("rituel.rythme"));
  const sel = el("select");
  RITUEL_RYTHMES.forEach(r => {
    const o = el("option", "", t("rituel.r_" + r));
    o.value = r;
    if (r === choix.rythme) o.selected = true;
    sel.appendChild(o);
  });
  lR.appendChild(sel);
  grille.appendChild(lR);

  const lH = el("label", "champ", t("rituel.heure"));
  const inp = el("input");
  inp.type = "time";
  inp.value = choix.heure;
  lH.appendChild(inp);
  grille.appendChild(lH);
  sec.appendChild(grille);

  // Le conseil est une aide de champ, pas un paragraphe : il se rapporte à
  // l'heure et n'a pas à peser comme une phrase de plus.
  lH.appendChild(el("small", "champ-aide", t("rituel.conseil", { h: conseillee })));

  // Invisible tant qu'un seul agenda existe sur le téléphone (cas courant) :
  // rien à choisir, le sélecteur n'ajouterait qu'une ligne inutile.
  const zoneAgenda = el("div");
  sec.appendChild(zoneAgenda);
  (async () => {
    const cals = await calendriersDisponibles();
    if (cals.length < 2) return;
    const lA = el("label", "champ", t("rituel.agenda_label"));
    const selA = el("select");
    const actuel = calendrierChoisi();
    const oAuto = el("option", "", t("rituel.agenda_auto"));
    oAuto.value = "";
    if (!actuel) oAuto.selected = true;
    selA.appendChild(oAuto);
    cals.forEach(c => {
      const o = el("option", "", c.accountName ? (c.title + " — " + c.accountName) : c.title);
      o.value = c.id;
      if (c.id === actuel) o.selected = true;
      selA.appendChild(o);
    });
    selA.onchange = () => choisirCalendrier(selA.value || null);
    lA.appendChild(selA);
    zoneAgenda.appendChild(lA);
  })();

  const b = el("button", "gros-bouton planete", t("rituel.ajouter"));
  b.onclick = async () => {
    const rythme = sel.value, heure = inp.value;
    const ics = icsRituelSoir(rythme, heure, t("rituel.sujet"), t("rituel.corps"));
    if (!ics) { toast(t("rituel.echec"), "info"); return; }
    const champs = champsRituelSoir(rythme, heure, t("rituel.sujet"), t("rituel.corps"));
    // Réutiliser l'identifiant déjà connu : un changement de rythme ou
    // d'heure met à jour le MÊME événement plutôt que d'en accumuler un
    // nouveau à côté — un rappel qui se répète pour toujours, sans dedup,
    // finirait par en laisser tourner plusieurs en parallèle.
    if (champs && regle && regle.eventId) champs.idExistant = regle.eventId;
    const resultat = await envoyerVersAgenda(champs, ics, "famiteam-rendez-vous.ics", t("rituel.sujet"));
    if (!resultat) { toast(t("rituel.echec"), "info"); return; }
    // On mémorise le choix, pas le fait que l'agenda l'ait accepté : c'est
    // ce que le parent a demandé, et rien de plus.
    if (!etat.reglages) etat.reglages = {};
    etat.reglages.rituel = { rythme, heure };
    if (resultat.voie === "calendrier") etat.reglages.rituel.eventId = resultat.id;
    else if (regle && regle.eventId) etat.reglages.rituel.eventId = regle.eventId;
    sauver();
    toast(resultat.voie === "calendrier" ? t("rituel.ok_calendrier")
        : resultat.voie === "natif" ? t("rituel.ok_app") : t("rituel.ok"), "ok");
    rendre();
  };
  sec.appendChild(b);
  sec.appendChild(el("p", "note", t("rituel.note")));
  return sec;
}

// ----- Validations en attente (mission cochée par l'enfant, à confirmer) -----
function blocAttente(total) {
  const att = el("section", "carte");
  att.innerHTML = `<h2>${t("par.attente.titre", { n: total })}</h2>`;
  Object.values(etat.enfants).forEach(enf => {
    enf.enAttente.forEach((a, idx) => {
      const cat = CATEGORIES[a.cat];
      const ligne = el("div", "attente-ligne");
      ligne.innerHTML = `<span class="att-info"><strong>${echapper(enf.prenom)}</strong> — ${a.emoji || ""} ${trData("mission", a.missionId, a.titre)}
        <small>(${a.jour}) +${a.points} ${cat ? cat.monnaieEmoji : ""}</small></span>`;
      const ok = el("button", "mini-btn ok", "✅");
      ok.setAttribute("aria-label", t("a11y.valider"));
      ok.onclick = () => confirmerAttente(enf, idx);
      const non = el("button", "mini-btn non", "✖️");
      non.setAttribute("aria-label", t("a11y.refuser"));
      non.onclick = () => refuserAttente(enf, idx);
      ligne.appendChild(ok); ligne.appendChild(non);
      att.appendChild(ligne);
    });
  });
  return att;
}

// ----- Réglages du programme (validation parentale, code PIN, humour…) -----
function blocProgramme() {
  const prog = el("section", "carte");
  prog.innerHTML = `<h2>${t("par.prog.titre")}</h2>`;
  const lVal = el("label", "switch-ligne");
  const iVal = el("input"); iVal.type = "checkbox"; iVal.checked = etat.reglages.validationParentale;
  iVal.onchange = () => majSansSaut(() => basculerValidationParentale(iVal.checked));
  lVal.appendChild(iVal);
  lVal.appendChild(el("span", null, t("par.prog.validation")));
  prog.appendChild(lVal);
  prog.appendChild(el("p", "reglage-aide", t("aide.validation")));
  const bCp = el("button", "btn-secondaire", etat.reglages.codeParent ? t("par.prog.changer_pin") : t("par.prog.definir_pin"));
  bCp.onclick = definirCodeParent;
  prog.appendChild(bCp);
  prog.appendChild(el("p", "reglage-aide", t("aide.pin")));
  if (!etat.reglages.codeParent)
    prog.appendChild(el("p", "note", t("par.prog.astuce_pin")));
  // Seuil d'affichage imagé (sans chiffres) — réglage avancé (mode expert).
  if (estModeExpert()) {
    const lSeuil = el("label", "champ", t("par.prog.seuil_visuel"));
    const iSeuil = el("input");
    iSeuil.type = "number"; iSeuil.min = "0"; iSeuil.max = "12"; iSeuil.inputMode = "numeric";
    iSeuil.value = (typeof etat.reglages.seuilVisuel === "number") ? etat.reglages.seuilVisuel : 5;
    iSeuil.onchange = () => {
      const v = Math.max(0, Math.min(12, parseInt(iSeuil.value, 10) || 0));
      etat.reglages.seuilVisuel = v; iSeuil.value = v; sauver(); rendre();
    };
    lSeuil.appendChild(iSeuil);
    prog.appendChild(lSeuil);
    prog.appendChild(el("p", "reglage-aide", t("aide.seuil")));
  }
  // Interrupteur : touches d'humour bon enfant (blagues, taquineries…).
  const lHum = el("label", "switch-ligne");
  const iHum = el("input"); iHum.type = "checkbox";
  iHum.checked = !(etat.reglages && etat.reglages.humour === false);
  iHum.onchange = () => majSansSaut(() => { etat.reglages.humour = iHum.checked; sauver(); rendre(); });
  lHum.appendChild(iHum);
  lHum.appendChild(el("span", null, t("par.prog.humour")));
  prog.appendChild(lHum);
  prog.appendChild(el("p", "reglage-aide", t("aide.humour")));
  // Revoir le tutoriel d'accueil.
  const bTuto = el("button", "btn-secondaire", t("tuto.revoir"));
  bTuto.onclick = () => lancerTuto();
  prog.appendChild(bTuto);
  return prog;
}

// ----- Choix Standard / Expert : toggle compact, à côté du titre « Mode
// parents » — plus de carte séparée à chercher dans l'onglet Réglages. -----
function toggleModeParents() {
  const exp = estModeExpert();
  const wrap = el("div", "segmente mode-toggle-mini");
  const bStd = el("button", "seg" + (!exp ? " actif" : ""), `🌿 ${t("mode.standard")}`);
  bStd.type = "button";
  bStd.onclick = () => { if (exp) majSansSaut(() => definirModeExpert(false)); };
  const bExp = el("button", "seg" + (exp ? " actif" : ""), `🧪 ${t("mode.expert")}`);
  bExp.type = "button";
  bExp.onclick = () => { if (!exp) majSansSaut(() => definirModeExpert(true)); };
  wrap.appendChild(bStd); wrap.appendChild(bExp);
  return wrap;
}

// ----- Famille, invitations, parrainage, abonnement -----
// `c` = conteneur d'accueil (l'onglet lui-même, ou le corps d'un dépliant).
function sectionsFamille(c) {
  if (typeof modeDemo !== "undefined" && modeDemo) { c.appendChild(bandeauDemo()); return; }

  // Trois cartes distinctes, dans l'ordre où on s'en sert : faire connaître
  // l'app à d'autres familles (l'Arbre) vient en premier, puis inviter l'autre
  // parent, puis le nom de la famille — geste identitaire et rare. Les deux
  // dernières sont repliées : on ne les ouvre qu'en de rares occasions.
  const fam = el("section", "carte");
  fam.innerHTML = `<h2>${t("fam.titre")}</h2>
    <p>${t("fam.label", { nom: familleActive ? echapper(familleActive.name) : "—" })}</p>`;
  const bSwitch = el("button", "btn-secondaire", t("fam.changer"));
  bSwitch.onclick = changerFamille;
  fam.appendChild(bSwitch);

  const invit = el("section", "carte");
  invit.innerHTML = `<h2>${t("fam.inv_titre")}</h2>
    <p class="note">${t("fam.note")}</p>`;
  const bInvite = el("button", "btn-secondaire", t("fam.creer_invitation"));
  bInvite.onclick = async () => {
    bInvite.disabled = true; bInvite.textContent = t("common.creation");
    const lien = await creerInvitation();
    bInvite.disabled = false; bInvite.textContent = t("fam.creer_invitation");
    // La carte étant repliable, le lien doit atterrir DANS le pli — sinon il
    // s'afficherait sous un titre fermé, donc nulle part de compréhensible.
    if (lien) montrerLienInvitation(invit.querySelector(".carte-pli-c") || invit, lien);
  };
  invit.appendChild(bInvite);

  // ----- L'Arbre des familles : le code permanent de la famille -----
  // Un seul code, affiché en clair, avec son QR : rien à créer, rien à
  // renouveler. C'est le geste le plus court possible pour offrir l'app.
  const par = el("section", "carte");
  par.innerHTML = `<h2>${t("arbre.titre")}</h2>
    <p class="arbre-explication">${t("arbre.explication", { app: APP_NOM })}</p>
    <div id="par-bilan" class="arbre-bilan"></div>
    <p class="note">${t("arbre.modale_note")}</p>
    <div id="par-code" class="arbre-code-bloc"><p class="note">${t("arbre.attente")}</p></div>
    <div id="par-jauge" class="arbre-jauge-bloc"></div>`;
  c.appendChild(carteRepliable(par, "fam-arbre", false));
  c.appendChild(carteRepliable(invit, "fam-invitations", false));
  c.appendChild(carteRepliable(fam, "fam-nom", false));

  // Bilan : ce que la famille a semé, et son palier. Jamais un rang, jamais un
  // écart avec les autres familles — seulement l'écart avec son PROPRE palier
  // suivant (PLAN-PARRAINAGE § 1.1).
  const zoneBilan = par.querySelector("#par-bilan");
  parrainageBilan().then(b => {
    if (!b) { zoneBilan.remove(); return; }
    const inst = b.installees || 0, inv = b.invitees || 0;
    const rang = arbrePalier(inst);
    const suivant = arbrePalierSuivant(inst);
    const palierP = ARBRE_PALIERS.find(p => p.rang === rang);
    const titre = rang
      ? `<p class="arbre-palier"><span class="arbre-palier-emoji">${palierP.emoji}</span>
           <span>${t("arbre.palier_atteint", { nom: t("arbre.p" + rang) })}</span></p>`
      : `<p class="arbre-palier arbre-palier-vide"><span class="arbre-palier-emoji">🌱</span>
           <span>${t("arbre.palier_aucun")}</span></p>`;
    // « Arrivées » et « vivantes » sont distinguées : un filleul ne compte
    // qu'une fois sa famille vivante (trois jours d'ouverture).
    const compte = inv > inst
      ? t("arbre.compte_detail", { arrivees: inv, vivantes: inst })
      : t("arbre.compte", { n: inst });
    const reste = suivant
      ? `<p class="arbre-reste">${t("arbre.manque", { n: Math.max(suivant.seuil - inst, 0), emoji: suivant.emoji, nom: t("arbre.p" + suivant.rang) })}</p>`
      : `<p class="arbre-reste">${t("arbre.tout_atteint")}</p>`;
    zoneBilan.innerHTML = arbreSvgFamilles(inst, { classe: "arbre-dessin-parent", alt: compte }) +
      `<div class="arbre-bilan-texte">${titre}<p class="note">${compte}</p>${reste}</div>`;
  }).catch(() => zoneBilan.remove());

  // Jauge collective : la croissance devient une quête commune plutôt qu'un
  // affrontement. Le jalon (25, 50, 100…) n'est PAS le plafond de familles.
  const zoneJauge = par.querySelector("#par-jauge");
  parrainageJauge().then(j => {
    if (!j || !j.jalon) { zoneJauge.remove(); return; }
    const part = Math.max(0, Math.min(100, Math.round((j.familles / j.jalon) * 100)));
    zoneJauge.innerHTML = `<p class="arbre-jauge-titre">${t("arbre.ensemble", { n: j.familles, jalon: j.jalon })}</p>
      <div class="arbre-jauge"><div class="arbre-jauge-rempl" style="width:${part}%"></div></div>
      <p class="note">${t("arbre.ensemble_note")}</p>`;
  }).catch(() => zoneJauge.remove());
  const blocCodePar = par.querySelector("#par-code");
  const afficherCodePar = (code) => {
    if (!code) { blocCodePar.innerHTML = `<p class="note">${t("arbre.indispo")}</p>`; return; }
    const lien = lienDepuisCode(code);
    const qr = (typeof qrSvg === "function") ? qrSvg(lien, { classe: "arbre-qr", titre: code }) : null;
    blocCodePar.innerHTML =
      `<p class="arbre-code-label">${t("arbre.code_label")}</p>
       <p class="arbre-code">${echapper(code)}</p>
       ${qr ? `<div class="arbre-qr-cadre">${qr}</div><p class="note">${t("arbre.qr_note")}</p>` : ""}`;
    montrerLienInvitation(blocCodePar, lien, t("arbre.partage"), {
      sujet: t("parr.sujet", { app: APP_NOM }),
      corps: t("parr.corps", { app: APP_NOM, lien: "{lien}" })
    });
    const bRegen = el("button", "lien-oubli", t("arbre.regenerer"));
    bRegen.onclick = async () => {
      if (!confirm(t("arbre.regenerer_conf"))) return;
      const nouveau = await regenererCodeParrainage();
      if (nouveau) { afficherCodePar(nouveau); toast(t("arbre.regenere"), "succes"); }
    };
    blocCodePar.appendChild(bRegen);
  };
  codeParrainage().then(afficherCodePar);

  // La carte d'ami : à imprimer pour l'enfant actif. C'est le parent qui
  // imprime, l'enfant qui colorie et qui donne.
  const enfCarte = enfantActif();
  if (enfCarte) {
    const bCarte = el("button", "btn-secondaire", "🖨️ " + t("cami.bouton", { prenom: echapper(enfCarte.prenom || "") }));
    bCarte.onclick = () => modaleCarteAmi(enfCarte);
    par.appendChild(bCarte);
  }

  // ----- Abonnement (masqué provisoirement : early adopters = gratuit) -----
  if (AFFICHER_ABONNEMENT) {
    const abo = el("section", "carte");
    abo.innerHTML = `<h2>${t("abo.titre")}</h2>
      <p>${t("abo.offre", { plan: planLibelle() })}</p>
      <p class="note">${t("abo.note")}</p>`;
    const bAbo = el("button", "btn-secondaire", t("abo.gerer"));
    bAbo.disabled = true;
    abo.appendChild(bAbo);
    c.appendChild(abo);
  }
}

// ----- Compte, données, récupération, suppression -----
// Toutes les cartes démarrent repliées : Réglages n'affiche que des titres
// tant qu'on n'a pas cliqué, et « Se déconnecter » vit tout en bas, dernier
// geste de l'onglet plutôt que noyé en tête de « Mon compte ».
function sectionsCompte(c) {
  if (typeof modeDemo !== "undefined" && modeDemo) {
    c.appendChild(bandeauDemo());
    return;
  }

  const cpt = el("section", "carte");
  const u = typeof utilisateurCourant === "function" ? utilisateurCourant() : null;
  cpt.innerHTML = `<h2>${t("compte.titre")}</h2>
    <p>${t("compte.connecte", { email: u ? echapper(u.email) : "—" })}</p>`;
  const liensLegaux = el("p", "note");
  liensLegaux.innerHTML = `<a href="faq.html">Questions fréquentes</a> ·
    <a href="mentions-legales.html">Mentions légales</a> ·
    <a href="confidentialite.html">Politique de confidentialité</a>`;
  cpt.appendChild(liensLegaux);
  c.appendChild(carteRepliable(cpt, "cpt-compte", false));

  const actions = el("section", "carte");
  actions.innerHTML = `<h2>${t("donnees.titre")}</h2>`;
  const bExp = el("button", "btn-secondaire", t("donnees.exporter"));
  bExp.onclick = exporter;
  const bRaz = el("button", "btn-danger", t("donnees.reset"));
  bRaz.onclick = reinitialiser;
  actions.appendChild(bExp);
  actions.appendChild(bRaz);
  c.appendChild(carteRepliable(actions, "cpt-donnees", false));

  // ----- 💾 Récupération de données -----
  c.appendChild(carteRepliable(blocRecuperation(), "cpt-recup", false));

  // ----- ⚠️ Zone de danger : suppression du compte famille (propriétaire) -----
  if (familleActive && familleActive.role === "owner") {
    const danger = el("section", "carte zone-danger");
    danger.innerHTML = `<h2>${t("suppr.zone_titre")}</h2>
      <p class="suppr-avert">${t("suppr.avert")}</p>`;
    const bDel = el("button", "btn-danger", t("suppr.bouton"));
    bDel.onclick = () => supprimerCompteFamille();
    danger.appendChild(bDel);
    c.appendChild(carteRepliable(danger, "cpt-danger", false));
  }

  // ----- Se déconnecter : dernier geste de l'onglet Réglages. -----
  const bDeco = el("button", "btn-secondaire deconnexion-pied", t("compte.deconnexion"));
  bDeco.onclick = deconnexion;
  c.appendChild(bDeco);
}

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
