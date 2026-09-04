/* =====================================================================
 * FamiTeam — Minuteur d'écran et écrans de verrouillage
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * L'affichage du minuteur (préparation, décompte, bandeau), ses modales de
 * réglage, et les deux écrans de verrouillage : le classique (code PIN) et le
 * permanent (attente d'un nouveau cycle, sans code).
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
 * ===================================================================== */

// Synchronise l'affichage du minuteur avec son état (appelé à chaque rendu).
function synchroniserTimerUI() {
  // En mode permanent, l'échappatoire parentale (contournerVerrouPermanent)
  // laisse `verrouille` inchangé — c'est modeParents qui masque l'écran
  // d'attente le temps que le parent consulte les réglages.
  if (timerEtat.verrouille && !(timerMode() === "permanent" && modeParents)) {
    if (timerMode() === "permanent") { masquerVerrou(); afficherVerrouPermanent(); }
    else { masquerVerrouPermanent(); afficherVerrou(); }
    return;
  }
  masquerVerrou();
  masquerVerrouPermanent();
  if (timerEtat.choix) { afficherChoixEnfant(); masquerBandeauTimer(); majBoutonTimer(); return; }
  masquerChoixEnfant();
  // Mode permanent configuré mais personne désigné pour ce cycle (première
  // activation, ou cycle qui vient d'expirer pendant que l'espace parents
  // était ouvert) : jamais de reprise automatique sur l'enfant actif au
  // hasard — on redemande explicitement.
  if (timerMode() === "permanent" && !timerEtat.enfant && !modeParents) {
    afficherChoixDemarrage();
    masquerBandeauTimer();
    majBoutonTimer();
    return;
  }
  masquerChoixDemarrage();
  if (!timerEtat.prep) masquerPrep();
  if (timerEtat.actif) {
    if (!timerInterval) lancerTickTimer(); else tickTimer();
  } else {
    masquerBandeauTimer();
    // Filet de sécurité : en mode permanent l'intervalle ne doit jamais
    // rester arrêté (c'est lui qui détecte le changement de cycle).
    if (timerMode() === "permanent" && !timerInterval) lancerTickTimer();
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

// Écran « qui commence ? » : aucun minuteur (permanent compris) ne démarre
// jamais tout seul sur l'enfant actif au hasard — on demande explicitement.
// Utilisé juste après avoir configuré un mode (bouton « go » de modaleTimer)
// ET automatiquement à chaque nouveau cycle du mode permanent (voir
// assurerCyclePermanent, app.js), puisque ce mode n'a pas de bouton dédié.
function afficherChoixDemarrage() {
  if (document.getElementById("choix-demarrage")) return;   // déjà affiché
  masquerBandeauTimer();
  const permanent = (typeof timerMode === "function") && timerMode() === "permanent";
  const ov = el("div", "verrou-ecran" + (permanent ? " verrou-ecran-perm" : ""));
  ov.id = "choix-demarrage";
  let cartes = "";
  Object.values(etat.enfants).forEach(enf => {
    cartes += `<button class="choix-enf" data-id="${enf.id}" style="--c:${enf.couleur}">
        ${vignetteEnfant(enf, "moyen")}
        <span class="choix-nom">${echapper(enf.prenom)}</span>
      </button>`;
  });
  ov.innerHTML = `
    <div class="verrou-carte choix-carte">
      ${permanent ? "" : `<button class="modale-fermer" aria-label="${t("common.fermer")}">✕</button>`}
      <div class="verrou-emoji">🙋</div>
      <h2>${t("choixDemarrage.titre")}</h2>
      <p>${t("choixDemarrage.texte")}</p>
      <div class="choix-liste">${cartes}</div>
      ${permanent ? `<button id="cd-parents" class="lien-oubli">${t("verrouPerm.parents")}</button>` : ""}
    </div>`;
  document.body.appendChild(ov);
  ov.querySelectorAll(".choix-enf").forEach(b => {
    b.onclick = () => demarrerTimerPourEnfant(b.dataset.id);
  });
  const fermer = ov.querySelector(".modale-fermer");
  if (fermer) fermer.onclick = () => masquerChoixDemarrage();
  const parents = ov.querySelector("#cd-parents");
  if (parents) parents.onclick = () => {
    if (etat.reglages && etat.reglages.codeParent) {
      demanderPin({
        titre: t("verrou.pin_titre"),
        permettreOubli: true,
        onReset: () => contournerVerrouPermanent(),
        onOk: (saisi) => {
          if (saisi.trim() !== etat.reglages.codeParent) return false;
          contournerVerrouPermanent();
        }
      });
    } else contournerVerrouPermanent();
  };
}
function masquerChoixDemarrage() {
  const ov = document.getElementById("choix-demarrage");
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

// Modale de configuration + démarrage du minuteur (ou d'enregistrement pour
// le mode permanent, qui se (re)lance tout seul sans bouton « Démarrer »).
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
        <label class="radio-ligne"><input type="radio" name="tm-mode" value="parEnfant" ${mode === "parEnfant" ? "checked" : ""}> ${t("timer.mode_enfant")}</label>
        <label class="radio-ligne"><input type="radio" name="tm-mode" value="global" ${mode === "global" ? "checked" : ""}> ${t("timer.mode_global")}</label>
        <label class="radio-ligne"><input type="radio" name="tm-mode" value="permanent" ${mode === "permanent" ? "checked" : ""}> ${t("timer.mode_permanent")}</label>
        <!-- Toujours prévoir la possibilité d'arrêter net : un parent qui a
             activé un mode (surtout le permanent, sans PIN) doit pouvoir
             revenir ici et tout désactiver, sans avoir à deviner comment. -->
        <label class="radio-ligne"><input type="radio" name="tm-mode" value="off" ${mode === "off" ? "checked" : ""}> ${t("timer.mode_off")}</label>
      </div>
      <p id="tm-permanent-note" class="note timer-avert" style="display:${mode === "permanent" ? "block" : "none"}">${t("timer.mode_permanent_note")}</p>
      ${(etat.reglages && etat.reglages.codeParent) || mode === "off" ? "" : `<p id="tm-sans-pin" class="note timer-avert">${t("timer.sans_pin")}</p>`}
      <button id="tm-go" class="gros-bouton planete">${(mode === "permanent" || mode === "off") ? t("timer.enregistrer") : t("timer.demarrer")}</button>
    </div>`;
  document.body.appendChild(ov);
  const fermer = () => ov.remove();
  ov.querySelector(".modale-fermer").onclick = fermer;
  ov.addEventListener("click", e => { if (e.target === ov) fermer(); });
  const go = ov.querySelector("#tm-go");
  const note = ov.querySelector("#tm-permanent-note");
  ov.querySelectorAll('input[name="tm-mode"]').forEach(r => r.addEventListener("change", () => {
    if (!r.checked) return;
    go.textContent = (r.value === "permanent" || r.value === "off") ? t("timer.enregistrer") : t("timer.demarrer");
    note.style.display = r.value === "permanent" ? "block" : "none";
    const sansPin = ov.querySelector("#tm-sans-pin");
    if (sansPin) sansPin.style.display = r.value === "off" ? "none" : "block";
  }));
  go.onclick = () => {
    const d = ov.querySelector("#tm-duree").value;
    const m = (ov.querySelector('input[name="tm-mode"]:checked') || {}).value || "parEnfant";
    definirReglageTimer(d, m);
    fermer();
    // Désactivé : rien à démarrer, ni à choisir — juste confirmer que c'est
    // bien coupé (utile en particulier en sortant du mode permanent, sans PIN).
    if (m === "off") { toast(t("timer.off_active"), "info"); return; }
    // Les autres modes ne démarrent plus tout seuls sur l'enfant actif : on
    // demande toujours explicitement qui commence (voir afficherChoixDemarrage).
    if (m === "permanent") toast(t("timer.permanent_active"), "info");
    afficherChoixDemarrage();
  };
}

// Accès (PIN si défini) aux réglages du minuteur quand le mode permanent est
// actif — pas de bouton « arrêter » distinct : tout se joue dans la modale
// de configuration, en repassant éventuellement sur un autre mode.
function ouvrirReglagesTimerPermanent() {
  if (etat.reglages && etat.reglages.codeParent) {
    demanderPin({
      titre: t("timer.arret_titre"), sousTitre: t("timer.arret_pin"),
      permettreOubli: true,
      onReset: () => modaleTimer(),
      onOk: (saisi) => {
        if (saisi.trim() !== etat.reglages.codeParent) return false;
        modaleTimer();
      }
    });
  } else modaleTimer();
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

// Écran d'attente du mode « verrouillage permanent » : PAS de code PIN — la
// reprise est automatique au cycle suivant. Une échappatoire PIN (facultative)
// permet malgré tout aux parents d'accéder aux réglages sans attendre.
function afficherVerrouPermanent() {
  if (document.getElementById("verrou-permanent-ecran")) {
    majAffichageAttentePermanent(Math.max(0, timerFinCycle(timerEtat.cyclePermanent) - Date.now()));
    return;
  }
  masquerBandeauTimer();
  const ov = el("div", "verrou-ecran verrou-ecran-perm");
  ov.id = "verrou-permanent-ecran";
  // Contrairement à l'écran « temps écoulé » classique (sobre, avec PIN), ce
  // décor est vu plusieurs fois par jour par de jeunes enfants SANS jamais
  // exiger de code : autant qu'il ressemble à une pause câline plutôt qu'à un
  // écran de panne — étoiles qui clignotent, croissant animé.
  ov.innerHTML = `
    <div class="verrou-carte verrou-carte-perm">
      <div class="verrou-perm-ciel" aria-hidden="true">
        <span>✨</span><span>⭐</span><span>✨</span><span>⭐</span>
      </div>
      <div class="verrou-emoji verrou-emoji-perm">🌙</div>
      <h2>${t("verrouPerm.titre")}</h2>
      <p>${t("verrouPerm.texte")}</p>
      <div id="vp-attente" class="verrou-attente">--:--</div>
      <button id="vp-parents" class="lien-oubli">${t("verrouPerm.parents")}</button>
    </div>`;
  document.body.appendChild(ov);
  const btn = ov.querySelector("#vp-parents");
  if (btn) btn.onclick = () => {
    if (etat.reglages && etat.reglages.codeParent) {
      demanderPin({
        titre: t("verrou.pin_titre"),
        permettreOubli: true,
        onReset: () => contournerVerrouPermanent(),
        onOk: (saisi) => {
          if (saisi.trim() !== etat.reglages.codeParent) return false;
          contournerVerrouPermanent();
        }
      });
    } else contournerVerrouPermanent();
  };
  majAffichageAttentePermanent(Math.max(0, timerFinCycle(timerEtat.cyclePermanent) - Date.now()));
}
function masquerVerrouPermanent() {
  const ov = document.getElementById("verrou-permanent-ecran");
  if (ov) ov.remove();
}
// Met à jour le décompte « nouveau temps dans Xh Ym » de l'écran d'attente.
function majAffichageAttentePermanent(msRestant) {
  const cible = document.getElementById("vp-attente");
  if (!cible) return;
  const totalMin = Math.max(0, Math.ceil(msRestant / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  cible.textContent = h > 0 ? t("verrouPerm.attente_h", { h, m }) : t("verrouPerm.attente_m", { m });
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
