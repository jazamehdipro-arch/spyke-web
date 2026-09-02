"use client";

import type { Ctx } from "../App";
import { STAGES } from "@/lib/prospection/types";
import { commission, dansPipeline, encaisse, etape } from "@/lib/prospection/argent";
import { eur } from "@/lib/prospection/format";
import Argent from "./Argent";

export default function VuePipeline({ ctx }: { ctx: Ctx }) {
  const deal = (id: string) => ctx.d.deals.find((x) => x.lead_id === id);
  const lignes = ctx.d.leads.filter((l) => dansPipeline(l, deal(l.id)));
  const actives = lignes.filter((l) => !deal(l.id)?.perdu);

  const ca = actives.reduce((n, l) => n + encaisse(deal(l.id)), 0);
  const mrr = actives
    .filter((l) => deal(l.id)?.abo && deal(l.id)?.abo_start)
    .reduce((n, l) => n + (deal(l.id)?.abo ?? 0), 0);
  const du = actives.reduce((n, l) => n + commission(deal(l.id)).reste, 0);
  const net = ca - actives.reduce((n, l) => n + commission(deal(l.id)).total, 0);

  const admin = ctx.moi.role === "admin";

  return (
    <>
      <div className="kpis">
        {admin ? (
          <>
            <div className="kpi"><b>{eur(ca)}</b><small>Encaissé au total</small></div>
            <div className="kpi mrr"><b>{eur(mrr)}</b><small>Abonnements par mois</small></div>
            <div className="kpi due"><b>{eur(du)}</b><small>Commissions à verser</small></div>
            <div className="kpi"><b>{eur(net)}</b><small>Net pour Spyke</small></div>
          </>
        ) : (
          <>
            <div className="kpi"><b>{lignes.length}</b><small>Affaires en cours</small></div>
            <div className="kpi mrr">
              <b>{eur(actives.reduce((n, l) => n + commission(deal(l.id)).total, 0))}</b>
              <small>Mes commissions</small>
            </div>
            <div className="kpi due"><b>{eur(du)}</b><small>Reste à me verser</small></div>
            <div className="kpi">
              <b>{ctx.d.leads.filter((l) => l.statut === "rdv").length}</b>
              <small>RDV calés</small>
            </div>
          </>
        )}
      </div>

      {lignes.length === 0 ? (
        <div className="empty">
          <b>Pipeline vide</b>
          <p>
            Dès qu&apos;un rendez-vous d&apos;audit est calé, l&apos;affaire apparaît ici et
            tu suis l&apos;argent jusqu&apos;à l&apos;abonnement.
          </p>
        </div>
      ) : (
        STAGES.map(([k, lab, col]) => {
          const g = lignes.filter((l) => etape(l, deal(l.id)) === k);
          if (!g.length) return null;
          const tot = g.reduce((n, l) => n + encaisse(deal(l.id)), 0);
          return (
            <div className="stage" key={k}>
              <div className="stageh">
                <i style={{ background: col }} />
                <b>{lab}</b>
                <span>{g.length}{tot ? " · " + eur(tot) : ""}</span>
              </div>
              <div className="rows">
                {g.map((l) => {
                  const c = commission(deal(l.id));
                  const parQui = ctx.d.equipe.find((m) => m.id === l.owner_id)?.nom;
                  return (
                    <button
                      key={l.id}
                      className="deal"
                      onClick={() => ctx.ouvrirSheet(<Argent ctx={ctx} lead={l} />)}
                    >
                      <span className="t">
                        <b>{l.nom}</b>
                        <small>
                          {l.ville} · {l.secteur}
                          {admin && parQui ? " · " + parQui : ""}
                        </small>
                      </span>
                      <span className="m">
                        <b>{eur(admin ? encaisse(deal(l.id)) : c.total)}</b>
                        {c.reste ? (
                          <small>{eur(c.reste)} à verser</small>
                        ) : l.rdv_honore === true ? (
                          <small className="ok">honoré</small>
                        ) : null}
                      </span>
                    </button>
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
