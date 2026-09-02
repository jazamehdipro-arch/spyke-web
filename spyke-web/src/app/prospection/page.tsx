import { redirect } from "next/navigation";
import { createClient } from "@/lib/prospection/supabase/server";
import { currentProfile } from "@/lib/prospection/auth";
import type { Activity, Creneau, Deal, Lead, Profile } from "@/lib/prospection/types";
import App from "./App";

/**
 * L'outil complet : File, Liste, Agenda, Pipeline, et Réglages pour le
 * responsable. Le contrôle d'accès se fait ici, dans le composant serveur :
 * pas de middleware, qui s'appliquerait à tout le site.
 */
export default async function Prospection() {
  const moi = await currentProfile();
  if (!moi) redirect("/prospection/connexion");

  const supabase = await createClient();
  const [leads, activities, deals, creneaux, equipe] = await Promise.all([
    supabase.from("leads").select("*").order("nom").returns<Lead[]>(),
    supabase.from("activities").select("*").order("date", { ascending: false }).limit(3000).returns<Activity[]>(),
    supabase.from("deals").select("*").returns<Deal[]>(),
    supabase.from("availability").select("*").order("weekday").order("heure").returns<Creneau[]>(),
    moi.role === "admin"
      ? supabase.from("profiles").select("*").order("created_at").returns<Profile[]>()
      : Promise.resolve({ data: [] as Profile[] }),
  ]);

  return (
    <App
      moi={moi}
      initial={{
        leads: leads.data ?? [],
        activities: activities.data ?? [],
        deals: deals.data ?? [],
        creneaux: creneaux.data ?? [],
        equipe: equipe.data ?? [],
      }}
    />
  );
}
