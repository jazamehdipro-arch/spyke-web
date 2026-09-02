"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/prospection/supabase/client";
import * as q from "@/lib/prospection/queries";
import type { Activity, Creneau, Deal, Lead, Profile } from "@/lib/prospection/types";
import { today } from "@/lib/prospection/format";
import Sheet from "./ui/Sheet";
import Toast from "./ui/Toast";
import VueFile from "./views/File";
import VueListe from "./views/Liste";
import VueAgenda from "./views/Agenda";
import VuePipeline from "./views/Pipeline";
import VueReglages from "./views/Reglages";

export type Donnees = {
  leads: Lead[];
  activities: Activity[];
  deals: Deal[];
  creneaux: Creneau[];
  equipe: Profile[];
};

export type Ctx = {
  moi: Profile;
  d: Donnees;
  recharger: () => Promise<void>;
  toast: (m: string) => void;
  ouvrirSheet: (n: React.ReactNode) => void;
  fermerSheet: () => void;
  allerA: (v: Onglet) => void;
};

export type Onglet = "file" | "liste" | "agenda" | "pipe" | "admin";

const ONGLETS: [Onglet, string][] = [
  ["file", "File"],
  ["liste", "Liste"],
  ["agenda", "Agenda"],
  ["pipe", "Pipeline"],
  ["admin", "Réglages"],
];

/**
 * L'état du réseau appartient au navigateur, pas à React : on s'y abonne au
 * lieu d'en garder une copie. Côté serveur on suppose connecté.
 */
function ecouterReseau(maj: () => void) {
  window.addEventListener("online", maj);
  window.addEventListener("offline", maj);
  return () => {
    window.removeEventListener("online", maj);
    window.removeEventListener("offline", maj);
  };
}

export default function App({
  moi,
  initial,
}: {
  moi: Profile;
  initial: Donnees;
}) {
  const router = useRouter();
  const [d, setD] = useState<Donnees>(initial);
  const [view, setView] = useState<Onglet>(moi.role === "admin" ? "file" : "file");
  const [message, setMessage] = useState("");
  const [sheet, setSheet] = useState<React.ReactNode>(null);
  const reseau = useSyncExternalStore(ecouterReseau, () => navigator.onLine, () => true);
  const [baseJoignable, setBaseJoignable] = useState(true);
  const enLigne = reseau && baseJoignable;

  const toast = useCallback((m: string) => {
    setMessage(m);
    window.setTimeout(() => setMessage(""), 2300);
  }, []);

  const recharger = useCallback(async () => {
    try {
      const [leads, activities, deals, creneaux, equipe] = await Promise.all([
        q.chargerLeads(),
        q.toutHistorique(),
        q.affaires(),
        q.creneaux(),
        moi.role === "admin" ? q.equipe() : Promise.resolve([] as Profile[]),
      ]);
      setD({ leads, activities, deals, creneaux, equipe });
      setBaseJoignable(true);
    } catch {
      setBaseJoignable(false);
    }
  }, [moi.role]);

  /* Le responsable voit les statuts avancer en direct, sans recharger. */
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel("leads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        void recharger();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [recharger]);

  const ctx: Ctx = {
    moi,
    d,
    recharger,
    toast,
    ouvrirSheet: setSheet,
    fermerSheet: () => setSheet(null),
    allerA: (v) => {
      setView(v);
      window.scrollTo({ top: 0 });
    },
  };

  /* ------------------------------------------------------- compteurs du haut
   *
   * Trois nombres, et aucun qui compte une cadence. Les commerciaux sont des
   * indépendants : ils travaillent quand ils veulent, donc « appels du jour »
   * et « reste à faire » ne mesuraient rien d'utile — juste un rythme attendu,
   * affiché à quelqu'un qui n'en a pas. Ne restent que les nombres sur
   * lesquels on peut agir tout de suite, quel que soit le jour. */
  const compteurs = useMemo(() => {
    const j = today();
    const rappels = d.leads.filter(
      (l) => l.statut === "rappeler" && l.rappel && l.rappel <= j
    ).length;
    const chauds = d.leads.filter((l) => l.statut === "chaud").length;
    const rdv = d.leads.filter((l) => l.statut === "rdv").length;
    return { rappels, chauds, rdv };
  }, [d]);

  const rappelsDus = compteurs.rappels;

  async function quitter() {
    await createClient().auth.signOut();
    router.replace("/prospection/connexion");
    router.refresh();
  }

  return (
    <>
      <div className="top">
        <div className="brand">
          <b>SPYKE</b>
          <i />
          <span>Prospection</span>
          <span className="who">
            <b>{moi.nom}</b>
            <button onClick={quitter}>Quitter</button>
          </span>
        </div>

        <div className="tally">
          <div>
            <span className="n">{compteurs.rappels}</span>
            <span className="l">Rappels dus</span>
          </div>
          <div>
            <span className="n hot">{compteurs.chauds}</span>
            <span className="l">Chauds</span>
          </div>
          <div>
            <span className="n won">{compteurs.rdv}</span>
            <span className="l">RDV calés</span>
          </div>
        </div>

        <div className={"sync" + (enLigne ? "" : " off")}>
          <i />
          <span>{enLigne ? "Synchronisé" : "Hors ligne · nouvelle tentative en cours"}</span>
        </div>

        <div className="tabs" role="tablist">
          {ONGLETS.filter(([k]) => k !== "admin" || moi.role === "admin").map(([k, lab]) => (
            <button
              key={k}
              role="tab"
              aria-selected={view === k}
              onClick={() => ctx.allerA(k)}
            >
              {lab}
              {k === "file" && rappelsDus > 0 && <span className="badge">{rappelsDus}</span>}
              {k === "agenda" && compteurs.rdv > 0 && <span className="badge">{compteurs.rdv}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="wrap">
        {view === "file" && <VueFile ctx={ctx} />}
        {view === "liste" && <VueListe ctx={ctx} />}
        {view === "agenda" && <VueAgenda ctx={ctx} />}
        {view === "pipe" && <VuePipeline ctx={ctx} />}
        {view === "admin" && moi.role === "admin" && <VueReglages ctx={ctx} />}
      </div>

      <Sheet ouvert={sheet !== null} onClose={() => setSheet(null)}>
        {sheet}
      </Sheet>
      <Toast message={message} />
    </>
  );
}
