"use client";

import { createClient } from "./supabase/client";
import type { Activity, Creneau, Deal, Lead, Profile } from "./types";
import { enfiler } from "./horsligne";

const sb = () => createClient();

/**
 * Une panne de réseau ne ressemble pas à un refus de la base. Le premier cas se
 * rejoue, le second jamais : réessayer une écriture refusée par la RLS ne fera
 * que la refuser à nouveau, indéfiniment.
 *
 * supabase-js n'expose pas cette distinction ; on la déduit. Une erreur venue
 * de PostgREST porte un `code` (23505, 42501, PGRST116…). Une coupure réseau
 * n'en porte pas : c'est un TypeError « Failed to fetch » du navigateur.
 */
function estPanneReseau(e: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const err = e as { code?: string; message?: string; name?: string };
  if (err?.code) return false;
  const m = (err?.message ?? "").toLowerCase();
  return (
    err?.name === "TypeError" ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("network request failed")
  );
}

/* ------------------------------------------------------------------ fiches */

export async function chargerLeads(): Promise<Lead[]> {
  const { data, error } = await sb().from("leads").select("*").order("nom");
  if (error) throw error;
  return (data ?? []) as Lead[];
}

/**
 * La fiche suivante de la file. C'est le serveur qui décide, et il la réserve :
 * deux commerciaux connectés en même temps ne reçoivent jamais la même.
 *
 * Quand la file est vide, next_lead renvoie une fiche entièrement vide plutôt
 * que rien — l'API expose le type composite colonne par colonne, et un composite
 * nul devient une ligne dont tous les champs sont nuls. Sans ce contrôle, l'écran
 * croit tenir une fiche et casse dès qu'il en lit un champ.
 */
export async function ficheSuivante(secteur: string | null, sautees: string[]) {
  const { data, error } = await sb().rpc("next_lead", {
    p_secteur: secteur,
    p_skip: sautees,
  });
  if (error) throw error;
  const fiche = (Array.isArray(data) ? data[0] : data) as Lead | null;
  return fiche && fiche.id ? fiche : null;
}

/** « Passer cette fiche » : le bail retombe tout de suite. */
export async function relacherFiche(leadId: string) {
  const { error } = await sb().rpc("release_lead", { p_lead_id: leadId });
  if (error) throw error;
}

/**
 * Sans réseau, la modification part en file et la fonction rend la main comme
 * si elle avait réussi : côté commercial, le résultat d'appel est enregistré,
 * point. C'est exactement ce qu'on veut — le contraire, c'est une saisie perdue
 * au bord de la route.
 */
export async function majLead(id: string, patch: Partial<Lead>) {
  try {
    const { data, error } = await sb()
      .from("leads").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as Lead;
  } catch (e) {
    if (!estPanneReseau(e)) throw e;
    await enfiler({ type: "majLead", leadId: id, patch });
    return null;
  }
}

/* -------------------------------------------------------------- historique */

/**
 * L'identifiant est fabriqué ici, avant l'envoi : si le réseau tombe et que la
 * requête est rejouée, la même action n'est pas écrite deux fois.
 */
