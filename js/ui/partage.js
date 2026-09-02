/* =====================================================================
 * FamiTeam — Interface : Sortir un fichier de l'application
 * ---------------------------------------------------------------------
 * Téléchargement d'un blob, pont natif Capacitor (Filesystem, Share),
 * fabrication d'un PDF à la demande, et écriture d'un rendez-vous dans
 * l'agenda du système. Un même geste n'a pas le même chemin sur le web
 * et dans l'app installée : c'est ici que la différence est absorbée,
 * une fois pour toutes, pour tous les appelants.
 *
 * Module de l'interface (ARCHITECTURE.md, phase C). Script classique,
 * comme tous les autres : les fonctions restent globales et s'appellent
 * entre modules sans import. L'ordre des balises dans index.html n'a
 * donc aucune conséquence — rien ne s'exécute au chargement.
 * ===================================================================== */
// Téléchargement d'un blob : utilisé par l'image de la carte et par le .ics.
// Dans l'app installée, la WebView Android ignore l'attribut `download` SANS
// lever d'erreur : `a.click()` ne fait rien et cette fonction renvoyait
// pourtant `true`. Tous ses appelants croyaient donc avoir réussi, et le
// parent voyait un bouton sans effet. On refuse ici, franchement, pour que
// l'appelant prenne le chemin natif ou prévienne.
function telechargerBlob(blob, nom) {
  if (greffonNatif("Filesystem")) return false;
  try {
    const url = URL.createObjectURL(blob);
    const a = el("a");
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return true;
  } catch (e) { return false; }
}

/* ---------- Envoyer un .ics vers l'agenda de l'appareil ----------
 * Sur le web, le lien « download » ci-dessus suffit. Dans l'app installée
 * (Capacitor), il ne suffit plus : la WebView Android ignore purement et
 * simplement l'attribut `download`, et sans lever la moindre erreur — le
 * parent tape « Ajouter à mon agenda », rien ne se passe, pas même un
 * message. Vu du parent, la fonction a disparu en passant du site à l'app.
 *
 * Dans l'app, on passe donc par le pont natif : écrire le .ics dans le cache
 * de l'app (que le téléphone peut vider : rien ne s'accumule, et rien de
 * personnel ne sort de l'appareil), puis demander à l'appareil de l'OUVRIR.
 * L'agenda affiche alors l'événement et propose de l'enregistrer. Si aucune
 * application ne sait ouvrir un .ics, on retombe sur la feuille de partage,
 * qui permet au moins de se l'envoyer par mail.
 *
 * Les greffons sont lus sur `window.Capacitor.Plugins` : l'app n'est pas
 * « bundlée » (des <script> classiques, pas de modules), il n'y a donc aucun
 * import à faire — le pont natif expose lui-même les greffons installés, et
 * cet objet n'existe pas du tout sur le web.
 */
function greffonNatif(nom) {
  const cap = (typeof window !== "undefined") ? window.Capacitor : null;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return null;
  return (cap.Plugins && cap.Plugins[nom]) || null;
}

// Écrit le fichier puis l'ouvre. Renvoie "natif" si l'agenda a été sollicité,
// false si le pont n'est pas disponible (app trop ancienne, greffon absent).
async function ouvrirIcsNatif(ics, nomFichier, titre) {
  const fichiers = greffonNatif("Filesystem");
  if (!fichiers) return false;
  // "CACHE" / "utf8" : les valeurs des énumérations Directory.Cache et
  // Encoding.UTF8, écrites en clair puisqu'on parle au pont sans le paquet JS.
  await fichiers.writeFile({ path: nomFichier, data: ics, directory: "CACHE", encoding: "utf8" });
  const { uri } = await fichiers.getUri({ path: nomFichier, directory: "CACHE" });

  const ouvreur = greffonNatif("FileOpener");
  if (ouvreur) {
    try {
      // openWithDefault: false — certains calendriers réglés comme
      // application par défaut (constaté : Calendrier Samsung) refusent
      // l'intent sans le dire à FamiTeam : `open()` réussit du point de vue
      // du pont (l'activité a bien démarré), mais l'application cible échoue
      // ensuite en silence de son côté. On force donc le sélecteur système,
      // pour que le parent puisse choisir un autre calendrier (p. ex. Google
      // Agenda) si celui par défaut ne sait pas importer ce fichier.
      await ouvreur.open({ filePath: uri, contentType: "text/calendar", openWithDefault: false });
      return "natif";
    } catch (e) { /* aucune application pour ouvrir un .ics : on partage */ }
  }
  const partage = greffonNatif("Share");
  if (partage) {
    await partage.share({ title: titre || APP_NOM, files: [uri] });
    return "natif";
  }
  return false;
}

/* ---------- Partager un fichier depuis l'app installée ----------
 * Même principe que l'agenda ci-dessus, mais pour un fichier binaire (une
 * image) et avec le PARTAGE comme action, non l'ouverture : le parent veut
 * l'envoyer à quelqu'un, pas la regarder.
 *
 * Le pont natif n'accepte pas un Blob : on passe par du base64, ce que
 * Filesystem écrit tel quel quand aucun encodage n'est précisé. */
function blobEnBase64(blob) {
  return new Promise((resolve, reject) => {
    try {
      const lecteur = new FileReader();
      lecteur.onerror = () => reject(new Error("lecture du fichier impossible"));
      // Le résultat est une URL de données : on ne garde que ce qui suit la virgule.
      lecteur.onload = () => resolve(String(lecteur.result).split(",")[1] || "");
      lecteur.readAsDataURL(blob);
    } catch (e) { reject(e); }
  });
}

async function partagerFichierNatif(blob, nomFichier, titre, texte) {
  const fichiers = greffonNatif("Filesystem");
  const partage = greffonNatif("Share");
  if (!fichiers || !partage || !blob) return false;
  try {
    const donnees = await blobEnBase64(blob);
    if (!donnees) return false;
    await fichiers.writeFile({ path: nomFichier, data: donnees, directory: "CACHE" });
    const { uri } = await fichiers.getUri({ path: nomFichier, directory: "CACHE" });
    await partage.share({ title: titre || APP_NOM, text: texte || "", files: [uri] });
    return true;
  } catch (e) {
    // Un partage annulé par le parent lève aussi : ce n'est pas un échec, mais
    // rien ne le distingue de façon fiable, donc on ne réessaie pas ailleurs.
    return true;
  }
}

/* Enregistrer ou partager un fichier, selon l'appareil. Renvoie false si rien
 * n'est parti — l'appelant DOIT alors le dire, jamais se taire. */
async function enregistrerOuPartager(blob, nomFichier, titre, texte) {
  if (greffonNatif("Filesystem")) return await partagerFichierNatif(blob, nomFichier, titre, texte);
  return telechargerBlob(blob, nomFichier);
}

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
