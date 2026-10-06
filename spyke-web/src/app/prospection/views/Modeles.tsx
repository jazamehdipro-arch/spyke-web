"use client";

import { useMemo, useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import type { Modele } from "@/lib/prospection/types";

/**
 * Les modèles d'e-mail, modifiables sans passer par un développeur.
 *
 * Sans cet écran, chaque virgule d'un message de prospection demanderait une
 * mise en production. Les textes vivent plus vite que le code : ils se
 * corrigent après chaque semaine d'appels.
 *
 * Le secteur se choisit parmi ceux qui existent réellement dans le fichier,
 * jamais en le tapant : un modèle rangé sous « Notaire » au singulier ne
 * s'afficherait sur aucune fiche, et personne ne comprendrait pourquoi.
 */
export default function Modeles({ ctx }: { ctx: Ctx }) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [titre, setTitre] = useState("");
  const [objet, setObjet] = useState("");
  const [corps, setCorps] = useState("");
  const [secteur, setSecteur] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  const secteurs = useMemo(
    () => [...new Set(ctx.d.leads.map((l) => l.secteur))].sort(),
    [ctx.d.leads]
  );

  /* Groupés par secteur, dans l'ordre d'usage : d'abord ceux qui valent pour
     toutes les fiches, puis chaque secteur. */
  const groupes = useMemo(() => {
    const g = new Map<string, Modele[]>();
    for (const m of [...ctx.d.modeles].sort((a, b) => a.rang - b.rang)) {
      const l = g.get(m.secteur) ?? [];
      l.push(m);
      g.set(m.secteur, l);
    }
    return [...g.entries()].sort((a, b) =>
      a[0] === "" ? -1 : b[0] === "" ? 1 : a[0].localeCompare(b[0], "fr")
    );
  }, [ctx.d.modeles]);

  function ouvrir(m: Modele) {
    setOuvert(m.id);
    setTitre(m.titre);
    setObjet(m.objet);
    setCorps(m.corps);
    setSecteur(m.secteur);
    setMessage(null);
  }

  async function enregistrer(id: string) {
    setOccupe(true);
    try {
      await q.majModele(id, {
        titre: titre.trim(),
        objet: objet.trim(),
        corps: corps.trim(),
        secteur,
      });
      setMessage({ ok: true, texte: "Modèle enregistré." });
      setOuvert(null);
      await ctx.recharger();
    } catch (e) {
      setMessage({
        ok: false,
        texte: (e as { message?: string }).message ?? "Enregistrement impossible.",
      });
    }
    setOccupe(false);
  }

  async function basculer(m: Modele) {
    try {
      await q.majModele(m.id, { actif: !m.actif });
      await ctx.recharger();
    } catch {
      setMessage({ ok: false, texte: "Modification impossible." });
    }
  }

  if (!ctx.d.modeles.length) return null;

  return (
    <div className="panel">
      <h3>Modèles d&apos;e-mail</h3>
      <p className="hint">
        Ce que tes commerciaux voient dans la liste déroulante quand ils écrivent
        à un prospect. Chaque modèle n&apos;apparaît que sur les fiches de son
        secteur. Les textes entre doubles accolades sont remplis tout seuls à
        partir de la fiche.
      </p>

      {groupes.map(([sect, liste]) => (
        <div key={sect || "_tous"} style={{ marginTop: 18 }}>
          <div className="sechead" style={{ padding: 0, marginBottom: 8 }}>
            {sect || "Tous les secteurs"}
            {sect && !secteurs.includes(sect) && " · aucune fiche dans ce secteur"}
          </div>

          {liste.map((m) => (
            <div key={m.id}>
              <div className="mem">
                <span className="t">
                  <b style={{ color: m.actif ? undefined : "var(--dead)" }}>{m.titre}</b>
                  <small>
                    {m.objet}
                    {m.piece && " · à joindre : " + m.piece}
                  </small>
                </span>
                <button className="lien" onClick={() => ouvrir(m)} disabled={occupe}>
                  Modifier
                </button>
                <button className="lien" onClick={() => void basculer(m)} disabled={occupe}>
                  {m.actif ? "Masquer" : "Afficher"}
                </button>
              </div>

              {ouvert === m.id && (
                <div className="envoi">
                  <label htmlFor={"m-t-" + m.id}>Titre, vu par le commercial</label>
                  <input
                    id={"m-t-" + m.id} type="text" value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                  />

                  <div style={{ marginTop: 12 }}>
                    <label htmlFor={"m-s-" + m.id}>Secteur</label>
                    <select
                      id={"m-s-" + m.id} value={secteur}
                      onChange={(e) => setSecteur(e.target.value)}
                    >
                      <option value="">Tous les secteurs</option>
                      {secteurs.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      {secteur && !secteurs.includes(secteur) && (
                        <option value={secteur}>{secteur} (aucune fiche)</option>
                      )}
                    </select>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label htmlFor={"m-o-" + m.id}>Objet</label>
                    <input
                      id={"m-o-" + m.id} type="text" value={objet}
                      onChange={(e) => setObjet(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label htmlFor={"m-c-" + m.id}>Message</label>
                    <textarea
                      id={"m-c-" + m.id} value={corps} rows={14}
                      onChange={(e) => setCorps(e.target.value)}
                    />
                  </div>

                  {m.options.length > 0 && (
                    <p className="hint" style={{ marginTop: 9 }}>
                      Ce modèle porte {m.options.length} points à cocher. Ils se
                      posent là où le message contient{" "}
                      <code>{"{{problemes}}"}</code> et{" "}
                      <code>{"{{solutions}}"}</code>. Leur contenu ne se modifie
                      pas encore depuis ici.
                    </p>
                  )}

                  <div className="btns">
                    <button className="btn" disabled={occupe || !objet.trim() || !corps.trim()}
                      onClick={() => void enregistrer(m.id)}>
                      {occupe ? "…" : "Enregistrer"}
                    </button>
                    <button className="btn ghost" onClick={() => setOuvert(null)}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {message && (
        <p className="hint" style={{ marginTop: 14, color: message.ok ? "var(--won)" : "var(--hot)" }}>
          {message.texte}
        </p>
      )}

      <p className="hint" style={{ marginTop: 16 }}>
        Variables disponibles : <code>{"{{cabinet}}"}</code>,{" "}
        <code>{"{{appel}}"}</code>, <code>{"{{date_appel}}"}</code>,{" "}
        <code>{"{{date_rappel}}"}</code>, <code>{"{{creneau_1}}"}</code>,{" "}
        <code>{"{{creneau_2}}"}</code>, <code>{"{{date_rdv}}"}</code>,{" "}
        <code>{"{{heure_rdv}}"}</code>, <code>{"{{adresse_rdv}}"}</code>,{" "}
        <code>{"{{nom_consultant}}"}</code>. Une variable que l&apos;outil ne sait
        pas remplir reste visible et bloque l&apos;envoi tant qu&apos;elle est là.
        N&apos;écris pas de signature : elle est ajoutée automatiquement.
      </p>
    </div>
  );
}
