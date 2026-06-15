/* =====================================================================
 * KidsPositifs — Rendu de l'interface
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
      <div class="badge-pop-nom">${sfx} rejoint KidsPositifs grâce à toi.<br>Tu répands les ondes positives ! 🤝🌍</div>
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
      <p class="note">Offre KidsPositifs à des amis : ils créeront <strong>leur propre famille</strong>.</p>
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
    if (typeof estAdmin !== "undefined" && estAdmin) { q.innerHTML = "👑 Parrainages <strong>illimités</strong> (admin)."; bCreer.disabled = false; }
    else { q.innerHTML = `Il te reste <strong>${n}</strong> parrainage(s) cette semaine.`; bCreer.disabled = n <= 0; }
  });
  majQuota();
  bCreer.onclick = async () => {
    bCreer.disabled = true; bCreer.textContent = "Création…";
    const lien = await creerParrainage();
    bCreer.textContent = "🎁 Créer un lien de parrainage";
    if (lien) {
      montrerLienInvitation(zone, lien, "Partage ce lien : ton ami créera sa propre famille. 💛", {
        sujet: "Je t'offre KidsPositifs 🌟",
        corps: "Coucou !\n\nJe te parraine sur KidsPositifs, une appli bienveillante qui aide nos enfants à adopter de bons gestes (avatar à faire évoluer 💛 et écosystème vivant à bâtir 🌍).\n\nOuvre ce lien pour créer ta propre famille :\n{lien}\n\nÀ très vite ! 🤝"
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
      <div class="logo">🌟 KidsPositifs <span id="sync-etat" class="sync-etat" title="État de la synchronisation">…</span></div>
      <div id="selecteur-enfant" class="selecteur"></div>
    </header>

    <main id="contenu"></main>

    <nav class="navbar">
      <button data-vue="accueil"  class="nav-btn">🏠<span>Accueil</span></button>
      <button data-vue="famille"  class="nav-btn">🏡<span>Famille</span></button>
      <button data-vue="planete"  class="nav-btn">🌍<span>Planète</span></button>
      <button data-vue="avatar"   class="nav-btn">🎨<span>Avatar</span></button>
      <button data-vue="reglages" class="nav-btn">⚙️<span>Parents</span></button>
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
  sec.innerHTML = `<h2>🛡️ Administration</h2>
    <p class="note">Accès à toutes les familles. À utiliser avec précaution.</p>`;
  const b = el("button", "btn-secondaire", "📋 Charger toutes les familles");
  const liste = el("div", "admin-liste");
  b.onclick = async () => {
    b.disabled = true; b.textContent = "Chargement…";
    const familles = await adminListerFamilles();
    b.disabled = false; b.textContent = "🔄 Recharger les familles";
    liste.innerHTML = "";
    liste.appendChild(el("p", "note", `${familles.length} famille(s).`));
    familles.forEach(f => {
      const maj = f.updated_at ? new Date(f.updated_at).toLocaleDateString("fr-BE") : "—";
      const active = familleActive && familleActive.id === f.id;
      const ligne = el("div", "admin-item" + (active ? " actif" : ""));
      ligne.innerHTML = `<div class="adm-info"><strong>${echapper(f.name)}${active ? " ✅" : ""}</strong>
        <small>${echapper(f.owner_email || "?")} · ${f.members} membre(s) · ${f.plan} · maj ${maj}</small></div>`;
      const open = el("button", "mini-btn ok", active ? "Ouverte" : "Ouvrir");
      open.disabled = active;
      open.onclick = async () => { await adminOuvrirFamille(f); toast("Famille ouverte : " + f.name, "info"); };
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
  sec.appendChild(el("h2", null, "📝 Liste d'attente"));
  const bW = el("button", "btn-secondaire", "📋 Charger la liste d'attente");
  const listeW = el("div", "admin-liste");
  bW.onclick = async () => {
    bW.disabled = true; bW.textContent = "Chargement…";
    const cands = await adminListerAttente();
    bW.disabled = false; bW.textContent = "🔄 Recharger la liste d'attente";
    listeW.innerHTML = "";
    listeW.appendChild(el("p", "note", `${cands.length} candidat(s).`));
    cands.forEach(w => {
      const d = w.created_at ? new Date(w.created_at).toLocaleDateString("fr-BE") : "—";
      const ligne = el("div", "admin-item");
      ligne.innerHTML = `<div class="adm-info"><strong>${echapper(w.email)}</strong><small>inscrit le ${d}</small></div>`;
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
  const copier = el("button", "btn-secondaire", "📋 Copier le lien");
  copier.onclick = async () => {
    try { await navigator.clipboard.writeText(lien); copier.textContent = "✅ Copié !"; }
    catch { inp.select(); document.execCommand && document.execCommand("copy"); copier.textContent = "✅ Copié !"; }
    setTimeout(() => (copier.textContent = "📋 Copier le lien"), 1500);
  };
  box.appendChild(inp); box.appendChild(copier);
  // Option : envoyer le lien directement par e-mail (ouvre le client mail).
  if (mailto) {
    const mail = el("a", "btn-secondaire btn-mail", "✉️ Envoyer par e-mail");
    const corps = (mailto.corps || "").replace("{lien}", lien);
    mail.href = `mailto:?subject=${encodeURIComponent(mailto.sujet || "")}&body=${encodeURIComponent(corps)}`;
    box.appendChild(mail);
  }
  box.appendChild(el("p", "note", note || "Ce lien est valable 14 jours."));
}

function rendre() {
  rendreSelecteur();
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("actif", b.dataset.vue === etat.vue));

  const c = $("#contenu");
  c.innerHTML = "";
  switch (etat.vue) {
    case "accueil":  vueAccueil(c);  break;
    case "famille":  vueMissions(c, "famille"); break;
    case "planete":  vueMissions(c, "planete"); break;
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

  const carte = el("section", "carte-accueil");
  carte.style.setProperty("--c", enf.couleur);
  carte.innerHTML = `
    <div class="accueil-avatar">${renduAvatar(enf)}</div>
    <h1>Salut ${enf.prenom} ! <small>(${age(enf)} ans)</small></h1>
    <div class="compteurs">
      <div class="compteur"><span class="big">💛 ${enf.coeurs}</span><span>Cœurs à dépenser</span></div>
      <div class="compteur"><span class="big">💧 ${enf.gouttes}</span><span>Gouttes de vie</span></div>
    </div>`;
  c.appendChild(carte);

  // Bandeau "dodo" : ambiance selon l'heure + mission coucher à l'heure
  c.appendChild(bandeauDodo(enf));

  // Missions Famille (directement sur la page de l'enfant)
  const titreFam = el("section", "carte titre-cat");
  titreFam.style.setProperty("--c", CATEGORIES.famille.couleur);
  titreFam.innerHTML = `<h2>🏡 Missions Famille <span class="solde-inline">💛 ${enf.coeurs}</span></h2>`;
  const lienFam = el("button", "lien-cat", "Voir tout →");
  lienFam.onclick = () => { etat.vue = "famille"; ecrireCache(); rendre(); };
  titreFam.querySelector("h2").appendChild(lienFam);
  c.appendChild(titreFam);
  c.appendChild(grilleMissions("famille"));

  // Missions Planète (directement sur la page de l'enfant)
  const titrePla = el("section", "carte titre-cat");
  titrePla.style.setProperty("--c", CATEGORIES.planete.couleur);
  titrePla.innerHTML = `<h2>🌍 Missions Planète <span class="solde-inline">💧 ${enf.gouttes}</span></h2>`;
  const lienPla = el("button", "lien-cat", "Voir tout →");
  lienPla.onclick = () => { etat.vue = "planete"; ecrireCache(); rendre(); };
  titrePla.querySelector("h2").appendChild(lienPla);
  c.appendChild(titrePla);
  c.appendChild(grilleMissions("planete"));

  // Aperçu écosystème
  const ecoCarte = el("section", "carte");
  const apercu = renduSceneEco(enf);
  ecoCarte.innerHTML = `<h2>🌱 Mon écosystème</h2>
    <div class="eco-mini">${apercu || "🌱 Ta nature attend tes premières plantes…"}</div>
    <p class="eco-statut">${nbTotalEspeces(enf)} êtres vivants</p>`;
  c.appendChild(ecoCarte);

  // Badges
  if (enf.badges.length) {
    const bCarte = el("section", "carte");
    bCarte.innerHTML = `<h2>🏆 Mes badges</h2>
      <div class="badges">${enf.badges.map(b => `<span class="badge">${b.emoji} ${b.nom}</span>`).join("")}</div>`;
    c.appendChild(bCarte);
  }
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
    <div class="dodo-txt"><strong>${m.emoji} ${m.titre}</strong><small>🛏️ ${m.heure}</small></div>
    <div class="dodo-chemin" title="Quand l'étoile arrive à la lune, c'est l'heure de dormir">
      <span class="dc-bout">☀️</span>
      <div class="dc-piste"><div class="dc-rempli" style="width:${m.progress}%"></div>
        <span class="dc-token" style="left:${m.progress}%">⭐</span></div>
      <span class="dc-bout">🌙</span>
    </div>`;
  const b = el("button", "dodo-btn" + (fait ? " fait" : ""),
    fait ? "✅ Au lit à l'heure !" : (enAttente ? "⏳ En attente" : `Je vais au lit à l'heure 🌙 +${mission.points}💛`));
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
    liste.appendChild(el("p", "note", "Aucune mission prévue aujourd'hui pour cette catégorie."));
    return liste;
  }
  actives.forEach(m => {
    const fait = (journalJour[m.id] || 0) >= 1;
    const enAttente = enf.enAttente.some(a => a.missionId === m.id && a.jour === jour);
    const carte = el("button", "mission" + (fait ? " fait" : "") + (enAttente ? " attente" : ""));
    carte.innerHTML = `
      <span class="m-emoji">${m.emoji}</span>
      <span class="m-titre">${m.titre}</span>
      <span class="m-points">${fait ? "✅" : (enAttente ? "⏳" : `+${m.points} ${cat.monnaieEmoji}`)}</span>`;
    carte.onclick = () => validerMission(m);
    liste.appendChild(carte);
  });
  return liste;
}

/* ---------- Vue Missions (famille / planète) ---------- */
function vueMissions(c, catId) {
  const enf = enfantActif();
  const cat = CATEGORIES[catId];
  const jour = aujourdHui();
  const journalJour = enf.journal[jour] || {};

  const entete = el("section", "carte entete-cat");
  entete.style.setProperty("--c", cat.couleur);
  entete.innerHTML = `<h1>${cat.emoji} ${cat.nom}</h1>
    <p>${cat.description}</p>
    <p class="solde">${cat.monnaieEmoji} <strong>${catId === "famille" ? enf.coeurs : enf.gouttes}</strong> ${cat.monnaie}</p>`;
  c.appendChild(entete);

  // Aperçu de la récompense liée
  if (catId === "planete") c.appendChild(vueEcosysteme(enf));

  // Liste des missions adaptées à l'âge
  c.appendChild(grilleMissions(catId));

  // Section famille : défis réparation (alternative à la punition)
  if (catId === "famille") {
    const rep = el("section", "carte reparation");
    rep.innerHTML = `<h2>🌈 Oups, ça arrive…</h2>
      <p>Pas de point en moins ! Quand quelque chose ne va pas, on <strong>répare</strong> et on gagne même un petit bonus.</p>`;
    const g = el("div", "missions");
    DEFIS_REPARATION.forEach(d => {
      const b = el("button", "mission rep");
      b.innerHTML = `<span class="m-emoji">${d.emoji}</span><span class="m-titre">${d.titre}</span><span class="m-points">+${d.bonus} 💛</span>`;
      b.onclick = () => defiReparation(d);
      g.appendChild(b);
    });
    rep.appendChild(g);
    c.appendChild(rep);
  }
}

