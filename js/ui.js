/* =====================================================================
 * FamiTeam — Rendu de l'interface
 * ===================================================================== */

// Affichage de la section abonnement (masquée tant que les utilisateurs
// actuels sont des « early adopters » avec usage gratuit).
const AFFICHER_ABONNEMENT = false;

// Animation festive à l'obtention d'un nouveau badge.
function animationBadge(emoji, nom) {
  const ov = el("div", "badge-pop");
  ov.innerHTML = `
    <div class="badge-pop-carte">
      <div class="badge-pop-rayons">${emoji}</div>
      <div class="badge-pop-titre">Nouveau badge !</div>
      <div class="badge-pop-nom">${nom}</div>
    </div>`;
  document.body.appendChild(ov);
  if (typeof confettis === "function") confettis();
  const fermer = () => ov.remove();
  ov.addEventListener("click", fermer);
  setTimeout(fermer, 2800);
}

// Félicite et remercie le parrain quand un·e filleul·e a créé sa famille.
function feterParrainage(nb) {
  const ov = el("div", "badge-pop");
  const sfx = nb > 1 ? `${nb} familles ont` : "Une famille a";
  ov.innerHTML = `
    <div class="badge-pop-carte parrain-pop">
      <div class="badge-pop-rayons">🎉</div>
      <div class="badge-pop-titre">Merci & bravo ! 💛</div>
      <div class="badge-pop-nom">${sfx} rejoint ${APP_NOM} grâce à toi.<br>Tu répands les ondes positives ! 🤝🌍</div>
    </div>`;
  document.body.appendChild(ov);
  if (typeof confettis === "function") confettis();
  const fermer = () => ov.remove();
  ov.addEventListener("click", fermer);
  setTimeout(fermer, 4200);
}

// Saisie d'un code PIN : masqué par des points, clavier numérique sur mobile.
function demanderPin(opts) {
  opts = opts || {};
  const ov = el("div", "pin-modal");
  ov.innerHTML = `
    <div class="pin-carte">
      <div class="pin-titre">${opts.titre || "🔒 Code PIN"}</div>
      ${opts.sousTitre ? `<div class="pin-sous">${opts.sousTitre}</div>` : ""}
      <input id="pin-input" type="text" inputmode="numeric" pattern="[0-9]*"
             name="pin-parent" autocomplete="one-time-code" maxlength="8"
             data-lpignore="true" data-1p-ignore data-form-type="other"
             class="pin-input" placeholder="••••">
      <p id="pin-err" class="pin-err" style="display:none"></p>
      <div class="pin-actions">
        <button id="pin-annuler" class="btn-secondaire">Annuler</button>
        <button id="pin-ok" class="gros-bouton planete">Valider</button>
      </div>
      ${opts.permettreOubli ? `<button id="pin-oubli" class="lien-oubli">${t("pin.oublie")}</button>` : ""}
    </div>`;
  document.body.appendChild(ov);
  const inp = ov.querySelector("#pin-input");
  const err = ov.querySelector("#pin-err");
  const fermer = () => ov.remove();
  // Affiche une erreur SANS fermer la modale (ex. mauvais code PIN), et fait
  // apparaître le lien de réinitialisation si ce n'est pas déjà le cas.
  const montrerErreur = (msg) => {
    if (err) { err.textContent = msg || t("pin.faux"); err.style.display = "block"; }
    inp.value = ""; inp.focus();
    let lien = ov.querySelector("#pin-oubli");
    if (!lien) {
      lien = el("button", "lien-oubli", t("pin.oublie"));
      lien.id = "pin-oubli";
      ov.querySelector(".pin-carte").appendChild(lien);
      lien.onclick = () => { fermer(); reinitPinParMail(opts.onReset || null); };
    }
  };
  const valider = () => {
    const v = inp.value;
    if (!opts.permettreVide && !v.trim()) { inp.focus(); return; }
    // onOk peut renvoyer false pour signaler un code invalide : on garde la
    // modale ouverte et on affiche le message d'erreur.
    if (opts.onOk) {
      const res = opts.onOk(v);
      if (res === false) { montrerErreur(opts.msgErreur); return; }
    }
    fermer();
  };
  ov.querySelector("#pin-ok").onclick = valider;
  ov.querySelector("#pin-annuler").onclick = () => { fermer(); if (opts.onCancel) opts.onCancel(); };
  const bOubli = ov.querySelector("#pin-oubli");
  if (bOubli) bOubli.onclick = () => { fermer(); reinitPinParMail(opts.onReset || null); };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") valider(); });
  // Ouvre tout de suite le clavier (numérique) du smartphone.
  setTimeout(() => { inp.focus(); inp.click(); }, 50);
}

// Réinitialisation du code PIN parental oublié, par e-mail. On envoie un code
// à usage unique à l'adresse du compte (preuve que c'est bien le parent), puis
// on permet de choisir un nouveau PIN. `apresOk` poursuit l'action en cours
// (ex. ouvrir l'espace parents, déverrouiller l'écran) une fois le PIN changé.
async function reinitPinParMail(apresOk) {
  if (typeof modeDemo !== "undefined" && modeDemo) { toast("Indisponible en mode démo 🧪", "info"); return; }
  const u = (typeof utilisateurCourant === "function") ? utilisateurCourant() : null;
  const email = u && u.email;
  if (!email) { toast(t("pin.reset_pas_email"), "info"); return; }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  toast(t("pin.reset_envoi"), "info");
  const res = await envoyerMailFn({
    to: email,
    subject: t("pin.reset_sujet"),
    text: t("pin.reset_corps", { code, app: APP_NOM })
  });
  if (!res || !res.ok) { toast(t("pin.reset_echec", { detail: (res && res.detail) || "" }), "info"); return; }
  // 1) Saisie du code reçu par e-mail.
  demanderPin({
    titre: t("pin.reset_titre"),
    sousTitre: t("pin.reset_sous", { email }),
    msgErreur: t("pin.reset_code_faux"),
    onOk: (saisi) => {
      if (saisi.trim() !== code) return false;
      // 2) Choix d'un nouveau PIN (vide = supprimer le PIN).
      demanderPin({
        titre: t("pin.nouveau_titre"),
        sousTitre: t("pin.nouveau_sous"),
        permettreVide: true,
        onOk: (nv) => {
          if (!etat.reglages) etat.reglages = {};
          etat.reglages.codeParent = (nv || "").trim();
          sauver();
          toast(etat.reglages.codeParent ? t("pin.maj_ok") : t("pin.efface_ok"), "succes");
          if (apresOk) apresOk();
        }
      });
    }
  });
}

// Modale rapide pour parrainer une autre famille (depuis la pastille en-tête).
function modaleParrainage() {
  const ov = el("div", "pin-modal");
  ov.innerHTML = `
    <div class="pin-carte parrain-modale">
      <button class="modale-fermer" aria-label="Fermer">✕</button>
      <div class="pin-titre">🎁 Inviter une famille amie</div>
      <p class="note">Offre ${APP_NOM} à des amis : ils créeront <strong>leur propre famille</strong>.</p>
      <p id="pm-quota" class="note">Vérification de ton quota…</p>
      <div id="pm-zone"></div>
      <button id="pm-creer" class="gros-bouton planete">🎁 Créer un lien de parrainage</button>
    </div>`;
  document.body.appendChild(ov);
  const fermer = () => ov.remove();
  ov.querySelector(".modale-fermer").onclick = fermer;
  ov.addEventListener("click", e => { if (e.target === ov) fermer(); });

  const zone = ov.querySelector("#pm-zone");
  const bCreer = ov.querySelector("#pm-creer");
  const illimite = (typeof INVITATIONS_ILLIMITEES !== "undefined" && INVITATIONS_ILLIMITEES) || (typeof estAdmin !== "undefined" && estAdmin);
  const majQuota = () => parrainageRestant().then(n => {
    const q = ov.querySelector("#pm-quota");
    if (illimite) { q.innerHTML = t("parr.illimite"); bCreer.disabled = false; }
    else { q.innerHTML = t("parr.restant", { n }); bCreer.disabled = n <= 0; }
  });
  majQuota();
  bCreer.onclick = async () => {
    bCreer.disabled = true; bCreer.textContent = t("common.creation");
    const lien = await creerParrainage();
    bCreer.textContent = t("parr.creer");
    if (lien) {
      montrerLienInvitation(zone, lien, t("parr.partage"), {
        sujet: t("parr.sujet", { app: APP_NOM }),
        corps: t("parr.corps", { app: APP_NOM, lien: "{lien}" })
      });
    }
    majQuota();
  };
}

function initSquelette() {
  document.body.innerHTML = `
    <div id="confettis"></div>
    <div id="toast" class="toast"></div>

    <div class="haut-fixe">
    <header class="topbar">
      <button id="pastille-inviter" class="pastille-inviter" title="Inviter une autre famille">🎁<span id="pastille-badge" class="pastille-badge"></span></button>
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
    b.addEventListener("click", () => { etat.vue = b.dataset.vue; ecrireCache(); rendre(); }));

  // Pastille « inviter une autre famille » (parrainage rapide).
  const pInv = document.getElementById("pastille-inviter");
  if (pInv) pInv.onclick = () => {
    if (typeof modeDemo !== "undefined" && modeDemo) { toast("Indisponible en mode démo 🧪", "info"); return; }
    modaleParrainage();
  };
  majPastilleInvit();

  // Bouton minuteur de temps d'écran (verrouillage PIN).
  const bTimer = document.getElementById("timer-btn");
  if (bTimer) bTimer.onclick = () => {
    if (typeof modeDemo !== "undefined" && modeDemo) { toast("Indisponible en mode démo 🧪", "info"); return; }
    if (timerEtat.actif) modaleTimerActif();
    else modaleTimer();
  };
  majBoutonTimer();

  // Minuteur : le bandeau dodo suit l'heure en continu (toutes les 20 s).
  if (!window.__dodoTimer) window.__dodoTimer = setInterval(majDodo, 20000);

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
function blocPliable(titre, ouvert, cle) {
  const d = el("details", "pliable");
  const estOuvert = cle ? (pliablesOuverts.has(cle) || (ouvert && !pliablesFermes.has(cle))) : !!ouvert;
  if (estOuvert) d.open = true;
  const s = el("summary", "pliable-tete", titre);
  const corps = el("div", "pliable-corps");
  d.appendChild(s);
  d.appendChild(corps);
  if (cle) d.addEventListener("toggle", () => {
    if (d.open) { pliablesOuverts.add(cle); pliablesFermes.delete(cle); }
    else { pliablesOuverts.delete(cle); pliablesFermes.add(cle); }
  });
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


// Synchronise l'affichage du minuteur avec son état (appelé à chaque rendu).
function synchroniserTimerUI() {
  if (timerEtat.verrouille) { afficherVerrou(); return; }
  masquerVerrou();
  if (timerEtat.choix) { afficherChoixEnfant(); masquerBandeauTimer(); majBoutonTimer(); return; }
  masquerChoixEnfant();
  if (!timerEtat.prep) masquerPrep();
  if (timerEtat.actif) {
    if (!timerInterval) lancerTickTimer(); else tickTimer();
  } else {
    masquerBandeauTimer();
  }
  majBoutonTimer();
}

// Écran « qui continue ? » : un enfant a épuisé son temps mais d'autres en ont
// encore. On affiche chaque enfant disponible avec le temps qu'il lui reste.
function afficherChoixEnfant() {
  if (document.getElementById("choix-enfant")) return;   // déjà affiché
  masquerBandeauTimer();
  const ov = el("div", "verrou-ecran");
  ov.id = "choix-enfant";
  const dispo = (typeof restesDisponibles === "function") ? restesDisponibles() : [];
  let cartes = "";
  dispo.forEach(enf => {
    const reste = tempsRestantEnfant(enf.id);
    cartes += `<button class="choix-enf" data-id="${enf.id}" style="--c:${enf.couleur}">
        ${vignetteEnfant(enf, "moyen")}
        <span class="choix-nom">${echapper(enf.prenom)}</span>
        <span class="choix-temps">${mmss(reste)}</span>
      </button>`;
  });
  ov.innerHTML = `
    <div class="verrou-carte choix-carte">
      <div class="verrou-emoji">⏰</div>
      <h2>${t("choix.titre")}</h2>
      <p>${t("choix.texte")}</p>
      <div class="choix-liste">${cartes}</div>
      <button id="choix-stop" class="lien-oubli">${t("choix.arreter")}</button>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelectorAll(".choix-enf").forEach(b => {
    b.onclick = () => continuerAvecEnfant(b.dataset.id);
  });
  const stop = ov.querySelector("#choix-stop");
  if (stop) stop.onclick = () => {
    // Arrêter le minuteur depuis l'écran de choix (PIN si défini).
    if (etat.reglages && etat.reglages.codeParent) {
      demanderPin({
        titre: t("timer.arret_titre"), sousTitre: t("timer.arret_pin"),
        permettreOubli: true, onReset: () => arreterTimer(),
        onOk: (s) => { if (s.trim() !== etat.reglages.codeParent) return false; arreterTimer(); }
      });
    } else if (confirm(t("timer.arret_confirm"))) arreterTimer();
  };
}
function masquerChoixEnfant() {
  const ov = document.getElementById("choix-enfant");
  if (ov) ov.remove();
}

// Met à jour l'icône / le texte du bouton minuteur en haut.
function majBoutonTimer() {
  const b = document.getElementById("timer-btn");
  if (!b) return;
  b.classList.toggle("actif", !!timerEtat.actif);
  if (timerEtat.actif && timerEtat.prep) {
    b.textContent = "⏳ " + Math.max(0, Math.ceil((timerEtat.prep - Date.now()) / 1000));
  } else if (timerEtat.actif) {
    const reste = Math.max(0, timerEtat.fin - Date.now());
    b.textContent = "⏱️ " + mmss(reste);
  } else {
    b.textContent = "⏱️";
  }
}

// Décompte « prépare-toi » plein écran (5 s) après un changement d'enfant.
function majAffichagePrep(restePrep) {
  masquerBandeauTimer();
  const enf = enfantActif();
  let ov = document.getElementById("prep-ecran");
  if (!ov) {
    ov = el("div", "prep-ecran");
    ov.id = "prep-ecran";
    ov.innerHTML = `
      <div class="prep-carte">
        <div id="prep-emoji" class="prep-emoji"></div>
        <h2 id="prep-titre"></h2>
        <div id="prep-num" class="prep-num"></div>
        <p class="prep-sous">${t("prep.sous")}</p>
      </div>`;
    document.body.appendChild(ov);
  }
  const em = ov.querySelector("#prep-emoji");
  const ti = ov.querySelector("#prep-titre");
  const nu = ov.querySelector("#prep-num");
  if (em && enf) em.innerHTML = vignetteEnfant(enf, "grand");
  if (ti && enf) ti.textContent = t("prep.titre", { prenom: enf.prenom });
  const sec = Math.max(0, Math.ceil(restePrep / 1000));
  if (nu) {
    if (nu.textContent !== String(sec)) {
      nu.textContent = sec;
      nu.classList.remove("pulse"); void nu.offsetWidth; nu.classList.add("pulse");
    }
  }
}
function masquerPrep() {
  const ov = document.getElementById("prep-ecran");
  if (ov) ov.remove();
}

// Met à jour la jauge visuelle (bandeau) pour les enfants.
function majAffichageTimer(reste, total) {
  majBoutonTimer();
  const band = document.getElementById("timer-bandeau");
  const rempl = document.getElementById("timer-jauge-rempl");
  const txt = document.getElementById("timer-bandeau-temps");
  const ic = document.getElementById("timer-bandeau-icone");
  if (!band || !rempl || !txt) return;
  band.style.display = "flex";
  const pct = total > 0 ? Math.max(0, Math.min(100, (reste / total) * 100)) : 0;
  rempl.style.width = pct + "%";
  txt.textContent = mmss(reste);
  // Couleur + émotion selon le temps restant.
  let niv = "ok";
  if (pct <= 15) niv = "fin";
  else if (pct <= 40) niv = "bientot";
  band.className = "timer-bandeau niv-" + niv;
  if (ic) ic.textContent = niv === "fin" ? "⏰" : niv === "bientot" ? "⏳" : "⏳";
}
function masquerBandeauTimer() {
  const band = document.getElementById("timer-bandeau");
  if (band) band.style.display = "none";
}
// Formate des millisecondes en M:SS.
function mmss(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return m + ":" + String(s % 60).padStart(2, "0");
}

// Modale de configuration + démarrage du minuteur.
function modaleTimer() {
  const ov = el("div", "pin-modal");
  const mode = (typeof timerMode === "function") ? timerMode() : "parEnfant";
  const duree = (typeof timerDureeMin === "function") ? timerDureeMin() : 3;
  ov.innerHTML = `
    <div class="pin-carte timer-modale">
      <button class="modale-fermer" aria-label="Fermer">✕</button>
      <div class="pin-titre">${t("timer.titre")}</div>
      <p class="note">${t("timer.intro")}</p>
      <label class="champ">${t("timer.duree")}
        <input id="tm-duree" type="number" min="1" max="120" inputmode="numeric" value="${duree}">
      </label>
      <div class="timer-modes">
        <label class="radio-ligne"><input type="radio" name="tm-mode" value="parEnfant" ${mode !== "global" ? "checked" : ""}> ${t("timer.mode_enfant")}</label>
        <label class="radio-ligne"><input type="radio" name="tm-mode" value="global" ${mode === "global" ? "checked" : ""}> ${t("timer.mode_global")}</label>
      </div>
      ${etat.reglages && etat.reglages.codeParent ? "" : `<p class="note timer-avert">${t("timer.sans_pin")}</p>`}
      <button id="tm-go" class="gros-bouton planete">${t("timer.demarrer")}</button>
    </div>`;
  document.body.appendChild(ov);
  const fermer = () => ov.remove();
  ov.querySelector(".modale-fermer").onclick = fermer;
  ov.addEventListener("click", e => { if (e.target === ov) fermer(); });
  ov.querySelector("#tm-go").onclick = () => {
    const d = ov.querySelector("#tm-duree").value;
    const m = (ov.querySelector('input[name="tm-mode"]:checked') || {}).value || "parEnfant";
    definirReglageTimer(d, m);
    fermer();
    demarrerTimer();
  };
}

// Modale quand un minuteur tourne déjà : arrêter (PIN si défini).
function modaleTimerActif() {
  const ouvrir = () => modaleTimerOptions();
  if (etat.reglages && etat.reglages.codeParent) {
    demanderPin({
      titre: t("timer.arret_titre"),
      sousTitre: t("timer.arret_pin"),
      permettreOubli: true,
      onReset: () => ouvrir(),
      onOk: (saisi) => {
        if (saisi.trim() !== etat.reglages.codeParent) return false;
        ouvrir();
      }
    });
  } else {
    ouvrir();
  }
}

// Après le code PIN : choix entre arrêter le minuteur ou remettre du temps
// (par enfant en mode « par enfant », global sinon).
function modaleTimerOptions() {
  const duree = (typeof timerDureeMin === "function") ? timerDureeMin() : 3;
  const ov = el("div", "pin-modal");
  ov.innerHTML = `
    <div class="pin-carte timer-modale">
      <button class="modale-fermer" aria-label="Fermer">✕</button>
      <div class="pin-titre">${t("timer.opt_titre")}</div>
      <button id="to-stop" class="btn-danger" style="width:100%">${t("timer.opt_arreter")}</button>
      <p class="planif-sous">${t("timer.opt_ajouter", { min: duree })}</p>
      <div id="to-zone" class="planif-enfants"></div>
    </div>`;
  document.body.appendChild(ov);
  const fermer = () => ov.remove();
  ov.querySelector(".modale-fermer").onclick = fermer;
  ov.addEventListener("click", e => { if (e.target === ov) fermer(); });
  ov.querySelector("#to-stop").onclick = () => { arreterTimer(); fermer(); };

  const zone = ov.querySelector("#to-zone");
  const ms = duree * 60000;
  if ((typeof timerMode === "function" ? timerMode() : "parEnfant") === "global") {
    const b = el("button", "gros-bouton planete", t("timer.opt_plus", { min: duree }));
    b.onclick = () => { ajouterTempsGlobal(ms); toast(t("timer.temps_ajoute", { min: duree }), "succes"); fermer(); };
    zone.appendChild(b);
  } else {
    Object.values(etat.enfants).forEach(enf => {
      const reste = tempsRestantLive(enf.id);
      const b = el("button", "enf-chip", `${echapper(enf.prenom)} · +${duree} min <small>(${mmss(reste)})</small>`);
      b.onclick = () => { ajouterTempsEnfant(enf.id, ms); toast(t("timer.temps_ajoute_enf", { prenom: enf.prenom, min: duree }), "succes"); fermer(); };
      zone.appendChild(b);
    });
  }
}

// Temps restant « live » d'un enfant (tient compte du décompte en cours pour
// l'enfant actif).
function tempsRestantLive(id) {
  if (timerEtat.actif && timerEtat.enfant === id && !timerEtat.prep) {
    return Math.max(0, timerEtat.fin - Date.now());
  }
  return tempsRestantEnfant(id);
}

// Écran de verrouillage plein écran (temps écoulé). Déverrouillage par PIN.
function afficherVerrou() {
  if (document.getElementById("verrou-ecran")) return;   // déjà affiché
  masquerBandeauTimer();
  const ov = el("div", "verrou-ecran");
  ov.id = "verrou-ecran";
  const aPin = !!(etat.reglages && etat.reglages.codeParent);
  ov.innerHTML = `
    <div class="verrou-carte">
      <div class="verrou-emoji">🔒</div>
      <h2>${t("verrou.titre")}</h2>
      <p>${t("verrou.texte")}</p>
      ${aPin ? "" : `<p class="note">${t("verrou.sans_pin")}</p>`}
      <button id="verrou-btn" class="gros-bouton planete">${t("verrou.bouton")}</button>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelector("#verrou-btn").onclick = () => {
    if (!aPin) { deverrouillerApp(); return; }
    demanderPin({
      titre: t("verrou.pin_titre"),
      permettreOubli: true,
      onReset: () => deverrouillerApp(),
      onOk: (saisi) => {
        if (saisi.trim() !== etat.reglages.codeParent) return false;
        deverrouillerApp();
      }
    });
  };
}
function masquerVerrou() {
  const ov = document.getElementById("verrou-ecran");
  if (ov) ov.remove();
}

// Met à jour la pastille d'invitation : pastille « qui frétille » quand il
// reste des invitations, avec une bulle indiquant le nombre restant (👑 pour
// l'admin). Discrète et grisée quand le quota est épuisé.
function majPastilleInvit() {
  const pInv = document.getElementById("pastille-inviter");
  const badge = document.getElementById("pastille-badge");
  if (!pInv || !badge) return;
  if (typeof modeDemo !== "undefined" && modeDemo) { badge.style.display = "none"; return; }
  const illimiteInv = (typeof INVITATIONS_ILLIMITEES !== "undefined" && INVITATIONS_ILLIMITEES) || (typeof estAdmin !== "undefined" && estAdmin);
  if (illimiteInv) {
    badge.style.display = "none";          // illimité : pas de pastille de quota
    pInv.classList.add("a-des-invit");
    return;
  }
  parrainageRestant().then(n => {
    if (n > 0) {
      badge.textContent = String(n); badge.style.display = "flex";
      pInv.classList.add("a-des-invit");
    } else {
      badge.style.display = "none";
      pInv.classList.remove("a-des-invit");
    }
  }).catch(() => { badge.style.display = "none"; });
}

// Panneau d'administration : liste de toutes les familles.
// Gestion des blagues par langue (admin) : afficher chaque liste, en ajouter
// et en supprimer. Stockées dans app_config (« blagues_<lang> »), donc actives
// pour toute l'app. Langue affichée mémorisée le temps de la session.
let blgLangAdmin = "fr";
function blocAdminBlagues() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>🃏 ${t("admin.blg_titre")}</h2><p class="note">${t("admin.blg_note")}</p>`;
  if (typeof BLAGUES_ACTIVEES !== "undefined" && !BLAGUES_ACTIVEES) {
    sec.appendChild(el("p", "admin-bientot-badge", "⏸️ " + t("admin.blg_desactivees")));
  }

  // Choix de la langue (onglets)
  const onglets = el("div", "blg-langues");
  Object.keys(BLAGUES_DEFAUT).forEach(lg => {
    const b = el("button", "blg-lang-btn" + (blgLangAdmin === lg ? " on" : ""), (LANGUES[lg] || lg));
    b.onclick = () => { blgLangAdmin = lg; rendre(); };
    onglets.appendChild(b);
  });
  sec.appendChild(onglets);

  const lang = BLAGUES_DEFAUT[blgLangAdmin] ? blgLangAdmin : "fr";
  const liste = blaguesDe(lang);
  sec.appendChild(el("p", "blg-compte", t("admin.blg_total", { n: liste.length })));

  // Liste des blagues avec suppression
  const ul = el("div", "blg-liste");
  liste.forEach((b, i) => {
    const item = el("div", "blg-item");
    item.innerHTML = `<div class="blg-txt"><div class="blg-q">${echapper(b.q)}</div><div class="blg-r">${echapper(b.r)}</div></div>`;
    const del = el("button", "mini-btn danger", "🗑️");
    del.onclick = async () => {
      if (!confirm(t("admin.blg_confirm_suppr"))) return;
      if (await adminSupprimerBlague(lang, i)) { toast(t("admin.maj_ok"), "info"); rendre(); }
    };
    item.appendChild(del);
    ul.appendChild(item);
  });
  sec.appendChild(ul);

  // Ajout d'une blague
  const form = el("div", "blg-form");
  const inQ = el("input", "blg-input"); inQ.type = "text"; inQ.placeholder = t("admin.blg_q");
  const inR = el("input", "blg-input"); inR.type = "text"; inR.placeholder = t("admin.blg_r");
  const add = el("button", "gros-bouton planete", "➕ " + t("admin.blg_ajouter"));
  add.onclick = async () => {
    if (await adminAjouterBlague(lang, inQ.value, inR.value)) {
      toast(t("admin.blg_ajoutee"), "succes");
      rendre();
    }
  };
  form.appendChild(inQ);
  form.appendChild(inR);
  form.appendChild(add);
  sec.appendChild(form);
  return sec;
}

