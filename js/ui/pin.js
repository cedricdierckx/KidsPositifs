/* =====================================================================
 * FamiTeam — Modales de base : badge, parrainage fêté, code PIN
 * ---------------------------------------------------------------------
 * Morceau de l'ancien js/ui.js (Phase C, découpage en sous-vues).
 * Les briques d'interface les plus élémentaires : l'animation d'un badge
 * gagné, la fête d'un parrainage accepté, et le dialogue de code PIN (avec sa
 * réinitialisation par e-mail).
 *
 * Script classique, chargé dans l'ordre fixé par index.html : tous les
 * morceaux partagent la même portée que du temps du fichier unique, donc
 * un morceau peut appeler les fonctions des autres sans rien importer.
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

/* Félicite et remercie le parrain quand un·e filleul·e a créé sa famille.
 * C'est le moment où le deuxième parrainage coûte le moins cher à obtenir :
 * on y annonce donc le palier suivant de l'arbre — jamais un rang, jamais une
 * comparaison avec d'autres familles. */
function feterParrainage(nb) {
  const ov = el("div", "badge-pop");
  const sfx = nb > 1 ? `${nb} familles ont` : "Une famille a";
  ov.innerHTML = `
    <div class="badge-pop-carte parrain-pop">
      <div class="badge-pop-rayons">🎉</div>
      <div class="badge-pop-titre">Merci & bravo ! 💛</div>
      <div class="badge-pop-nom">${sfx} rejoint ${APP_NOM} grâce à toi.<br>Tu répands les ondes positives ! 🤝🌍</div>
      <div class="badge-pop-palier" id="pop-palier"></div>
    </div>`;
  document.body.appendChild(ov);
  if (typeof confettis === "function") confettis();
  // Le palier arrive de la base : s'il n'arrive pas, la fête reste complète.
  if (typeof parrainageBilan === "function") {
    parrainageBilan().then(bilan => {
      const zone = ov.querySelector("#pop-palier");
      if (!bilan || !zone) return;
      const suivant = arbrePalierSuivant(bilan.installees || 0);
      zone.innerHTML = suivant
        ? t("arbre.manque", { n: Math.max(suivant.seuil - (bilan.installees || 0), 0), emoji: suivant.emoji, nom: t("arbre.p" + suivant.rang) })
        : t("arbre.tout_atteint");
    }).catch(() => {});
  }
  const fermer = () => ov.remove();
  ov.addEventListener("click", fermer);
  setTimeout(fermer, 5600);
}

// Saisie d'un code PIN : masqué par des points, clavier numérique sur mobile.
function demanderPin(opts) {
  opts = opts || {};
  const ov = el("div", "pin-modal");
  ov.innerHTML = `
    <div class="pin-carte">
      <div class="pin-titre">${opts.titre || "🔒 Code PIN"}</div>
      ${opts.sousTitre ? `<div class="pin-sous">${opts.sousTitre}</div>` : ""}
      <input id="pin-input" type="tel" inputmode="numeric" pattern="[0-9]*"
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
    text: t("pin.reset_corps", { code, app: APP_NOM }),
    interactif: true            // demandé par le parent : doit marcher partout
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
