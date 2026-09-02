/* =====================================================================
 * FamiTeam — Interface : Charpente de la page et navigation
 * ---------------------------------------------------------------------
 * Le squelette HTML posé une fois pour toutes, la navigation entre
 * enfants (boutons et glissé du doigt), les blocs repliables et leur
 * mémoire, le sélecteur de langue, et le tutoriel du premier lancement.
 *
 * Module de l'interface (ARCHITECTURE.md, phase C). Script classique,
 * comme tous les autres : les fonctions restent globales et s'appellent
 * entre modules sans import. L'ordre des balises dans index.html n'a
 * donc aucune conséquence — rien ne s'exécute au chargement.
 * ===================================================================== */
function initSquelette() {
  document.body.innerHTML = `
    <div id="confettis"></div>
    <div id="toast" class="toast"></div>

    <div class="haut-fixe">
    <header class="topbar">
      <button id="pastille-inviter" class="pastille-inviter" title="Inviter une autre famille">🎁<span id="pastille-badge" class="pastille-badge"></span></button>
      <button id="pastille-reparer" class="pastille-reparer" title="${t("rep.pastille")}">🌈</button>
      <button id="timer-btn" class="timer-btn" title="${t("timer.titre")}">⏱️</button>
      <div class="logo">🌟 ${APP_NOM} <span id="sync-etat" class="sync-etat" title="État de la synchronisation">…</span></div>
      <div id="selecteur-enfant" class="selecteur"></div>
    </header>

    <div id="timer-bandeau" class="timer-bandeau" style="display:none">
      <span id="timer-bandeau-icone" class="timer-bandeau-icone">⏳</span>
      <div class="timer-jauge"><div id="timer-jauge-rempl" class="timer-jauge-rempl"></div></div>
      <span id="timer-bandeau-temps" class="timer-bandeau-temps">--:--</span>
    </div>
    </div>

    <main id="contenu"></main>

    <nav class="navbar">
      <button data-vue="accueil"  class="nav-btn">🏠<span>${t("nav.accueil")}</span></button>
      <button data-vue="famille"  class="nav-btn">🏡<span>${t("nav.famille")}</span></button>
      <button data-vue="planete"  class="nav-btn">🌍<span>${t("nav.planete")}</span></button>
      <button data-vue="avatar"   class="nav-btn">🎨<span>${t("nav.avatar")}</span></button>
      <button data-vue="reglages" class="nav-btn">⚙️<span>${t("nav.parents")}</span></button>
    </nav>`;

  // Navigation : choix d'affichage local (non synchronisé entre appareils).
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.addEventListener("click", () => {
      etat.vue = b.dataset.vue;
      // L'espace parents s'ouvre toujours sur « Aujourd'hui » : sans ce
      // réinitialisation, revenir sur cet onglet (sans repasser par le
      // cadenas — le mode parents restait déverrouillé le temps de la
      // session) laissait le sous-menu sur le dernier onglet consulté,
      // parfois loin à droite dans la barre défilante.
      if (b.dataset.vue === "reglages" && typeof ongletParent !== "undefined") ongletParent = "quotidien";
      // Chaque onglet démarre son propre contenu depuis le haut : rester
      // scrollé plus bas qu'où on était sur l'onglet précédent serait déroutant.
      window.scrollTo(0, 0);
      ecrireCache(); rendre();
    }));

  // Pastille « inviter une autre famille » (parrainage rapide).
  const pInv = document.getElementById("pastille-inviter");
  if (pInv) pInv.onclick = () => {
    if (typeof modeDemo !== "undefined" && modeDemo) { toast("Indisponible en mode démo 🧪", "info"); return; }
    modaleParrainage();
  };
  majPastilleInvit();

  // Bouton minuteur de temps d'écran (verrouillage PIN, ou permanent).
  const bTimer = document.getElementById("timer-btn");
  if (bTimer) bTimer.onclick = () => {
    if (typeof modeDemo !== "undefined" && modeDemo) { toast("Indisponible en mode démo 🧪", "info"); return; }
    if (timerMode() === "permanent") { ouvrirReglagesTimerPermanent(); return; }
    if (timerEtat.actif) modaleTimerActif();
    else modaleTimer();
  };
  majBoutonTimer();

  // Accès direct aux gestes de réparation. C'est le seul écran qu'on cherche
  // dans l'urgence — juste après l'incident, l'enfant à côté de soi — et il
  // était au fond de l'espace parents, à cinq gestes de là.
  const bRep = document.getElementById("pastille-reparer");
  if (bRep) bRep.onclick = ouvrirReparationRapide;

  // Le bandeau dodo suit l'horloge système (voir planifierDodo).
  planifierDodo();
  if (!window.__dodoHooks) {
    window.__dodoHooks = true;
    // Les minuteurs sont ralentis en arrière-plan, et purement suspendus quand
    // l'écran du téléphone s'éteint : au retour, on recalcule tout de suite au
    // lieu d'attendre le prochain tick.
    document.addEventListener("visibilitychange", () => { if (!document.hidden) planifierDodo(); });
    window.addEventListener("focus", planifierDodo);
    window.addEventListener("pageshow", planifierDodo);   // retour depuis le cache navigateur
  }

  // Swipe horizontal : change d'enfant (onglets enfants) ou de sous-onglet
  // dans l'espace parents.
  brancherSwipeEnfant(document.getElementById("contenu"));

  // Décourage le rafraîchissement quand le minuteur tourne ou que l'écran est
  // verrouillé (un enfant pourrait sinon tenter de recharger). L'état est de
  // toute façon conservé, mais on affiche l'avertissement standard du navigateur.
  if (!window.__gardeRefresh) {
    window.__gardeRefresh = true;
    window.addEventListener("beforeunload", (e) => {
      if (timerEtat && (timerEtat.actif || timerEtat.verrouille || timerEtat.choix)) {
        e.preventDefault(); e.returnValue = ""; return "";
      }
    });
  }
}