// Tableau de bord « science » (admin) : centralise les paramètres fondés sur
// la psychologie, la pédagogie et la neurologie. Ajustables par l'admin et un
// comité d'experts ; enregistrés dans app_config (clé "science"), donc actifs
// pour toute l'app.
function blocDashboardScience() {
  const sec = el("section", "carte science-carte");
  const cfg = scienceConf();
  sec.innerHTML = `<h2>${t("sci.titre")}</h2><p class="note">${t("sci.note")}</p>`;
  const refs = {};   // références des champs pour la sauvegarde

  // --- 1. Temps d'écran (neurologie) ---
  {
    const { details, corps } = blocPliable(`🧠 ${t("sci.ecran")}`, true);
    const lBudget = el("label", "champ", t("sci.budget_min"));
    refs.budget = el("input", "perso-num"); refs.budget.type = "number"; refs.budget.min = "1"; refs.budget.max = "60";
    refs.budget.value = cfg.budgetMinJour; lBudget.appendChild(refs.budget); corps.appendChild(lBudget);

    corps.appendChild(el("p", "sous-titre", t("sci.taches_age")));
    refs.taches = [];
    (cfg.tachesParAge || []).forEach((b, i) => {
      const l = el("label", "champ-mini", t("sci.jusqua", { age: b.max >= 99 ? "8+" : b.max }));
      const inp = el("input", "perso-num"); inp.type = "number"; inp.min = "1"; inp.max = "12"; inp.value = b.n;
      l.appendChild(inp); corps.appendChild(l);
      refs.taches.push({ max: b.max, inp });
    });
    const lPart = el("label", "champ", t("sci.part_famille"));
    refs.part = el("input", "perso-num"); refs.part.type = "number"; refs.part.min = "0"; refs.part.max = "100";
    refs.part.value = Math.round((cfg.partFamille || 0.6) * 100); lPart.appendChild(refs.part); corps.appendChild(lPart);
    sec.appendChild(details);
  }

  // --- 2. Incentives sains (psychologie de la motivation) ---
  {
    const { details, corps } = blocPliable(`💛 ${t("sci.incentives")}`);
    const lMax = el("label", "champ", t("sci.points_max"));
    refs.pointsMax = el("input", "perso-num"); refs.pointsMax.type = "number"; refs.pointsMax.min = "1"; refs.pointsMax.max = "20";
    refs.pointsMax.value = cfg.pointsMax; lMax.appendChild(refs.pointsMax); corps.appendChild(lMax);
    const lCel = el("label", "switch-ligne");
    refs.celebrer = el("input"); refs.celebrer.type = "checkbox"; refs.celebrer.checked = cfg.celebrer !== false;
    lCel.appendChild(refs.celebrer); lCel.appendChild(el("span", null, t("sci.celebrer")));
    corps.appendChild(lCel);
    sec.appendChild(details);
  }

  // --- 3. Âge conseillé par mission (pédagogie) ---
  {
    const { details, corps } = blocPliable(`🎯 ${t("sci.ages_missions")}`);
    refs.ages = {};
    ["famille", "planete"].forEach(catId => {
      corps.appendChild(el("p", "sous-titre", `${CATEGORIES[catId].emoji} ${trData("cat", catId + ".nom", CATEGORIES[catId].nom)}`));
      MISSIONS.filter(m => m.cat === catId).forEach(m => {
        const ligne = el("div", "perso-ligne");
        ligne.appendChild(el("span", "perso-lbl", `${m.emoji} ${titreMission(m)}`));
        const inp = el("input", "perso-num"); inp.type = "number"; inp.min = "1"; inp.max = "12";
        inp.value = ageMinMission(m);
        ligne.appendChild(inp); ligne.appendChild(el("span", "perso-unite", t("sci.ans")));
        corps.appendChild(ligne);
        refs.ages[m.id] = { inp, def: m.ageMin };
      });
    });
    sec.appendChild(details);
  }

  // --- 4. Repères & propositions des experts (texte) ---
  {
    const { details, corps } = blocPliable(`📚 ${t("sci.reperes")}`);
    refs.principes = {};
    [["psychologie", "🧩"], ["pedagogie", "🎓"], ["neurologie", "🧠"]].forEach(([dom, emo]) => {
      corps.appendChild(el("p", "sous-titre", `${emo} ${t("sci.dom_" + dom)}`));
      const ta = el("textarea", "sci-texte");
      ta.rows = 4; ta.value = ((cfg.principes || {})[dom] || []).join("\n");
      corps.appendChild(ta); refs.principes[dom] = ta;
    });
    corps.appendChild(el("p", "sous-titre", `💡 ${t("sci.propositions")}`));
    refs.propositions = el("textarea", "sci-texte"); refs.propositions.rows = 4;
    refs.propositions.value = (cfg.propositions || []).join("\n");
    corps.appendChild(refs.propositions);
    sec.appendChild(details);
  }

  // --- Enregistrement (app-wide via app_config) ---
  const linesToArr = (s) => s.split("\n").map(x => x.trim()).filter(Boolean);
  const bSave = el("button", "gros-bouton planete", t("sci.enregistrer"));
  bSave.onclick = async () => {
    const conf = {
      budgetMinJour: Math.max(1, parseInt(refs.budget.value, 10) || 3),
      tachesParAge: refs.taches.map(x => ({ max: x.max, n: Math.max(1, parseInt(x.inp.value, 10) || 3) })),
      partFamille: Math.min(1, Math.max(0, (parseInt(refs.part.value, 10) || 60) / 100)),
      pointsMax: Math.max(1, parseInt(refs.pointsMax.value, 10) || 5),
      celebrer: refs.celebrer.checked,
      ageMission: {},
      principes: {
        psychologie: linesToArr(refs.principes.psychologie.value),
        pedagogie: linesToArr(refs.principes.pedagogie.value),
        neurologie: linesToArr(refs.principes.neurologie.value)
      },
      propositions: linesToArr(refs.propositions.value)
    };
    // On ne stocke que les âges qui diffèrent du catalogue (config compacte).
    Object.keys(refs.ages).forEach(id => {
      const v = parseInt(refs.ages[id].inp.value, 10);
      if (v && v !== refs.ages[id].def) conf.ageMission[id] = v;
    });
    bSave.disabled = true; bSave.textContent = t("sci.enreg_cours");
    let ok = false;
    try { ok = await adminDefinirConfig("science", JSON.stringify(conf)); } catch (e) { ok = false; }
    bSave.disabled = false; bSave.textContent = t("sci.enregistrer");
    if (ok) { toast(t("sci.enreg_ok"), "succes"); rendre(); }
    else toast(t("sci.enreg_err"), "info");
  };
  sec.appendChild(bSave);
  sec.appendChild(el("p", "note", t("sci.diffusion")));
  return sec;
}

// Sous-section « Familles » de l'onglet Admin : liste de toutes les familles
// (plan, modération, suppression) + liste d'attente des candidats.
function blocAdminFamilles() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("admin.titre")}</h2>
    <p class="note">${t("admin.note")}</p>`;
  const b = el("button", "btn-secondaire", t("admin.charger"));
  const liste = el("div", "admin-liste");
  b.onclick = async () => {
    b.disabled = true; b.textContent = t("common.chargement");
    const familles = await adminListerFamilles();
    b.disabled = false; b.textContent = t("admin.recharger");
    liste.innerHTML = "";
    liste.appendChild(el("p", "note", t("admin.familles", {n: familles.length})));
    familles.forEach(f => {
      const maj = f.updated_at ? new Date(f.updated_at).toLocaleDateString("fr-BE") : "—";
      const active = familleActive && familleActive.id === f.id;
      const ligne = el("div", "admin-item" + (active ? " actif" : ""));
      ligne.innerHTML = `<div class="adm-info"><strong>${echapper(f.name)}${active ? " ✅" : ""}</strong>
        <small>${echapper(f.owner_email || "?")} · ${f.members} membre(s) · ${f.plan} · maj ${maj}</small></div>`;
      const open = el("button", "mini-btn ok", active ? t("admin.ouverte") : t("admin.ouvrir"));
      open.disabled = active;
      open.onclick = async () => { await adminOuvrirFamille(f); toast(t("admin.ouverte_toast", {nom: f.name}), "info"); };
      const plan = el("button", "mini-btn", f.plan === "premium" ? "→ free" : "→ premium");
      plan.onclick = async () => {
        await adminMajPlan(f.id, f.plan === "premium" ? "free" : "premium");
        b.onclick();
      };
      ligne.appendChild(plan); ligne.appendChild(open);

      // --- Catégorisation / modération du compte (par e-mail du propriétaire) ---
      const email = f.owner_email || "";
      const estEA = dansListeConfig("early_adopters", email);
      const estBloq = dansListeConfig("comptes_bloques", email);
      const actions2 = el("div", "adm-actions2");
      const bEA = el("button", "mini-btn" + (estEA ? " ok" : ""), estEA ? t("admin.ea_oui") : t("admin.ea_non"));
      bEA.title = t("admin.ea_aide");
      bEA.disabled = !email;
      bEA.onclick = async () => { await adminBasculerListe("early_adopters", email, !estEA); toast(t("admin.maj_ok"), "info"); b.onclick(); };
      const bBloc = el("button", "mini-btn" + (estBloq ? " non" : ""), estBloq ? t("admin.debloquer") : t("admin.bloquer"));
      bBloc.disabled = !email;
      bBloc.onclick = async () => {
        if (!estBloq && !confirm(t("admin.confirm_bloquer", { email }))) return;
        await adminBasculerListe("comptes_bloques", email, !estBloq); toast(t("admin.maj_ok"), "info"); b.onclick();
      };
      const bDel = el("button", "mini-btn danger", "🗑️");
      bDel.title = t("admin.supprimer");
      bDel.onclick = async () => {
        if (!confirm(t("admin.confirm_suppr_compte", { nom: f.name }))) return;
        if (prompt(t("admin.confirm_suppr_nom", { nom: f.name })) !== f.name) { toast(t("admin.nom_incorrect"), "info"); return; }
        if (await adminSupprimerFamille(f.id)) { toast(t("admin.supprime_ok", { nom: f.name }), "info"); b.onclick(); }
      };
      actions2.appendChild(bEA); actions2.appendChild(bBloc); actions2.appendChild(bDel);
      ligne.appendChild(actions2);
      if (estBloq) ligne.classList.add("bloque");
      liste.appendChild(ligne);
    });
  };
  sec.appendChild(b); sec.appendChild(liste);

  // ----- Liste d'attente des candidats -----
  sec.appendChild(el("h2", null, t("admin.attente_titre")));
  const bW = el("button", "btn-secondaire", t("admin.attente_charger"));
  const listeW = el("div", "admin-liste");
  bW.onclick = async () => {
    bW.disabled = true; bW.textContent = t("common.chargement");
    const cands = await adminListerAttente();
    bW.disabled = false; bW.textContent = t("admin.attente_recharger");
    listeW.innerHTML = "";
    listeW.appendChild(el("p", "note", t("admin.candidats", {n: cands.length})));
    cands.forEach(w => {
      const d = w.created_at ? new Date(w.created_at).toLocaleDateString("fr-BE") : "—";
      const ligne = el("div", "admin-item");
      ligne.innerHTML = `<div class="adm-info"><strong>${echapper(w.email)}</strong><small>${t("admin.inscrit_le", { date: d })}</small></div>`;
      const appr = el("button", "mini-btn ok", t("admin.approuver"));
      appr.onclick = async () => {
        appr.disabled = true; appr.textContent = "…";
        const lien = await creerParrainage();      // admin : parrainages illimités
        if (!lien) { appr.disabled = false; appr.textContent = t("admin.approuver"); return; }
        await adminRetirerAttente(w.email);        // sort de la liste d'attente
        ligne.innerHTML = `<div class="adm-info"><strong>${echapper(w.email)}</strong><small>${t("admin.approuve")}</small></div>`;
        montrerLienInvitation(ligne, lien, t("admin.lien_acces"), {
          sujet: t("admin.bienvenue_sujet", { app: APP_NOM }),
          corps: t("admin.bienvenue_corps", { app: APP_NOM, lien: "{lien}" }),
          to: w.email
        });
      };
      const sup = el("button", "mini-btn non", "🗑️");
      sup.title = t("admin.suppr_attente");
      sup.onclick = async () => {
        if (!confirm(t("admin.confirm_suppr_attente", { email: w.email }))) return;
        if (await adminRetirerAttente(w.email)) ligne.remove();
      };
      ligne.appendChild(appr); ligne.appendChild(sup);
      listeW.appendChild(ligne);
    });
  };
  sec.appendChild(bW); sec.appendChild(listeW);
  return sec;
}

// Sous-section « Config » de l'onglet Admin : test d'envoi d'e-mail + liens de
// dons Stripe. Réglages globaux de l'application (écriture réservée aux admins).
function blocAdminConfig() {
  const sec = el("section", "carte");

  // ----- Test d'envoi d'e-mail (via la fonction commune send-mail / SMTP OVH) -----
  // Envoie un vrai e-mail de test depuis hello@fami.team — même chemin que les
  // invitations et les retours.
  sec.appendChild(el("h2", null, t("admin.mailtest_titre")));
  sec.appendChild(el("p", "note", t("admin.mailtest_note")));
  const lDest = el("label", "champ", t("admin.mailtest_dest"));
  const inpDest = el("input"); inpDest.type = "email"; inpDest.placeholder = "hello@fami.team";
  const moi = (typeof utilisateurCourant === "function") ? utilisateurCourant() : null;
  inpDest.value = (moi && moi.email) ? moi.email : "";
  lDest.appendChild(inpDest); sec.appendChild(lDest);
  const bMail = el("button", "btn-secondaire", t("admin.mailtest_envoyer"));
  const msgMail = el("p");
  const afficherMsg = (txt, type) => {
    if (!txt) { msgMail.textContent = ""; msgMail.className = ""; return; }
    msgMail.textContent = txt;
    msgMail.className = "msg-retour " + (type === "ok" ? "msg-ok" : "msg-err");
  };
  bMail.onclick = async () => {
    const to = inpDest.value.trim();
    if (!to) { inpDest.focus(); return; }
    if (typeof sb === "undefined" || !sb) { afficherMsg(t("admin.mailtest_indispo"), "err"); return; }
    bMail.disabled = true; bMail.textContent = t("common.creation"); afficherMsg("");
    const res = await envoyerMailFn({
      to,
      subject: t("admin.mailtest_sujet", { app: APP_NOM }),
      text: t("admin.mailtest_corps", { app: APP_NOM, date: new Date().toLocaleString() })
    });
    bMail.disabled = false; bMail.textContent = t("admin.mailtest_envoyer");
    if (res.ok) {
      afficherMsg(t("admin.mailtest_ok", { email: to }), "ok");
      toast(t("admin.mailtest_ok", { email: to }), "succes");
    } else {
      afficherMsg(t("admin.mailtest_ko", { msg: res.detail }) + " — " + t("admin.mailtest_aide_smtp"), "err");
    }
  };
  sec.appendChild(bMail); sec.appendChild(msgMail);

  // ----- Configuration des dons Stripe (un Payment Link par montant) -----
  sec.appendChild(el("h2", null, t("admin.don_titre")));
  sec.appendChild(el("p", "note", t("admin.don_note")));
  const aide = el("a", "btn-secondaire don-aide", t("admin.don_aide"));
  aide.href = "https://dashboard.stripe.com/payment-links"; aide.target = "_blank"; aide.rel = "noopener";
  sec.appendChild(aide);
  const cfg = (typeof configApp !== "undefined") ? configApp : {};
  const champsDon = [
    ["support_email", t("admin.support_email")],
    ["don_once_10", t("don.ponctuel") + " — 10 €"],
    ["don_once_20", t("don.ponctuel") + " — 20 €"],
    ["don_once_50", t("don.ponctuel") + " — 50 €"],
    ["don_sub_1",  t("don.mensuel") + " — 1 €/" + t("don.mois")],
    ["don_sub_3",  t("don.mensuel") + " — 3 €/" + t("don.mois")],
    ["don_sub_10", t("don.mensuel") + " — 10 €/" + t("don.mois")],
    ["don_stripe_url", t("admin.don_libre")]
  ];
  const inputsDon = {};
  champsDon.forEach(([key, label]) => {
    const l = el("label", "champ", label);
    const inp = el("input");
    if (key === "support_email") { inp.type = "email"; inp.placeholder = "hello@fami.team"; }
    else { inp.type = "url"; inp.placeholder = "https://buy.stripe.com/…"; }
    inp.value = cfg[key] || "";
    l.appendChild(inp); sec.appendChild(l);
    inputsDon[key] = inp;
  });
  const bDon = el("button", "btn-secondaire", t("admin.don_enregistrer"));
  bDon.onclick = async () => {
    bDon.disabled = true; bDon.textContent = t("common.creation");
    let ok = true;
    for (const [key] of champsDon) {
      const val = inputsDon[key].value.trim();
      if (val !== (cfg[key] || "")) ok = (await adminDefinirConfig(key, val)) && ok;
    }
    bDon.disabled = false; bDon.textContent = t("admin.don_enregistrer");
    if (ok) toast(t("admin.don_ok"), "succes");
  };
  sec.appendChild(bDon);
  return sec;
}

/* ---------- Espace Admin : sous-sections ----------
 * L'onglet Admin est organisé en sous-sections navigables (comme l'espace
 * parents). Chaque sous-section est indépendante et rendue à la demande.
 * Les sous-sections Stats / Retours / Système accueilleront les lots B→F. */

// Sous-section active de l'onglet Admin (session, non synchronisée).
let sousOngletAdmin = "familles";
const SOUS_ONGLETS_ADMIN = [
  ["stats",      "admin.nav_stats"],
  ["croissance", "admin.nav_croissance"],
  ["familles",   "admin.nav_familles"],
  ["retours",    "admin.nav_retours"],
  ["contenu",    "admin.nav_contenu"],
  ["config",     "admin.nav_config"],
  ["systeme",    "admin.nav_systeme"],
];

// Carte « bientôt disponible » pour les sous-sections encore à construire.
function blocAdminBientot(titre, desc) {
  const sec = el("section", "carte admin-bientot");
  sec.innerHTML = `<h2>${titre}</h2><p class="note">${desc}</p>
    <p class="admin-bientot-badge">🚧 ${t("admin.bientot")}</p>`;
  return sec;
}

// Graphique en barres minimaliste (SVG vanilla, sans dépendance externe).
// `serie` = [{ semaine: "AAAA-MM-JJ", n: nombre }]. Échappe les valeurs.
function miniGraphBarres(serie, couleur) {
  if (!serie || !serie.length) return `<p class="note">${t("stats.aucune_donnee")}</p>`;
  const W = 520, H = 140, padB = 22, padL = 6, padT = 8;
  const n = serie.length;
  const maxV = Math.max(1, ...serie.map(p => p.n || 0));
  const bw = (W - padL * 2) / n;
  const barres = serie.map((p, i) => {
    const h = Math.round(((p.n || 0) / maxV) * (H - padB - padT));
    const x = padL + i * bw;
    const y = H - padB - h;
    const w = Math.max(2, bw - 4);
    // Étiquette du mois (jour 1-7 = début de semaine) : mois abrégé au 1er de chaque mois.
    let lbl = "";
    try {
      const d = new Date(p.semaine + "T00:00:00");
      if (d.getDate() <= 7) lbl = d.toLocaleDateString(langue, { month: "short" });
    } catch (e) { /* ignore */ }
    const tt = `${p.semaine} : ${p.n}`;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${couleur}">`
      + `<title>${echapper(tt)}</title></rect>`
      + (lbl ? `<text x="${x + w / 2}" y="${H - 6}" font-size="10" fill="#8aa0b0" text-anchor="middle">${echapper(lbl)}</text>` : "")
      + `</g>`;
  }).join("");
  return `<svg class="mini-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">${barres}</svg>`;
}

// Une carte « chiffre clé » (grande valeur + libellé + précision facultative).
function carteStat(emoji, valeur, label, precision) {
  return `<div class="stat-carte">
    <div class="stat-emoji">${emoji}</div>
    <div class="stat-valeur">${valeur}</div>
    <div class="stat-label">${label}</div>
    ${precision ? `<div class="stat-precision">${precision}</div>` : ""}
  </div>`;
}

// Sous-section « Stats » : chiffres clés + évolution (inscriptions & activité)
// + derniers arrivants. Toutes les données proviennent de RPC en lecture seule.
function blocAdminStats() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>📊 ${t("admin.nav_stats")}</h2><p class="note">${t("admin.stats_desc")}</p>`;
  const b = el("button", "btn-secondaire", t("stats.charger"));
  const corps = el("div", "admin-stats-corps");
  b.onclick = async () => {
    b.disabled = true; b.textContent = t("common.chargement");
    const [s, insc, act, recentes, usage, usageSerie, dons, donsRecents] = await Promise.all([
      adminStats(), adminSerieInscriptions(), adminSerieActivite(), adminFamillesRecentes(8),
      adminUsageStats(), adminSerieUsage(), adminDonationsStats(), adminListerDons(6)
    ]);
    b.disabled = false; b.textContent = t("stats.recharger");
    corps.innerHTML = "";
    if (!s) { corps.appendChild(el("p", "note", t("stats.aucune_donnee"))); return; }

    // --- Chiffres clés ---
    const grille = el("div", "stat-grille");
    grille.innerHTML = [
      carteStat("👨‍👩‍👧", s.familles_total, t("stats.familles"),
        t("stats.familles_nouv", { s7: s.familles_7j, s30: s.familles_30j })),
      carteStat("🧒", s.enfants_total, t("stats.enfants")),
      carteStat("👤", s.membres_total, t("stats.membres")),
      carteStat("✅", s.actives_7j, t("stats.actives"),
        t("stats.actives_detail", { j1: s.actives_1j, j30: s.actives_30j })),
      carteStat("⭐", s.plan_premium, t("stats.premium"),
        t("stats.free_detail", { n: s.plan_free })),
      carteStat("🎁", s.referrals_acceptes, t("stats.parrainages")),
      carteStat("⏳", s.waitlist_total, t("stats.attente")),
      carteStat("💬", s.feedback_total, t("stats.retours"),
        t("stats.retours_detail", { bugs: s.feedback_bugs, sugg: s.feedback_suggestions })),
    ].join("");
    corps.appendChild(grille);

    // --- Évolution : inscriptions par semaine ---
    corps.appendChild(el("h3", "stat-titre", "📈 " + t("stats.inscriptions")));
    const g1 = el("div", "stat-graph-box"); g1.innerHTML = miniGraphBarres(insc, "#5b8def");
    corps.appendChild(g1);

    // --- Évolution : familles actives par semaine ---
    corps.appendChild(el("h3", "stat-titre", "🔥 " + t("stats.activite")));
    const g2 = el("div", "stat-graph-box"); g2.innerHTML = miniGraphBarres(act, "#2bb3c0");
    corps.appendChild(g2);

    // --- Activité web (ouvertures de l'app, mesure côté client) ---
    corps.appendChild(el("h3", "stat-titre", "🌐 " + t("stats.usage_titre")));
    if (usage) {
      const gu = el("div", "stat-grille");
      gu.innerHTML = [
        carteStat("📅", usage.actifs_jour, t("stats.usage_jour")),
        carteStat("🗓️", usage.actifs_7j, t("stats.usage_7j")),
        carteStat("📆", usage.actifs_30j, t("stats.usage_30j")),
        carteStat("👆", usage.ouvertures_30j, t("stats.usage_ouvertures")),
      ].join("");
      corps.appendChild(gu);
    }
    // Graphique : familles actives par jour (30 j). On mappe {jour,familles}
    // vers la forme attendue par miniGraphBarres {semaine,n}.
    const usageBarres = (usageSerie || []).map(u => ({ semaine: u.jour, n: u.familles }));
    const gu2 = el("div", "stat-graph-box"); gu2.innerHTML = miniGraphBarres(usageBarres, "#e88b2f");
    corps.appendChild(gu2);
    corps.appendChild(el("p", "note", t("stats.usage_note")));

    // --- Dons (mesure réelle, via le webhook Stripe) ---
    corps.appendChild(el("h3", "stat-titre", "💛 " + t("stats.dons_titre")));
    if (dons) {
      const gd = el("div", "stat-grille");
      gd.innerHTML = [
        carteStat("💛", montantLisible(dons.total_cents), t("stats.dons_total")),
        carteStat("🗓️", montantLisible(dons.total_30j_cents), t("stats.dons_30j")),
        carteStat("🔁", montantLisible(dons.recurrent_30j_cents), t("stats.dons_recurrent")),
        carteStat("🙋", dons.donateurs_uniques, t("stats.dons_uniques"),
          t("stats.dons_nb", { n: dons.nb_dons })),
      ].join("");
      corps.appendChild(gd);
    }
    if (!donsRecents.length) {
      corps.appendChild(el("p", "note", t("stats.dons_aucun")));
    } else {
      const listeDons = el("div", "admin-liste");
      donsRecents.forEach(d => {
        const date = d.created_at ? new Date(d.created_at).toLocaleDateString(langue) : "—";
        const ligne = el("div", "admin-item");
        ligne.innerHTML = `<div class="adm-info"><strong>${montantLisible(d.amount_cents, d.currency)}</strong>
          <small>${echapper(d.email || "?")} · ${d.kind === "subscription" ? t("stats.dons_recurrent_court") : t("stats.dons_ponctuel")} · ${echapper(date)}</small></div>`;
        listeDons.appendChild(ligne);
      });
      corps.appendChild(listeDons);
    }

    // --- Derniers arrivants ---
    corps.appendChild(el("h3", "stat-titre", "🆕 " + t("stats.recentes")));
    if (!recentes.length) {
      corps.appendChild(el("p", "note", t("stats.aucune_donnee")));
    } else {
      const liste = el("div", "admin-liste");
      recentes.forEach(f => {
        const d = f.created_at ? new Date(f.created_at).toLocaleDateString(langue) : "—";
        const ligne = el("div", "admin-item");
        ligne.innerHTML = `<div class="adm-info"><strong>${echapper(f.name || "?")}</strong>
          <small>${echapper(f.owner_email || "?")} · ${t("stats.inscrite_le", { date: d })}</small></div>`;
        liste.appendChild(ligne);
      });
      corps.appendChild(liste);
    }
  };
  sec.appendChild(b);
  sec.appendChild(corps);
  return sec;
}

/* ---------- Sous-section « Retours » (bugs & suggestions) ---------- */
// Cache de session : la liste chargée + le filtre courant. Le nombre de retours
// non lus alimente le badge de la sous-navigation (voir vueAdmin).
let adminRetoursCache = null;
let adminRetoursFiltre = "tous";   // 'tous' | 'non_lus' | 'bug' | 'suggestion'
let adminRetoursNonLus = null;     // null = inconnu (pas encore chargé)
let _badgeRetoursFait = false;     // évite de recharger le badge à chaque rendu

// Recalcule le nombre de retours non lus depuis le cache.
function majCompteNonLus() {
  adminRetoursNonLus = (adminRetoursCache || []).filter(f => f.status === "nouveau").length;
}

// Une ligne de retour : type, auteur, date, statut, message + actions.
function ligneRetour(f) {
  const d = f.created_at ? new Date(f.created_at).toLocaleString(langue) : "—";
  const statut = f.status || "nouveau";
  const ligne = el("div", "admin-item retour-item statut-" + statut);
  const typeEmoji = f.type === "bug" ? "🐞" : "💡";
  const libStatut = { nouveau: t("retours.st_nouveau"), lu: t("retours.st_lu"), traite: t("retours.st_traite") }[statut] || t("retours.st_nouveau");
  const info = el("div", "adm-info");
  info.innerHTML = `<strong>${typeEmoji} ${echapper(f.email || "?")}</strong>
    <small>${echapper(d)} · <span class="retour-statut st-${statut}">${libStatut}</span></small>
    <div class="retour-msg">${echapper(f.message || "")}</div>`;
  ligne.appendChild(info);

  const actions = el("div", "adm-actions2");
  const bouton = (val, label) => {
    const btn = el("button", "mini-btn" + (statut === val ? " ok" : ""), label);
    btn.onclick = async () => {
      if (await adminMajStatutFeedback(f.id, val)) {
        f.status = val;          // met à jour le cache en place
        majCompteNonLus();
        rendre();
      }
    };
    return btn;
  };
  actions.appendChild(bouton("lu", "👁️ " + t("retours.marquer_lu")));
  actions.appendChild(bouton("traite", "✅ " + t("retours.marquer_traite")));
  // Répondre : brouillon e-mail prérempli (depuis le client mail de l'admin).
  if (f.email) {
    const rep = el("a", "mini-btn btn-mail", "✉️ " + t("retours.repondre"));
    const sujet = t("retours.mail_sujet", { app: APP_NOM });
    const corps = t("retours.mail_corps", { message: f.message || "" });
    rep.href = `mailto:${encodeURIComponent(f.email)}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    actions.appendChild(rep);
  }
  ligne.appendChild(actions);
  return ligne;
}

