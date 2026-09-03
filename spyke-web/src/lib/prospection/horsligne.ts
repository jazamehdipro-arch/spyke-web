"use client";

import type { Activity, Deal, Lead, Profile, Creneau, Statut, Prio } from "./types";

/**
 * Le mode hors ligne.
 *
 * C'est la raison d'être du déploiement : le commercial appelle depuis sa
 * voiture et perd la 4G. Ce qu'il vient de saisir ne doit pas disparaître, et
 * l'application ne doit pas se transformer en page d'erreur du navigateur.
 *
 * Trois pièces, dans cet ordre d'importance :
 *
 * 1. UNE FILE D'ÉCRITURES. Toute écriture faite sans réseau est rangée dans
 *    IndexedDB, dans l'ordre, et rejouée telle quelle au retour du réseau.
 *    IndexedDB et non localStorage : le navigateur peut vider localStorage sous
 *    pression mémoire, et une heure d'appels ne se reperd pas.
 *
 * 2. UN INSTANTANÉ DES DONNÉES. Les dernières fiches, activités, affaires et
 *    disponibilités reçues sont conservées, pour que l'écran affiche quelque
 *    chose au lieu de « chargement impossible ».
 *
 * 3. UNE FILE D'APPEL LOCALE. Hors ligne, la fiche suivante est choisie ici,
 *    avec exactement l'ordre de lead_rank() en base.
 *
 * Ce que le hors ligne ne fait PAS, et pourquoi :
 *
 * - Il ne pose pas de rendez-vous. Le critère 6 du brief exige qu'un créneau
 *   réservé soit immédiatement bloqué pour tout le monde ; seule la base peut
 *   le garantir. Caler un RDV sans réseau reviendrait à promettre un horaire
 *   qu'un collègue vient peut-être de prendre. L'écran le refuse et le dit.
 *
 * - Il ne garantit pas le critère 2 — deux commerciaux ne voient jamais la même
 *   fiche. Ce critère repose sur un bail posé en base ; sans réseau, il n'y a
 *   pas de bail. La file locale se limite donc aux fiches déjà sans
 *   propriétaire ou appartenant à la personne connectée, et c'est la première
 *   écriture rejouée qui tranche définitivement le propriétaire.
 */

const BASE = "spyke-prospection";
const VERSION = 1;
const FILE = "file";
const CACHE = "cache";

/* Ce qu'on met en file. Le type est déclaré à part de l'écriture rangée :
   Omit<A | B, K> ne garde que les champs communs aux deux branches et ferait
   disparaître `patch` comme `label`. */
export type EcritureNouvelle =
  | { type: "majLead"; leadId: string; patch: Partial<Lead> }
  | { type: "noter"; leadId: string; label: string; authorId: string };

export type Ecriture = EcritureNouvelle & { id: string; at: number };

export type Instantane = {
  leads: Lead[];
  activities: Activity[];
  deals: Deal[];
  creneaux: Creneau[];
  equipe: Profile[];
};

/* ------------------------------------------------------------------ socle */

let bdd: Promise<IDBDatabase> | null = null;

