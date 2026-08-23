/* =====================================================================
 * FamiTeam — Couche de données isolée (Phase D)
 * ---------------------------------------------------------------------
 * UN SEUL endroit qui parle à Supabase pour l'état de jeu : lecture,
 * écriture (avec garde-fous), temps réel et historique. Le reste de
 * l'application ne touche plus jamais directement aux tables
 * `family_state` / `family_state_history`.
 *
 * API publique (objet global `Store`) :
 *   Store.init(client)        — fournit le client Supabase
 *   Store.charger()           — charge l'état distant de la famille active
 *   Store.tirer()             — récupère une version plus récente (au retour)
 *   Store.planifierSauver()   — sauvegarde différée (anti-rebond)
 *   Store.sauver()            — écriture immédiate (garde-fous inclus)
 *   Store.historique()        — instantanés automatiques (sauvegardes)
 *   Store.abonnerRealtime()   — synchro temps réel entre appareils
 *   Store.badge(symbole)      — met à jour l'indicateur de synchro (UI)
 *
 * Les garde-fous d'écriture sont centralisés ici (anti inter-familles,
 * anti-état-vide, validation de schéma) : c'est le rempart unique contre
 * toute perte de données.
 * ===================================================================== */

const Store = (() => {
  let client = null;          // client Supabase
  let cloudTimer = null;      // anti-rebond sauvegarde
  let canal = null;           // abonnement temps réel
  let pollTimer = null;       // repli : interrogation périodique

  // Dernière version (etat.maj) que Store SAIT présente sur le serveur —
  // via une lecture ou une écriture réussie. Sert à détecter, juste avant
  // d'écrire, qu'un AUTRE appareil a sauvegardé entretemps (deux appareils
  // hors ligne en même temps, chacun modifiant sa propre copie). Sans ce
  // garde-fou, l'upsert écrase silencieusement tout ce que l'autre appareil
  // avait ajouté : aucune goutte ni aucun cœur ne se fusionne jamais, c'est
  // le bloc entier de la famille qui remplace l'autre.
  let derniereMajConnue = null;
  // L'avertissement ne se dit qu'une fois par chargement : répété à chaque
  // geste, il devient du bruit et n'apprend plus rien.
  let conflitSignale = false;

  // Intervalle d'interrogation (ms) quand le temps réel est désactivé.
  const POLL_MS = 30000;

  function init(sbClient) { client = sbClient; }
  function pret() { return !!(client && typeof familleId !== "undefined" && familleId); }

  // Temps réel actif ? On peut le couper globalement via KP_CONFIG.REALTIME = false
  // (repli sur interrogation périodique) pour économiser les connexions
  // persistantes quand on approche des milliers d'appareils simultanés.
  function realtimeActif() {
    return !(typeof window !== "undefined" && window.KP_CONFIG && window.KP_CONFIG.REALTIME === false);
  }

  function prevenirConflit() {
    if (conflitSignale) return;
    conflitSignale = true;
    if (typeof toast === "function" && typeof t === "function") toast(t("sync.conflit"), "info");
  }

  function badge(symbole) {
    const b = document.querySelector("#sync-etat");
    if (b) b.textContent = symbole;
  }

  // Vérifie qu'un écrit distant est sûr. Renvoie { ok, raison }.
  // Centralise les trois garde-fous historiques.
  function ecritureAutorisee() {
    // GARDE-FOU 1 : ne jamais écrire l'état d'une famille dans une autre.
    if (typeof familleEtat !== "undefined" && familleEtat && familleEtat !== familleId)
      return { ok: false, raison: "état chargé d'une autre famille" };
    // GARDE-FOU 2 : ne jamais écraser une famille avec un état sans enfant.
    if (typeof etatNonVide === "function" && !etatNonVide(etat))
      return { ok: false, raison: "état vide (aucun enfant)" };
    // GARDE-FOU 3 : valider le schéma avant écriture.
    if (typeof etatValide === "function") {
      const v = etatValide(etat);
      if (!v.ok) return { ok: false, raison: v.raison };
    }
    return { ok: true };
  }

  async function charger() {
    if (!pret()) return;
    badge("⏬");
    const { data, error } = await client.from("family_state")
      .select("data").eq("family_id", familleId).maybeSingle();
    if (!error && data && data.data && data.data.enfants) {
      const distant = normaliser(data.data);
      if ((distant.maj || 0) >= (etat.maj || 0)) {
        lierEtat(distant); ecrireCache(); derniereMajConnue = distant.maj || 0;
      } else await sauver();
    } else {
      if (!etatNonVide(etat)) lierEtat(etatVierge());
      await sauver();                       // initialise la ligne distante
    }
    badge("✅");
  }

  async function tirer() {
    if (!pret()) return;
    const { data, error } = await client.from("family_state")
      .select("data").eq("family_id", familleId).maybeSingle();
    if (error || !data || !data.data || !data.data.enfants) return;
    const distant = data.data;
    const majDistante = distant.maj || 0;
    if (majDistante === (etat.maj || 0)) return;          // rien de neuf

    // Comparer les horodatages ne suffit pas. `etat.maj` est l'heure de CET
    // appareil, avancée à chaque geste ; deux téléphones ne sont jamais à la
    // même seconde, et il suffit qu'une horloge avance de deux minutes pour
    // que son porteur ne reçoive PLUS JAMAIS ce que l'autre a coché : sa
    // version paraît toujours « plus récente », donc `tirer()` ne prenait
    // rien. C'est exactement l'écart constaté entre l'app et le site.
    //
    // Quand rien n'attend d'être envoyé — notre état est celui que le
    // serveur a déjà reçu — le serveur fait foi (ARCHITECTURE §1) et on
    // adopte sa version, fût-elle horodatée avant la nôtre. Rien ne peut se
    // perdre : nous n'avons, par définition, aucune modification à nous.
    const rienEnAttente = derniereMajConnue !== null && (etat.maj || 0) === derniereMajConnue;
    if (majDistante > (etat.maj || 0) || rienEnAttente) {
      lierEtat(normaliser(distant)); ecrireCache(); rendre();
      derniereMajConnue = majDistante;
    }
    // Sinon : nous avons des modifications non envoyées ET le serveur a une
    // autre version. On ne tranche pas ici — c'est le rôle de sauver(), qui
    // met la version perdante à l'abri avant d'adopter l'autre.
  }

  /* ---------- Retour au premier plan ----------
   * Android gèle la WebView d'une app en arrière-plan : les minuteurs
   * s'arrêtent, et — plus grave — le canal temps réel meurt sans rien dire.
   * Un canal mort ne rejoue JAMAIS les changements manqués : l'app pouvait
   * donc rester des heures sur un écran périmé pendant que le site, lui,
   * était à jour. On relit donc l'état ET on rouvre le canal à chaque retour.
   * Le verrou de cinq secondes évite d'enchaîner les reconnexions quand
   * plusieurs signaux de reprise arrivent ensemble (visibilité + focus +
   * plugin natif, qui se déclenchent souvent coup sur coup). */
  const REPRISE_MIN_MS = 5000;
  let derniereReprise = 0;

  async function reprendre() {
    if (!pret()) return;
    const maintenant = Date.now();
    if (maintenant - derniereReprise < REPRISE_MIN_MS) return;
    derniereReprise = maintenant;
    await tirer();
    abonnerRealtime();
  }

  function planifierSauver() {
    if (typeof modeDemo !== "undefined" && modeDemo) return;  // la démo ne synchronise rien
    if (!pret()) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(sauver, 700);
  }

  function annulerSauverDiffere() { clearTimeout(cloudTimer); }

  async function sauver() {
    if (!pret()) return;
    const autorise = ecritureAutorisee();
    if (!autorise.ok) {
      console.warn("Sauvegarde annulée :", autorise.raison);
      badge("🛑"); return;
    }
    try {
      badge("⏫");
      // Garde-fou anti-conflit : si on connaît déjà une version serveur, on
      // vérifie qu'elle n'a pas bougé sous nos pieds avant d'écraser. Hors
      // ligne, cette lecture échoue elle aussi — on retombe alors sur l'ancien
      // comportement (tentative d'écriture directe) sans rien bloquer.
      if (derniereMajConnue !== null) {
        const { data: actuel, error: errLecture } = await client.from("family_state")
          .select("data").eq("family_id", familleId).maybeSingle();
        if (!errLecture) {
          const majServeur = (actuel && actuel.data && actuel.data.maj) || 0;
          if (majServeur !== derniereMajConnue) {
            // On ne BLOQUE plus. L'ancien comportement annulait l'écriture et
            // laissait le repère faux : l'appareil répétait l'avertissement à
            // chaque geste, cessait de synchroniser jusqu'au rechargement, et
            // renvoyait le parent vers un écran caché derrière le code PIN,
            // en pleine soirée, pour arbitrer une question qu'il ne pouvait
            // pas trancher. On tranche donc à sa place, sans rien perdre :
            // la version la plus récente est gardée, l'autre reste
            // récupérable — dans l'historique côté serveur si c'est celle du
            // serveur qui cède, sur l'appareil si c'est la nôtre.
            const distant = actuel && actuel.data;
            console.warn("Conflit de synchro", { connu: derniereMajConnue, serveur: majServeur });
            if (distant && distant.enfants && majServeur > (etat.maj || 0)) {
              // L'autre appareil est en avance : on met la nôtre à l'abri sur
              // cet appareil, puis on adopte la sienne. Aucune écriture.
              if (typeof sauvegarderAvantConflit === "function") sauvegarderAvantConflit();
              lierEtat(normaliser(distant)); ecrireCache();
              derniereMajConnue = majServeur;
              badge("🔀");
              prevenirConflit();
              if (typeof rendre === "function") rendre();
              return;
            }
            // Notre version est la plus récente : on écrit. Celle du serveur
            // part dans family_state_history (déclencheur d'archivage), donc
            // elle reste consultable. On repart d'un repère juste pour ne pas
            // rester coincé à la sauvegarde suivante.
            derniereMajConnue = majServeur;
            prevenirConflit();
          }
        }
      }
      // La version retenue doit être celle qu'on ENVOIE, capturée avant
      // l'attente réseau. La relire après l'`await` donnait la valeur courante
      // de `etat.maj`, qui a pu avancer entretemps : `sauver()` avance ce
      // compteur à CHAQUE geste et l'envoi est différé de 700 ms, si bien
      // qu'un enfant cochant deux missions d'affilée décalait le repère d'un
      // cran. L'appareil se déclarait alors en conflit avec lui-même, à la
      // sauvegarde suivante et à toutes celles d'après — il cessait
      // silencieusement de synchroniser jusqu'au rechargement de la page.
      const majEnvoyee = etat.maj || 0;
      const { error } = await client.from("family_state")
        .upsert({ family_id: familleId, data: etat, updated_at: new Date().toISOString() });
      if (!error) derniereMajConnue = majEnvoyee;
      badge(error ? "⚠️" : "✅");
    } catch { badge("📴"); }
  }

  async function historique() {
    if (!pret() || (typeof modeDemo !== "undefined" && modeDemo)) return [];
    const { data, error } = await client.from("family_state_history")
      .select("id,saved_at,data").eq("family_id", familleId)
      .order("saved_at", { ascending: false }).limit(40);
    if (error) return [];
    return (data || []).map(r => {
      const enfants = (r.data && r.data.enfants) ? Object.values(r.data.enfants) : [];
      return { id: r.id, saved_at: r.saved_at, nb: enfants.length,
               prenoms: enfants.map(e => e.prenom), data: r.data };
    });
  }

  function abonnerRealtime() {
    if (!pret()) return;
    fermerRealtime();   // on repart propre (canal + polleur)
    // Repli : si le temps réel est coupé, on interroge périodiquement.
    if (!realtimeActif()) { demarrerPolleur(); return; }
    canal = client.channel("fs:" + familleId)
      .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "family_state", filter: "family_id=eq." + familleId },
          payload => {
            const d = payload.new && payload.new.data;
            if (d && d.enfants && (d.maj || 0) > (etat.maj || 0)) {
              lierEtat(normaliser(d)); ecrireCache(); rendre();
              derniereMajConnue = d.maj || 0;
            }
          })
      .subscribe();
  }

  // Polleur de repli : récupère l'état distant à intervalle régulier, mais
  // seulement quand l'onglet est visible (économie de requêtes et de batterie).
  function demarrerPolleur() {
    pollTimer = setInterval(() => {
      if (typeof document === "undefined" || !document.hidden) tirer();
    }, POLL_MS);
  }

  function fermerRealtime() {
    if (canal && client) { client.removeChannel(canal); canal = null; }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  return { init, charger, tirer, reprendre, planifierSauver, annulerSauverDiffere, sauver,
           historique, abonnerRealtime, fermerRealtime, badge, ecritureAutorisee, realtimeActif };
})();
