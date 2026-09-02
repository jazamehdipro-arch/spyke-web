"use client";

import { useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import type { Deal, Lead } from "@/lib/prospection/types";
import { ABO_MOIS, RATE } from "@/lib/prospection/types";
import { commission } from "@/lib/prospection/argent";
import { eur, fmtD } from "@/lib/prospection/format";

/** Le dealSheet() du prototype. Les montants ne sont saisissables que par l'admin. */
export default function Argent({ ctx, lead }: { ctx: Ctx; lead: Lead }) {
  const existant = ctx.d.deals.find((x) => x.lead_id === lead.id);
  const [d, setD] = useState<Partial<Deal>>({
    audit: existant?.audit ?? 500,
    audit_in: existant?.audit_in ?? 0,
    projet: existant?.projet ?? 0,
    projet_in: existant?.projet_in ?? 0,
    abo: existant?.abo ?? 0,
    abo_start: existant?.abo_start ?? null,
    verse: existant?.verse ?? 0,
    perdu: existant?.perdu ?? false,
  });
  const adm = ctx.moi.role === "admin";
  const c = commission(d as Deal);
  const parQui = ctx.d.equipe.find((m) => m.id === lead.owner_id)?.nom;

  const num = (v: string) => Number(v) || 0;

  async function enregistrer(patch: Partial<Deal> = {}) {
    const suite = { ...d, ...patch };
    // La date d'encaissement se pose toute seule au premier euro reçu.
    if (!existant?.audit_in && (suite.audit_in ?? 0) > 0 && !suite.audit_date) {
      suite.audit_date = new Date().toLocaleDateString("sv-SE");
    }
    if (!existant?.projet_in && (suite.projet_in ?? 0) > 0 && !suite.projet_date) {
      suite.projet_date = new Date().toLocaleDateString("sv-SE");
    }
    await q.majAffaire(lead.id, suite);
    await ctx.recharger();
    ctx.fermerSheet();
    ctx.toast("Affaire mise à jour");
  }

  const champ = (
    id: keyof Deal,
    label: string,
    type: "number" | "date" = "number"
  ) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        type={type}
        id={id}
        value={type === "date" ? ((d[id] as string) ?? "") : String(d[id] ?? 0)}
        disabled={!adm}
        style={adm ? undefined : { opacity: 0.6 }}
        onChange={(e) =>
          setD({ ...d, [id]: type === "date" ? e.target.value || null : num(e.target.value) })
        }
      />
    </div>
  );

  return (
    <>
      <h2>{lead.nom}</h2>
      <p className="hint" style={{ marginBottom: 14 }}>
        {lead.ville} · {lead.secteur}
        {adm && parQui ? " · amené par " + parQui : ""}
        {lead.rdv ? " · RDV le " + fmtD(lead.rdv.slice(0, 10)) : ""}
      </p>

      <div className="money">
        <div className="blk">
          <h4>Audit<em>{RATE.audit * 100}% de commission</em></h4>
          <div className="row2">
            {champ("audit", "Prix de l'audit")}
            {champ("audit_in", "Déjà encaissé")}
          </div>
        </div>

        <div className="blk">
          <h4>Projet<em>{RATE.projet * 100}% de commission</em></h4>
          <div className="row2">
            {champ("projet", "Montant du projet")}
            {champ("projet_in", "Déjà encaissé")}
          </div>
        </div>

        <div className="blk">
          <h4>Abonnement<em>{RATE.abo * 100}% pendant {ABO_MOIS} mois</em></h4>
          <div className="row2">
            {champ("abo", "Montant mensuel")}
            {champ("abo_start", "Depuis le", "date")}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            {c.mois
              ? `${c.mois} mois facturés sur ${ABO_MOIS} commissionnés`
              : "Renseigne la date de début pour lancer le compteur"}
          </p>
        </div>

        <div className="blk">
          <h4>Commission du commercial</h4>
          <div className="tot"><span>Audit</span><b>{eur(c.audit)}</b></div>
          <div className="tot"><span>Projet</span><b>{eur(c.projet)}</b></div>
          <div className="tot">
            <span>Abonnement{c.mois ? ` · ${c.mois} mois` : ""}</span><b>{eur(c.abo)}</b>
          </div>
          <div className="tot big"><span>Due au total</span><b>{eur(c.total)}</b></div>
          <div style={{ marginTop: 10 }}>{champ("verse", "Déjà versé au commercial")}</div>
          <div className="tot"><span>Reste à verser</span><b>{eur(c.reste)}</b></div>
        </div>
      </div>

      {adm ? (
        <div className="btns">
          <button className="btn" onClick={() => enregistrer()}>Enregistrer</button>
          <button className="btn ghost" onClick={() => enregistrer({ verse: c.total })}>
            Tout marquer versé
          </button>
          <button className="btn warn" onClick={() => enregistrer({ perdu: !d.perdu })}>
            {d.perdu ? "Réactiver" : "Marquer perdu"}
          </button>
        </div>
      ) : (
        <p className="hint" style={{ marginTop: 14 }}>
          Les montants sont saisis par Mehdi. Tu vois ici ce que cette affaire te rapporte.
        </p>
      )}
    </>
  );
}
