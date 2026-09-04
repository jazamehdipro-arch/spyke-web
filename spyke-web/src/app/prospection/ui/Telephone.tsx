"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  charger, etatCourant, sAbonner, afficher, masquer, estVisible, appelEnCours,
  raccrocher, problemeCourant, type Etat, type Appel,
} from "@/lib/prospection/telephone";
import { jetonCourant } from "@/lib/prospection/auth";

/**
 * L'état du téléphone, aux couleurs de Spyke.
 *
 * L'interface de l'opérateur reste masquée : le commercial travaille dans
 * Spyke, il clique sur un numéro, ça appelle. Il n'a pas à apprendre un second
 * outil ni à savoir qui fournit la ligne.
 *
 * Le bouton « Raccrocher » coupe l'appel sans jamais montrer l'opérateur : le
 * composant ne sait pas le faire, mais l'API serveur si — la demande part donc
 * du serveur, seul endroit où la clé API a le droit d'exister.
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

  const [coupe, setCoupe] = useState(false);
  // Si le raccrochage échoue — clé absente, opérateur qui refuse — on ne laisse
  // pas la personne sans issue : le clavier réapparaît, avec la raison en
  // infobulle.
  const [echec, setEchec] = useState("");

  // Le compteur ne tourne que pendant un appel : rien ne s'anime dans le vide.
  const [, tic] = useState(0);
  /* Le raccrochage passe par le serveur : la clé de l'opérateur n'a pas à
     descendre dans le navigateur. En cas d'échec, la raison s'affiche en clair
     — un bouton qui ne fait rien sans rien dire est pire que pas de bouton. */
  const couper = async () => {
    setCoupe(true);
    const r = await raccrocher((await jetonCourant()) ?? "");
    setCoupe(false);
    setEchec(r.ok ? "" : r.erreur ?? "Raccrochage impossible.");
  };

  useEffect(() => {
    if (!appel) { setEchec(""); return; }
    const t = window.setInterval(() => tic((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [appel]);

  if (appel) {
    return (
      <div className="encours">
        <i />
        <b>{duree(appel.depuis)}</b>
        <span>{appel.confirme ? "Appel en cours" : "Connexion…"}</span>
        <button disabled={coupe} onClick={couper}>
          {coupe ? "…" : "Raccrocher"}
        </button>
        {echec && <em>{echec}</em>}
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
