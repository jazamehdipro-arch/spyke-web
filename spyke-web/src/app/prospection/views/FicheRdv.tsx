"use client";

import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import type { Lead } from "@/lib/prospection/types";
import { longD, fmtD } from "@/lib/prospection/format";
import ChoixCreneau from "./ChoixCreneau";
import Argent from "./Argent";

/** Le panneau d'une fiche : le showRdv() du prototype. */
export default function FicheRdv({ ctx, lead }: { ctx: Ctx; lead: Lead }) {
  const parQui = ctx.d.equipe.find((m) => m.id === lead.owner_id)?.nom ?? "";
  const passe = lead.rdv ? lead.rdv.slice(0, 10) <= new Date().toLocaleDateString("sv-SE") : false;

  async function cloturer(honore: boolean) {
    await q.majLead(lead.id, {
      rdv_honore: honore,
      ...(honore ? {} : { statut: "no_show" as const }),
    });
    await q.noter(lead.id, honore ? "RDV honoré" : "Client absent", ctx.moi.id);
    await ctx.recharger();
    ctx.fermerSheet();
    ctx.toast(honore ? "Rendez-vous honoré" : "Absence enregistrée, la fiche revient dans la file");
  }

  async function annuler() {
    await q.majLead(lead.id, { statut: "chaud", rdv: null, rdv_honore: null });
    await q.noter(lead.id, "RDV annulé", ctx.moi.id);
    await ctx.recharger();
    ctx.fermerSheet();
    ctx.toast("RDV annulé, fiche repassée en chaud");
  }

  return (
    <>
      <h2>{lead.nom}</h2>
      <p className="hint" style={{ marginBottom: 14 }}>
        {lead.rdv
          ? longD(lead.rdv.slice(0, 10)) + " à " +
            new Date(lead.rdv).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "Heure à fixer"}{" "}
        · audit 500 €
      </p>

      <div className="panel" style={{ margin: "0 0 12px" }}>
        <div className="stat"><span>Secteur</span><b>{lead.secteur}</b></div>
        <div className="stat"><span>Ville</span><b>{lead.ville || "—"}</b></div>
        <div className="stat"><span>Téléphone</span><b>{lead.tel || "—"}</b></div>
        <div className="stat"><span>Interlocuteur</span><b>{lead.contact || "—"}</b></div>
        {ctx.moi.role === "admin" && (
          <div className="stat"><span>Amené par</span><b>{parQui || "—"}</b></div>
        )}
      </div>

      {lead.notes && (
        <p className="hint" style={{ marginBottom: 14 }}>
          <b>Notes du commercial :</b> {lead.notes}
        </p>
      )}

      {lead.statut === "rdv" && passe && lead.rdv_honore === null && (
        <div className="outcome">
          <button className="act won" onClick={() => cloturer(true)}>Rendez-vous honoré</button>
          <button className="act dead" onClick={() => cloturer(false)}>Client absent</button>
        </div>
      )}

      <div className="btns">
        {lead.tel && (
          <a className="btn" href={"tel:" + lead.tel.replace(/\s/g, "")}>Appeler</a>
        )}
        <button className="btn ghost" onClick={() => ctx.ouvrirSheet(<Argent ctx={ctx} lead={lead} />)}>
          Suivre l&apos;argent
        </button>
        {lead.statut === "rdv" && (
          <>
            <button
              className="btn ghost"
              onClick={() => ctx.ouvrirSheet(<ChoixCreneau ctx={ctx} lead={lead} />)}
            >
              Changer de créneau
            </button>
            <button className="btn warn" onClick={annuler}>Annuler le RDV</button>
          </>
        )}
      </div>
      {lead.rdv && (
        <p className="hint" style={{ marginTop: 10 }}>
          Rendez-vous calé le {fmtD(lead.rdv.slice(0, 10))}.
        </p>
      )}
    </>
  );
}
