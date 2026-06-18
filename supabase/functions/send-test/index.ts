// =====================================================================
// FamiTeam — Edge Function : envoi d'un e-mail de TEST
// ---------------------------------------------------------------------
// Envoie un e-mail de test DEPUIS hello@fami.team (via Resend) vers une
// adresse fournie. Sert au compte admin pour vérifier que l'expédition
// fonctionne. Vérifie que l'appelant est authentifié.
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   RESEND_API_KEY   clé API Resend (re_...)
//   FEEDBACK_FROM    expéditeur, ex. "FamiTeam <hello@fami.team>"
// (SUPABASE_URL et SUPABASE_ANON_KEY sont fournis automatiquement.)
// =====================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("FEEDBACK_FROM") ?? "FamiTeam <hello@fami.team>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  // --- Authentification : on exige un utilisateur connecté ---
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);
  let email = "";
  try {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: SUPABASE_ANON_KEY },
    });
    if (!u.ok) return json({ error: "Session invalide" }, 401);
    const data = await u.json();
    email = data?.email ?? "";
  } catch {
    return json({ error: "Vérification impossible" }, 401);
  }

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  // Destinataire : celui fourni, sinon l'utilisateur connecté lui-même.
  const to = (body?.to ?? email ?? "").toString().trim();
  if (!to) return json({ error: "Destinataire manquant" }, 400);

  const sujet = "FamiTeam — e-mail de test ✅";
  const texte =
    "Bravo ! Si tu lis ce message, l'envoi d'e-mails depuis hello@fami.team fonctionne.\n\n" +
    `Envoyé le ${new Date().toLocaleString("fr-BE")}.`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject: sujet, text: texte }),
    });
    if (!r.ok) return json({ error: await r.text() }, 502);
    return json({ ok: true, to });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
