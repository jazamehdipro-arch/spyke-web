/** Types de la base — reflet de supabase/migrations. */

export type Role = "admin" | "commercial";
export type Prio = "A" | "B";
export type Statut =
  | "a_appeler"
  | "rappeler"
  | "chaud"
  | "tiede"
  | "rdv"
  | "no_show"
  | "refus"
  | "injoignable";

export type Profile = {
  id: string;
  nom: string;
  role: Role;
  actif: boolean;
  created_at: string;
};

export type Lead = {
  id: string;
  secteur: string;
  nom: string;
  tel: string;
  ville: string;
  cp: string;
  prio: Prio;
  adresse: string;
  note_google: number | null;
  nb_avis: number | null;
  statut: Statut;
  rappel: string | null;
  contact: string;
  rdv: string | null;
  rdv_honore: boolean | null;
  notes: string;
  owner_id: string | null;
  first_call: string | null;
  rdv_at: string | null;
  updated_at: string;
};

export type Activity = {
  id: string;
  lead_id: string;
  author_id: string | null;
  author_nom: string;
  date: string;
  label: string;
};

export type Deal = {
  lead_id: string;
  audit: number;
  audit_in: number;
  audit_date: string | null;
  projet: number;
  projet_in: number;
  projet_date: string | null;
  abo: number;
  abo_start: string | null;
  verse: number;
  perdu: boolean;
};

export type Creneau = { weekday: number; heure: string };

/** Libellés et pastilles du prototype, à l'identique. */
export const STATUS: Record<Statut, { l: string; c: string }> = {
  a_appeler: { l: "À appeler", c: "" },
  rappeler: { l: "À rappeler", c: "rappeler" },
  chaud: { l: "Chaud", c: "chaud" },
  tiede: { l: "Tiède", c: "tiede" },
  rdv: { l: "RDV calé", c: "rdv" },
  no_show: { l: "Ne s'est pas présenté", c: "chaud" },
  refus: { l: "Pas intéressé", c: "refus" },
  injoignable: { l: "Injoignable", c: "injoignable" },
};

export const DAYS = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];
export const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
];

/** Durée d'un audit, en minutes. DUR dans le prototype. */
export const DUR = 45;
/** Nombre de jours d'agenda affichés. HORIZON dans le prototype. */
export const HORIZON = 28;

/** Taux contractuels. Doivent rester alignés sur la vue v_commissions. */
export const RATE = { audit: 0.2, projet: 0.15, abo: 0.1 };
export const ABO_MOIS = 12;

export const STAGES: [string, string, string][] = [
  ["rdv", "RDV calé", "#2F5BEA"],
  ["noshow", "Client absent", "#E8582E"],
  ["audit", "Audit encaissé", "#C77A0A"],
  ["projet", "Projet en cours", "#12805C"],
  ["abo", "Abonnement actif", "#0C1526"],
  ["perdu", "Perdu", "#8A94A6"],
];