export async function noter(leadId: string, label: string, authorId: string) {
  try {
    const { data, error } = await sb()
      .from("activities")
      .insert({
        id: crypto.randomUUID(),
        lead_id: leadId,
        author_id: authorId,
        author_nom: "",       // le serveur le remplace par le vrai prénom
        label,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Activity;
  } catch (e) {
    if (!estPanneReseau(e)) throw e;
    await enfiler({ type: "noter", leadId, label, authorId });
    return null;
  }
}

export async function historique(leadId: string): Promise<Activity[]> {
  const { data, error } = await sb()
    .from("activities").select("*").eq("lead_id", leadId)
    .order("date", { ascending: false }).limit(20);
  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function toutHistorique(): Promise<Activity[]> {
  const { data, error } = await sb()
    .from("activities").select("*").order("date", { ascending: false }).limit(3000);
  if (error) throw error;
  return (data ?? []) as Activity[];
}

/* ------------------------------------------------------------------ agenda */

export async function creneaux(): Promise<Creneau[]> {
  const { data, error } = await sb()
    .from("availability").select("*").order("weekday").order("heure");
  if (error) throw error;
  return (data ?? []) as Creneau[];
}

export async function ouvrirCreneau(weekday: number, heure: string) {
  const { error } = await sb().from("availability").insert({ weekday, heure });
  if (error) throw error;
}

export async function fermerCreneau(weekday: number, heure: string) {
  const { error } = await sb()
    .from("availability").delete().eq("weekday", weekday).eq("heure", heure);
  if (error) throw error;
}

export async function viderCreneaux() {
  const { error } = await sb().from("availability").delete().gte("weekday", 0);
  if (error) throw error;
}

/**
 * Les horaires déjà pris, sans les fiches. Un commercial ne voit pas les fiches
 * des autres : sans ceci, un créneau réservé par un collègue lui paraîtrait libre.
 */
export async function creneauxPris(du: Date, au: Date): Promise<string[]> {
  const { data, error } = await sb().rpc("booked_slots", {
    p_from: du.toISOString(),
    p_to: au.toISOString(),
  });
  if (error) throw error;
  return ((data ?? []) as { slot_at: string }[]).map((r) => r.slot_at);
}

/** Caler un RDV. Le perdant d'une course reçoit une erreur explicite. */
export async function calerRdv(leadId: string, slotISO: string | null) {
  const { data, error } = await sb().rpc("book_slot", {
    p_lead_id: leadId,
    p_slot: slotISO,
  });
  if (error) throw error;
  return data as Lead;
}

/* ------------------------------------------------------------------ argent */

export async function affaires(): Promise<Deal[]> {
  const { data, error } = await sb().from("deals").select("*");
  if (error) throw error;
  return (data ?? []) as Deal[];
}

export async function majAffaire(leadId: string, patch: Partial<Deal>) {
  const { error } = await sb()
    .from("deals").upsert({ lead_id: leadId, ...patch }, { onConflict: "lead_id" });
  if (error) throw error;
}

/* ------------------------------------------------------------------ équipe */

export async function equipe(): Promise<Profile[]> {
  const { data, error } = await sb().from("profiles").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/* ------------------------------------------------------------------ import */

export async function importerLeads(lignes: Partial<Lead>[]) {
  // Les doublons de numéro sont refusés par un index unique en base ; on insère
  // ligne par ligne pour qu'un doublon n'annule pas tout le fichier.
  let ajoutes = 0, doublons = 0;
  for (const l of lignes) {
    const { error } = await sb().from("leads").insert(l);
    if (!error) ajoutes++;
    else if (error.code === "23505") doublons++;
    else throw error;
  }
  return { ajoutes, doublons };
}

/* --------------------------------------------------------- rejeu hors ligne */

/**
 * Rejoue la file d'écritures accumulée sans réseau, dans l'ordre.
 *
 * Deux règles :
 *
 * - Une écriture rejouée n'est PAS remise en file en cas d'échec réseau ; on
 *   s'arrête et on réessaiera au prochain retour de connexion. Sinon la file
 *   se dupliquerait à chaque tentative.
 * - Une écriture refusée par la base (RLS, contrainte) est jetée. La rejouer
 *   éternellement bloquerait tout ce qui la suit. C'est le cas d'une fiche
 *   reprise par un collègue pendant la coupure : sa décision fait foi.
 *
 * Les activités portent un identifiant fabriqué avant l'envoi : un rejeu ne
 * peut pas écrire deux fois la même ligne d'historique. La base a un test
 * dédié pour ça.
 */
export async function rejouer(): Promise<{ rejouees: number; abandonnees: number }> {
  const { enAttente, oublier } = await import("./horsligne");
  let rejouees = 0, abandonnees = 0;

  for (const e of await enAttente()) {
    try {
      if (e.type === "majLead") {
        const { error } = await sb().from("leads").update(e.patch).eq("id", e.leadId);
        if (error) throw error;
      } else {
        const { error } = await sb().from("activities").insert({
          id: e.id,
          lead_id: e.leadId,
          author_id: e.authorId,
          author_nom: "",
          label: e.label,
        });
        // 23505 = la ligne est déjà passée lors d'un rejeu précédent.
        if (error && error.code !== "23505") throw error;
      }
      await oublier(e.id);
      rejouees++;
    } catch (err) {
      if (estPanneReseau(err)) break;
      await oublier(e.id);
      abandonnees++;
    }
  }
  return { rejouees, abandonnees };
}

/* ------------------------------------------------------------------- RGPD */

/** Tout ce que la base sait d'une personne, pour répondre à une demande d'accès. */
export async function exporterFiche(leadId: string) {
  const { data, error } = await sb().rpc("export_lead", { p_lead_id: leadId });
  if (error) throw error;
  return data as Record<string, unknown>;
}

/**
 * Efface une fiche à la demande de la personne. La base refuse si l'appelant
 * n'est pas responsable, et garde une empreinte indéchiffrable du numéro pour
 * ne pas le réimporter au fichier suivant.
 */
export async function effacerFiche(leadId: string) {
  const { error } = await sb().rpc("forget_lead", { p_lead_id: leadId });
  if (error) throw error;
}
