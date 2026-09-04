/* =====================================================================
 * FamiTeam — Page Croissance : plan de développement, envois automatiques, décisions
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * La page Croissance de l'espace administrateur (données dans
 * js/croissance.js) : avancement des chantiers, envois automatiques et
 * réponses types, vagues d'invitation, coût, décisions à trancher,
 * soutenabilité — et la vue admin qui assemble le tout.
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

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

/* Vagues d'invitation (chantier « Liste d'attente ») : le mode d'inscription,
 * la taille d'une vague, la prochaine vague à envoyer et la conversion.
 * Tout part aussi tout seul si les envois automatiques sont armés — ce bloc
 * sert à voir ce qui va partir, et à déclencher la vague à la main si besoin. */
function blocVagues() {
  const sec = el("section", "carte croiss-vagues");
  const armes = (typeof mailsAutoArmes === "function") ? mailsAutoArmes() : false;
  const ouvertes = (typeof inscriptionsOuvertes === "function") ? inscriptionsOuvertes() : true;
  const taille = (typeof tailleVague === "function") ? tailleVague() : 20;
  sec.innerHTML = `<h2>${t("vag.titre")}</h2><p class="note">${t("vag.sous")}</p>`;

  // Mode d'inscription : ouvertes à tous, ou par vagues (liste d'attente).
  const l = el("label", "switch-ligne");
  const i = el("input"); i.type = "checkbox"; i.checked = !ouvertes;
  i.onchange = async () => {
    i.disabled = true;
    await adminDefinirConfig("inscriptions", i.checked ? "vagues" : "ouvertes");
    i.disabled = false;
    majSansSaut(() => rendre());
  };
  l.appendChild(i);
  l.appendChild(el("span", null, t("vag.switch")));
  sec.appendChild(l);
  sec.appendChild(el("p", "reglage-aide", t(ouvertes ? "vag.mode_ouvert" : "vag.mode_vagues")));

  // Taille d'une vague : ce que le temps disponible permet d'accompagner.
  const lt = el("label", "reglage-ligne");
  lt.appendChild(el("span", null, t("vag.taille")));
  const it = el("input", "champ-nombre"); it.type = "number"; it.min = "1"; it.max = "200";
  it.value = String(taille);
  it.onchange = async () => {
    const n = Math.max(1, Math.min(200, parseInt(it.value, 10) || 20));
    it.value = String(n);
    it.disabled = true;
    await adminDefinirConfig("vague_taille", String(n));
    it.disabled = false;
    majSansSaut(() => rendre());
  };
  lt.appendChild(it);
  sec.appendChild(lt);
  sec.appendChild(el("p", "reglage-aide", t("vag.taille_aide", { n: taille })));

  // Conversion, prochaine vague, relances : chargés ensemble.
  const zone = el("div", "vag-zone");
  zone.innerHTML = `<p class="note">${t("common.chargement")}</p>`;
  sec.appendChild(zone);
  (async () => {
    const [st, suivante, relances] = await Promise.all([
      (typeof adminVaguesStats === "function") ? adminVaguesStats() : null,
      (typeof adminVagueSuivante === "function") ? adminVagueSuivante() : [],
      (typeof adminVaguesARelancer === "function") ? adminVaguesARelancer() : []
    ]);
    zone.innerHTML = "";

    if (st) {
      const chiffres = el("div", "stat-grille");
      chiffres.innerHTML =
        carteStat("📤", st.invites != null ? st.invites : "—", t("vag.kpi_invites")) +
        carteStat("✅", st.taux != null ? st.taux + " %" : "—", t("vag.kpi_taux"),
                  st.convertis != null ? t("vag.kpi_taux_p", { n: st.convertis }) : "") +
        carteStat("📋", st.en_attente != null ? st.en_attente : "—", t("vag.kpi_attente"));
      zone.appendChild(chiffres);
      // Critère d'ouverture publique : 40 % de conversion par vague.
      if (st.invites >= 10 && st.taux != null) {
        zone.appendChild(el("p", "reglage-aide",
          t(st.taux >= 40 ? "vag.critere_ok" : "vag.critere_non", { taux: st.taux })));
      }
    }

    // Prochaine vague : on montre QUI serait invité avant d'envoyer.
    const bloc = el("div", "croiss-file");
    if (!suivante.length) {
      bloc.innerHTML = `<p class="note">${t("vag.rien_a_inviter")}</p>`;
    } else {
      bloc.innerHTML = `<p class="croiss-file-t">${t("vag.prochaine", { n: suivante.length })}</p>` +
        suivante.map(cd => `<div class="croiss-file-l"><span>${echapper(cd.email || "—")}</span>
          <span class="note">${cd.source ? echapper(cd.source) + " · " : ""}${echapper(jourLisible(String(cd.created_at || "").slice(0, 10)) || "—")}</span></div>`).join("");
      const b = el("button", "btn-secondaire", t("vag.envoyer", { n: suivante.length }));
      b.disabled = !armes;
      b.onclick = async () => {
        if (!confirm(t("vag.confirm", { n: suivante.length }))) return;
        b.disabled = true; b.textContent = t("common.creation");
        const n = await envoyerVague(suivante);
        toast(t("croiss.mails_partis", { n }), "succes");
        majSansSaut(() => rendre());
      };
      bloc.appendChild(b);
      if (!armes) bloc.appendChild(el("p", "reglage-aide", t("croiss.file_bloque")));
    }
    zone.appendChild(bloc);

    // Relances J+7 : une seule, jamais deux.
    if (relances.length) {
      const br = el("div", "croiss-file");
      br.innerHTML = `<p class="croiss-file-t">${t("vag.relances", { n: relances.length })}</p>` +
        relances.map(cd => `<div class="croiss-file-l"><span>${echapper(cd.email || "—")}</span>
          <span class="note">${t("vag.jours", { n: cd.jours })}</span></div>`).join("");
      const b2 = el("button", "btn-secondaire", t("vag.relancer", { n: relances.length }));
      b2.disabled = !armes;
      b2.onclick = async () => {
        b2.disabled = true; b2.textContent = t("common.creation");
        const n = await envoyerRelancesVague(relances);
        toast(t("croiss.mails_partis", { n }), "succes");
        majSansSaut(() => rendre());
      };
      br.appendChild(b2);
      if (!armes) br.appendChild(el("p", "reglage-aide", t("croiss.file_bloque")));
      zone.appendChild(br);
    }
  })();
  return sec;
}