// Sous-section « Retours » : liste filtrable des bugs & suggestions, avec
// gestion du statut (nouveau / lu / traité) et réponse par e-mail.
/* Met les retours non lus en forme de consigne pour Claude Code : contexte du
 * projet, garde-fous, retours numérotés, et la demande de trier AVANT de
 * coder. On ne demande pas d'implémenter en aveugle : on demande un tri
 * argumenté, puis une seule amélioration à la fois. */
function consigneClaudeCode(liste) {
  const lignes = liste.map((f, i) => {
    const type = f.type === "bug" ? "BOGUE" : "IDÉE";
    const date = (f.created_at || "").slice(0, 10);
    return `${i + 1}. [${type}] (${date}) ${String(f.message || "").trim().replace(/\s+/g, " ")}`;
  }).join("\n");
  return `Voici les retours reçus des familles utilisatrices de FamiTeam depuis la dernière revue.

CONTEXTE DU PROJET
- Application web familiale (2-7 ans), parentalité positive : on encourage, on répare, on ne punit jamais.
- Projet personnel non marchand : gratuit, sans publicité, sans revente de données, hébergement européen.
- Une heure de développement par semaine : chaque ajout doit se justifier par son rapport valeur/temps.
- Quatre langues (fr, en, nl, de) : toute chaîne visible doit être traduite dans les quatre.
- Tests : \`node test/run.js\` doit rester au vert.
- Minimisation des données : aucune nouvelle donnée personnelle sans nécessité démontrée.

RETOURS À EXAMINER
${lignes}

CE QUE J'ATTENDS
1. Trie ces retours en trois piles, avec une phrase de justification chacun :
   « à faire maintenant » (utile à toutes les familles et réalisable en moins d'une heure),
   « plus tard » (bonne idée mais coûteuse ou peu demandée),
   « non » (contraire au cap du projet, à la minimisation des données, ou au principe « on ne punit pas »).
2. Attends ma validation du tri avant d'écrire la moindre ligne de code.
3. Ensuite seulement, implémente UNE amélioration de la première pile : code, traductions dans les
   quatre langues, test si la logique s'y prête, vérification, puis commit sur la branche dev.

Ne modifie rien tant que je n'ai pas validé le tri.`;
}

function blocAdminRetours() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>💬 ${t("admin.nav_retours")}</h2><p class="note">${t("admin.retours_desc")}</p>`;
  const b = el("button", "btn-secondaire", adminRetoursCache ? t("retours.recharger") : t("retours.charger"));
  const corps = el("div", "admin-retours-corps");

  const rendreListe = () => {
    corps.innerHTML = "";
    if (!adminRetoursCache) return;
    if (!adminRetoursCache.length) { corps.appendChild(el("p", "note", t("retours.aucun"))); return; }
    // Filtres.
    const filtres = el("div", "retours-filtres");
    [["tous", "retours.f_tous"], ["non_lus", "retours.f_non_lus"], ["bug", "retours.f_bugs"], ["suggestion", "retours.f_suggestions"]]
      .forEach(([id, cle]) => {
        const fb = el("button", "mini-btn" + (adminRetoursFiltre === id ? " ok" : ""), t(cle));
        fb.onclick = () => { adminRetoursFiltre = id; rendreListe(); };
        filtres.appendChild(fb);
      });
    corps.appendChild(filtres);
    // Liste filtrée.
    const liste = adminRetoursCache.filter(f =>
      adminRetoursFiltre === "tous" ? true
        : adminRetoursFiltre === "non_lus" ? (f.status || "nouveau") === "nouveau"
        : f.type === adminRetoursFiltre);
    corps.appendChild(el("p", "note", t("retours.compte", { n: liste.length })));
    const box = el("div", "admin-liste");
    liste.forEach(f => box.appendChild(ligneRetour(f)));
    corps.appendChild(box);
  };

  b.onclick = async () => {
    b.disabled = true; b.textContent = t("common.chargement");
    adminRetoursCache = await adminListerFeedback();
    majCompteNonLus();
    b.disabled = false; b.textContent = t("retours.recharger");
    rendreListe();
  };
  sec.appendChild(b);

  // Chantier récurrent « Revue des idées » : on met les retours en forme de
  // consigne prête à coller dans Claude Code, avec le contexte du projet et
  // les garde-fous. Le tri reste humain ; la mise en forme, non.
  const bConsigne = el("button", "btn-secondaire", "🤖 " + t("retours.consigne"));
  bConsigne.onclick = () => {
    const liste = (adminRetoursCache || []).filter(f => (f.status || "nouveau") === "nouveau");
    if (!liste.length) { toast(t("retours.consigne_vide"), "info"); return; }
    copierTexte(consigneClaudeCode(liste));
  };
  sec.appendChild(bConsigne);
  sec.appendChild(el("p", "reglage-aide", t("retours.consigne_aide")));
  sec.appendChild(corps);
  if (adminRetoursCache) rendreListe();   // déjà chargé cette session
  return sec;
}

// Met en forme un montant stocké en centimes (ex. 1500 -> "15,00 €").
function montantLisible(cents, devise) {
  const n = (Number(cents) || 0) / 100;
  const symb = (String(devise || "eur").toLowerCase() === "eur") ? "€" : String(devise || "").toUpperCase();
  return n.toLocaleString(langue, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + symb;
}

// Met en forme une taille en octets (Ko / Mo / Go).
function octetsLisibles(n) {
  n = Number(n) || 0;
  if (n < 1024) return n + " o";
  const u = ["Ko", "Mo", "Go", "To"];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return n.toFixed(n >= 10 ? 0 : 1) + " " + u[i];
}

// Déduit l'URL du tableau de bord Supabase à partir de SUPABASE_URL
// (https://<ref>.supabase.co → https://supabase.com/dashboard/project/<ref>).
function lienDashboardSupabase() {
  try {
    const cfg = (typeof window !== "undefined" && window.KP_CONFIG) ? window.KP_CONFIG : {};
    const m = (cfg.SUPABASE_URL || "").match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    return m ? `https://supabase.com/dashboard/project/${m[1]}` : "https://supabase.com/dashboard";
  } catch (e) { return "https://supabase.com/dashboard"; }
}

// Sous-section « Système » : stockage (base de données) + liens vers les
// tableaux de bord. L'export et la migration sont ajoutés au lot F.
function blocAdminSysteme() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>🛠️ ${t("admin.nav_systeme")}</h2><p class="note">${t("admin.systeme_desc")}</p>`;

  // ----- Stockage / base de données -----
  sec.appendChild(el("h3", "stat-titre", "💾 " + t("sys.stockage")));
  const b = el("button", "btn-secondaire", t("sys.charger"));
  const corps = el("div", "admin-sys-corps");
  b.onclick = async () => {
    b.disabled = true; b.textContent = t("common.chargement");
    const s = await adminDbStats();
    b.disabled = false; b.textContent = t("sys.recharger");
    corps.innerHTML = "";
    if (!s) { corps.appendChild(el("p", "note", t("stats.aucune_donnee"))); return; }
    corps.appendChild(el("p", "sys-total", t("sys.db_total", { taille: octetsLisibles(s.db_taille_octets) })));
    const liste = el("div", "admin-liste");
    (s.tables || []).forEach(tb => {
      const ligne = el("div", "admin-item");
      ligne.innerHTML = `<div class="adm-info"><strong>${echapper(tb.nom)}</strong>
        <small>${t("sys.lignes", { n: tb.lignes })} · ${octetsLisibles(tb.taille_octets)}</small></div>`;
      liste.appendChild(ligne);
    });
    corps.appendChild(liste);
  };
  sec.appendChild(b); sec.appendChild(corps);

  // ----- Réseau / bande passante : liens vers les tableaux de bord -----
  sec.appendChild(el("h3", "stat-titre", "🌐 " + t("sys.reseau")));
  sec.appendChild(el("p", "note", t("sys.reseau_note")));
  const liens = el("div", "sys-liens");
  const lienSb = el("a", "btn-secondaire", "🗄️ " + t("sys.dashboard_supabase"));
  lienSb.href = lienDashboardSupabase(); lienSb.target = "_blank"; lienSb.rel = "noopener";
  const lienVc = el("a", "btn-secondaire", "▲ " + t("sys.dashboard_vercel"));
  lienVc.href = "https://vercel.com/dashboard"; lienVc.target = "_blank"; lienVc.rel = "noopener";
  liens.appendChild(lienSb); liens.appendChild(lienVc);
  sec.appendChild(liens);

  // ----- Sauvegarde & migration -----
  sec.appendChild(el("h3", "stat-titre", "📦 " + t("sys.migration")));
  sec.appendChild(el("p", "note", t("sys.migration_note")));
  const actions = el("div", "sys-liens");

  // Export complet des données (JSON téléchargé).
  const bExport = el("button", "btn-secondaire", "💾 " + t("sys.export"));
  bExport.onclick = async () => {
    bExport.disabled = true; bExport.textContent = t("common.chargement");
    const data = await adminExportAll();
    bExport.disabled = false; bExport.textContent = "💾 " + t("sys.export");
    if (!data) return;
    const jour = new Date().toISOString().slice(0, 10);
    telechargerJSON("famiteam-export-" + jour + ".json", data);
    toast(t("sys.export_ok"), "succes");
  };
  actions.appendChild(bExport);

  // Téléchargement du code (archive ZIP GitHub — dépôt privé : connexion requise).
  const lienCode = el("a", "btn-secondaire", "⬇️ " + t("sys.code"));
  lienCode.href = "https://github.com/cedricdierckx/kidspositifs/archive/refs/heads/main.zip";
  lienCode.target = "_blank"; lienCode.rel = "noopener";
  actions.appendChild(lienCode);

  // Guide de migration (fichier MIGRATION.md du dépôt).
  const lienGuide = el("a", "btn-secondaire", "📖 " + t("sys.guide"));
  lienGuide.href = "https://github.com/cedricdierckx/kidspositifs/blob/main/MIGRATION.md";
  lienGuide.target = "_blank"; lienGuide.rel = "noopener";
  actions.appendChild(lienGuide);

  sec.appendChild(actions);
  return sec;
}

// Télécharge un objet en fichier JSON (côté client, sans dépendance).
function telechargerJSON(nomFichier, obj) {
  try {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nomFichier;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  } catch (e) { toast(t("sys.export_ko"), "info"); }
}

/* ---------- Admin : développement commercial (chantiers & e-mails) ----------
 * Le plan lui-même vit dans js/croissance.js (données) et PLAN-COMMERCIAL.md
 * (analyse). Ici on affiche l'avancement et on l'enregistre dans app_config
 * (clé « croissance »), écrite par la RPC set_app_config réservée aux admins.
 * Format stocké : { etapes: { <idEtape>: "AAAA-MM-JJ" | false }, notes: { <idChantier>: texte } } */
function croissanceEtat() {
  try {
    const brut = (typeof configApp !== "undefined") ? configApp.croissance : null;
    const o = brut ? (typeof brut === "string" ? JSON.parse(brut) : brut) : {};
    return { etapes: o.etapes || {}, notes: o.notes || {} };
  } catch (e) { return { etapes: {}, notes: {} }; }
}
// Une étape est faite si l'admin l'a cochée, ou si elle est marquée comme
// déjà livrée dans le plan et n'a pas été décochée depuis.
function croissanceEtapeFaite(etape, etat, chantier) {
  const cle = croissanceCleEtape(chantier, etape);
  const v = (etat || croissanceEtat()).etapes[cle];
  if (v === false) return false;
  if (v) return true;
  // Un chantier récurrent ne se souvient pas des périodes précédentes : à
  // chaque nouveau mois, ses étapes sont de nouveau à faire.
  return (chantier && chantier.recurrent) ? false : !!etape.fait;
}
// Clé d'avancement (mois courant pour les chantiers récurrents).
function croissanceCleEtape(chantier, etape) {
  if (typeof cleEtapeCroissance !== "function") return etape.id;
  return cleEtapeCroissance(chantier, etape, aujourdHui().slice(0, 7));
}
async function croissanceEnregistrer(etat) {
  const ok = await adminDefinirConfig("croissance", JSON.stringify(etat));
  if (!ok) toast(t("croiss.err"), "info");
  return ok;
}
function croissanceAvancement(chantier, etat) {
  const faites = chantier.etapes.filter(e => croissanceEtapeFaite(e, etat, chantier)).length;
  return { faites, total: chantier.etapes.length,
           pct: Math.round((faites / Math.max(1, chantier.etapes.length)) * 100) };
}
// Première étape non faite, dans l'ordre des phases : « la prochaine action ».
function croissanceProchaine(etat) {
  for (const ph of CROISSANCE_PHASES) {
    for (const ch of chantiersDePhase(ph.id)) {
      const e = ch.etapes.find(x => !croissanceEtapeFaite(x, etat, ch));
      if (e) return { phase: ph, chantier: ch, etape: e };
    }
  }
  return null;
}

// Copie un texte dans le presse-papiers (avec repli pour les navigateurs
// anciens ou les contextes non sécurisés).
function copierTexte(txt) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt);
      toast(t("croiss.copie"), "succes");
      return;
    }
  } catch (e) { /* repli ci-dessous */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
    toast(t("croiss.copie"), "succes");
  } catch (e) { toast(t("croiss.copie_ko"), "info"); }
}

/* Envois automatiques : un interrupteur, la file d'attente visible avant
 * envoi, et les réponses types du support. Rien ne part tant que
 * l'interrupteur est coupé — c'est le réglage par défaut. */
const REPONSES_TYPES = [
  { id: "merci", titre: "Merci pour le retour",
    texte: `Bonjour,\n\nMerci beaucoup pour ce retour — c'est exactement ce qui fait avancer l'app.\nC'est noté. FamiTeam étant développé sur du temps libre et sans équipe, il n'y a pas de suivi individuel : les retours sont lus quand c'est possible et alimentent les mises à jour.\n\nBonne journée,\nFamiTeam` },
  { id: "bogue", titre: "Bogue signalé",
    texte: `Bonjour,\n\nMerci de l'avoir signalé. Je reproduis le problème et je le corrige dès que possible ;\nvous n'avez rien à faire de votre côté, la correction arrive toute seule (rien à installer).\n\nLa correction arrivera dans une prochaine mise à jour, sans notification particulière.\n\nFamiTeam` },
  { id: "idee", titre: "Idée reçue, mais pas pour tout de suite",
    texte: `Bonjour,\n\nMerci pour l'idée. Je la note dans la liste.\n\nLes idées sont passées en revue par lots, à chaque mise à jour : quand plusieurs familles demandent\nla même chose, elle remonte naturellement en tête de liste.\n\nFamiTeam` },
  { id: "donnees", titre: "Question sur les données",
    texte: `Bonjour,\n\nVos données sont hébergées en Europe, ne sont jamais revendues et ne servent à aucune publicité.\nNous demandons le strict minimum : prénom et date de naissance de l'enfant, rien d'autre.\n\nVous pouvez tout exporter ou tout supprimer en deux clics : Réglages → Mon compte.\nLe détail est ici : https://famiteam.com/confidentialite.html\n\nFamiTeam` },
  { id: "faq", titre: "Renvoi vers la FAQ",
    texte: `Bonjour,\n\nLa réponse se trouve ici : https://famiteam.com/faq.html\n\nSi la page ne répond pas à votre question, elle sera complétée lors d'une prochaine mise à jour.\n\nFamiTeam` }
];

/* Coefficient viral k : filleuls arrivés sur 30 jours ÷ familles actives sur
 * 7 jours. Au-dessus de 0,4, la boucle porte la croissance toute seule ;
 * sous 0,2, le produit n'est pas encore assez aimé pour qu'on en parle. */
function coefficientViral(stats, usage) {
  const filleuls = (stats && typeof stats.referrals_30j === "number") ? stats.referrals_30j : null;
  const actives = (usage && typeof usage.actifs_7j === "number" && usage.actifs_7j > 0)
    ? usage.actifs_7j
    : ((stats && typeof stats.actives_7j === "number" && stats.actives_7j > 0) ? stats.actives_7j : 0);
  if (filleuls === null || !actives) return "—";
  return (Math.round((filleuls / actives) * 100) / 100).toString().replace(".", ",");
}

function blocEnvoisAuto() {
  const sec = el("section", "carte croiss-envois");
  const armes = (typeof mailsAutoArmes === "function") ? mailsAutoArmes() : false;
  sec.innerHTML = `<h2>${t("croiss.envois_titre")}</h2>
    <p class="note">${t("croiss.envois_sous")}</p>`;

  const l = el("label", "switch-ligne");
  const i = el("input"); i.type = "checkbox"; i.checked = armes;
  i.onchange = async () => {
    i.disabled = true;
    await adminDefinirConfig("mails_auto", i.checked ? "on" : "");
    i.disabled = false;
    majSansSaut(() => rendre());
  };
  l.appendChild(i);
  l.appendChild(el("span", null, t("croiss.envois_switch")));
  sec.appendChild(l);
  sec.appendChild(el("p", "reglage-aide", t(armes ? "croiss.envois_on" : "croiss.envois_off")));

  // File d'attente : on montre QUI serait relancé avant d'envoyer quoi que ce soit.
  const file = el("div", "croiss-file");
  file.innerHTML = `<p class="note">${t("common.chargement")}</p>`;
  sec.appendChild(file);
  (async () => {
    const liste = (typeof adminMailsEnAttente === "function") ? await adminMailsEnAttente() : [];
    if (!liste.length) { file.innerHTML = `<p class="note">${t("croiss.file_vide")}</p>`; return; }
    file.innerHTML = `<p class="croiss-file-t">${t("croiss.file_titre", { n: liste.length })}</p>` +
      liste.map(f => `<div class="croiss-file-l"><span>${echapper(f.famille || "—")}</span>
        <span class="note">${echapper(f.email || "—")} · ${t("croiss.file_jours", { n: f.jours })}</span></div>`).join("");
    const b = el("button", "btn-secondaire", t("croiss.file_envoyer", { n: liste.length }));
    b.disabled = !armes;
    b.onclick = async () => {
      if (!confirm(t("croiss.file_confirm", { n: liste.length }))) return;
      b.disabled = true; b.textContent = t("common.creation");
      const n = await envoyerRelancesActivation(liste);
      toast(t("croiss.mails_partis", { n }), "succes");
      majSansSaut(() => rendre());
    };
    file.appendChild(b);
    if (!armes) file.appendChild(el("p", "reglage-aide", t("croiss.file_bloque")));
  })();

  // Réponses types : le support en dix secondes plutôt qu'en dix minutes.
  const { details, corps } = blocPliable("💬 " + t("croiss.reponses_titre"), false, "croiss-reponses");
  corps.appendChild(el("p", "note", t("croiss.reponses_sous")));
  REPONSES_TYPES.forEach(r => {
    const bloc = el("div", "croiss-reponse");
    bloc.innerHTML = `<p class="croiss-reponse-t">${echapper(r.titre)}</p>
      <pre class="croiss-corps">${echapper(r.texte)}</pre>`;
    const b = el("button", "mini-btn", "📋 " + t("croiss.copier"));
    b.onclick = () => copierTexte(r.texte);
    bloc.appendChild(b);
    corps.appendChild(bloc);
  });
  sec.appendChild(details);
  return sec;
}

function blocAdminCroissance(c) {
  const etat0 = croissanceEtat();

  /* ----- En-tête : cap, avancement global, prochaine action ----- */
  const tete = el("section", "carte croiss-tete");
  // L'avancement ne compte que le périmètre « cœur » : les chantiers hors
  // périmètre sont conservés pour mémoire, pas pour être faits.
  // Les chantiers récurrents ne comptent pas dans l'avancement : ils ne se
  // terminent jamais, par construction.
  const coeur = CROISSANCE_CHANTIERS.filter(ch => ch.perimetre === "coeur" && !ch.recurrent);
  const totalEtapes = coeur.reduce((s, ch) => s + ch.etapes.length, 0);
  const totalFaites = coeur.reduce(
    (s, ch) => s + ch.etapes.filter(e => croissanceEtapeFaite(e, etat0, ch)).length, 0);
  const heures = Math.round(coeur.reduce((s, ch) => s + ch.etapes
    .filter(e => !croissanceEtapeFaite(e, etat0, ch)).reduce((x, e) => x + (e.min || 0), 0), 0) / 60);
  const pctGlobal = Math.round((totalFaites / Math.max(1, totalEtapes)) * 100);
  tete.innerHTML = `<h2>${t("croiss.titre")}</h2>
    <p class="note">${t("croiss.sous")}</p>
    <div class="progress"><div class="progress-bar" style="width:${pctGlobal}%"></div></div>
    <p class="croiss-compte">${t("croiss.avancement", { faites: totalFaites, total: totalEtapes, pct: pctGlobal })}
      — ${t("croiss.reste", { h: heures, sem: heures })}</p>`;
  const prochaine = croissanceProchaine(etat0);
  if (prochaine) {
    const p = el("div", "croiss-prochaine");
    p.innerHTML = `<span class="croiss-etiquette">${t("croiss.prochaine")}</span>
      <strong>${prochaine.chantier.emoji} ${echapper(prochaine.chantier.titre)}</strong>
      <span>${echapper(prochaine.etape.titre)}</span>`;
    tete.appendChild(p);
  } else {
    tete.appendChild(el("p", "note", t("croiss.tout_fait")));
  }
  tete.appendChild(el("p", "note croiss-url", t("croiss.url", { url: "famiteam.com/croissance" })));
  const lienPlan = el("a", "btn-secondaire", "📄 " + t("croiss.doc"));
  lienPlan.href = "https://github.com/cedricdierckx/kidspositifs/blob/main/PLAN-COMMERCIAL.md";
  lienPlan.target = "_blank"; lienPlan.rel = "noopener";
  tete.appendChild(lienPlan);
  c.appendChild(tete);

  /* ----- Les deux contraintes : elles gouvernent tout le plan ----- */
  const contr = el("section", "carte croiss-contraintes");
  contr.innerHTML = `<h2>${t("croiss.contraintes")}</h2>`;
  CROISSANCE_CONTRAINTES.forEach(k => {
    const d = el("div", "croiss-contrainte");
    d.innerHTML = `<p class="croiss-contrainte-t">${k.emoji} <strong>${echapper(k.titre)}</strong></p>
      <p class="note">${echapper(k.detail)}</p>
      <ul class="croiss-conseq">${k.consequences.map(x => `<li>${echapper(x)}</li>`).join("")}</ul>`;
    contr.appendChild(d);
  });
  c.appendChild(contr);

  /* ----- La séance de la semaine : ce qui tient dans une heure ----- */
  const sem = el("section", "carte croiss-semaine");
  const choix = seanceDeLaSemaine((e, ch) => croissanceEtapeFaite(e, etat0, ch), 60);
  const totalMin = choix.reduce((s, x) => s + (x.etape.min || 15), 0);
  sem.innerHTML = `<h2>${t("croiss.semaine")}</h2>
    <p class="note">${t("croiss.semaine_sous", { min: totalMin })}</p>`;
  if (!choix.length) {
    sem.appendChild(el("p", "note", t("croiss.tout_fait")));
  } else {
    choix.forEach(({ chantier, etape }) => {
      const l = el("label", "switch-ligne croiss-etape");
      const i = el("input"); i.type = "checkbox";
      i.onchange = async () => {
        const etat = croissanceEtat();
        etat.etapes[croissanceCleEtape(chantier, etape)] = i.checked ? aujourdHui() : false;
        i.disabled = true;
        await croissanceEnregistrer(etat);
        i.disabled = false;
        majSansSaut(() => rendre());
      };
      l.appendChild(i);
      const txt = el("span", "croiss-etape-txt");
      txt.innerHTML = `<strong>${echapper(etape.titre)} <span class="croiss-min">${etape.min || 15} min</span></strong>
        <small>${chantier.emoji} ${echapper(chantier.titre)} — ${echapper(etape.detail || "")}</small>`;
      l.appendChild(txt);
      sem.appendChild(l);
    });
  }
  const rit = el("p", "note croiss-rituel");
  rit.innerHTML = CROISSANCE_RITUEL.map(r => `<strong>${echapper(r.titre)}</strong> ${echapper(r.detail)}`).join("<br>");
  sem.appendChild(rit);
  c.appendChild(sem);

  /* ----- Chiffres réels (étoile du Nord et compagnie) ----- */
  const kpi = el("section", "carte");
  kpi.innerHTML = `<h2>${t("croiss.kpi_titre")}</h2>
    <p class="note">${t("croiss.kpi_sous")}</p>
    <div id="croiss-kpi" class="stat-grille"><p class="note">${t("common.chargement")}</p></div>`;
  c.appendChild(kpi);
  (async () => {
    const [s, u, a, src] = await Promise.all([
      adminStats(), adminUsageStats(),
      (typeof adminActivation === "function") ? adminActivation() : null,
      (typeof adminSources === "function") ? adminSources() : []
    ]);
    const grille = kpi.querySelector("#croiss-kpi");
    if (!grille) return;
    if (!s && !u) { grille.innerHTML = `<p class="note">${t("croiss.kpi_ko")}</p>`; return; }
    const v = (o, k) => (o && o[k] != null) ? o[k] : "—";
    grille.innerHTML =
      carteStat("⭐", v(u, "actifs_7j"), t("croiss.kpi_actives"), t("croiss.kpi_actives_p")) +
      carteStat("🚀", (a && a.taux != null) ? a.taux + " %" : "—", t("croiss.kpi_activation"),
                (a && a.eligibles != null) ? t("croiss.kpi_activation_p", { n: a.eligibles }) : "") +
      carteStat("👪", v(s, "familles_total"), t("croiss.kpi_familles")) +
      carteStat("🌱", v(s, "familles_30j"), t("croiss.kpi_nouvelles")) +
      carteStat("🎁", v(s, "referrals_acceptes"), t("croiss.kpi_parrainages"),
                (s && s.referrals_30j != null) ? t("croiss.kpi_parrainages_p", { n: s.referrals_30j }) : "") +
      carteStat("🔁", coefficientViral(s, u), t("croiss.kpi_k"), t("croiss.kpi_k_p")) +
      carteStat("📋", v(s, "waitlist_total"), t("croiss.kpi_attente")) +
      carteStat("📈", v(u, "ouvertures_30j"), t("croiss.kpi_ouvertures"));

    // Origine des inscriptions : ce qui amène réellement des familles.
    if (Array.isArray(src) && src.length) {
      const tbl = el("div", "croiss-sources");
      tbl.innerHTML = `<p class="stat-graph-titre">${t("croiss.sources")}</p>` +
        src.map(r => `<div class="croiss-source-l"><span>${echapper(r.source)}</span>
          <span><strong>${r.familles}</strong> ${t("croiss.sources_fam")}${r.attente ? ` · ${r.attente} ${t("croiss.sources_att")}` : ""}</span></div>`).join("");
      kpi.appendChild(tbl);
    }
  })();

  /* ----- Envois automatiques : interrupteur, file d'attente, réponses types ----- */
  c.appendChild(blocEnvoisAuto());

  /* ----- Les chantiers, phase par phase ----- */
  CROISSANCE_PHASES.forEach(ph => {
    const secPh = el("section", "carte croiss-phase");
    secPh.innerHTML = `<h2>${echapper(ph.titre)}</h2><p class="note">${echapper(ph.sous)}</p>`;
    chantiersDePhase(ph.id).forEach(ch => {
      const av = croissanceAvancement(ch, etat0);
      const marque = ch.perimetre === "hors" ? ` <span class="croiss-perim hors">${t("croiss.hors")}</span>`
                   : ch.perimetre === "plus_tard" ? ` <span class="croiss-perim plus-tard">${t("croiss.plus_tard")}</span>`
                   : ch.recurrent === "mois" ? ` <span class="croiss-perim recurrent">${t("croiss.recurrent")}</span>` : "";
      const titre = `${ch.emoji} ${echapper(ch.titre)}${marque} <span class="croiss-badge${av.pct === 100 ? " ok" : ""}">${av.faites}/${av.total}</span>`;
      const { details, corps } = blocPliable(titre, false, "croiss-" + ch.id);
      if (ch.perimetre !== "coeur") details.classList.add("croiss-attenue");
      corps.innerHTML = `<p class="croiss-but"><strong>${t("croiss.but")}</strong> ${echapper(ch.but)}</p>
        <p class="note"><strong>${t("croiss.kpi")}</strong> ${echapper(ch.kpi)} · <strong>${t("croiss.duree")}</strong> ${t("croiss.duree_val", { min: dureeChantier(ch) })}</p>`;

      ch.etapes.forEach(etape => {
        const faite = croissanceEtapeFaite(etape, etat0, ch);
        const l = el("label", "switch-ligne croiss-etape" + (faite ? " faite" : ""));
        const i = el("input"); i.type = "checkbox"; i.checked = faite;
        i.onchange = async () => {
          const etat = croissanceEtat();
          etat.etapes[croissanceCleEtape(ch, etape)] = i.checked ? aujourdHui() : false;
          i.disabled = true;
          await croissanceEnregistrer(etat);
          i.disabled = false;
          majSansSaut(() => rendre());
        };
        l.appendChild(i);
        const txt = el("span", "croiss-etape-txt");
        txt.innerHTML = `<strong>${echapper(etape.titre)}${etape.min ? ` <span class="croiss-min">${etape.min} min</span>` : ""}</strong>
          <small>${echapper(etape.detail || "")}</small>`;
        l.appendChild(txt);
        corps.appendChild(l);

        // Modèle d'e-mail rattaché à l'étape : accès direct.
        const m = etape.mail ? mailCroissance(etape.mail) : null;
        if (m) {
          const b = el("button", "mini-btn croiss-mail-lien", "✉️ " + t("croiss.voir_mail"));
          b.onclick = () => {
            croissanceMailOuvert = m.id;
            rendre();
            // Le modèle vit en bas de la page : on y amène l'admin.
            requestAnimationFrame(() => {
              const n = document.getElementById("cm-" + m.id);
              if (n) try { n.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) { /* ignore */ }
            });
          };
          corps.appendChild(b);
        }
      });

      // Note libre par chantier (contacts, décisions, apprentissages).
      const lNote = el("label", "champ", t("croiss.note"));
      const ta = el("textarea", "croiss-note");
      ta.rows = 2; ta.value = etat0.notes[ch.id] || "";
      ta.placeholder = t("croiss.note_ph");
      ta.onchange = async () => {
        const etat = croissanceEtat();
        etat.notes[ch.id] = ta.value.trim();
        await croissanceEnregistrer(etat);
        toast(t("croiss.note_ok"), "succes");
      };
      lNote.appendChild(ta);
      corps.appendChild(lNote);

      secPh.appendChild(details);
    });
    c.appendChild(secPh);
  });

  /* ----- Bibliothèque de modèles d'e-mails ----- */
  const secMails = el("section", "carte");
  secMails.innerHTML = `<h2>${t("croiss.mails_titre")}</h2>
    <p class="note">${t("croiss.mails_sous")}</p>`;
  CROISSANCE_MAILS.forEach(m => {
    const ouvert = croissanceMailOuvert === m.id;
    const { details, corps } = blocPliable(`✉️ ${echapper(m.titre)}`, ouvert, "croissmail-" + m.id);
    details.id = "cm-" + m.id;                 // cible du lien « Modèle d'e-mail »
    corps.innerHTML = `<p class="note"><strong>${t("croiss.mail_dest")}</strong> ${echapper(m.dest)}<br>
      <strong>${t("croiss.mail_quand")}</strong> ${echapper(m.quand)}</p>
      <p class="croiss-sujet"><strong>${t("croiss.mail_sujet")}</strong> ${echapper(m.sujet)}</p>
      <pre class="croiss-corps">${echapper(m.corps)}</pre>`;
    const bCopier = el("button", "btn-secondaire", "📋 " + t("croiss.copier"));
    bCopier.onclick = () => copierTexte(m.sujet + "\n\n" + m.corps);
    corps.appendChild(bCopier);
    const bMail = el("a", "btn-secondaire", "✉️ " + t("croiss.ouvrir_mail"));
    bMail.href = "mailto:?subject=" + encodeURIComponent(m.sujet) + "&body=" + encodeURIComponent(m.corps);
    corps.appendChild(bMail);
    secMails.appendChild(details);
  });
  c.appendChild(secMails);
}
// Modèle d'e-mail à déplier au prochain rendu (session).
let croissanceMailOuvert = null;

