/* =====================================================================
 * FamiTeam — Interface : Cœur du rendu
 * ---------------------------------------------------------------------
 * rendre(), le point d'entrée par lequel passe tout réaffichage, le
 * sélecteur d'enfant, le point de sortie unique des e-mails et les
 * petits utilitaires visuels partagés (emoji de repli, points, compteurs).
 *
 * Module de l'interface (ARCHITECTURE.md, phase C). Script classique,
 * comme tous les autres : les fonctions restent globales et s'appellent
 * entre modules sans import. L'ordre des balises dans index.html n'a
 * donc aucune conséquence — rien ne s'exécute au chargement.
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
