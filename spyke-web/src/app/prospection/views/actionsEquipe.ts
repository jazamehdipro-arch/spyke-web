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
type Verdict = { id: string } | { refus: string };

async function exigerAdmin(jeton: string): Promise<Verdict> {
  if (!jeton) return { refus: "Ta session a expiré. Reconnecte-toi." };

  // Deux étapes distinctes, et les deux comptent.
  //
  // D'abord la signature du jeton, contrôlée par Supabase : c'est elle qui
  // interdit de se déclarer responsable en trafiquant une requête.
  const { data: { user } } = await createClient(PROSPECTION_URL, PROSPECTION_KEY)
    .auth.getUser(jeton);
  if (!user) return { refus: "Ta session a expiré. Reconnecte-toi." };

  // Puis le rôle, relu en base — mais en présentant le jeton. Sans lui, la
  // requête part en anonyme ; comme toutes les policies de profiles sont
  // réservées aux personnes connectées, elle ne renvoie aucune ligne et le
  // responsable se voyait répondre « réservé au responsable ».
  const { data } = await createClient(PROSPECTION_URL, PROSPECTION_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jeton}` } },
  })
    .from("profiles")
    .select("id, role, actif")
    .eq("id", user.id)
    .maybeSingle();

  const p = data as Pick<Profile, "id" | "role" | "actif"> | null;
  if (!p) return { refus: "Ton profil n'a pas pu être relu. Reconnecte-toi." };
  if (!p.actif) return { refus: "Ton accès a été désactivé." };
  if (p.role !== "admin") return { refus: "Réservé au responsable." };
  return { id: p.id };
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
  if ("refus" in admin) return { ok: false, erreur: admin.refus };

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
        "Création de comptes indisponible : la variable " +
        "PROSPECTION_SUPABASE_SERVICE_ROLE_KEY manque sur le projet Vercel " +
        "spyke-web (celui qui sert spykeapp.fr). Ajoute-la, puis redéploie.",
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
  if ("refus" in admin) return { ok: false, erreur: admin.refus };
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