// Rendu de l'onglet Admin : barre de sous-navigation + sous-section active.
function vueAdmin(c) {
  const nav = el("nav", "sous-nav admin-sous-nav");
  SOUS_ONGLETS_ADMIN.forEach(([id, cle]) => {
    const b = el("button", "sous-nav-btn" + (sousOngletAdmin === id ? " actif" : ""), t(cle));
    // Badge « n non lus » sur la sous-section Retours.
    if (id === "retours" && adminRetoursNonLus > 0) {
      b.appendChild(el("span", "sous-nav-pin", String(adminRetoursNonLus)));
    }
    b.onclick = () => { sousOngletAdmin = id; rendre(); };
    nav.appendChild(b);
  });
  c.appendChild(nav);

  // Précharge une fois le nombre de retours non lus (best-effort) pour le badge.
  if (!_badgeRetoursFait) {
    _badgeRetoursFait = true;
    (async () => {
      const s = await adminStats();
      if (s && typeof s.feedback_non_lus === "number" && adminRetoursNonLus === null) {
        adminRetoursNonLus = s.feedback_non_lus;
        if (etat.vue === "reglages" && ongletParent === "admin") rendre();
      }
    })();
  }

  switch (sousOngletAdmin) {
    case "stats":
      c.appendChild(blocAdminStats());
      break;
    case "croissance":
      blocAdminCroissance(c);
      break;
    case "familles":
      c.appendChild(blocAdminFamilles());
      break;
    case "retours":
      c.appendChild(blocAdminRetours());
      break;
    case "contenu":
      c.appendChild(blocAdminBlagues());
      c.appendChild(blocDashboardScience());
      break;
    case "config":
      c.appendChild(blocAdminConfig());
      break;
    case "systeme":
      c.appendChild(blocAdminSysteme());
      break;
  }
}

// Envoi d'e-mail via la fonction commune send-mail.
// On utilise un fetch direct (et non sb.functions.invoke) car invoke masque le
// message d'erreur renvoyé par la fonction (« non-2xx » générique). Retourne
// { ok, status, detail }.
async function envoyerMailFn(payload) {
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

let semainePapierDebut = null;   // lundi de la semaine sélectionnée (session)

// Onglet « Semaine papier » : explique le rituel sans écran et génère la feuille A4.
function blocSemainePapier() {
  semainePapierDebut = semainePapierDebut || debutSemaine(aujourdHui());
  const sec = el("section", "carte papier-carte");
  const jours = joursSemaine(semainePapierDebut);
  sec.innerHTML = `<h2>${t("papier.titre")}</h2>
    <div class="papier-intro">🌿 ${t("papier.intro")}</div>`;

  // Choix de la semaine (◀ / libellé / ▶) — on peut aussi préparer les
  // semaines suivantes (impression à l'avance).
  const nav = el("div", "verif-nav");
  const prev = el("button", "verif-fleche", "◀");
  prev.onclick = () => { semainePapierDebut = decalerSemaine(semainePapierDebut, -7); rendre(); };
  const lbl = el("span", "verif-jour", libelleSemaine(jours[0], jours[6]));
  const next = el("button", "verif-fleche", "▶");
  next.onclick = () => { semainePapierDebut = decalerSemaine(semainePapierDebut, 7); rendre(); };
  nav.appendChild(prev); nav.appendChild(lbl); nav.appendChild(next);
  sec.appendChild(nav);

  // Deux mises en page possibles (choix à l'impression).
  sec.appendChild(el("p", "planif-sous", t("papier.format")));
  const b1 = el("button", "gros-bouton planete", t("papier.imprimer_jours"));
  b1.onclick = () => imprimerFeuilleSemaine("jours");
  const b2 = el("button", "btn-secondaire", t("papier.imprimer_total"));
  b2.onclick = () => imprimerFeuilleSemaine("total");
  sec.appendChild(b1);
  sec.appendChild(b2);
  return sec;
}

let encodeMode = "detaille";   // "detaille" | "express" (session)

// Exécute une action qui re-rend la page, en préservant la position de défilement
// (vertical de la page + horizontal de la grille d'encodage) pour éviter le saut
// en haut à chaque case cochée.
function majSansSaut(action) {
  const y = window.scrollY || window.pageYOffset || 0;
  const sc = document.querySelector(".enc-scroll");
  const sx = sc ? sc.scrollLeft : 0;
  action();
  const sc2 = document.querySelector(".enc-scroll");
  if (sc2) sc2.scrollLeft = sx;
  window.scrollTo(0, y);
}

// Encodage de la feuille papier dans l'app, pour la semaine sélectionnée et
// l'enfant actif. Deux modes : détaillé (grille jour par jour + comportement)
// ou express (juste les totaux de la semaine).
function blocEncoderSemaine() {
  const sec = el("section", "carte papier-carte");
  const enf = enfantActif();
  const jours = joursSemaine(semainePapierDebut || debutSemaine(aujourdHui()));
  const lettres = t("planif.jours_courts").split(",");
  sec.innerHTML = `<h2>${t("papier.encoder_titre")}</h2>
    <p class="note">${t("papier.encoder_note")}</p>`;

  // Sélection de l'enfant à encoder.
  const enfRow = el("div", "planif-enfants");
  Object.values(etat.enfants).forEach(e => {
    const b = el("button", "enf-chip" + (e.id === etat.enfantActif ? " on" : ""), echapper(e.prenom));
    b.onclick = () => { etat.enfantActif = e.id; ecrireCache(); rendre(); };
    enfRow.appendChild(b);
  });
  sec.appendChild(enfRow);

  // Bascule de mode (contrôle segmenté : icône + titre + courte explication).
  const modes = el("div", "enc-modes segmente");
  [["detaille", "📋", t("papier.mode_detaille")], ["express", "⚡", t("papier.mode_express")]].forEach(([val, ico, lab]) => {
    // Le libellé est de la forme « Titre (explication) » : on sépare les deux.
    const m = /^(.*?)\s*\((.*)\)\s*$/.exec(lab);
    const titre = m ? m[1] : lab;
    const hint = m ? m[2] : "";
    const b = el("button", "seg seg-mode" + (encodeMode === val ? " actif" : ""));
    b.innerHTML = `<span class="seg-ico">${ico}</span><span class="seg-txt"><span class="seg-titre">${echapper(titre)}</span>${hint ? `<span class="seg-hint">${echapper(hint)}</span>` : ""}</span>`;
    b.onclick = () => { encodeMode = val; rendre(); };
    modes.appendChild(b);
  });
  sec.appendChild(modes);

  if (encodeMode === "express") {
    // -- Mode express : totaux de la semaine --
    sec.appendChild(el("p", "planif-sous", t("papier.express_note", { prenom: echapper(enf.prenom) })));
    const mk = (champ, libelle) => {
      const l = el("label", "champ", libelle);
      const inp = el("input", "aj-val"); inp.type = "number"; inp.min = "0"; inp.inputMode = "numeric"; inp.value = "0";
      l.appendChild(inp); return { l, inp };
    };
    const c = mk("coeurs", "💛 " + t("money.coeurs"));
    const g = mk("gouttes", "💧 " + t("money.gouttes"));
    sec.appendChild(c.l); sec.appendChild(g.l);
    const b = el("button", "gros-bouton planete", t("papier.express_ajouter"));
    b.onclick = () => {
      const nc = Math.max(0, parseInt(c.inp.value, 10) || 0);
      const ng = Math.max(0, parseInt(g.inp.value, 10) || 0);
      if (!nc && !ng) { toast(t("papier.rien"), "info"); return; }
      if (nc) ajusterMonnaie(enf, "coeurs", nc);
      if (ng) ajusterMonnaie(enf, "gouttes", ng);
      toast(t("papier.express_ok", { prenom: enf.prenom }), "succes");
    };
    sec.appendChild(b);
    return sec;
  }

  // -- Mode détaillé : grille missions × 7 jours + comportement --
  // Navigation entre semaines (◀ / libellé / ▶) : permet de remplir la feuille
  // d'une semaine précédente (ou de préparer une semaine à venir).
  const navS = el("div", "verif-nav enc-nav-semaine");
  const prevS = el("button", "verif-fleche", "◀");
  prevS.onclick = () => { semainePapierDebut = decalerSemaine(semainePapierDebut || debutSemaine(aujourdHui()), -7); rendre(); };
  const estSemaineCourante = (semainePapierDebut || debutSemaine(aujourdHui())) >= debutSemaine(aujourdHui());
  const lblS = el("span", "verif-jour", libelleSemaine(jours[0], jours[6]) + (estSemaineCourante ? " · " + t("papier.semaine_actuelle") : ""));
  const nextS = el("button", "verif-fleche", "▶");
  nextS.onclick = () => { semainePapierDebut = decalerSemaine(semainePapierDebut || debutSemaine(aujourdHui()), 7); rendre(); };
  navS.appendChild(prevS); navS.appendChild(lblS); navS.appendChild(nextS);
  sec.appendChild(navS);

  const scroll = el("div", "enc-scroll");
  const grille = el("div", "enc-grille");
  // En-tête (jours).
  const head = el("div", "enc-ligne enc-head");
  head.appendChild(el("span", "enc-lib", ""));
  lettres.forEach(l => head.appendChild(el("span", "enc-jour", l)));
  grille.appendChild(head);

  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    const ms = missionsFeuille(enf, catId);
    if (!ms.length) return;
    const titre = el("div", "enc-cat", `${cat.monnaieEmoji} ${trData("cat", catId + ".nom", cat.nom)}`);
    grille.appendChild(titre);
    ms.forEach(m => {
      const ligne = el("div", "enc-ligne");
      ligne.appendChild(el("span", "enc-lib", `${m.emoji} ${titreMission(m)}`));
      jours.forEach(j => {
        const n = (enf.journal[j] || {})[m.id] || 0;
        const planifie = missionActiveJour(enf, m, j);   // jour prévu pour cette mission ?
        const b = el("button", "enc-case" + (n ? " on" : "") + (planifie ? "" : " hors"),
          n ? "✅" : (planifie ? "" : "·"));
        if (!planifie) b.title = t("papier.hors_jour");
        b.onclick = () => majSansSaut(() => modifierHistorique(enf, j, m, n > 0 ? -1 : +1));
        ligne.appendChild(b);
      });
      grille.appendChild(ligne);
    });
  });

  // Ligne comportement (auto-évaluation par jour).
  grille.appendChild(el("div", "enc-cat", `😊 ${t("papier.comportement")}`));
  const ligneC = el("div", "enc-ligne");
  ligneC.appendChild(el("span", "enc-lib", t("papier.humeur_jour")));
  const EMO = { bien: "😄", moyen: "😐", mauvais: "😠", "": "·" };
  jours.forEach(j => {
    const v = (enf.autoEval || {})[j] || "";
    const b = el("button", "enc-case enc-humeur" + (v ? " on" : ""), EMO[v]);
    b.onclick = () => majSansSaut(() => cyclerAutoEvalJour(enf, j));
    ligneC.appendChild(b);
  });
  grille.appendChild(ligneC);

  scroll.appendChild(grille);
  sec.appendChild(scroll);
  sec.appendChild(el("p", "note", t("papier.detaille_note")));
  return sec;
}
function decalerSemaine(debut, deltaJours) {
  const d = new Date(debut + "T00:00:00"); d.setDate(d.getDate() + deltaJours); return dateCle(d);
}
function libelleSemaine(d1, d2) {
  try {
    const a = new Date(d1 + "T00:00:00").toLocaleDateString(langue, { day: "numeric", month: "short" });
    const b = new Date(d2 + "T00:00:00").toLocaleDateString(langue, { day: "numeric", month: "short" });
    return t("papier.semaine_du", { a, b });
  } catch { return d1 + " → " + d2; }
}

// Construit la feuille A4 (HTML autonome) et ouvre la fenêtre d'impression.
function imprimerFeuilleSemaine(mode) {
  const jours = joursSemaine(semainePapierDebut);
  const lettres = t("planif.jours_courts").split(",");
  const famille = (typeof familleActive !== "undefined" && familleActive && familleActive.name) ? familleActive.name : "";
  const titreSem = libelleSemaine(jours[0], jours[6]);

  const auj = aujourdHui();
  const EMO_EVAL = { bien: "😄", moyen: "😐", mauvais: "😠" };
  const blocEnfant = (enf, k) => {
    const coul = enf.couleur || "#f6a623";
    let coeursSem = 0, gouttesSem = 0;   // déjà gagnés cette semaine (jours écoulés)
    let lignes = "";
    ["famille", "planete"].forEach(catId => {
      const cat = CATEGORIES[catId];
      const ms = missionsFeuille(enf, catId);
      if (!ms.length) return;
      lignes += `<tr class="cat"><td colspan="${mode === "jours" ? 8 : 2}">${cat.monnaieEmoji} ${trData("cat", catId + ".nom", cat.nom)}</td></tr>`;
      ms.forEach(m => {
        const nom = `${m.emoji} ${titreMission(m)} <small>(${cat.monnaieEmoji}${pointsMission(enf, m)})</small>`;
        // Total déjà fait cette semaine (jours écoulés) pour cette mission.
        let totMission = 0;
        jours.forEach(j => { if (j <= auj) totMission += (enf.journal[j] || {})[m.id] || 0; });
        if (catId === "planete") gouttesSem += totMission * pointsMission(enf, m);
        else coeursSem += totMission * pointsMission(enf, m);
        if (mode === "jours") {
          lignes += `<tr><td class="m">${nom}</td>` + lettres.map((_, i) => {
            const j = jours[i];
            if (!missionActiveJour(enf, m, j)) return `<td class="c hors">·</td>`;   // jour non prévu
            const fait = (enf.journal[j] || {})[m.id] || 0;
            if (j <= auj && fait) return `<td class="c faite">✓</td>`;               // déjà fait : pré-rempli
            return `<td class="c">☆</td>`;                                            // à cocher
          }).join("") + `</tr>`;
        } else {
          lignes += `<tr><td class="m">${nom}</td><td class="c large">${totMission || ""}</td></tr>`;
        }
      });
    });
    const entete = (mode === "jours")
      ? `<tr class="head"><th></th>${lettres.map(l => `<th>${l}</th>`).join("")}</tr>`
      : `<tr class="head"><th></th><th>${t("papier.total")}</th></tr>`;
    // Auto-évaluation du comportement : pré-remplie pour les jours écoulés.
    const humeur = `<div class="humeur">
        <div class="humeur-t">😊 ${t("papier.humeur")}</div>
        <table class="humeur-tbl">
          <tr class="head"><th></th>${lettres.map(l => `<th>${l}</th>`).join("")}</tr>
          <tr><td class="m">${t("papier.humeur_jour")}</td>${lettres.map((_, i) => {
            const ev = (enf.autoEval || {})[jours[i]];
            return (ev && jours[i] <= auj)
              ? `<td class="hc faite">${EMO_EVAL[ev] || ""}</td>`
              : `<td class="hc">😄 😐 😠</td>`;
          }).join("")}</tr>
        </table>
      </div>`;
    const tC = coeursSem ? `<strong>${coeursSem}</strong>` : `<span class="trait"></span>`;
    const tG = gouttesSem ? `<strong>${gouttesSem}</strong>` : `<span class="trait"></span>`;
    return `<div class="enfant enf-${k}" style="--c:${coul}">
        <h3>${vignetteEnfant(enf, "mini")} ${echapper(enf.prenom)} <span class="stars">★ ★ ★</span></h3>
        <table>${entete}${lignes}</table>
        ${humeur}
        <div class="totaux">💛 ${t("money.coeurs")} : ${tC}&nbsp;&nbsp; 💧 ${t("money.gouttes")} : ${tG}</div>
      </div>`;
  };

  const corps = Object.values(etat.enfants).map(blocEnfant).join("");
  const html = `<!doctype html><html lang="${langue}"><head><meta charset="utf-8">
    <title>${APP_NOM} — ${titreSem}</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      *{box-sizing:border-box} body{font-family:'Comic Sans MS','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2b3a4a;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .tete{display:flex;justify-content:space-between;align-items:center;
        background:linear-gradient(90deg,#fff1d6,#ffe3ef,#e3f3ff);border-radius:14px;
        padding:10px 14px;margin-bottom:8px;border:2px dashed #f6a623}
      .tete .logo{font-size:19px;font-weight:800}
      .tete .sem{font-size:13px;color:#5a6b7a;font-weight:700}
      .intro{font-size:11px;color:#6a7a88;margin:0 0 12px;text-align:center}
      .grille{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px}
      .enfant{break-inside:avoid;border:2px solid var(--c);border-radius:16px;padding:9px 11px;background:#fff}
      .enfant h3{margin:0 0 7px;font-size:15px;display:flex;align-items:center;gap:6px}
      .enfant h3 .em{font-size:19px}
      .enfant h3 .stars{margin-left:auto;color:#f2c200;font-size:13px;letter-spacing:2px}
      table{width:100%;border-collapse:separate;border-spacing:0;font-size:11px}
      th,td{border:1px solid #e0e6ec;padding:3px 4px;text-align:center}
      td.m{text-align:left;font-size:10.5px;line-height:1.2} td.m small{color:#9aa7b3}
      tr.cat td{background:var(--c);color:#fff;text-align:left;font-weight:800;font-size:10.5px;border-color:var(--c)}
      tr.head th{background:#f3f6fa;font-size:10px;width:23px;font-weight:800}
      td.c{width:23px;height:19px;color:#cfd8e0;font-size:12px} td.c.large{width:62px;color:#fff}
      td.c.hors{background:repeating-linear-gradient(45deg,#f4f4f4,#f4f4f4 3px,#eaeaea 3px,#eaeaea 6px);color:#c8c8c8}
      td.c.faite{background:#e7f7ee;color:#1d7a52;font-weight:800}
      td.hc.faite{background:#eef6ff;font-size:14px}
      .humeur{margin-top:8px} .humeur-t{font-size:10.5px;font-weight:800;margin-bottom:2px}
      .humeur-tbl td.hc{font-size:11px;letter-spacing:0;white-space:nowrap}
      .totaux{font-size:12px;margin-top:8px;font-weight:700}
      .totaux .trait{display:inline-block;width:46px;border-bottom:2px dotted #9aa7b3}
      .pied{margin-top:12px;font-size:10px;color:#8a97a3;text-align:center}
    </style></head><body>
    <div class="tete"><div class="logo">🌟 ${APP_NOM}${famille ? " · " + echapper(famille) : ""}</div><div class="sem">🗓️ ${titreSem}</div></div>
    <p class="intro">${t("papier.feuille_intro")}</p>
    <div class="grille">${corps}</div>
    <p class="pied">${t("papier.feuille_pied")}</p>
    </body></html>`;

  const w = window.open("", "_blank");
  if (!w) { toast(t("papier.popup_bloque"), "info"); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* impression annulée */ } }, 350);
}

// Au repos : un lien discret (PIN) pour activer le mode révision.
// Actif : une bannière compacte (◀ jour ▶ + Terminer) placée en haut de
// l'accueil ; les missions s'adaptent alors directement dans la grille standard.
function blocVerifJours(enf) {
  if (!retroActif) {
    const sec = el("section", "carte verif-jours");
    const b = el("button", "verif-activer", t("retro.activer"));
    b.onclick = () => activerModeRetro();
    sec.appendChild(b);
    return sec;
  }
  retroJour = retroJour || aujourdHui();
  const estAuj = retroJour >= aujourdHui();
  const sec = el("section", "carte revision-banniere");
  sec.innerHTML = `<div class="rev-titre">✏️ ${t("retro.modif_jour")}</div>`;
  const nav = el("div", "verif-nav");
  const prev = el("button", "verif-fleche", "◀");
  prev.onclick = () => decalerJourRetro(-1);
  const lbl = el("span", "verif-jour rev-jour", libelleJour(retroJour) + (estAuj ? " · " + t("retro.aujourdhui") : ""));
  const next = el("button", "verif-fleche", "▶");
  next.disabled = estAuj;
  next.onclick = () => decalerJourRetro(1);
  nav.appendChild(prev); nav.appendChild(lbl); nav.appendChild(next);
  sec.appendChild(nav);
  sec.appendChild(el("p", "note", t("retro.note2")));
  const bq = el("button", "gros-bouton planete", t("retro.quitter"));
  bq.onclick = quitterModeRetro;
  sec.appendChild(bq);
  return sec;
}

// Carte « Blague du jour » : la réponse se révèle au tap (effet surprise).
function blocBlagueDuJour() {
  const b = (typeof blagueDuJourVisible === "function") ? blagueDuJourVisible() : null;
  if (!b) return null;
  const sec = el("section", "carte blague-carte");
  sec.innerHTML = `<h2>${t("blague.titre")}</h2>
    <p class="blague-q">${b.q}</p>`;
  const rep = el("button", "blague-reveal", t("blague.reveler"));
  const rTxt = el("p", "blague-r");
  rTxt.textContent = b.r;
  rTxt.style.display = "none";
  // Avis sur la blague (j'aime / bof) — révélé en même temps que la réponse.
  const avisRow = el("div", "blague-avis");
  avisRow.style.display = "none";
  const majAvis = () => {
    const a = avisBlague(b.idx);
    bUp.classList.toggle("on", a === "up");
    bDown.classList.toggle("on", a === "down");
  };
  const bUp = el("button", "blague-avis-btn", "😂 " + t("blague.jaime"));
  const bDown = el("button", "blague-avis-btn", "😐 " + t("blague.bof"));
  bUp.onclick = () => { definirAvisBlague(b.idx, "up"); majAvis(); if (avisBlague(b.idx) === "up") confettis(); };
  bDown.onclick = () => { definirAvisBlague(b.idx, "down"); majAvis(); };
  avisRow.appendChild(bUp);
  avisRow.appendChild(bDown);
  majAvis();

  rep.onclick = () => {
    rTxt.style.display = "block";
    rep.style.display = "none";
    avisRow.style.display = "flex";
    confettis();
  };
  sec.appendChild(rep);
  sec.appendChild(rTxt);
  sec.appendChild(avisRow);
  return sec;
}

