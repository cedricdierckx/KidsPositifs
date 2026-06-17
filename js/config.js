/* =====================================================================
 * FamiTeam — Configuration Supabase
 * ---------------------------------------------------------------------
 * Renseignez ici l'URL et la clé "anon" (publique) de votre projet
 * Supabase. Ces deux valeurs sont publiques par conception : la sécurité
 * est assurée côté base par les règles RLS (voir supabase/schema.sql).
 *
 * Où les trouver : dashboard Supabase → Project Settings → API
 *   - Project URL          -> SUPABASE_URL
 *   - Project API keys: anon public -> SUPABASE_ANON_KEY
 * ===================================================================== */
window.KP_CONFIG = {
  SUPABASE_URL: "https://ztraacsqtwslvcjfpdtp.supabase.co",       // ex. "https://abcdefgh.supabase.co"
  SUPABASE_ANON_KEY: "sb_publishable_l1y_BldUMtdiQWRTmMzSUw_XAyYmQGW",   // ex. "eyJhbGciOi..."

  // Lien de don (facultatif). Remplace par ton lien (PayPal, Ko-fi, Buy Me a
  // Coffee, Stripe Payment Link…). Laisse vide ("") pour masquer le bouton.
  DON_URL: "https://www.paypal.com/donate?business=cedric.dierckx@gmail.com",

  // Synchro temps réel entre appareils.
  //   true  (défaut) : mise à jour instantanée via une connexion persistante.
  //   false          : REPLI — pas de connexion persistante ; l'app se
  //                    rafraîchit au retour sur l'onglet + toutes les 30 s.
  // Passe à false si tu approches des limites de connexions Realtime de ton
  // plan Supabase (des milliers d'appareils connectés EN MÊME TEMPS).
  REALTIME: true
};