// Change d'enfant actif d'un cran (dir = +1 suivant, -1 précédent), en boucle.
function changerEnfantRelatif(dir) {
  const ids = Object.keys(etat.enfants);
  if (ids.length < 2) return;
  const i = ids.indexOf(etat.enfantActif);
  const next = ids[(i + dir + ids.length) % ids.length];
  etat.enfantActif = next;
  ecrireCache();
  rendre();
}

// Joue une petite animation de glissement sur la zone de contenu puis exécute
// le changement (dir = +1 vers la gauche/suivant, -1 vers la droite/précédent).
function glisserVers(dir, action) {
  const c = document.getElementById("contenu");
  action();   // rendre() recompose le contenu (sans toucher aux classes du <main>)
  if (!c) return;
  const cls = dir > 0 ? "glisse-gauche" : "glisse-droite";
  c.classList.remove("glisse-gauche", "glisse-droite");
  void c.offsetWidth;          // force le redémarrage de l'animation
  c.classList.add(cls);
  c.addEventListener("animationend", function fin() {
    c.classList.remove(cls);
    c.removeEventListener("animationend", fin);
  });
}

// Détecte un glissement horizontal franc sur la zone de contenu et change
// d'enfant (ou de sous-onglet dans l'espace parents). Conçu pour éviter les
// déclenchements accidentels par un enfant : il faut un geste long (≥ 90 px),
// nettement horizontal, assez rapide (≤ 600 ms) et pas trop lent du doigt.
function brancherSwipeEnfant(zone) {
  if (!zone) return;
  // Zones à défilement/interaction horizontale propres : on n'y déclenche pas
  // le swipe de navigation (sinon conflit avec le sous-menu, la grille, etc.).
  const SANS_SWIPE = ".sous-nav, .enc-scroll, .selecteur, .eco-cartes, .langue-choix, .parent-indic, input, textarea, select";
  let x0 = 0, y0 = 0, t0 = 0, suivi = false;
  zone.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { suivi = false; return; }
    if (e.target && e.target.closest && e.target.closest(SANS_SWIPE)) { suivi = false; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); suivi = true;
  }, { passive: true });
  zone.addEventListener("touchmove", (e) => {
    // Plusieurs doigts ou geste à dominante verticale : on annule (scroll/zoom).
    if (e.touches.length !== 1) { suivi = false; return; }
    const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) suivi = false;
  }, { passive: true });
  zone.addEventListener("touchend", (e) => {
    if (!suivi) return;
    suivi = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    const duree = Date.now() - t0;
    // Dans l'espace parents : critères assouplis (pas d'enfant susceptible de
    // déclencher par accident) — un glissement horizontal net suffit.
    if (etat.vue === "reglages") {
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        glisserVers(dx < 0 ? 1 : -1, () => changerOngletParentRelatif(dx < 0 ? 1 : -1));
      }
      return;
    }
    // Vues enfant : critères stricts (geste long, net et rapide).
    const horizontalNet = Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 2.5;
    const assezRapide = duree < 600 && (Math.abs(dx) / duree) > 0.25; // px/ms
    if (horizontalNet && assezRapide) {
      const dir = dx < 0 ? 1 : -1;
      glisserVers(dir, () => changerEnfantRelatif(dir));
    }
  }, { passive: true });
}

