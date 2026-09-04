/* =====================================================================
 * FamiTeam — Rendu général : envoi d'e-mail, accueil, sélecteur d'enfant, mode révision
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * Le cœur du rendu : la fonction rendre(), le sélecteur d'enfant, les
 * compteurs visuels, la vue d'accueil, et le mode révision (revenir sur un
 * jour passé).
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

// Envoi d'e-mail via la fonction commune send-mail.
// On utilise un fetch direct (et non sb.functions.invoke) car invoke masque le
// message d'erreur renvoyé par la fonction (« non-2xx » générique). Retourne
// { ok, status, detail }.
/* Point de sortie unique des e-mails, et dernier garde-fou.
 * dev, les aperçus Vercel et la production partagent la MÊME base : sans ce
 * verrou, ouvrir l'app sur un aperçu enverrait de vrais e-mails à de vraies
 * familles, avec un code qui n'est pas encore celui de la production.
 * Règle : hors production, rien ne part. Seuls les envois déclenchés par un
 * clic explicite — test d'envoi de l'admin, code PIN demandé par le parent —
 * passent, via { interactif: true } : sans eux, dev serait intestable. */
async function envoyerMailFn(payload) {
  payload = payload || {};
  if (!payload.interactif && typeof estProduction === "function" && !estProduction()) {
    return { ok: false, status: 0, bloque: true, detail: "hors production : aucun envoi" };
  }
  const cfg = (typeof window !== "undefined" && window.KP_CONFIG) ? window.KP_CONFIG : {};
  const url = (cfg.SUPABASE_URL || "") + "/functions/v1/send-mail";
  let token = "";
  try { const s = await sb.auth.getSession(); token = (s && s.data && s.data.session) ? s.data.session.access_token : ""; } catch (e) { /* ignore */ }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, "apikey": cfg.SUPABASE_ANON_KEY || "" },
      body: JSON.stringify(payload)
    });
    let data = {};
    try { data = await r.json(); } catch (e) { /* corps non-JSON */ }
    if (r.ok) return { ok: true, status: r.status };
    return { ok: false, status: r.status, detail: data.error || r.statusText || ("HTTP " + r.status) };
  } catch (e) {
    return { ok: false, status: 0, detail: (e && e.message) ? e.message : String(e) };
  }
}

// Notification e-mail automatique quand une carte surprise est débloquée.
// Envoyée à l'adresse du compte (le parent) via la fonction commune send-mail.
// Silencieuse : aucune erreur n'est remontée à l'enfant (envoi best-effort).
async function notifierCarteDebloquee(carte) {
  try {
    if (typeof modeDemo !== "undefined" && modeDemo) return;     // pas d'envoi en démo
    if (typeof sb === "undefined" || !sb) return;
    const dest = (typeof utilisateur !== "undefined" && utilisateur && utilisateur.email) ? utilisateur.email : "";
    if (!dest) return;
    const titre = trData("carte", carte.id, carte.titre);
    // Détail des contributions de chaque enfant (esprit d'équipe).
    const lignes = Object.keys(carte.dons || {})
      .map(id => {
        const e = etat.enfants[id];
        return (e && carte.dons[id] > 0) ? `• ${e.prenom} : ${carte.dons[id]} 💛` : null;
      })
      .filter(Boolean);
    const detail = lignes.length ? ("\n\n" + t("mail.carte_contrib") + "\n" + lignes.join("\n")) : "";
    const activite = carte.activite ? ("\n\n" + carte.activite) : "";
    const sujet = t("mail.carte_sujet", { emoji: carte.emoji, titre });
    const corps = t("mail.carte_corps", { titre, cout: carte.cout }) + activite + detail + "\n\n— FamiTeam 🌟";
    await envoyerMailFn({ to: dest, subject: sujet, text: corps });
  } catch (e) { /* envoi best-effort : on n'interrompt jamais le jeu */ }
}

