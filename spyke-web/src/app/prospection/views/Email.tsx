"use client";

import { useRef, useState } from "react";
import type { Ctx } from "../App";
import type { Lead } from "@/lib/prospection/types";
import { jetonCourant } from "@/lib/prospection/auth";

type Piece = { nom: string; contenu: string; octets: number };

/** Le fichier en base64, sans le préfixe « data:...;base64, » que pose le navigateur. */
function lireBase64(f: File): Promise<string> {
  return new Promise((ok, non) => {
    const l = new FileReader();
    l.onload = () => ok(String(l.result).split(",")[1] ?? "");
    l.onerror = () => non(new Error("illisible"));
    l.readAsDataURL(f);
  });
}

function taille(o: number): string {
  if (o < 1000) return o + " o";
  if (o < 1_000_000) return Math.round(o / 1000) + " ko";
  return (o / 1_000_000).toFixed(1).replace(".", ",") + " Mo";
}

/**
 * Écrire à un prospect sans quitter sa fiche.
 *
 * L'objet et le corps sont pré-remplis avec ce que la fiche sait déjà : à ce
 * moment-là le commercial vient de raccrocher, il a trente secondes
 * d'attention, pas trois minutes.
 *
 * La signature n'est pas dans le brouillon. Elle est posée par le serveur, avec
 * le nom, le numéro et l'adresse du commercial : laissée au brouillon, elle
 * serait effacée une fois sur deux, et chacun finirait par signer à sa façon.
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
    ].join("\n")
  );
  const [copie, setCopie] = useState("");
  const [montrerCopie, setMontrerCopie] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const champFichier = useRef<HTMLInputElement>(null);

  const poids = pieces.reduce((n, p) => n + p.octets, 0);

  /**
   * Les fichiers sont lus ici, en base64, et voyagent dans le corps de la
   * requête. La limite de 2,5 Mo n'est pas celle d'une messagerie mais celle de
   * la plateforme : une fonction serveur refuse les requêtes au-delà de 4,5 Mo
   * et l'encodage gonfle les fichiers d'un tiers. On le dit ici, avant
   * l'envoi, plutôt que de laisser l'envoi échouer sans explication.
   */
  async function ajouterFichiers(liste: FileList | null) {
    if (!liste?.length) return;
    setErreur("");
    const ajout: Piece[] = [];

    for (const f of Array.from(liste)) {
      if (pieces.length + ajout.length >= 3) {
        setErreur("Trois pièces jointes au maximum.");
        break;
      }
      const contenu = await lireBase64(f).catch(() => null);
      if (!contenu) {
        setErreur(`« ${f.name} » n'a pas pu être lu.`);
        continue;
      }
      ajout.push({ nom: f.name, contenu, octets: f.size });
    }

    const total = poids + ajout.reduce((n, p) => n + p.octets, 0);
    if (total > 2_500_000) {
      setErreur(
        "Les pièces jointes dépassent 2,5 Mo. Envoie un lien de téléchargement " +
          "plutôt qu'un fichier lourd : il passera les filtres anti-spam, pas lui."
      );
      return;
    }
    setPieces((p) => [...p, ...ajout]);
    if (champFichier.current) champFichier.current.value = "";
  }

  async function envoyer() {
    setEnvoi(true);
    setErreur("");
    try {
      const jeton = (await jetonCourant()) ?? "";
      const r = await fetch("/api/prospection/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jeton,
          leadId: lead.id,
          objet,
          message,
          copie,
          pieces: pieces.map((p) => ({ nom: p.nom, contenu: p.contenu })),
        }),
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
        À <b>{lead.email}</b>. Ta signature est ajoutée automatiquement à la fin,
        avec ton numéro et ton adresse : n&apos;en écris pas une.
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

      <div style={{ marginTop: 14 }}>
        <label htmlFor="e-pj">Pièces jointes</label>
        <input
          id="e-pj" ref={champFichier} type="file" multiple
          onChange={(e) => void ajouterFichiers(e.target.files)}
        />
        {pieces.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {pieces.map((p, i) => (
              <div className="pj" key={p.nom + i}>
                <span className="t">
                  <b>{p.nom}</b>
                  <small>{taille(p.octets)}</small>
                </span>
                <button
                  className="x"
                  onClick={() => setPieces((l) => l.filter((_, j) => j !== i))}
                >
                  Retirer
                </button>
              </div>
            ))}
            <p className="hint" style={{ marginTop: 7 }}>
              {taille(poids)} sur 2,5 Mo.
            </p>
          </div>
        )}
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
