/* =====================================================================
 * FamiTeam — Écran de démarrage
 * ---------------------------------------------------------------------
 * Le décor lui-même est écrit en dur dans index.html (il doit s'afficher
 * avant l'exécution du moindre script) et stylé dans css/style.css. Ce
 * fichier ne fait que l'animer :
 *   1. il fait défiler de petites phrases, pour que l'attente se lise comme
 *      une préparation et non comme un blocage ;
 *   2. si le réseau traîne, il le DIT — et propose de recharger, plutôt que
 *      de laisser un enfant devant un décor qui tourne dans le vide.
 *
 * Il n'a rien à masquer à la fin : le premier écran peint remplace le
 * contenu du <body> (initSquelette, ecranAuth, ecranConfig…), donc le décor
 * s'en va avec. Le minuteur s'arrête de lui-même quand le nœud a disparu.
 *
 * Volontairement autonome : il ne dépend ni de i18n.js ni de config.js, qui
 * sont chargés après lui. D'où ce petit dictionnaire local — quatre phrases
 * par langue, rien de plus.
 * ===================================================================== */
(function () {
  const PHRASES = {
    fr: ["On réveille les étoiles…", "On prépare les missions du jour…",
         "On nourrit les animaux de la planète…", "On gonfle les ballons…",
         "On compte les cœurs…"],
    en: ["Waking up the stars…", "Getting today's missions ready…",
         "Feeding the planet's animals…", "Blowing up the balloons…",
         "Counting the hearts…"],
    nl: ["We maken de sterren wakker…", "We zetten de missies van vandaag klaar…",
         "We voeren de dieren van de planeet…", "We blazen de ballonnen op…",
         "We tellen de hartjes…"],
    de: ["Wir wecken die Sterne…", "Wir bereiten die Missionen des Tages vor…",
         "Wir füttern die Tiere des Planeten…", "Wir pusten die Luftballons auf…",
         "Wir zählen die Herzen…"]
  };
  const LENT = {
    fr: { texte: "Le réseau prend son temps… on continue d'essayer.", bouton: "Recharger" },
    en: { texte: "The network is taking its time… still trying.", bouton: "Reload" },
    nl: { texte: "Het netwerk doet er lang over… we blijven proberen.", bouton: "Herladen" },
    de: { texte: "Das Netz braucht länger… wir versuchen es weiter.", bouton: "Neu laden" }
  };

  // Même règle que i18n.js (clé "kp_langue", puis la langue du téléphone),
  // recopiée ici parce que i18n.js n'est pas encore chargé.
  function langue() {
    try {
      const stocke = localStorage.getItem("kp_langue");
      if (stocke && PHRASES[stocke]) return stocke;
    } catch (e) {}
    const n = ((navigator && navigator.language) || "fr").slice(0, 2).toLowerCase();
    return PHRASES[n] ? n : "fr";
  }

  const lg = langue();
  const phrases = PHRASES[lg];
  const zone = document.getElementById("dem-message");
  if (zone) zone.textContent = phrases[0];

  const DUREE = 1900;          // une phrase toutes les ~2 s : lisible sans presser
  const SEUIL_LENT = 9000;     // au-delà, le réseau n'est manifestement pas franc
  const SEUIL_BOUTON = 20000;  // et au-delà, on rend la main au parent
  const depart = Date.now();
  let i = 0;

  const minuteur = setInterval(function () {
    const bloc = document.getElementById("demarrage");
    // Le premier écran est peint : le décor n'existe plus, on s'arrête net.
    if (!bloc || !bloc.isConnected) { clearInterval(minuteur); return; }

    const msg = document.getElementById("dem-message");
    if (msg) {
      i = (i + 1) % phrases.length;
      msg.classList.add("change");
      setTimeout(function () {
        msg.textContent = phrases[i];
        msg.classList.remove("change");
      }, 250);
    }

    const ecoule = Date.now() - depart;
    const lent = document.getElementById("dem-lent");
    if (lent && ecoule > SEUIL_LENT && lent.hidden) {
      lent.hidden = false;
      lent.appendChild(document.createTextNode(LENT[lg].texte));
    }
    if (lent && ecoule > SEUIL_BOUTON && !lent.querySelector("button")) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = LENT[lg].bouton;
      b.onclick = function () { location.reload(); };
      lent.appendChild(document.createElement("br"));
      lent.appendChild(b);
    }
  }, DUREE);
})();
