"use client";

import { useEffect, useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import { prochainsCreneaux, parJour, type Slot } from "@/lib/prospection/slots";
import { longD } from "@/lib/prospection/format";
import { DUR, HORIZON } from "@/lib/prospection/types";
import FicheRdv from "./FicheRdv";
import ChoixCreneau from "./ChoixCreneau";

type Filtre = "libres" | "rdv" | "tout" | "passes";

const FILTRES: [Filtre, string][] = [
  ["libres", "Créneaux libres"],
  ["rdv", "Rendez-vous calés"],
  ["tout", "Tout"],
  ["passes", "Passés"],
];

export default function VueAgenda({ ctx }: { ctx: Ctx }) {
  const [filtre, setFiltre] = useState<Filtre>("libres");
  const [slots, setSlots] = useState<Slot[] | null>(null);

  useEffect(() => {
    const du = new Date();
    const au = new Date();
    au.setDate(au.getDate() + HORIZON + 1);
    q.creneauxPris(du, au)
      .then((pris) => setSlots(prochainsCreneaux(ctx.d.creneaux, pris)))
      .catch(() => setSlots([]));
  }, [ctx.d.creneaux, ctx.d.leads]);

  /* Les fiches dont on connaît le RDV : celles que l'on a le droit de voir. */
  const mesRdv = new Map(
    ctx.d.leads.filter((l) => l.statut === "rdv" && l.rdv).map((l) => [new Date(l.rdv!).getTime(), l])
  );
  const sansHeure = ctx.d.leads.filter((l) => l.statut === "rdv" && !l.rdv);

  const aucuneGrille = ctx.d.creneaux.length === 0;

  if (filtre === "passes") {
    const j = new Date().toLocaleDateString("sv-SE");
    const passes = ctx.d.leads
      .filter((l) => l.rdv && l.rdv.slice(0, 10) < j)
      .sort((a, b) => (a.rdv! < b.rdv! ? 1 : -1));
    const ok = passes.filter((l) => l.rdv_honore === true).length;
    const no = passes.filter((l) => l.statut === "no_show" || l.rdv_honore === false).length;

    return (
      <>
        <Chips filtre={filtre} setFiltre={setFiltre} />
        {passes.length === 0 ? (
          <div className="empty">
            <b>Aucun rendez-vous passé</b>
            <p>L&apos;historique des audits s&apos;affichera ici.</p>
          </div>
        ) : (
          <>
            <div className="kpis">
              <div className="kpi"><b>{passes.length}</b><small>RDV passés</small></div>
              <div className="kpi"><b>{ok}</b><small>Honorés</small></div>
              <div className="kpi due"><b>{no}</b><small>Absents</small></div>
              <div className="kpi">
                <b>{ok + no ? Math.round((ok / (ok + no)) * 100) : 0} %</b>
                <small>Taux de présence</small>
              </div>
            </div>
            {parJour(passes.map((l) => ({ jour: l.rdv!.slice(0, 10), lead: l }))).map(
              ([jour, lignes]) => (
                <div className="day" key={jour}>
                  <div className="dayh"><b>{longD(jour)}</b></div>
                  <div className="slots">
                    {lignes.map(({ lead }) => (
                      <button
                        key={lead.id}
                        className="slot taken"
                        onClick={() => ctx.ouvrirSheet(<FicheRdv ctx={ctx} lead={lead} />)}
                      >
                        <time>
                          {new Date(lead.rdv!).toLocaleTimeString("fr-FR", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </time>
                        <span className="who">
                          <b>{lead.nom}</b>
                          <small>
                            {lead.ville} ·{" "}
                            {lead.rdv_honore === true
                              ? "honoré"
                              : lead.statut === "no_show" || lead.rdv_honore === false
                                ? "absent"
                                : "à clôturer"}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </>
        )}
      </>
    );
  }

  if (aucuneGrille && sansHeure.length === 0) {
    return (
      <>
        <Chips filtre={filtre} setFiltre={setFiltre} />
        <div className="empty">
          <b>Aucun créneau ouvert</b>
          <p>
            {ctx.moi.role === "admin"
              ? "Ouvre l'onglet Réglages et coche tes disponibilités. Tant qu'il n'y en a pas, les rendez-vous se marquent sans heure."
              : "Mehdi n'a pas encore renseigné ses disponibilités."}
          </p>
        </div>
      </>
    );
  }

  const visibles = (slots ?? []).filter((s) =>
    filtre === "libres" ? !s.pris : filtre === "rdv" ? s.pris : true
  );

  return (
    <>
      <Chips filtre={filtre} setFiltre={setFiltre} />

      {filtre !== "libres" && sansHeure.length > 0 && (
        <div className="day">
          <div className="dayh"><b>Heure à fixer</b><span>{sansHeure.length}</span></div>
          <div className="slots">
            {sansHeure.map((l) => (
              <button
                key={l.id}
                className="slot taken"
                onClick={() => ctx.ouvrirSheet(<ChoixCreneau ctx={ctx} lead={l} />)}
              >
                <time>?</time>
                <span className="who">
                  <b>{l.nom}</b>
                  <small>{l.ville} · {l.secteur} · choisir un créneau</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {slots === null ? (
        <p className="hint">Chargement de l&apos;agenda…</p>
      ) : visibles.length === 0 ? (
        <div className="empty">
          <b>Rien ici</b>
          <p>
            {filtre === "libres"
              ? "Tous les créneaux des quatre prochaines semaines sont pris."
              : "Aucun rendez-vous calé pour l'instant."}
          </p>
        </div>
      ) : (
        parJour(visibles).map(([jour, sl]) => {
          const libres = sl.filter((s) => !s.pris).length;
          return (
            <div className="day" key={jour}>
              <div className="dayh">
                <b>{longD(jour)}</b>
                <span>{libres} libre{libres > 1 ? "s" : ""}</span>
              </div>
              <div className="slots">
                {sl.map((s) => {
                  const lead = mesRdv.get(new Date(s.iso).getTime());
                  if (s.pris && lead) {
                    return (
                      <button
                        key={s.iso}
                        className="slot taken"
                        onClick={() => ctx.ouvrirSheet(<FicheRdv ctx={ctx} lead={lead} />)}
                      >
                        <time>{s.heure}</time>
                        <span className="who">
                          <b>{lead.nom}</b>
                          <small>{lead.ville} · {lead.secteur}</small>
                        </span>
                      </button>
                    );
                  }
                  if (s.pris) {
                    // Créneau pris par un collègue : on montre qu'il est occupé,
                    // sans rien dire de la fiche.
                    return (
                      <div key={s.iso} className="slot taken">
                        <time>{s.heure}</time>
                        <span className="who"><b>Occupé</b><small>Rendez-vous d&apos;un collègue</small></span>
                      </div>
                    );
                  }
                  return (
                    <div key={s.iso} className="slot">
                      <time>{s.heure}</time>
                      <span className="free">Libre · {DUR} min</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

function Chips({ filtre, setFiltre }: { filtre: Filtre; setFiltre: (f: Filtre) => void }) {
  return (
    <div className="chips">
      {FILTRES.map(([k, lab]) => (
        <button key={k} className="chip" aria-pressed={filtre === k} onClick={() => setFiltre(k)}>
          {lab}
        </button>
      ))}
    </div>
  );
}
