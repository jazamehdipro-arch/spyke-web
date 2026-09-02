import { createClient } from "./supabase/server";
import type { Profile } from "./types";

/** La personne connectée et son rôle, ou null si la session est absente. */
export async function currentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  // Un compte désactivé ne lit plus rien : la RLS le renvoie vide.
  return data && data.actif ? data : null;
}
