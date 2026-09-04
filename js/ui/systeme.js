/* =====================================================================
 * FamiTeam — Impression PDF, agenda du téléphone, notification du soir
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * Les ponts vers le système : chargement à la demande des bibliothèques
 * d'impression (jsPDF/html2canvas), fabrication d'un PDF, écriture dans
 * l'agenda du téléphone et programmation de la notification du soir.
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

/* ---------- Impression → PDF (app installée) ----------
 * window.print() et window.open() se comportent mal dans la WebView Android
 * (voir imprimerCible et imprimerFeuilleSemaine plus bas) : l'un ne fait
 * rien, l'autre a fini par bloquer l'app entière. Dans l'app, on construit
 * donc un vrai fichier PDF côté client, puis on le confie au même mécanisme
 * déjà éprouvé pour l'agenda (écriture + ouverture/partage natif).
 *
 * jsPDF + html2canvas ne sont chargés qu'à cet instant précis (~600 Ko à eux
 * deux) : la plupart des familles n'impriment jamais, les charger au
 * démarrage pénaliserait tout le monde pour un usage rare. Vendorisés
 * (js/vendor/), jamais un CDN — même raison que pour Supabase : le
 * hors-ligne ne doit dépendre d'aucun serveur tiers.
 */
let _libsImpressionPromesse = null;
function chargerScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(); s.onerror = () => reject(new Error("échec de chargement : " + src));
    document.head.appendChild(s);
  });
}
function chargerLibsImpression() {
  if (window.jspdf && window.html2canvas) return Promise.resolve();
  if (!_libsImpressionPromesse) {
    // Les deux fois : un échec ne doit pas laisser la promesse « grillée »
    // en mémoire pour le reste de la session — retenter doit rester possible.
    _libsImpressionPromesse = Promise.all([
      chargerScript("js/vendor/html2canvas.js?v=159"),
      chargerScript("js/vendor/jspdf.js?v=159")
    ]).catch(e => { _libsImpressionPromesse = null; throw e; });
  }
  return _libsImpressionPromesse;
}

