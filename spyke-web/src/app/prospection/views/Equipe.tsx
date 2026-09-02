"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/lib/prospection/types";
import { jetonCourant } from "@/lib/prospection/auth";
import { ajouterCommercial, retirerCommercial } from "./actionsEquipe";

type Message = { ok: boolean; texte: string } | null;

export default function Equipe({
  moi,
  equipe,
  recharger,
}: {
  moi: Profile;
  equipe: Profile[];
  recharger: () => Promise<void>;
}) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [enCours, demarrer] = useTransition();

  const actifs = equipe.filter((m) => m.actif);
  const partis = equipe.filter((m) => !m.actif);

  function ajouter() {
    demarrer(async () => {
      const jeton = await jetonCourant();
      const r = await ajouterCommercial(jeton ?? "", nom, email, mdp);
      setMessage({ ok: r.ok, texte: r.ok ? r.message : r.erreur });
      if (r.ok) {
        setNom(""); setEmail(""); setMdp("");
        await recharger();
      }
    });
  }

  function retirer(id: string) {
    demarrer(async () => {
      const jeton = await jetonCourant();
      const r = await retirerCommercial(jeton ?? "", id);
      setMessage({ ok: r.ok, texte: r.ok ? r.message : r.erreur });
      if (r.ok) await recharger();
    });
  }

  return (
    <div className="panel">
      <h3>L&apos;équipe</h3>
      <p className="hint">
        Chaque personne se connecte avec son e-mail et son mot de passe. Un
        commercial ne voit que la file, la liste et l&apos;agenda, et ne
        travaille que sur ses propres fiches plus celles que personne n&apos;a
        encore prises.
      </p>

      <div style={{ margin: "12px 0" }}>
        {actifs.map((m) => (
          <div className="mem" key={m.id}>
            <span className="t">
              <b>{m.nom}</b>
              <small>
                {m.role === "admin" ? "Responsable" : "Commercial"}
                {m.id === moi.id ? " · toi" : ""}
              </small>
            </span>
            {m.id !== moi.id && (
              <button className="x" onClick={() => retirer(m.id)} disabled={enCours}>
                Retirer
              </button>
            )}
          </div>
        ))}
      </div>

      {partis.length > 0 && (
        <>
          <p className="hint" style={{ marginTop: 4 }}>
            Retirés de l&apos;équipe. Ils ne peuvent plus se connecter, mais leur
            prénom reste dans l&apos;historique des appels et leurs commissions
            dues restent visibles dans le pipeline.
          </p>
          <div style={{ margin: "8px 0 4px" }}>
            {partis.map((m) => (
              <div className="mem" key={m.id}>
                <span className="t">
                  <b style={{ color: "var(--dead)" }}>{m.nom}</b>
                  <small>Parti</small>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="row2">
        <div>
          <label htmlFor="mName">Prénom</label>
          <input id="mName" type="text" placeholder="Youcef" value={nom}
            onChange={(e) => setNom(e.target.value)} />
        </div>
        <div>
          <label htmlFor="mMail">E-mail</label>
          <input id="mMail" type="email" placeholder="youcef@spyke.fr" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <label htmlFor="mPwd">Mot de passe provisoire</label>
        <input id="mPwd" type="text" placeholder="8 caractères minimum" value={mdp}
          onChange={(e) => setMdp(e.target.value)} />
      </div>
      <div className="btns">
        <button className="btn" onClick={ajouter} disabled={enCours}>
          {enCours ? "…" : "Ajouter un commercial"}
        </button>
      </div>

      {message && (
        <p className="hint" style={{ marginTop: 12, color: message.ok ? "var(--won)" : "var(--hot)" }}>
          {message.texte}
        </p>
      )}

      <p className="hint" style={{ marginTop: 12 }}>
        Les notes que vous écrivez sur une fiche sont communicables à la personne
        concernée si elle les demande. N&apos;y mettez rien que vous ne diriez
        pas devant elle.
      </p>
    </div>
  );
}
