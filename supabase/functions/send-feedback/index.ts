// =====================================================================
// FamiTeam — Edge Function : envoi d'un retour (bug/suggestion) par e-mail
// ---------------------------------------------------------------------
// Envoie un e-mail DEPUIS hello@fami.team via un serveur SMTP (OVH :
// ssl0.ovh.net) vers l'adresse de support. Vérifie que l'appelant est
// authentifié. Mêmes secrets SMTP que la fonction send-test.
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   SMTP_HOST   ex. "ssl0.ovh.net"
//   SMTP_PORT   ex. "465"
//   SMTP_USER   ex. "hello@fami.team"
//   SMTP_PASS   mot de passe de la boîte
//   SMTP_FROM   expéditeur, ex. "hello@fami.team"  (facultatif, défaut = SMTP_USER)
//   FEEDBACK_TO destinataire des retours (facultatif, défaut = SMTP_USER)
// (SUPABASE_URL et SUPABASE_ANON_KEY sont fournis automatiquement.)
// =====================================================================
// On utilise Deno.serve natif (et non l'ancien `serve` de la lib standard)
// pour éviter les erreurs « event loop / BadResource » avec denomailer.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "ssl0.ovh.net";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? SMTP_USER;
const FEEDBACK_TO = Deno.env.get("FEEDBACK_TO") ?? SMTP_USER;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
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
  if (!SMTP_USER || !SMTP_PASS) return json({ error: "SMTP non configuré (secrets manquants)" }, 500);

  const type = body?.type === "bug" ? "Bug" : "Suggestion";
  const email = body?.email ? String(body.email) : "";
  const contexte = body?.context ? JSON.stringify(body.context, null, 2) : "{}";
  const sujet = `FamiTeam — ${type}`;
  const texte = `${message}\n\n--- Contexte ---\n${contexte}\nDe : ${email || "—"}`;

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: SMTP_PORT === 465,        // 465 = SSL direct ; 587 = STARTTLS
      auth: { username: SMTP_USER, password: SMTP_PASS },
    },
  });

  try {
    await client.send({
      from: SMTP_FROM,
      to: FEEDBACK_TO,
      replyTo: email || undefined,
      subject: sujet,
      content: texte,
    });
    await client.close();
    return json({ ok: true });
  } catch (e) {
    try { await client.close(); } catch { /* ignore */ }
    return json({ error: String(e) }, 502);
  }
});
