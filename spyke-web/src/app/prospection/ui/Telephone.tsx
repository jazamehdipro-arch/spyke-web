"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  charger, etatCourant, sAbonner, afficher, masquer, estVisible, appelEnCours,
  type Etat, type Appel,
} from "@/lib/prospection/telephone";

/**
 * L'état du téléphone, aux couleurs de Spyke.
 *
 * L'interface de l'opérateur reste masquée : le commercial travaille dans
 * Spyke, il clique sur un numéro, ça appelle. Il n'a pas à apprendre un second
 * outil ni à savoir qui fournit la ligne.
 *
 * Un bouton rouvre tout de même le clavier pendant un appel : le composant de
 * l'opérateur n'expose pas de fonction « raccrocher », et il faut donc pouvoir
 * atteindre son bouton rouge pour couper court.
 *
 * Sur téléphone, rien de tout ceci : le mobile appelle déjà avec le lien
 * « tel: », et embarquer une application entière consommerait la 4G d'un
 * commercial en voiture pour rien.
 */
const LIBELLES: Record<Etat, string | null> = {
  absent: null,
  chargement: null,
  "a-connecter": "Connecte-toi à Ringover pour appeler d'ici",
  pret: "Appels depuis l'ordinateur",
  indisponible: null,
};

function duree(depuis: number): string {
  const s = Math.max(0, Math.floor((Date.now() - depuis) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Telephone() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    void charger();
  }, []);

  const etat = useSyncExternalStore(sAbonner, etatCourant, () => "absent" as Etat);
  const appel = useSyncExternalStore(sAbonner, appelEnCours, () => null as Appel);

  // Le compteur ne tourne que pendant un appel : rien ne s'anime dans le vide.
  const [, tic] = useState(0);
  useEffect(() => {
    if (!appel) return;
    const t = window.setInterval(() => tic((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [appel]);

  if (appel) {
    return (
      <div className="sync" style={{ paddingBottom: 12 }}>
        <i style={{ background: "var(--won-lite)" }} />
        <span>Appel en cours · {duree(appel.depuis)}</span>
        <button
          onClick={() => (estVisible() ? masquer() : afficher())}
          style={{
            marginLeft: 10, fontSize: 10, letterSpacing: ".08em",
            color: "var(--yellow)", borderBottom: "1px solid var(--yellow)",
          }}
        >
          Clavier
        </button>
      </div>
    );
  }

  const libelle = LIBELLES[etat];
  if (!libelle) return null;

  return (
    <button
      className="sync"
      style={{ border: 0, background: "none", padding: "0 0 12px" }}
      onClick={() => (estVisible() ? masquer() : afficher())}
    >
      <i style={{ background: etat === "pret" ? "var(--won-lite)" : "var(--yellow)" }} />
      <span>{libelle}</span>
    </button>
  );
}
