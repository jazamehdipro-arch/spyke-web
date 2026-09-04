"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  charger, etatCourant, sAbonner, afficher, masquer, estVisible, appelEnCours,
  raccrocher, type Etat, type Appel,
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

  const [coupe, setCoupe] = useState(false);
  // Si le raccrochage échoue — clé absente, opérateur qui refuse — on ne laisse
  // pas la personne sans issue : le clavier réapparaît, avec la raison en
  // infobulle.
  const [echec, setEchec] = useState("");

  // Le compteur ne tourne que pendant un appel : rien ne s'anime dans le vide.
  const [, tic] = useState(0);
  useEffect(() => {
    if (!appel) { setEchec(""); return; }
    const t = window.setInterval(() => tic((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [appel]);

  if (appel) {
    return (
      <div className="sync" style={{ paddingBottom: 12 }}>
        <i style={{ background: "var(--won-lite)" }} />
        <span>Appel en cours · {duree(appel.depuis)}</span>
        <button
          disabled={coupe}
          onClick={async () => {
            setCoupe(true);
            const r = await raccrocher((await jetonCourant()) ?? "");
            setCoupe(false);
            if (!r.ok) setEchec(r.erreur ?? "Raccrochage impossible.");
          }}
          style={{
            marginLeft: 12, fontSize: 10, fontWeight: 700, letterSpacing: ".1em",
            textTransform: "uppercase", color: "#fff", background: "var(--hot-lite)",
            padding: "3px 10px", borderRadius: 999,
          }}
        >
          {coupe ? "…" : "Raccrocher"}
        </button>
        {echec && (
          <button
            onClick={() => (estVisible() ? masquer() : afficher())}
            style={{ marginLeft: 10, fontSize: 10, color: "var(--yellow)",
                     borderBottom: "1px solid var(--yellow)" }}
            title={echec}
          >
            Clavier
          </button>
        )}
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