/* ---------- Scène : tous les êtres vivants créés ---------- */
function renduSceneEco(enf) {
  let html = "";
  TIERS_ECO.forEach(t => {
    t.especes.forEach(sp => {
      const n = (enf.ecosysteme[t.id] || {})[sp.id] || 0;
      for (let i = 0; i < n; i++)
        html += `<span class="eco-item" title="${sp.nom}">${sp.emoji}</span>`;
    });
  });
  return html;
}

/* ---------- Écosystème détaillé (chaîne alimentaire, cartes) ---------- */
function vueEcosysteme(enf) {
  const sec = el("section", "carte eco-carte");
  const scene = renduSceneEco(enf);
  sec.innerHTML = `<h2>🌱 Mon écosystème vivant</h2>
    <p class="note">Chaque être vivant est une <strong>carte</strong> 🃏 avec ses besoins. Crée d'abord les 🌱 plantes, puis les 🐰 herbivores qui les mangent, puis les 🦊 carnivores. Pour un 🐒 singe il faut 10 arbres et 1 bananier !</p>
    <div class="eco-scene">${scene || "<span class='eco-vide'>Crée ta première plante 🌱</span>"}</div>`;

  TIERS_ECO.forEach(tier => {
    const bloc = el("div", "eco-tier");
    const compte = nbTier(enf, tier.id);
    bloc.innerHTML = `<div class="eco-tier-tete"><span class="t-emoji">${tier.emoji}</span>
      <span class="t-nom">${tier.nom}</span><span class="t-compte">${compte}</span></div>
      <p class="t-lecon">${tier.lecon}</p>`;

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
    prereqHtml = `<div class="ec-prereq"><span class="ec-libre">Aucun prérequis ☀️</span></div>`;
  }

  carte.innerHTML = `
    <span class="ec-coin">${possede ? "×" + possede : ""}</span>
    <span class="ec-emoji">${sp.emoji}</span>
    <span class="ec-nom">${sp.nom}</span>
    <span class="ec-cout ${assezGouttes ? "" : "manque"}">${sp.cout} 💧</span>
    ${prereqHtml}
    <span class="ec-etat">${creable ? "➕ Créer" : (prereqOk ? "💧 Plus de gouttes" : "🔒 Verrouillé")}</span>`;
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
        <span class="o-nom">${opt.nom}</span>
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
  sec.innerHTML = `<h2>🗓️ Missions proposées — ${enf.emoji} ${enf.prenom}</h2>
    <p class="note">Coche les missions à proposer. Ton choix s'applique à partir de cette date et <strong>pour tous les jours suivants</strong> (jusqu'à une prochaine modification).</p>`;

  const lDate = el("label", "champ", "À partir du");
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
      ligne.appendChild(el("span", null, `${m.emoji} ${m.titre} (${cat.monnaieEmoji}${m.points})${m.perso ? " ✏️" : ""}`));
      if (m.perso) {
        const sup = el("button", "mini-btn danger", "🗑️");
        sup.title = "Supprimer cette mission personnalisée";
        sup.onclick = (e) => { e.preventDefault(); if (confirm(`Supprimer la mission « ${m.titre} » ?`)) supprimerMissionPerso(m.id); };
        ligne.appendChild(sup);
      }
      sec.appendChild(ligne);
    });
  });

  const rb = el("button", "btn-secondaire", "↩️ Proposer la sélection par défaut (selon l'âge)");
  rb.onclick = () => reinitPlan(enf, jour);
  sec.appendChild(rb);

  // ----- Ajouter une mission personnalisée -----
  sec.appendChild(el("p", "sous-titre", "➕ Ajouter une mission personnalisée"));
  const form = el("div", "mission-perso-form");
  const iTitre = el("input"); iTitre.placeholder = "Nom (ex. Ranger son vélo)"; iTitre.maxLength = 40;
  const iEmoji = el("input"); iEmoji.placeholder = "Emoji"; iEmoji.maxLength = 4; iEmoji.className = "mp-emoji";
  const iCat = el("select");
  iCat.innerHTML = `<option value="famille">🏡 Famille (💛)</option><option value="planete">🌍 Planète (💧)</option>`;
  const iPts = el("input"); iPts.type = "number"; iPts.min = "1"; iPts.max = "5"; iPts.value = "1"; iPts.className = "mp-pts";
  const bAdd = el("button", "btn-secondaire", "Ajouter ✨");
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
  sec.innerHTML = `<h2>✏️ Corrections — ${enf.emoji} ${enf.prenom}</h2>
    <p class="note">Changez d'enfant avec les pastilles en haut. Ajustez les soldes ou corrigez l'historique (rétroactif).</p>`;

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
  const lDate = el("label", "champ", "Corriger les missions du jour");
  const iDate = el("input"); iDate.type = "date"; iDate.value = jour; iDate.max = aujourdHui();
  iDate.onchange = () => { histDate[enf.id] = iDate.value; rendre(); };
  lDate.appendChild(iDate);
  sec.appendChild(lDate);

  const journalJour = enf.journal[jour] || {};
  toutesMissions().filter(m => age(enf) >= m.ageMin).forEach(m => {
    const n = journalJour[m.id] || 0;
    const ligne = el("div", "hist-ligne" + (n ? " valide" : ""));
    const cat = CATEGORIES[m.cat];
    ligne.innerHTML = `<span class="h-info">${m.emoji} ${m.titre} <small>${cat.monnaieEmoji}${m.points}</small></span>
      <span class="h-compte">${n}</span>`;
    const moins = el("button", "mini-btn", "−"); moins.onclick = () => modifierHistorique(enf, jour, m, -1);
    const plus = el("button", "mini-btn", "+"); plus.onclick = () => modifierHistorique(enf, jour, m, +1);
    ligne.appendChild(moins); ligne.appendChild(plus);
    sec.appendChild(ligne);
  });

  // -- Badges --
  const hBadges = el("h2", null, "🏆 Badges"); hBadges.style.marginTop = "12px";
  sec.appendChild(hBadges);
  if (!enf.badges.length) {
    sec.appendChild(el("p", "note", "Aucun badge pour le moment."));
  } else {
    enf.badges.forEach(b => {
      const ligne = el("div", "hist-ligne");
      ligne.innerHTML = `<span class="h-info">${b.emoji} ${b.nom}</span>`;
      const x = el("button", "mini-btn non", "Retirer");
      x.onclick = () => retirerBadge(enf, b.id);
      ligne.appendChild(x);
      sec.appendChild(ligne);
    });
  }
  if (enf.badgesRetires && enf.badgesRetires.length) {
    const r = el("button", "btn-secondaire", `↩️ Réautoriser ${enf.badgesRetires.length} badge(s) retiré(s)`);
    r.onclick = () => reactiverBadges(enf);
    sec.appendChild(r);
  }
  const eff = el("button", "btn-secondaire", "🧹 Effacer tous les badges");
  eff.onclick = () => effacerBadges(enf);
  sec.appendChild(eff);

  return sec;
}