// Composant « liste déroulante » natif (accessible) : un <details> stylé.
// titre : texte du résumé ; ouvert : déplié par défaut ; cle : identifiant
// stable pour mémoriser l'état ouvert/fermé à travers les re-rendus.
const pliablesOuverts = new Set();
// Mémoire d'ouverture d'un <details>, partagée par blocPliable et par les
// dépliants écrits directement en HTML. Un défaut « ouvert » ne s'impose
// jamais à un utilisateur qui a explicitement refermé le bloc.
function memoriserPli(det, cle, ouvertParDefaut) {
  if (!det) return det;
  if (!cle) { det.open = !!ouvertParDefaut; return det; }
  det.open = pliablesOuverts.has(cle) || (!!ouvertParDefaut && !pliablesFermes.has(cle));
  det.addEventListener("toggle", () => {
    if (det.open) { pliablesOuverts.add(cle); pliablesFermes.delete(cle); }
    else { pliablesOuverts.delete(cle); pliablesFermes.add(cle); }
  });
  return det;
}
function blocPliable(titre, ouvert, cle) {
  const d = el("details", "pliable");
  const s = el("summary", "pliable-tete", titre);
  const corps = el("div", "pliable-corps");
  d.appendChild(s);
  d.appendChild(corps);
  memoriserPli(d, cle, ouvert);
  return { details: d, corps };
}
const pliablesFermes = new Set();   // clés explicitement refermées par l'utilisateur

// Sélecteur de langue « fun » : un bouton-drapeau par langue, celui actif est
// mis en avant. `onChange` est appelé après le changement de langue.
function selecteurLangueFun(onChange) {
  const wrap = el("div", "langue-choix");
  Object.keys(LANGUES).forEach(l => {
    const b = el("button", "langue-btn" + (l === langue ? " actif" : ""));
    b.type = "button";
    b.innerHTML = `<span class="langue-drapeau">${drapeau(l)}</span><span class="langue-nom">${LANGUES[l]}</span>`;
    b.onclick = () => {
      if (l === langue) return;
      definirLangue(l);
      if (onChange) onChange();
    };
    wrap.appendChild(b);
  });
  return wrap;
}

/* ---------- Tutoriel d'accueil (carrousel) ---------- */
let tutoEnCours = false;

// Affiche le tutoriel au tout premier lancement du compte (une seule fois).
// Appelé après le chargement des données réelles (cf. auth.js).
function verifierTuto() {
  if (tutoEnCours) return;
  if (!etat || !etat.reglages) return;
  if (typeof modeDemo !== "undefined" && modeDemo) {
    if (window.__tutoDemoVu) return;       // en démo : une fois par session
  } else if (etat.reglages.tutoVu) return; // compte réel : mémorisé
  lancerTuto();
}

