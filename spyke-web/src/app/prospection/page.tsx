"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as q from "@/lib/prospection/queries";
import { profilCourant } from "@/lib/prospection/auth";
import type { Profile } from "@/lib/prospection/types";
import App, { type Donnees } from "./App";

/**
 * Le chargement se fait depuis le navigateur : la session vit là, pas dans un
 * cookie lisible par le serveur. Ce qui protège les données reste la RLS de la
 * base, quel que soit le chemin emprunté.
 */
export default function Prospection() {
  const router = useRouter();
  const [moi, setMoi] = useState<Profile | null>(null);
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    const profil = await profilCourant();
    if (!profil) {
      router.replace("/prospection/connexion");
      return;
    }
    const [leads, activities, deals, creneaux, equipe] = await Promise.all([
      q.chargerLeads(),
      q.toutHistorique(),
      q.affaires(),
      q.creneaux(),
      profil.role === "admin" ? q.equipe() : Promise.resolve([] as Profile[]),
    ]);
    setMoi(profil);
    setDonnees({ leads, activities, deals, creneaux, equipe });
  }, [router]);

  useEffect(() => {
    charger().catch((e) =>
      setErreur((e as { message?: string }).message ?? "Chargement impossible.")
    );
  }, [charger]);

  if (erreur) {
    return (
      <div className="wrap">
        <div className="empty">
          <b>Chargement impossible</b>
          <p>{erreur}</p>
        </div>
      </div>
    );
  }

  if (!moi || !donnees) {
    return (
      <div className="wrap">
        <div className="empty">
          <b>Chargement…</b>
          <p>Récupération des fiches et de l&apos;agenda.</p>
        </div>
      </div>
    );
  }

  return <App moi={moi} initial={donnees} />;
}