/* Coût, capacité et soutien (chantier « Modèle non marchand »).
 * Trois questions, une seule carte : combien le projet coûte par an, combien
 * les dons couvrent, et à quelle distance on est du plafond de familles.
 * Le plafond se referme tout seul ; ce bloc sert à le voir venir. */
const COUT_ANNUEL = [
  { poste: "cout.domaine", montant: 1500, note: "cout.domaine_n" },
  { poste: "cout.mail",    montant: 1200, note: "cout.mail_n" },
  { poste: "cout.base",    montant: 0,    note: "cout.base_n" },
  { poste: "cout.site",    montant: 0,    note: "cout.site_n" }
];
function coutAnnuelCents() { return COUT_ANNUEL.reduce((s, l) => s + l.montant, 0); }

function blocCoutSoutien() {
  const sec = el("section", "carte croiss-cout");
  const total = coutAnnuelCents();
  sec.innerHTML = `<h2>${t("cout.titre")}</h2><p class="note">${t("cout.sous")}</p>`;

  // Le détail des frais : écrit une fois, il ne bouge presque jamais.
  const tbl = el("div", "cout-lignes");
  tbl.innerHTML = COUT_ANNUEL.map(l =>
    `<div class="cout-l"><span>${t(l.poste)}<small>${t(l.note)}</small></span>
       <strong>${l.montant ? montantLisible(l.montant, "eur") : t("cout.gratuit")}</strong></div>`).join("") +
    `<div class="cout-l total"><span>${t("cout.total")}</span>
       <strong>${montantLisible(total, "eur")}</strong></div>`;
  sec.appendChild(tbl);

  const zone = el("div", "cout-zone");
  zone.innerHTML = `<p class="note">${t("common.chargement")}</p>`;
  sec.appendChild(zone);
  (async () => {
    const [dons, cap] = await Promise.all([
      (typeof adminDonationsStats === "function") ? adminDonationsStats() : null,
      (typeof capaciteProjet === "function") ? capaciteProjet() : null
    ]);
    zone.innerHTML = "";

    // Dons reçus face au coût : le projet est-il à l'équilibre ?
    if (dons) {
      const recu = dons.total_cents || 0;
      const couvert = total > 0 ? Math.round((recu / total) * 100) : null;
      const g = el("div", "stat-grille");
      g.innerHTML =
        carteStat("💛", montantLisible(recu, "eur"), t("cout.dons"),
                  dons.nb_dons ? t("cout.dons_p", { n: dons.nb_dons }) : "") +
        carteStat("⚖️", couvert === null ? "—" : couvert + " %", t("cout.couverture"),
                  t("cout.couverture_p", { total: montantLisible(total, "eur") }));
      zone.appendChild(g);
      zone.appendChild(el("p", "reglage-aide",
        t(recu >= total ? "cout.equilibre_ok" : "cout.equilibre_non")));
    }

    // Capacité : familles / plafond, et remplissage de la base gratuite.
    if (cap) {
      const g2 = el("div", "stat-grille");
      const mo = (o) => Math.round((o || 0) / (1024 * 1024)) + " Mo";
      g2.innerHTML =
        carteStat("👪", `${cap.familles} / ${cap.plafond}`, t("cout.plafond"),
                  cap.part_plafond != null ? t("cout.plafond_p", { pct: cap.part_plafond }) : "") +
        carteStat("💾", cap.part_base + " %", t("cout.base_pleine"),
                  t("cout.base_pleine_p", { u: mo(cap.base_octets), max: mo(cap.base_limite) }));
      zone.appendChild(g2);
      zone.appendChild(el("p", "reglage-aide",
        t(cap.atteint ? "cout.plafond_atteint" : "cout.plafond_libre",
          { reste: Math.max(0, cap.plafond - cap.familles) })));

      // Le plafond lui-même se règle ici.
      const l = el("label", "reglage-ligne");
      l.appendChild(el("span", null, t("cout.plafond_reglage")));
      const i = el("input", "champ-nombre");
      i.type = "number"; i.min = "1"; i.max = "100000"; i.value = String(cap.plafond);
      i.onchange = async () => {
        const n = Math.max(1, parseInt(i.value, 10) || 800);
        i.value = String(n); i.disabled = true;
        await adminDefinirConfig("plafond_familles", String(n));
        i.disabled = false;
        majSansSaut(() => rendre());
      };
      l.appendChild(i);
      zone.appendChild(l);
      zone.appendChild(el("p", "reglage-aide", t("cout.plafond_aide")));
    }
  })();
  return sec;
}

