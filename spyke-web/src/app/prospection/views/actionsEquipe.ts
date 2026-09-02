"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/prospection/supabase/server";
import { createAdminClient } from "@/lib/prospection/supabase/admin";
import type { Profile } from "@/lib/prospection/types";

type Resultat = { ok: true; message: string } | { ok: false; erreur: string };

/** Vérifie, avec la session de l'appelant, qu'il est bien responsable. */
async function exigerAdmin(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, actif")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "id" | "role" | "actif">>();

  if (!data || data.role !== "admin" || !data.actif) return null;
  return { id: data.id };
}

/**
 * Crée l'accès d'un commercial. La clé de service est nécessaire pour créer un
 * compte au nom de quelqu'un d'autre ; le marqueur spyke_role va dans
 * app_metadata, que l'intéressé ne peut pas réécrire.
 */
export async function ajouterCommercial(
  _precedent: Resultat | null,
  formData: FormData
): Promise<Resultat> {
  const admin = await exigerAdmin();
  if (!admin) return { ok: false, erreur: "Réservé au responsable." };

  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const mdp = String(formData.get("mdp") ?? "");

  if (!nom || !email || !mdp) {
    return { ok: false, erreur: "Il faut un prénom, un e-mail et un mot de passe." };
  }
  if (mdp.length < 8) {
    return { ok: false, erreur: "Le mot de passe doit faire au moins 8 caractères." };
  }

  let service;
  try {
    service = createAdminClient();
  } catch (e) {
    return { ok: false, erreur: (e as Error).message };
  }

  const { error } = await service.auth.admin.createUser({
    email,
    password: mdp,
    email_confirm: true,
    user_metadata: { nom },
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

  revalidatePath("/equipe");
  return { ok: true, message: `${nom} ajouté. Donne-lui son e-mail et son mot de passe.` };
}

/**
 * Retire quelqu'un de l'équipe : la base coupe l'accès aux données et relâche
 * ses fiches, puis on bloque la connexion elle-même côté Auth. Les deux, parce
 * qu'aucune des deux n'est suffisante seule.
 */
export async function retirerCommercial(
  _precedent: Resultat | null,
  formData: FormData
): Promise<Resultat> {
  const admin = await exigerAdmin();
  if (!admin) return { ok: false, erreur: "Réservé au responsable." };

  const membreId = String(formData.get("membreId") ?? "");
  if (!membreId) return { ok: false, erreur: "Membre introuvable." };
  if (membreId === admin.id) {
    return { ok: false, erreur: "Tu ne peux pas te retirer toi-même." };
  }

  const supabase = await createClient();
  const { data: liberees, error } = await supabase.rpc("retire_member", {
    p_member_id: membreId,
  });
  if (error) return { ok: false, erreur: error.message };

  try {
    const service = createAdminClient();
    await service.auth.admin.updateUserById(membreId, { ban_duration: "876000h" });
  } catch {
    // L'accès aux données est déjà coupé ; on ne bloque pas l'opération si la
    // clé de service manque, mais l'écran le dit.
    revalidatePath("/equipe");
    return {
      ok: true,
      message:
        "Accès aux données coupé, mais la connexion n'a pas pu être bloquée : SUPABASE_SERVICE_ROLE_KEY manquante.",
    };
  }

  revalidatePath("/equipe");
  const n = Number(liberees ?? 0);
  return {
    ok: true,
    message:
      n > 0
        ? `Retiré. ${n} fiche${n > 1 ? "s" : ""} ${n > 1 ? "sont reparties" : "est repartie"} au vivier.`
        : "Retiré. Aucune fiche en cours à relâcher.",
  };
}

export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
