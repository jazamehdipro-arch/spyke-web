"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import type { Activity, Filtres, Lead, Prio, Statut } from "@/lib/prospection/types";
import { SANS_FILTRE, STATUS } from "@/lib/prospection/types";
import { enE164, estMobile, fmtD, norm, today } from "@/lib/prospection/format";
import { appeler as appelerDepuisLeSite, autoriserMicro, etatCourant } from "@/lib/prospection/telephone";
import { jetonCourant } from "@/lib/prospection/auth";
import { correspond, ficheSuivanteLocale } from "@/lib/prospection/horsligne";
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

/**
 * L'adresse en une ligne, sans répéter ce qu'elle contient déjà.
 *
 * Les fichiers donnent l'adresse complète — « 27 rue Ferrandière, 69002 Lyon »
 * — et, à côté, la ville et le code postal dans leurs propres colonnes. Les
 * coller bout à bout affichait « 27 rue Ferrandière, 69002 Lyon · Lyon 69002 ».
 */
function adresseLisible(l: Lead): string {
  const bouts = [l.adresse.trim()];
  const deja = norm(l.adresse);
  if (l.ville && !deja.includes(norm(l.ville))) bouts.push(l.ville);
  if (l.cp && !deja.includes(l.cp)) bouts.push(l.cp);
  return bouts.filter(Boolean).join(" · ");
}

