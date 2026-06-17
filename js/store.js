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
      if ((distant.maj || 0) >= (etat.maj || 0)) { lierEtat(distant); ecrireCache(); }
      else await sauver();
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
    if (!error && data && data.data && data.data.enfants && (data.data.maj || 0) > (etat.maj || 0)) {
      lierEtat(normaliser(data.data)); ecrireCache(); rendre();
    }
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
      const { error } = await client.from("family_state")
        .upsert({ family_id: familleId, data: etat, updated_at: new Date().toISOString() });
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

  return { init, charger, tirer, planifierSauver, annulerSauverDiffere, sauver,
           historique, abonnerRealtime, fermerRealtime, badge, ecritureAutorisee, realtimeActif };
})();
