/* =====================================================================
 * KidsPositifs — API de synchronisation (Vercel serverless + Upstash KV)
 * ---------------------------------------------------------------------
 *  GET  /api/state?code=XXX  -> renvoie l'état JSON de la famille (ou {})
 *  POST /api/state?code=XXX  -> enregistre l'état JSON envoyé dans le corps
 *
 *  Stockage : Upstash Redis via son API REST.
 *  Variables d'environnement attendues (fournies automatiquement quand on
 *  ajoute une base "Upstash for Redis / KV" depuis le dashboard Vercel) :
 *    - KV_REST_API_URL      (ou UPSTASH_REDIS_REST_URL)
 *    - KV_REST_API_TOKEN    (ou UPSTASH_REDIS_REST_TOKEN)
 * ===================================================================== */

const REST_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Exécute une commande Redis via l'API REST d'Upstash.
async function redis(command) {
  const r = await fetch(REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  if (!r.ok) throw new Error("Upstash error " + r.status);
  const data = await r.json();
  return data.result;
}

// Nettoie le code famille pour en faire une clé sûre.
function cleFamille(code) {
  const c = String(code || "").toLowerCase().replace(/[^a-z0-9\-]/g, "-").slice(0, 40);
  return c ? "kp:" + c : null;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!REST_URL || !REST_TOKEN) {
    return res.status(500).json({
      error: "Stockage non configuré : ajoutez une base Upstash/KV et liez " +
             "KV_REST_API_URL et KV_REST_API_TOKEN dans Vercel."
    });
  }

  const cle = cleFamille(req.query.code);
  if (!cle) return res.status(400).json({ error: "Code famille manquant ou invalide." });

  try {
    if (req.method === "GET") {
      const valeur = await redis(["GET", cle]);
      return res.status(200).json(valeur ? JSON.parse(valeur) : {});
    }

    if (req.method === "POST") {
      // req.body peut être un objet (parsé par Vercel) ou une chaîne.
      let corps = req.body;
      if (typeof corps === "string") {
        try { corps = JSON.parse(corps); } catch { corps = null; }
      }
      if (!corps || typeof corps !== "object" || !corps.enfants) {
        return res.status(400).json({ error: "Corps invalide." });
      }
      await redis(["SET", cle, JSON.stringify(corps)]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
