"use client";

import { createClient } from "./supabase/client";
import type { Profile } from "./types";

/**
 * La personne connectée et son rôle, lus depuis le navigateur.
 *
 * Le contrôle d'accès réel n'est pas ici : c'est la Row Level Security de la
 * base qui décide de ce que chacun peut lire et écrire. Cette fonction ne sert
 * qu'à choisir l'écran à afficher.
 */
export async function profilCourant(): Promise<Profile | null> {
  const supabase = createClient();

  // Une session périmée dans le navigateur fait échouer getUser au lieu de
  // renvoyer « personne ». Sans ce filet, la page reste bloquée sur une erreur
  // au lieu de renvoyer vers l'écran de connexion. On efface la session morte
  // et on repart de zéro.
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    user = data.user;
  } catch {
    await supabase.auth.signOut().catch(() => {});
    return null;
  }
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const p = data as Profile | null;
  // Un compte désactivé ne lit plus rien : la RLS le renvoie vide.
  return p && p.actif ? p : null;
}

/** Le jeton de la session, à transmettre aux actions serveur. */
export async function jetonCourant(): Promise<string | null> {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? null;
}
