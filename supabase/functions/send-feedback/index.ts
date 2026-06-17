// =====================================================================
// FamiTeam — Edge Function : envoi d'un retour (bug/suggestion) par e-mail
// ---------------------------------------------------------------------
// Envoie un e-mail DEPUIS hello@fami.team (via Resend) vers l'adresse de
// support. Vérifie que l'appelant est authentifié.
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   RESEND_API_KEY   clé API Resend (re_...)
//   FEEDBACK_FROM    expéditeur, ex. "FamiTeam <hello@fami.team>"
//   FEEDBACK_TO      destinataire, ex. "hello@fami.team"
// (SUPABASE_URL et SUPABASE_ANON_KEY sont fournis automatiquement.)
// =====================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("FEEDBACK_FROM") ?? "FamiTeam <hello@fami.team>";
const TO = Deno.env.get("FEEDBACK_TO") ?? "hello@fami.team";
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
  try {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: SUPABASE_ANON_KEY },
    });
    if (!u.ok) return json({ error: "Session invalide" }, 401);
  } catch {
    return json({ error: "Vérification impossible" }, 401);
  }

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "JSON invalide" }, 400); }
  const message = (body?.message ?? "").toString().trim();
  if (!message) return json({ error: "Message vide" }, 400);

  const type = body?.type === "bug" ? "Bug" : "Suggestion";
  const email = body?.email ? String(body.email) : "";
  const contexte = body?.context ? JSON.stringify(body.context, null, 2) : "{}";
  const sujet = `FamiTeam — ${type}`;
  const texte = `${message}\n\n--- Contexte ---\n${contexte}\nDe : ${email || "—"}`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email || undefined,
        subject: sujet,
        text: texte,
      }),
    });
    if (!r.ok) return json({ error: await r.text() }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
