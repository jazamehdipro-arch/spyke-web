"use client";

import { useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";

/**
 * Renommer un secteur.
 *
 * Le secteur est déduit du nom du fichier importé — pratique, mais un export
 * de tableur s'appelle « Feuille de calcul sans titre feuille 1 », et cette
 * étiquette se retrouve alors sur les boutons de la file d'appel. Corriger sur
 * place évite de réimporter un fichier entier pour un mot.
 */
export default function Secteurs({ ctx }: { ctx: Ctx }) {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const secteurs = [...new Set(ctx.d.leads.map((l) => l.secteur))].sort();
  const combien = (s: string) => ctx.d.leads.filter((l) => l.secteur === s).length;

  async function renommer() {
    if (!ancien || !nouveau.trim()) return;
    setOccupe(true);
    try {
      const n = await q.renommerSecteur(ancien, nouveau.trim());
      setMessage({ ok: true, texte: `${n} fiche${n > 1 ? "s" : ""} déplacée${n > 1 ? "s" : ""} vers « ${nouveau.trim()} ».` });
      setAncien(""); setNouveau("");
      await ctx.recharger();
    } catch (e) {
      setMessage({ ok: false, texte: (e as { message?: string }).message ?? "Renommage impossible." });
    }
    setOccupe(false);
  }

  if (!secteurs.length) return null;

  return (
    <div className="panel">
      <h3>Secteurs</h3>
      <p className="hint">
        Le secteur vient du nom du fichier importé. Si tu as importé une
        « Feuille de calcul sans titre », corrige l&apos;étiquette ici plutôt que
        de tout réimporter.
      </p>

      <div style={{ margin: "14px 0" }}>
        {secteurs.map((s) => (
          <button
            key={s}
            className="row"
            style={{ marginBottom: 6 }}
            onClick={() => { setAncien(s); setNouveau(s); setMessage(null); }}
          >
            <span className="t"><b>{s}</b><small>{combien(s)} fiche{combien(s) > 1 ? "s" : ""}</small></span>
            <span className="p">Renommer</span>
          </button>
        ))}
      </div>

      {ancien && (
        <>
          <label htmlFor="sect-n">Nouveau nom pour « {ancien} »</label>
          <input
            id="sect-n" type="text" value={nouveau} placeholder="Notaires"
            onChange={(e) => setNouveau(e.target.value)}
          />
          <div className="btns">
            <button className="btn" disabled={occupe || !nouveau.trim() || nouveau.trim() === ancien}
              onClick={() => void renommer()}>
              {occupe ? "…" : "Renommer"}
            </button>
            <button className="btn ghost" onClick={() => { setAncien(""); setNouveau(""); }}>
              Annuler
            </button>
          </div>
        </>
      )}

      {message && (
        <p className="hint" style={{ marginTop: 12, color: message.ok ? "var(--won)" : "var(--hot)" }}>
          {message.texte}
        </p>
      )}
    </div>
  );
}
