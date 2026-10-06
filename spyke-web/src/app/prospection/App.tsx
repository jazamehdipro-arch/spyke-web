"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/prospection/supabase/client";
import * as q from "@/lib/prospection/queries";
import type { Activity, Creneau, Deal, Lead, Modele, Profile } from "@/lib/prospection/types";
import { today } from "@/lib/prospection/format";
import {
  sauverInstantane, lireInstantane, combienEnAttente, enAttente as fileEnAttente, appliquerFile,
} from "@/lib/prospection/horsligne";
import Sheet from "./ui/Sheet";
import Toast from "./ui/Toast";
import Telephone from "./ui/Telephone";
import VueFile from "./views/File";
import VueListe from "./views/Liste";
import VueAgenda from "./views/Agenda";
import VuePipeline from "./views/Pipeline";
import VueReglages from "./views/Reglages";
import Modeles from "./views/Modeles";

export type Donnees = {
  leads: Lead[];
  activities: Activity[];
  deals: Deal[];
  creneaux: Creneau[];
  equipe: Profile[];
  modeles: Modele[];
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

/**
 * Les cinq écrans, avec ce qu'ils font écrit en toutes lettres.
 *
 * Un commercial qui prend l'outil en main ne devine pas ce que « Pipeline »
 * recouvre. Le titre reste court pour le rail ; la phrase, elle, s'affiche en
 * haut de l'écran ouvert et dit à quoi il sert.
 */
const ONGLETS: { cle: Onglet; nom: string; quoi: string; icone: React.ReactNode }[] = [
  {
    cle: "file", nom: "Appeler", quoi: "Une fiche à la fois, dans l'ordre. Clique le numéro, note le résultat.",
    icone: (
      <svg viewBox="0 0 24 24" aria-hidden><path d="M6.6 3.5 9 8l-2 1.8a13 13 0 0 0 7.2 7.2L16 15l4.5 2.4-1.2 3.1a2 2 0 0 1-2 1.2A17.5 17.5 0 0 1 2.3 6.7a2 2 0 0 1 1.2-2Z" /></svg>
    ),
  },
  {
    cle: "liste", nom: "Fichier", quoi: "Toutes les fiches. Cherche un nom, un numéro, une ville.",
    icone: (
      <svg viewBox="0 0 24 24" aria-hidden><path d="M4 5h16M4 12h16M4 19h10" /></svg>
    ),
  },
  {
    cle: "agenda", nom: "Rendez-vous", quoi: "Les créneaux calés, et ceux à clôturer.",
    icone: (
      <svg viewBox="0 0 24 24" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
    ),
  },
  {
    cle: "pipe", nom: "Affaires", quoi: "Ce qui est signé, ce qui est encaissé, ce qui reste dû.",
    icone: (
      <svg viewBox="0 0 24 24" aria-hidden><path d="M4 19V9M10 19V4M16 19v-7M22 19H2" /></svg>
    ),
  },
  {
    cle: "admin", nom: "Réglages", quoi: "L'équipe, l'import des fiches, les données personnelles.",
    icone: (
      <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></svg>
    ),
  },
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

/**
 * Repose les écritures encore en file par-dessus les données affichées. Sans
 * cela, hors ligne, une fiche traitée reviendrait telle qu'elle était avant :
 * l'instantané ne connaît pas ce qui n'est pas encore parti.
 */
async function avecFileParDessus(d: Donnees): Promise<Donnees> {
  const file = await fileEnAttente();
  if (!file.length) return d;
  const { leads, activities } = appliquerFile(d.leads, d.activities, file);
  return { ...d, leads, activities };
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
  const [enAttente, setEnAttente] = useState(0);
  const enLigne = reseau && baseJoignable;

  const toast = useCallback((m: string) => {
    setMessage(m);
    window.setTimeout(() => setMessage(""), 2300);
  }, []);

  const recharger = useCallback(async () => {
    try {
      const [leads, activities, deals, creneaux, equipe, modeles] = await Promise.all([
        q.chargerLeads(),
        q.toutHistorique(),
        q.affaires(),
        q.creneaux(),
        moi.role === "admin" ? q.equipe() : Promise.resolve([] as Profile[]),
        // Les modèles sont un confort, pas le cœur du métier : s'ils ne
        // chargent pas, le commercial doit quand même pouvoir appeler. Sans
        // cette tolérance, une table absente emporte tout l'écran.
        q.modeles().catch(() => []),
      ]);
      const frais = { leads, activities, deals, creneaux, equipe, modeles };
      // Ce qui vient d'arriver servira d'écran de secours à la prochaine
      // coupure : mieux vaut des fiches d'il y a dix minutes que rien.
      void sauverInstantane(frais);
      setD(await avecFileParDessus(frais));
      setBaseJoignable(true);
    } catch {
      setBaseJoignable(false);
      const secours = await lireInstantane();
      if (secours) setD(await avecFileParDessus({ modeles: [], ...secours }));
    }
    setEnAttente(await combienEnAttente());
  }, [moi.role]);

  /* Au retour du réseau, on renvoie d'abord ce qui a été saisi sans lui, puis
     on recharge — dans cet ordre, sinon le rechargement écraserait à l'écran
     des modifications pas encore parties. */
  useEffect(() => {
    if (!reseau) return;
    let vivant = true;
    (async () => {
      if ((await combienEnAttente()) === 0) return;
      const { rejouees, abandonnees } = await q.rejouer();
      if (!vivant) return;
      if (rejouees) {
        toast(
          rejouees + (rejouees > 1 ? " actions envoyées" : " action envoyée") +
          (abandonnees ? ` · ${abandonnees} refusée${abandonnees > 1 ? "s" : ""} par la base` : "")
        );
      }
      await recharger();
    })();
    return () => { vivant = false; };
    // toast est stable (useCallback sans dépendance), recharger ne change que
    // si le rôle change.
  }, [reseau, recharger, toast]);

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


  async function quitter() {
    await createClient().auth.signOut();
    router.replace("/prospection/connexion");
    router.refresh();
  }

  const ecran = ONGLETS.find((o) => o.cle === view)!;
  /* L'onglet des réglages s'ouvre aussi à qui peut écrire les modèles, mais il
     ne lui montre que ceux-là : ni l'équipe, ni l'import, ni l'argent. Son
     titre change en conséquence, pour ne pas promettre ce qu'il ne contient
     pas. */
  const redacteur = moi.role !== "admin" && moi.redacteur;
  const onglets = ONGLETS.filter((o) => o.cle !== "admin" || moi.role === "admin" || redacteur)
    .map((o) =>
      o.cle === "admin" && redacteur
        ? { ...o, nom: "Modèles", quoi: "Les e-mails types envoyés aux prospects." }
        : o
    );
  const badges: Partial<Record<Onglet, number>> = {
    file: compteurs.rappels,
    agenda: compteurs.rdv,
  };

  return (
    <div className="shell">
      {/* ------------------------------------------------- rail de navigation */}
      <nav className="rail" aria-label="Navigation">
        <div className="logo">
          <b>SPYKE</b>
          <i />
          <span>Prospection</span>
        </div>

        <div className="nav" role="tablist">
          {onglets.map((o) => (
            <button
              key={o.cle}
              role="tab"
              aria-selected={view === o.cle}
              /* Sur un écran étroit le rail se réduit à ses icônes : le nom
                 doit rester atteignable au survol. */
              title={o.nom}
              onClick={() => ctx.allerA(o.cle)}
            >
              {o.icone}
              <span>{o.nom}</span>
              {(badges[o.cle] ?? 0) > 0 && <em>{badges[o.cle]}</em>}
            </button>
          ))}
        </div>

        {/* Trois nombres, et aucun qui compte une cadence. Les commerciaux sont
            des indépendants : « appels du jour » ne mesurait qu'un rythme
            attendu, affiché à quelqu'un qui n'en a pas. Ne restent que ceux sur
            lesquels on peut agir tout de suite — et chacun mène à l'écran qui
            permet d'agir. */}
        <div className="veille">
          <span className="cap">À traiter</span>
          <button onClick={() => ctx.allerA("file")}>
            <b>{compteurs.rappels}</b>
            <span>Rappels dus</span>
          </button>
          <button onClick={() => ctx.allerA("liste")}>
            <b className="hot">{compteurs.chauds}</b>
            <span>Prospects chauds</span>
          </button>
          <button onClick={() => ctx.allerA("agenda")}>
            <b className="won">{compteurs.rdv}</b>
            <span>Rendez-vous calés</span>
          </button>
        </div>

        <div className="bas">
          <div className={"net" + (enLigne ? "" : " off")}>
            <i />
            <span>
              {enAttente > 0
                ? `${enAttente} action${enAttente > 1 ? "s" : ""} à envoyer`
                : enLigne
                  ? "Tout est enregistré"
                  : "Hors ligne · rien n'est perdu"}
            </span>
          </div>
          <div className="moi">
            <span>{moi.nom}</span>
            <button onClick={quitter}>Quitter</button>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------ zone de travail */}
      <main className="main">
        <header className="tete">
          <h1>{ecran.nom}</h1>
          <p>{ecran.quoi}</p>
        </header>

        {view === "file" && <VueFile ctx={ctx} />}
        {view === "liste" && <VueListe ctx={ctx} />}
        {view === "agenda" && <VueAgenda ctx={ctx} />}
        {view === "pipe" && <VuePipeline ctx={ctx} />}
        {view === "admin" && moi.role === "admin" && <VueReglages ctx={ctx} />}
        {view === "admin" && redacteur && <Modeles ctx={ctx} />}
      </main>

      {/* Le téléphone vit dans la coque, jamais dans un écran : le démonter
          couperait la ligne au milieu d'un appel. */}
      <Telephone />

      <Sheet ouvert={sheet !== null} onClose={() => setSheet(null)}>
        {sheet}
      </Sheet>
      <Toast message={message} />
    </div>
  );
}
