// =====================================================================
// FamiTeam — Edge Function : réception des paiements Stripe (dons)
// ---------------------------------------------------------------------
// Enregistre chaque don reçu (Payment Links Stripe configurés dans
// l'espace Admin) dans la table `donations`, pour remplacer les
// estimations de conversion par une mesure réelle.
//
// Événements traités :
//   - checkout.session.completed  (don ponctuel, ou 1er paiement d'abonnement)
//   - invoice.paid                (paiement récurrent d'un abonnement)
// Tout autre événement est accusé réception (200) sans traitement.
//
// Sécurité : la signature Stripe est vérifiée par calcul HMAC-SHA256
// manuel (Web Crypto), SANS dépendance au SDK Stripe — seul le secret de
// signature du webhook est nécessaire, jamais la clé API secrète.
// Idempotence : `stripe_event_id` est UNIQUE en base ; un événement rejoué
// par Stripe (retry) ne crée jamais de doublon (on conflict do nothing).
//
// Secrets requis (Supabase → Edge Functions → Secrets) :
//   STRIPE_WEBHOOK_SECRET   le "Signing secret" (whsec_...) de CE endpoint,
//                           visible dans Stripe → Developers → Webhooks.
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.)
//
// ⚠️ Étape manuelle indispensable au déploiement (impossible à faire depuis
// le code) : cette fonction reçoit des appels de Stripe, PAS des appels de
// l'app authentifiés par un jeton Supabase. Il faut donc désactiver la
// vérification JWT propre à Supabase pour cette fonction précise :
//   supabase functions deploy stripe-webhook --no-verify-jwt
// (ou, dans le Dashboard : Edge Functions → stripe-webhook → réglages →
// désactiver « Enforce JWT Verification »).
// Puis, dans Stripe → Developers → Webhooks → Add endpoint, renseigner
// l'URL de cette fonction et sélectionner les 2 événements ci-dessus.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const TOLERANCE_SEC = 300;   // 5 min : rejette un événement rejoué trop tard (anti-replay)

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

// ---------- Vérification manuelle de la signature Stripe (Web Crypto) ----------
async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function egaliteConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function verifierSignatureStripe(payload: string, header: string, secret: string):
  Promise<{ ok: boolean; reason?: string }> {
  const t = header.match(/(?:^|,)t=([^,]+)/)?.[1];
  const v1s = [...header.matchAll(/(?:^|,)v1=([^,]+)/g)].map((m) => m[1]);
  if (!t || !v1s.length) return { ok: false, reason: "en-tête Stripe-Signature invalide" };
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(t));
  if (age > TOLERANCE_SEC) return { ok: false, reason: "horodatage hors tolérance (rejeu ?)" };
  const attendu = await hmacHex(secret, `${t}.${payload}`);
  const valide = v1s.some((v1) => egaliteConstante(v1, attendu));
  return valide ? { ok: true } : { ok: false, reason: "signature invalide" };
}

// ---------- Traitement d'un événement Stripe déjà vérifié ----------
async function donneesDon(event: any): Promise<
  | { insere: false }
  | { insere: true; email: string | null; amount_cents: number; currency: string; kind: string;
      stripe_customer_id: string | null; stripe_subscription_id: string | null }
> {
  const obj = event?.data?.object ?? {};
  if (event.type === "checkout.session.completed") {
    if (obj.payment_status && obj.payment_status !== "paid") return { insere: false }; // pas encore payé
    return {
      insere: true,
      email: obj.customer_details?.email ?? obj.customer_email ?? null,
      amount_cents: Number(obj.amount_total ?? 0),
      currency: String(obj.currency ?? "eur"),
      kind: obj.mode === "subscription" ? "subscription" : "one_time",
      stripe_customer_id: obj.customer ?? null,
      stripe_subscription_id: obj.subscription ?? null,
    };
  }
  if (event.type === "invoice.paid") {
    // Un paiement récurrent (renouvellement) : on ignore la toute première
    // facture d'un abonnement si elle a déjà été comptée via checkout.session.completed
    // (billing_reason "subscription_create" coïncide avec le paiement initial).
    if (obj.billing_reason === "subscription_create") return { insere: false };
    return {
      insere: true,
      email: obj.customer_email ?? null,
      amount_cents: Number(obj.amount_paid ?? 0),
      currency: String(obj.currency ?? "eur"),
      kind: "subscription",
      stripe_customer_id: obj.customer ?? null,
      stripe_subscription_id: obj.subscription ?? null,
    };
  }
  return { insere: false };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!SERVICE_ROLE || !SUPABASE_URL) return json({ error: "Service non configuré (clé service_role manquante)" }, 500);
  if (!WEBHOOK_SECRET) return json({ error: "STRIPE_WEBHOOK_SECRET manquant" }, 500);

  // Le corps BRUT (non parsé) est indispensable à la vérification de signature.
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const verif = await verifierSignatureStripe(payload, sig, WEBHOOK_SECRET);
  if (!verif.ok) return json({ error: "Signature refusée : " + verif.reason }, 400);

  let event: any;
  try { event = JSON.parse(payload); } catch { return json({ error: "JSON invalide" }, 400); }
  if (!event?.id || !event?.type) return json({ error: "Événement Stripe invalide" }, 400);

  const infos = await donneesDon(event);
  if (!infos.insere) return json({ ok: true, ignore: true });   // événement non pertinent : accusé de réception

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    // Rattachement indicatif à une famille par e-mail (best-effort ; les
    // Payment Links Stripe ne transmettent aucun identifiant de famille).
    // Passe par une RPC dédiée (réservée au rôle service_role) plutôt que par
    // une jointure PostgREST directe vers auth.users (schéma non exposé).
    let familyId: string | null = null;
    if (infos.email) {
      const { data: fid } = await admin.rpc("internal_family_id_by_email", { p_email: infos.email });
      familyId = (fid as string) ?? null;
    }
    const { error } = await admin.from("donations").insert({
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      family_id: familyId,
      email: infos.email,
      amount_cents: infos.amount_cents,
      currency: infos.currency,
      kind: infos.kind,
      stripe_customer_id: infos.stripe_customer_id,
      stripe_subscription_id: infos.stripe_subscription_id,
    });
    // Doublon (retry Stripe du même événement) : ce n'est PAS une erreur.
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      return json({ error: error.message }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
