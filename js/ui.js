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
      <input id="pin-input" type="password" inputmode="numeric" pattern="[0-9]*"
             autocomplete="off" maxlength="8" class="pin-input" placeholder="••••">
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

/* ---------- Vue Accueil ---------- */
function vueAccueil(c) {
  const enf = enfantActif();

  // Disposition 2 colonnes sur grand écran, empilée sur mobile/tablette.
  const layout = el("div", "accueil-layout");
  const colA = el("div", "acc-col acc-col-a"); // profil + dodo (latéral sur desktop)
  const colB = el("div", "acc-col acc-col-b"); // missions, écosystème, badges
  layout.appendChild(colA); layout.appendChild(colB);
  c.appendChild(layout);

  const carte = el("section", "carte-accueil");
  carte.style.setProperty("--c", enf.couleur);
  carte.innerHTML = `
    <div class="accueil-avatar">${renduAvatar(enf)}</div>
    <h1>${t("home.salut", { prenom: enf.prenom })} <small>(${t("home.ans", { age: age(enf) })})</small></h1>
    <div class="compteurs">
      <div class="compteur"><span class="big">💛 ${enf.coeurs}</span><span>${t("home.coeurs_label")}</span></div>
      <div class="compteur"><span class="big">💧 ${enf.gouttes}</span><span>${t("home.gouttes_label")}</span></div>
    </div>`;
  colA.appendChild(carte);

  // Bandeau "dodo" : ambiance selon l'heure + mission coucher à l'heure
  colA.appendChild(bandeauDodo(enf));

  // Missions Famille (directement sur la page d'accueil de l'enfant)
  const titreFam = el("section", "carte titre-cat");
  titreFam.style.setProperty("--c", CATEGORIES.famille.couleur);
  titreFam.innerHTML = `<h2>${t("home.missions_famille")} <span class="solde-inline">💛 ${enf.coeurs}</span></h2>`;
  colB.appendChild(titreFam);
  colB.appendChild(grilleMissions("famille"));

  // Missions Planète (directement sur la page d'accueil de l'enfant)
  const titrePla = el("section", "carte titre-cat");
  titrePla.style.setProperty("--c", CATEGORIES.planete.couleur);
  titrePla.innerHTML = `<h2>${t("home.missions_planete")} <span class="solde-inline">💧 ${enf.gouttes}</span></h2>`;
  colB.appendChild(titrePla);
  colB.appendChild(grilleMissions("planete"));

  // Badges (toujours affichés : gagnés + à débloquer, pour motiver)
  colB.appendChild(blocBadges(enf));

  // ----- En bas de page : défis réparation + teaser "ça arrive" -----
  colB.appendChild(blocReparation());
  const soon = el("section", "carte bientot");
  soon.innerHTML = `<h2>${t("soon.titre")}</h2><p>${t("soon.texte")}</p>`;
  colB.appendChild(soon);
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
  const b = el("button", "dodo-btn" + (fait ? " fait" : ""),
    fait ? t("dodo.fait") : (enAttente ? t("dodo.attente") : t("dodo.bouton", { pts: mission.points })));
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
  actives.forEach(m => {
    const fait = (journalJour[m.id] || 0) >= 1;
    const enAttente = enf.enAttente.some(a => a.missionId === m.id && a.jour === jour);
    const carte = el("button", "mission" + (fait ? " fait" : "") + (enAttente ? " attente" : ""));
    carte.innerHTML = `
      <span class="m-emoji">${m.emoji}</span>
      <span class="m-titre">${trData("mission", m.id, m.titre)}</span>
      <span class="m-points">${fait ? "✅" : (enAttente ? "⏳" : `+${m.points} ${cat.monnaieEmoji}`)}</span>`;
    carte.onclick = () => validerMission(m);
    liste.appendChild(carte);
  });
  return liste;
}

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
  cartes.forEach(c => {
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
          <span class="cs-jauge-token" style="left:${pct}%">${c.debloquee ? "🎉" : "🏃"}</span>
          <span class="cs-jauge-but">${c.debloquee ? "🎁" : "🔒"}</span>
        </div>
        <div class="cs-jauge-bas"><span class="cs-jauge-chiffres">${c.recolte} / ${c.cout} 💛</span>
          <span class="cs-jauge-pct">${pct}%</span></div>
      </div>`;

    html += `<div class="cs-carte${c.debloquee ? " ouverte" : " mystere"}${c.faite ? " faite" : ""}">`;
    if (c.debloquee) {
      // Carte RÉVÉLÉE (jauge pleine) : on dévoile l'activité.
      html += `<div class="cs-tete"><span class="cs-emoji">${c.emoji}</span>
          <span class="cs-titre">${echapper(titre)}</span>
          <span class="cs-prix">${t("cs.debloquee")}</span></div>
        ${jauge}
        <p class="cs-activite">${echapper(activite)}</p>
        <p class="cs-afaire">${t("cs.a_faire")}</p>`;
      if (c.faite) html += `<p class="cs-faite-tag">${t("cs.faite")}</p>`;
      else html += `<button class="btn-secondaire cs-faite-btn" data-faite="${c.id}">${t("cs.faite_btn")}</button>`;
    } else {
      // Carte MYSTÈRE (cachée tant que la jauge n'est pas pleine).
      html += `<div class="cs-tete"><span class="cs-emoji cs-mystere-emoji">🎁</span>
          <span class="cs-titre">${t("cs.mystere")}</span>
          <span class="cs-prix">❓</span></div>
        <p class="cs-mystere-sous">${t("cs.mystere_sous")}</p>
        ${jauge}
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

// Badges : médailles colorées, gagnées + à débloquer (motivation enfants).
function blocBadges(enf) {
  const gagnes = new Set((enf.badges || []).map(b => b.id));
  const total = BADGES_CATALOGUE.length;
  const nb = BADGES_CATALOGUE.filter(b => gagnes.has(b.id)).length;
  const sec = el("section", "carte badges-carte");
  let html = `<h2>${t("home.mes_badges")} <span class="badges-compteur">${nb}/${total}</span></h2>
    <div class="badges-grid">`;
  BADGES_CATALOGUE.forEach(b => {
    const ok = gagnes.has(b.id);
    const nom = trData("badge", b.id, b.nom);
    const sous = ok ? nom : trData("badgeC", b.id, b.comment);
    html += `<div class="badge-fun${ok ? " gagne" : " bloque"}" title="${echapper(nom)}">
      <div class="badge-medaille"><span class="badge-emoji">${ok ? b.emoji : "🔒"}</span></div>
      <div class="badge-nom">${echapper(ok ? nom : sous)}</div>
    </div>`;
  });
  html += `</div>`;
  sec.innerHTML = html;
  return sec;
}

/* ---------- Vue Missions (famille / planète) ---------- */
// Défis réparation (alternative bienveillante à la punition).
function blocReparation() {
  const rep = el("section", "carte reparation");
  rep.innerHTML = `<h2>${t("rep.titre")}</h2><p>${t("rep.texte")}</p>`;
  const g = el("div", "missions");
  DEFIS_REPARATION.forEach(d => {
    const b = el("button", "mission rep");
    b.innerHTML = `<span class="m-emoji">${d.emoji}</span>
      <span class="m-titre">${trData("defi", d.id, d.titre)}</span>
      <span class="m-points">+${d.bonus} 💛</span>`;
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
  entete.innerHTML = `<h1>${cat.emoji} ${t("cat.famille.nom")}</h1>
    <p class="solde">${cat.monnaieEmoji} <strong>${enf.coeurs}</strong> ${t("money.coeurs")}</p>`;
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
  entete.innerHTML = `<h1>${cat.emoji} ${t("cat.planete.nom")}</h1>
    <p>${t("cat.planete.desc")}</p>
    <p class="solde">${cat.monnaieEmoji} <strong>${enf.gouttes}</strong> ${t("money.gouttes")}</p>`;
  c.appendChild(entete);

  // Écosystème détaillé (chaîne alimentaire).
  c.appendChild(vueEcosysteme(enf));
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
  const scene = renduSceneEco(enf);
  sec.innerHTML = `<h2>${t("eco.titre")}</h2>
    <p class="note">${t("eco.intro")}</p>
    <div class="eco-scene">${scene || `<span class='eco-vide'>${t("eco.vide_court")}</span>`}</div>`;

  TIERS_ECO.forEach(tier => {
    const bloc = el("div", "eco-tier");
    const compte = nbTier(enf, tier.id);
    bloc.innerHTML = `<div class="eco-tier-tete"><span class="t-emoji">${tier.emoji}</span>
      <span class="t-nom">${trData("tier", tier.id, tier.nom)}</span><span class="t-compte">${compte}</span></div>
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

  // Liste des prérequis (avec ✓ / compteur).
  let prereqHtml = "";
  const entrees = Object.keys(sp.prereq || {});
  if (entrees.length) {
    prereqHtml = `<div class="ec-prereq">` + entrees.map(id => {
      const info = spInfo(id);
      const emoji = info ? info.sp.emoji : "?";
      const a = nbEspece(enf, id), req = sp.prereq[id];
      const ok = a >= req;
      return `<span class="ec-need ${ok ? "ok" : "ko"}">${emoji} ${a}/${req}${ok ? " ✓" : ""}</span>`;
    }).join("") + `</div>`;
  } else {
    prereqHtml = `<div class="ec-prereq"><span class="ec-libre">${t("eco.aucun_prereq")}</span></div>`;
  }

  carte.innerHTML = `
    <span class="ec-coin">${possede ? "×" + possede : ""}</span>
    <span class="ec-emoji">${sp.emoji}</span>
    <span class="ec-nom">${trData("espece", sp.id, sp.nom)}</span>
    <span class="ec-cout ${assezGouttes ? "" : "manque"}">${sp.cout} 💧</span>
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

  const apercu = el("section", "carte avatar-apercu");
  apercu.innerHTML = `<h1>🎨 Mon avatar</h1>
    <div class="avatar-grand">${renduAvatar(enf)}</div>
    <p class="solde">💛 <strong>${enf.coeurs}</strong> Cœurs à dépenser</p>`;
  c.appendChild(apercu);

  Object.keys(AVATAR_OPTIONS).forEach(categorie => {
    const sec = el("section", "carte");
    sec.innerHTML = `<h2>${AVATAR_LIBELLES[categorie]}</h2>`;
    const grille = el("div", "options");
    AVATAR_OPTIONS[categorie].forEach(opt => {
      const dispo = estDebloque(enf, categorie, opt);
      const equipe = enf.avatar[categorie] === opt.id;
      const o = el("button", "option" + (equipe ? " equipe" : "") + (dispo ? "" : " verrou"));
      o.innerHTML = `
        <span class="o-apercu">${apercuOption(enf, categorie, opt)}</span>
        <span class="o-nom">${trData("avatar." + categorie, opt.id, opt.nom)}</span>
        <span class="o-cout">${dispo ? (equipe ? "Porté ✅" : "Choisir") : `🔒 ${opt.cout} 💛`}</span>`;
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
    const dispo = toutesMissions().filter(m => m.cat === catId && age(enf) >= m.ageMin);
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
  cartes.forEach(c => {
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
      <div class="csp-actions">
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
        <input class="csp-cout" id="csp-new-cout" type="number" min="1" inputmode="numeric" value="15"></label>
      <button class="btn-secondaire" id="csp-add">${t("cs.f_ajouter")}</button>
    </div>
  </div>`;
  sec.innerHTML = html;

  // Édition en direct (on enregistre à la sortie du champ).
  sec.querySelectorAll("[data-champ]").forEach(inp =>
    inp.onchange = () => modifierCarteSurprise(inp.dataset.id, inp.dataset.champ, inp.value));
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

// Titre de groupe (séparateur visuel pour structurer l'espace parents).
function titreGroupe(txt) {
  return el("h2", "grp-titre", txt);
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

  /* ===== GROUPE : Au quotidien ===== */
  c.appendChild(titreGroupe(t("grp.quotidien")));

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

  /* ===== GROUPE : Activités & règles du jeu ===== */
  c.appendChild(titreGroupe(t("grp.activites")));

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
  c.appendChild(prog);

  // ----- Référence : prérequis de chaque espèce de l'écosystème -----
  c.appendChild(blocEcoReference());

  /* ===== GROUPE : Les enfants ===== */
  c.appendChild(titreGroupe(t("grp.enfants")));

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

  // ----- Mode démo : bandeau au lieu des sections compte/famille -----
  if (typeof modeDemo !== "undefined" && modeDemo) {
    const d = el("section", "carte");
    d.innerHTML = `<h2>${t("demo.titre")}</h2>
      <p>${t("demo.desc")}</p>`;
    const bq = el("button", "gros-bouton planete", t("demo.creer"));
    bq.onclick = () => location.reload();
    d.appendChild(bq);
    c.appendChild(d);
    return; // pas de famille/abonnement/compte/admin en démo
  }

  /* ===== GROUPE : Famille & invitations ===== */
  c.appendChild(titreGroupe(t("grp.famille")));

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

  // ----- Administration (réservé aux admins) -----
  if (typeof estAdmin !== "undefined" && estAdmin) c.appendChild(blocAdmin());

  /* ===== GROUPE : Mon compte & données ===== */
  c.appendChild(titreGroupe(t("grp.compte")));

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