function ouvrir(): Promise<IDBDatabase> {
  if (!bdd) {
    bdd = new Promise((resolve, reject) => {
      const req = indexedDB.open(BASE, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(FILE)) db.createObjectStore(FILE, { keyPath: "id" });
        if (!db.objectStoreNames.contains(CACHE)) db.createObjectStore(CACHE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return bdd;
}

function tx<T>(store: string, mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) {
  return ouvrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = f(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

/** IndexedDB est indisponible en navigation privée sur certains navigateurs, et
 *  absente au rendu serveur. Rien de tout ceci ne doit faire tomber l'écran. */
function silencieux<T>(p: Promise<T>, defaut: T): Promise<T> {
  return p.catch(() => defaut);
}

const utilisable = () => typeof indexedDB !== "undefined";

/* -------------------------------------------------------- file d'écritures */

export async function enfiler(e: EcritureNouvelle): Promise<void> {
  if (!utilisable()) return;
  const complet = { ...e, id: crypto.randomUUID(), at: Date.now() } as Ecriture;
  await silencieux(tx(FILE, "readwrite", (s) => s.add(complet)), undefined as never);
}

export async function enAttente(): Promise<Ecriture[]> {
  if (!utilisable()) return [];
  const tout = await silencieux(tx<Ecriture[]>(FILE, "readonly", (s) => s.getAll()), []);
  return tout.sort((a, b) => a.at - b.at);
}

export async function oublier(id: string): Promise<void> {
  if (!utilisable()) return;
  await silencieux(tx(FILE, "readwrite", (s) => s.delete(id)), undefined as never);
}

export async function combienEnAttente(): Promise<number> {
  if (!utilisable()) return 0;
  return silencieux(tx<number>(FILE, "readonly", (s) => s.count()), 0);
}

/* ------------------------------------------------------------- instantané */

export async function sauverInstantane(d: Instantane): Promise<void> {
  if (!utilisable()) return;
  await silencieux(tx(CACHE, "readwrite", (s) => s.put(d, "donnees")), undefined as never);
}

export async function lireInstantane(): Promise<Instantane | null> {
  if (!utilisable()) return null;
  const d = await silencieux(tx<Instantane | undefined>(CACHE, "readonly", (s) => s.get("donnees")), undefined);
  return d ?? null;
}

/* ------------------------------------------------------- file d'appel locale */

/**
 * Le même ordre que lead_rank() en base, à la ligne près. Les deux doivent
 * rester alignés : si l'ordre change en base, il change ici. Sans réseau, c'est
 * cette fonction qui décide de la fiche suivante, et le commercial ne doit pas
 * voir la file se réordonner au retour de la 4G.
 */
export function rang(statut: Statut, prio: Prio, rappel: string | null, aujourdhui: string): number {
  if (statut === "rdv" || statut === "refus") return 99;
  if (statut === "rappeler") return rappel && rappel <= aujourdhui ? 0 : 98;
  if (statut === "chaud") return 1;
  if (statut === "no_show") return 2;
  if (statut === "a_appeler" && prio === "A") return 3;
  if (statut === "tiede") return 4;
  if (statut === "injoignable") return 5;
  return 6;
}

export function ficheSuivanteLocale(
  leads: Lead[],
  secteur: string | null,
  sautees: string[],
  moiId: string,
  aujourdhui: string
): Lead | null {
  const candidates = leads.filter(
    (l) =>
      rang(l.statut, l.prio, l.rappel, aujourdhui) < 90 &&
      (secteur === null || l.secteur === secteur) &&
      !sautees.includes(l.id) &&
      (l.owner_id === null || l.owner_id === moiId)
  );
  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const ra = rang(a.statut, a.prio, a.rappel, aujourdhui);
    const rb = rang(b.statut, b.prio, b.rappel, aujourdhui);
    if (ra !== rb) return ra - rb;
    if (a.prio !== b.prio) return a.prio < b.prio ? -1 : 1;
    // « rappel nulls last », comme en base.
    if (a.rappel !== b.rappel) {
      if (!a.rappel) return 1;
      if (!b.rappel) return -1;
      return a.rappel < b.rappel ? -1 : 1;
    }
    return a.id < b.id ? -1 : 1;
  });
  return candidates[0];
}

/**
 * Repose la file d'attente par-dessus les fiches affichées.
 *
 * Sans cela, hors ligne, le commercial clique « chaud », la modification part
 * en file, l'écran se recharge depuis l'instantané — qui date d'avant — et la
 * même fiche revient, inchangée. Il la retraiterait en boucle.
 *
 * Les activités en attente sont ajoutées de la même façon, pour que
 * l'historique de la fiche montre l'appel qu'on vient de passer.
 */
export function appliquerFile(
  leads: Lead[],
  activities: Activity[],
  file: Ecriture[]
): { leads: Lead[]; activities: Activity[] } {
  if (!file.length) return { leads, activities };

  const parId = new Map(leads.map((l) => [l.id, l]));
  const ajouts: Activity[] = [];

  for (const e of file) {
    if (e.type === "majLead") {
      const l = parId.get(e.leadId);
      if (l) parId.set(e.leadId, { ...l, ...e.patch });
    } else if (!activities.some((a) => a.id === e.id)) {
      ajouts.push({
        id: e.id,
        lead_id: e.leadId,
        author_id: e.authorId,
        author_nom: "",
        label: e.label,
        date: new Date(e.at).toLocaleDateString("sv-SE"),
      });
    }
  }

  return {
    leads: leads.map((l) => parId.get(l.id) ?? l),
    activities: [...ajouts, ...activities],
  };
}
