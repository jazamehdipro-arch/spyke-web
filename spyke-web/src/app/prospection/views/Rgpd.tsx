"use client";

import { useState } from "react";
import * as q from "@/lib/prospection/queries";
import { norm } from "@/lib/prospection/format";
import type { Ctx } from "../App";
import type { Lead } from "@/lib/prospection/types";

/**
 * Traiter une demande d'un prospect : lui dire ce qu'on a sur lui, ou
 * l'effacer.
 *
 * Réservé au responsable, et la base le revérifie : forget_lead refuse un
 * appelant qui n'est pas admin, même si quelqu'un contournait cet écran.
 *
 * L'effacement est définitif et sans confirmation possible ensuite — on demande
 * donc de retaper le nom de l'établissement. Un « êtes-vous sûr ? » se clique
 * sans lire ; retaper un nom, non.
 */
export default function Rgpd({ ctx }: { ctx: Ctx }) {
  const [recherche, setRecherche] = useState("");
  const [choisi, setChoisi] = useState<Lead | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const trouves = recherche.trim().length < 2 ? [] : ctx.d.leads
    .filter((l) =>
      norm(l.nom).includes(norm(recherche)) ||
      (l.tel ?? "").replace(/\D/g, "").includes(recherche.replace(/\D/g, "")) )
    .slice(0, 8);

  async function exporter(l: Lead) {
    setOccupe(true);
    try {
      const d = await q.exporterFiche(l.id);
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `spyke-donnees-${norm(l.nom).replace(/\s+/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMessage({ ok: true, texte: "Fichier téléchargé. Envoie-le à la personne qui l'a demandé." });
    } catch (e) {
      setMessage({ ok: false, texte: (e as { message?: string }).message ?? "Export impossible." });
    }
    setOccupe(false);
  }

  async function effacer(l: Lead) {
    setOccupe(true);
    try {
      await q.effacerFiche(l.id);
      setMessage({ ok: true, texte: `${l.nom} a été effacé. La fiche, son historique et son affaire sont partis.` });
      setChoisi(null);
      setRecherche("");
      setConfirmation("");
      await ctx.recharger();
    } catch (e) {
      setMessage({ ok: false, texte: (e as { message?: string }).message ?? "Effacement impossible." });
    }
    setOccupe(false);
  }

  return (
    <div className="panel">
      <h3>Demandes des prospects</h3>
      <p className="hint">
        Quand une entreprise demande ce qu&apos;on a sur elle, ou demande à être
        effacée, ça se traite ici. La loi te laisse un mois pour répondre.
      </p>
      <p className="hint" style={{ marginTop: 10 }}>
        La page à lui envoyer si elle demande d&apos;où vient son numéro :{" "}
        <a href="/prospection/confidentialite" target="_blank" rel="noreferrer">
          <b>spykeapp.fr/prospection/confidentialite</b>
        </a>
      </p>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="rgpd-q">Chercher l&apos;établissement</label>
        <input
          id="rgpd-q" type="text" placeholder="Nom ou numéro de téléphone"
          value={recherche}
          onChange={(e) => { setRecherche(e.target.value); setChoisi(null); setConfirmation(""); }}
        />
      </div>

      {trouves.length > 0 && !choisi && (
        <div className="rows" style={{ marginTop: 12 }}>
          {trouves.map((l) => (
            <button key={l.id} className="row" onClick={() => setChoisi(l)}>
              <span className="t"><b>{l.nom}</b><small>{l.ville} · {l.secteur}</small></span>
              <span className="p">{l.tel}</span>
            </button>
          ))}
        </div>
      )}

      {choisi && (
        <div style={{ marginTop: 16 }}>
          <div className="stat"><span>Établissement</span><b>{choisi.nom}</b></div>
          <div className="stat"><span>Téléphone</span><b>{choisi.tel ?? "—"}</b></div>

          <div className="btns">
            <button className="btn ghost" disabled={occupe} onClick={() => void exporter(choisi)}>
              Télécharger ce qu&apos;on a sur elle
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <label htmlFor="rgpd-c">
              Pour effacer, retape le nom : {choisi.nom}
            </label>
            <input
              id="rgpd-c" type="text" value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={choisi.nom}
            />
            <div className="btns">
              <button
                className="btn warn"
                disabled={occupe || norm(confirmation) !== norm(choisi.nom)}
                onClick={() => void effacer(choisi)}
              >
                Effacer définitivement
              </button>
              <button className="btn ghost" onClick={() => { setChoisi(null); setConfirmation(""); }}>
                Annuler
              </button>
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              La fiche, son historique et son affaire partent ensemble. On garde
              seulement une empreinte indéchiffrable de son numéro, pour ne pas
              la réimporter par erreur au prochain fichier.
            </p>
          </div>
        </div>
      )}

      {message && (
        <p className="hint" style={{ marginTop: 14, color: message.ok ? "var(--won)" : "var(--hot)" }}>
          {message.texte}
        </p>
      )}
    </div>
  );
}
