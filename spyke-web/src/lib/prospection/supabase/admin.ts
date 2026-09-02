import { createClient } from "@supabase/supabase-js";
import { PROSPECTION_URL } from "../config";

/**
 * Contourne la RLS. Ne sert qu'à créer l'accès d'un commercial et à le lui
 * couper — deux opérations que seul le responsable déclenche, et dont le droit
 * est vérifié avant, avec la session de l'appelant.
 *
 * Sans cette clé l'outil fonctionne : seule la création de comptes est
 * indisponible, et l'écran le dit au lieu d'échouer en silence.
 */
export function createAdminClient() {
  const key = process.env.PROSPECTION_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "PROSPECTION_SUPABASE_SERVICE_ROLE_KEY manquante : la création de comptes est indisponible."
    );
  }
  return createClient(PROSPECTION_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