// Rend un élément DÉJÀ DANS LE DOM (visible ou non) en PDF A4 portrait,
// réparti sur plusieurs pages si le contenu dépasse une page. Renvoie un Blob.
//
// html2canvas aplatit tout en une seule image : il ignore complètement les
// sauts de page CSS (`.enfant + .enfant{break-before:page}` de
// htmlFeuilleSemaine, pensés pour l'impression NAVIGATEUR — inutilisable
// dans la WebView, voir imprimerFeuilleSemaine). Un simple découpage par
// hauteur de page fixe, sans égard au contenu, coupait donc les cartes
// n'importe où, à cheval sur deux enfants. Quand l'élément contient
// plusieurs `.enfant`, chacun est donc rendu À PART (tête et pied masqués
// sauf sur le premier / dernier), chacun sur ses propres pages — jamais
// partagées avec le suivant.
async function pdfDepuisElement(element) {
  await chargerLibsImpression();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();

  const ajouterCanvas = (canvas, nouvellePage) => {
    const imgW = pageW, imgH = (canvas.height * imgW) / canvas.width;
    const donnees = canvas.toDataURL("image/jpeg", 0.92);
    if (nouvellePage) pdf.addPage();
    pdf.addImage(donnees, "JPEG", 0, 0, imgW, imgH);
    // Un seul enfant trop long pour une page se poursuit sur ses propres
    // pages, redécoupé par décalage négatif — jamais mêlé au suivant.
    for (let y = pageH; y < imgH; y += pageH) {
      pdf.addPage();
      pdf.addImage(donnees, "JPEG", 0, -y, imgW, imgH);
    }
  };

  const enfants = element.querySelectorAll ? Array.from(element.querySelectorAll(".enfant")) : [];
  if (enfants.length < 2) {
    // Rien à répartir : un seul bloc (carte d'ami, dépliant — ou, déjà
    // élargi par elementDepuisHtml, la feuille papier).
    //
    // Signalé (capture à l'appui) : sur un téléphone étroit, la carte d'ami
    // (QR + texte destiné aux parents, en ligne) repliait ce duo en colonne
    // faute de place — doublant la hauteur de la carte, assez pour déborder
    // sur une deuxième page, en pleine coupure du QR. Vérifié : à 260px de
    // large (téléphone compact), la carte capturée telle quelle atteint 546px
    // de haut (ratio 2,1) ; largeur d'une page A4 x ce ratio = 441mm, quand
    // la page ne fait que 297mm. Le rendu à l'écran dépend donc du téléphone
    // qui imprime — jamais souhaitable pour un PDF. On capture un CLONE hors
    // écran à largeur fixe (794px, même convention que elementDepuisHtml :
    // un A4 à 96 dpi), où ce duo tient toujours côte à côte.
    const large = document.createElement("div");
    large.style.cssText = "position:fixed; left:-9999px; top:0; width:794px";
    large.appendChild(element.cloneNode(true));
    document.body.appendChild(large);
    try {
      ajouterCanvas(await window.html2canvas(large, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }), false);
    } finally {
      large.remove();
    }
    return pdf.output("blob");
  }

  const tete = element.querySelector(".tete"), intro = element.querySelector(".intro"),
        pied = element.querySelector(".pied");
  const masquer = (n) => { const av = n.style.display; n.style.display = "none"; return av; };

  for (let i = 0; i < enfants.length; i++) {
    const dernier = i === enfants.length - 1;
    const avTete = (i !== 0 && tete) ? masquer(tete) : null;
    const avIntro = (i !== 0 && intro) ? masquer(intro) : null;
    const avPied = (!dernier && pied) ? masquer(pied) : null;
    const avEnfants = enfants.map((e, j) => (j !== i) ? masquer(e) : null);
    try {
      ajouterCanvas(await window.html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }), i > 0);
    } finally {
      if (i !== 0 && tete) tete.style.display = avTete;
      if (i !== 0 && intro) intro.style.display = avIntro;
      if (!dernier && pied) pied.style.display = avPied;
      enfants.forEach((e, j) => { if (j !== i) e.style.display = avEnfants[j]; });
    }
  }
  return pdf.output("blob");
}

// Construit un <div> hors écran, DANS LE DOCUMENT PRINCIPAL, à partir d'un
// document HTML autonome (voir htmlFeuilleSemaine) : évite de dupliquer les
// styles pour l'écran et pour le PDF — le même HTML sert aux deux, ouvert en
// fenêtre sur le web, rendu ici pour l'app installée.
//
// PAS d'iframe : essayé d'abord, html2canvas échoue systématiquement dès que
// la cible vit dans une iframe — même un fragment minimal, sans rapport avec
// le contenu réel — en levant « Error parsing CSS component value, unexpected
// EOF » (vérifié en conditions réelles avant d'écrire ce commentaire). Sur le
// document principal, le même contenu se rend sans encombre.
function elementDepuisHtml(html) {
  const conteneur = document.createElement("div");
  // Largeur d'un A4 à 96 dpi (210 mm) : la mise en page (grille, tableaux)
  // se calcule alors comme sur l'aperçu d'impression du navigateur.
  conteneur.style.cssText = "position:fixed; left:-9999px; top:0; width:794px";
  const style = /<style>([\s\S]*?)<\/style>/.exec(html);
  const corps = /<body>([\s\S]*?)<\/body>/.exec(html);
  if (style) {
    const s = document.createElement("style");
    s.textContent = style[1];
    conteneur.appendChild(s);
  }
  const contenu = document.createElement("div");
  contenu.innerHTML = corps ? corps[1] : html;
  conteneur.appendChild(contenu);
  document.body.appendChild(conteneur);
  return conteneur;
}

