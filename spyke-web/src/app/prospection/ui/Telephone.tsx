"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  charger, etatCourant, sAbonner, appelEnCours, problemeCourant,
  type Etat, type Appel,
} from "@/lib/prospection/telephone";

/**
 * L'état du téléphone, aux couleurs de Spyke.
 *
 * Le clavier de l'opérateur reste affiché dans un coin de l'écran. Le cacher a
 * été essayé de quatre façons, et aucune ne laisse l'appel partir : il accepte
 * l'ordre, dit oui, et ne compose rien. Plutôt qu'un cinquième essai, on garde
 * ce qui marche.
 *
 * Il n'y a donc plus de bouton « Raccrocher » ici : l'appel se voit et se coupe
 * là où il se passe, dans le clavier. Un bouton en double, dans un autre écran,
 * ne ferait qu'ajouter une façon de se tromper.
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
  const probleme = useSyncExternalStore(sAbonner, problemeCourant, () => "");

  // Le compteur ne tourne que pendant un appel : rien ne s'anime dans le vide.
  const [, tic] = useState(0);
  useEffect(() => {
    if (!appel) return;
    const t = window.setInterval(() => tic((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [appel]);

  if (appel) {
    return (
      <div className="encours">
        <i />
        <b>{duree(appel.depuis)}</b>
        <span>{appel.confirme ? "Appel en cours" : "Connexion…"}</span>
        <em style={{ flex: 1 }}>Raccroche depuis le clavier Ringover.</em>
      </div>
    );
  }

  if (probleme) {
    return (
      <div className="encours">
        <i style={{ background: "var(--hot-lite)", animation: "none" }} />
        <span>Échec</span>
        <em style={{ flex: 1 }}>{probleme}</em>
      </div>
    );
  }

  const libelle = LIBELLES[etat];
  if (!libelle) return null;

  return (
    <div className="sync" style={{ padding: "0 0 12px" }}>
      <i style={{ background: etat === "pret" ? "var(--won-lite)" : "var(--yellow)" }} />
      <span>{libelle}</span>
    </div>
  );
}