export default function VueFile({ ctx }: { ctx: Ctx }) {
  const [filtres, setFiltres] = useState<Filtres>(SANS_FILTRE);
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
          l = await q.ficheSuivante(filtres, skip, mode);
        } catch {
          // Pas de réseau : la file est calculée ici, avec exactement l'ordre
          // de lead_rank() en base. Le commercial continue d'appeler.
          hors = true;
          l = ficheSuivanteLocale(dernier.current.leads, filtres, skip, ctx.moi.id, today(), mode);
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
    [filtres, mode, ctx.moi.id]
  );

  useEffect(() => {
    // La fiche suivante vient du serveur : l'état n'est posé qu'après la
    // réponse, pas pendant le rendu. La règle ne distingue pas les deux cas.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void servir([]);
  }, [servir]);

  /* Changer un critère repart d'une file vierge : les fiches écartées l'ont
     été pour l'ancienne sélection, pas pour la nouvelle. */
  function choisirFiltre(partiel: Partial<Filtres>) {
    setSautees([]);
    setFiltres((f) => ({ ...f, ...partiel }));
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

  /* « Jamais composée », pas « à appeler » : le statut ne bouge que si le
     commercial clique un des six boutons de résultat, alors qu'il a bel et bien
     appelé. first_call est posé dès le clic sur le numéro. */
  /* Les valeurs proposées sortent des fiches réellement présentes : aucune
     liste écrite à la main ne survit à un nouvel import. Et le compte annoncé
     par chaque choix tient compte des autres critères déjà posés — sinon le
     bouton promet des fiches que la file ne sert pas. */
  const choix = useMemo(() => {
    const dans = (l: Lead) =>
      mode === "rappels"
        ? l.statut === "rappeler" && !!l.rappel && l.rappel <= today()
        : l.statut === "a_appeler" && l.first_call === null;

    const liste = (
      cle: keyof Filtres,
      valeur: (l: Lead) => string
    ): { v: string; n: number }[] => {
      const sansCeCritere = { ...filtres, [cle]: null } as Filtres;
      const compte = new Map<string, number>();
      for (const l of ctx.d.leads) {
        if (!dans(l) || !correspond(l, sansCeCritere)) continue;
        const v = valeur(l);
        compte.set(v, (compte.get(v) ?? 0) + 1);
      }
      return [...compte.entries()]
        .map(([v, n]) => ({ v, n }))
        .sort((a, b) => (a.v === "" ? 1 : b.v === "" ? -1 : a.v.localeCompare(b.v, "fr")));
    };

    return {
      secteur: liste("secteur", (l) => l.secteur),
      ville: liste("ville", (l) => l.ville),
      effectif: liste("effectif", (l) => l.effectif),
      prio: liste("prio", (l) => l.prio),
      total: ctx.d.leads.filter((l) => dans(l) && correspond(l, filtres)).length,
    };
  }, [ctx.d.leads, filtres, mode]);

  const neufs = ctx.d.leads.filter(
    (l) => l.statut === "a_appeler" && l.first_call === null
  ).length;
  const filtreActif = Object.values(filtres).some((v) => v !== null);

  /** Un menu de filtre. Vide = « tout », et le compte suit les autres critères. */
  function Menu({
    cle, titre, valeurs, libelle,
  }: {
    cle: keyof Filtres;
    titre: string;
    valeurs: { v: string; n: number }[];
    libelle?: (v: string) => string;
  }) {
    if (valeurs.length < 2) return null;
    const courant = filtres[cle];
    return (
      <label className="filtre">
        <span>{titre}</span>
        <select
          value={courant === null ? "\u0000" : courant}
          onChange={(e) =>
            choisirFiltre({
              [cle]: e.target.value === "\u0000" ? null : e.target.value,
            } as Partial<Filtres>)
          }
        >
          <option value={"\u0000"}>Tous</option>
          {valeurs.map(({ v, n }) => (
            <option key={v || "_"} value={v}>
              {(libelle ? libelle(v) : v) + " (" + n + ")"}
            </option>
          ))}
        </select>
      </label>
    );
  }

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

      <div className="filtres">
        <Menu cle="secteur" titre="Secteur" valeurs={choix.secteur} />
        <Menu cle="ville" titre="Ville" valeurs={choix.ville} />
        <Menu
          cle="effectif"
          titre="Taille"
          valeurs={choix.effectif}
          libelle={(v) => v || "Taille inconnue"}
        />
        <Menu
          cle="prio"
          titre="Priorité"
          valeurs={choix.prio}
          libelle={(v) => "Priorité " + v}
        />
        <span className="compte">
          {choix.total} fiche{choix.total > 1 ? "s" : ""}
        </span>
        {filtreActif && (
          <button className="effacer" onClick={() => choisirFiltre(SANS_FILTRE)}>
            Tout afficher
          </button>
        )}
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
                ? "Rien à rappeler aujourd'hui avec ces critères. Reviens demain, élargis les filtres, ou repasse aux fiches à appeler."
                : filtreActif
                  ? "Plus aucune fiche jamais appelée avec ces critères. Élargis les filtres pour en retrouver."
                  : "Plus aucune fiche jamais appelée. Passe au Fichier pour revoir celles que tu as déjà traitées."}
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
              <div className="addr">{adresseLisible(fiche)}</div>
              <div className="rev">
                {fiche.nb_avis != null && (
                  <span>{fiche.note_google}/5 · {fiche.nb_avis} avis Google</span>
                )}
                {fiche.effectif && <span>{fiche.effectif}</span>}
              </div>
            </div>

            {/* Qui demander. C'est la première phrase de l'appel : sans un nom,
                on reste à l'accueil et on n'en sort pas. Donc au-dessus du
                numéro, pas en dessous. */}
            {fiche.decideur && (
              <div className="demander">
                <span className="l">Demander</span>
                <b>{fiche.decideur}</b>
                {fiche.associes && <small>Sinon : {fiche.associes}</small>}
              </div>
            )}

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

            {/* Pourquoi on appelle celui-là. Placé juste sous le numéro : le
                commercial clique, ça sonne, et il le relit pendant la sonnerie.
                La phrase d'accroche préparée, elle, n'est plus affichée : elle
                se lisait mot pour mot et s'entendait. */}
            {fiche.detail && (
              <div className="script">
                <p className="pourquoi">
                  <span>Ce qu&apos;on a vu</span>
                  {fiche.detail}
                </p>
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