// Génère le PDF, l'envoie (écriture + partage natif) et retire le conteneur
// dans tous les cas — un échec ne doit pas laisser un bloc invisible traîner.
async function pdfDepuisHtmlEtEnvoyer(html, nomFichier, titre) {
  const conteneur = elementDepuisHtml(html);
  try {
    const blob = await pdfDepuisElement(conteneur);
    return await enregistrerOuPartager(blob, nomFichier, titre);
  } finally {
    conteneur.remove();
  }
}

/* ---------- Écriture directe dans le calendrier du système ----------
 * Le fichier .ics ci-dessus reste le repli, mais s'est révélé peu fiable :
 * Google Agenda refuse d'importer un .ics reçu par un intent de fichier
 * (constaté sur un Samsung Galaxy — Outlook, lui, l'accepte). Cette voie
 * écrit directement dans le magasin de calendrier du système (CalendarContract
 * sur Android, EventKit sur iOS via le greffon) — le même mécanisme
 * qu'utilisent Facebook ou Eventbrite pour leurs boutons « Ajouter à mon
 * agenda ». Toute application synchronisée avec ce magasin voit l'événement,
 * Google Agenda compris, sans dépendre de sa capacité à lire un fichier.
 *
 * Contrepartie : une autorisation système, demandée une fois. Sur iOS,
 * écriture seule (FamiTeam ne lit jamais le calendrier existant) — le
 * système sait y créer un événement sans accès en lecture. Sur Android en
 * revanche, CapacitorCalendar.createEvent() doit interroger la table des
 * agendas (CalendarContract.Calendars) pour trouver celui par défaut, une
 * LECTURE que WRITE_CALENDAR seul n'autorise pas : sans READ_CALENDAR en
 * plus, la création échouerait silencieusement à chaque fois. D'où la
 * demande complète sur Android uniquement. Si le parent refuse, ou si le
 * greffon est absent (app trop ancienne), la fonction rend la main sans
 * rien faire : c'est à l'appelant de retomber sur le fichier.
 */
// Le seul constat « déjà accordée », sans jamais rien demander — réutilisé
// par permissionCalendrierEcriture (qui peut demander) et calendriersDisponibles
// (qui ne doit jamais le faire : lister les agendas n'est pas un geste assez
// explicite pour justifier une boîte de dialogue système).
async function permissionCalendrierDejaAcquise(cal, android) {
  try {
    if (android) {
      const deja = await cal.checkAllPermissions();
      return !!(deja && deja.result
        && deja.result.readCalendar === "granted" && deja.result.writeCalendar === "granted");
    }
    const deja = await cal.checkPermission({ scope: "writeCalendar" });
    return !!(deja && deja.result === "granted");
  } catch (e) { return false; }
}

async function permissionCalendrierEcriture() {
  const cal = greffonNatif("CapacitorCalendar");
  if (!cal) return false;
  const android = window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === "android";
  if (await permissionCalendrierDejaAcquise(cal, android)) return true;
  try {
    if (android) {
      const demande = await cal.requestFullCalendarAccess();
      return !!(demande && demande.result === "granted");
    }
    const demande = await cal.requestWriteOnlyCalendarAccess();
    return !!(demande && demande.result === "granted");
  } catch (e) { return false; }
}

// Sur un téléphone à plusieurs comptes (Gmail, Outlook/Exchange, Samsung…),
// l'agenda que le système choisit tout seul (le premier marqué « principal »)
// n'est pas forcément celui que le parent regarde — constaté : un rendez-vous
// atterri dans un agenda jamais consulté, alors que le parent vit dans
// Outlook. `calendrierChoisi` (ci-dessous) laisse le parent trancher.
// C'est un identifiant du SYSTÈME sur CET appareil : il ne veut rien dire sur
// un autre téléphone, donc stocké en localStorage, jamais dans etat.reglages.
const CALENDRIER_CHOISI_CLE = "famiteam_calendrier_id";

