"use client";

import { useActionState } from "react";
import type { Profile } from "@/lib/prospection/types";
import { ajouterCommercial, retirerCommercial } from "./actionsEquipe";

export default function Equipe({
  moi,
  equipe,
}: {
  moi: Profile;
  equipe: Profile[];
}) {
  const [ajout, ajouter, ajoutEnCours] = useActionState(ajouterCommercial, null);
  const [retrait, retirer, retraitEnCours] = useActionState(retirerCommercial, null);

  const actifs = equipe.filter((m) => m.actif);
  const partis = equipe.filter((m) => !m.actif);
  const message = ajout ?? retrait;

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
              <form action={retirer}>
                <input type="hidden" name="membreId" value={m.id} />
                <button className="x" type="submit" disabled={retraitEnCours}>
                  Retirer
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {partis.length > 0 && (
        <>
          <p className="hint" style={{ marginTop: 4 }}>
            Retirés de l&apos;équipe. Ils ne peuvent plus se connecter, mais
            leur prénom reste dans l&apos;historique des appels et leurs
            commissions dues restent visibles dans le pipeline.
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

      <form action={ajouter}>
        <div className="row2">
          <div>
            <label htmlFor="mName">Prénom</label>
            <input type="text" id="mName" name="nom" placeholder="Youcef" />
          </div>
          <div>
            <label htmlFor="mMail">E-mail</label>
            <input
              type="email"
              id="mMail"
              name="email"
              placeholder="youcef@spyke.fr"
            />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label htmlFor="mPwd">Mot de passe provisoire</label>
          <input
            type="text"
            id="mPwd"
            name="mdp"
            placeholder="8 caractères minimum"
          />
        </div>
        <div className="btns">
          <button className="btn" type="submit" disabled={ajoutEnCours}>
            {ajoutEnCours ? "…" : "Ajouter un commercial"}
          </button>
        </div>
      </form>

      {message && (
        <p
          className="hint"
          style={{
            marginTop: 12,
            color: message.ok ? "var(--won)" : "var(--hot)",
          }}
        >
          {message.ok ? message.message : message.erreur}
        </p>
      )}

      <p className="hint" style={{ marginTop: 12 }}>
        Les notes que vous écrivez sur une fiche sont communicables à la personne
        concernée si elle les demande. N&apos;y mettez rien que vous ne
        diriez pas devant elle.
      </p>
    </div>
  );
}