/* Décisions à prendre (chantier « Soutenabilité »).
 * Une décision n'apparaît que si la situation l'appelle. Chaque option est
 * chiffrée et l'une est recommandée : trancher doit prendre une minute. Le
 * choix est enregistré, la question ne revient plus. C'est la page vers
 * laquelle pointent les e-mails de changement. */
function blocDecisions() {
  const sec = el("section", "carte croiss-decisions");
  sec.id = "decisions";
  sec.innerHTML = `<h2>${t("dec.titre")}</h2><p class="note">${t("dec.sous")}</p>`;
  const zone = el("div", "dec-zone");
  zone.innerHTML = `<p class="note">${t("common.chargement")}</p>`;
  sec.appendChild(zone);

  (async () => {
    const ctx = (typeof contexteDecisions === "function") ? await contexteDecisions() : null;
    const prises = (typeof decisionsPrises === "function") ? decisionsPrises() : {};
    const liste = (ctx && typeof decisionsEnAttente === "function")
      ? decisionsEnAttente(ctx, prises) : [];
    zone.innerHTML = "";

    if (!liste.length) {
      zone.appendChild(el("p", "note", t("dec.aucune")));
    } else {
      liste.forEach(d => {
        const carte = el("div", "dec-carte");
        carte.innerHTML = `<p class="dec-q">${echapper(d.titre)}</p>
          <p class="dec-ctx">${echapper(d.contexte)}</p>`;
        d.options.forEach(o => {
          const b = el("button", "dec-opt" + (o.recommande ? " reco" : ""));
          b.innerHTML = `<span class="dec-opt-t">${echapper(o.titre)}${
            o.recommande ? ` <em>${t("dec.recommande")}</em>` : ""}</span>
            <span class="dec-opt-d">${echapper(o.detail)}</span>`;
          b.onclick = async () => {
            if (!confirm(t("dec.confirm", { choix: o.titre }))) return;
            b.disabled = true;
            await enregistrerDecision(d.id, o.id);
            toast(t("dec.enregistree"), "succes");
            majSansSaut(() => rendre());
          };
          carte.appendChild(b);
        });
        zone.appendChild(carte);
      });
    }

    // Décisions déjà tranchées : on garde la trace, sans les remettre en avant.
    const ids = Object.keys(prises);
    if (ids.length) {
      const { details, corps } = blocPliable("📜 " + t("dec.prises", { n: ids.length }), false, "dec-prises");
      ids.forEach(id => {
        const d = (typeof decisionCroissance === "function") ? decisionCroissance(id) : null;
        if (!d) return;
        const o = d.options.find(x => x.id === prises[id]);
        const l = el("div", "dec-prise-l");
        l.innerHTML = `<span>${echapper(d.titre)}</span>
          <strong>${echapper(o ? o.titre : prises[id])}</strong>`;
        const b = el("button", "mini-btn", t("dec.revenir"));
        b.onclick = async () => {
          if (!confirm(t("dec.revenir_confirm"))) return;
          await enregistrerDecision(id, "");
          majSansSaut(() => rendre());
        };
        l.appendChild(b);
        corps.appendChild(l);
      });
      zone.appendChild(details);
    }

    // Ce qui s'est appliqué tout seul, et ce qui a été signalé par e-mail.
    const chg = (typeof adminChangements === "function") ? await adminChangements(10) : [];
    if (chg.length) {
      const { details, corps } = blocPliable("🔔 " + t("dec.journal"), false, "dec-journal");
      corps.appendChild(el("p", "note", t("dec.journal_sous")));
      chg.forEach(x => {
        const l = el("div", "dec-chg-l");
        l.innerHTML = `<span>${echapper(x.resume || x.type)}</span>
          <small>${echapper(jourLisible(String(x.created_at || "").slice(0, 10)) || "—")}
            · ${x.notifie_le ? t("dec.chg_notifie") : t("dec.chg_non_notifie")}</small>`;
        corps.appendChild(l);
      });
      zone.appendChild(details);
    }
  })();
  return sec;
}