// Visite guidée superposée à l'application : on met en lumière de vraies zones
// (sélecteur d'enfants, missions, onglets…) avec une bulle explicative.
function lancerTuto() {
  if (document.getElementById("tuto-tour")) return;
  tutoEnCours = true;
  // On se place sur l'accueil pour que les zones ciblées existent.
  etat.vue = "accueil";
  rendre();

  // Étapes : sel = sélecteur de la zone à éclairer (null = bulle centrée).
  const etapes = [
    { sel: null, e: "🌟", t: t("tuto.s1_t"), d: t("tuto.s1_d") },
    { sel: "#selecteur-enfant", e: "👧", t: t("tuto.s2_t"), d: t("tuto.s2_d") },
    { sel: ".mission", e: "✅", t: t("tuto.s3_t"), d: t("tuto.s3_d") },
    { sel: "#timer-btn", e: "⏱️", t: t("tuto.s4_t"), d: t("tuto.s4_d") },
    // La réparation est le parti pris central de l'application, et le
    // tutoriel n'en disait rien. Placée juste après le minuteur : les deux
    // pastilles de l'en-tête se présentent ainsi d'affilée.
    { sel: "#pastille-reparer", e: "🌈", t: t("tuto.rep_t"), d: t("tuto.rep_d") },
    // Les cartes FamiTeam n'étaient présentées nulle part, alors qu'elles sont
    // le seul objectif COLLECTIF de l'app. Placée avant l'avatar, dans l'ordre
    // de la barre de navigation (Accueil, Famille, Planète, Avatar).
    { sel: '.nav-btn[data-vue="famille"]', e: "🎁", t: t("tuto.cartes_t"), d: t("tuto.cartes_d") },
    { sel: '.nav-btn[data-vue="avatar"]', e: "🎨", t: t("tuto.s5_t"), d: t("tuto.s5_d") },
    { sel: '.nav-btn[data-vue="planete"]', e: "🌍", t: t("tuto.s6_t"), d: t("tuto.s6_d") },
    { sel: '.nav-btn[data-vue="reglages"]', e: "⚙️", t: t("tuto.s7_t"), d: t("tuto.s7_d") },
    { sel: null, e: "🤝", t: t("tuto.s8_t"), d: t("tuto.s8_d") }
  ];
  let i = 0;

  const ov = el("div", "tuto-tour"); ov.id = "tuto-tour";
  ov.innerHTML = `
    <div class="tour-trou"></div>
    <div class="tour-bulle">
      <button class="tuto-passer">${t("tuto.passer")}</button>
      <div class="tuto-emoji"></div>
      <h2 class="tuto-titre"></h2>
      <p class="tuto-texte"></p>
      <div class="tuto-dots"></div>
      <div class="tuto-nav">
        <button class="btn-secondaire tuto-prec"></button>
        <button class="gros-bouton planete tuto-suiv"></button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const trou = ov.querySelector(".tour-trou");
  const bulle = ov.querySelector(".tour-bulle");

  const terminer = () => {
    if (typeof modeDemo !== "undefined" && modeDemo) window.__tutoDemoVu = true;
    else { if (!etat.reglages) etat.reglages = {}; etat.reglages.tutoVu = true; sauver(); }
    window.removeEventListener("resize", reposition);
    ov.remove(); tutoEnCours = false; rendre();
  };

  // Place la lumière sur la cible et positionne la bulle au mieux.
  function positionner() {
    const s = etapes[i];
    const cible = s.sel ? document.querySelector(s.sel) : null;
    if (!cible) {
      trou.style.display = "none";
      bulle.classList.add("centre");
      bulle.style.left = ""; bulle.style.top = "";
      return;
    }
    bulle.classList.remove("centre");
    const r = cible.getBoundingClientRect();
    const pad = 8;
    trou.style.display = "block";
    trou.style.left = (r.left - pad) + "px";
    trou.style.top = (r.top - pad) + "px";
    trou.style.width = (r.width + pad * 2) + "px";
    trou.style.height = (r.height + pad * 2) + "px";
    // Bulle au-dessus si la cible est dans la moitié basse, sinon en-dessous.
    const bh = bulle.offsetHeight || 200;
    const bw = bulle.offsetWidth || 300;
    const enBas = r.top > window.innerHeight / 2;
    let top = enBas ? (r.top - pad - bh - 12) : (r.bottom + pad + 12);
    top = Math.max(10, Math.min(top, window.innerHeight - bh - 10));
    let left = r.left + r.width / 2 - bw / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - bw - 10));
    bulle.style.left = left + "px";
    bulle.style.top = top + "px";
  }
  const reposition = () => positionner();

  const maj = () => {
    const s = etapes[i];
    // On amène la zone ciblée à l'écran avant de l'éclairer (sinon le halo
    // peut tomber hors de la vue, surtout pour les missions plus bas).
    const cible = s.sel ? document.querySelector(s.sel) : null;
    if (cible && cible.scrollIntoView) cible.scrollIntoView({ block: "center", inline: "center" });
    bulle.querySelector(".tuto-emoji").textContent = s.e;
    bulle.querySelector(".tuto-titre").textContent = s.t;
    bulle.querySelector(".tuto-texte").innerHTML = s.d;
    bulle.querySelector(".tuto-dots").innerHTML = etapes.map((_, k) =>
      `<span class="tuto-dot${k === i ? " on" : ""}"></span>`).join("");
    const prec = bulle.querySelector(".tuto-prec");
    prec.style.visibility = i === 0 ? "hidden" : "visible";
    prec.textContent = t("tuto.precedent");
    bulle.querySelector(".tuto-suiv").textContent = (i === etapes.length - 1) ? t("tuto.commencer") : t("tuto.suivant");
    // Laisse le DOM défiler/mesurer avant de positionner (double frame).
    requestAnimationFrame(() => requestAnimationFrame(positionner));
  };

  ov.querySelector(".tuto-passer").onclick = terminer;
  bulle.querySelector(".tuto-prec").onclick = () => { if (i > 0) { i--; maj(); } };
  bulle.querySelector(".tuto-suiv").onclick = () => { if (i < etapes.length - 1) { i++; maj(); } else terminer(); };
  window.addEventListener("resize", reposition);
  maj();
}
