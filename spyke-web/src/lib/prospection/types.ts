/** Types de la base — reflet de supabase/migrations. */

export type Role = "admin" | "commercial";
/* Les fichiers de prospection classent en C les structures hors cible — trop
   petites, trop récentes. Les ramener en A les faisait remonter en tête de file
   devant de vrais prospects. */
export type Prio = "A" | "B" | "C";
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

  /* Préparation d'appel : vient du fichier, jamais saisi au téléphone.
     decideur — qui demander au standard. Sans ça, on reste à l'accueil.
     associes — les autres noms, pour quand le décideur est absent.
     effectif — la taille déclarée, c'est le critère de ciblage.
     detail   — ce qu'on a observé, et qui justifie l'appel.
     accroche — la phrase d'ouverture, écrite pour ce prospect-là.
     creneau  — l'heure où la personne est joignable. */
  decideur: string;
  associes: string;
  effectif: string;
  detail: string;
  accroche: string;
  creneau: string;

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

/**
 * Les critères de la file, tels que l'écran les pose.
 *
 * `null` veut dire « pas de filtre ». Pour l'effectif, la chaîne vide est un
 * filtre à part entière : c'est « taille non renseignée », et il y a des
 * centaines de fiches dans ce cas — les confondre avec l'absence de filtre
 * rendrait ces fiches impossibles à isoler.
 */
export type Filtres = {
  secteur: string | null;
  ville: string | null;
  effectif: string | null;
  prio: Prio | null;
};

export const SANS_FILTRE: Filtres = { secteur: null, ville: null, effectif: null, prio: null };

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
/**
 * Les files de l'écran d'appel.
 *
 * Les deux premières se calculent sur le rang : ce qui n'a jamais été appelé,
 * et ce dont l'échéance est atteinte. Les trois autres servent les fiches qui
 * portent l'étiquette du même nom, pour qu'un prospect qualifié ne finisse pas
 * au fond de la liste après un seul clic.
 */
export type ModeFile = "neufs" | "rappels" | "chaud" | "tiede" | "injoignable";

export const FILES: { cle: ModeFile; nom: string }[] = [
  { cle: "neufs", nom: "À appeler" },
  { cle: "rappels", nom: "Rappels" },
  { cle: "chaud", nom: "Chauds" },
  { cle: "tiede", nom: "Tièdes" },
  { cle: "injoignable", nom: "Injoignables" },
];

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

/* Les pastilles du tunnel. Elles vont du gris au vert en passant par le jaune
   de marque : plus l'affaire avance, plus la couleur s'affirme. Le jaune est
   réservé à l'audit encaissé — la première fois que l'argent rentre. */
export const STAGES: [string, string, string][] = [
  ["rdv", "RDV calé", "#121315"],
  ["noshow", "Client absent", "#C13A22"],
  ["audit", "Audit encaissé", "#F9C50D"],
  ["projet", "Projet en cours", "#0F7250"],
  ["abo", "Abonnement actif", "#0E6B4B"],
  ["perdu", "Perdu", "#78756D"],
];
