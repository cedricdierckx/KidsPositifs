// =====================================================================
// FamiTeam — Edge Function : envoi d'un e-mail de TEST (via SMTP OVH)
// ---------------------------------------------------------------------
// Envoie un e-mail de test DEPUIS hello@fami.team via un serveur SMTP
// (OVH : ssl0.ovh.net) vers une adresse fournie. Sert au compte admin
// pour vérifier que l'expédition fonctionne. Appelant authentifié requis.
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   SMTP_HOST   ex. "ssl0.ovh.net"
//   SMTP_PORT   ex. "465"
//   SMTP_USER   ex. "hello@fami.team"
//   SMTP_PASS   mot de passe de la boîte
//   SMTP_FROM   expéditeur, ex. "hello@fami.team"  (facultatif, défaut = SMTP_USER)
// (SUPABASE_URL et SUPABASE_ANON_KEY sont fournis automatiquement.)
// =====================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "ssl0.ovh.net";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? SMTP_USER;
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
  if (!SMTP_USER || !SMTP_PASS) return json({ error: "SMTP non configuré (secrets manquants)" }, 500);

  const sujet = "FamiTeam — e-mail de test ✅";
  const texte =
    "Bravo ! Si tu lis ce message, l'envoi d'e-mails depuis hello@fami.team fonctionne.\n\n" +
    `Envoyé le ${new Date().toLocaleString("fr-BE")}.`;

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: SMTP_PORT === 465,        // 465 = SSL direct ; 587 = STARTTLS
      auth: { username: SMTP_USER, password: SMTP_PASS },
    },
  });

  try {
    await client.send({ from: SMTP_FROM, to, subject: sujet, content: texte });
    await client.close();
    return json({ ok: true, to });
  } catch (e) {
    try { await client.close(); } catch { /* ignore */ }
    return json({ error: String(e) }, 502);
  }
});
