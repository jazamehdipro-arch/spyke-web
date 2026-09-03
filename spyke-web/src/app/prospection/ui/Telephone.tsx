"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  charger, etatCourant, sAbonner, afficher, type Etat,
} from "@/lib/prospection/telephone";

/**
 * Charge le composant d'appel et affiche son état dans le bandeau.
 *
 * Sur téléphone, on ne le charge pas : le mobile sait déjà appeler avec le lien
 * « tel: », et embarquer une webapp entière dans une page consulterait
 * inutilement la 4G d'un commercial en voiture.
 */
const LIBELLES: Record<Etat, string | null> = {
  absent: null,
  chargement: null,
  "a-connecter": "Connecte-toi à Ringover pour appeler d'ici",
  pret: "Appels depuis l'ordinateur",
  indisponible: null,
};

export function useEtatTelephone(): Etat {
  return useSyncExternalStore(sAbonner, etatCourant, () => "absent" as Etat);
}

export default function Telephone() {
  useEffect(() => {
    const surMobile = window.matchMedia("(pointer: coarse)").matches;
    if (surMobile) return;
    void charger();
  }, []);

  const etat = useEtatTelephone();
  const libelle = LIBELLES[etat];
  if (!libelle) return null;

  return (
    <button
      className="sync"
      style={{ border: 0, background: "none", padding: "0 0 12px" }}
      onClick={afficher}
    >
      <i style={{ background: etat === "pret" ? "var(--won-lite)" : "var(--yellow)" }} />
      <span>{libelle}</span>
    </button>
  );
}
