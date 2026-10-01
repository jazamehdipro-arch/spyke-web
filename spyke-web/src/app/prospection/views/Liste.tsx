"use client";

import { useMemo, useState } from "react";
import type { Ctx } from "../App";
import { SANS_FILTRE, STATUS, type Filtres, type Lead, type Statut } from "@/lib/prospection/types";
import { correspond } from "@/lib/prospection/horsligne";
import { fmtD, norm } from "@/lib/prospection/format";
import FicheRdv from "./FicheRdv";

export default function VueListe({ ctx }: { ctx: Ctx }) {
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<Statut | null>(null);
  const [filtres, setFiltres] = useState<Filtres>(SANS_FILTRE);

  const q = norm(recherche);
  /* La recherche porte aussi sur le décideur : au téléphone, on se souvient
     d'un nom de personne bien avant de retrouver le nom de la structure. */
  const out = ctx.d.leads
    .filter(
      (l) =>
        (statut === null || l.statut === statut) &&
        correspond(l, filtres) &&
        (!q || norm(`${l.nom} ${l.ville} ${l.tel} ${l.secteur} ${l.decideur}`).includes(q))
    )
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  /* Les mêmes menus que dans l'écran d'appel, sur la même base : ce qui est
     réellement dans les fiches, et jamais une liste écrite à la main. */
  const choix = useMemo(() => {
    const liste = (cle: keyof Filtres, valeur: (l: Lead) => string) => {
      const sansCeCritere = { ...filtres, [cle]: null } as Filtres;
      const compte = new Map<string, number>();
      for (const l of ctx.d.leads) {
        if (!correspond(l, sansCeCritere)) continue;
        if (statut !== null && l.statut !== statut) continue;
        const v = valeur(l);
        compte.set(v, (compte.get(v) ?? 0) + 1);
      }
      return [...compte.entries()]
        .map(([v, n]) => ({ v, n }))
        .sort((a, b) => (a.v === "" ? 1 : b.v === "" ? -1 : a.v.localeCompare(b.v, "fr")));
    };
    return {
      secteur: liste("secteur", (l) => l.secteur),
      ville: liste("ville", (l) => l.ville),
      effectif: liste("effectif", (l) => l.effectif),
      prio: liste("prio", (l) => l.prio),
    };
  }, [ctx.d.leads, filtres, statut]);

  const filtreActif = Object.values(filtres).some((v) => v !== null);

  function Menu({
    cle, titre, valeurs, libelle,
  }: {
    cle: keyof Filtres;
    titre: string;
    valeurs: { v: string; n: number }[];
    libelle?: (v: string) => string;
  }) {
    if (valeurs.length < 2) return null;
    const courant = filtres[cle];
    return (
      <label className="filtre">
        <span>{titre}</span>
        <select
          value={courant === null ? "\u0000" : courant}
          onChange={(e) =>
            setFiltres((f) => ({
              ...f,
              [cle]: e.target.value === "\u0000" ? null : e.target.value,
            }))
          }
        >
          <option value={"\u0000"}>Tous</option>
          {valeurs.map(({ v, n }) => (
            <option key={v || "_"} value={v}>
              {(libelle ? libelle(v) : v) + " (" + n + ")"}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <>
      <input
        className="search"
        placeholder="Chercher un cabinet, une ville, un numéro, un décideur…"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />

      <div className="filtres">
        <Menu cle="secteur" titre="Secteur" valeurs={choix.secteur} />
        <Menu cle="ville" titre="Ville" valeurs={choix.ville} />
        <Menu cle="effectif" titre="Taille" valeurs={choix.effectif}
          libelle={(v) => v || "Taille inconnue"} />
        <Menu cle="prio" titre="Priorité" valeurs={choix.prio}
          libelle={(v) => "Priorité " + v} />
        <span className="compte">{out.length} fiche{out.length > 1 ? "s" : ""}</span>
        {filtreActif && (
          <button className="effacer" onClick={() => setFiltres(SANS_FILTRE)}>
            Tout afficher
          </button>
        )}
      </div>

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
                  {l.ville} · {l.secteur}
                  {l.effectif ? " · " + l.effectif : ""} · {STATUS[l.statut].l}
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