function calendrierChoisi() {
  try { return localStorage.getItem(CALENDRIER_CHOISI_CLE) || null; } catch (e) { return null; }
}
function choisirCalendrier(id) {
  try {
    if (id) localStorage.setItem(CALENDRIER_CHOISI_CLE, id);
    else localStorage.removeItem(CALENDRIER_CHOISI_CLE);
  } catch (e) { /* pas grave : le choix se refait, il ne bloque rien */ }
}

// Liste les agendas du téléphone pour le sélecteur de blocRituelSoir. Ne
// demande JAMAIS la permission : une simple liste ne vaut pas une boîte de
// dialogue système. Tant que le parent n'a pas encore utilisé le bouton
// « Ajouter à mon agenda » au moins une fois (permission pas encore acquise),
// la liste est vide et aucun sélecteur ne s'affiche — comportement inchangé.
async function calendriersDisponibles() {
  const cal = greffonNatif("CapacitorCalendar");
  if (!cal) return [];
  const android = window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === "android";
  if (!(await permissionCalendrierDejaAcquise(cal, android))) return [];
  try {
    const r = await cal.listCalendars();
    return (r && Array.isArray(r.result)) ? r.result : [];
  } catch (e) { return []; }
}

/* options : { titre, texte, debutMs, finMs, alarmes?, recurrence?, idExistant? }
 * Renvoie l'identifiant de l'événement (à conserver pour une future mise à
 * jour), ou null si cette voie n'a pas abouti — jamais une erreur bruyante :
 * l'appelant retombe alors sur le fichier .ics sans que le parent le sache. */
async function ecrireEvenementCalendrier(options) {
  const cal = greffonNatif("CapacitorCalendar");
  if (!cal || !(await permissionCalendrierEcriture())) return null;
  const champs = {
    title: options.titre,
    description: options.texte || "",
    startDate: options.debutMs,
    endDate: options.finMs,
    availability: 1   // EventAvailability.FREE : ne rend pas le parent indisponible
  };
  const idCal = calendrierChoisi();
  if (idCal) champs.calendarId = idCal;   // sinon : choix automatique du système
  if (Array.isArray(options.alarmes)) champs.alerts = options.alarmes;
  if (options.recurrence) champs.recurrence = options.recurrence;
  try {
    if (options.idExistant) { await cal.modifyEvent({ id: options.idExistant, ...champs }); return options.idExistant; }
    const cree = await cal.createEvent(champs);
    return (cree && cree.id) || null;
  } catch (e) {
    // L'identifiant mémorisé ne correspond peut-être plus à rien (événement
    // supprimé à la main dans le calendrier) : une création neuve avant
    // d'abandonner cette voie, plutôt que de renoncer sur un id périmé.
    if (!options.idExistant) return null;
    try { const cree = await cal.createEvent(champs); return (cree && cree.id) || null; }
    catch (e2) { return null; }
  }
}

/* Point d'entrée unique des deux boutons « agenda ». `champsCalendrier` (ou
 * null si l'appelant n'a pas de version « à plat » pour ce cas — un
 * rendez-vous journée entière, par exemple) tente d'abord l'écriture directe.
 * Renvoie :
 *   { voie: "calendrier", id }  — écrit directement, id à conserver
 *   { voie: "natif" }           — l'agenda (ou le partage) s'est ouvert
 *   { voie: "fichier" }         — un fichier a été proposé au téléchargement
 *   null                        — rien n'est parti, et il faut le dire
 * Dans l'app, on ne retombe PAS sur le téléchargement en cas d'échec total :
 * il ne ferait rien de visible, et un faux succès est pire qu'une erreur. */
