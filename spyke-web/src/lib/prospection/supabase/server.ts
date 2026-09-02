import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { PROSPECTION_KEY, PROSPECTION_URL } from "../config";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(PROSPECTION_URL, PROSPECTION_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un composant serveur : rien à réécrire ici.
        }
      },
    },
  });
}
