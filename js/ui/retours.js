/* =====================================================================
 * FamiTeam — Retours des familles et récupération de sauvegarde
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * Le formulaire de retour (bogue ou suggestion), sa file d'attente hors
 * ligne, et la récupération d'une sauvegarde (locale, cloud ou fichier).
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

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