async function envoyerVersAgenda(champsCalendrier, ics, nomFichier, titre) {
  if (champsCalendrier) {
    const id = await ecrireEvenementCalendrier(champsCalendrier);
    if (id) return { voie: "calendrier", id };
  }
  if (greffonNatif("Filesystem")) {
    try {
      const r = await ouvrirIcsNatif(ics, nomFichier, titre);
      if (r) return { voie: r };
    } catch (e) { /* on tente encore le téléchargement classique */ }
    return null;
  }
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  return telechargerBlob(blob, nomFichier) ? { voie: "fichier" } : null;
}

/* ---------- Rappel du soir : notification locale ----------
 * Longtemps, FamiTeam n'a jamais notifié — nos repères neurologiques
 * l'excluaient (SCIENCE_DEFAUT.neurologie). Contrepartie assumée : le rappel
 * ne dépendait que de l'agenda du parent (ci-dessus), ou de sa mémoire.
 * Trop de familles n'y pensaient tout simplement jamais.
 *
 * FamiTeam propose donc désormais UN rappel, une fois par jour, à l'heure
 * conseillée — un bouton suffit à l'activer, aussi facilement qu'à l'éteindre
 * ensuite. Ce n'est ni une boucle addictive ni un score : pas de son
 * insistant, pas de badge qui donne envie de rouvrir l'app, un seul message
 * calme par jour. L'esprit du repère neurologique (éviter la sollicitation
 * permanente) est tenu ; sa lettre (aucune notification, jamais) ne l'est
 * plus. */
let _notifSoirSyncFaite = false;   // voir vueReglages : jamais avant le déverrouillage parent
const NOTIF_SOIR_ID = 4171;        // identifiant stable : reprogrammer réutilise le même, sans doublon

function notifReglage() {
  const r = etat.reglages && etat.reglages.notifSoir;
  if (r && typeof r.active === "boolean" && heureValide(r.heure)) return r;
  return null;   // rien de choisi encore : voir blocNotificationSoir pour l'état recommandé affiché
}

async function permissionNotification() {
  const notif = greffonNatif("LocalNotifications");
  if (!notif) return false;
  try {
    const deja = await notif.checkPermissions();
    if (deja && deja.display === "granted") return true;
    const demande = await notif.requestPermissions();
    return !!(demande && demande.display === "granted");
  } catch (e) { return false; }
}

async function annulerNotificationSoir() {
  const notif = greffonNatif("LocalNotifications");
  if (!notif) return;
  try { await notif.cancel({ notifications: [{ id: NOTIF_SOIR_ID }] }); } catch (e) { /* pas grave */ }
}

// Programme le rappel quotidien. `on: {hour, minute}` (sans jour ni mois) se
// répète chaque jour à cette heure LOCALE — même logique « flottante » que
// icsRituelSoir, donc rien à recalculer au changement d'heure d'été/hiver.
// isExactNotification:false : quelques minutes de dérive sont sans
// conséquence ici, et cela évite d'exiger la permission « alarmes exactes »
// pour un simple rappel de famille.
async function programmerNotificationSoir(heure) {
  const notif = greffonNatif("LocalNotifications");
  if (!notif || !heureValide(heure)) return false;
  const h = /^(\d{1,2}):(\d{2})$/.exec(heure);
  try {
    await notif.schedule({
      notifications: [{
        id: NOTIF_SOIR_ID,
        title: t("notif.titre_push"),
        body: t("notif.corps_push"),
        schedule: { on: { hour: parseInt(h[1], 10), minute: parseInt(h[2], 10) }, allowWhileIdle: true },
        isExactNotification: false
      }]
    });
    return true;
  } catch (e) { return false; }
}

