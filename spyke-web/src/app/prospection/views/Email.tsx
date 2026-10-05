"use client";

import { useState } from "react";
import type { Ctx } from "../App";
import type { Lead } from "@/lib/prospection/types";
import { jetonCourant } from "@/lib/prospection/auth";

/**
 * Écrire à un prospect sans quitter sa fiche.
 *
 * Le message part de la boîte de l'entreprise, signé du prénom du commercial,
 * et les réponses lui reviennent directement. L'objet et le corps sont
 * pré-remplis avec ce que la fiche sait déjà : à ce moment-là le commercial
 * vient de raccrocher, il a trente secondes d'attention, pas trois minutes.
 */
export default function Email({ ctx, lead }: { ctx: Ctx; lead: Lead }) {
  const [objet, setObjet] = useState(`Suite à notre échange, ${lead.nom}`);
  const [message, setMessage] = useState(
    [
      lead.decideur ? `Bonjour ${lead.decideur},` : "Bonjour,",
      "",
      "Je fais suite à notre échange téléphonique.",
      "",
      "",
      ctx.moi.nom,
      "Spyke",
    ].join("\n")
  );
  const [copie, setCopie] = useState("");
  const [montrerCopie, setMontrerCopie] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer() {
    setEnvoi(true);
    setErreur("");
    try {
      const jeton = (await jetonCourant()) ?? "";
      const r = await fetch("/api/prospection/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton, leadId: lead.id, objet, message, copie }),
      });
      const d = (await r.json()) as { ok: boolean; erreur?: string };
      if (!d.ok) {
        setErreur(d.erreur ?? "Envoi impossible.");
        setEnvoi(false);
        return;
      }
      ctx.toast("E-mail envoyé");
      ctx.fermerSheet();
      void ctx.recharger();
    } catch {
      setErreur("Pas de réseau. L'e-mail n'est pas parti.");
      setEnvoi(false);
    }
  }

  return (
    <div className="panel" style={{ margin: 0, border: 0, boxShadow: "none" }}>
      <h3>Écrire à {lead.nom}</h3>
      <p className="hint">
        À <b>{lead.email}</b>. Le message part de la boîte de l&apos;entreprise,
        signé de ton prénom, et la réponse t&apos;arrive directement.
      </p>

      <div style={{ marginTop: 16 }}>
        <label htmlFor="e-obj">Objet</label>
        <input
          id="e-obj" type="text" value={objet}
          onChange={(e) => setObjet(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label htmlFor="e-msg">Message</label>
        <textarea
          id="e-msg" value={message} rows={12}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {montrerCopie ? (
        <div style={{ marginTop: 12 }}>
          <label htmlFor="e-cc">Copie cachée</label>
          <input
            id="e-cc" type="text" value={copie}
            placeholder="une ou plusieurs adresses, séparées par des virgules"
            onChange={(e) => setCopie(e.target.value)}
          />
          <p className="hint" style={{ marginTop: 6 }}>
            Le prospect ne les verra pas. Elles s&apos;ajoutent aux adresses de
            supervision déjà réglées, s&apos;il y en a.
          </p>
        </div>
      ) : (
        <button
          className="alt"
          style={{ marginTop: 12 }}
          onClick={() => setMontrerCopie(true)}
        >
          Ajouter une copie cachée
        </button>
      )}

      {erreur && (
        <p className="hint" style={{ marginTop: 12, color: "var(--hot)" }}>{erreur}</p>
      )}

      <div className="btns">
        <button className="btn" onClick={() => void envoyer()} disabled={envoi}>
          {envoi ? "Envoi…" : "Envoyer"}
        </button>
        <button className="btn ghost" onClick={ctx.fermerSheet} disabled={envoi}>
          Annuler
        </button>
      </div>

      <p className="hint" style={{ marginTop: 14 }}>
        Ce message est une prospection commerciale. La personne peut demander à
        ne plus être contactée : respecte-le sans discuter, et marque la fiche
        « Pas intéressé ».
      </p>
    </div>
  );
}
