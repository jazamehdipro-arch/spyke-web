"use client";

import { useEffect } from "react";

/**
 * Installe le service worker de l'outil, et lui seul.
 *
 * La portée est passée explicitement : sans elle, le navigateur la déduirait du
 * chemin du fichier — ce qui donnerait le même résultat ici, mais l'écrire
 * rend l'intention vérifiable. L'outil ne doit jamais piloter les pages devis
 * et factures du site.
 *
 * L'échec est silencieux et sans conséquence : navigation privée, réglages
 * restrictifs, contexte non sécurisé. L'application marche alors comme avant,
 * simplement sans ouverture hors ligne.
 */
export default function EnregistrerSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const poser = () =>
      navigator.serviceWorker
        .register("/prospection/sw.js", { scope: "/prospection/" })
        .catch(() => {});
    // Après le chargement : l'installation ne doit pas concurrencer le premier
    // affichage, qui est ce que la personne attend.
    if (document.readyState === "complete") poser();
    else {
      window.addEventListener("load", poser, { once: true });
      return () => window.removeEventListener("load", poser);
    }
  }, []);

  return null;
}
