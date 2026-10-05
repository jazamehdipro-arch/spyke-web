"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import type { Filtres, Lead, ModeFile } from "@/lib/prospection/types";
import { FILES, SANS_FILTRE } from "@/lib/prospection/types";
import { today } from "@/lib/prospection/format";
import { correspond, ficheSuivanteLocale } from "@/lib/prospection/horsligne";
import Carte from "./Carte";

/** Ce qu'on dit quand une file est vide. Un message par file : « File
    terminée » ne veut rien dire quand on vient d'ouvrir ses prospects chauds. */
const VIDE: Record<ModeFile, { titre: string; texte: string }> = {
  neufs: {
    titre: "File terminée",
    texte: "Plus aucune fiche jamais appelée.",
  },
  rappels: {
    titre: "Aucun rappel dû",
    texte: "Rien à rappeler aujourd'hui. Reviens demain, ou repasse aux fiches à appeler.",
  },
  chaud: {
    titre: "Aucun prospect chaud",
    texte: "Les fiches que tu marques « Chaud » arrivent ici, pour que tu puisses les reprendre quand tu as le temps.",
  },
  tiede: {
    titre: "Aucun prospect tiède",
    texte: "Les fiches que tu marques « Tiède » arrivent ici.",
  },
  injoignable: {
    titre: "Aucun injoignable",
    texte: "Les fiches où personne n'a décroché arrivent ici, pour être retentées plus tard.",
  },
};

/**
 * Cette fiche est-elle dans cette file ?
 *
 * Le même critère sert à trois endroits : le compte annoncé sur l'onglet, les
 * comptes des menus de filtre, et le message affiché quand la file est vide.
 * L'écrire une fois évite qu'un onglet promette des fiches que la file ne sert
 * pas. La base applique exactement les mêmes règles dans next_lead().
 */
function dansLaFile(l: Lead, mode: ModeFile): boolean {
  if (mode === "neufs") return l.statut === "a_appeler" && l.first_call === null;
  if (mode === "rappels") {
    return l.statut === "rappeler" && !!l.rappel && l.rappel <= today();
  }
  return l.statut === mode;
}

export default function VueFile({ ctx }: { ctx: Ctx }) {
  const [filtres, setFiltres] = useState<Filtres>(SANS_FILTRE);
  /* Cinq files distinctes. « À appeler » est le travail du jour : des fiches
     jamais appelées. « Rappels » regroupe les échéances atteintes. Les trois
     dernières servent les fiches déjà qualifiées — chaudes, tièdes,
     injoignables — pour qu'un prospect qui a dit « rappelez-moi » ne finisse
     pas au fond du fichier après un seul clic. Une fiche qualifiée ne vient
     jamais s'imposer entre deux appels : c'est le commercial qui ouvre sa file
     de chauds quand il a le temps de les reprendre. */
  const [mode, setMode] = useState<ModeFile>("neufs");
  const [fiche, setFiche] = useState<Lead | null | undefined>(undefined);
  const [sautees, setSautees] = useState<string[]>([]);
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
        try {
          l = await q.ficheSuivante(filtres, skip, mode);
        } catch {
          // Pas de réseau : la file est calculée ici, avec exactement l'ordre
          // de lead_rank() en base. Le commercial continue d'appeler.
          l = ficheSuivanteLocale(dernier.current.leads, filtres, skip, ctx.moi.id, today(), mode);
        }
        setFiche(l);
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

  function choisirMode(m: ModeFile) {
    setSautees([]);
    setMode(m);
  }

  async function passer() {
    if (!fiche) return;
    // Les champs s'enregistrent en quittant la case, et cliquer ici fait
    // justement sortir du champ en cours.
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
    const dans = (l: Lead) => dansLaFile(l, mode);

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

  /* Le compte annoncé sur chaque onglet ignore les filtres : il dit ce qu'il y
     a dans cette file, pas ce qui reste une fois la sélection faite. Sinon
     l'onglet « Chauds » afficherait zéro parce qu'un filtre de ville est posé,
     et le commercial croirait n'avoir aucun prospect chaud. */
  const comptes = useMemo(() => {
    const c = {} as Record<ModeFile, number>;
    for (const { cle } of FILES) {
      c[cle] = ctx.d.leads.filter((l) => dansLaFile(l, cle)).length;
    }
    return c;
  }, [ctx.d.leads]);

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
        {FILES.map(({ cle, nom }) => (
          <button
            key={cle}
            className="chip"
            aria-pressed={mode === cle}
            onClick={() => choisirMode(cle)}
          >
            {nom}<span className="c">{comptes[cle]}</span>
          </button>
        ))}
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
            <b>{VIDE[mode].titre}</b>
            <p>
              {filtreActif
                ? VIDE[mode].texte + " Élargis les filtres pour en retrouver."
                : VIDE[mode].texte}
            </p>
          </div>
        )
      ) : (
        <>
          <Carte
            ctx={ctx}
            lead={fiche}
            onLead={setFiche}
            apresResultat={() => servir(sautees)}
            historiqueLocal={ctx.d.activities}
          />

          <button className="skip" onClick={passer}>
            Passer cette fiche
          </button>
        </>
      )}
    </>
  );
}
