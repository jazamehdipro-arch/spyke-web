"use client";

import { useEffect, useState } from "react";
import * as q from "@/lib/prospection/queries";
import { prochainsCreneaux, parJour, type Slot } from "@/lib/prospection/slots";
import { longD, fmtD } from "@/lib/prospection/format";
import { DUR, HORIZON } from "@/lib/prospection/types";
import type { Ctx } from "../App";
import type { Lead } from "@/lib/prospection/types";

/** Le panneau « Caler le rendez-vous d'audit » du prototype. */
export default function ChoixCreneau({ ctx, lead }: { ctx: Ctx; lead: Lead }) {
  const [libres, setLibres] = useState<Slot[] | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const du = new Date();
    const au = new Date();
    au.setDate(au.getDate() + HORIZON + 1);
    q.creneauxPris(du, au)
      .then((pris) => setLibres(prochainsCreneaux(ctx.d.creneaux, pris).filter((s) => !s.pris)))
      .catch(() => setLibres([]));
  }, [ctx.d.creneaux]);

  async function caler(iso: string | null) {
    setErreur("");
    try {
      await q.calerRdv(lead.id, iso);
      await ctx.recharger();
      ctx.fermerSheet();
      ctx.toast(
        iso
          ? "RDV calé le " + fmtD(iso.slice(0, 10)) + " à " + new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "RDV marqué, heure à fixer"
      );
    } catch (e) {
      // Le cas qui compte : quelqu'un a pris le créneau entre l'affichage et le clic.
      setErreur((e as { message?: string }).message ?? "Impossible de caler ce rendez-vous.");
      const du = new Date();
      const au = new Date();
      au.setDate(au.getDate() + HORIZON + 1);
      const pris = await q.creneauxPris(du, au);
      setLibres(prochainsCreneaux(ctx.d.creneaux, pris).filter((s) => !s.pris));
    }
  }

  if (libres === null) return <p className="hint">Chargement des créneaux…</p>;

  if (!libres.length) {
    return (
      <>
        <h2>Aucun créneau ouvert</h2>
        <p className="hint">
          Mehdi n&apos;a pas encore renseigné ses disponibilités, ou tout est pris sur les
          quatre prochaines semaines. Marque quand même le rendez-vous, l&apos;heure se
          fixera après.
        </p>
        {erreur && <p className="hint" style={{ color: "var(--hot)", marginTop: 10 }}>{erreur}</p>}
        <div className="btns">
          <button className="btn" onClick={() => caler(null)}>Marquer sans créneau</button>
          <button className="btn ghost" onClick={ctx.fermerSheet}>Annuler</button>
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Caler le rendez-vous d&apos;audit</h2>
      <p className="hint" style={{ marginBottom: 14 }}>
        {lead.nom} · créneaux libres de Mehdi
      </p>
      {erreur && <p className="hint" style={{ color: "var(--hot)", marginBottom: 12 }}>{erreur}</p>}

      {parJour(libres.slice(0, 60)).map(([jour, slots]) => (
        <div className="day" key={jour}>
          <div className="dayh"><b>{longD(jour)}</b></div>
          <div className="slots">
            {slots.map((s) => (
              <button className="slot" key={s.iso} onClick={() => caler(s.iso)}>
                <time>{s.heure}</time>
                <span className="free">Libre · {DUR} min</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="btns">
        <button className="btn ghost" onClick={() => caler(null)}>Marquer sans créneau</button>
      </div>
    </>
  );
}
