"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import type { Activity, Lead, Statut } from "@/lib/prospection/types";
import { STATUS } from "@/lib/prospection/types";
import { enE164, estMobile, fmtD, today } from "@/lib/prospection/format";
import { appeler as appelerDepuisLeSite, autoriserMicro, etatCourant } from "@/lib/prospection/telephone";
import { jetonCourant } from "@/lib/prospection/auth";
import { ficheSuivanteLocale } from "@/lib/prospection/horsligne";
import ChoixCreneau from "./ChoixCreneau";

/** Les six boutons de résultat d'appel, dans l'ordre du prototype. */
const RESULTATS: [Statut, string, string][] = [
  ["chaud", "Chaud", "act hot"],
  ["tiede", "Tiède", "act warm"],
  ["rdv", "RDV calé", "act won"],
  ["rappeler", "À rappeler", "act"],
  ["injoignable", "Injoignable", "act dead"],
  ["refus", "Pas intéressé", "act dead"],
];

export default function VueFile({ ctx }: { ctx: Ctx }) {
  const [secteur, setSecteur] = useState<string | null>(null);
  /* Deux files distinctes. « Neufs » est le travail du jour : des fiches jamais
     appelées. « Rappels » regroupe les échéances atteintes. Une fiche déjà
     qualifiée ne revient plus s'imposer entre deux appels — on la retrouve dans
     la Liste quand on la cherche. */
  const [mode, setMode] = useState<"neufs" | "rappels">("neufs");
  const [fiche, setFiche] = useState<Lead | null | undefined>(undefined);
  const [hist, setHist] = useState<Activity[]>([]);
  const [sautees, setSautees] = useState<string[]>([]);
  const [rappel, setRappel] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const enCours = useRef(false);

  /* Les fiches et l'historique servent au repli hors ligne, mais ils ne doivent
     pas entrer dans les dépendances de « servir » : ils changent d'identité à
     chaque rechargement, ce qui recrée la fonction, relance l'effet de
     démarrage, et resert la file depuis le début. « Passer cette fiche »
     redonnait ainsi la fiche qu'on venait d'écarter. */
  const dernier = useRef(ctx.d);
  dernier.current = ctx.d;

  const servir = useCallback(
    async (skip: string[]) => {
      if (enCours.current) return;
      enCours.current = true;
      try {
        let l: Lead | null;
        let hors = false;
        try {
          l = await q.ficheSuivante(secteur, skip, mode);
        } catch {
          // Pas de réseau : la file est calculée ici, avec exactement l'ordre
          // de lead_rank() en base. Le commercial continue d'appeler.
          hors = true;
          l = ficheSuivanteLocale(dernier.current.leads, secteur, skip, ctx.moi.id, today(), mode);
        }
        setFiche(l);
        setRappel(l?.rappel ?? "");
        setContact(l?.contact ?? "");
        setNotes(l?.notes ?? "");
        if (!l) setHist([]);
        else if (hors) {
          setHist(
            dernier.current.activities.filter((a) => a.lead_id === l!.id).slice(0, 20)
          );
        } else {
          setHist(await q.historique(l.id));
        }
      } catch {
        setFiche(null);
      } finally {
        enCours.current = false;
      }
    },
    [secteur, mode, ctx.moi.id]
  );

  useEffect(() => {
    // La fiche suivante vient du serveur : l'état n'est posé qu'après la
    // réponse, pas pendant le rendu. La règle ne distingue pas les deux cas.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void servir([]);
  }, [servir]);

  /* Changer de secteur repart d'une file vierge. */
  function choisirSecteur(s: string | null) {
    setSautees([]);
    setSecteur(s);
  }

  function choisirMode(m: "neufs" | "rappels") {
    setSautees([]);
    setMode(m);
  }

  /* Enregistre ce qui est tapé dans les champs avant de changer de fiche. */
  const enregistrerChamps = useCallback(async () => {
    if (!fiche) return;
    const patch: Partial<Lead> = {};
    if ((fiche.rappel ?? "") !== rappel) patch.rappel = rappel || null;
    if (fiche.contact !== contact) patch.contact = contact;
    if (fiche.notes !== notes) patch.notes = notes;
    if (Object.keys(patch).length) await q.majLead(fiche.id, patch);
  }, [fiche, rappel, contact, notes]);

  /**
   * Un clic sur le numéro. Si Ringover est chargé et connecté, l'appel part
   * d'ici et le lien « tel: » est neutralisé. Sinon on le laisse agir : sur un
   * téléphone il ouvre le clavier, sur un ordinateur il passe la main au
   * logiciel installé s'il y en a un. Dans tous les cas, l'appel est noté.
   */
  async function appeler(e?: React.MouseEvent) {
    if (!fiche) return;
    const e164 = enE164(fiche.tel);
    // Quand le clavier de l'opérateur est ouvert et connecté, l'appel part du
    // serveur et le lien « tel: » est neutralisé. Sinon on le laisse agir : sur
    // un téléphone il ouvre le clavier, sur un ordinateur il passe la main au
    // logiciel installé s'il y en a un.
    if (e164 && etatCourant() === "pret") {
      e?.preventDefault();
      // Le micro se demande pendant le clic : c'est le seul moment où Chrome
      // accepte d'afficher sa question. Le jeton, lui, peut attendre.
      const micro = autoriserMicro();
      const jeton = (await jetonCourant()) ?? "";
      await micro;
      void appelerDepuisLeSite(e164, jeton);
    }
    try {
      await q.noter(fiche.id, "Appel passé", ctx.moi.id);
      setHist(await q.historique(fiche.id));
      void ctx.recharger();
    } catch {
      ctx.toast("Appel non enregistré, il repartira à la reconnexion");
    }
  }

  async function poser(statut: Statut) {
    if (!fiche) return;
    await enregistrerChamps();

    if (statut === "rdv") {
      // Caler un rendez-vous sans réseau reviendrait à promettre un horaire
      // qu'un collègue vient peut-être de prendre : seule la base peut garantir
      // qu'un créneau réservé est bloqué pour tout le monde. On refuse et on le
      // dit, plutôt que de faire déplacer quelqu'un pour rien.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        ctx.toast("Pas de réseau : note « chaud » et cale le RDV en revenant");
        return;
      }
      ctx.ouvrirSheet(<ChoixCreneau ctx={ctx} lead={fiche} />);
      return;
    }

    let dateRappel = rappel;
    if (statut === "rappeler" && !dateRappel) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dateRappel = d.toLocaleDateString("sv-SE");
    }

    try {
      await q.majLead(fiche.id, {
        statut,
        rdv: null,
        rappel: dateRappel || null,
        contact,
        notes,
      });
      await q.noter(
        fiche.id,
        STATUS[statut].l + (statut === "rappeler" ? " le " + fmtD(dateRappel) : ""),
        ctx.moi.id
      );
      ctx.toast(STATUS[statut].l + " · enregistré");
      void ctx.recharger();
      await servir(sautees);
    } catch (e) {
      ctx.toast((e as { message?: string }).message ?? "Enregistrement impossible");
    }
  }

  async function passer() {
    if (!fiche) return;
    await enregistrerChamps();
    const skip = [...sautees, fiche.id];
    setSautees(skip);
    await q.relacherFiche(fiche.id).catch(() => {});
    await servir(skip);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ------------------------------------------------------------- bannières */
  const dus = ctx.d.leads.filter(
    (l) => l.statut === "rappeler" && l.rappel && l.rappel <= today()
  );
  const aCloturer = ctx.d.leads.filter(
    (l) => l.statut === "rdv" && l.rdv && l.rdv.slice(0, 10) < today() && l.rdv_honore === null
  );

  const secteurs = [...new Set(ctx.d.leads.map((l) => l.secteur))].sort();
  /* « Jamais composée », pas « à appeler » : le statut ne bouge que si le
     commercial clique un des six boutons de résultat, alors qu'il a bel et bien
     appelé. first_call est posé dès le clic sur le numéro. */
  const neufs = ctx.d.leads.filter(
    (l) => l.statut === "a_appeler" && l.first_call === null
  ).length;
  /* Le compteur d'un secteur suit la file affichée : sinon il annoncerait des
     fiches que le bouton ne sert pas. */
  const enFile = (s: string | null) =>
    ctx.d.leads.filter(
      (l) =>
        (s === null || l.secteur === s) &&
        (mode === "rappels"
          ? l.statut === "rappeler" && !!l.rappel && l.rappel <= today()
          : l.statut === "a_appeler" && l.first_call === null)
    ).length;

  return (
    <>
      <div id="alerts">
        {dus.length > 0 && (
          <div className="alert">
            <span className="t">
              <b>
                {dus.length} rappel{dus.length > 1 ? "s" : ""} à passer aujourd&apos;hui
              </b>
              <small>
                {dus.slice(0, 3).map((l) => l.nom).join(", ")}
                {dus.length > 3 && ` et ${dus.length - 3} autre${dus.length > 4 ? "s" : ""}`}
              </small>
            </span>
            <button onClick={() => choisirMode("rappels")}>
              Les traiter
            </button>
          </div>
        )}
        {aCloturer.length > 0 && (
          <div className="alert warn">
            <span className="t">
              <b>{aCloturer.length} rendez-vous à clôturer</b>
              <small>Indique s&apos;ils ont été honorés ou si le client ne s&apos;est pas présenté.</small>
            </span>
            <button onClick={() => ctx.allerA("agenda")}>Traiter</button>
          </div>
        )}
      </div>

      <div className="chips">
        <button className="chip" aria-pressed={mode === "neufs"}
          onClick={() => choisirMode("neufs")}>
          À appeler<span className="c">{neufs}</span>
        </button>
        <button className="chip" aria-pressed={mode === "rappels"}
          onClick={() => choisirMode("rappels")}>
          Rappels<span className="c">{dus.length}</span>
        </button>
      </div>

      <div className="chips">
        <button
          className="chip"
          aria-pressed={secteur === null}
          onClick={() => choisirSecteur(null)}
        >
          Tous<span className="c">{enFile(null)}</span>
        </button>
        {secteurs.map((s) => (
          <button
            key={s}
            className="chip"
            aria-pressed={secteur === s}
            onClick={() => choisirSecteur(s)}
          >
            {s}<span className="c">{enFile(s)}</span>
          </button>
        ))}
      </div>

      {fiche === undefined ? (
        <div className="empty"><b>Chargement…</b><p>Recherche de la fiche suivante.</p></div>
      ) : fiche === null ? (
        ctx.d.leads.length === 0 ? (
          <div className="empty">
            <b>Aucune fiche</b>
            <p>Va dans Réglages pour importer un CSV. La file d&apos;appel se remplira toute seule.</p>
          </div>
        ) : (
          <div className="empty">
            <b>{mode === "rappels" ? "Aucun rappel dû" : "File terminée"}</b>
            <p>
              {mode === "rappels"
                ? "Rien à rappeler aujourd'hui dans ce secteur. Reviens demain ou repasse aux fiches à appeler."
                : "Plus aucune fiche jamais appelée dans ce secteur. Change de secteur, ou passe à la Liste pour revoir celles que tu as déjà traitées."}
            </p>
          </div>
        )
      ) : (
        <>
          <div className="card">
            <div className="card-h">
              <div className="meta">
                <span className={"tagp " + fiche.prio.toLowerCase()}>{fiche.prio}</span>
                <span className="sect">{fiche.secteur}</span>
                {fiche.statut === "rappeler" && fiche.rappel && fiche.rappel <= today() && (
                  <span className="tagp a">RAPPEL DU {fmtD(fiche.rappel)}</span>
                )}
              </div>
              <div className="name">{fiche.nom}</div>
              <div className="addr">
                {fiche.adresse}
                {fiche.ville && (fiche.adresse ? " · " : "") + fiche.ville} {fiche.cp}
              </div>
              {fiche.nb_avis != null && (
                <div className="rev">
                  {fiche.note_google}/5 · {fiche.nb_avis} avis Google
                </div>
              )}
            </div>

            {fiche.tel ? (
              <a
                className={"dial" + (estMobile(fiche.tel) ? " mob" : "")}
                href={"tel:" + fiche.tel.replace(/\s/g, "")}
                onClick={appeler}
              >
                <div className="num">{fiche.tel}</div>
                <div className="cta">
                  {estMobile(fiche.tel) ? "Ligne directe · Appeler" : "Appeler le standard"}
                </div>
              </a>
            ) : (
              <div className="dial">
                <div className="num">—</div>
                <div className="cta">Numéro manquant</div>
              </div>
            )}

            <div className="sechead">Résultat de l&apos;appel</div>
            <div className="acts">
              {RESULTATS.map(([s, lab, cls]) => (
                <button key={s} className={cls} onClick={() => poser(s)}>
                  {lab}
                </button>
              ))}
            </div>

            <div className="fields">
              <div className="row2">
                <div>
                  <label htmlFor="f-rap">Rappeler le</label>
                  <input
                    type="date" id="f-rap" value={rappel}
                    onChange={(e) => setRappel(e.target.value)}
                    onBlur={enregistrerChamps}
                  />
                </div>
                <div>
                  <label htmlFor="f-int">Interlocuteur</label>
                  <input
                    type="text" id="f-int" value={contact} placeholder="Nom, fonction"
                    onChange={(e) => setContact(e.target.value)}
                    onBlur={enregistrerChamps}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="f-not">Notes</label>
                <textarea
                  id="f-not" value={notes}
                  placeholder="Ce qu'il a dit, ce qu'il faut retenir…"
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={enregistrerChamps}
                />
                <p className="hint" style={{ marginTop: 6 }}>
                  Ces notes sont communicables à la personne concernée si elle les demande.
                </p>
              </div>
            </div>

            {hist.length > 0 && (
              <div className="log">
                <div className="sechead" style={{ padding: "0 0 7px" }}>Historique</div>
                <ul>
                  {hist.slice(0, 6).map((h) => (
                    <li key={h.id}>
                      <time>{fmtD(h.date)}</time>
                      <span>{h.label}{h.author_nom ? " · " + h.author_nom : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button className="skip" onClick={passer}>
            Passer cette fiche
          </button>
        </>
      )}
    </>
  );
}