// Compliment du jour (espace parent) : une phrase d'encouragement concrète,
// basée sur la régularité/progression réelle de l'enfant sur une tâche
// précise (esprit « parentalité positive »). Se renouvelle chaque jour.
function blocComplimentDuJour(enf) {
  const sec = el("section", "carte compliment-carte");
  if (!enf) { sec.style.display = "none"; return sec; }
  const c = complimentDuJour(enf);
  if (!c) { sec.style.display = "none"; return sec; }
  sec.innerHTML = `<h2>💌 ${t("compliment.titre")}</h2>
    <p class="compliment-texte">${echapper(c.texte)}</p>
    <p class="note compliment-aide">${t("compliment.aide")}</p>`;
  return sec;
}

// Widget d'évaluation de la journée (Bien / Moyen / Pas top).
// mode "enfant" = auto-évaluation ; mode "parent" = évaluation par un parent.
function blocEval(enf, mode) {
  const sec = el("section", "carte eval-carte");
  // 😄 rayonne la joie · 😐 neutre · 😠 colère
  const CHOIX = [["bien", "😄"], ["moyen", "😐"], ["mauvais", "😠"]];
  // Construit une ligne de choix pour un jour donné.
  const ligneChoix = (courant, onPick) => {
    const row = el("div", "eval-choix");
    CHOIX.forEach(([v, e]) => {
      const b = el("button", "eval-btn eval-" + v + (courant === v ? " actif" : ""), `${e} ${t("eval." + v)}`);
      b.onclick = () => onPick(v);
      row.appendChild(b);
    });
    return row;
  };

  if (mode === "parent") {
    sec.innerHTML = `<h2>${t("eval.titre_parent", { prenom: echapper(enf.prenom) })}</h2>`;
    // Aujourd'hui + les 2 jours précédents (pour compléter ce qui manque).
    const base = new Date(aujourdHui() + "T00:00:00");
    const labels = [t("eval.aujourdhui"), t("eval.hier"), t("eval.avant_hier")];
    for (let i = 0; i < 3; i++) {
      const d = new Date(base); d.setDate(base.getDate() - i);
      const cle = dateCle(d);
      const courant = (enf.evalParent || {})[cle];
      const ligne = el("div", "eval-jour");
      ligne.appendChild(el("span", "eval-jour-lbl", labels[i] + (courant ? " ✓" : "")));
      ligne.appendChild(ligneChoix(courant, v => definirEvalParent(enf, v, cle)));
      sec.appendChild(ligne);
    }
    return sec;
  }

  // Enfant : le jour affiché (aujourd'hui, ou le jour révisé en mode révision),
  // en grand et expressif.
  sec.className = "carte eval-carte eval-enfant";
  sec.innerHTML = `<h2>${t("eval.titre_enfant")}</h2>`;
  const courant = (enf.autoEval || {})[jourAffiche()];
  const row = el("div", "eval-choix-grand");
  CHOIX.forEach(([v, e]) => {
    const b = el("button", "eval-gros eval-" + v + (courant === v ? " actif" : ""));
    b.innerHTML = `<span class="eval-gros-emoji">${e}</span><span class="eval-gros-lbl">${t("eval." + v)}</span>`;
    b.onclick = () => definirAutoEval(v);
    row.appendChild(b);
  });
  sec.appendChild(row);
  return sec;
}

// Rafraîchit en continu le bandeau dodo (l'ambiance suit l'heure réelle).
function majDodo() {
  if (etat.vue !== "accueil") return;
  const ancien = document.getElementById("dodo-bandeau");
  if (ancien) ancien.replaceWith(bandeauDodo(enfantActif()));
}

// Bandeau "dodo" : change d'ambiance selon l'heure et permet de valider
// la mission "aller au lit à l'heure" (toggle, points).
function bandeauDodo(enf) {
  const m = momentDodo(enf);
  const mission = MISSIONS.find(x => x.id === "coucher_lheure");
  const jour = aujourdHui();
  const fait = ((enf.journal[jour] || {})[mission.id] || 0) >= 1;
  const enAttente = enf.enAttente.some(a => a.missionId === mission.id && a.jour === jour);

  // Petite réplique rigolote le soir / la nuit (si l'humour est activé).
  let funDodo = "";
  if (typeof humourActif === "function" && humourActif()) {
    if (m.classe === "dodo-soir") funDodo = `<small class="dodo-fun">${t("dodo.fun_soir")}</small>`;
    else if (m.classe === "dodo-nuit") funDodo = `<small class="dodo-fun">${t("dodo.fun_nuit")}</small>`;
  }

  const sec = el("section", "dodo " + m.classe);
  sec.id = "dodo-bandeau";
  sec.innerHTML = `
    <div class="dodo-etoiles">✦ ✧ ⭐ ✦ ✧ ✦ ✧</div>
    <div class="dodo-txt"><strong>${m.emoji} ${titreMission(m)}</strong><small>🛏️ ${m.heure}</small>${funDodo}</div>
    <div class="dodo-chemin" title="${t("dodo.title")}">
      <span class="dc-bout">☀️</span>
      <div class="dc-piste"><div class="dc-rempli" style="width:${m.progress}%"></div>
        <span class="dc-token" style="left:${m.progress}%">⭐</span></div>
      <span class="dc-bout">🌙</span>
    </div>`;
  const jeune = estJeune(enf);
  const emojiCat = (CATEGORIES[mission.cat] || {}).monnaieEmoji || "💛";
  const ptsDodo = pointsMission(enf, mission);
  const texteAction = jeune
    ? `🛏️ ${pointsVisuels(ptsDodo, emojiCat, true)}`
    : t("dodo.bouton", { pts: ptsDodo });
  const b = el("button", "dodo-btn" + (fait ? " fait" : ""),
    fait ? t("dodo.fait") : (enAttente ? t("dodo.attente") : texteAction));
  b.onclick = () => validerMission(mission);
  sec.appendChild(b);
  return sec;
}

// Grille des missions d'une catégorie, adaptées à l'âge de l'enfant actif.
function grilleMissions(catId) {
  const enf = enfantActif();
  const cat = CATEGORIES[catId];
  const jour = jourAffiche();           // jour en révision (parent) ou aujourd'hui
  const journalJour = enf.journal[jour] || {};
  const liste = el("section", "missions");
  // La mission spéciale "coucher" est affichée à part (bandeau dodo).
  const actives = missionsActives(enf, catId, jour).filter(m => m.speciale !== "coucher");
  if (actives.length === 0) {
    liste.appendChild(el("p", "note", messageVide(t("missions.aucune"))));
    return liste;
  }
  const jeune = estJeune(enf);
  actives.forEach(m => {
    const fait = (journalJour[m.id] || 0) >= 1;
    const enAttente = !retroActif && enf.enAttente.some(a => a.missionId === m.id && a.jour === jour);
    // Tâche de tournante dont c'est le tour de cet enfant : on le dit sur la
    // tuile elle-même, avec la date de fin en infobulle.
    const rotM = rotationsDe(m.id).find(r => (r.enfants || []).includes(enf.id)
      && !jourOffRotation(r, jour) && enfantDeGardeRotation(r, jour) === enf.id);
    const carte = el("button", "mission" + (fait ? " fait" : "") + (enAttente ? " attente" : "")
      + (retroActif ? " revision" : "") + (rotM ? " tour" : ""));
    if (rotM) carte.title = t("rot.jusqu_a", { jour: jourLisible(periodeRotation(rotM, jour).fin) });
    const recompense = pointsVisuels(pointsMission(enf, m), cat.monnaieEmoji, jeune);
    carte.innerHTML = `
      ${rotM ? `<span class="m-tour" aria-label="${t("rot.badge")}">🔁</span>` : ""}
      <span class="m-emoji">${m.emoji}</span>
      <span class="m-titre">${titreMission(m)}</span>
      <span class="m-points">${fait ? "✅" : (enAttente ? "⏳" : recompense)}</span>`;
    // En révision (parent) : un tap (dé)valide directement pour le jour affiché.
    carte.onclick = () => {
      if (retroActif) {
        const n = (enf.journal[jour] || {})[m.id] || 0;
        majSansSaut(() => modifierHistorique(enf, jour, m, n > 0 ? -1 : +1));
      } else validerMission(m);
    };
    liste.appendChild(carte);
  });
  return liste;
}

// Palette : une couleur distincte par carte surprise.
const CS_COULEURS = ["#f6a623", "#e2566d", "#9b6ef3", "#2bb3c0", "#e88b2f", "#5b8def", "#c05fae", "#39c08a"];

/* ---------- Cartes surprises (objectif d'équipe) ----------
 * Activités à faire en famille, débloquées ensemble par les dons de Cœurs
 * 💛 de tous les enfants. Partagées : le même bloc s'affiche pour chacun. */
function blocCartesSurprises(enf) {
  const sec = el("section", "carte cartes-surprises");
  const cartes = (etat.cartesSurprises || []);
  let html = `<h2>${t("cs.titre")}</h2><p class="cs-sous">${t("cs.sous")}</p>`;
  if (!cartes.length) {
    html += `<p class="note">${t("cs.aucune")}</p>`;
    sec.innerHTML = html;
    return sec;
  }
  html += `<div class="cs-liste">`;
  cartes.forEach((c, idx) => {
    const couleur = CS_COULEURS[idx % CS_COULEURS.length];   // couleur propre à chaque carte
    const titre = trData("carte", c.id, c.titre);
    const activite = trData("carteAct", c.id, c.activite);
    const pct = Math.max(0, Math.min(100, Math.round((c.recolte / c.cout) * 100)));
    const reste = Math.max(0, c.cout - c.recolte);
    // Contributions des enfants (esprit d'équipe).
    const dons = Object.keys(c.dons || {})
      .filter(id => etat.enfants[id] && c.dons[id] > 0)
      .map(id => `<span class="cs-contrib-item">${echapper(etat.enfants[id].prenom)} ${c.dons[id]}</span>`)
      .join("");
    // Jauge très visuelle : piste colorée + coureur qui avance vers le cadeau.
    const jauge = `<div class="cs-jauge">
        <div class="cs-jauge-piste">
          <div class="cs-jauge-rempli" style="width:${pct}%"></div>
          <span class="cs-jauge-token" style="left:${pct}%">${c.debloquee ? "🎉" : "⭐"}</span>
          <span class="cs-jauge-but">${c.debloquee ? "🎁" : "🔒"}</span>
        </div>
        <div class="cs-jauge-bas"><span class="cs-jauge-chiffres">${c.recolte} / ${c.cout} 💛</span>
          <span class="cs-jauge-pct">${pct}%</span></div>
      </div>`;

    const visible = c.debloquee || c.revele;   // carte montrée (sinon : mystère)
    html += `<div class="cs-carte${c.debloquee ? " ouverte" : (visible ? " visible" : " mystere")}${c.faite ? " faite" : ""}" style="--cs-c:${couleur}">`;
    if (c.debloquee) {
      // Carte DÉBLOQUÉE (jauge pleine) : activité + invitation à la faire.
      html += `<div class="cs-tete"><span class="cs-emoji">${c.emoji}</span>
          <span class="cs-titre">${echapper(titre)}</span>
          <span class="cs-prix">${t("cs.debloquee")}</span></div>
        ${jauge}
        <p class="cs-activite">${echapper(activite)}</p>
        <p class="cs-afaire">${t("cs.a_faire")}</p>`;
      if (c.faite) html += `<p class="cs-faite-tag">${t("cs.faite")}</p>`;
      else html += `<button class="btn-secondaire cs-faite-btn" data-faite="${c.id}">${t("cs.faite_btn")}</button>`;
    } else {
      // Carte EN COURS : soit visible (objectif montré), soit mystère (caché).
      if (visible) {
        html += `<div class="cs-tete"><span class="cs-emoji">${c.emoji}</span>
          <span class="cs-titre">${echapper(titre)}</span>
          <span class="cs-prix">❓</span></div>
          <p class="cs-mystere-sous">${echapper(activite)}</p>`;
      } else {
        html += `<div class="cs-tete"><span class="cs-emoji cs-mystere-emoji">🎁</span>
          <span class="cs-titre">${t("cs.mystere")}</span>
          <span class="cs-prix">❓</span></div>
          <p class="cs-mystere-sous">${t("cs.mystere_sous")}</p>`;
      }
      html += `${jauge}
        <p class="cs-reste">${t("cs.reste", { reste })}</p>
        <div class="cs-dons">
          <button class="cs-don" data-don="${c.id}" data-montant="1">${t("cs.donner1")}</button>
          <button class="cs-don" data-don="${c.id}" data-montant="5">${t("cs.donner5")}</button>
          <button class="cs-don" data-don="${c.id}" data-montant="10">${t("cs.donner10")}</button>
        </div>`;
    }
    if (dons) html += `<div class="cs-contrib">${dons}</div>`;
    html += `</div>`;
  });
  html += `</div>`;
  sec.innerHTML = html;
  // Actions : dons (limités aux Cœurs disponibles de l'enfant actif) + "fait".
  sec.querySelectorAll(".cs-don").forEach(b => {
    const montant = parseInt(b.dataset.montant, 10);
    if (enf.coeurs < montant) b.disabled = true;
    b.onclick = () => donnerCarte(b.dataset.don, montant);
  });
  sec.querySelectorAll(".cs-faite-btn").forEach(b =>
    b.onclick = () => marquerCarteFaite(b.dataset.faite));
  return sec;
}

// Date en toutes lettres, courte et lisible par un enfant : « dimanche 2 août ».
function jourLisible(cle, avecMois) {
  try {
    const d = new Date(cle + "T00:00:00");
    return d.toLocaleDateString(langue, avecMois === false
      ? { weekday: "long" }
      : { weekday: "long", day: "numeric", month: "long" });
  } catch (e) { return cle; }
}

/* ---------- Tournantes, côté enfant ----------
 * Une tâche qui apparaît ou disparaît sans explication est vécue comme
 * arbitraire. Cette carte répond, pour chaque tournante à laquelle l'enfant
 * participe, aux trois questions : c'est le tour de qui, jusqu'à quand, et
 * quand revient le mien. Elle s'affiche AU-DESSUS des missions. */
// Point sur un cercle : angle en degrés, 0° = midi (haut), sens horaire.
function _pointRoue(cx, cy, rayon, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return [cx + rayon * Math.cos(rad), cy + rayon * Math.sin(rad)];
}
// Mini-roue tournante (SVG) : un secteur coloré par enfant de la tournante,
// SON AVATAR (le même qu'ailleurs dans l'app, pas un émoji générique), un
// repère fixe en haut (triangle rouge pointant VERS le disque), et le disque
// qui tourne pour amener l'enfant de garde sous ce repère. Le disque part
// posé sur la bonne réponse (style inline) : l'animation elle-même est
// déclenchée à part, quand la roue entre réellement dans l'écran — voir
// observerRoues()/jouerRoue(). Purement décorative (l'info est déjà donnée
// par le texte à côté) : cachée aux lecteurs d'écran.
function roueTournante(ids, idGarde, taille) {
  taille = taille || 104;
  const cx = 60, cy = 60, rayon = 52;
  const enfants = ids.map(id => etat.enfants[id]).filter(Boolean);
  const n = enfants.length;
  if (!n) return "";
  const step = 360 / n;
  const idx = Math.max(0, enfants.findIndex(e => e.id === idGarde));
  const angleCible = -((idx + 0.5) * step);

  let secteurs = "";
  if (n === 1) {
    secteurs = `<circle cx="${cx}" cy="${cy}" r="${rayon}" fill="${enfants[0].couleur || "#ccc"}"/>`;
  } else {
    enfants.forEach((e, i) => {
      const [x0, y0] = _pointRoue(cx, cy, rayon, i * step);
      const [x1, y1] = _pointRoue(cx, cy, rayon, (i + 1) * step);
      secteurs += `<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${rayon},${rayon} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${e.couleur || "#ccc"}" stroke="#fff" stroke-width="2"/>`;
    });
  }
  // Les avatars sont VOLONTAIREMENT en dehors du groupe qui tourne : sinon ils
  // pivoteraient avec le disque et se retrouveraient de travers (voire tête en
  // bas) selon l'angle d'arrivée. On calcule directement leur position
  // D'ARRIVÉE (angle du secteur + rotation cible) pour qu'ils restent toujours
  // droits, alignés sur leur secteur une fois la roue posée. Chaque avatar est
  // la même mini-scène SVG (buildAvatar) qu'ailleurs dans l'app, imbriquée et
  // mise à l'échelle (aucun identifiant interne dans avatar.js : pas de risque
  // de collision entre plusieurs avatars dans le même document).
  const TAILLE_AV = 34;
  const avatars = enfants.map((e, i) => {
    const angleFinal = (i + 0.5) * step + angleCible;
    const [ex, ey] = _pointRoue(cx, cy, rayon * 0.6, angleFinal);
    return buildAvatar(e.avatar).replace("<svg ",
      `<svg x="${(ex - TAILLE_AV / 2).toFixed(1)}" y="${(ey - TAILLE_AV / 2).toFixed(1)}" width="${TAILLE_AV}" height="${TAILLE_AV}" `);
  }).join("");

  return `<svg class="roue-svg" width="${taille}" height="${taille}" viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${rayon + 3}" fill="none" stroke="#e3edf5" stroke-width="3"/>
    <g class="roue-groupe" data-angle-cible="${angleCible}" style="transform:rotate(${angleCible}deg)">${secteurs}</g>
    <g class="roue-avatars">${avatars}</g>
    <polygon class="roue-pointeur" points="60,19 49,1 71,1"/>
  </svg>`;
}

// Anime une roue précise : rotation (avec petit rebond à l'atterrissage) +
// apparition des avatars une fois le disque quasiment posé. Web Animations
// API plutôt que CSS : on calcule l'angle cible exact en JS et on ne joue
// l'anim QUE quand jouerRoue() est appelée (voir observerRoues), jamais au
// chargement de la page.
function jouerRoue(svg) {
  const groupe = svg.querySelector(".roue-groupe");
  if (!groupe || typeof groupe.animate !== "function") return;
  const cible = parseFloat(groupe.dataset.angleCible || "0");
  groupe.animate([
    { transform: "rotate(0deg)" },
    { transform: `rotate(${cible + 1080 + 18}deg)`, offset: 0.7 },
    { transform: `rotate(${cible + 1080 - 8}deg)`, offset: 0.85 },
    { transform: `rotate(${cible + 1080}deg)` }
  ], { duration: 2100, easing: "cubic-bezier(.15,.7,.13,1)", fill: "forwards" });
  const avatars = svg.querySelector(".roue-avatars");
  if (avatars && typeof avatars.animate === "function") {
    avatars.animate(
      [{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }],
      { duration: 2100, fill: "forwards" }
    );
  }
}

// Observe les roues présentes dans la page et déclenche leur animation la
// PREMIÈRE fois qu'elles entrent réellement dans la zone visible de l'écran
// (pas au chargement, qui peut se produire hors champ si la carte est plus
// bas que l'écran). Rejoué une seule fois par roue. Respecte le réglage
// système « mouvement réduit » : dans ce cas, la roue reste simplement sur
// sa position finale (déjà posée via le style inline), sans animation.
function observerRoues() {
  const roues = document.querySelectorAll(".roue-svg:not([data-roue-vue])");
  if (!roues.length) return;
  const reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduit || typeof IntersectionObserver === "undefined") {
    roues.forEach(svg => svg.setAttribute("data-roue-vue", "1"));
    return;
  }
  const obs = new IntersectionObserver((entrees) => {
    entrees.forEach(entree => {
      if (!entree.isIntersecting) return;
      jouerRoue(entree.target);
      entree.target.setAttribute("data-roue-vue", "1");
      obs.unobserve(entree.target);
    });
  }, { threshold: 0.4 });
  roues.forEach(svg => obs.observe(svg));
}

function blocTournanteEnfant(enf) {
  const jour = jourAffiche();
  const rots = (etat.rotations || []).filter(r => (r.enfants || []).includes(enf.id));
  if (!rots.length) return null;

  const sec = el("section", "carte tournante-carte");
  // Deux groupes bien distincts : ce qui est SON tour (important, mis en
  // avant) et ce qui concerne un frère/une sœur ou un jour sans tâche
  // (purement informatif, en retrait — roue plus petite, section repliée
  // visuellement sous un intitulé).
  let htmlMoi = "", htmlAutres = "";
  rots.forEach(r => {
    const taches = (r.missions || []).map(id => {
      const m = trouverMission(id);
      return m ? `${m.emoji} ${titreMission(m)}` : null;
    }).filter(Boolean).join(", ");
    if (!taches) return;

    const p = periodeRotation(r, jour);
    const garde = enfantDeGardeRotation(r, jour);
    const off = jourOffRotation(r, jour);
    const suivant = apercuRotation(r, jour, 2)[1];
    const prenomDe = (id) => { const e = etat.enfants[id]; return e ? echapper(e.prenom) : "—"; };

    if (off) {
      htmlAutres += `<div class="tr-bloc off"><div class="tr-roue-wrap"></div><div class="tr-texte">
        <div class="tr-titre">🔁 ${t("rot.off_titre")}</div>
        <div class="tr-taches">${taches}</div>
        <div class="tr-quand">${t("rot.off_txt")}</div></div></div>`;
    } else if (garde === enf.id) {
      const roue = roueTournante(r.enfants, garde, 104);
      const ensuite = (suivant && suivant.enfant !== enf.id)
        ? " " + t("rot.ensuite_enf", { prenom: prenomDe(suivant.enfant) }) : "";
      htmlMoi += `<div class="tr-bloc moi"><div class="tr-roue-wrap">${roue}</div><div class="tr-texte">
        <div class="tr-titre">🔁 ${t("rot.moi_titre")}</div>
        <div class="tr-taches">${taches}</div>
        <div class="tr-quand">${t("rot.jusqu_a", { jour: jourLisible(p.fin) })}${ensuite}</div></div></div>`;
    } else {
      // « Ton tour revient lundi 27 » ET « et demain c'est toi » disaient la
      // même chose deux fois : quand le tour commence demain, on ne dit que ça.
      const roue = roueTournante(r.enfants, garde, 68);
      const mien = prochainTourRotation(r, enf.id, jour);
      const demainMonTour = !!mien && mien.debut === demain(jour);
      const quand = !mien ? ""
        : (demainMonTour ? `🌙 ${t("rot.ton_tour_demain")}`
                         : t("rot.ton_tour", { jour: jourLisible(mien.debut) }));
      htmlAutres += `<div class="tr-bloc autre${demainMonTour ? " demain" : ""}"><div class="tr-roue-wrap">${roue}</div><div class="tr-texte">
        <div class="tr-titre">🔁 ${t("rot.autre_titre", { prenom: prenomDe(garde) })}</div>
        <div class="tr-taches">${taches}</div>
        <div class="tr-quand">${quand}</div></div></div>`;
    }
  });
  if (!htmlMoi && !htmlAutres) return null;

  let html = "";
  if (htmlMoi) html += `<div class="tr-groupe tr-groupe-moi">${htmlMoi}</div>`;
  if (htmlAutres) html += `<div class="tr-groupe tr-groupe-autres">
    <p class="tr-section-titre">👨‍👩‍👧 ${t("rot.section_famille")}</p>${htmlAutres}</div>`;

  sec.innerHTML = html;
  return sec;
}

// Badges : médailles colorées — seuls les badges RÉALISÉS sont affichés.
function blocBadges(enf) {
  const gagnes = new Set((enf.badges || []).map(b => b.id));
  // On suit l'ordre du catalogue, mais on ne garde que les badges obtenus.
  const obtenus = BADGES_CATALOGUE.filter(b => gagnes.has(b.id));
  const sec = el("section", "carte badges-carte");
  let html = `<h2>${t("home.mes_badges")} <span class="badges-compteur">${obtenus.length}</span></h2>`;
  if (!obtenus.length) {
    html += `<p class="note">${t("badges.aucun")}</p>`;
    sec.innerHTML = html;
    return sec;
  }
  html += `<div class="badges-grid">`;
  obtenus.forEach(b => {
    const nom = trData("badge", b.id, b.nom);
    html += `<div class="badge-fun gagne" title="${echapper(nom)}">
      <div class="badge-medaille"><span class="badge-emoji">${b.emoji}</span></div>
      <div class="badge-nom">${echapper(nom)}</div>
    </div>`;
  });
  html += `</div>`;
  sec.innerHTML = html;
  return sec;
}

/* ---------- Statistiques (espace parents) ---------- */
// Points gagnés par jour sur les `nbJours` derniers jours, à partir du journal.
function statsJournalieres(enf, nbJours) {
  const out = [];
  const base = new Date(aujourdHui() + "T00:00:00");
  for (let i = nbJours - 1; i >= 0; i--) {
    const d = new Date(base); d.setDate(base.getDate() - i);
    const cle = dateCle(d);
    const j = enf.journal[cle] || {};
    let coeurs = 0, gouttes = 0;
    Object.keys(j).forEach(mid => {
      const m = (typeof trouverMission === "function") ? trouverMission(mid) : null;
      if (!m) return;
      const pts = pointsMission(enf, m) * j[mid];
      if (m.cat === "planete") gouttes += pts; else coeurs += pts;
    });
    out.push({ cle, coeurs, gouttes, total: coeurs + gouttes });
  }
  return out;
}

