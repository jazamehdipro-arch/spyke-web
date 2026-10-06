import type { Lead, Modele, Profile } from "./types";
import { longD } from "./format";

/**
 * Remplir un modèle d'e-mail avec ce que la fiche sait déjà.
 *
 * Le commercial choisit un objet, le message arrive écrit. Ce qui ne peut pas
 * être deviné reste visible sous sa forme {{...}} plutôt que d'être remplacé
 * par du vide : une phrase amputée passe inaperçue, une accolade non.
 * L'écran refuse ensuite d'envoyer tant qu'il en reste une.
 */

export type Contexte = {
  lead: Lead;
  moi: Profile;
  /** Les deux prochains créneaux d'audit libres, déjà mis en forme. */
  creneaux: string[];
  /** Les cases cochées, par leur clé. */
  choisies: string[];
};

/** Une date de la base en toutes lettres, ou la variable si elle manque. */
function date(v: string | null, variable: string): string {
  return v ? longD(v.slice(0, 10)) : variable;
}

/**
 * Les lignes retenues, numérotées à partir de 1.
 *
 * La numérotation est refaite : si le commercial garde les problèmes 2 et 4, le
 * message affiche 1 et 2, et les solutions portent les mêmes numéros. Garder
 * les numéros d'origine ferait un message qui saute du 2 au 4 sans raison
 * lisible pour le prospect.
 */
function liste(m: Modele, choisies: string[], champ: "probleme" | "solution"): string {
  const gardees = m.options.filter((o) => choisies.includes(o.cle));
  return gardees
    .map((o, i) => `${i + 1}. ${o[champ]}`)
    .filter((l) => !l.endsWith(". "))
    .join("\n");
}

export function remplir(m: Modele, c: Contexte): { objet: string; corps: string } {
  const l = c.lead;
  const rdv = l.rdv ? new Date(l.rdv) : null;

  const valeurs: Record<string, string> = {
    cabinet: l.nom,
    appel: l.decideur || "Madame, Monsieur",
    date_appel: date(l.first_call, "{{date_appel}}"),
    date_rappel: date(l.rappel, "{{date_rappel}}"),
    date_recontact: date(l.rappel, "{{date_recontact}}"),
    creneau_1: c.creneaux[0] ?? "{{creneau_1}}",
    creneau_2: c.creneaux[1] ?? "{{creneau_2}}",
    date_rdv: rdv ? longD(l.rdv!.slice(0, 10)) : "{{date_rdv}}",
    heure_rdv: rdv
      ? rdv
          .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          .replace(":", "h")
      : "{{heure_rdv}}",
    adresse_rdv: l.adresse || "{{adresse_rdv}}",
    nom_consultant: c.moi.nom,
    problemes: liste(m, c.choisies, "probleme"),
    solutions: liste(m, c.choisies, "solution"),
  };

  const poser = (t: string) =>
    t.replace(/\{\{([a-z0-9_]+)\}\}/g, (brut, cle: string) =>
      cle in valeurs ? valeurs[cle] : brut
    );

  // Une liste vide laisserait une ligne blanche au milieu du message.
  const corps = poser(m.corps)
    .split("\n")
    .filter((ligne, i, tout) => ligne.trim() !== "" || tout[i - 1]?.trim() !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return { objet: poser(m.objet), corps };
}

/** Ce qui n'a pas pu être rempli, pour le dire avant l'envoi. */
export function manquantes(texte: string): string[] {
  return [...new Set(texte.match(/\{\{[a-z0-9_]+\}\}/g) ?? [])];
}

/**
 * Les modèles proposés pour une fiche.
 *
 * Ceux de son secteur d'abord, puis ceux qui valent pour tous. Un commercial
 * sur une fiche de notaire ne doit pas voir passer l'e-mail des agences
 * immobilières : c'est précisément l'erreur que ce tri évite.
 */
export function pourLaFiche(modeles: Modele[], secteur: string): Modele[] {
  return modeles
    .filter((m) => m.actif && (m.secteur === secteur || m.secteur === ""))
    .sort((a, b) => {
      if (a.secteur !== b.secteur) return a.secteur === secteur ? -1 : 1;
      if (a.rang !== b.rang) return a.rang - b.rang;
      return a.titre.localeCompare(b.titre, "fr");
    });
}
