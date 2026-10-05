"use client";

import { useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import type { Lead } from "@/lib/prospection/types";
import { longD } from "@/lib/prospection/format";
import Carte from "./Carte";
import ChoixCreneau from "./ChoixCreneau";
import Argent from "./Argent";

/**
 * Une fiche ouverte depuis le fichier ou l'agenda.
 *
 * C'est la même carte que dans la file d'appel, avec les mêmes informations et
 * les mêmes outils : composer, corriger le numéro, écrire, poser un résultat,
 * prendre des notes. Un commercial qui retrouve un prospect dans la liste doit
 * pouvoir le traiter sur place, sans se demander où est passé le bouton qu'il
 * avait sous les yeux dix minutes plus tôt.
 *
 * S'y ajoute ce qui n'a de sens qu'ici : clôturer un rendez-vous passé, le
 * déplacer, l'annuler, et suivre l'argent.
 */
export default function FicheRdv({ ctx, lead }: { ctx: Ctx; lead: Lead }) {
  /* La fiche vit le temps du panneau : corriger le numéro ou enregistrer une
     note doit se voir tout de suite, sans attendre le rechargement général. */
  const [fiche, setFiche] = useState<Lead>(lead);

  const parQui = ctx.d.equipe.find((m) => m.id === fiche.owner_id)?.nom ?? "";
  const passe = fiche.rdv
    ? fiche.rdv.slice(0, 10) <= new Date().toLocaleDateString("sv-SE")
    : false;

  async function cloturer(honore: boolean) {
    await q.majLead(fiche.id, {
      rdv_honore: honore,
      ...(honore ? {} : { statut: "no_show" as const }),
    });
    await q.noter(fiche.id, honore ? "RDV honoré" : "Client absent", ctx.moi.id);
    await ctx.recharger();
    ctx.fermerSheet();
    ctx.toast(
      honore ? "Rendez-vous honoré" : "Absence enregistrée, la fiche revient dans la file"
    );
  }

  async function annuler() {
    await q.majLead(fiche.id, { statut: "chaud", rdv: null, rdv_honore: null });
    await q.noter(fiche.id, "RDV annulé", ctx.moi.id);
    await ctx.recharger();
    ctx.fermerSheet();
    ctx.toast("RDV annulé, fiche repassée en chaud");
  }

  return (
    <>
      {fiche.rdv && (
        <p className="hint" style={{ marginBottom: 14 }}>
          Rendez-vous le{" "}
          <b>
            {longD(fiche.rdv.slice(0, 10))} à{" "}
            {new Date(fiche.rdv).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </b>{" "}
          · audit 500 €
        </p>
      )}

      <Carte
        ctx={ctx}
        lead={fiche}
        onLead={setFiche}
        apresResultat={() => ctx.fermerSheet()}
        historiqueLocal={ctx.d.activities}
      />

      {fiche.statut === "rdv" && passe && fiche.rdv_honore === null && (
        <>
          <div className="sechead" style={{ padding: "18px 0 10px" }}>
            Ce rendez-vous a-t-il eu lieu ?
          </div>
          <div className="outcome">
            <button className="act won" onClick={() => cloturer(true)}>
              Rendez-vous honoré
            </button>
            <button className="act dead" onClick={() => cloturer(false)}>
              Client absent
            </button>
          </div>
        </>
      )}

      <div className="btns">
        <button
          className="btn ghost"
          onClick={() => ctx.ouvrirSheet(<Argent ctx={ctx} lead={fiche} />)}
        >
          Suivre l&apos;argent
        </button>
        {fiche.statut === "rdv" && (
          <>
            <button
              className="btn ghost"
              onClick={() => ctx.ouvrirSheet(<ChoixCreneau ctx={ctx} lead={fiche} />)}
            >
              Changer de créneau
            </button>
            <button className="btn warn" onClick={annuler}>
              Annuler le RDV
            </button>
          </>
        )}
      </div>

      {ctx.moi.role === "admin" && (
        <p className="hint" style={{ marginTop: 12 }}>
          Fiche suivie par {parQui || "personne"}.
        </p>
      )}
    </>
  );
}
