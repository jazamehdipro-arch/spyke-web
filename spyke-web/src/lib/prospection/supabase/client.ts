"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { PROSPECTION_URL, PROSPECTION_KEY } from "./config";

/**
 * Base Supabase de l'outil de prospection — distincte de celle du site.
 *
 * L'URL et la clé publique ne sont pas des secrets : Next les livre au
 * navigateur de toute façon. Ce qui protège les données, c'est la Row Level
 * Security de la base, couverte par 66 tests.
 *
 * On s'en tient à @supabase/supabase-js, déjà présent. La variante « ssr »
 * exigerait une version plus récente de cette bibliothèque, et la mettre à jour
 * changerait celle dont dépendent les devis, les factures et la connexion du
 * site : hors de question pour ajouter un outil à côté.
 *
 * La session vit donc dans le navigateur, sous une clé de stockage propre à ce
 * projet — elle ne croise jamais celle du site.
 */
export { PROSPECTION_URL, PROSPECTION_KEY } from "./config";

let client: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!client) {
    client = createSupabaseClient(PROSPECTION_URL, PROSPECTION_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "spyke-prospection-auth",
      },
    });
  }
  return client;
}
