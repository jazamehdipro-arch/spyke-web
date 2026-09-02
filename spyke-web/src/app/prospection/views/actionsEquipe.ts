"use server";

import { createClient } from "@supabase/supabase-js";
import { PROSPECTION_URL, PROSPECTION_KEY } from "@/lib/prospection/supabase/config";
import type { Profile } from "@/lib/prospection/types";

type Resultat = { ok: true; message: string } | { ok: false; erreur: string };

/**
 * Créer ou couper l'accès d'un commercial demande la clé de service, qui
 * contourne la RLS et ne doit jamais quitter le serveur. Ces deux opérations
 * vivent donc ici.
 *
 * La session étant conservée dans le navigateur, l'appelant transmet son jeton.
 * On ne le croit pas sur parole : le jeton est vérifié auprès de Supabase, qui
 * en contrôle la signature, puis le rôle est relu en base.
 */
async function exigerAdmin(jeton: string): Promise<{ id: string } | null> {
  if (!jeton) return null;
  const anon = createClient(PROSPECTION_URL, PROSPECTION_KEY);
  const { data: { user } } = await anon.auth.getUser(jeton);
  if (!user) return null;

  const { data } = await anon
    .from("profiles")
    .select("id, role, actif")
    .eq("id", user.id)
    .maybeSingle();

  const p = data as Pick<Profile, "id" | "role" | "actif"> | null;
  return p && p.role === "admin" && p.actif ? { id: p.id } : null;
}

function service() {
  const key = process.env.PROSPECTION_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(PROSPECTION_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Une action serveur qui lève une exception n'affiche rien d'utile : Next
 * masque le message en production et ne laisse qu'un code. Comme ces deux
 * actions sont déclenchées depuis un téléphone, sans console, on convertit
 * toute panne en texte affichable plutôt que de la laisser remonter.
 */
async function sansCasser(travail: () => Promise<Resultat>): Promise<Resultat> {
  try {
    return await travail();
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    return { ok: false, erreur: "Échec côté serveur : " + m };
  }
}

export async function ajouterCommercial(
  jeton: string,
  nom: string,
  email: string,
  mdp: string
): Promise<Resultat> {
  return sansCasser(async () => {
  const admin = await exigerAdmin(jeton);
  if (!admin) return { ok: false, erreur: "Réservé au responsable." };

  if (!nom.trim() || !email.trim() || !mdp) {
    return { ok: false, erreur: "Il faut un prénom, un e-mail et un mot de passe." };
  }
  if (mdp.length < 8) {
    return { ok: false, erreur: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const sb = service();
  if (!sb) {
    return {
      ok: false,
      erreur:
        "La création de comptes est indisponible : la clé de service Supabase n'est pas encore renseignée sur le site.",
    };
  }

  const { error } = await sb.auth.admin.createUser({
    email: email.trim(),
    password: mdp,
    email_confirm: true,
    user_metadata: { nom: nom.trim() },
    app_metadata: { spyke_role: "commercial" },
  });

  if (error) {
    return {
      ok: false,
      erreur: error.message.includes("already")
        ? "Cet e-mail a déjà un accès."
        : error.message,
    };
  }
  return { ok: true, message: `${nom.trim()} ajouté. Donne-lui son e-mail et son mot de passe.` };
  });
}

export async function retirerCommercial(jeton: string, membreId: string): Promise<Resultat> {
  return sansCasser(async () => {
  const admin = await exigerAdmin(jeton);
  if (!admin) return { ok: false, erreur: "Réservé au responsable." };
  if (membreId === admin.id) {
    return { ok: false, erreur: "Tu ne peux pas te retirer toi-même." };
  }

  // La base coupe l'accès aux données et relâche ses fiches. Le contrôle du
  // rôle est refait côté base par retire_member().
  const avecJeton = createClient(PROSPECTION_URL, PROSPECTION_KEY, {
    global: { headers: { Authorization: `Bearer ${jeton}` } },
  });
  const { data: liberees, error } = await avecJeton.rpc("retire_member", {
    p_member_id: membreId,
  });
  if (error) return { ok: false, erreur: error.message };

  const n = Number(liberees ?? 0);
  const fiches =
    n > 0
      ? ` ${n} fiche${n > 1 ? "s" : ""} ${n > 1 ? "sont reparties" : "est repartie"} au vivier.`
      : " Aucune fiche en cours à relâcher.";

  // Puis on bloque la connexion elle-même. L'une sans l'autre laisserait une
  // porte ouverte.
  const sb = service();
  if (!sb) {
    return {
      ok: true,
      message:
        "Accès aux données coupé." + fiches +
        " La connexion n'a pas pu être bloquée : clé de service absente.",
    };
  }
  await sb.auth.admin.updateUserById(membreId, { ban_duration: "876000h" });
  return { ok: true, message: "Retiré." + fiches };
  });
}
