"use client";

import { createClient } from "./supabase/client";
import type { Activity, Creneau, Deal, Lead, Profile } from "./types";

const sb = () => createClient();

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

export async function majLead(id: string, patch: Partial<Lead>) {
  const { data, error } = await sb()
    .from("leads").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Lead;
}

/* -------------------------------------------------------------- historique */

/**
 * L'identifiant est fabriqué ici, avant l'envoi : si le réseau tombe et que la
 * requête est rejouée, la même action n'est pas écrite deux fois.
 */
export async function noter(leadId: string, label: string, authorId: string) {
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
