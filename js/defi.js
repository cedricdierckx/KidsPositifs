/* =====================================================================
 * FamiTeam — « Le Défi » : arènes privées entre familles amies
 * ---------------------------------------------------------------------
 * Page secrète (defi.html), liée depuis nulle part, noindex et exclue par
 * robots.txt. On n'y arrive que par l'URL directe, ou par le lien d'arène
 * qu'un ami envoie.
 *
 * Pourquoi séparée du reste ? L'application publique tient une doctrine :
 * pas de classement, aucun perdant fabriqué, aucun enfant sollicité. Ici,
 * ce sont des ADULTES qui se connaissent et qui CHOISISSENT de se défier,
 * pour une durée limitée, dans une arène privée. Les deux choses peuvent
 * coexister parce que celle-ci est fermée, volontaire et invisible depuis
 * l'application.
 *
 * Trois règles tenues, ici comme en base :
 *   - aucun enfant n'entre dans le calcul, à aucun titre ;
 *   - le nom d'équipe est choisi, jamais le nom de famille ;
 *   - seuls les parrainages obtenus PENDANT l'arène comptent.
 *
 * Langue : français seulement. Choix de périmètre assumé pour une page
 * confidentielle destinée à un cercle d'amis ; la traduire est un petit
 * chantier séparé si le dispositif prend.
 * ===================================================================== */

let sb = null, session = null, familleId = null, familleNom = "";
const CLE_FAMILLE = "kp_famille_active";        // même clé que l'application
const CLE_ARENE = "kp_arene_en_attente";        // arène rejointe après inscription
const CLE_PARRAIN = "kp_pending_parrain_code";  // code de parrainage de l'hôte

/* Paliers de l'arène : ils ne servent qu'à donner du relief au score, et
 * n'ouvrent aucun droit. Le dernier est volontairement hors d'atteinte
 * ordinaire — c'est le sel de la chose. */
const DEFI_RANGS = [
  { seuil: 0,    nom: "Recrue",       emoji: "🥚" },
  { seuil: 100,  nom: "Éclaireur",    emoji: "🔥" },
  { seuil: 250,  nom: "Ambassadeur",  emoji: "⚡" },
  { seuil: 500,  nom: "Champion",     emoji: "👑" },
  { seuil: 1000, nom: "Légende",      emoji: "🐉" }
];
function rangDe(points) {
  let r = DEFI_RANGS[0];
  DEFI_RANGS.forEach(x => { if ((points || 0) >= x.seuil) r = x; });
  return r;
}
function rangSuivant(points) {
  return DEFI_RANGS.find(x => (points || 0) < x.seuil) || null;
}

/* Les liens d'arène sont faits pour être ENVOYÉS à quelqu'un : ils ne doivent
 * donc jamais dépendre de l'origine courante. Depuis un aperçu de déploiement,
 * ils porteraient une URL d'aperçu, et dépasseraient au passage la capacité du
 * QR — qui disparaîtrait sans bruit. On écrit le domaine officiel le plus
 * court, ce qui laisse de la marge à l'encodeur. */
const DEFI_BASE = "https://fami.team/defi.html";

const $ = (s) => document.querySelector(s);
const hote = () => document.getElementById("defi");
function echapper(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "defi-toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
function param(n) { return new URLSearchParams(location.search).get(n); }
function lienArene(code) { return DEFI_BASE + "?a=" + encodeURIComponent(code); }

/* ---------- Démarrage ---------- */
document.addEventListener("DOMContentLoaded", demarrer);

async function demarrer() {
  const cfg = window.KP_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || typeof supabase === "undefined") {
    return ecran(`<h1>⚙️ Configuration manquante</h1>
      <p class="defi-note">Renseignez le projet Supabase dans <code>js/config.js</code>.</p>`);
  }
  sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

  // Le lien d'arène porte aussi le code de parrainage de l'hôte : l'ami qui
  // s'inscrit depuis ce lien est rattaché à celui qui l'a défié.
  const p = param("p");
  if (p) { try { localStorage.setItem(CLE_PARRAIN, p.toUpperCase()); } catch (e) {} }
  const codeUrl = (param("a") || "").toUpperCase();
  if (codeUrl) { try { localStorage.setItem(CLE_ARENE, codeUrl); } catch (e) {} }

  const { data } = await sb.auth.getSession();
  session = data && data.session;

  if (!session) return ecranVisiteur(codeUrl);
  await chargerFamille();
  if (!familleId) {
    return ecran(`<h1>🏆 Le Défi</h1>
      <p class="defi-note">Ce compte n'a pas encore de famille. Crée-la dans l'application, puis reviens.</p>
      <a class="defi-btn" href="/">Ouvrir FamiTeam</a>`);
  }
  const enAttente = codeUrl || (localStorage.getItem(CLE_ARENE) || "");
  if (enAttente) return ecranArene(enAttente);
  ecranAccueil();
}