// Affiche un lien d'invitation copiable.
function montrerLienInvitation(conteneur, lien, note, mailto) {
  let box = conteneur.querySelector(".invite-box");
  if (!box) { box = el("div", "invite-box"); conteneur.appendChild(box); }
  box.innerHTML = "";
  const inp = el("input", "aj-val"); inp.style.width = "100%"; inp.value = lien; inp.readOnly = true;
  inp.onclick = () => inp.select();
  const copier = el("button", "btn-secondaire", t("lien.copier"));
  copier.onclick = async () => {
    try { await navigator.clipboard.writeText(lien); copier.textContent = t("lien.copie"); }
    catch { inp.select(); document.execCommand && document.execCommand("copy"); copier.textContent = t("lien.copie"); }
    setTimeout(() => (copier.textContent = t("lien.copier")), 1500);
  };
  box.appendChild(inp); box.appendChild(copier);
  // Envoi de l'invitation par e-mail via le client mail de l'utilisateur (mailto:).
  // Choix volontaire : l'e-mail part de la VRAIE adresse du parent → on sait qui
  // invite, et il n'atterrit pas dans les spams (contrairement à un envoi
  // automatique depuis un domaine récent).
  if (mailto) {
    const destinataire = el("input", "aj-val");
    destinataire.type = "email"; destinataire.style.width = "100%";
    destinataire.placeholder = t("lien.email_dest_ph");
    const corps = (mailto.corps || "").replace("{lien}", lien);
    const mail = el("a", "btn-secondaire btn-mail", t("lien.envoyer_mail"));
    const majLien = () => {
      mail.href = `mailto:${encodeURIComponent(destinataire.value.trim())}?subject=${encodeURIComponent(mailto.sujet || "")}&body=${encodeURIComponent(corps)}`;
    };
    destinataire.oninput = majLien;
    mail.onclick = (e) => { if (!destinataire.value.trim()) { e.preventDefault(); destinataire.focus(); } };
    majLien();
    box.appendChild(destinataire);
    box.appendChild(mail);
  }
  box.appendChild(el("p", "note", note || t("lien.valable")));
}

function rendre() {
  rendreSelecteur();
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("actif", b.dataset.vue === etat.vue));

  const c = $("#contenu");
  c.innerHTML = "";
  c.setAttribute("data-vue", etat.vue);   // pilote la mise en page responsive
  switch (etat.vue) {
    case "accueil":  vueAccueil(c);  break;
    case "famille":  vueFamille(c);  break;
    case "planete":  vuePlanete(c);  break;
    case "avatar":   vueAvatar(c);   break;
    case "reglages": vueReglages(c); break;
  }
  majPastilleAttente();
  timerSurChangementEnfant();
  synchroniserTimerUI();
  if (typeof observerRoues === "function") observerRoues();
}

// Pastille du nombre d'actions en attente sur l'onglet Parents.
function majPastilleAttente() {
  const total = Object.values(etat.enfants).reduce((s, e) => s + (e.enAttente ? e.enAttente.length : 0), 0);
  const btn = document.querySelector('.nav-btn[data-vue="reglages"]');
  if (!btn) return;
  let pin = btn.querySelector(".nav-pin");
  if (total > 0) {
    if (!pin) { pin = el("span", "nav-pin"); btn.appendChild(pin); }
    pin.textContent = total;
  } else if (pin) { pin.remove(); }
}

