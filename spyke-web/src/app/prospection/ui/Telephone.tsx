"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  charger, etatCourant, sAbonner, appelEnCours, problemeCourant, DOCK,
  type Etat, type Appel,
} from "@/lib/prospection/telephone";

/**
 * Le téléphone, encastré dans la colonne de droite.
 *
 * Le clavier de l'opérateur vient se loger dans le cadre que Spyke lui dessine.
 * Il garde son en-tête à nous — un point d'état, un nom, une durée — et l'outil
 * de l'opérateur remplit le reste. Vu de la place du commercial, c'est un seul
 * outil : il n'a ni à savoir qui fournit la ligne, ni à jongler entre deux
 * fenêtres.
 *
 * Il reste affiché en permanence, et c'est un choix assumé : le cacher a été
 * essayé de quatre façons, et chacune empêche l'appel de partir. On garde donc
 * ce qui marche, et on le rend beau plutôt que discret.
 *
 * L'emplacement ne disparaît jamais du DOM. Le démonter couperait la ligne au
 * milieu d'un appel — c'est pour cela qu'il vit dans la coque, pas dans un
 * écran.
 */
const ETATS: Record<Etat, { texte: string; ton: "vert" | "jaune" | "gris" }> = {
  absent: { texte: "Téléphone", ton: "gris" },
  chargement: { texte: "Ouverture du clavier…", ton: "jaune" },
  "a-connecter": { texte: "Connecte-toi pour appeler", ton: "jaune" },
  pret: { texte: "Prêt à appeler", ton: "vert" },
  indisponible: { texte: "Clavier indisponible", ton: "gris" },
};

function duree(depuis: number): string {
  const s = Math.max(0, Math.floor((Date.now() - depuis) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Telephone() {
  const [surOrdi, setSurOrdi] = useState(false);

  useEffect(() => {
    // Sur mobile, le lien « tel: » appelle déjà : embarquer une application
    // entière consommerait la 4G d'un commercial en voiture pour rien.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setSurOrdi(true);
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

  if (!surOrdi) return null;

  const e = ETATS[etat];

  return (
    <aside className="dock" aria-label="Téléphone">
      <div className={"tel" + (appel ? " live" : "")}>
        <header>
          <i className={"pt " + (appel ? "vert" : e.ton)} />
          <span className="t">{appel ? "Appel en cours" : e.texte}</span>
          {appel && <b className="chrono">{duree(appel.depuis)}</b>}
        </header>

        {probleme && !appel && <p className="alerte">{probleme}</p>}

        {/* Le composant de l'opérateur vient se loger ici. Cet élément ne doit
            jamais être démonté ni caché : l'appel s'arrêterait avec lui. */}
        <div id={DOCK} className="frame" />

        <footer>
          {appel
            ? "Raccroche depuis le clavier ci-dessus."
            : "Clique sur le numéro d'une fiche : l'appel part d'ici."}
        </footer>
      </div>
    </aside>
  );
}