// Tableau de référence (parents) : coût et prérequis de chaque espèce.
function blocEcoReference() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>🌍 Écosystème — prérequis des espèces</h2>
    <p class="note">Pour information : ce dont chaque plante ou animal a besoin pour être créé (coût en Gouttes 💧 et prérequis).</p>`;
  TIERS_ECO.forEach(tier => {
    const grp = el("div", "eco-ref-tier");
    grp.innerHTML = `<h3 class="eco-ref-titre">${tier.emoji} ${tier.nom}</h3>`;
    tier.especes.forEach(sp => {
      const entrees = Object.keys(sp.prereq || {});
      const prereq = entrees.length
        ? entrees.map(id => {
            const info = spInfo(id);
            return `${sp.prereq[id]}× ${info ? info.sp.emoji + " " + info.sp.nom : id}`;
          }).join(", ")
        : "aucun prérequis";
      const ligne = el("div", "eco-ref-ligne");
      ligne.innerHTML = `<span class="erl-nom">${sp.emoji} ${sp.nom}</span>
        <span class="erl-cout">${sp.cout} 💧</span>
        <span class="erl-prereq">${prereq}</span>`;
      grp.appendChild(ligne);
    });
    sec.appendChild(grp);
  });
  return sec;
}

function vueReglages(c) {
  const totalAttente = Object.values(etat.enfants).reduce((s, e) => s + e.enAttente.length, 0);

  // ----- Écran verrouillé (mode parents inactif) -----
  if (!modeParents) {
    const v = el("section", "carte");
    v.innerHTML = `<h1>⚙️ Espace parents</h1>
      <p>Réservé aux parents : valider les actions, corriger les données, régler le programme.</p>
      ${totalAttente ? `<p class="note">⏳ <strong>${totalAttente}</strong> action(s) en attente de validation.</p>` : ""}
      <p class="note">💡 <strong>Esprit bienveillant</strong> : on valorise l'effort, jamais la performance. Les corrections servent à ajuster avec justesse, pas à punir.</p>`;
    const b = el("button", "gros-bouton planete", "🔓 Activer le mode parents");
    b.onclick = activerModeParents;
    v.appendChild(b);
    c.appendChild(v);
    return;
  }

  // ----- Bandeau mode parents actif -----
  const banniere = el("section", "carte");
  banniere.innerHTML = `<h1>⚙️ Mode parents <span class="badge">activé</span></h1>`;
  const bq = el("button", "btn-secondaire", "🔒 Quitter le mode parents");
  bq.onclick = quitterModeParents;
  banniere.appendChild(bq);
  c.appendChild(banniere);

  // ----- Validations en attente (affichées seulement s'il y en a) -----
  if (totalAttente) {
    const att = el("section", "carte");
    att.innerHTML = `<h2>⏳ Actions à valider (${totalAttente})</h2>`;
    Object.values(etat.enfants).forEach(enf => {
      enf.enAttente.forEach((a, idx) => {
        const cat = CATEGORIES[a.cat];
        const ligne = el("div", "attente-ligne");
        ligne.innerHTML = `<span class="att-info">${enf.emoji} <strong>${enf.prenom}</strong> — ${a.emoji || ""} ${a.titre}
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

  // ----- Réglages du programme -----
  const prog = el("section", "carte");
  prog.innerHTML = `<h2>🛠️ Réglages du programme</h2>`;
  const lVal = el("label", "switch-ligne");
  const iVal = el("input"); iVal.type = "checkbox"; iVal.checked = etat.reglages.validationParentale;
  iVal.onchange = () => basculerValidationParentale(iVal.checked);
  lVal.appendChild(iVal);
  lVal.appendChild(el("span", null, "Validation parentale requise (les actions des enfants attendent votre confirmation)"));
  prog.appendChild(lVal);
  const bCp = el("button", "btn-secondaire", etat.reglages.codeParent ? "🔑 Changer le code PIN parent" : "🔑 Définir un code PIN parent");
  bCp.onclick = definirCodeParent;
  prog.appendChild(bCp);
  if (!etat.reglages.codeParent)
    prog.appendChild(el("p", "note", "💡 Astuce : définissez un code PIN pour protéger l'accès au mode parents."));
  c.appendChild(prog);

  // ----- Missions du jour (sélection par les parents) -----
  c.appendChild(blocMissionsDuJour(enfantActif()));

  // ----- Corrections pour l'enfant sélectionné -----
  c.appendChild(blocCorrections(enfantActif()));

  // ----- Profils -----
  Object.values(etat.enfants).forEach(enf => {
    const sec = el("section", "carte reglage-enfant");
    sec.style.setProperty("--c", enf.couleur);
    const enTete = el("div", "reglage-entete");
    enTete.innerHTML = `<h2>${enf.emoji} ${enf.prenom}</h2>`;
    if (Object.keys(etat.enfants).length > 1) {
      const bSup = el("button", "mini-btn danger", "🗑️ Supprimer");
      bSup.onclick = () => supprimerEnfant(enf.id);
      enTete.appendChild(bSup);
    }
    sec.appendChild(enTete);

    const lPrenom = el("label", "champ", `Prénom`);
    const iPrenom = el("input");
    iPrenom.value = enf.prenom;
    iPrenom.oninput = () => { majEnfant(enf.id, "prenom", iPrenom.value); rendreSelecteur(); };
    lPrenom.appendChild(iPrenom);

    const lDate = el("label", "champ", `Date de naissance`);
    const iDate = el("input");
    iDate.type = "date"; iDate.value = enf.naissance; iDate.max = aujourdHui(); iDate.min = "2008-01-01";
    iDate.onchange = () => { majEnfant(enf.id, "naissance", iDate.value || enf.naissance); rendreSelecteur(); rendre(); };
    lDate.appendChild(iDate);

    const lSexe = el("label", "champ", `Sexe`);
    const iSexe = el("div", "segmente");
    ["fille", "garcon"].forEach(s => {
      const b = el("button", "seg" + (enf.sexe === s ? " actif" : ""), s === "fille" ? "👧 Fille" : "👦 Garçon");
      b.onclick = () => { majEnfant(enf.id, "sexe", s); rendre(); };
      iSexe.appendChild(b);
    });
    lSexe.appendChild(iSexe);

    const lEmoji = el("label", "champ", `Emoji`);
    const iEmoji = el("input");
    iEmoji.value = enf.emoji; iEmoji.maxLength = 4;
    iEmoji.oninput = () => { majEnfant(enf.id, "emoji", iEmoji.value); rendreSelecteur(); };
    lEmoji.appendChild(iEmoji);

    const lCouleur = el("label", "champ", `Couleur`);
    const iCouleur = el("input");
    iCouleur.type = "color"; iCouleur.value = enf.couleur;
    iCouleur.oninput = () => majEnfant(enf.id, "couleur", iCouleur.value);
    lCouleur.appendChild(iCouleur);

    const lDodo = el("label", "champ", `Heure du coucher 🌙`);
    const iDodo = el("input");
    iDodo.type = "time"; iDodo.value = enf.heureCoucher || "19:30";
    iDodo.onchange = () => { majEnfant(enf.id, "heureCoucher", iDodo.value || "19:30"); rendre(); };
    lDodo.appendChild(iDodo);

    const stats = el("p", "note", `${age(enf)} ans · Total cumulé : 💛 ${enf.coeursTotal} Cœurs · 💧 ${enf.gouttesTotal} Gouttes · 🌍 ${nbTotalEspeces(enf)} êtres vivants · 🏆 ${enf.badges.length} badges`);

    [lPrenom, lDate, lSexe, lEmoji, lCouleur, lDodo, stats].forEach(x => sec.appendChild(x));
    c.appendChild(sec);
  });

  // ----- Ajouter un enfant -----
  const bAjout = el("button", "gros-bouton famille", "➕ Ajouter un enfant");
  bAjout.onclick = () => { ajouterEnfant(); rendre(); };
  c.appendChild(bAjout);

  // ----- Référence : prérequis de chaque espèce de l'écosystème -----
  c.appendChild(blocEcoReference());

  // ----- Mode démo : bandeau au lieu des sections compte/famille -----
  if (typeof modeDemo !== "undefined" && modeDemo) {
    const d = el("section", "carte");
    d.innerHTML = `<h2>🧪 Mode démo</h2>
      <p>Tu explores une <strong>famille de démonstration</strong>. Rien n'est enregistré en ligne.</p>`;
    const bq = el("button", "gros-bouton planete", "Créer un compte / se connecter");
    bq.onclick = () => location.reload();
    d.appendChild(bq);
    c.appendChild(d);
    return; // pas de famille/abonnement/compte/admin en démo
  }

  // ----- Famille & invitations -----
  const fam = el("section", "carte");
  fam.innerHTML = `<h2>👪 Famille</h2>
    <p>Famille : <strong>${familleActive ? echapper(familleActive.name) : "—"}</strong></p>
    <p class="note">Invite l'autre parent : partage-lui ce lien, il rejoindra cette famille après connexion.</p>`;
  const bInvite = el("button", "btn-secondaire", "🔗 Créer un lien d'invitation");
  bInvite.onclick = async () => {
    bInvite.disabled = true; bInvite.textContent = "Création…";
    const lien = await creerInvitation();
    bInvite.disabled = false; bInvite.textContent = "🔗 Créer un lien d'invitation";
    if (lien) montrerLienInvitation(fam, lien);
  };
  fam.appendChild(bInvite);
  const bSwitch = el("button", "btn-secondaire", "🔁 Changer / créer une famille");
  bSwitch.onclick = changerFamille;
  fam.appendChild(bSwitch);
  c.appendChild(fam);

  // ----- Parrainage : inviter une famille amie à créer la sienne -----
  const par = el("section", "carte");
  par.innerHTML = `<h2>🎁 Parrainer une famille amie</h2>
    <p class="note">Offre KidsPositifs à des amis : avec ton lien de parrainage, ils
    créeront <strong>leur propre famille</strong>. Tu peux parrainer
    <strong>3 familles par semaine</strong>. Plus on est nombreux, plus on répand
    les ondes positives ! 🤝</p>
    <p id="par-quota" class="note">Vérification de ton quota…</p>`;
  const bPar = el("button", "btn-secondaire", "🎁 Créer un lien de parrainage");
  par.appendChild(bPar);
  c.appendChild(par);
  // Quota affiché de façon asynchrone.
  parrainageRestant().then(n => {
    const q = par.querySelector("#par-quota");
    if (estAdmin) { q.innerHTML = "👑 Compte administrateur : parrainages <strong>illimités</strong>."; }
    else { q.innerHTML = `Il te reste <strong>${n}</strong> parrainage(s) cette semaine.`; bPar.disabled = n <= 0; }
  });
  bPar.onclick = async () => {
    bPar.disabled = true; bPar.textContent = "Création…";
    const lien = await creerParrainage();
    bPar.textContent = "🎁 Créer un lien de parrainage";
    if (lien) {
      const mailto = {
        sujet: "Je t'offre KidsPositifs 🌟",
        corps: "Coucou !\n\nJe te parraine sur KidsPositifs, une appli bienveillante qui aide nos enfants à adopter de bons gestes (avatar à faire évoluer 💛 et écosystème vivant à bâtir 🌍).\n\nOuvre ce lien pour créer ta propre famille :\n{lien}\n\nÀ très vite ! 🤝"
      };
      montrerLienInvitation(par, lien, "Partage ce lien : ton ami créera sa propre famille. 💛", mailto);
      parrainageRestant().then(n => {
        const q = par.querySelector("#par-quota");
        if (estAdmin) { q.innerHTML = "👑 Compte administrateur : parrainages <strong>illimités</strong>."; bPar.disabled = false; }
        else { q.innerHTML = `Il te reste <strong>${n}</strong> parrainage(s) cette semaine.`; bPar.disabled = n <= 0; }
      });
    } else { bPar.disabled = false; }
  };

  // ----- Abonnement (masqué provisoirement : early adopters = gratuit) -----
  if (AFFICHER_ABONNEMENT) {
    const abo = el("section", "carte");
    abo.innerHTML = `<h2>⭐ Abonnement</h2>
      <p>Offre actuelle : <strong>${planLibelle()}</strong></p>
      <p class="note">Les paiements arriveront bientôt. Pour l'instant, tout est gratuit. 💛</p>`;
    const bAbo = el("button", "btn-secondaire", "Gérer l'abonnement (bientôt)");
    bAbo.disabled = true;
    abo.appendChild(bAbo);
    c.appendChild(abo);
  }

  // ----- Administration (réservé aux admins) -----
  if (typeof estAdmin !== "undefined" && estAdmin) c.appendChild(blocAdmin());

  // ----- Compte -----
  const cpt = el("section", "carte");
  const u = typeof utilisateurCourant === "function" ? utilisateurCourant() : null;
  cpt.innerHTML = `<h2>👤 Compte</h2>
    <p>Connecté en tant que <strong>${u ? echapper(u.email) : "—"}</strong></p>`;
  const bDeco = el("button", "btn-secondaire", "🚪 Se déconnecter");
  bDeco.onclick = deconnexion;
  cpt.appendChild(bDeco);
  c.appendChild(cpt);

  const actions = el("section", "carte");
  actions.innerHTML = `<h2>Données (cette famille)</h2>`;
  const bExp = el("button", "btn-secondaire", "💾 Exporter la sauvegarde");
  bExp.onclick = exporter;
  const bRaz = el("button", "btn-danger", "🗑️ Tout réinitialiser");
  bRaz.onclick = reinitialiser;
  actions.appendChild(bExp);
  actions.appendChild(bRaz);
  c.appendChild(actions);
}
