"use client";

import { useEffect } from "react";

/**
 * Sans ce garde-fou, la moindre erreur remonte jusqu'à la racine du site et
 * Next affiche « Application error: a client-side exception has occurred »,
 * qui ne dit rien de ce qui s'est passé. Ici l'erreur reste enfermée dans
 * /prospection — le reste du site continue de fonctionner — et son message est
 * affiché, ce qui permet de la diagnostiquer depuis un téléphone, sans console.
 */
export default function ErreurProspection({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[prospection]", error);
  }, [error]);

  return (
    <div className="wrap">
      <div className="empty">
        <b>Quelque chose a cassé</b>
        <p style={{ wordBreak: "break-word" }}>
          {error.message || "Erreur inconnue."}
          {error.digest ? ` (code ${error.digest})` : ""}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
          <button className="go" onClick={reset}>
            Réessayer
          </button>
          <a className="go" href="/prospection/connexion">
            Se reconnecter
          </a>
        </div>
      </div>
    </div>
  );
}