/* Soutenabilité : mode vacances et avertissements par e-mail.
 * Pendant une pause, plus rien ne part et rien ne bascule ; l'app continue de
 * fonctionner normalement pour les familles. */
function blocSoutenabilite() {
  const sec = el("section", "carte croiss-pause");
  sec.innerHTML = `<h2>${t("pause.titre")}</h2><p class="note">${t("pause.sous")}</p>`;

  // Avertissements à l'administrateur : allumés par défaut.
  const actives = (typeof notifsAdminActives === "function") ? notifsAdminActives() : true;
  const l = el("label", "switch-ligne");
  const i = el("input"); i.type = "checkbox"; i.checked = actives;
  i.onchange = async () => {
    i.disabled = true;
    await adminDefinirConfig("notifs_admin", i.checked ? "on" : "off");
    configApp.notifs_admin = i.checked ? "on" : "off";
    i.disabled = false;
    majSansSaut(() => rendre());
  };
  l.appendChild(i);
  l.appendChild(el("span", null, t("pause.notifs")));
  sec.appendChild(l);
  sec.appendChild(el("p", "reglage-aide", t(actives ? "pause.notifs_on" : "pause.notifs_off")));

  // Mode vacances : une date de reprise, rien de plus.
  const enPause = (typeof enVacances === "function") ? enVacances() : false;
  const lv = el("label", "reglage-ligne");
  lv.appendChild(el("span", null, t("pause.jusqua")));
  const iv = el("input", "champ-date"); iv.type = "date";
  iv.min = aujourdHui();
  iv.value = (typeof vacancesJusqua === "function") ? vacancesJusqua() : "";
  iv.onchange = async () => {
    iv.disabled = true;
    await adminDefinirConfig("vacances_jusqua", iv.value || "");
    configApp.vacances_jusqua = iv.value || "";
    iv.disabled = false;
    majSansSaut(() => rendre());
  };
  lv.appendChild(iv);
  sec.appendChild(lv);
  sec.appendChild(el("p", "reglage-aide" + (enPause ? " pause-actif" : ""),
    enPause ? t("pause.active", { jour: jourLisible(vacancesJusqua(), true) }) : t("pause.inactive")));
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

  /* ----- Aperçu : le dire franchement, sinon on croit que rien ne marche ----- */
  if (typeof estProduction === "function" && !estProduction()) {
    const av = el("section", "carte bandeau-apercu");
    av.innerHTML = `<p class="apercu-t">${t("apercu.titre")}</p>
      <p class="apercu-d">${t("apercu.detail", { hote: echapper(location.hostname || "—") })}</p>`;
    c.appendChild(av);
  }

  /* ----- Décisions à prendre : en tête, c'est ce que les e-mails pointent ----- */
  c.appendChild(blocDecisions());

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

  /* ----- Entonnoir d'activation & origine des inscriptions -----
   * Les chiffres clés (familles, activation, coefficient viral…) ont rejoint
   * la grille « Chiffres clés » de l'onglet Stats FamiTeam — les deux pages
   * portaient exactement les mêmes nombres. Ce qui reste ici est propre à
   * Croissance : où les familles décrochent, et d'où elles viennent. */
  const kpi = el("section", "carte");
  kpi.innerHTML = `<h2>${t("ent.titre")}</h2>
    <div id="croiss-kpi"><p class="note">${t("common.chargement")}</p></div>`;
  c.appendChild(kpi);
  (async () => {
    const [src, ent] = await Promise.all([
      (typeof adminSources === "function") ? adminSources() : [],
      (typeof adminEntonnoir === "function") ? adminEntonnoir() : null
    ]);
    const grille = kpi.querySelector("#croiss-kpi");
    if (!grille) return;
    grille.innerHTML = "";
    if (!ent && !(Array.isArray(src) && src.length)) {
      grille.innerHTML = `<p class="note">${t("croiss.kpi_ko")}</p>`;
      return;
    }

    // L'entonnoir d'activation : où les familles décrochent réellement.
    // Un taux J+1 seul cachait l'essentiel — c'est entre le premier et le
    // troisième usage que tout se perd.
    if (ent && ent.familles) {
      const etapes = [
        ["👪", t("ent.inscrites"), ent.familles],
        ["🧒", t("ent.avec_enfant"), ent.avec_enfant],
        ["1️⃣", t("ent.un_usage"), ent.un_usage],
        ["3️⃣", t("ent.trois_usages"), ent.trois_usages],
        ["🔟", t("ent.dix_usages"), ent.dix_usages],
        ["⭐", t("ent.actives_30j"), ent.actives_30j]
      ];
      const bloc = el("div", "croiss-entonnoir");
      bloc.innerHTML =
        etapes.map(([emo, lib, n]) => {
          const part = Math.max(0, Math.min(100, Math.round((n / ent.familles) * 100)));
          return `<div class="ent-ligne"><span class="ent-emo">${emo}</span>
            <span class="ent-lib">${lib}</span>
            <span class="ent-barre"><span class="ent-rempl" style="width:${part}%"></span></span>
            <span class="ent-val"><strong>${n}</strong> <small>${part}%</small></span></div>`;
        }).join("") +
        // La perte la plus coûteuse, dite en une phrase : ces familles ont
        // essayé, donc le produit les intéressait.
        (ent.essaye_puis_parti
          ? `<p class="ent-alerte">${t("ent.perte", { n: ent.essaye_puis_parti })}</p>` : "") +
        (ent.endormies_30j
          ? `<p class="note">${t("ent.endormies", { n: ent.endormies_30j })}</p>` : "");
      grille.appendChild(bloc);
    }

    // Origine des inscriptions : ce qui amène réellement des familles.
    if (Array.isArray(src) && src.length) {
      const tbl = el("div", "croiss-sources");
      tbl.innerHTML = `<p class="stat-graph-titre">${t("croiss.sources")}</p>` +
        src.map(r => `<div class="croiss-source-l"><span>${echapper(r.source)}</span>
          <span><strong>${r.familles}</strong> ${t("croiss.sources_fam")}${r.attente ? ` · ${r.attente} ${t("croiss.sources_att")}` : ""}</span></div>`).join("");
      grille.appendChild(tbl);
    }
  })();

  /* ----- Le dépliant A5 des écoles : le meilleur rendement horaire du plan ----- */
  const dep = el("section", "carte");
  dep.innerHTML = `<h2>${t("dep.titre")}</h2><p class="note">${t("dep.pourquoi")}</p>`;
  const bDep = el("button", "gros-bouton planete", "🖨️ " + t("dep.bouton"));
  bDep.onclick = () => modaleDepliant();
  dep.appendChild(bDep);
  c.appendChild(dep);

  /* ----- Envois automatiques : interrupteur, file d'attente, réponses types ----- */
  c.appendChild(blocEnvoisAuto());

  /* ----- Vagues d'invitation : mode d'inscription, cadence, conversion ----- */
  c.appendChild(blocVagues());

  /* ----- Coût annuel, dons reçus, plafond de familles ----- */
  c.appendChild(blocCoutSoutien());

  /* ----- Pause, et avertissements par e-mail ----- */
  c.appendChild(blocSoutenabilite());

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
      c.appendChild(carteRepliable(blocAdminBlagues(), "admin-blagues", false));
      c.appendChild(blocDashboardScience());
      break;
    case "config":
      c.appendChild(blocConnexionParents());
      c.appendChild(blocAdminMailTest());
      c.appendChild(blocAdminDonConfig());
      break;
    case "systeme":
      c.appendChild(blocAdminSysteme());
      break;
    case "mobile":
      blocAdminMobile(c);
      break;
  }
}
