/* =====================================================================
 * FamiTeam — Interface : Espace Admin (hors Croissance)
 * ---------------------------------------------------------------------
 * Réservé au fondateur : familles, blagues, tableau de bord scientifique,
 * statistiques, retours des utilisateurs, système et sauvegardes.
 * Voir PLAN-ADMIN.md.
 *
 * Module de l'interface (ARCHITECTURE.md, phase C). Script classique,
 * comme tous les autres : les fonctions restent globales et s'appellent
 * entre modules sans import. L'ordre des balises dans index.html n'a
 * donc aucune conséquence — rien ne s'exécute au chargement.
 * ===================================================================== */
// Panneau d'administration : liste de toutes les familles.
// Gestion des blagues par langue (admin) : afficher chaque liste, en ajouter
// et en supprimer. Stockées dans app_config (« blagues_<lang> »), donc actives
// pour toute l'app. Langue affichée mémorisée le temps de la session.
let blgLangAdmin = "fr";
function blocAdminBlagues() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>🃏 ${t("admin.blg_titre")}</h2><p class="note">${t("admin.blg_note")}</p>`;

  // Interrupteur global : la case décide seule si le corpus s'affiche sur
  // l'accueil des familles (même celles ayant activé l'humour). Éteinte par
  // défaut — voir la mise en garde sur le corpus actuel au § 3 chantier 7 de
  // COORDINATION.md avant de l'allumer.
  const active = (typeof blaguesActivees === "function") && blaguesActivees();
  const lAct = el("label", "switch-ligne");
  const iAct = el("input"); iAct.type = "checkbox"; iAct.checked = active;
  iAct.onchange = async () => {
    iAct.disabled = true;
    await adminDefinirConfig("blagues_actives", iAct.checked ? "on" : "off");
    if (!configApp) configApp = {};
    configApp.blagues_actives = iAct.checked ? "on" : "off";
    iAct.disabled = false;
    majSansSaut(() => rendre());
  };
  lAct.appendChild(iAct);
  lAct.appendChild(el("span", null, t("admin.blg_activer")));
  sec.appendChild(lAct);
  if (!active) sec.appendChild(el("p", "admin-bientot-badge", "⏸️ " + t("admin.blg_desactivees")));

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
    del.setAttribute("aria-label", t("a11y.supprimer"));
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
    const { details, corps } = blocPliable(`🧠 ${t("sci.ecran")}`, false);
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

      // --- Catégorisation / modération du compte (par e-mail du propriétaire) ---
      const email = f.owner_email || "";
      const estEA = dansListeConfig("early_adopters", email);
      const estBloq = dansListeConfig("comptes_bloques", email);
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
      bDel.setAttribute("aria-label", t("a11y.supprimer"));
      bDel.title = t("admin.supprimer");
      bDel.onclick = async () => {
        if (!confirm(t("admin.confirm_suppr_compte", { nom: f.name }))) return;
        if (prompt(t("admin.confirm_suppr_nom", { nom: f.name })) !== f.name) { toast(t("admin.nom_incorrect"), "info"); return; }
        if (await adminSupprimerFamille(f.id)) { toast(t("admin.supprime_ok", { nom: f.name }), "info"); b.onclick(); }
      };
      // Une seule rangée de boutons : infos sur une ligne, actions sur l'autre —
      // deux lignes par famille au lieu de trois.
      const actions2 = el("div", "adm-actions2");
      [plan, open, bEA, bBloc, bDel].forEach(x => actions2.appendChild(x));
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
      sup.setAttribute("aria-label", t("a11y.supprimer"));
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
/* ----- Connexion des parents : quels moyens l'écran d'accueil propose -----
 * Cet interrupteur vivait au milieu de « Pause et avertissements », dans
 * l'onglet Croissance : introuvable, et sans rapport avec le sujet de la
 * carte. Il a sa propre carte, en tête de Config, là où on cherche un
 * réglage d'application. */
function blocConnexionParents() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("admin.connexion_titre")}</h2>
    <p class="note">${t("admin.connexion_sous")}</p>`;

  // Reste ETEINT tant que le fournisseur n'est pas configuré dans Google
  // Cloud ET dans Supabase : allumé trop tôt, le bouton s'affiche pour toutes
  // les familles et chaque clic finit sur une erreur.
  const goog = !!(typeof configApp !== "undefined" && configApp && configApp.google_actif === "on");
  const lg = el("label", "switch-ligne");
  const ig = el("input"); ig.type = "checkbox"; ig.checked = goog;
  ig.onchange = async () => {
    ig.disabled = true;
    await adminDefinirConfig("google_actif", ig.checked ? "on" : "off");
    configApp.google_actif = ig.checked ? "on" : "off";
    ig.disabled = false;
    majSansSaut(() => rendre());
  };
  lg.appendChild(ig);
  lg.appendChild(el("span", null, t("admin.google")));
  sec.appendChild(lg);
  sec.appendChild(el("p", "reglage-aide", t(goog ? "admin.google_on" : "admin.google_off")));
  return sec;
}

