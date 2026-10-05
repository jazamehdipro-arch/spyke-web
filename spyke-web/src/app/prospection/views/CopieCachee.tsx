"use client";

import { useEffect, useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";

/**
 * Les adresses mises en copie cachée de tous les e-mails de prospection.
 *
 * C'est le réglage de supervision : le responsable reçoit une copie de ce que
 * l'équipe écrit, sans que le prospect le sache. Il vaut pour toute l'équipe et
 * ne se change que d'ici, parce que c'est une décision d'organisation et pas un
 * choix de commercial.
 */
export default function CopieCachee({ ctx }: { ctx: Ctx }) {
  const [valeur, setValeur] = useState("");
  const [charge, setCharge] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  useEffect(() => {
    q.copieCachee()
      .then((l) => setValeur(l.join(", ")))
      .catch(() => setMessage({ ok: false, texte: "Réglage illisible." }))
      .finally(() => setCharge(true));
  }, []);

  async function enregistrer() {
    const liste = valeur
      .split(/[,;\s]+/)
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    const mauvaise = liste.find((a) => !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(a));
    if (mauvaise) {
      setMessage({ ok: false, texte: `« ${mauvaise} » n'est pas une adresse valide.` });
      return;
    }

    setOccupe(true);
    try {
      await q.fixerCopieCachee(liste);
      setValeur(liste.join(", "));
      setMessage({
        ok: true,
        texte: liste.length
          ? `Copie cachée vers ${liste.join(", ")}.`
          : "Plus personne en copie cachée.",
      });
      ctx.toast("Réglage enregistré");
    } catch (e) {
      setMessage({
        ok: false,
        texte: (e as { message?: string }).message ?? "Enregistrement impossible.",
      });
    }
    setOccupe(false);
  }

  return (
    <div className="panel">
      <h3>Copie cachée des e-mails</h3>
      <p className="hint">
        Ces adresses reçoivent une copie de chaque e-mail envoyé aux prospects,
        par toi comme par tes commerciaux. Le prospect ne les voit pas, et les
        commerciaux non plus. Laisse vide pour n&apos;envoyer de copie à
        personne.
      </p>

      <div style={{ marginTop: 14 }}>
        <label htmlFor="bcc">Adresses, séparées par des virgules</label>
        <input
          id="bcc" type="text" value={valeur} disabled={!charge}
          placeholder="mehdi@spykeconseil.fr"
          onChange={(e) => setValeur(e.target.value)}
        />
      </div>

      <div className="btns">
        <button className="btn" disabled={occupe || !charge} onClick={() => void enregistrer()}>
          {occupe ? "…" : "Enregistrer"}
        </button>
      </div>

      {message && (
        <p className="hint" style={{ marginTop: 12, color: message.ok ? "var(--won)" : "var(--hot)" }}>
          {message.texte}
        </p>
      )}

      <p className="hint" style={{ marginTop: 12 }}>
        Cinq adresses au maximum. Au-delà, les messageries considèrent l&apos;envoi
        comme une diffusion de masse et le classent en indésirable.
      </p>
    </div>
  );
}