// Ensemble des dates actives (clés du journal).
function joursActifsSet(enf) { return new Set(Object.keys(enf.journal || {})); }
// Série actuelle de jours consécutifs actifs (jusqu'à aujourd'hui/hier).
function serieActuelle(enf) {
  const set = joursActifsSet(enf);
  const base = new Date(aujourdHui() + "T00:00:00");
  // On tolère un démarrage hier (si rien fait aujourd'hui encore).
  let depart = 0;
  if (!set.has(dateCle(base))) depart = 1;
  let streak = 0;
  const d = new Date(base); d.setDate(base.getDate() - depart);
  while (set.has(dateCle(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
// Plus longue série de jours consécutifs jamais réalisée.
function meilleureSerie(enf) {
  const dates = Object.keys(enf.journal || {}).sort();
  let best = 0, cur = 0, prev = null;
  dates.forEach(c => {
    if (prev) { const diff = (new Date(c) - new Date(prev)) / 86400000; cur = diff === 1 ? cur + 1 : 1; }
    else cur = 1;
    best = Math.max(best, cur); prev = c;
  });
  return best;
}
// Nombre de jours actifs sur les n derniers jours (régularité).
function actifsDerniers(enf, n) {
  const set = joursActifsSet(enf);
  const base = new Date(aujourdHui() + "T00:00:00");
  let cpt = 0;
  for (let i = 0; i < n; i++) { const d = new Date(base); d.setDate(base.getDate() - i); if (set.has(dateCle(d))) cpt++; }
  return cpt;
}
// Missions les plus réalisées (toutes périodes) : [[id, n], ...].
function topMissions(enf, k) {
  const cpt = {};
  Object.values(enf.journal || {}).forEach(j => Object.keys(j).forEach(mid => cpt[mid] = (cpt[mid] || 0) + j[mid]));
  return Object.entries(cpt).sort((a, b) => b[1] - a[1]).slice(0, k);
}
// Jours écoulés depuis la dernière activité (null si jamais).
function joursDepuisActivite(enf) {
  const dates = Object.keys(enf.journal || {}).sort();
  if (!dates.length) return null;
  const last = new Date(dates[dates.length - 1] + "T00:00:00");
  return Math.round((new Date(aujourdHui() + "T00:00:00") - last) / 86400000);
}

// Comportement : nb de missions réalisées par domaine (entraide / écologie).
function missionsParCat(enf) {
  let fam = 0, pla = 0;
  Object.values(enf.journal || {}).forEach(j => Object.keys(j).forEach(mid => {
    const m = (typeof trouverMission === "function") ? trouverMission(mid) : null;
    if (!m) return;
    if (m.cat === "planete") pla += j[mid]; else fam += j[mid];
  }));
  return { fam, pla, total: fam + pla };
}

// Espace statistiques : évolution de chaque enfant (utile aussi pour un suivi
// psychologique : régularité, persévérance, équilibre prosocial/écologique).
function blocStatistiques() {
  const wrap = el("div");
  const intro = el("section", "carte");
  intro.innerHTML = `<h2>${t("stats.titre")}</h2><p class="note">${t("stats.sous")}</p>`;
  wrap.appendChild(intro);

  const NB = 14;
  Object.values(etat.enfants).forEach(enf => {
    const sec = el("section", "carte stat-enfant");
    sec.style.setProperty("--c", enf.couleur);
    const joursActifs = Object.keys(enf.journal).length;

    if (!joursActifs) {
      sec.innerHTML = `<h3 class="stat-nom">${echapper(enf.prenom)}</h3>
        <p class="note">${t("stats.aucune")}</p>`;
      wrap.appendChild(sec);
      return;
    }

    const jours = statsJournalieres(enf, NB);
    const max = Math.max(1, ...jours.map(d => d.total));
    const semaine = jours.slice(7).reduce((s, d) => s + d.total, 0);
    const semainePrec = jours.slice(0, 7).reduce((s, d) => s + d.total, 0);
    const diff = semaine - semainePrec;
    const tendance = diff > 0 ? `▲ +${diff}` : (diff < 0 ? `▼ ${diff}` : "→ =");
    const tendCls = diff > 0 ? "up" : (diff < 0 ? "down" : "flat");

    // Indicateurs de suivi.
    const serie = serieActuelle(enf);
    const record = meilleureSerie(enf);
    const reg30 = actifsDerniers(enf, 30);
    const totalPts = enf.coeursTotal + enf.gouttesTotal;
    const moyenne = Math.round(totalPts / joursActifs);
    const depuis = joursDepuisActivite(enf);
    const pctFam = totalPts ? Math.round((enf.coeursTotal / totalPts) * 100) : 50;
    const pctPla = 100 - pctFam;

    let html = `<h3 class="stat-nom">${echapper(enf.prenom)} <small>(${t("home.ans", { age: age(enf) })})</small></h3>
      <div class="stat-chiffres">
        <span class="stat-puce">💛 ${enf.coeursTotal}</span>
        <span class="stat-puce">💧 ${enf.gouttesTotal}</span>
        <span class="stat-puce">🏆 ${enf.badges.length}</span>
        <span class="stat-puce">🌳 ${nbTotalEspeces(enf)}</span>
        <span class="stat-puce">🔥 ${t("stats.serie", { n: serie, r: record })}</span>
        <span class="stat-puce">📅 ${t("stats.regularite", { n: reg30 })}</span>
        <span class="stat-puce">📈 ${t("stats.moyenne", { n: moyenne })}</span>
        <span class="stat-puce">⏱️ ${depuis === 0 ? t("stats.actif_auj") : t("stats.depuis", { n: depuis })}</span>
      </div>

      <p class="stat-graph-titre">${t("stats.points_14j")}
        <span class="stat-tendance ${tendCls}">${tendance}</span></p>
      <div class="stat-graph">`;
    jours.forEach(d => {
      const h = Math.round((d.total / max) * 100);
      html += `<div class="stat-col" title="${d.cle} · ${d.total} pts (💛${d.coeurs} 💧${d.gouttes})">
        <div class="stat-bar" style="height:${h}%"></div><span class="stat-jour">${d.cle.slice(8, 10)}</span></div>`;
    });
    html += `</div>
      <p class="note stat-compare">${t("stats.compare", { s: semaine, p: semainePrec })}</p>

      <p class="stat-graph-titre">${t("stats.equilibre")}</p>
      <div class="stat-balance">
        <div class="stat-balance-fam" style="width:${pctFam}%">💛 ${pctFam}%</div>
        <div class="stat-balance-pla" style="width:${pctPla}%">💧 ${pctPla}%</div>
      </div>`;

    const top = topMissions(enf, 3);
    if (top.length) {
      html += `<p class="stat-graph-titre">${t("stats.top")}</p><div class="stat-top">`;
      top.forEach(([mid, n]) => {
        const m = (typeof trouverMission === "function") ? trouverMission(mid) : null;
        const emoji = m ? m.emoji : "•";
        const nom = m ? trData("mission", m.id, m.titre) : mid;
        html += `<div class="stat-top-ligne"><span>${emoji} ${echapper(nom)}</span><span class="stat-top-n">×${n}</span></div>`;
      });
      html += `</div>`;
    }

    // Dépenses : collectif (dons aux cartes surprises) vs individuel (avatar).
    const dons = enf.donsTotal || 0, avat = enf.avatarTotal || 0, somDep = dons + avat;
    if (somDep > 0) {
      const pctDon = Math.round((dons / somDep) * 100);
      html += `<p class="stat-graph-titre">${t("stats.depenses")}</p>
        <div class="stat-balance">
          <div class="stat-dep-col" style="width:${pctDon}%">🎁 ${dons}</div>
          <div class="stat-dep-ind" style="width:${100 - pctDon}%">🎨 ${avat}</div>
        </div>
        <p class="note stat-compare">${t("stats.depenses_detail", { col: dons, ind: avat })}</p>`;
    }

    // Cartes surprises soutenues par cet enfant (ses choix collectifs).
    const cartesChoisies = (etat.cartesSurprises || [])
      .filter(c => c.dons && c.dons[enf.id] > 0)
      .map(c => [c.emoji, trData("carte", c.id, c.titre), c.dons[enf.id]]);
    if (cartesChoisies.length) {
      html += `<p class="stat-graph-titre">${t("stats.cartes_choix")}</p><div class="stat-top">`;
      cartesChoisies.forEach(([e, nom, n]) =>
        html += `<div class="stat-top-ligne"><span>${e} ${echapper(nom)}</span><span class="stat-top-n">${n} 💛</span></div>`);
      html += `</div>`;
    }

    // Styles d'avatar préférés (catégories les plus débloquées).
    const cats = {};
    (enf.debloque || []).forEach(cle => { const cat = cle.split(":")[0]; cats[cat] = (cats[cat] || 0) + 1; });
    const topCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topCats.length) {
      html += `<p class="stat-graph-titre">${t("stats.avatar_choix")}</p><div class="stat-top">`;
      topCats.forEach(([cat, n]) =>
        html += `<div class="stat-top-ligne"><span>${(AVATAR_LIBELLES[cat] || cat)}</span><span class="stat-top-n">×${n}</span></div>`);
      html += `</div>`;
    }

    // Répartitions objectives (sans interprétation).
    const mc = missionsParCat(enf);
    if (mc.total > 0) {
      const pro = Math.round((mc.fam / mc.total) * 100);
      html += `<div class="stat-axe"><span class="stat-axe-lbl">${t("stats.axe_entraide")} / ${t("stats.axe_ecologie")}</span>
        <div class="stat-balance">
          <div class="stat-balance-fam" style="width:${pro}%">${pro}%</div>
          <div class="stat-balance-pla" style="width:${100 - pro}%">${100 - pro}%</div>
        </div></div>`;
    }

    // Auto-évaluation de l'enfant + évaluation parent (comptes objectifs, 30 j).
    const compteEval = (m) => {
      const base = new Date(aujourdHui() + "T00:00:00");
      const c = { bien: 0, moyen: 0, mauvais: 0 };
      for (let i = 0; i < 30; i++) { const d = new Date(base); d.setDate(base.getDate() - i);
        const v = (m || {})[dateCle(d)]; if (v && c[v] !== undefined) c[v]++; }
      return c;
    };
    const ae = compteEval(enf.autoEval), pe = compteEval(enf.evalParent);
    if (ae.bien + ae.moyen + ae.mauvais > 0)
      html += `<p class="note stat-compare">${t("stats.autoeval")} : 😀 ${ae.bien} · 😐 ${ae.moyen} · 🙁 ${ae.mauvais}</p>`;
    if (pe.bien + pe.moyen + pe.mauvais > 0)
      html += `<p class="note stat-compare">${t("stats.evalparent")} : 😀 ${pe.bien} · 😐 ${pe.moyen} · 🙁 ${pe.mauvais}</p>`;

    // Frise jour par jour : ressenti de l'enfant vs du parent (14 jours).
    const aDesEvals = (Object.keys(enf.autoEval || {}).length + Object.keys(enf.evalParent || {}).length) > 0;
    if (aDesEvals) {
      const EMO = { bien: "😀", moyen: "😐", mauvais: "🙁" };
      const base = new Date(aujourdHui() + "T00:00:00");
      let cE = "", cP = "", cJ = "";
      for (let i = 13; i >= 0; i--) {
        const d = new Date(base); d.setDate(base.getDate() - i);
        const cle = dateCle(d);
        const ve = (enf.autoEval || {})[cle], vp = (enf.evalParent || {})[cle];
        cE += `<span class="stat-eval-c">${ve ? EMO[ve] : "·"}</span>`;
        cP += `<span class="stat-eval-c">${vp ? EMO[vp] : "·"}</span>`;
        cJ += `<span class="stat-eval-c stat-eval-j">${cle.slice(8, 10)}</span>`;
      }
      html += `<p class="stat-graph-titre">${t("stats.ressenti")}</p>
        <div class="stat-eval-grid">
          <div class="stat-eval-row"><span class="stat-eval-lbl">🧒</span>${cE}</div>
          <div class="stat-eval-row"><span class="stat-eval-lbl">👤</span>${cP}</div>
          <div class="stat-eval-row"><span class="stat-eval-lbl"></span>${cJ}</div>
        </div>`;
    }

    sec.innerHTML = html;
    wrap.appendChild(sec);
  });
  return wrap;
}

/* ---------- Vue Missions (famille / planète) ---------- */
// Options de don configurables (clé app_config → montant affiché).
const DON_PONCTUELS = [["don_once_10", "10 €"], ["don_once_20", "20 €"], ["don_once_50", "50 €"]];
const DON_MENSUELS  = [["don_sub_1", "1 €"], ["don_sub_3", "3 €"], ["don_sub_10", "10 €"]];

// Soutien : don 100 % facultatif. L'app est et restera gratuite.
function blocDon() {
  const cfg = (typeof configApp !== "undefined") ? configApp : {};
  const sec = el("section", "carte don-carte");
  let html = `<h2>${t("don.titre")}</h2>
    <p class="don-gratuit">${t("don.gratuit", { app: APP_NOM })}</p>
    <p class="don-texte">${t("don.texte", { app: APP_NOM })}</p>`;
  const ponct = DON_PONCTUELS.filter(([k]) => cfg[k]);
  const mens = DON_MENSUELS.filter(([k]) => cfg[k]);
  const libre = cfg.don_stripe_url || ((window.KP_CONFIG && window.KP_CONFIG.DON_URL) || "");

  if (ponct.length) {
    html += `<p class="don-sous">${t("don.ponctuel")}</p><div class="don-options">` +
      ponct.map(([k, m]) => `<a class="don-opt" href="${cfg[k]}" target="_blank" rel="noopener">${m}</a>`).join("") +
      `</div>`;
  }
  if (mens.length) {
    html += `<p class="don-sous">${t("don.mensuel")}</p><div class="don-options">` +
      mens.map(([k, m]) => `<a class="don-opt mensuel" href="${cfg[k]}" target="_blank" rel="noopener">${m}<small>${t("don.par_mois")}</small></a>`).join("") +
      `</div>`;
  }
  if (!ponct.length && !mens.length && libre) {
    html += `<a class="gros-bouton don-bouton" href="${libre}" target="_blank" rel="noopener">${t("don.bouton")}</a>`;
  }
  if (ponct.length || mens.length || libre) html += `<p class="don-merci">${t("don.merci")}</p>`;
  sec.innerHTML = html;
  return sec;
}

/* ---------- Parrainage : demander au bon moment ----------
 * On ne demande jamais « dans le vide ». Juste après qu'une carte surprise a
 * été débloquée, le parent vient de vivre un bon moment en famille : c'est le
 * seul instant où proposer d'en parler à une autre famille est un plaisir et
 * non une corvée. Affiché sept jours au maximum, refermable définitivement,
 * jamais insistant. */
function blocBonMoment() {
  if (typeof modeDemo !== "undefined" && modeDemo) return null;
  if (etat.reglages && etat.reglages.parrainProposeVu) return null;      // refermé par le parent
  const cartes = cartesSurprises().filter(c => c.debloquee && c.debloqueeLe);
  if (!cartes.length) return null;
  // La plus récemment débloquée, et seulement si c'est frais (7 jours).
  const derniere = cartes.sort((a, b) => (a.debloqueeLe < b.debloqueeLe ? 1 : -1))[0];
  const jours = Math.floor((new Date(aujourdHui() + "T00:00:00") - new Date(derniere.debloqueeLe + "T00:00:00")) / 86400000);
  if (!(jours >= 0 && jours <= 7)) return null;

  const sec = el("section", "carte bon-moment");
  sec.innerHTML = `<h2>${t("bm.titre")}</h2>
    <p class="bm-carte">${derniere.emoji} <strong>${echapper(trData("carte", derniere.id, derniere.titre))}</strong></p>
    <p class="note">${t("bm.texte", { app: APP_NOM })}</p>`;
  const b = el("button", "gros-bouton famille", "🎁 " + t("bm.bouton"));
  b.onclick = () => modaleParrainage();
  sec.appendChild(b);
  const bNon = el("button", "lien-oubli", t("bm.masquer"));
  bNon.onclick = () => {
    if (!etat.reglages) etat.reglages = {};
    etat.reglages.parrainProposeVu = true;
    sauver(); rendre();
  };
  sec.appendChild(bNon);
  return sec;
}

// Défis réparation (alternative bienveillante à la punition).
// Ce bloc est affiché dans l'espace parents : le mode d'emploi ci-dessous
// s'adresse donc au parent, qui coche le geste AVEC l'enfant.
function blocReparation() {
  const enf = enfantActif();
  const jeune = estJeune(enf);
  const rep = el("section", "carte reparation");
  rep.innerHTML = `<h2>${t("rep.titre")}</h2>
    <p>${t("rep.texte")}</p>
    <p class="rep-quand">${t("rep.quand", { prenom: echapper(enf.prenom) })}</p>`;

  // « Comment ça marche ? » — replié par défaut, pour ne pas alourdir l'écran
  // tout en levant l'incompréhension la plus fréquente des parents.
  const { details, corps } = blocPliable(t("rep.aide.titre"), false, "rep-aide");
  corps.innerHTML = `<ol class="rep-etapes">
      <li>${t("rep.etape1")}</li>
      <li>${t("rep.etape2")}</li>
      <li>${t("rep.etape3")}</li>
    </ol>
    <p class="reglage-aide">${t("rep.aide.annuler")}</p>
    <p class="reglage-aide">${t("rep.aide.pourquoi")}</p>`;
  rep.appendChild(details);

  const g = el("div", "missions");
  DEFIS_REPARATION.forEach(d => {
    const actif = reparationActive(enf, d.id);
    const b = el("button", "mission rep" + (actif ? " fait" : ""));
    b.innerHTML = `<span class="m-emoji">${d.emoji}</span>
      <span class="m-titre">${trData("defi", d.id, d.titre)}</span>
      <span class="m-points">${actif ? "✅" : pointsVisuels(d.bonus, "💛", jeune)}</span>`;
    b.onclick = () => defiReparation(d);
    g.appendChild(b);
  });
  rep.appendChild(g);
  return rep;
}

/* ---------- Vue Famille : activités d'équipe (cartes surprises) ---------- */
function vueFamille(c) {
  const enf = enfantActif();
  const cat = CATEGORIES.famille;

  const entete = el("section", "carte entete-cat");
  entete.style.setProperty("--c", cat.couleur);
  const soldeFam = estJeune(enf)
    ? `<span class="solde-pips">${repeterEmoji(enf.coeurs, cat.monnaieEmoji, 10)}</span>`
    : `${cat.monnaieEmoji} <strong>${enf.coeurs}</strong> ${t("money.coeurs")}`;
  entete.innerHTML = `<h1>${cat.emoji} ${t("cat.famille.nom")}</h1>
    <p class="solde">${soldeFam}</p>`;
  c.appendChild(entete);

  // Cartes surprises : objectif d'équipe à débloquer ensemble.
  c.appendChild(blocCartesSurprises(enf));
}

/* ---------- Vue Planète : écosystème ---------- */
function vuePlanete(c) {
  const enf = enfantActif();
  const cat = CATEGORIES.planete;

  const entete = el("section", "carte entete-cat");
  entete.style.setProperty("--c", cat.couleur);
  const soldePla = estJeune(enf)
    ? `<span class="solde-pips">${repeterEmoji(enf.gouttes, cat.monnaieEmoji, 10)}</span>`
    : `${cat.monnaieEmoji} <strong>${enf.gouttes}</strong> ${t("money.gouttes")}`;
  entete.innerHTML = `<h1>${cat.emoji} ${t("cat.planete.nom")}</h1>
    <p>${t("cat.planete.desc")}</p>
    <p class="solde">${soldePla}</p>`;
  c.appendChild(entete);

  // Scène vivante (vue d'ensemble fun, pour les petits).
  c.appendChild(sceneVivante(enf));

  // Écosystème détaillé (chaîne alimentaire).
  c.appendChild(vueEcosysteme(enf));
}

/* ---------- Scène vivante : l'écosystème comme un petit monde ---------- */
function sceneVivante(enf) {
  // On rassemble tous les êtres créés, en distinguant ceux "du ciel".
  const VOLANTS = ["coccinelle", "abeille", "papillon", "hibou", "aigle"];
  const ciel = [], plantes = [], animaux = [];
  TIERS_ECO.forEach(tier => {
    tier.especes.forEach(sp => {
      const n = (enf.ecosysteme[tier.id] || {})[sp.id] || 0;
      for (let k = 0; k < n; k++) {
        if (VOLANTS.includes(sp.id)) ciel.push(sp.emoji);          // vole dans le ciel
        else if (tier.id === "plantes") plantes.push(sp.emoji);    // immobile au sol
        else animaux.push(sp.emoji);                               // se déplace au sol
      }
    });
  });
  const total = ciel.length + plantes.length + animaux.length;
  // Le décor (couleurs uniquement) évolue : désert → prairie → forêt.
  let niveau = "desert";
  if (total >= 20) niveau = "foret"; else if (total >= 8) niveau = "prairie";

  const sec = el("section", "carte eco-monde-carte");
  let html = `<h2>${t("eco.monde_titre")} <span class="ecomonde-niveau">${t("eco.niveau_" + niveau)}</span></h2>
    <div class="ecomonde niveau-${niveau}">
      <div class="ecomonde-ciel">
        <span class="ecomonde-soleil">☀️</span>
        <span class="ecomonde-nuage c1">☁️</span>
        <span class="ecomonde-nuage c2">☁️</span>`;
  ciel.forEach((e, i) => { html += `<span class="ecomonde-vol" style="--i:${i}">${e}</span>`; });
  html += `</div><div class="ecomonde-sol">`;
  if (!total) {
    html += `<span class="ecomonde-vide">${t("eco.monde_vide")}</span>`;
  } else {
    // Plantes : immobiles (elles ne bougent pas).
    plantes.forEach(e => { html += `<span class="ecomonde-flore">${e}</span>`; });
    // Animaux : se déplacent au sol (marche + saut « Pixar »).
    animaux.forEach((e, i) => {
      html += `<span class="ecomonde-etre" style="--i:${i}"><span class="ecomonde-corps">${e}</span></span>`;
    });
  }
  html += `</div></div>
    <p class="eco-statut">${t("home.etres_vivants", { n: total })}</p>`;
  sec.innerHTML = html;
  return sec;
}

/* ---------- Scène : tous les êtres vivants créés ---------- */
function renduSceneEco(enf) {
  let html = "";
  TIERS_ECO.forEach(t => {
    t.especes.forEach(sp => {
      const n = (enf.ecosysteme[t.id] || {})[sp.id] || 0;
      for (let i = 0; i < n; i++)
        html += `<span class="eco-item" title="${trData("espece", sp.id, sp.nom)}">${sp.emoji}</span>`;
    });
  });
  return html;
}

/* ---------- Écosystème détaillé (chaîne alimentaire, cartes) ---------- */
function vueEcosysteme(enf) {
  const sec = el("section", "carte eco-carte");
  sec.innerHTML = `<h2>${t("eco.titre")}</h2>
    <p class="note">${t("eco.intro")}</p>`;

  const jeune = estJeune(enf);
  TIERS_ECO.forEach(tier => {
    const bloc = el("div", "eco-tier");
    const compte = nbTier(enf, tier.id);
    const compteAff = jeune ? repeterEmoji(compte, tier.emoji, 5) : compte;
    bloc.innerHTML = `<div class="eco-tier-tete"><span class="t-emoji">${tier.emoji}</span>
      <span class="t-nom">${trData("tier", tier.id, tier.nom)}</span><span class="t-compte${jeune ? " imgs" : ""}">${compteAff}</span></div>
      <p class="t-lecon">${trData("lecon", tier.id, tier.lecon)}</p>`;

    const grille = el("div", "eco-cartes");
    tier.especes.filter(sp => especeActivePourEnfant(enf, sp.id)).forEach(sp => {
      grille.appendChild(carteEspece(enf, tier, sp));
    });
    bloc.appendChild(grille);
    sec.appendChild(bloc);
  });

  return sec;
}

// Une carte d'espèce : emoji, nom, coût, prérequis cochés, état.
function carteEspece(enf, tier, sp) {
  const possede = (enf.ecosysteme[tier.id] || {})[sp.id] || 0;
  const prereqOk = especeDebloquee(enf, sp);
  const cout = coutEspece(enf, sp);
  const assezGouttes = enf.gouttes >= cout;
  const creable = prereqOk && assezGouttes;

  let etatCls = creable ? "creable" : (prereqOk ? "verrou-cout" : "verrou-prereq");
  const carte = el("button", "eco-carte-sp " + etatCls);

  // Prérequis : rien s'il n'y en a pas. Pour les petits (≤ seuil), on les
  // montre en images (ex. 2 fleurs côte à côte) ; sinon en compteur "x/y".
  let prereqHtml = "";
  const entrees = Object.keys(sp.prereq || {});
  const jeune = estJeune(enf);
  if (entrees.length) {
    prereqHtml = `<div class="ec-prereq">` + entrees.map(id => {
      const info = spInfo(id);
      const emoji = info ? info.sp.emoji : "?";
      const a = nbEspece(enf, id), req = sp.prereq[id];
      const ok = a >= req;
      if (jeune) {
        let imgs = "";
        for (let i = 0; i < req; i++) imgs += `<span class="ec-img${i < a ? " ok" : " ko"}">${emoji}</span>`;
        return `<span class="ec-need-img${ok ? " ok" : ""}">${imgs}</span>`;
      }
      return `<span class="ec-need ${ok ? "ok" : "ko"}">${emoji} ${a}/${req}${ok ? " ✓" : ""}</span>`;
    }).join("") + `</div>`;
  }

  const coinAff = jeune ? repeterEmoji(possede, sp.emoji, 5) : (possede ? "×" + possede : "");
  const coutAff = jeune ? repeterEmoji(cout, "💧", 6) : `${cout} 💧`;
  carte.innerHTML = `
    <span class="ec-coin${jeune ? " imgs" : ""}">${possede ? coinAff : ""}</span>
    <span class="ec-emoji">${sp.emoji}</span>
    <span class="ec-nom">${trData("espece", sp.id, sp.nom)}</span>
    <span class="ec-cout ${assezGouttes ? "" : "manque"}">${coutAff}</span>
    ${prereqHtml}
    <span class="ec-etat">${creable ? t("eco.creer") : (prereqOk ? t("eco.plus_gouttes") : t("eco.verrouille"))}</span>`;
  carte.onclick = () => creerEspece(tier, sp);
  return carte;
}

/* ---------- Vue Avatar ---------- */
const AVATAR_LIBELLES = {
  peau: "Couleur de peau", coiffure: "Coiffure", cheveux: "Couleur des cheveux",
  yeux: "Yeux", lunettes: "Lunettes", taches: "Taches de rousseur",
  pilosite: "Moustache / barbe", boucles: "Boucles d'oreilles", chapeau: "Chapeau",
  accessoire: "Accessoire", compagnon: "Compagnon", fond: "Décor"
};

function vueAvatar(c) {
  const enf = enfantActif();
  const jeune = estJeune(enf);

  const apercu = el("section", "carte avatar-apercu");
  const soldeAv = jeune
    ? `<span class="solde-pips">${repeterEmoji(enf.coeurs, "💛", 10)}</span>`
    : `💛 <strong>${enf.coeurs}</strong> Cœurs à dépenser`;
  apercu.innerHTML = `<h1>🎨 Mon avatar</h1>
    <div class="avatar-grand">${renduAvatar(enf)}</div>
    <p class="solde">${soldeAv}</p>`;
  c.appendChild(apercu);

  Object.keys(AVATAR_OPTIONS).forEach(categorie => {
    const sec = el("section", "carte");
    sec.innerHTML = `<h2>${AVATAR_LIBELLES[categorie]}</h2>`;
    const grille = el("div", "options");
    AVATAR_OPTIONS[categorie].forEach(opt => {
      const dispo = estDebloque(enf, categorie, opt);
      const equipe = enf.avatar[categorie] === opt.id;
      const o = el("button", "option" + (equipe ? " equipe" : "") + (dispo ? "" : " verrou"));
      let cout;
      if (dispo) cout = equipe ? (jeune ? "✅" : "Porté ✅") : (jeune ? "👆" : "Choisir");
      else cout = jeune ? `🔒 ${repeterEmoji(opt.cout, "💛", 6)}` : `🔒 ${opt.cout} 💛`;
      o.innerHTML = `
        <span class="o-apercu">${apercuOption(enf, categorie, opt)}</span>
        <span class="o-nom">${trData("avatar." + categorie, opt.id, opt.nom)}</span>
        <span class="o-cout">${cout}</span>`;
      o.onclick = () => acheterOption(categorie, opt);
      grille.appendChild(o);
    });
    sec.appendChild(grille);
    c.appendChild(sec);
  });
}

// Aperçu d'une option : on rend l'avatar de l'enfant en remplaçant
// uniquement la catégorie concernée, pour montrer l'effet réel.
function apercuOption(enf, categorie, opt) {
  if (categorie === "peau" || categorie === "cheveux") {
    // pour les couleurs, une pastille est plus lisible
    return `<span class="o-swatch" style="background:${opt.hex}"></span>`;
  }
  const apercu = { ...enf.avatar, [categorie]: opt.id };
  return buildAvatar(apercu);
}

function renduAvatar(enf) {
  return `<div class="avatar-scene">${buildAvatar(enf.avatar)}</div>`;
}

/* ---------- Vue Réglages (parents) ---------- */
const histDate = {}; // date sélectionnée pour la correction d'historique, par enfant
const planDate = {}; // date sélectionnée pour les missions du jour, par enfant

// Sélection des missions proposées à un enfant pour un jour donné.
// Tournantes : des tâches effectuées à tour de rôle par les enfants choisis
// (ex. mettre/débarrasser la table, une semaine sur deux entre 2 enfants).
let rotNouv = null;   // brouillon de création (session)
/* ---------- Tournantes, côté parent ----------
 * Une tournante se lit en une phrase : QUI fait QUOI, à quel RYTHME, jusqu'à
 * QUAND, et qui vient ensuite. Le tableau des prochains tours évite d'avoir
 * à faire le calcul de tête. */

// Nom complet d'un jour de semaine (0 = dimanche), dans la langue courante.
// On s'appuie sur une date de référence plutôt que sur une liste traduite :
// une liste de plus à maintenir dans quatre langues serait une liste de trop.
function nomJourSemaine(wd) {
  const d = new Date("2026-07-05T00:00:00");        // un dimanche
  d.setDate(d.getDate() + wd);
  try { return d.toLocaleDateString(langue, { weekday: "long" }); } catch (e) { return String(wd); }
}

// Liste lisible des jours sans tâche : « samedi, dimanche ».
function joursOffLisibles(rot) {
  if (!Array.isArray(rot.joursOff) || !rot.joursOff.length) return "";
  return [1, 2, 3, 4, 5, 6, 0].filter(wd => rot.joursOff.includes(wd)).map(nomJourSemaine).join(", ");
}

// La phrase de résumé, utilisée pour une tournante existante ET pour l'aperçu
// en direct du formulaire de création.
function phraseTournante(rot) {
  const taches = (rot.missions || []).map(id => {
    const m = trouverMission(id); return m ? `${m.emoji} ${titreMission(m)}` : null;
  }).filter(Boolean).join(", ") || "…";
  const prenoms = (rot.enfants || []).map(id => {
    const e = etat.enfants[id]; return e ? echapper(e.prenom) : null;
  }).filter(Boolean);
  const rythme = rot.periode === "jour" ? t("rot.rythme_jour") : t("rot.rythme_semaine");
  const qui = prenoms.length > 1
    ? prenoms.slice(0, -1).join(", ") + " " + t("rot.et") + " " + prenoms[prenoms.length - 1]
    : (prenoms[0] || "…");
  let phrase = t("rot.phrase", { taches, rythme, enfants: qui });
  const off = joursOffLisibles(rot);
  if (off) phrase += " " + t("rot.phrase_off", { jours: off });
  return phrase;
}

function carteTournante(r, jour) {
  const carte = el("div", "rot-item");
  const off = jourOffRotation(r, jour);
  const p = periodeRotation(r, jour);
  const suite = apercuRotation(r, jour, 5);
  const prenomDe = (id) => { const e = etat.enfants[id]; return e ? echapper(e.prenom) : "—"; };

  let html = `<p class="rot-phrase">${phraseTournante(r)}</p>`;
  // Qui, maintenant, et jusqu'à quand.
  html += `<p class="rot-maintenant">${off
    ? "⏸️ " + t("rot.off_auj")
    : "👤 " + t("rot.en_cours", { prenom: prenomDe(suite[0].enfant), jour: jourLisible(p.fin) })}`;
  if (suite[1]) html += ` <span class="rot-ensuite">${t("rot.ensuite", { prenom: prenomDe(suite[1].enfant) })}</span>`;
  html += `</p>`;
  // Le calendrier des prochains tours : plus besoin de compter de tête.
  html += `<span class="rot-apercu-t">${t("rot.apercu")}</span><div class="rot-apercu">` +
    suite.map((x, i) => `<span class="rot-tour${i === 0 ? " en-cours" : ""}">
      <strong>${prenomDe(x.enfant)}</strong>
      <small>${jourLisible(x.debut)}${x.debut !== x.fin ? " → " + jourLisible(x.fin, false) : ""}</small>
    </span>`).join("") + `</div>`;
  html += `<p class="note rot-depuis">${t("rot.depuis", { jour: jourLisible(r.debut || jour) })}</p>`;
  carte.innerHTML = html;

  const sup = el("button", "mini-btn danger", "🗑️");
  sup.onclick = () => { if (confirm(t("rot.confirm_suppr"))) supprimerRotation(r.id); };
  carte.appendChild(sup);
  return carte;
}

function blocTournantes() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("rot.titre")}</h2><p class="note">${t("rot.note")}</p>`;
  const jour = aujourdHui();

  // --- Tournantes existantes ---
  const liste = etat.rotations || [];
  if (liste.length) {
    liste.forEach(r => sec.appendChild(carteTournante(r, jour)));
  } else {
    sec.appendChild(el("p", "note", t("rot.aucune")));
  }

  // --- Création ---
  if (!rotNouv) rotNouv = { missions: [], enfants: [], periode: "semaine", joursOff: [], bascule: 1 };
  if (typeof rotNouv.bascule !== "number") rotNouv.bascule = 1;   // lundi par défaut
  const { details, corps } = blocPliable(`➕ ${t("rot.creer")}`, false, "rot-creer");
  corps.appendChild(el("p", "note rot-priorite-aide", `💡 ${t("rot.priorite_aide")}`));

  // Missions (cases à cocher, par catégorie)
  corps.appendChild(el("p", "sous-titre", t("rot.choix_missions")));
  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    toutesMissions().filter(m => m.cat === catId && m.speciale !== "coucher").forEach(m => {
      const l = el("label", "switch-ligne");
      const cb = el("input"); cb.type = "checkbox"; cb.checked = rotNouv.missions.includes(m.id);
      cb.onchange = () => {
        if (cb.checked) rotNouv.missions.push(m.id);
        else rotNouv.missions = rotNouv.missions.filter(x => x !== m.id);
      };
      l.appendChild(cb);
      l.appendChild(el("span", null, `${m.emoji} ${titreMission(m)} <small>(${cat.monnaieEmoji})</small>`));
      corps.appendChild(l);
    });
  });

  // Enfants (ordre = ordre de tour ; clic pour ajouter/retirer)
  corps.appendChild(el("p", "sous-titre", t("rot.choix_enfants")));
  const enfRow = el("div", "planif-enfants");
  Object.values(etat.enfants).forEach(e => {
    const pos = rotNouv.enfants.indexOf(e.id);
    const b = el("button", "enf-chip" + (pos >= 0 ? " on" : ""), `${echapper(e.prenom)}${pos >= 0 ? " " + (pos + 1) : ""}`);
    b.onclick = () => {
      if (pos >= 0) rotNouv.enfants.splice(pos, 1);
      else rotNouv.enfants.push(e.id);
      rendre();
    };
    enfRow.appendChild(b);
  });
  corps.appendChild(enfRow);

  // Période
  corps.appendChild(el("p", "sous-titre", t("rot.periode")));
  const perRow = el("div", "segmente");
  [["semaine", "🗓️ " + t("rot.par_semaine")], ["jour", "☀️ " + t("rot.par_jour")]].forEach(([val, lab]) => {
    const b = el("button", "seg" + (rotNouv.periode === val ? " actif" : ""), lab);
    b.onclick = () => { rotNouv.periode = val; rendre(); };
    perRow.appendChild(b);
  });
  corps.appendChild(perRow);
  corps.appendChild(el("p", "note rot-periode-aide", t("rot.periode_aide")));

  // Jours off (aucune tâche ce jour-là, ex. le week-end)
  corps.appendChild(el("p", "sous-titre", t("rot.jours_off")));
  const lettresJ = t("planif.jours_courts").split(",");
  const ordreJ = [1, 2, 3, 4, 5, 6, 0];   // L→D
  const offRow = el("div", "planif-jours");
  ordreJ.forEach((wd, i) => {
    const on = rotNouv.joursOff.includes(wd);
    const b = el("button", "jour-chip" + (on ? " on" : ""), lettresJ[i] || String(wd));
    b.onclick = () => {
      if (on) rotNouv.joursOff = rotNouv.joursOff.filter(x => x !== wd);
      else rotNouv.joursOff.push(wd);
      rendre();
    };
    offRow.appendChild(b);
  });
  corps.appendChild(offRow);

  // Jour de bascule (rythme hebdomadaire) : le tour change ce jour-là.
  let debutPrevu = aujourdHui();
  if (rotNouv.periode === "semaine") {
    corps.appendChild(el("p", "sous-titre", t("rot.bascule")));
    const bascRow = el("div", "planif-jours");
    [1, 2, 3, 4, 5, 6, 0].forEach((wd, i) => {
      const b = el("button", "jour-chip" + (rotNouv.bascule === wd ? " on" : ""), lettresJ[i] || String(wd));
      b.onclick = () => { rotNouv.bascule = wd; rendre(); };
      bascRow.appendChild(b);
    });
    corps.appendChild(bascRow);
    debutPrevu = dernierJourSemaine(aujourdHui(), rotNouv.bascule);
    corps.appendChild(el("p", "note", t("rot.bascule_aide", { jour: nomJourSemaine(rotNouv.bascule) })));
  }

  // Aperçu en direct : la phrase exacte et les premiers tours, AVANT de valider.
  if (rotNouv.missions.length && rotNouv.enfants.length) {
    const projet = {
      missions: rotNouv.missions, enfants: rotNouv.enfants,
      periode: rotNouv.periode, debut: debutPrevu, joursOff: rotNouv.joursOff
    };
    const ap = el("div", "rot-apercu-creation");
    ap.innerHTML = `<p class="sous-titre">${t("rot.apercu_creation")}</p>` +
      `<p class="rot-phrase">${phraseTournante(projet)}</p>`;
    const suite = apercuRotation(projet, aujourdHui(), 4);
    ap.innerHTML += `<div class="rot-apercu">` + suite.map((x, i) => {
      const e = etat.enfants[x.enfant];
      return `<span class="rot-tour${i === 0 ? " en-cours" : ""}"><strong>${e ? echapper(e.prenom) : "—"}</strong>
        <small>${jourLisible(x.debut)}${x.debut !== x.fin ? " → " + jourLisible(x.fin, false) : ""}</small></span>`;
    }).join("") + `</div>`;
    corps.appendChild(ap);
  }

  const bGo = el("button", "gros-bouton planete", t("rot.valider"));
  bGo.onclick = () => {
    if (rotNouv.missions.length < 1) { toast(t("rot.err_mission"), "info"); return; }
    if (rotNouv.enfants.length < 1) { toast(t("rot.err_enfants"), "info"); return; }
    const { missions, enfants, periode, joursOff, bascule } = rotNouv;
    const debut = periode === "semaine" ? dernierJourSemaine(aujourdHui(), bascule) : aujourdHui();
    rotNouv = null;
    ajouterRotation(missions, enfants, periode, debut, joursOff);
    toast(t("rot.creee"), "succes");
  };
  corps.appendChild(bGo);
  sec.appendChild(details);
  return sec;
}

// Sélection groupée : une matrice missions × enfants pour tout cocher d'un
// coup, avec repère visuel de l'adéquation à l'âge de chaque enfant.
function blocSelectionGroupee() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("grp_sel.titre")}</h2><p class="note">${t("grp_sel.note")}</p>`;
  const jour = aujourdHui();
  const enfants = Object.values(etat.enfants);

  // Actions globales.
  const actions = el("div", "grp-actions");
  const mkA = (cls, lab, mode) => {
    const b = el("button", cls, lab);
    b.onclick = () => majSansSaut(() => selectionGroupee(mode));
    return b;
  };
  actions.appendChild(mkA("gros-bouton planete", t("grp_sel.recommande"), "recommande"));
  actions.appendChild(mkA("btn-secondaire", t("grp_sel.tous"), "tous"));
  actions.appendChild(mkA("btn-secondaire", t("grp_sel.aucun"), "aucun"));
  sec.appendChild(actions);
  sec.appendChild(el("p", "note grp-legende", t("grp_sel.legende")));

  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    const ms = toutesMissions().filter(m => m.cat === catId);
    if (!ms.length) return;
    const { details, corps } = blocPliable(`${cat.emoji} ${trData("cat", catId + ".nom", cat.nom)}`, false, "grpsel-" + catId);
    const tbl = el("table", "grp-tbl");
    // En-tête : avatars des enfants.
    let head = `<tr><th class="grp-mlbl"></th>`;
    enfants.forEach(e => { head += `<th><span class="grp-enf" style="--c:${e.couleur}">${vignetteEnfant(e, "mini")}</span></th>`; });
    head += `</tr>`;
    tbl.innerHTML = head;
    ms.forEach(m => {
      const tr = el("tr");
      const lbl = el("td", "grp-mlbl");
      lbl.innerHTML = `${m.emoji} ${titreMission(m)} <small>${t("grp_sel.des_ans", { age: ageMinMission(m) })}</small>`;
      tr.appendChild(lbl);
      enfants.forEach(e => {
        const td = el("td", "grp-cell");
        const reco = age(e) >= ageMinMission(m);          // adapté à l'âge ?
        td.classList.add(reco ? "reco" : "jeune");
        const plan = planEffectif(e, jour);
        const inclus = plan ? plan.includes(m.id) : idsDefaut(e).includes(m.id);
        const cb = el("input"); cb.type = "checkbox"; cb.checked = inclus;
        cb.title = reco ? t("grp_sel.adapte", { prenom: e.prenom }) : t("grp_sel.jeune", { prenom: e.prenom });
        cb.onchange = () => majSansSaut(() => basculerPlan(e, jour, m.id));
        td.appendChild(cb);
        if (!reco) td.appendChild(el("span", "grp-warn", "⚠️"));
        tr.appendChild(td);
      });
      tbl.appendChild(tr);
    });
    corps.appendChild(tbl);
    sec.appendChild(details);
  });
  return sec;
}