async function chargerFamille() {
  const { data: membres } = await sb.from("family_members").select("family_id");
  if (!membres || !membres.length) return;
  let choisie = null;
  try { choisie = localStorage.getItem(CLE_FAMILLE); } catch (e) {}
  const ids = membres.map(m => m.family_id);
  familleId = (choisie && ids.includes(choisie)) ? choisie : ids[0];
  const { data: fam } = await sb.from("families").select("name").eq("id", familleId).limit(1);
  familleNom = (fam && fam[0] && fam[0].name) || "";
}

function ecran(html) { hote().innerHTML = html; }

/* ---------- Le visiteur sans compte : l'accroche ---------- */
async function ecranVisiteur(code) {
  if (!code) {
    return ecran(`<h1>🏆 Le Défi</h1>
      <p class="defi-note">Cette page ne s'ouvre qu'avec un lien d'arène, ou en étant connecté.</p>
      <a class="defi-btn" href="/">Ouvrir FamiTeam</a>`);
  }
  const { data } = await sb.rpc("arene_apercu", { p_code: code });
  if (!data) {
    return ecran(`<h1>🏆 Arène introuvable</h1>
      <p class="defi-note">Ce code n'existe pas, ou l'arène a été supprimée.</p>
      <a class="defi-btn" href="/">Ouvrir FamiTeam</a>`);
  }
  const fini = data.terminee;
  ecran(`
    <div class="defi-hero">
      <p class="defi-kicker">Tu as été défié·e</p>
      <h1 class="defi-titre">${echapper(data.nom)}</h1>
      <p class="defi-hote-nom">Arène ouverte par <strong>${echapper(data.hote || "?")}</strong></p>
      <div class="defi-compteurs">
        <div class="defi-compteur"><span class="defi-chiffre">${data.equipes}</span><span class="defi-libelle">équipe(s)</span></div>
        <div class="defi-compteur"><span class="defi-chiffre">${fini ? "—" : data.jours_restants}</span><span class="defi-libelle">jour(s) restant(s)</span></div>
      </div>
      ${fini ? `<p class="defi-note">Cette arène est terminée.</p>` : `
      <p class="defi-regle">La règle est simple : <strong>celui qui fait découvrir FamiTeam
      au plus grand nombre de familles gagne.</strong> Une famille qui reste compte quatre fois
      plus qu'une inscription sans lendemain.</p>
      <a class="defi-btn defi-btn-xl" href="/">⚔️ Je relève le défi</a>
      <p class="defi-note">Crée ta famille sur FamiTeam (c'est gratuit), puis rouvre ce lien :
      tu entreras dans l'arène.</p>`}
    </div>`);
}

/* ---------- L'accueil d'une famille connectée ---------- */
async function ecranAccueil() {
  const { data: miennes } = await sb.rpc("arene_mes_arenes", { p_family: familleId });
  const liste = Array.isArray(miennes) ? miennes : [];
  const cartes = liste.map(a => `
    <button class="defi-arene-l" data-code="${echapper(a.code)}">
      <span class="defi-arene-nom">${echapper(a.nom)}</span>
      <span class="defi-arene-meta">${a.equipes} équipe(s) · ${a.terminee ? "terminée" : "en cours"}</span>
    </button>`).join("");

  ecran(`
    <div class="defi-hero">
      <p class="defi-kicker">Zone confidentielle</p>
      <h1 class="defi-titre">🏆 Le Défi</h1>
      <p class="defi-regle">Une arène privée, entre familles amies. Celui qui fait découvrir
      FamiTeam au plus de familles gagne. Rien de tout ceci n'apparaît dans l'application.</p>
    </div>
    ${liste.length ? `<section class="defi-bloc"><h2>Tes arènes</h2><div class="defi-arenes">${cartes}</div></section>` : ""}
    <section class="defi-bloc">
      <h2>Rejoindre une arène</h2>
      <input id="defi-code" class="defi-champ" placeholder="Code reçu d'un ami" maxlength="12">
      <button id="defi-rejoindre" class="defi-btn">Entrer dans l'arène</button>
    </section>
    <section class="defi-bloc">
      <h2>Créer ton arène</h2>
      <input id="defi-nom" class="defi-champ" placeholder="Nom de l'arène (ex. Le défi des voisins)" maxlength="40">
      <input id="defi-pseudo" class="defi-champ" placeholder="Le nom de ton équipe" maxlength="24">
      <select id="defi-duree" class="defi-champ">
        <option value="14">14 jours — sprint</option>
        <option value="30" selected>30 jours — la saison classique</option>
        <option value="90">90 jours — la guerre longue</option>
      </select>
      <button id="defi-creer" class="defi-btn defi-btn-xl">⚔️ Ouvrir l'arène</button>
      <p class="defi-note">Le nom d'équipe est celui qui s'affichera au classement. Jamais ton
      nom de famille, jamais le prénom d'un enfant.</p>
    </section>`);

  hote().querySelectorAll(".defi-arene-l").forEach(b =>
    b.onclick = () => ecranArene(b.dataset.code));

  $("#defi-rejoindre").onclick = () => {
    const c = ($("#defi-code").value || "").trim().toUpperCase();
    if (!c) { $("#defi-code").focus(); return; }
    ecranArene(c);
  };
  $("#defi-creer").onclick = async () => {
    const nom = ($("#defi-nom").value || "").trim();
    const pseudo = ($("#defi-pseudo").value || "").trim();
    if (!nom) { $("#defi-nom").focus(); return toast("Donne un nom à ton arène."); }
    if (!pseudo) { $("#defi-pseudo").focus(); return toast("Choisis le nom de ton équipe."); }
    const { data, error } = await sb.rpc("arene_creer", {
      p_family: familleId, p_nom: nom, p_jours: parseInt($("#defi-duree").value, 10), p_pseudo: pseudo
    });
    if (error) return toast(error.message);
    ecranArene(data.code);
  };
}

/* ---------- L'arène : classement, podium, invitation ---------- */
async function ecranArene(code) {
  ecran(`<p class="defi-chargement">Ouverture de l'arène…</p>`);
  let cls = null, err = null;
  try {
    const r = await sb.rpc("arene_classement", { p_code: code, p_family: familleId });
    cls = r.data; err = r.error;
  } catch (e) { err = e; }

  // Pas encore membre : on propose d'entrer, avec l'aperçu comme accroche.
  if (err) {
    const { data: ap } = await sb.rpc("arene_apercu", { p_code: code });
    if (!ap) {
      toast("Arène introuvable.");
      try { localStorage.removeItem(CLE_ARENE); } catch (e) {}
      return ecranAccueil();
    }
    return ecranEntree(code, ap);
  }
  try { localStorage.removeItem(CLE_ARENE); } catch (e) {}
  dessinerArene(cls);
}

function ecranEntree(code, ap) {
  ecran(`
    <div class="defi-hero">
      <p class="defi-kicker">Tu as été défié·e</p>
      <h1 class="defi-titre">${echapper(ap.nom)}</h1>
      <p class="defi-hote-nom">Ouverte par <strong>${echapper(ap.hote || "?")}</strong> ·
        ${ap.equipes} équipe(s) · ${ap.terminee ? "terminée" : ap.jours_restants + " jour(s) restant(s)"}</p>
    </div>
    <section class="defi-bloc">
      <h2>Choisis ton nom d'équipe</h2>
      <input id="defi-pseudo2" class="defi-champ" placeholder="Ex. Les Ouistitis" maxlength="24">
      <button id="defi-entrer" class="defi-btn defi-btn-xl">⚔️ Entrer dans l'arène</button>
      <p class="defi-note">Ce nom, et lui seul, s'affichera au classement de cette arène. Tu
      peux quitter l'arène à tout moment : ton nom d'équipe est alors effacé.</p>
    </section>
    <button class="defi-lien" id="defi-retour">← Retour</button>`);
  $("#defi-retour").onclick = ecranAccueil;
  $("#defi-entrer").onclick = async () => {
    const pseudo = ($("#defi-pseudo2").value || "").trim();
    if (!pseudo) { $("#defi-pseudo2").focus(); return toast("Choisis le nom de ton équipe."); }
    const { error } = await sb.rpc("arene_rejoindre", { p_code: code, p_family: familleId, p_pseudo: pseudo });
    if (error) return toast(error.message);
    ecranArene(code);
  };
}

function dessinerArene(cls) {
  const equipes = Array.isArray(cls.equipes) ? cls.equipes : [];
  const moi = equipes.find(e => e.moi) || { points: 0, vivantes: 0, en_route: 0 };
  const monRang = equipes.findIndex(e => e.moi) + 1;
  const rang = rangDe(moi.points), suivant = rangSuivant(moi.points);
  const partRang = suivant
    ? Math.round(((moi.points - rang.seuil) / (suivant.seuil - rang.seuil)) * 100) : 100;
  const medaille = (i) => ["🥇", "🥈", "🥉"][i] || String(i + 1);

  const podium = equipes.slice(0, 3).map((e, i) => `
    <div class="defi-marche defi-marche-${i + 1}${e.moi ? " defi-moi" : ""}">
      <span class="defi-medaille">${medaille(i)}</span>
      <span class="defi-pseudo">${echapper(e.pseudo)}</span>
      <span class="defi-points">${e.points}</span>
    </div>`).join("");

  const reste = equipes.slice(3).map((e, i) => `
    <li class="defi-rangee${e.moi ? " defi-moi" : ""}">
      <span class="defi-place">${i + 4}</span>
      <span class="defi-pseudo">${echapper(e.pseudo)}</span>
      <span class="defi-detail">${e.vivantes}×100${e.en_route ? ` + ${e.en_route}×25` : ""}</span>
      <span class="defi-points">${e.points}</span>
    </li>`).join("");

  ecran(`
    <div class="defi-hero defi-hero-serre">
      <p class="defi-kicker">${cls.terminee ? "Arène terminée" : cls.jours_restants + " jour(s) restant(s)"}</p>
      <h1 class="defi-titre">${echapper(cls.nom)}</h1>
    </div>

    <section class="defi-bloc defi-moi-bloc">
      <div class="defi-moi-haut">
        <span class="defi-rang-emoji">${rang.emoji}</span>
        <div>
          <p class="defi-rang-nom">${rang.nom}</p>
          <p class="defi-note">${monRang ? `${monRang}<sup>e</sup> sur ${equipes.length}` : "pas encore classé"}</p>
        </div>
        <span class="defi-score">${moi.points}</span>
      </div>
      ${suivant ? `<div class="defi-jauge"><div class="defi-jauge-r" style="width:${Math.max(2, partRang)}%"></div></div>
        <p class="defi-note">Encore <strong>${suivant.seuil - moi.points}</strong> points pour ${suivant.emoji} ${suivant.nom}.</p>`
      : `<p class="defi-note">Rang maximal atteint. 🐉</p>`}
      ${moi.en_route ? `<p class="defi-attente">⏳ <strong>${moi.en_route * 75}</strong> points en attente :
        ${moi.en_route} famille(s) que tu as amenée(s) n'ont pas encore ouvert l'app trois jours.
        Chacune passera de 25 à 100 points quand elle prendra le pli.</p>` : ""}
    </section>

    ${equipes.length ? `<section class="defi-bloc">
      <h2>Le podium</h2>
      <div class="defi-podium">${podium}</div>
      ${reste ? `<ol class="defi-liste">${reste}</ol>` : ""}
    </section>` : ""}

    <section class="defi-bloc">
      <h2>Amène du monde</h2>
      <p class="defi-note">Chaque famille qui s'inscrit avec ton lien te rapporte
        <strong>25 points</strong>, puis <strong>100</strong> dès qu'elle a ouvert l'app
        trois jours différents. Choisis bien qui tu invites : le volume ne paie pas.</p>
      <div id="defi-invit" class="defi-invit"><p class="defi-note">Préparation de ton lien…</p></div>
    </section>

    <section class="defi-bloc">
      <h2>Inviter dans l'arène</h2>
      <p class="defi-note">Ce lien-ci fait entrer un ami <strong>dans cette arène</strong>.</p>
      <div class="defi-copie">
        <input class="defi-champ" id="defi-lien-arene" readonly value="${echapper(lienArene(cls.code))}">
        <button class="defi-btn" id="defi-copier">Copier</button>
      </div>
      <p class="defi-note">Code de l'arène : <strong class="defi-code">${echapper(cls.code)}</strong></p>
    </section>

    <button class="defi-lien" id="defi-retour">← Mes arènes</button>
    <button class="defi-lien defi-lien-danger" id="defi-quitter">Quitter cette arène</button>`);

  $("#defi-retour").onclick = ecranAccueil;
  $("#defi-copier").onclick = async () => {
    const v = $("#defi-lien-arene").value;
    try { await navigator.clipboard.writeText(v); toast("Lien copié."); }
    catch (e) { $("#defi-lien-arene").select(); toast("Sélectionné : copie-le."); }
  };
  $("#defi-quitter").onclick = async () => {
    if (!confirm("Tu quittes l'arène et ton nom d'équipe est effacé. Continuer ?")) return;
    const { error } = await sb.rpc("arene_quitter", { p_code: cls.code, p_family: familleId });
    if (error) return toast(error.message);
    toast("Tu as quitté l'arène.");
    ecranAccueil();
  };

  // Le lien de recrutement : code de parrainage de la famille + code d'arène,
  // pour que l'ami inscrit soit rattaché ET atterrisse dans la bonne arène.
  chargerLienRecrutement(cls.code);
}

async function chargerLienRecrutement(codeArene) {
  const zone = document.getElementById("defi-invit");
  if (!zone) return;
  const { data: code, error } = await sb.rpc("referral_code_famille", { p_family: familleId });
  if (error || !code) { zone.innerHTML = `<p class="defi-note">Lien indisponible pour le moment.</p>`; return; }
  const lien = DEFI_BASE + "?a=" + encodeURIComponent(codeArene) + "&p=" + encodeURIComponent(code);
  const qr = (typeof qrSvg === "function") ? qrSvg(lien, { classe: "defi-qr" }) : null;
  // Si le QR ne peut pas être produit, on le DIT : un carré qui disparaît sans
  // explication est pire que pas de carré du tout.
  zone.innerHTML = `
    <div class="defi-copie">
      <input class="defi-champ" id="defi-lien-recrue" readonly value="${echapper(lien)}">
      <button class="defi-btn" id="defi-copier2">Copier</button>
    </div>
    ${qr ? `<div class="defi-qr-cadre">${qr}</div>`
         : `<p class="defi-note">QR code indisponible pour ce lien (trop long) — le lien
            ci-dessus fonctionne normalement.</p>`}`;
  const b = document.getElementById("defi-copier2");
  if (b) b.onclick = async () => {
    try { await navigator.clipboard.writeText(lien); toast("Lien copié."); }
    catch (e) { document.getElementById("defi-lien-recrue").select(); toast("Sélectionné : copie-le."); }
  };
}

// Export pour le banc d'essai (aucun effet dans le navigateur).
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFI_RANGS, rangDe, rangSuivant };
}