// ----- Test d'envoi d'e-mail (via la fonction commune send-mail / SMTP OVH) -----
// Envoie un vrai e-mail de test depuis hello@fami.team — même chemin que les
// invitations et les retours. Carte à part : aucun rapport avec les dons
// Stripe, avec qui elle partageait autrefois une seule carte.
function blocAdminMailTest() {
  const sec = el("section", "carte");
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
      text: t("admin.mailtest_corps", { app: APP_NOM, date: new Date().toLocaleString() }),
      interactif: true          // c'est un test : il doit partir même hors production
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
  return sec;
}

// ----- Configuration des dons Stripe (un Payment Link par montant) -----
function blocAdminDonConfig() {
  const sec = el("section", "carte");
  sec.appendChild(el("h2", null, t("admin.don_titre")));
  sec.appendChild(el("p", "note", t("admin.don_note")));
  const aide = el("a", "btn-secondaire don-aide", t("admin.don_aide"));
  aide.href = "https://dashboard.stripe.com/payment-links"; aide.target = "_blank"; aide.rel = "noopener";
  sec.appendChild(aide);
  const aideP = el("a", "btn-secondaire don-aide", t("admin.don_portail_aide"));
  aideP.href = "https://dashboard.stripe.com/settings/billing/portal";
  aideP.target = "_blank"; aideP.rel = "noopener";
  sec.appendChild(aideP);
  const cfg = (typeof configApp !== "undefined") ? configApp : {};
  const champsDon = [
    ["support_email", t("admin.support_email")],
    ["don_once_10", t("don.ponctuel") + " — 10 €"],
    ["don_once_20", t("don.ponctuel") + " — 20 €"],
    ["don_once_50", t("don.ponctuel") + " — 50 €"],
    ["don_sub_1",  t("don.mensuel") + " — 1 €/" + t("don.mois")],
    ["don_sub_3",  t("don.mensuel") + " — 3 €/" + t("don.mois")],
    ["don_sub_10", t("don.mensuel") + " — 10 €/" + t("don.mois")],
    ["don_stripe_url", t("admin.don_libre")],
    ["don_portail_url", t("admin.don_portail")]
  ];
  const inputsDon = {};
  champsDon.forEach(([key, label]) => {
    const l = el("label", "champ", label);
    const inp = el("input");
    if (key === "support_email") { inp.type = "email"; inp.placeholder = "hello@fami.team"; }
    else if (key === "don_portail_url") { inp.type = "url"; inp.placeholder = "https://billing.stripe.com/p/login/…"; }
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
// « Stats » par défaut : les chiffres se chargent seuls à l'ouverture, sans
// qu'il faille d'abord choisir un sous-onglet puis cliquer pour charger.
let sousOngletAdmin = "stats";
const SOUS_ONGLETS_ADMIN = [
  ["stats",      "admin.nav_stats"],
  ["croissance", "admin.nav_croissance"],
  ["familles",   "admin.nav_familles"],
  ["retours",    "admin.nav_retours"],
  ["contenu",    "admin.nav_contenu"],
  ["config",     "admin.nav_config"],
  ["systeme",    "admin.nav_systeme"],
  ["mobile",     "admin.nav_mobile"],
];

// Carte « bientôt disponible » pour les sous-sections encore à construire.
function blocAdminBientot(titre, desc) {
  const sec = el("section", "carte admin-bientot");
  sec.innerHTML = `<h2>${titre}</h2><p class="note">${desc}</p>
    <p class="admin-bientot-badge">🚧 ${t("admin.bientot")}</p>`;
  return sec;
}

/* ---------- Sous-section « Mobile » : publier sur Google Play / App Store ----------
 * Guide autoporté pour le fondateur, pas pour un développeur : chaque étape
 * dit QUOI faire, OÙ, et POURQUOI. Une piste par plateforme (Android/iOS),
 * dans l'ordre chronologique réel — y compris les étapes déjà accomplies
 * (fait:true, non décochables : ce sont des faits d'ingénierie, pas des
 * choix de l'admin), pour que la carte raconte tout le chemin, pas
 * seulement ce qu'il reste. Les étapes restantes (fait:false) gardent une
 * case à cocher qui se souvient de l'avancement (app_config.mobile_ck_<id>).
 * Rédigé en français uniquement (à la différence du reste de l'app) : outil
 * interne à un seul lecteur, le fondateur — pas un écran vu par les
 * familles. Le détail de dépannage (messages d'erreur, PowerShell…) reste
 * dans PLAN-MOBILE.md, référencé en bas de chaque carte.  */
const ANDROID_ETAPES = [
  { id: "shell", fait: true, titre: "1. La coquille de l'app existe déjà", texte:
    "Capacitor est installé et configuré (nom « FamiTeam », identifiant team.fami.app). Le dossier android/ est un projet Gradle complet — tout ce qu'Android Studio a besoin pour compiler l'app est déjà là. Rien à faire ici." },
  { id: "icone", fait: true, titre: "2. Icône et écran de démarrage générés", texte:
    "Une étoile blanche sur fond doré, dans le style déjà utilisé pour les récompenses de l'app — un repli honnête, pas un logo dessiné exprès. Changeable à tout moment, sans tout redéployer : commande npm run icon:generer, à lancer après avoir remplacé l'image source par un carré de 1024×1024 pixels." },
  { id: "plomberie", fait: true, titre: "3. Calendrier, notifications, PDF : déjà câblés", texte:
    "Trois choses qui ne marchent pas pareil dans une app installée que sur un site web sont déjà résolues : écrire un rendez-vous directement dans l'agenda du téléphone, envoyer le rappel du soir en notification, produire un vrai PDF pour la feuille à imprimer (une iframe ne suffit pas dans une WebView — voir PLAN-MOBILE.md si curieux du détail)." },
  { id: "google_compte", fait: false, titre: "4. Ouvrir un compte Google Play Console", lien: "https://play.google.com/console/signup", lienTexte: "🔗 Ouvrir l'inscription Google Play Console", texte:
    "La porte d'entrée pour publier sur Google Play. Coûte 25 $, une seule fois, à vie. Se connecter avec le compte Google qui doit posséder l'app POUR TOUJOURS — pas un compte personnel qu'on pourrait perdre — puis payer les 25 $ et remplir la fiche développeur." },
  { id: "keystore", fait: false, titre: "5. Créer le keystore de signature", texte:
    "Un keystore est un fichier secret qui sert de signature électronique de l'app : sans lui, impossible de publier une mise à jour un jour (Google refuse un fichier signé différemment). Il se crée une seule fois, dans Android Studio (Build → Generate Signed Bundle/APK → Create new…), et se garde précieusement — perdu, il n'y a aucun moyen de le récupérer, il faudrait republier l'app sous une nouvelle fiche." },
  { id: "sha256", fait: false, titre: "6. Coller l'empreinte SHA-256 du keystore", texte:
    "Une fois le keystore créé, il a une « empreinte » (une longue suite de lettres et de chiffres). Android Studio l'affiche pendant la création, ou plus tard via Gradle → Tasks → android → signingReport. Elle doit être collée dans le fichier .well-known/assetlinks.json du site (aujourd'hui, un espace réservé). Sans elle, les liens reçus par e-mail s'ouvrent dans le navigateur plutôt que dans l'app — gênant, mais rien ne casse en attendant." },
  { id: "build_release", fait: false, titre: "7. Premier envoi sur Google Play", texte:
    "Dans un terminal, à la racine du projet : npm run cap:sync (recopie le site dans android/). Puis dans Android Studio : Build → Generate Signed Bundle/APK, choisir le keystore de l'étape 5, produire un .aab (Android App Bundle, le format que Google Play demande). Ce fichier se dépose dans Google Play Console → votre app → Production → Créer une version. Avant chaque nouvel envoi : incrémenter versionCode dans android/app/build.gradle (Google refuse deux envois avec le même numéro)." },
];

const IOS_ETAPES = [
  { id: "shell", fait: true, titre: "1. Le projet Xcode existe déjà", texte:
    "Le dossier ios/ est un projet Xcode complet (Swift Package Manager, sans CocoaPods), prêt à ouvrir — mais seulement compilable sur un Mac, condition incontournable côté Apple." },
  { id: "icone", fait: true, titre: "2. Icône et écran de démarrage générés", texte:
    "La même étoile dorée que côté Android, générée pour toutes les tailles qu'iOS demande. Changeable avec la même commande, npm run icon:generer." },
  { id: "plomberie", fait: true, titre: "3. Calendrier et notifications : déjà câblés", texte:
    "Sur iOS, écrire dans l'agenda ne demande qu'une autorisation « écriture seule » (EventKit sait créer un événement dans l'agenda par défaut sans droit de lecture) ; le rappel du soir est programmé en heure locale, insensible au changement d'heure d'été/hiver." },
  { id: "apple_compte", fait: false, titre: "4. Ouvrir un compte Apple Developer", lien: "https://developer.apple.com/programs/enroll/", lienTexte: "🔗 Ouvrir l'inscription Apple Developer Program", texte:
    "La porte d'entrée pour l'App Store. Coûte 99 $ par an. Se connecter avec un Apple ID qui restera à l'app pour toujours, payer, puis patienter — Apple vérifie chaque inscription, ça peut prendre un jour ou deux." },
  { id: "apple_team_id", fait: false, titre: "5. Coller le Team ID Apple", texte:
    "Une fois le compte actif, Apple donne un « Team ID » (un code court, visible dans le compte développeur sous Membership). Il doit être collé dans .well-known/apple-app-site-association (aujourd'hui, un espace réservé) — même rôle que l'empreinte SHA-256 côté Android : sans lui, les liens reçus par e-mail s'ouvrent dans le navigateur plutôt que dans l'app." },
  { id: "associated_domains", fait: false, titre: "6. Activer « Associated Domains » dans Xcode", texte:
    "Sur un Mac, dans Xcode : ouvrir le projet ios/, onglet Signing & Capabilities, bouton + Capability, choisir Associated Domains, ajouter applinks:fami.team et applinks:famiteam.com. Deux clics, mais réservé à un Mac avec Xcode — la seule étape qui ne peut pas être préparée à l'avance sans risquer de corrompre le projet à l'aveugle." },
  { id: "build_release", fait: false, titre: "7. Premier envoi sur l'App Store", texte:
    "Dans un terminal, à la racine du projet : npm run cap:sync. Puis sur un Mac, dans Xcode : sélectionner « Any iOS Device » comme cible, Product → Archive, puis Distribute App → App Store Connect. La première fois, il faut aussi créer la fiche de l'app sur appstoreconnect.apple.com (nom, description, captures d'écran) avant qu'Apple accepte l'envoi." },
];

// Rend une piste (Android ou iOS) : une carte, une ligne par étape, case à
// cocher uniquement pour les étapes qui dépendent d'un geste de l'admin.
function blocMobiliePiste(titreCarte, etapes) {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${titreCarte}</h2>`;
  const cfg = (typeof configApp !== "undefined") ? configApp : {};
  etapes.forEach(e => {
    const cle = "mobile_ck_" + e.id;
    const fait = e.fait || cfg[cle] === "on";
    const bloc = el("div", "mobile-etape" + (fait ? " fait" : ""));
    const lbl = el("label", "switch-ligne");
    const cb = el("input"); cb.type = "checkbox"; cb.checked = fait;
    if (e.fait) {
      cb.disabled = true;
      cb.title = "Déjà fait : ne dépend d'aucun réglage.";
    } else {
      cb.onchange = async () => {
        cb.disabled = true;
        await adminDefinirConfig(cle, cb.checked ? "on" : "off");
        if (!configApp) configApp = {};
        configApp[cle] = cb.checked ? "on" : "off";
        cb.disabled = false;
        majSansSaut(() => rendre());
      };
    }
    lbl.appendChild(cb);
    lbl.appendChild(el("strong", null, e.titre));
    bloc.appendChild(lbl);
    bloc.appendChild(el("p", "reglage-aide", e.texte));
    if (e.lien) {
      const a = el("a", "btn-secondaire don-aide", e.lienTexte);
      a.href = e.lien; a.target = "_blank"; a.rel = "noopener";
      bloc.appendChild(a);
    }
    sec.appendChild(bloc);
  });
  const restantes = etapes.filter(e => !e.fait);
  const fini = restantes.filter(e => cfg["mobile_ck_" + e.id] === "on").length;
  sec.appendChild(el("p", "note", `${fini} / ${restantes.length} étapes restantes cochées.`));
  return sec;
}

function blocAdminMobileIntro() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>📱 Publier l'app sur Android et iOS</h2>
    <p class="note">Deux pistes séparées ci-dessous — Android et iOS n'ont presque rien en commun côté comptes et outils. Chaque étape dit quoi faire, où, et pourquoi ; les étapes déjà accomplies sont cochées et grisées, pour que la carte raconte tout le chemin, pas seulement ce qu'il reste. Le détail de dépannage (messages d'erreur exacts, installation sur un PC Windows pas à pas) reste dans le fichier PLAN-MOBILE.md du projet — cette carte en est le résumé, pas le remplaçant.</p>`;
  return sec;
}

function blocAdminMobile(c) {
  c.appendChild(blocAdminMobileIntro());
  c.appendChild(blocMobiliePiste("🤖 Android (Google Play)", ANDROID_ETAPES));
  c.appendChild(blocMobiliePiste("🍏 iOS (App Store)", IOS_ETAPES));
}

// Graphique en barres minimaliste (SVG vanilla, sans dépendance externe).
// `serie` = [{ semaine: "AAAA-MM-JJ", n: nombre }]. Échappe les valeurs.
// Axes : sans eux, une hauteur de barre ne veut rien dire (est-ce 3 ou 30 ?)
// et un mini-graphe isolé de sa légende n'est lisible que par celui qui l'a
// fait. Un axe Y à trois repères (0, la moitié, le maximum) et l'axe X déjà
// présent (mois) suffisent — pas une grille complète, qui alourdirait un
// graphe pensé pour tenir en un coup d'œil.
function miniGraphBarres(serie, couleur) {
  if (!serie || !serie.length) return `<p class="note">${t("stats.aucune_donnee")}</p>`;
  const W = 520, H = 140, padB = 22, padL = 30, padR = 6, padT = 8;
  const n = serie.length;
  const maxV = Math.max(1, ...serie.map(p => p.n || 0));
  const zoneW = W - padL - padR;
  const bw = zoneW / n;
  const yDe = (v) => H - padB - Math.round((v / maxV) * (H - padB - padT));
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
  // Axe Y : la ligne, et trois repères (0, moitié, maximum arrondis).
  const repereY = (v) => {
    const y = yDe(v);
    return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e9eef4" stroke-width="1"/>`
      + `<text x="${padL - 4}" y="${y}" font-size="10" fill="#8aa0b0" text-anchor="end" dominant-baseline="middle">${Math.round(v)}</text>`;
  };
  const axes = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="#c7d2de" stroke-width="1"/>`
    + `<line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#c7d2de" stroke-width="1"/>`
    + repereY(0) + repereY(maxV / 2) + repereY(maxV);
  return `<svg class="mini-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">${axes}${barres}</svg>`;
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

// Cache de session : évite de recharger les statistiques à chaque rendu
// (l'admin peut rouvrir cet onglet, ou déclencher un rendu ailleurs, sans
// relancer huit requêtes pour rien) — voir blocAdminStats.
let adminStatsCache = null;

// Sous-section « Stats » : chiffres clés + évolution (inscriptions & activité)
// + derniers arrivants. Toutes les données proviennent de RPC en lecture seule.
// Chargée automatiquement à l'ouverture : c'est l'onglet par défaut d'Admin,
// il n'y a plus de geste à faire pour voir les chiffres.
function blocAdminStats() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>${t("admin.nav_stats")}</h2><p class="note">${t("admin.stats_desc")}</p>`;
  const b = el("button", "btn-secondaire", t(adminStatsCache ? "stats.recharger" : "stats.charger"));
  const corps = el("div", "admin-stats-corps");
  const charger = async () => {
    b.disabled = true; b.textContent = t("common.chargement");
    const [s, insc, act, recentes, usage, usageSerie, dons, donsRecents, activation] = await Promise.all([
      adminStats(), adminSerieInscriptions(), adminSerieActivite(), adminFamillesRecentes(8),
      adminUsageStats(), adminSerieUsage(), adminDonationsStats(), adminListerDons(6),
      (typeof adminActivation === "function") ? adminActivation() : null
    ]);
    adminStatsCache = { s, insc, act, recentes, usage, usageSerie, dons, donsRecents, activation };
    b.disabled = false; b.textContent = t("stats.recharger");
    afficher();
  };
  const afficher = () => {
    const { s, insc, act, recentes, usage, usageSerie, dons, donsRecents, activation } = adminStatsCache || {};
    corps.innerHTML = "";
    if (!s) { corps.appendChild(el("p", "note", t("stats.aucune_donnee"))); return; }

    // --- Chiffres clés ---
    // Réunit ici les deux jeux de chiffres qui vivaient sur deux pages
    // différentes (Stats, et « Les chiffres du moment » de Croissance) :
    // même nature de donnée, une seule grille à consulter.
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
      carteStat("🚀", (activation && activation.taux != null) ? activation.taux + " %" : "—",
        t("croiss.kpi_activation"),
        (activation && activation.eligibles != null) ? t("croiss.kpi_activation_p", { n: activation.eligibles }) : ""),
      carteStat("🔁", coefficientViral(s, usage), t("croiss.kpi_k"), t("croiss.kpi_k_p")),
    ].join("");
    corps.appendChild(grille);

    // --- Dons (mesure réelle, via le webhook Stripe) : en premier après les
    // chiffres clés, avant les graphiques d'évolution. ---
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
  b.onclick = charger;
  sec.appendChild(b);
  sec.appendChild(corps);
  if (adminStatsCache) afficher(); else charger();
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
  return `Voici les retours reçus des familles utilisatrices de FamiTeam et pas encore traités.

CONTEXTE DU PROJET
- Application web familiale (3-12 ans), parentalité positive : on encourage, on répare, on ne punit jamais.
- Projet personnel non marchand : gratuit, sans publicité, sans revente de données, hébergement européen.
  Les frais sont couverts par des dons ; ce n'est pas une activité professionnelle.
- Une heure de développement par semaine : chaque ajout doit se justifier par son rapport valeur/temps.
- L'éditeur reste discret : il n'apparaît pas dans l'app, et tout ce qui peut tourner seul doit tourner seul.
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
2. Dis-moi aussi ce que ces retours suggèrent pour le DÉVELOPPEMENT COMMERCIAL : ce qui reviendrait
   assez souvent pour mériter une phrase sur la page publique, un obstacle qui coûte des familles à
   l'inscription, un canal d'où viennent visiblement les familles satisfaites, ou un chantier du plan
   à réordonner. Propose au maximum trois actions, chacune tenant dans une heure.
3. Attends ma validation du tri avant d'écrire la moindre ligne de code.
4. Ensuite seulement, implémente UNE amélioration de la première pile : code, traductions dans les
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

  const charger = async () => {
    b.disabled = true; b.textContent = t("common.chargement");
    adminRetoursCache = await adminListerFeedback();
    majCompteNonLus();
    b.disabled = false; b.textContent = t("retours.recharger");
    rendreListe();
    majRestant();
  };
  b.onclick = charger;
  sec.appendChild(b);

  // Chantier récurrent « Revue des idées » : on met les retours en forme de
  // consigne prête à coller dans Claude Code, avec le contexte du projet et
  // les garde-fous. Le tri reste humain ; la mise en forme, non.
  // On reprend TOUT ce qui n'est pas « traité » : un retour lu mais laissé de
  // côté doit revenir à la revue suivante, sinon il se perd.
  const aTraiter = () => (adminRetoursCache || []).filter(f => (f.status || "nouveau") !== "traite");
  const bConsigne = el("button", "btn-secondaire", "🤖 " + t("retours.consigne"));
  bConsigne.onclick = () => {
    const liste = aTraiter();
    if (!liste.length) { toast(t("retours.consigne_vide"), "info"); return; }
    copierTexte(consigneClaudeCode(liste));
  };
  sec.appendChild(bConsigne);
  sec.appendChild(el("p", "reglage-aide", t("retours.consigne_aide")));

  // Compteur explicite : tant qu'il n'est pas à zéro, il reste des retours à
  // passer en revue. Rien ne disparaît de cette liste.
  const restant = el("p", "retours-restant");
  const majRestant = () => {
    if (!adminRetoursCache) { restant.textContent = ""; return; }
    const n = aTraiter().length;
    restant.textContent = n ? t("retours.restant", { n }) : t("retours.restant_zero");
    restant.className = "retours-restant" + (n ? " actif" : "");
  };
  sec.appendChild(restant);
  sec.appendChild(corps);
  if (adminRetoursCache) { rendreListe(); majRestant(); }   // déjà chargé cette session
  else charger();                                          // premier affichage : on charge seul
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

// Numéro de cache (`?v=NNN`) d'app.js. Capturé PENDANT l'exécution du
// fichier lui-même (VERSION_APP_JS, app.js), pas relu ici dans le DOM : la
// première version cherchait la balise <script> après coup, et la manquait
// dès que l'application affichait son premier écran — initSquelette()
// remplace document.body.innerHTML en bloc, et les balises qui vivent dans
// <body> disparaissent avec le reste. Un numéro introuvable signale un
// problème plus grave qu'une simple question de version.
function versionChargeeActuelle() {
  if (typeof VERSION_APP_JS !== "undefined" && VERSION_APP_JS) return VERSION_APP_JS;
  // Repli, pour un contexte où app.js n'aurait pas encore posé la variable
  // (chargement partiel, ou page qui l'inclut autrement) : on retente la
  // recherche dans le DOM telle qu'elle existait avant.
  const scripts = document.querySelectorAll('script[src*="/js/app.js"], script[src^="js/app.js"]');
  for (const s of scripts) {
    const m = /[?&]v=([\w.-]+)/.exec(s.getAttribute("src") || "");
    if (m) return m[1];
  }
  return null;
}

function blocVersionChargee() {
  const sec = el("div", "admin-item sys-version");
  const v = versionChargeeActuelle();
  const natif = (typeof estAppNative === "function") && estAppNative();
  sec.innerHTML = `<div class="adm-info">
      <strong>🔖 ${t("sys.version_titre")}</strong>
      <small>${v ? t("sys.version_valeur", { v }) : t("sys.version_inconnue")}
        — ${natif ? t("sys.version_app") : t("sys.version_site")}</small>
    </div>`;
  return sec;
}

// Sous-section « Système » : stockage (base de données) + liens vers les
// tableaux de bord. L'export et la migration sont ajoutés au lot F.
function blocAdminSysteme() {
  const sec = el("section", "carte");
  sec.innerHTML = `<h2>🛠️ ${t("admin.nav_systeme")}</h2><p class="note">${t("admin.systeme_desc")}</p>`;

  // ----- Version chargée -----
  // Repère demandé après une session de dépannage où l'app installée
  // tournait, sans qu'on le sache, sur un ancien code : le numéro affiché
  // ici est lu directement dans l'URL du script déjà chargé (`?v=NNN`), donc
  // il ne peut jamais mentir — comparer ce nombre entre le site et l'app
  // suffit à savoir si l'app a bien reçu le dernier build.
  sec.appendChild(blocVersionChargee());

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
async function telechargerJSON(nomFichier, obj) {
  try {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    // Dans l'app, un lien « download » ne fait rien : on passe par le partage.
    if (await enregistrerOuPartager(blob, nomFichier, nomFichier)) return;
    toast(t("sys.export_ko"), "info");
  } catch (e) { toast(t("sys.export_ko"), "info"); }
}