function blocMissionsDuJour(enf) {
  const sec = el("section", "carte correction");
  sec.style.setProperty("--c", enf.couleur);
  const jour = planDate[enf.id] || aujourdHui();
  planDate[enf.id] = jour;
  const plan = planEffectif(enf, jour); // null = sélection par défaut
  const defauts = idsDefaut(enf);
  // Nombre de tâches sélectionnées vs conseillé (budget par âge).
  const selIds = (plan || defauts).filter(id => trouverMission(id));
  const totalSel = selIds.length;
  const conseille = tachesConseillees(age(enf));
  const trop = totalSel > conseille;
  sec.innerHTML = `<h2>${t("mdj.titre", { enf: echapper(enf.prenom) })}</h2>
    <p class="note">${t("mdj.note")}</p>
    <p class="note mdj-budget">${t("mdj.budget", { n: conseille, min: budgetMinJour() })}</p>
    <p class="mdj-compte ${trop ? "trop" : "ok"}">${t(trop ? "mdj.trop" : "mdj.compte", { sel: totalSel, n: conseille })}</p>`;

  const lDate = el("label", "champ", t("mdj.a_partir"));
  const iDate = el("input"); iDate.type = "date"; iDate.value = jour;
  iDate.onchange = () => { planDate[enf.id] = iDate.value || jour; rendre(); };
  lDate.appendChild(iDate);
  sec.appendChild(lDate);
  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    const dispo = toutesMissions().filter(m => m.cat === catId);   // toutes proposées
    if (!dispo.length) return;
    const choisis = dispo.filter(m => plan ? plan.includes(m.id) : defauts.includes(m.id)).length;
    // Liste déroulante par catégorie (évite une page interminable).
    const { details, corps } = blocPliable(`${cat.emoji} ${trData("cat", catId + ".nom", cat.nom)} · ${choisis}/${dispo.length}`, false, "mdj-" + enf.id + "-" + catId);
    dispo.forEach(m => {
      const inclus = plan ? plan.includes(m.id) : defauts.includes(m.id);
      const ligne = el("label", "switch-ligne");
      const cb = el("input"); cb.type = "checkbox"; cb.checked = inclus;
      cb.onchange = () => majSansSaut(() => basculerPlan(enf, jour, m.id));
      ligne.appendChild(cb);
      ligne.appendChild(el("span", null, `${m.emoji} ${titreMission(m)} (${cat.monnaieEmoji}${pointsMission(enf, m)})`));
      // Édition fine (renommer/points/planification) : réservée au mode expert.
      let editeur = null;
      if (estModeExpert()) {
        const edit = el("button", "mini-btn", "✏️");
        edit.title = t("mdj.modifier");
        editeur = blocEditionMission(m, cat);
        edit.onclick = (e) => {
          e.preventDefault();
          editeur.style.display = editeur.style.display === "none" ? "block" : "none";
        };
        ligne.appendChild(edit);
      }
      if (m.perso) {
        const sup = el("button", "mini-btn danger", "🗑️");
        sup.title = t("mdj.suppr_perso");
        sup.onclick = (e) => { e.preventDefault(); if (confirm(t("mdj.confirm_suppr", { nom: m.titre }))) supprimerMissionPerso(m.id); };
        ligne.appendChild(sup);
      }
      corps.appendChild(ligne);
      if (editeur) corps.appendChild(editeur);
    });
    sec.appendChild(details);
  });

  const rb = el("button", "btn-secondaire", t("mdj.defaut"));
  rb.onclick = () => reinitPlan(enf, jour);
  sec.appendChild(rb);

  // ----- Ajouter une mission personnalisée -----
  sec.appendChild(el("p", "sous-titre", t("mdj.ajouter_perso")));
  const form = el("div", "mission-perso-form");
  const iTitre = el("input"); iTitre.placeholder = t("mdj.nom_ph"); iTitre.maxLength = 40;
  const iEmoji = el("input"); iEmoji.placeholder = t("mdj.emoji_ph"); iEmoji.maxLength = 12; iEmoji.className = "mp-emoji";
  const iCat = el("select");
  iCat.innerHTML = `<option value="famille">🏡 ${t("cat.famille.nom")} (💛)</option><option value="planete">🌍 ${t("cat.planete.nom")} (💧)</option>`;
  const iPts = el("input"); iPts.type = "number"; iPts.min = "1"; iPts.max = "5"; iPts.value = "1"; iPts.className = "mp-pts";
  const bAdd = el("button", "btn-secondaire", t("mdj.ajouter"));
  bAdd.onclick = () => {
    ajouterMissionPerso(iCat.value, iTitre.value, iEmoji.value, iPts.value);
    iTitre.value = ""; iEmoji.value = "";
  };
  [iTitre, iEmoji, iCat, iPts, bAdd].forEach(x => form.appendChild(x));
  sec.appendChild(form);
  return sec;
}

// Éditeur inline d'une mission (nom, emoji, points) — préexistante ou perso.
function blocEditionMission(m, cat) {
  const box = el("div", "mission-edit");
  box.style.display = "none";
  const iEmoji = el("input"); iEmoji.className = "mp-emoji"; iEmoji.maxLength = 12;
  iEmoji.placeholder = t("mdj.emoji_ph"); iEmoji.value = m.emoji || "";
  const iTitre = el("input"); iTitre.maxLength = 40;
  iTitre.placeholder = t("mdj.nom_ph"); iTitre.value = titreMission(m);
  const iPts = el("input"); iPts.type = "number"; iPts.min = "1"; iPts.max = "9"; iPts.className = "mp-pts";
  iPts.value = m.points;
  const bOk = el("button", "mini-btn ok", t("mdj.enregistrer"));
  bOk.onclick = (e) => {
    e.preventDefault();
    modifierMission(m.id, "emoji", iEmoji.value);
    modifierMission(m.id, "titre", iTitre.value);
    modifierMission(m.id, "points", iPts.value);
  };
  [iEmoji, iTitre, iPts, bOk].forEach(x => box.appendChild(x));
  // Bouton « rétablir » pour les missions intégrées retouchées.
  if (!m.perso) {
    const bReset = el("button", "mini-btn", t("mdj.retablir"));
    bReset.onclick = (e) => { e.preventDefault(); reinitMission(m.id); };
    box.appendChild(bReset);
  }
  // Bloc planification (jours / dates / enfants).
  box.appendChild(blocPlanifMission(m));
  return box;
}

// Planification d'une mission : jours de la semaine (avec préréglages), plage
// de dates, et enfants concernés. Tout vide = mission active pour tous, tous
// les jours, sans limite de dates.
function blocPlanifMission(m) {
  const p = (typeof planifMission === "function" && planifMission(m.id)) || { jours: [], du: "", au: "", enfants: [] };
  const wrap = el("div", "planif");
  wrap.appendChild(el("p", "planif-titre", t("planif.titre")));

  // -- Préréglages rapides + jours de la semaine --
  const presets = el("div", "planif-presets");
  const mkPreset = (label, jours) => {
    const b = el("button", "mini-btn", label);
    b.onclick = (e) => { e.preventDefault(); definirPlanifMission(m.id, "jours", jours.slice()); };
    return b;
  };
  presets.appendChild(mkPreset(t("planif.tous"), []));
  presets.appendChild(mkPreset(t("planif.semaine"), [1, 2, 3, 4, 5]));
  presets.appendChild(mkPreset(t("planif.weekend"), [0, 6]));
  wrap.appendChild(presets);

  // L=1 … D=0 (ordre d'affichage lundi→dimanche)
  const ordre = [1, 2, 3, 4, 5, 6, 0];
  const labels = t("planif.jours_courts").split(",");   // "L,M,M,J,V,S,D"
  const sem = el("div", "planif-jours");
  ordre.forEach((wd, i) => {
    const b = el("button", "jour-chip" + ((p.jours || []).includes(wd) ? " on" : ""), labels[i] || String(wd));
    b.onclick = (e) => { e.preventDefault(); basculerPlanifElement(m.id, "jours", wd); };
    sem.appendChild(b);
  });
  wrap.appendChild(sem);

  // -- Plage de dates --
  const dates = el("div", "planif-dates");
  const lDu = el("label", "champ-mini", t("planif.du"));
  const iDu = el("input"); iDu.type = "date"; iDu.value = p.du || "";
  iDu.onchange = () => definirPlanifMission(m.id, "du", iDu.value || "");
  lDu.appendChild(iDu);
  const lAu = el("label", "champ-mini", t("planif.au"));
  const iAu = el("input"); iAu.type = "date"; iAu.value = p.au || "";
  iAu.onchange = () => definirPlanifMission(m.id, "au", iAu.value || "");
  lAu.appendChild(iAu);
  dates.appendChild(lDu); dates.appendChild(lAu);
  wrap.appendChild(dates);

  // -- Enfants concernés --
  wrap.appendChild(el("p", "planif-sous", t("planif.enfants")));
  const enfRow = el("div", "planif-enfants");
  Object.values(etat.enfants).forEach(enf => {
    const actif = (p.enfants || []).includes(enf.id);
    // vide = tous les enfants ; on coche visuellement « tous » si aucune restriction
    const b = el("button", "enf-chip" + (actif ? " on" : ""), echapper(enf.prenom));
    b.onclick = (e) => { e.preventDefault(); basculerPlanifElement(m.id, "enfants", enf.id); };
    enfRow.appendChild(b);
  });
  wrap.appendChild(enfRow);
  wrap.appendChild(el("p", "note planif-aide", t("planif.aide")));
  return wrap;
}

// Bloc de corrections manuelles pour un enfant (mode parents).
// Journal des dernières actions, avec un bouton « Annuler » par ligne.
// Annuler une action restaure l'état d'avant et invalide les actions plus
// récentes (elles disparaissent du journal).
function blocJournalActions() {
  const sec = el("section", "carte journal-actions");
  sec.innerHTML = `<h2>${t("journal.titre")}</h2>`;
  if (!Array.isArray(journalActions) || journalActions.length === 0) {
    sec.appendChild(el("p", "note", t("journal.vide")));
    return sec;
  }
  sec.appendChild(el("p", "note", t("journal.note")));
  journalActions.forEach((a, idx) => {
    const ligne = el("div", "journal-ligne");
    const quand = heureCourte(a.ts);
    const qui = a.enfant ? `<strong>${a.enfant}</strong> · ` : "";
    ligne.innerHTML = `<span class="journal-info">${qui}${a.libelle} <small>(${quand})</small></span>`;
    const b = el("button", "mini-btn non", t("journal.annuler"));
    // Seule la plus récente est strictement « la dernière » ; annuler une plus
    // ancienne annule aussi celles d'après, on prévient au-delà de la 1ʳᵉ.
    b.onclick = () => {
      if (idx > 0 && !confirm(t("journal.confirm_multi", { n: idx + 1 }))) return;
      annulerAction(a.id);
    };
    ligne.appendChild(b);
    sec.appendChild(ligne);
  });
  return sec;
}

