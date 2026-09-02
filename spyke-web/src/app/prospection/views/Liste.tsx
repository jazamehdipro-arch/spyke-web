"use client";

import { useState } from "react";
import type { Ctx } from "../App";
import { STATUS, type Statut } from "@/lib/prospection/types";
import { fmtD, norm } from "@/lib/prospection/format";
import FicheRdv from "./FicheRdv";

export default function VueListe({ ctx }: { ctx: Ctx }) {
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<Statut | null>(null);

  const q = norm(recherche);
  const out = ctx.d.leads
    .filter(
      (l) =>
        (statut === null || l.statut === statut) &&
        (!q || norm(`${l.nom} ${l.ville} ${l.tel} ${l.secteur}`).includes(q))
    )
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <>
      <input
        className="search"
        placeholder="Chercher un nom, une ville, un numéro…"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />

      <div className="chips">
        <button className="chip" aria-pressed={statut === null} onClick={() => setStatut(null)}>
          Tout<span className="c">{ctx.d.leads.length}</span>
        </button>
        {(Object.keys(STATUS) as Statut[]).map((k) => (
          <button
            key={k}
            className="chip"
            aria-pressed={statut === k}
            onClick={() => setStatut(k)}
          >
            {STATUS[k].l}
            <span className="c">{ctx.d.leads.filter((l) => l.statut === k).length}</span>
          </button>
        ))}
      </div>

      {out.length === 0 ? (
        <div className="empty">
          <b>Rien à afficher</b>
          <p>Aucune fiche ne correspond à ce filtre.</p>
        </div>
      ) : (
        <div className="rows">
          {out.slice(0, 300).map((l) => (
            <button
              key={l.id}
              className="row"
              onClick={() => ctx.ouvrirSheet(<FicheRdv ctx={ctx} lead={l} />)}
            >
              <span className={"dot " + STATUS[l.statut].c} />
              <span className="t">
                <b>{l.nom}</b>
                <small>
                  {l.ville} · {l.secteur} · {STATUS[l.statut].l}
                  {l.statut === "rdv" && l.rdv
                    ? " " + fmtD(l.rdv.slice(0, 10)) + " à " +
                      new Date(l.rdv).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                    : l.statut === "rappeler" && l.rappel
                      ? " " + fmtD(l.rappel)
                      : ""}
                </small>
              </span>
              <span className="p">{l.tel}</span>
            </button>
          ))}
          {out.length > 300 && (
            <p className="hint" style={{ textAlign: "center", padding: 10 }}>
              300 premières sur {out.length}. Affine la recherche.
            </p>
          )}
        </div>
      )}
    </>
  );
}
