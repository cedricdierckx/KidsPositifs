// =====================================================================
// FamiTeam — Edge Function : suppression du COMPTE D'AUTHENTIFICATION
// ---------------------------------------------------------------------
// Supprime définitivement l'utilisateur connecté (auth.users). Grâce aux
// « on delete cascade » du schéma, cela supprime aussi les familles dont
// il est propriétaire et TOUTES leurs données (membres, état, historique,
// invitations, parrainages).
//
// Aucun secret à ajouter : SUPABASE_URL, SUPABASE_ANON_KEY et
// SUPABASE_SERVICE_ROLE_KEY sont fournis AUTOMATIQUEMENT par Supabase à
// chaque edge function (impossible — et inutile — de les créer à la main).
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

  // --- Authentification : on identifie l'appelant via son jeton ---
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Non authentifié" }, 401);
  if (!SERVICE_ROLE) return json({ error: "Service non configuré (clé service_role manquante)" }, 500);

  let userId = "";
  try {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: SUPABASE_ANON_KEY },
    });
    if (!u.ok) return json({ error: "Session invalide" }, 401);
    const data = await u.json();
    userId = data?.id ?? "";
  } catch {
    return json({ error: "Vérification impossible" }, 401);
  }
  if (!userId) return json({ error: "Utilisateur introuvable" }, 401);

  try {
    // Client admin (service_role) : seul habilité à supprimer un utilisateur.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return json({ error: error.message }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