// Heure courte locale HH:MM (pour le journal des actions).
function heureCourte(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Personnalisation fine par enfant : pour chaque enfant, on peut activer /
// désactiver et ajuster (points / coût) chaque mission et chaque espèce.
// Tout est présenté en listes déroulantes imbriquées pour rester compact.
function blocPersonnalisation() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("perso.titre")}</h2><p class="note">${t("perso.note")}</p>`;

  Object.values(etat.enfants).forEach(enf => {
    const { details: dEnf, corps: cEnf } = blocPliable(echapper(enf.prenom), false, "perso-" + enf.id);
    dEnf.style.setProperty("--c", enf.couleur);

    // Écosystème (plantes & animaux) : activer/désactiver + ajuster le coût.
    TIERS_ECO.forEach(tier => {
      cEnf.appendChild(el("p", "sous-titre", `${tier.emoji} ${trData("tier", tier.id, tier.nom)}`));
      tier.especes.forEach(sp => {
        const actif = especeActivePourEnfant(enf, sp.id);
        const ligne = el("div", "perso-ligne" + (actif ? "" : " off"));
        const cb = el("input"); cb.type = "checkbox"; cb.checked = actif;
        cb.onchange = () => majSansSaut(() => definirPersoEspece(enf, sp.id, "actif", cb.checked ? undefined : false));
        const lbl = el("span", "perso-lbl", `${sp.emoji} ${trData("espece", sp.id, sp.nom)}`);
        const cout = el("input", "perso-num"); cout.type = "number"; cout.min = "1";
        cout.inputMode = "numeric"; cout.value = coutEspece(enf, sp);
        cout.onchange = () => definirPersoEspece(enf, sp.id, "cout", Math.max(1, parseInt(cout.value, 10) || sp.cout));
        const unite = el("span", "perso-unite", "💧");
        ligne.appendChild(cb); ligne.appendChild(lbl); ligne.appendChild(cout); ligne.appendChild(unite);
        cEnf.appendChild(ligne);
      });
    });
    const bReset = el("button", "btn-secondaire mini-reset", t("perso.reinit"));
    bReset.onclick = () => { enf.persoEspeces = {}; sauver(); rendre(); };
    cEnf.appendChild(bReset);

    sec.appendChild(dEnf);
  });
  return sec;
}

function blocCorrections(enf) {
  const sec = el("section", "carte correction");
  sec.style.setProperty("--c", enf.couleur);
  sec.innerHTML = `<h2>${t("cor.titre", { enf: echapper(enf.prenom) })}</h2>
    <p class="note">${t("cor.note")}</p>`;

  // -- Ajusteurs de monnaie --
  [["coeurs", "💛 Cœurs"], ["gouttes", "💧 Gouttes"]].forEach(([champ, libelle]) => {
    const l = el("div", "ajusteur");
    l.appendChild(el("span", "aj-label", libelle));
    [-5, -1].forEach(d => { const b = el("button", "mini-btn", d); b.onclick = () => ajusterMonnaie(enf, champ, d); l.appendChild(b); });
    const inp = el("input", "aj-val"); inp.type = "number"; inp.value = enf[champ]; inp.min = 0;
    inp.onchange = () => { fixerMonnaie(enf, champ, inp.value); rendre(); };
    l.appendChild(inp);
    [1, 5].forEach(d => { const b = el("button", "mini-btn", "+" + d); b.onclick = () => ajusterMonnaie(enf, champ, d); l.appendChild(b); });
    sec.appendChild(l);
  });

  // -- Historique rétroactif --
  const jour = histDate[enf.id] || aujourdHui();
  histDate[enf.id] = jour;
  const lDate = el("label", "champ", t("cor.corriger_jour"));
  const iDate = el("input"); iDate.type = "date"; iDate.value = jour; iDate.max = aujourdHui();
  iDate.onchange = () => { histDate[enf.id] = iDate.value; rendre(); };
  lDate.appendChild(iDate);
  sec.appendChild(lDate);

  const journalJour = enf.journal[jour] || {};
  toutesMissions().filter(m => age(enf) >= m.ageMin).forEach(m => {
    const n = journalJour[m.id] || 0;
    const ligne = el("div", "hist-ligne" + (n ? " valide" : ""));
    const cat = CATEGORIES[m.cat];
    ligne.innerHTML = `<span class="h-info">${m.emoji} ${titreMission(m)} <small>${cat.monnaieEmoji}${pointsMission(enf, m)}</small></span>
      <span class="h-compte">${n}</span>`;
    const moins = el("button", "mini-btn", "−"); moins.onclick = () => modifierHistorique(enf, jour, m, -1);
    const plus = el("button", "mini-btn", "+"); plus.onclick = () => modifierHistorique(enf, jour, m, +1);
    ligne.appendChild(moins); ligne.appendChild(plus);
    sec.appendChild(ligne);
  });

  // -- Badges --
  const hBadges = el("h2", null, t("cor.badges")); hBadges.style.marginTop = "12px";
  sec.appendChild(hBadges);
  if (!enf.badges.length) {
    sec.appendChild(el("p", "note", t("cor.aucun_badge")));
  } else {
    enf.badges.forEach(b => {
      const ligne = el("div", "hist-ligne");
      ligne.innerHTML = `<span class="h-info">${b.emoji} ${b.nom}</span>`;
      const x = el("button", "mini-btn non", t("cor.retirer"));
      x.onclick = () => retirerBadge(enf, b.id);
      ligne.appendChild(x);
      sec.appendChild(ligne);
    });
  }
  if (enf.badgesRetires && enf.badgesRetires.length) {
    const r = el("button", "btn-secondaire", t("cor.reautoriser", { n: enf.badgesRetires.length }));
    r.onclick = () => reactiverBadges(enf);
    sec.appendChild(r);
  }
  const eff = el("button", "btn-secondaire", t("cor.effacer"));
  eff.onclick = () => effacerBadges(enf);
  sec.appendChild(eff);

  return sec;
}

// Tableau de référence (parents) : coût et prérequis de chaque espèce.
function blocEcoReference() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("ecoref.titre")}</h2>
    <p class="note">${t("ecoref.note")}</p>`;
  TIERS_ECO.forEach(tier => {
    // Liste déroulante par palier (plantes / herbivores / carnivores).
    const { details, corps } = blocPliable(`${tier.emoji} ${trData("tier", tier.id, tier.nom)} · ${tier.especes.length}`);
    tier.especes.forEach(sp => {
      const entrees = Object.keys(sp.prereq || {});
      const prereq = entrees.length
        ? entrees.map(id => {
            const info = spInfo(id);
            return `${sp.prereq[id]}× ${info ? info.sp.emoji + " " + trData("espece", info.sp.id, info.sp.nom) : id}`;
          }).join(", ")
        : t("ecoref.aucun");
      const ligne = el("div", "eco-ref-ligne");
      ligne.innerHTML = `<span class="erl-nom">${sp.emoji} ${trData("espece", sp.id, sp.nom)}</span>
        <span class="erl-cout">${sp.cout} 💧</span>
        <span class="erl-prereq">${prereq}</span>`;
      corps.appendChild(ligne);
    });
    sec.appendChild(details);
  });
  return sec;
}

// Gestion des cartes surprises par les parents (créer / modifier / supprimer).
function blocCartesSurprisesParents() {
  const sec = el("section", "carte cartes-surprises-parents");
  const cartes = (etat.cartesSurprises || []);
  let html = `<h2>${t("cs.gestion_titre")}</h2><p class="note">${t("cs.gestion_sous")}</p>`;
  html += `<div class="csp-liste">`;
  cartes.forEach((c, idx) => {
    const titre = trData("carte", c.id, c.titre);
    const activite = trData("carteAct", c.id, c.activite);
    html += `<div class="csp-carte">
      <div class="csp-ligne">
        <input class="csp-emoji" data-champ="emoji" data-id="${c.id}" value="${echapper(c.emoji)}" maxlength="3">
        <input class="csp-titre" data-champ="titre" data-id="${c.id}" value="${echapper(titre)}" placeholder="${t("cs.f_titre")}">
      </div>
      <input class="csp-activite" data-champ="activite" data-id="${c.id}" value="${echapper(activite)}" placeholder="${t("cs.f_activite")}">
      <div class="csp-ligne">
        <label class="csp-coutlbl">${t("cs.prix_label")}
          <input class="csp-cout" type="number" min="1" inputmode="numeric" data-champ="cout" data-id="${c.id}" value="${c.cout}"></label>
        <span class="csp-prog">${t("cs.recolte", { recolte: c.recolte, cout: c.cout })}</span>
      </div>
      <label class="switch-ligne csp-revele">
        <input type="checkbox" data-revele="${c.id}"${c.revele ? " checked" : ""}>
        <span>${t("cs.revele_label")}</span>
      </label>
      <div class="csp-actions">
        <button class="mini-btn" data-monter="${c.id}" title="${t("cs.monter")}"${idx === 0 ? " disabled" : ""}>▲</button>
        <button class="mini-btn" data-descendre="${c.id}" title="${t("cs.descendre")}"${idx === cartes.length - 1 ? " disabled" : ""}>▼</button>
        <button class="mini-btn" data-reinit="${c.id}">${t("cs.reinit")}</button>
        <button class="mini-btn danger" data-suppr="${c.id}">${t("cs.supprimer")}</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  // Formulaire d'ajout.
  html += `<div class="csp-ajout">
    <div class="csp-ligne">
      <input class="csp-emoji" id="csp-new-emoji" value="🎁" maxlength="3">
      <input class="csp-titre" id="csp-new-titre" placeholder="${t("cs.f_titre")}">
    </div>
    <input class="csp-activite" id="csp-new-activite" placeholder="${t("cs.f_activite")}">
    <div class="csp-ligne">
      <label class="csp-coutlbl">${t("cs.prix_label")}
        <input class="csp-cout" id="csp-new-cout" type="number" min="1" inputmode="numeric" value="${50 * Object.keys(etat.enfants).length}"></label>
      <button class="btn-secondaire" id="csp-add">${t("cs.f_ajouter")}</button>
    </div>
  </div>`;
  // Bibliothèque d'idées (parentalité positive) groupées par taille.
  const nbEnf = Object.keys(etat.enfants).length || 1;
  html += `<div class="csp-idees"><h3 class="csp-idees-titre">${t("cs.idees_titre")}</h3>
    <p class="note">${t("cs.idees_sous")}</p>`;
  ["petite", "moyenne", "grande"].forEach(taille => {
    const lot = IDEES_CARTES.filter(i => i.taille === taille);
    if (!lot.length) return;
    html += `<div class="csp-idees-groupe"><h4 class="csp-taille">${t("cs.taille_" + taille)}
      <span class="csp-taille-prix">${50 * (taille === "petite" ? 1 : taille === "moyenne" ? 4 : 20) * nbEnf} 💛</span></h4>
      <div class="csp-idees-liste">`;
    lot.forEach(i => {
      const titre = trData("idee", i.id, i.titre);
      const activite = trData("ideeAct", i.id, i.activite);
      html += `<button class="csp-idee" data-idee="${i.id}" title="${echapper(activite)}">
        <span class="csp-idee-emoji">${i.emoji}</span>
        <span class="csp-idee-txt"><strong>${echapper(titre)}</strong><small>${echapper(activite)}</small></span>
        <span class="csp-idee-plus">＋</span></button>`;
    });
    html += `</div></div>`;
  });
  html += `</div>`;

  sec.innerHTML = html;

  // Ajout en un clic depuis une idée proposée.
  sec.querySelectorAll("[data-idee]").forEach(b =>
    b.onclick = () => {
      const idee = IDEES_CARTES.find(i => i.id === b.dataset.idee);
      if (idee) ajouterCarteSurprise(idee.emoji, trData("idee", idee.id, idee.titre),
        trData("ideeAct", idee.id, idee.activite), idee.coutParEnfant * nbEnf, false);
    });

  // Édition en direct (on enregistre à la sortie du champ).
  sec.querySelectorAll("[data-champ]").forEach(inp =>
    inp.onchange = () => modifierCarteSurprise(inp.dataset.id, inp.dataset.champ, inp.value));
  sec.querySelectorAll("[data-revele]").forEach(cb =>
    cb.onchange = () => majSansSaut(() => modifierCarteSurprise(cb.dataset.revele, "revele", cb.checked)));
  sec.querySelectorAll("[data-monter]").forEach(b =>
    b.onclick = () => deplacerCarteSurprise(b.dataset.monter, -1));
  sec.querySelectorAll("[data-descendre]").forEach(b =>
    b.onclick = () => deplacerCarteSurprise(b.dataset.descendre, 1));
  sec.querySelectorAll("[data-reinit]").forEach(b =>
    b.onclick = () => reinitCarteSurprise(b.dataset.reinit));
  sec.querySelectorAll("[data-suppr]").forEach(b =>
    b.onclick = () => supprimerCarteSurprise(b.dataset.suppr));
  const add = sec.querySelector("#csp-add");
  if (add) add.onclick = () => ajouterCarteSurprise(
    sec.querySelector("#csp-new-emoji").value,
    sec.querySelector("#csp-new-titre").value,
    sec.querySelector("#csp-new-activite").value,
    sec.querySelector("#csp-new-cout").value);
  return sec;
}

// Onglet actif de l'espace parents (session, non synchronisé).
let ongletParent = "quotidien";

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
  if (!estModeExpert()) {
    const ids = ["quotidien", "enfants", "activites", "compte"];
    if (admin) ids.push("admin");
    return ids;
  }
  const ids = ["quotidien", "papier", "activites", "enfants", "famille", "compte", "stats"];
  if (admin) ids.push("admin");
  return ids;
}
const LIBELLES_ONGLETS = {
  quotidien: "grp.quotidien", papier: "grp.papier", activites: "grp.activites",
  enfants: "grp.enfants", famille: "grp.famille", compte: "grp.compte",
  stats: "grp.stats", admin: "grp.admin"
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
    // Semaine papier : onglet dédié en expert, dépliant sous « Activités » sinon.
    case "papier":  return ongletParent === (exp ? "papier" : "activites");
    // Famille & invitations : onglet dédié en expert, dans « Réglages » sinon.
    case "famille": return ongletParent === (exp ? "famille" : "compte");
    case "stats":   return exp && ongletParent === "stats";  // outil avancé
    default:        return ongletParent === section;
  }
}

// Change d'onglet parent d'un cran (dir = +1 suivant, -1 précédent), en boucle.
function changerOngletParentRelatif(dir) {
  const ids = ongletsParents();
  const i = Math.max(0, ids.indexOf(ongletParent));
  ongletParent = ids[(i + dir + ids.length) % ids.length];
  rendre();
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
function journeeEntamee() {
  const auj = aujourdHui();
  return Object.values(etat.enfants).some(e =>
    e.journal && e.journal[auj] && Object.keys(e.journal[auj]).length > 0);
}

function blocPremiersPas() {
  if (etat.reglages && etat.reglages.premiersPasVus) return null;
  const etapes = [
    { fait: profilsRenseignes(), titre: t("pp.e1_t"), desc: t("pp.e1_d"), onglet: "enfants", bouton: t("pp.e1_b") },
    { fait: missionsChoisies(),  titre: t("pp.e2_t"), desc: t("pp.e2_d") },
    { fait: journeeEntamee(),    titre: t("pp.e3_t"), desc: t("pp.e3_d") }
  ];
  if (etapes.every(e => e.fait)) return null;      // plus rien à expliquer

  const sec = el("section", "carte premiers-pas");
  sec.innerHTML = `<h2>${t("pp.titre")}</h2><p class="note">${t("pp.sous")}</p>`;
  const liste = el("ol", "pp-liste");
  etapes.forEach((e, i) => {
    const li = el("li", "pp-etape" + (e.fait ? " fait" : ""));
    li.innerHTML = `<span class="pp-num">${e.fait ? "✅" : (i + 1)}</span>
      <span class="pp-corps"><strong>${e.titre}</strong><small>${e.desc}</small></span>`;
    if (!e.fait && e.onglet) {
      const b = el("button", "mini-btn", e.bouton);
      b.onclick = () => { ongletParent = e.onglet; rendre(); };
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
      ok.onclick = () => confirmerAttente(enf, idx);
      const non = el("button", "mini-btn non", "✖️");
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

// ----- Choix Standard / Expert (deux gros boutons + explication) -----
function blocModeParents() {
  const exp = estModeExpert();
  const modeBloc = el("div", "mode-bloc");
  modeBloc.innerHTML = `<span class="langue-titre">🧭 ${t("mode.titre")}</span>`;
  const choix = el("div", "mode-choix");
  const bStd = el("button", "mode-btn" + (!exp ? " on" : ""), `🌿 ${t("mode.standard")}`);
  bStd.onclick = () => { if (exp) majSansSaut(() => definirModeExpert(false)); };
  const bExp = el("button", "mode-btn" + (exp ? " on" : ""), `🧪 ${t("mode.expert")}`);
  bExp.onclick = () => { if (!exp) majSansSaut(() => definirModeExpert(true)); };
  choix.appendChild(bStd); choix.appendChild(bExp);
  modeBloc.appendChild(choix);
  modeBloc.appendChild(el("p", "note mode-aide", t(exp ? "mode.aide_expert" : "mode.aide_standard")));
  return modeBloc;
}

// ----- Famille, invitations, parrainage, abonnement -----
// `c` = conteneur d'accueil (l'onglet lui-même, ou le corps d'un dépliant).
function sectionsFamille(c) {
  if (typeof modeDemo !== "undefined" && modeDemo) { c.appendChild(bandeauDemo()); return; }

  const fam = el("section", "carte");
  fam.innerHTML = `<h2>${t("fam.titre")}</h2>
    <p>${t("fam.label", { nom: familleActive ? echapper(familleActive.name) : "—" })}</p>
    <p class="note">${t("fam.note")}</p>`;
  const bInvite = el("button", "btn-secondaire", t("fam.creer_invitation"));
  bInvite.onclick = async () => {
    bInvite.disabled = true; bInvite.textContent = t("common.creation");
    const lien = await creerInvitation();
    bInvite.disabled = false; bInvite.textContent = t("fam.creer_invitation");
    if (lien) montrerLienInvitation(fam, lien);
  };
  fam.appendChild(bInvite);
  const bSwitch = el("button", "btn-secondaire", t("fam.changer"));
  bSwitch.onclick = changerFamille;
  fam.appendChild(bSwitch);
  c.appendChild(fam);

  // ----- Parrainage : inviter une famille amie à créer la sienne -----
  const par = el("section", "carte");
  par.innerHTML = `<h2>${t("parr.titre")}</h2>
    <p class="note">${t("parr.note", { app: APP_NOM })}</p>
    <p id="par-quota" class="parr-quota">${t("parr.quota_check")}</p>`;
  const bPar = el("button", "gros-bouton planete", t("parr.creer"));
  par.appendChild(bPar);
  c.appendChild(par);
  // Affiche le quota + reflète le nombre restant dans le bouton lui-même.
  const illimitePar = (typeof INVITATIONS_ILLIMITEES !== "undefined" && INVITATIONS_ILLIMITEES) || estAdmin;
  const majQuotaPar = (n) => {
    const q = par.querySelector("#par-quota");
    if (illimitePar) {
      q.innerHTML = t("parr.illimite"); q.className = "parr-quota ok";
      bPar.disabled = false; bPar.textContent = t("parr.creer");
    } else {
      q.innerHTML = t("parr.restant", { n }); q.className = "parr-quota " + (n > 0 ? "ok" : "vide");
      bPar.disabled = n <= 0;
      bPar.textContent = n > 0 ? t("parr.creer_n", { n }) : t("parr.epuise");
    }
  };
  parrainageRestant().then(majQuotaPar);
  bPar.onclick = async () => {
    bPar.disabled = true; bPar.textContent = t("common.creation");
    const lien = await creerParrainage();
    if (lien) {
      const mailto = {
        sujet: t("parr.sujet", { app: APP_NOM }),
        corps: t("parr.corps", { app: APP_NOM, lien: "{lien}" })
      };
      montrerLienInvitation(par, lien, t("parr.partage"), mailto);
      parrainageRestant().then(majQuotaPar);
    } else { parrainageRestant().then(majQuotaPar); }
  };

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
function sectionsCompte(c) {
  // Module bug/suggestion : early adopters uniquement.
  if (typeof estEarlyAdopter !== "function" || estEarlyAdopter()) c.appendChild(blocFeedback());
  if (typeof modeDemo !== "undefined" && modeDemo) { c.appendChild(bandeauDemo()); return; }

  const cpt = el("section", "carte");
  const u = typeof utilisateurCourant === "function" ? utilisateurCourant() : null;
  cpt.innerHTML = `<h2>${t("compte.titre")}</h2>
    <p>${t("compte.connecte", { email: u ? echapper(u.email) : "—" })}</p>`;
  const bDeco = el("button", "btn-secondaire", t("compte.deconnexion"));
  bDeco.onclick = deconnexion;
  cpt.appendChild(bDeco);
  const liensLegaux = el("p", "note");
  liensLegaux.innerHTML = `<a href="faq.html">Questions fréquentes</a> ·
    <a href="mentions-legales.html">Mentions légales</a> ·
    <a href="confidentialite.html">Politique de confidentialité</a>`;
  cpt.appendChild(liensLegaux);
  c.appendChild(cpt);

  const actions = el("section", "carte");
  actions.innerHTML = `<h2>${t("donnees.titre")}</h2>`;
  const bExp = el("button", "btn-secondaire", t("donnees.exporter"));
  bExp.onclick = exporter;
  const bRaz = el("button", "btn-danger", t("donnees.reset"));
  bRaz.onclick = reinitialiser;
  actions.appendChild(bExp);
  actions.appendChild(bRaz);
  c.appendChild(actions);

  // ----- 🛟 Récupération de données -----
  c.appendChild(blocRecuperation());

  // ----- ⚠️ Zone de danger : suppression du compte famille (propriétaire) -----
  if (familleActive && familleActive.role === "owner") {
    const danger = el("section", "carte zone-danger");
    danger.innerHTML = `<h2>${t("suppr.zone_titre")}</h2>
      <p class="suppr-avert">${t("suppr.avert")}</p>`;
    const bDel = el("button", "btn-danger", t("suppr.bouton"));
    bDel.onclick = () => supprimerCompteFamille();
    danger.appendChild(bDel);
    c.appendChild(danger);
  }
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

  // ----- Bandeau mode parents actif -----
  const banniere = el("section", "carte");
  banniere.innerHTML = `<h1>${t("par.actif.titre")} <span class="badge">${t("par.actif.badge")}</span></h1>`;
  const bq = el("button", "btn-secondaire", t("par.actif.quitter"));
  bq.onclick = quitterModeParents;
  banniere.appendChild(bq);
  // Sélecteur de langue « fun » : boutons drapeaux (plutôt qu'une liste).
  const blocLang = el("div", "langue-bloc");
  blocLang.innerHTML = `<span class="langue-titre">🌐 ${t("langue")}</span>`;
  blocLang.appendChild(selecteurLangueFun(() => rendre()));
  banniere.appendChild(blocLang);
  // Le choix Standard / Expert n'encombre l'entrée qu'en mode expert ; en mode
  // simplifié il vit tout en bas de l'onglet « Réglages ».
  if (exp) banniere.appendChild(blocModeParents());
  c.appendChild(banniere);

  // ----- Sous-menu (onglets) pour organiser l'espace parents -----
  const onglets = ongletsParents().map(id => [id, libelleOnglet(id)]);
  // Si l'onglet courant n'est plus visible (ex. passage en Standard), on revient au 1ᵉʳ.
  if (!onglets.some(([id]) => id === ongletParent)) ongletParent = onglets[0][0];
  const nav = el("nav", "sous-nav");
  let btnActif = null;
  onglets.forEach(([id, label]) => {
    const b = el("button", "sous-nav-btn" + (ongletParent === id ? " actif" : ""), label);
    if (ongletParent === id) btnActif = b;
    if (id === "quotidien" && totalAttente) {
      const pin = el("span", "sous-nav-pin", String(totalAttente));
      b.appendChild(pin);
    }
    b.onclick = () => { ongletParent = id; rendre(); };
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
  const prevB = el("button", "parent-indic-fleche", "◀");
  prevB.onclick = () => glisserVers(-1, () => changerOngletParentRelatif(-1));
  const nextB = el("button", "parent-indic-fleche", "▶");
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
    // faire d'abord, les encouragements ensuite.
    const pp = blocPremiersPas();
    if (pp) c.appendChild(pp);
    if (totalAttente) c.appendChild(blocAttente(totalAttente));
    const bm = blocBonMoment();
    if (bm) c.appendChild(bm);
    c.appendChild(blocMissionsDuJour(enfantActif()));
    c.appendChild(blocEval(enfantActif(), "parent"));
    c.appendChild(blocReparation());
    c.appendChild(blocComplimentDuJour(enfantActif()));
    if (typeof donDisponible !== "function" || donDisponible()) c.appendChild(blocDon());
    c.appendChild(blocJournalActions());
  } else {
    // ----- Compliment du jour : un mot d'encouragement concret à dire à
    // l'enfant, basé sur sa régularité/progression réelle (parentalité
    // positive). Tout en haut : c'est la première chose à voir chaque jour. -----
    c.appendChild(blocComplimentDuJour(enfantActif()));

    // ----- Comportement de l'enfant (évaluation parent) : en 1ʳᵉ place -----
    c.appendChild(blocEval(enfantActif(), "parent"));

    // ----- Défis réparation ("Oups, ça arrive…") : accès rapide -----
    c.appendChild(blocReparation());

    // ----- Soutien (don facultatif) : admins + familles de plus d'une semaine -----
    if (typeof donDisponible !== "function" || donDisponible()) c.appendChild(blocDon());

    // ----- Le bon moment pour parler de l'app (après une carte débloquée) -----
    const bmExp = blocBonMoment();
    if (bmExp) c.appendChild(bmExp);

    // ----- Validations en attente (affichées seulement s'il y en a) -----
    if (totalAttente) c.appendChild(blocAttente(totalAttente));

    // ----- Sélection groupée & tournantes : outils avancés -----
    c.appendChild(blocSelectionGroupee());
    c.appendChild(blocTournantes());

    // ----- Missions du jour (sélection par les parents) -----
    c.appendChild(blocMissionsDuJour(enfantActif()));

    // ----- Corrections fines (ajustements/badges) -----
    c.appendChild(blocCorrections(enfantActif()));

    // ----- Journal des actions récentes (annulation) -----
    c.appendChild(blocJournalActions());
  }

  } /* fin onglet quotidien */

  /* ===== ONGLET : Statistiques (expert) ===== */
  if (sectionVisible("stats")) {
    c.appendChild(blocStatistiques());
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

  /* ===== Semaine papier : onglet dédié en expert, dépliant en simplifié ===== */
  if (sectionVisible("papier")) {
    if (exp) {
      c.appendChild(blocSemainePapier());
      c.appendChild(blocEncoderSemaine());
    } else {
      const { details, corps } = blocPliable(t("grp.papier"), false, "std-papier");
      corps.appendChild(el("p", "note", t("papier.pour_quoi")));
      corps.appendChild(blocSemainePapier());
      corps.appendChild(blocEncoderSemaine());
      c.appendChild(details);
    }
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
    const dep = (titre, cle, remplir, ouvert) => {
      const { details, corps } = blocPliable(titre, !!ouvert, cle);
      remplir(corps);
      c.appendChild(details);
    };
    dep(t("regl.programme"), "std-prog", (x) => x.appendChild(blocProgramme()), true);
    dep(t("regl.famille"), "std-fam", (x) => sectionsFamille(x));
    dep(t("regl.compte"), "std-cpt", (x) => sectionsCompte(x));
    const modeCarte = el("section", "carte");
    modeCarte.appendChild(blocModeParents());
    c.appendChild(modeCarte);
  }
}

// Module de signalement (bug / suggestion) — réservé aux early adopters.
// Transmet par e-mail (mailto) à l'adresse de support.
// Adresse de support : configurable par l'admin (app_config), défaut hello@fami.team.
function emailSupport() {
  const cfg = (typeof configApp !== "undefined") ? configApp : {};
  return cfg.support_email || "hello@fami.team";
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
    const u = (typeof utilisateurCourant === "function") ? utilisateurCourant() : null;
    const type = selType.value === "bug" ? "Bug" : "Suggestion";
    const ctxObj = {
      famille: familleActive ? familleActive.name : null,
      langue, version: ETAT_VERSION, ua: navigator.userAgent || ""
    };
    const demo = (typeof modeDemo !== "undefined" && modeDemo);
    let envoye = false;
    b.disabled = true; b.textContent = t("common.creation");
    if (typeof sb !== "undefined" && sb && !demo) {
      // 1) Envoi automatique par e-mail (fonction commune send-mail, via SMTP OVH).
      const sujet = `${APP_NOM} — ${type}`;
      const corps = `${msg}\n\n--- Contexte ---\n${JSON.stringify(ctxObj, null, 2)}\nDe : ${u && u.email ? u.email : "—"}`;
      const res = await envoyerMailFn({ to: emailSupport(), subject: sujet, text: corps, replyTo: u ? u.email : undefined });
      if (res.ok) envoye = true;
      // 2) Stockage en base (best-effort).
      try {
        sb.rpc("submit_feedback", { p_type: selType.value, p_message: msg, p_context: ctxObj,
          p_family: (typeof familleId !== "undefined" ? familleId : null) });
      } catch (e) { /* ignore */ }
    }
    b.disabled = false; b.textContent = t("fb.envoyer");
    if (envoye) {
      ta.value = "";
      toast(t("fb.merci"), "succes");
    } else {
      // Repli : on ouvre le client mail de l'utilisateur.
      const contexte = `App: ${APP_NOM}\nType: ${type}\nEmail: ${u && u.email ? u.email : "—"}\n` +
        `Famille: ${familleActive ? familleActive.name : "—"}\nLangue: ${langue}\n` +
        `Version: ${ETAT_VERSION}\nDate: ${new Date().toISOString()}\nNavigateur: ${navigator.userAgent || "—"}`;
      const sujet = encodeURIComponent(`${APP_NOM} — ${type}`);
      const corps = encodeURIComponent(`${msg}\n\n--- Contexte technique ---\n${contexte}`);
      location.href = `mailto:${emailSupport()}?subject=${sujet}&body=${corps}`;
      toast(t("fb.merci"), "succes");
    }
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
