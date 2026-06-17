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
      <div class="pin-actions">
        <button id="pin-annuler" class="btn-secondaire">Annuler</button>
        <button id="pin-ok" class="gros-bouton planete">Valider</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const inp = ov.querySelector("#pin-input");
  const fermer = () => ov.remove();
  const valider = () => {
    const v = inp.value;
    if (!opts.permettreVide && !v.trim()) { inp.focus(); return; }
    fermer();
    if (opts.onOk) opts.onOk(v);
  };
  ov.querySelector("#pin-ok").onclick = valider;
  ov.querySelector("#pin-annuler").onclick = () => { fermer(); if (opts.onCancel) opts.onCancel(); };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") valider(); });
  // Ouvre tout de suite le clavier (numérique) du smartphone.
  setTimeout(() => { inp.focus(); inp.click(); }, 50);
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
  const majQuota = () => parrainageRestant().then(n => {
    const q = ov.querySelector("#pm-quota");
    if (typeof estAdmin !== "undefined" && estAdmin) { q.innerHTML = t("parr.illimite"); bCreer.disabled = false; }
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

    <header class="topbar">
      <button id="pastille-inviter" class="pastille-inviter" title="Inviter une autre famille">🎁</button>
      <div class="logo">🌟 ${APP_NOM} <span id="sync-etat" class="sync-etat" title="État de la synchronisation">…</span></div>
      <div id="selecteur-enfant" class="selecteur"></div>
    </header>

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

  // Minuteur : le bandeau dodo suit l'heure en continu (toutes les 20 s).
  if (!window.__dodoTimer) window.__dodoTimer = setInterval(majDodo, 20000);
}

// Panneau d'administration : liste de toutes les familles.
function blocAdmin() {
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
  // Option : envoyer le lien directement par e-mail (ouvre le client mail).
  if (mailto) {
    const mail = el("a", "btn-secondaire btn-mail", t("lien.envoyer_mail"));
    const corps = (mailto.corps || "").replace("{lien}", lien);
    mail.href = `mailto:${encodeURIComponent(mailto.to || "")}?subject=${encodeURIComponent(mailto.sujet || "")}&body=${encodeURIComponent(corps)}`;
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
function rendreSelecteur() {
  const s = $("#selecteur-enfant");
  s.innerHTML = "";
  Object.values(etat.enfants).forEach(enf => {
    const b = el("button", "pastille" + (enf.id === etat.enfantActif ? " actif" : ""));
    b.style.setProperty("--c", enf.couleur);
    b.innerHTML = `<span class="pastille-emoji">${enf.emoji}</span><span class="pastille-nom">${enf.prenom}</span>`;
    b.onclick = () => { etat.enfantActif = enf.id; ecrireCache(); rendre(); };
    s.appendChild(b);
  });
}

// Compteur de monnaie : chiffre pour les grands, suite d'emojis pour les ≤ 5 ans
// (qui ne lisent pas encore les chiffres). Plafonné pour rester lisible.
function compteurVisuel(emoji, n, jeune) {
  if (!jeune) return `<span class="big">${emoji} ${n}</span>`;
  const CAP = 12;
  if (!n) return `<span class="pips"><span class="pip vide">·</span></span>`;
  let pips = "";
  for (let i = 0; i < Math.min(n, CAP); i++) pips += `<span class="pip">${emoji}</span>`;
  if (n > CAP) pips += `<span class="pip-plus">✨</span>`;
  return `<span class="pips" title="${n}">${pips}</span>`;
}

// Répète un emoji `n` fois (plafonné) — pour montrer une quantité aux petits.
function repeterEmoji(n, emoji, cap) {
  cap = cap || 6;
  let s = "";
  for (let i = 0; i < Math.min(n, cap); i++) s += emoji;
  if (n > cap) s += "✨";
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
      const cle = d.toISOString().slice(0, 10);
      const courant = (enf.evalParent || {})[cle];
      const ligne = el("div", "eval-jour");
      ligne.appendChild(el("span", "eval-jour-lbl", labels[i] + (courant ? " ✓" : "")));
      ligne.appendChild(ligneChoix(courant, v => definirEvalParent(enf, v, cle)));
      sec.appendChild(ligne);
    }
    return sec;
  }

  // Enfant : uniquement aujourd'hui, en grand et expressif.
  sec.className = "carte eval-carte eval-enfant";
  sec.innerHTML = `<h2>${t("eval.titre_enfant")}</h2>`;
  const courant = (enf.autoEval || {})[aujourdHui()];
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

  const sec = el("section", "dodo " + m.classe);
  sec.id = "dodo-bandeau";
  sec.innerHTML = `
    <div class="dodo-etoiles">✦ ✧ ⭐ ✦ ✧ ✦ ✧</div>
    <div class="dodo-txt"><strong>${m.emoji} ${trData("mission", m.id, m.titre)}</strong><small>🛏️ ${m.heure}</small></div>
    <div class="dodo-chemin" title="${t("dodo.title")}">
      <span class="dc-bout">☀️</span>
      <div class="dc-piste"><div class="dc-rempli" style="width:${m.progress}%"></div>
        <span class="dc-token" style="left:${m.progress}%">⭐</span></div>
      <span class="dc-bout">🌙</span>
    </div>`;
  const jeune = estJeune(enf);
  const emojiCat = (CATEGORIES[mission.cat] || {}).monnaieEmoji || "💛";
  const texteAction = jeune
    ? `🛏️ ${pointsVisuels(mission.points, emojiCat, true)}`
    : t("dodo.bouton", { pts: mission.points });
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
  const jour = aujourdHui();
  const journalJour = enf.journal[jour] || {};
  const liste = el("section", "missions");
  // La mission spéciale "coucher" est affichée à part (bandeau dodo).
  const actives = missionsActives(enf, catId, jour).filter(m => m.speciale !== "coucher");
  if (actives.length === 0) {
    liste.appendChild(el("p", "note", t("missions.aucune")));
    return liste;
  }
  const jeune = estJeune(enf);
  actives.forEach(m => {
    const fait = (journalJour[m.id] || 0) >= 1;
    const enAttente = enf.enAttente.some(a => a.missionId === m.id && a.jour === jour);
    const carte = el("button", "mission" + (fait ? " fait" : "") + (enAttente ? " attente" : ""));
    const recompense = pointsVisuels(m.points, cat.monnaieEmoji, jeune);
    carte.innerHTML = `
      <span class="m-emoji">${m.emoji}</span>
      <span class="m-titre">${trData("mission", m.id, m.titre)}</span>
      <span class="m-points">${fait ? "✅" : (enAttente ? "⏳" : recompense)}</span>`;
    carte.onclick = () => validerMission(m);
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
      .map(id => `<span class="cs-contrib-item">${etat.enfants[id].emoji || "🙂"} ${c.dons[id]}</span>`)
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
    const cle = d.toISOString().slice(0, 10);
    const j = enf.journal[cle] || {};
    let coeurs = 0, gouttes = 0;
    Object.keys(j).forEach(mid => {
      const m = (typeof trouverMission === "function") ? trouverMission(mid) : null;
      if (!m) return;
      const pts = (m.points || 0) * j[mid];
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
  if (!set.has(base.toISOString().slice(0, 10))) depart = 1;
  let streak = 0;
  const d = new Date(base); d.setDate(base.getDate() - depart);
  while (set.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
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
  for (let i = 0; i < n; i++) { const d = new Date(base); d.setDate(base.getDate() - i); if (set.has(d.toISOString().slice(0, 10))) cpt++; }
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
      sec.innerHTML = `<h3 class="stat-nom">${enf.emoji} ${echapper(enf.prenom)}</h3>
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

    let html = `<h3 class="stat-nom">${enf.emoji} ${echapper(enf.prenom)} <small>(${t("home.ans", { age: age(enf) })})</small></h3>
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
        const v = (m || {})[d.toISOString().slice(0, 10)]; if (v && c[v] !== undefined) c[v]++; }
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
        const cle = d.toISOString().slice(0, 10);
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

// Défis réparation (alternative bienveillante à la punition).
function blocReparation() {
  const enf = enfantActif();
  const jeune = estJeune(enf);
  const rep = el("section", "carte reparation");
  rep.innerHTML = `<h2>${t("rep.titre")}</h2><p>${t("rep.texte")}</p>`;
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
    ? `<span class="solde-pips">${repeterEmoji(enf.coeurs, cat.monnaieEmoji, 12)}</span>`
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
    ? `<span class="solde-pips">${repeterEmoji(enf.gouttes, cat.monnaieEmoji, 12)}</span>`
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
    tier.especes.forEach(sp => {
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
  const assezGouttes = enf.gouttes >= sp.cout;
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
  const coutAff = jeune ? repeterEmoji(sp.cout, "💧", 6) : `${sp.cout} 💧`;
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
    ? `<span class="solde-pips">${repeterEmoji(enf.coeurs, "💛", 12)}</span>`
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
function blocMissionsDuJour(enf) {
  const sec = el("section", "carte correction");
  sec.style.setProperty("--c", enf.couleur);
  const jour = planDate[enf.id] || aujourdHui();
  planDate[enf.id] = jour;
  sec.innerHTML = `<h2>${t("mdj.titre", { enf: enf.emoji + " " + enf.prenom })}</h2>
    <p class="note">${t("mdj.note")}</p>`;

  const lDate = el("label", "champ", t("mdj.a_partir"));
  const iDate = el("input"); iDate.type = "date"; iDate.value = jour;
  iDate.onchange = () => { planDate[enf.id] = iDate.value || jour; rendre(); };
  lDate.appendChild(iDate);
  sec.appendChild(lDate);

  const plan = planEffectif(enf, jour); // null = sélection par défaut
  const defauts = idsDefaut(enf);
  ["famille", "planete"].forEach(catId => {
    const cat = CATEGORIES[catId];
    const dispo = toutesMissions().filter(m => m.cat === catId);   // toutes proposées
    if (!dispo.length) return;
    sec.appendChild(el("p", "sous-titre", `${cat.emoji} ${cat.nom}`));
    dispo.forEach(m => {
      const inclus = plan ? plan.includes(m.id) : defauts.includes(m.id);
      const ligne = el("label", "switch-ligne");
      const cb = el("input"); cb.type = "checkbox"; cb.checked = inclus;
      cb.onchange = () => basculerPlan(enf, jour, m.id);
      ligne.appendChild(cb);
      ligne.appendChild(el("span", null, `${m.emoji} ${trData("mission", m.id, m.titre)} (${cat.monnaieEmoji}${m.points})${m.perso ? " ✏️" : ""}`));
      if (m.perso) {
        const sup = el("button", "mini-btn danger", "🗑️");
        sup.title = t("mdj.suppr_perso");
        sup.onclick = (e) => { e.preventDefault(); if (confirm(t("mdj.confirm_suppr", { nom: m.titre }))) supprimerMissionPerso(m.id); };
        ligne.appendChild(sup);
      }
      sec.appendChild(ligne);
    });
  });

  const rb = el("button", "btn-secondaire", t("mdj.defaut"));
  rb.onclick = () => reinitPlan(enf, jour);
  sec.appendChild(rb);

  // ----- Ajouter une mission personnalisée -----
  sec.appendChild(el("p", "sous-titre", t("mdj.ajouter_perso")));
  const form = el("div", "mission-perso-form");
  const iTitre = el("input"); iTitre.placeholder = t("mdj.nom_ph"); iTitre.maxLength = 40;
  const iEmoji = el("input"); iEmoji.placeholder = t("mdj.emoji_ph"); iEmoji.maxLength = 4; iEmoji.className = "mp-emoji";
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

// Bloc de corrections manuelles pour un enfant (mode parents).
function blocCorrections(enf) {
  const sec = el("section", "carte correction");
  sec.style.setProperty("--c", enf.couleur);
  sec.innerHTML = `<h2>${t("cor.titre", { enf: enf.emoji + " " + enf.prenom })}</h2>
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
    ligne.innerHTML = `<span class="h-info">${m.emoji} ${trData("mission", m.id, m.titre)} <small>${cat.monnaieEmoji}${m.points}</small></span>
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
    const grp = el("div", "eco-ref-tier");
    grp.innerHTML = `<h3 class="eco-ref-titre">${tier.emoji} ${trData("tier", tier.id, tier.nom)}</h3>`;
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
      grp.appendChild(ligne);
    });
    sec.appendChild(grp);
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
    cb.onchange = () => modifierCarteSurprise(cb.dataset.revele, "revele", cb.checked));
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

// Bandeau "mode démo" (remplace les sections compte/famille en démo).
function bandeauDemo() {
  const d = el("section", "carte");
  d.innerHTML = `<h2>${t("demo.titre")}</h2><p>${t("demo.desc")}</p>`;
  const bq = el("button", "gros-bouton planete", t("demo.creer"));
  bq.onclick = () => location.reload();
  d.appendChild(bq);
  return d;
}

function vueReglages(c) {
  const totalAttente = Object.values(etat.enfants).reduce((s, e) => s + e.enAttente.length, 0);

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
  // Sélecteur de langue (E5) : changer la langue une fois connecté.
  const lLang = el("label", "champ", "🌐 " + t("langue"));
  const selLang = el("select");
  selLang.innerHTML = Object.keys(LANGUES).map(l =>
    `<option value="${l}"${l === langue ? " selected" : ""}>${LANGUES[l]}</option>`).join("");
  selLang.onchange = () => { definirLangue(selLang.value); rendre(); };
  lLang.appendChild(selLang);
  banniere.appendChild(lLang);
  c.appendChild(banniere);

  // ----- Sous-menu (onglets) pour organiser l'espace parents -----
  const onglets = [
    ["quotidien", t("grp.quotidien")],
    ["activites", t("grp.activites")],
    ["enfants",   t("grp.enfants")],
    ["famille",   t("grp.famille")],
    ["compte",    t("grp.compte")],
    ["stats",     t("grp.stats")]
  ];
  const nav = el("nav", "sous-nav");
  onglets.forEach(([id, label]) => {
    const b = el("button", "sous-nav-btn" + (ongletParent === id ? " actif" : ""), label);
    if (id === "quotidien" && totalAttente) {
      const pin = el("span", "sous-nav-pin", String(totalAttente));
      b.appendChild(pin);
    }
    b.onclick = () => { ongletParent = id; rendre(); };
    nav.appendChild(b);
  });
  c.appendChild(nav);

  /* ===== ONGLET : Au quotidien ===== */
  if (ongletParent === "quotidien") {

  // ----- Comportement de l'enfant (évaluation parent) : en 1ʳᵉ place -----
  c.appendChild(blocEval(enfantActif(), "parent"));

  // ----- Défis réparation ("Oups, ça arrive…") : accès rapide -----
  c.appendChild(blocReparation());

  // ----- Soutien (don facultatif) : admins + familles de plus d'une semaine -----
  if (typeof donDisponible !== "function" || donDisponible()) c.appendChild(blocDon());

  // ----- Validations en attente (affichées seulement s'il y en a) -----
  if (totalAttente) {
    const att = el("section", "carte");
    att.innerHTML = `<h2>${t("par.attente.titre", { n: totalAttente })}</h2>`;
    Object.values(etat.enfants).forEach(enf => {
      enf.enAttente.forEach((a, idx) => {
        const cat = CATEGORIES[a.cat];
        const ligne = el("div", "attente-ligne");
        ligne.innerHTML = `<span class="att-info">${enf.emoji} <strong>${enf.prenom}</strong> — ${a.emoji || ""} ${trData("mission", a.missionId, a.titre)}
          <small>(${a.jour}) +${a.points} ${cat ? cat.monnaieEmoji : ""}</small></span>`;
        const ok = el("button", "mini-btn ok", "✅");
        ok.onclick = () => confirmerAttente(enf, idx);
        const non = el("button", "mini-btn non", "✖️");
        non.onclick = () => refuserAttente(enf, idx);
        ligne.appendChild(ok); ligne.appendChild(non);
        att.appendChild(ligne);
      });
    });
    c.appendChild(att);
  }

  // ----- Missions du jour (sélection par les parents) -----
  c.appendChild(blocMissionsDuJour(enfantActif()));

  // ----- Corrections pour l'enfant sélectionné -----
  c.appendChild(blocCorrections(enfantActif()));

  } /* fin onglet quotidien */

  /* ===== ONGLET : Statistiques ===== */
  if (ongletParent === "stats") {
    c.appendChild(blocStatistiques());
  }

  /* ===== ONGLET : Activités & règles du jeu ===== */
  if (ongletParent === "activites") {

  // ----- Cartes surprises (activités famille) -----
  c.appendChild(blocCartesSurprisesParents());

  // ----- Réglages du programme (validation parentale + code PIN) -----
  const prog = el("section", "carte");
  prog.innerHTML = `<h2>${t("par.prog.titre")}</h2>`;
  const lVal = el("label", "switch-ligne");
  const iVal = el("input"); iVal.type = "checkbox"; iVal.checked = etat.reglages.validationParentale;
  iVal.onchange = () => basculerValidationParentale(iVal.checked);
  lVal.appendChild(iVal);
  lVal.appendChild(el("span", null, t("par.prog.validation")));
  prog.appendChild(lVal);
  const bCp = el("button", "btn-secondaire", etat.reglages.codeParent ? t("par.prog.changer_pin") : t("par.prog.definir_pin"));
  bCp.onclick = definirCodeParent;
  prog.appendChild(bCp);
  if (!etat.reglages.codeParent)
    prog.appendChild(el("p", "note", t("par.prog.astuce_pin")));
  // Seuil d'affichage imagé (sans chiffres) pour les jeunes enfants.
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
  c.appendChild(prog);

  // ----- Référence : prérequis de chaque espèce de l'écosystème -----
  c.appendChild(blocEcoReference());

  } /* fin onglet activités */

  /* ===== ONGLET : Les enfants ===== */
  if (ongletParent === "enfants") {

  // ----- Profils -----
  Object.values(etat.enfants).forEach(enf => {
    const sec = el("section", "carte reglage-enfant");
    sec.style.setProperty("--c", enf.couleur);
    const enTete = el("div", "reglage-entete");
    enTete.innerHTML = `<h2>${enf.emoji} ${enf.prenom}</h2>`;
    if (Object.keys(etat.enfants).length > 1) {
      const bSup = el("button", "mini-btn danger", t("profil.supprimer"));
      bSup.onclick = () => supprimerEnfant(enf.id);
      enTete.appendChild(bSup);
    }
    sec.appendChild(enTete);

    const lPrenom = el("label", "champ", t("profil.prenom"));
    const iPrenom = el("input");
    iPrenom.value = enf.prenom;
    iPrenom.oninput = () => { majEnfant(enf.id, "prenom", iPrenom.value); rendreSelecteur(); };
    lPrenom.appendChild(iPrenom);

    const lDate = el("label", "champ", t("profil.naissance"));
    const iDate = el("input");
    iDate.type = "date"; iDate.value = enf.naissance; iDate.max = aujourdHui(); iDate.min = "2008-01-01";
    iDate.onchange = () => { majEnfant(enf.id, "naissance", iDate.value || enf.naissance); rendreSelecteur(); rendre(); };
    lDate.appendChild(iDate);

    const lSexe = el("label", "champ", t("profil.sexe"));
    const iSexe = el("div", "segmente");
    ["fille", "garcon"].forEach(s => {
      const b = el("button", "seg" + (enf.sexe === s ? " actif" : ""), s === "fille" ? t("profil.fille") : t("profil.garcon"));
      b.onclick = () => { majEnfant(enf.id, "sexe", s); rendre(); };
      iSexe.appendChild(b);
    });
    lSexe.appendChild(iSexe);

    const lEmoji = el("label", "champ", t("profil.emoji"));
    const iEmoji = el("input");
    iEmoji.value = enf.emoji; iEmoji.maxLength = 4;
    iEmoji.oninput = () => { majEnfant(enf.id, "emoji", iEmoji.value); rendreSelecteur(); };
    lEmoji.appendChild(iEmoji);

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

    [lPrenom, lDate, lSexe, lEmoji, lCouleur, lDodo, stats].forEach(x => sec.appendChild(x));
    c.appendChild(sec);
  });

  // ----- Ajouter un enfant -----
  const bAjout = el("button", "gros-bouton famille", t("profil.ajouter_enfant"));
  bAjout.onclick = () => { ajouterEnfant(); rendre(); };
  c.appendChild(bAjout);

  } /* fin onglet enfants */

  /* ===== ONGLET : Famille & invitations ===== */
  if (ongletParent === "famille") {
  if (typeof modeDemo !== "undefined" && modeDemo) {
    c.appendChild(bandeauDemo());   // pas de famille/abonnement/admin en démo
  } else {

  // ----- Famille & invitations -----
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
    <p id="par-quota" class="note">${t("parr.quota_check")}</p>`;
  const bPar = el("button", "btn-secondaire", t("parr.creer"));
  par.appendChild(bPar);
  c.appendChild(par);
  // Quota affiché de façon asynchrone.
  parrainageRestant().then(n => {
    const q = par.querySelector("#par-quota");
    if (estAdmin) { q.innerHTML = t("parr.illimite"); }
    else { q.innerHTML = t("parr.restant", { n }); bPar.disabled = n <= 0; }
  });
  bPar.onclick = async () => {
    bPar.disabled = true; bPar.textContent = t("common.creation");
    const lien = await creerParrainage();
    bPar.textContent = t("parr.creer");
    if (lien) {
      const mailto = {
        sujet: t("parr.sujet", { app: APP_NOM }),
        corps: t("parr.corps", { app: APP_NOM, lien: "{lien}" })
      };
      montrerLienInvitation(par, lien, t("parr.partage"), mailto);
      parrainageRestant().then(n => {
        const q = par.querySelector("#par-quota");
        if (estAdmin) { q.innerHTML = t("parr.illimite"); bPar.disabled = false; }
        else { q.innerHTML = t("parr.restant", { n }); bPar.disabled = n <= 0; }
      });
    } else { bPar.disabled = false; }
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

  } /* fin sinon-démo */
  } /* fin onglet famille */

  /* ===== ONGLET : Mon compte & données ===== */
  if (ongletParent === "compte") {
  // ----- Administration (réservé aux admins) : en haut pour être visible -----
  if (typeof estAdmin !== "undefined" && estAdmin) c.appendChild(blocAdmin());
  // Module bug/suggestion : early adopters uniquement.
  if (typeof estEarlyAdopter !== "function" || estEarlyAdopter()) c.appendChild(blocFeedback());
  if (typeof modeDemo !== "undefined" && modeDemo) {
    c.appendChild(bandeauDemo());
  } else {

  // ----- Compte -----
  const cpt = el("section", "carte");
  const u = typeof utilisateurCourant === "function" ? utilisateurCourant() : null;
  cpt.innerHTML = `<h2>${t("compte.titre")}</h2>
    <p>${t("compte.connecte", { email: u ? echapper(u.email) : "—" })}</p>`;
  const bDeco = el("button", "btn-secondaire", t("compte.deconnexion"));
  bDeco.onclick = deconnexion;
  cpt.appendChild(bDeco);
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

  } /* fin sinon-démo */
  } /* fin onglet compte */
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
  b.onclick = () => {
    const msg = ta.value.trim();
    if (!msg) { toast(t("fb.vide"), "info"); return; }
    const u = (typeof utilisateurCourant === "function") ? utilisateurCourant() : null;
    const type = selType.value === "bug" ? "Bug" : "Suggestion";
    const contexte = [
      "App: " + APP_NOM, "Type: " + type,
      "Email: " + (u && u.email ? u.email : "—"),
      "Famille: " + (familleActive ? familleActive.name : "—"),
      "Langue: " + langue, "Version état: " + ETAT_VERSION,
      "Date: " + new Date().toISOString(),
      "Navigateur: " + (navigator.userAgent || "—")
    ].join("\n");
    // Stockage côté base (best-effort, ne bloque pas l'e-mail).
    try {
      if (typeof sb !== "undefined" && sb && !(typeof modeDemo !== "undefined" && modeDemo)) {
        sb.rpc("submit_feedback", {
          p_type: selType.value, p_message: msg,
          p_context: { langue, version: ETAT_VERSION, ua: navigator.userAgent || "" },
          p_family: (typeof familleId !== "undefined" ? familleId : null)
        });
      }
    } catch (e) { /* on garde l'e-mail comme repli */ }
    const sujet = encodeURIComponent(`${APP_NOM} — ${type}`);
    const corps = encodeURIComponent(`${msg}\n\n--- Contexte technique ---\n${contexte}`);
    location.href = `mailto:${emailSupport()}?subject=${sujet}&body=${corps}`;
    toast(t("fb.merci"), "succes");
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
