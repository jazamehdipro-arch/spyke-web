"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  charger, etatCourant, sAbonner, appelEnCours, problemeCourant, reposer, DOCK,
  type Etat, type Appel,
} from "@/lib/prospection/telephone";

/* Le choix du commercial, retenu d'une session à l'autre : celui qui travaille
   au téléphone veut le clavier ouvert, celui qui relance par e-mail veut la
   place. Leur reposer la question chaque matin serait une corvée. */
const CLE_FERME = "spk-tel-ferme";

/**
 * Le téléphone, encastré dans la colonne de droite.
 *
 * Le clavier de l'opérateur vient se loger dans le cadre que Spyke lui dessine.
 * Il garde son en-tête à nous — un point d'état, un nom, une durée — et l'outil
 * de l'opérateur remplit le reste. Vu de la place du commercial, c'est un seul
 * outil : il n'a ni à savoir qui fournit la ligne, ni à jongler entre deux
 * fenêtres.
 *
 * Il peut être refermé, mais pas masqué : le cacher en CSS a été essayé de
 * quatre façons — display:none, le hide() du composant, la sortie d'écran, la
 * transparence — et chacune empêche l'appel de partir. Refermer démonte donc
 * franchement l'emplacement, et rouvrir redemande au composant de se dessiner.
 * La session de l'opérateur tient à ses propres cookies : on ne retape pas son
 * mot de passe à chaque fois.
 *
 * Pendant un appel, le bouton disparaît. Démonter l'emplacement couperait la
 * ligne, et aucune place gagnée à l'écran ne vaut un appel coupé au milieu
 * d'une phrase.
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
  /* Lu au premier rendu plutôt que dans un effet : l'état de départ se connaît
     sans attendre, et rien ne clignote. Le rendu du serveur n'en dépend pas,
     le composant ne s'affiche qu'une fois « surOrdi » posé. */
  const [ferme, setFerme] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(CLE_FERME) === "1";
    } catch {
      // Navigation privée, réglages restrictifs : on ouvre, c'est le défaut.
      return false;
    }
  });

  useEffect(() => {
    // Sur mobile, le lien « tel: » appelle déjà : embarquer une application
    // entière consommerait la 4G d'un commercial en voiture pour rien.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setSurOrdi(true);
    if (!ferme) void charger();
    // Au démarrage seulement : rouvrir plus tard passe par basculer().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function basculer(versFerme: boolean) {
    setFerme(versFerme);
    try {
      window.localStorage.setItem(CLE_FERME, versFerme ? "1" : "0");
    } catch {
      // Le choix ne survivra pas à la session, ce n'est pas une raison de
      // refuser le geste.
    }
    if (versFerme) return;
    // Rouvrir : charger le composant s'il ne l'était pas, puis lui redemander
    // de se dessiner une fois l'emplacement de retour dans la page.
    void charger().then(() => window.setTimeout(reposer, 0));
  }

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

  if (ferme) {
    return (
      <aside className="dock replie" aria-label="Téléphone">
        <button className="rouvrir" onClick={() => basculer(false)}>
          <span className="pt" aria-hidden="true" />
          Ouvrir le clavier
        </button>
      </aside>
    );
  }

  const e = ETATS[etat];

  return (
    <aside className="dock" aria-label="Téléphone">
      <div className={"tel" + (appel ? " live" : "")}>
        <header>
          <i className={"pt " + (appel ? "vert" : e.ton)} />
          <span className="t">{appel ? "Appel en cours" : e.texte}</span>
          {appel && <b className="chrono">{duree(appel.depuis)}</b>}
          {/* Pendant un appel, pas de bouton : fermer couperait la ligne. */}
          {!appel && (
            <button className="fermer" onClick={() => basculer(true)}
              title="Fermer le clavier" aria-label="Fermer le clavier">
              ×
            </button>
          )}
        </header>

        {probleme && !appel && <p className="alerte">{probleme}</p>}

        {/* Un commercial qui arrive voit un écran de connexion qu'il n'a pas
            demandé, juste après s'être connecté à Spyke. Sans un mot, il croit
            qu'on lui redemande son mot de passe Spyke, il le tape, ça ne marche
            pas, et il appelle son responsable. Autant le dire. */}
        {etat === "a-connecter" && !appel && (
          <p className="mode-emploi">
            Ce n&apos;est pas ton mot de passe Spyke. Connecte-toi ci-dessous avec le
            <b> compte Ringover que ton responsable t&apos;a donné</b> — une seule fois,
            ça reste connecté ensuite.
          </p>
        )}

        {/* Le composant de l'opérateur vient se loger ici. Cet élément ne doit
            jamais être démonté ni caché : l'appel s'arrêterait avec lui. */}
        <div id={DOCK} className="frame" />

        <footer>
          {appel
            ? "Raccroche depuis le clavier ci-dessus."
            : etat === "a-connecter"
              ? "Une fois connecté, un clic sur le numéro d'une fiche suffit."
              : "Clique sur le numéro d'une fiche : l'appel part d'ici."}
        </footer>
      </div>
    </aside>
  );
}
