"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/lib/prospection/types";
import { jetonCourant } from "@/lib/prospection/auth";
import {
  ajouterCommercial,
  retirerCommercial,
  supprimerCommercial,
  fixerAdresseEnvoi,
} from "./actionsEquipe";

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
  const [aSupprimer, setASupprimer] = useState<Profile | null>(null);
  /* L'adresse d'expédition en cours de modification : l'identifiant du membre,
     et ce qui est tapé. Un seul à la fois, comme pour la suppression. */
  const [adresseDe, setAdresseDe] = useState<string | null>(null);
  const [adresse, setAdresse] = useState("");
  const [tel, setTel] = useState("");
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

  function enregistrerAdresse(id: string) {
    demarrer(async () => {
      const jeton = await jetonCourant();
      const r = await fixerAdresseEnvoi(jeton ?? "", id, adresse, tel);
      setMessage({ ok: r.ok, texte: r.ok ? r.message : r.erreur });
      if (r.ok) {
        setAdresseDe(null);
        await recharger();
      }
    });
  }

  function supprimer(id: string) {
    demarrer(async () => {
      const jeton = await jetonCourant();
      const r = await supprimerCommercial(jeton ?? "", id);
      setMessage({ ok: r.ok, texte: r.ok ? r.message : r.erreur });
      setASupprimer(null);
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
          <div key={m.id}>
            <div className="mem">
              <span className="t">
                <b>{m.nom}</b>
                <small>
                  {m.role === "admin" ? "Responsable" : "Commercial"}
                  {m.id === moi.id ? " · toi" : ""}
                  {m.email_envoi ? " · " + m.email_envoi : " · adresse par défaut"}
                </small>
              </span>
              <button
                className="lien"
                onClick={() => {
                  setAdresseDe(m.id);
                  setAdresse(m.email_envoi ?? "");
                  setTel(m.telephone ?? "");
                  setMessage(null);
                }}
                disabled={enCours}
              >
                Signature
              </button>
              {m.id !== moi.id && (
                <button className="x" onClick={() => retirer(m.id)} disabled={enCours}>
                  Retirer
                </button>
              )}
            </div>

            {adresseDe === m.id && (
              <div className="envoi">
                <label htmlFor={"ad-" + m.id}>
                  Adresse d&apos;expédition de {m.nom}
                </label>
                <input
                  id={"ad-" + m.id}
                  type="email"
                  placeholder="jb.perez@spykeconseil.fr"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
                <p className="hint" style={{ marginTop: 7 }}>
                  Ses e-mails de prospection partiront de cette adresse, et les
                  réponses des prospects y arriveront. Elle doit donc recevoir le
                  courrier : une vraie boîte, ou une redirection vers la sienne.
                  Laisse vide pour revenir à l&apos;adresse par défaut.
                </p>

                <div style={{ marginTop: 14 }}>
                  <label htmlFor={"tel-" + m.id}>Numéro dans sa signature</label>
                  <input
                    id={"tel-" + m.id}
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                  />
                  <p className="hint" style={{ marginTop: 7 }}>
                    Un prospect qui veut répondre vite décroche son téléphone
                    plutôt que d&apos;écrire. Laisse vide pour ne pas afficher de
                    numéro.
                  </p>
                </div>
                <div className="btns">
                  <button className="btn" disabled={enCours}
                    onClick={() => enregistrerAdresse(m.id)}>
                    {enCours ? "…" : "Enregistrer"}
                  </button>
                  <button className="btn ghost" onClick={() => setAdresseDe(null)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {partis.length > 0 && (
        <>
          <p className="hint" style={{ marginTop: 4 }}>
            Retirés de l&apos;équipe. Ils ne peuvent plus se connecter, mais leur
            prénom reste dans l&apos;historique des appels et leurs commissions
            dues restent visibles dans le pipeline. Les supprimer efface leur
            fiche et leur identifiant de connexion.
          </p>
          <div style={{ margin: "8px 0 4px" }}>
            {partis.map((m) => (
              <div className="mem" key={m.id}>
                <span className="t">
                  <b style={{ color: "var(--dead)" }}>{m.nom}</b>
                  <small>Parti</small>
                </span>
                <button className="x" onClick={() => { setASupprimer(m); setMessage(null); }}
                  disabled={enCours}>
                  Supprimer
                </button>
              </div>
            ))}
          </div>

          {aSupprimer && (
            <div className="confirme">
              <b>Supprimer {aSupprimer.nom} définitivement ?</b>
              <p>
                Sa fiche d&apos;équipe et son identifiant de connexion sont
                effacés. Son prénom reste lisible dans l&apos;historique des
                appels, mais les fiches qu&apos;il avait gagnées se détachent de
                lui : le pipeline ne saura plus à qui verser sa commission.
              </p>
              <div className="btns">
                <button className="btn warn" disabled={enCours}
                  onClick={() => supprimer(aSupprimer.id)}>
                  {enCours ? "…" : "Oui, supprimer"}
                </button>
                <button className="btn ghost" onClick={() => setASupprimer(null)}>
                  Annuler
                </button>
              </div>
            </div>
          )}
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
