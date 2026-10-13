"use client";

import { useEffect } from "react";

/** Le panneau qui monte du bas, repris du prototype (.scrim / .sheet). */
export default function Sheet({
  ouvert,
  onClose,
  children,
}: {
  ouvert: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!ouvert) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [ouvert, onClose]);

  /**
   * La hauteur du clavier, mesurée et rendue au CSS.
   *
   * Le panneau est en position fixe et se cale sur le bas de la fenêtre. Or le
   * clavier d'un téléphone ne réduit pas cette fenêtre-là : il se pose devant.
   * Le bas du panneau — le bouton Envoyer, les dernières lignes écrites — se
   * retrouve donc caché derrière le clavier, et rien ne permet d'y accéder
   * puisqu'on est déjà en bas du défilement.
   *
   * visualViewport, lui, mesure ce qu'on voit vraiment. On en déduit la place
   * prise par le clavier, le panneau remonte d'autant, et ce qu'on écrit reste
   * visible pendant qu'on l'écrit.
   */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const racine = document.documentElement;
    const mesurer = () => {
      const cache = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // Sous une dizaine de pixels, c'est la barre d'adresse qui bouge, pas un
      // clavier : y réagir ferait trembler le panneau au moindre défilement.
      racine.style.setProperty("--clavier", (cache > 24 ? cache : 0) + "px");
    };
    mesurer();
    vv.addEventListener("resize", mesurer);
    vv.addEventListener("scroll", mesurer);
    return () => {
      vv.removeEventListener("resize", mesurer);
      vv.removeEventListener("scroll", mesurer);
      racine.style.setProperty("--clavier", "0px");
    };
  }, []);

  return (
    <>
      <div className={"scrim" + (ouvert ? " on" : "")} onClick={onClose} />
      <div className={"sheet" + (ouvert ? " on" : "")}>
        <div className="grab" />
        <div className="sheet-in">{ouvert ? children : null}</div>
      </div>
    </>
  );
}