/* ---------- Sélecteur d'enfant ---------- */
// Vignette d'un enfant : son avatar personnalisé (SVG) plutôt qu'un emoji
// générique — l'enfant se reconnaît immédiatement. `taille` = "mini",
// "moyen" ou "grand" (voir CSS .av-vignette). L'emoji ne sert plus que de
// repli si l'avatar n'est pas (encore) disponible.
function vignetteEnfant(enf, taille) {
  const cls = "av-vignette" + (taille ? " " + taille : "");
  try {
    if (enf && enf.avatar && typeof buildAvatar === "function") {
      const svg = buildAvatar(enf.avatar);
      if (svg && svg.indexOf("<svg") >= 0) return `<span class="${cls}">${svg}</span>`;
    }
  } catch (e) { /* avatar illisible : on retombe sur l'initiale ci-dessous */ }
  // Repli : l'initiale du prénom sur la couleur de l'enfant. Jamais de vide —
  // une vignette absente est pire qu'une vignette simple.
  const brut = (enf && enf.prenom) ? enf.prenom.trim().charAt(0).toUpperCase() : "?";
  const initiale = brut.replace(/[&<>"']/g, "");
  const couleur = (enf && enf.couleur) ? enf.couleur : "#5b8def";
  return `<span class="${cls} initiale" style="--c:${couleur}">${initiale || "?"}</span>`;
}

function rendreSelecteur() {
  const s = $("#selecteur-enfant");
  s.innerHTML = "";
  Object.values(etat.enfants).forEach(enf => {
    const b = el("button", "pastille" + (enf.id === etat.enfantActif ? " actif" : ""));
    b.style.setProperty("--c", enf.couleur);
    b.innerHTML = `${vignetteEnfant(enf)}<span class="pastille-nom">${echapper(enf.prenom)}</span>`;
    b.onclick = () => { etat.enfantActif = enf.id; ecrireCache(); rendre(); };
    s.appendChild(b);
  });
}

// Compteur de monnaie : chiffre pour les grands, suite d'emojis pour les ≤ 5 ans
// (qui ne lisent pas encore les chiffres). Plafonné pour rester lisible.
function compteurVisuel(emoji, n, jeune) {
  if (!jeune) return `<span class="big">${emoji} ${n}</span>`;
  const CAP = 10;
  if (!n) return `<span class="pips"><span class="pip vide">·</span></span>`;
  let pips = "";
  for (let i = 0; i < Math.min(n, CAP); i++) pips += `<span class="pip">${emoji}</span>`;
  if (n > CAP) pips += `<span class="pip-plus">+${n - CAP}</span>`;
  return `<span class="pips" title="${n}">${pips}</span>`;
}

// Répète un emoji `n` fois (plafonné) — pour montrer une quantité aux petits.
function repeterEmoji(n, emoji, cap) {
  cap = cap || 6;
  let s = "";
  for (let i = 0; i < Math.min(n, cap); i++) s += emoji;
  // Au-delà du plafond : on montre « +N » (plus clair pour les petits qu'une
  // image vague), au lieu de tronquer ou d'afficher une étoile.
  if (n > cap) s += `<span class="pip-plus">+${n - cap}</span>`;
  return s || "·";
}

/* ---------- Repli pour les emoji non pris en charge (case vide / tofu) ----------
 * Certains emoji récents (ex. 🪥 la brosse à dents, Unicode 13.0) ne sont pas
 * encore dessinés par toutes les polices système — Windows non mis à jour,
 * vieil Android — et s'affichent comme une case vide. Détection : on compare
 * le rendu réel du caractère, sur un <canvas> hors écran, à celui d'un
 * caractère de la zone d'usage privé Unicode — qui n'est JAMAIS un vrai
 * emoji et échoue donc toujours. Deux rendus identiques = l'emoji testé
 * n'est pas mieux traité que ce caractère bidon, donc pas fiable. Résultat
 * mis en cache (le test ne se refait jamais deux fois pour un même
 * caractère). Absence de <canvas> (tests Node, contexte restreint) : on
 * suppose l'emoji correct plutôt que de risquer un faux repli. */
const _emojiSupporteCache = {};
function emojiSupporte(emoji) {
  if (emoji in _emojiSupporteCache) return _emojiSupporteCache[emoji];
  let ok = true;
  try {
    if (typeof document === "undefined" || !document.createElement) return (_emojiSupporteCache[emoji] = true);
    const cv = document.createElement("canvas");
    cv.width = 28; cv.height = 28;
    const ctx = cv.getContext("2d");
    if (!ctx || !ctx.fillText) return (_emojiSupporteCache[emoji] = true);
    ctx.textBaseline = "top";
    ctx.font = "22px sans-serif";
    const dessiner = (txt) => {
      ctx.clearRect(0, 0, 28, 28);
      ctx.fillText(txt, 0, 0);
      return ctx.getImageData(0, 0, 28, 28).data;
    };
    const rendu = dessiner(emoji);
    const inconnu = dessiner(""); // zone d'usage privé : jamais un vrai emoji
    ok = rendu.some((v, i) => v !== inconnu[i]);
  } catch (e) { ok = true; }
  return (_emojiSupporteCache[emoji] = ok);
}
// Emoji à afficher pour `principal`, avec un repli sûr (jamais de case vide)
// si le système ne sait pas le dessiner.
function emojiOuRepli(principal, repli) {
  return emojiSupporte(principal) ? principal : (repli || "⭐");
}

// Récompense d'une mission : chiffre pour les grands, emojis pour les petits
// (ex. +2 💛 → 💛💛). Plafonné pour rester lisible.
function pointsVisuels(points, emoji, jeune) {
  if (!jeune) return `+${points} ${emoji}`;
  const CAP = 6;
  let s = "";
  for (let i = 0; i < Math.min(points, CAP); i++) s += emoji;
  if (points > CAP) s += "✨";
  return `<span class="m-points-img">${s || emoji}</span>`;
}

/* ---------- Vue Accueil ---------- */
function vueAccueil(c) {
  const enf = enfantActif();

  // Mode révision (parent) : bannière de navigation par jour, EN HAUT, pour
  // bien voir quel jour on est en train de modifier.
  if (retroActif) c.appendChild(blocVerifJours(enf));

  // Disposition 2 colonnes sur grand écran, empilée sur mobile/tablette.
  const layout = el("div", "accueil-layout");
  const colA = el("div", "acc-col acc-col-a"); // profil + dodo (latéral sur desktop)
  const colB = el("div", "acc-col acc-col-b"); // missions, écosystème, badges
  layout.appendChild(colA); layout.appendChild(colB);
  c.appendChild(layout);

  const jeune = estJeune(enf);   // affichage imagé (seuil réglable par les parents)
  const carte = el("section", "carte-accueil");
  carte.style.setProperty("--c", enf.couleur);
  carte.innerHTML = `
    <div class="accueil-avatar">${renduAvatar(enf)}</div>
    <h1>${t("home.salut", { prenom: enf.prenom })} <small>(${t("home.ans", { age: age(enf) })})</small></h1>
    <div class="compteurs">
      <div class="compteur">${compteurVisuel("💛", enf.coeurs, jeune)}<span>${t("home.coeurs_label")}</span></div>
      <div class="compteur">${compteurVisuel("💧", enf.gouttes, jeune)}<span>${t("home.gouttes_label")}</span></div>
    </div>`;
  colA.appendChild(carte);

  // Auto-évaluation de la journée (mise en avant, juste sous le profil)
  colA.appendChild(blocEval(enf, "enfant"));

  // Bandeau "dodo" : ambiance selon l'heure + mission coucher à l'heure
  colA.appendChild(bandeauDodo(enf));

  // Tournantes : à qui le tour, jusqu'à quand — AVANT les missions, sinon
  // l'enfant découvre une tâche (ou son absence) sans comprendre pourquoi.
  const tr = blocTournanteEnfant(enf);
  if (tr) colB.appendChild(tr);

  // Missions Famille (directement sur la page d'accueil de l'enfant)
  const titreFam = el("section", "carte titre-cat");
  titreFam.style.setProperty("--c", CATEGORIES.famille.couleur);
  titreFam.innerHTML = `<h2>${t("home.missions_famille")} <span class="solde-inline">💛${jeune ? "" : " " + enf.coeurs}</span></h2>`;
  colB.appendChild(titreFam);
  colB.appendChild(grilleMissions("famille"));

  // Missions Planète (directement sur la page d'accueil de l'enfant)
  const titrePla = el("section", "carte titre-cat");
  titrePla.style.setProperty("--c", CATEGORIES.planete.couleur);
  titrePla.innerHTML = `<h2>${t("home.missions_planete")} <span class="solde-inline">💧${jeune ? "" : " " + enf.gouttes}</span></h2>`;
  colB.appendChild(titrePla);
  colB.appendChild(grilleMissions("planete"));

  // Badges (seuls les badges réalisés sont affichés)
  colB.appendChild(blocBadges(enf));

  // Blague du jour (si l'humour est activé par les parents)
  const blg = blocBlagueDuJour();
  if (blg) colB.appendChild(blg);

  // Section discrète (bas de page) : activer le mode révision (uniquement au repos).
  if (!retroActif) c.appendChild(blocVerifJours(enf));
}

// État local (session) du mode « vérification des jours précédents ».
let retroActif = false;
let retroJour = null;

// Active le mode rétroactif après le code PIN parental (ou directement si le
// parent est déjà en mode parents / qu'aucun PIN n'est défini).
function activerModeRetro() {
  const lancer = () => { retroActif = true; retroJour = retroJour || aujourdHui(); rendre(); };
  if (modeParents || !(etat.reglages && etat.reglages.codeParent)) { lancer(); return; }
  demanderPin({
    titre: t("retro.pin_titre"),
    permettreOubli: true,
    onReset: () => lancer(),
    onOk: (saisi) => { if (saisi.trim() !== etat.reglages.codeParent) return false; lancer(); }
  });
}
function quitterModeRetro() { retroActif = false; rendre(); }
// Jour affiché sur l'accueil : le jour en révision si actif, sinon aujourd'hui.
function jourAffiche() { return (retroActif && retroJour) ? retroJour : aujourdHui(); }
function decalerJourRetro(delta) {
  const d = new Date((retroJour || aujourdHui()) + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const cle = dateCle(d);
  if (cle > aujourdHui()) return;     // pas de futur
  retroJour = cle;
  rendre();
}
// Libellé lisible d'un jour (ex. « lundi 16 juin »), dans la langue courante.
function libelleJour(cle) {
  try {
    const d = new Date(cle + "T00:00:00");
    return d.toLocaleDateString(langue, { weekday: "long", day: "numeric", month: "long" });
  } catch { return cle; }
}

// Bloc « vérifier les jours précédents » : discret au repos, déployé une fois
// le code PIN saisi. Permet de cocher/décocher toutes les missions, jour par jour.
/* ---------- Semaine papier (suivi sans écran) ---------- */
// Lundi de la semaine contenant `cle` (AAAA-MM-JJ local).
function debutSemaine(cle) {
  const d = new Date(cle + "T00:00:00");
  const dl = (d.getDay() + 6) % 7;     // 0 = lundi
  d.setDate(d.getDate() - dl);
  return dateCle(d);
}
// Les 7 clés de jour d'une semaine à partir de son lundi.
function joursSemaine(debut) {
  const base = new Date(debut + "T00:00:00");
  const arr = [];
  for (let i = 0; i < 7; i++) { const d = new Date(base); d.setDate(base.getDate() + i); arr.push(dateCle(d)); }
  return arr;
}
// Missions à imprimer/encoder pour un enfant sur la semaine sélectionnée :
// union des missions réellement actives chaque jour (tient compte du plan, de
// la sélection conseillée, de l'activation par enfant et de la PLANIFICATION
// jours/dates). Une mission planifiée le week-end n'apparaît que si elle est
// active au moins un jour de la semaine.
function missionsFeuille(enf, catId) {
  const debut = semainePapierDebut || debutSemaine(aujourdHui());
  const jours = joursSemaine(debut);
  const vues = {};
  jours.forEach(j => {
    missionsActives(enf, catId, j).forEach(m => {
      if (m.speciale !== "coucher") vues[m.id] = m;
    });
  });
  return Object.values(vues);
}
// La mission est-elle planifiée/active pour cet enfant ce jour précis ?
function missionActiveJour(enf, m, jour) {
  return missionActivePourEnfant(enf, m.id) && missionPlanifieeActive(m, enf, jour);
}
