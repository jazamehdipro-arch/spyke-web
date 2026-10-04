"use client";

import { useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";

/**
 * Les listes de prospection : les renommer, les jeter.
 *
 * Le nom de la liste est déduit du nom du fichier importé — pratique, mais un
 * export de tableur s'appelle « Feuille de calcul sans titre feuille 1 », et
 * cette étiquette se retrouve sur les boutons de la file d'appel.
 *
 * La suppression demande une confirmation, et cette confirmation annonce les
 * deux chiffres : ce qui part, et ce qui reste. Une liste n'est jamais jetée
 * entièrement — un rendez-vous calé et une fiche encaissée sont gardés — et
 * l'écran doit le dire avant, pas le découvrir après.
 */
export default function Secteurs({ ctx }: { ctx: Ctx }) {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [aJeter, setAJeter] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const secteurs = [...new Set(ctx.d.leads.map((l) => l.secteur))].sort();
  const combien = (s: string) => ctx.d.leads.filter((l) => l.secteur === s).length;

  // Le même critère que la base : un rendez-vous calé ou de l'argent encaissé.
  // Il est recalculé ici pour annoncer le chiffre avant d'agir ; c'est la base
  // qui tranche au moment de supprimer.
  const abouties = (s: string) =>
    ctx.d.leads.filter(
      (l) =>
        l.secteur === s &&
        (l.statut === "rdv" ||
          ctx.d.deals.some(
            (d) =>
              d.lead_id === l.id &&
              (Number(d.audit_in) > 0 || Number(d.projet_in) > 0 || Number(d.abo) > 0)
          ))
    ).length;

  function fermerTout() {
    setAncien(""); setNouveau(""); setAJeter("");
  }

  async function renommer() {
    if (!ancien || !nouveau.trim()) return;
    setOccupe(true);
    try {
      const n = await q.renommerSecteur(ancien, nouveau.trim());
      setMessage({ ok: true, texte: `${n} fiche${n > 1 ? "s" : ""} déplacée${n > 1 ? "s" : ""} vers « ${nouveau.trim()} ».` });
      fermerTout();
      await ctx.recharger();
    } catch (e) {
      setMessage({ ok: false, texte: (e as { message?: string }).message ?? "Renommage impossible." });
    }
    setOccupe(false);
  }

  async function supprimer(s: string) {
    setOccupe(true);
    try {
      const r = await q.supprimerSecteur(s);
      const jetees = `${r.supprimees} fiche${r.supprimees > 1 ? "s" : ""} supprimée${r.supprimees > 1 ? "s" : ""}`;
      const gardees =
        r.gardees > 0
          ? `, ${r.gardees} gardée${r.gardees > 1 ? "s" : ""} (rendez-vous calé ou argent encaissé)`
          : "";
      setMessage({ ok: true, texte: `« ${s} » : ${jetees}${gardees}.` });
      fermerTout();
      await ctx.recharger();
    } catch (e) {
      setMessage({ ok: false, texte: (e as { message?: string }).message ?? "Suppression impossible." });
    }
    setOccupe(false);
  }

  if (!secteurs.length) return null;

  return (
    <div className="panel">
      <h3>Listes de prospection</h3>
      <p className="hint">
        Le nom de la liste vient du fichier importé. Si tu as importé une
        « Feuille de calcul sans titre », corrige l&apos;étiquette ici plutôt que
        de tout réimporter. Une liste devenue inutile se jette.
      </p>

      <div style={{ margin: "14px 0" }}>
        {secteurs.map((s) => (
          <div key={s} className="liste">
            <span className="t">
              <b>{s}</b>
              <small>
                {combien(s)} fiche{combien(s) > 1 ? "s" : ""}
                {abouties(s) > 0 && ` · ${abouties(s)} avec suite`}
              </small>
            </span>
            <button
              className="lien"
              onClick={() => { setAncien(s); setNouveau(s); setAJeter(""); setMessage(null); }}
            >
              Renommer
            </button>
            <button
              className="x"
              onClick={() => { setAJeter(s); setAncien(""); setMessage(null); }}
            >
              Supprimer
            </button>
          </div>
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
            <button className="btn ghost" onClick={fermerTout}>Annuler</button>
          </div>
        </>
      )}

      {aJeter && (
        <div className="confirme">
          <b>Supprimer « {aJeter} » ?</b>
          <p>
            {combien(aJeter) - abouties(aJeter)} fiche
            {combien(aJeter) - abouties(aJeter) > 1 ? "s seront effacées" : " sera effacée"},
            définitivement, avec leur historique d&apos;appels.
            {abouties(aJeter) > 0 && (
              <>
                {" "}
                {abouties(aJeter)} fiche{abouties(aJeter) > 1 ? "s" : ""} sera
                {abouties(aJeter) > 1 ? "nt" : ""} gardée
                {abouties(aJeter) > 1 ? "s" : ""} : un rendez-vous y est calé ou de
                l&apos;argent y est rentré.
              </>
            )}
          </p>
          <div className="btns">
            <button className="btn warn" disabled={occupe} onClick={() => void supprimer(aJeter)}>
              {occupe ? "…" : "Oui, supprimer"}
            </button>
            <button className="btn ghost" onClick={fermerTout}>Annuler</button>
          </div>
        </div>
      )}

      {message && (
        <p className="hint" style={{ marginTop: 12, color: message.ok ? "var(--won)" : "var(--hot)" }}>
          {message.texte}
        </p>
      )}
    </div>
  );
}
