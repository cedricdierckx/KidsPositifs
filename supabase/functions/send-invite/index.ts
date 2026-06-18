// =====================================================================
// FamiTeam — Edge Function : envoi d'une invitation par e-mail
// ---------------------------------------------------------------------
// Envoie un e-mail d'invitation DEPUIS hello@fami.team via SMTP (OVH),
// en utilisant npm:nodemailer (fiable sur le runtime Deno 2.x de Supabase,
// contrairement à denomailer). Appelant authentifié requis.
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   SMTP_HOST   ex. "ssl0.ovh.net"
//   SMTP_PORT   ex. "465"
//   SMTP_USER   ex. "hello@fami.team"
//   SMTP_PASS   mot de passe de la boîte
//   SMTP_FROM   expéditeur, ex. "FamiTeam <hello@fami.team>" (défaut = SMTP_USER)
// (SUPABASE_URL et SUPABASE_ANON_KEY sont fournis automatiquement.)
// =====================================================================
import nodemailer from "npm:nodemailer@6.9.16";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "ssl0.ovh.net";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? SMTP_USER;
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
  try { body = await req.json(); } catch { body = {}; }
  const to = (body?.to ?? "").toString().trim();
  const subject = (body?.subject ?? "FamiTeam — Invitation").toString();
  const text = (body?.text ?? "").toString();
  if (!to) return json({ error: "Destinataire manquant" }, 400);
  if (!text) return json({ error: "Message vide" }, 400);
  if (!SMTP_USER || !SMTP_PASS) return json({ error: "SMTP non configuré (secrets manquants)" }, 500);

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,   // 465 = SSL implicite ; 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({ from: SMTP_FROM, to, subject, text });
    return json({ ok: true, to });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
});
