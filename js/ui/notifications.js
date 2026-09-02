/* =====================================================================
 * FamiTeam — Interface : Rappel du soir (notification locale)
 * ---------------------------------------------------------------------
 * Une notification par jour, à l'heure choisie par le parent, dans l'app
 * installée uniquement. Voir PLAN-MOBILE.md.
 *
 * Module de l'interface (ARCHITECTURE.md, phase C). Script classique,
 * comme tous les autres : les fonctions restent globales et s'appellent
 * entre modules sans import. L'ordre des balises dans index.html n'a
 * donc aucune conséquence — rien ne s'exécute au chargement.
 * ===================================================================== */
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