// Applique le réglage courant au système. `interactif` distingue deux
// contextes bien différents :
//  - true  : le parent vient d'appuyer sur le bouton de la carte — un geste
//            explicite et isolé, où une éventuelle boîte de dialogue système
//            (permission) est attendue et sans risque d'interférer avec un
//            autre bouton.
//  - false : appel passif au chargement de l'écran (voir vueReglages), pour
//            rattraper un réglage déjà enregistré — permission entre-temps
//            révoquée dans les réglages du téléphone, app mise à jour, etc.
//            AUCUNE boîte de dialogue système n'y est jamais déclenchée : un
//            parent a rapporté qu'une notification système apparue à ce
//            moment avait fait basculer, par un appui qui ne lui était pas
//            destiné, le bouton d'agenda voisin. On se contente donc ici de
//            reprogrammer si la permission est déjà acquise, sans jamais la
//            redemander.
async function synchroniserNotificationSoir(interactif) {
  const notif = greffonNatif("LocalNotifications");
  if (!notif) return false;
  const r = notifReglage();
  if (!r) return false;   // rien de choisi : on n'agit pas tant que le parent n'a pas tranché
  if (!r.active) { await annulerNotificationSoir(); return true; }
  if (!interactif) {
    try {
      const deja = await notif.checkPermissions();
      if (!(deja && deja.display === "granted")) return false;
    } catch (e) { return false; }
    return await programmerNotificationSoir(r.heure);
  }
  if (!(await permissionNotification())) return false;
  return await programmerNotificationSoir(r.heure);
}

// La permission système ne doit apparaître qu'en réponse à un appui explicite
// et isolé sur LE bouton de cette carte — jamais en silence à l'ouverture de
// l'écran (voir synchroniserNotificationSoir). Le réglage « recommandé » est
// donc pré-rempli et la case pré-cochée, mais rien ne se programme tant que
// le parent n'a pas lui-même appuyé sur « Activer » : même geste que la
// carte agenda ci-dessous, jamais d'action automatique au premier rendu.
function blocNotificationSoir() {
  // Réservé à l'app installée : sur le site web, aucun greffon de
  // notification locale n'existe, et une carte interactive qui ne déclenche
  // jamais rien serait trompeuse (le parent croirait le rappel actif).
  if (typeof estAppNative !== "function" || !estAppNative()) return null;
  const r = notifReglage();
  const choix = r || { active: true, heure: heureRituelConseillee() };
  const sec = el("section", "carte notif-soir");
  const etatTxt = (r && r.active) ? t("notif.resume", { h: r.heure }) : t("notif.jamais");
  sec.innerHTML = `<h2>${t("notif.titre")}<span class="rituel-etat">${echapper(etatTxt)}</span></h2>
    <p class="note">${t("notif.intro")}</p>`;

  const lActive = el("label", "switch-ligne");
  const caseActive = el("input");
  caseActive.type = "checkbox";
  caseActive.checked = choix.active;
  lActive.appendChild(caseActive);
  lActive.appendChild(el("span", null, t("notif.activer")));
  sec.appendChild(lActive);

  const grille = el("div", "rituel-grille");
  const lH = el("label", "champ", t("notif.heure"));
  const inpH = el("input");
  inpH.type = "time";
  inpH.value = choix.heure;
  lH.appendChild(inpH);
  grille.appendChild(lH);
  sec.appendChild(grille);

  const b = el("button", "gros-bouton planete", "");
  const majLibelleBouton = () => { b.textContent = caseActive.checked ? t("notif.appliquer") : t("notif.desactiver"); };
  majLibelleBouton();
  caseActive.addEventListener("change", majLibelleBouton);
  b.onclick = async () => {
    const active = caseActive.checked, heure = inpH.value;
    if (active && !heureValide(heure)) { toast(t("rituel.echec"), "info"); return; }
    if (!etat.reglages) etat.reglages = {};
    etat.reglages.notifSoir = { active, heure };
    sauver();
    const ok = await synchroniserNotificationSoir(true);   // interactif : le parent vient d'appuyer ici même
    toast(!active ? t("notif.off") : ok ? t("notif.ok") : t("notif.refuse"), ok || !active ? "ok" : "info");
    majSansSaut(rendre);
  };
  sec.appendChild(b);

  sec.appendChild(el("p", "note", t("notif.note")));
  return sec;
}
