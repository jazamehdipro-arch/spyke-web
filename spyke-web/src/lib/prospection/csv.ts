import { norm } from "./format";
import type { Lead } from "./types";

/** Lecteur CSV du prototype : virgule ou point-virgule, guillemets doublés. */
export function parseCSV(txt: string): string[][] {
  txt = txt.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [], f = "", q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) {
      if (c === '"') {
        if (txt[i + 1] === '"') { f += '"'; i++; } else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === "," || c === ";") { row.push(f); f = ""; }
    else if (c === "\n") {
      row.push(f); f = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else if (c !== "\r") f += c;
  }
  row.push(f);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const colonne = (entete: string[], noms: string[]) => {
  for (const n of noms) {
    const i = entete.findIndex((k) => norm(k) === n);
    if (i > -1) return i;
  }
  return -1;
};

/** Devine le secteur d'après le nom du fichier, comme guess() du prototype. */
export function secteurDuFichier(nom: string) {
  const x = norm(nom).replace(/\.csv$/, "").replace(/^spyke-leads-/, "").replace(/[-_]/g, " ").trim();
  const m: Record<string, string> = {
    "experts comptables": "Experts-comptables",
    avocats: "Avocats",
    "agences immobilieres": "Agences immobilières",
    medical: "Médical",
    syndics: "Syndics",
    notaires: "Notaires",
  };
  return m[x] || (x ? x[0].toUpperCase() + x.slice(1) : "Sans secteur");
}

/**
 * Transforme un CSV en fiches. La déduplication n'est pas faite ici : c'est un
 * index unique en base qui tranche, y compris entre deux imports différents.
 */
/**
 * Les tailles déclarées à l'INSEE arrivent sous plusieurs formes pour dire la
 * même chose : « Non renseigné », « Non vérifié », vide. Trois libellés pour
 * une seule réalité, c'est trois cases dans le filtre et aucune qui regroupe
 * les fiches concernées. On ramène tout à l'absence.
 */
function effectifPropre(v: string): string {
  const x = norm(v);
  if (!x || x.startsWith("non ")) return "";
  return v.trim();
}

/**
 * Transforme un CSV en fiches. La déduplication n'est pas faite ici : c'est un
 * index unique en base qui tranche, y compris entre deux imports différents.
 *
 * Le secteur passé en argument ne sert que de repli : si le fichier porte une
 * colonne « Secteur », c'est elle qui décide, ligne par ligne. Les fichiers
 * mélangent désormais notaires, avocats, experts-comptables et agences dans un
 * même export — leur coller le nom du fichier mettait tout dans le même sac.
 */
export function lireFiches(texte: string, secteur: string):
  | { erreur: string }
  | { fiches: Partial<Lead>[] } {
  const rows = parseCSV(texte);
  if (rows.length < 2) return { fiches: [] };
  const h = rows[0];

  const iN = colonne(h, ["cabinet organisme", "cabinet", "agence", "etude", "etablissement", "nom", "office", "raison sociale"]);
  if (iN < 0) return { erreur: "Colonne du nom introuvable dans ce fichier" };

  const iT = colonne(h, ["telephone", "tel", "numero", "phone"]);
  const iV = colonne(h, ["ville"]);
  const iC = colonne(h, ["cp", "code postal"]);
  const iP = colonne(h, ["priorite"]);
  const iA = colonne(h, ["adresse"]);
  const iG = colonne(h, ["note google", "note"]);
  const iR = colonne(h, ["nb avis", "avis"]);
  const iX = colonne(h, ["notes"]);
  const iS = colonne(h, ["secteur"]);

  // Préparation d'appel.
  const iD = colonne(h, ["decideur a demander", "decideur", "contact decideur"]);
  const iO = colonne(h, ["autres associes", "associes"]);
  const iE = colonne(h, ["effectif insee", "effectif", "taille"]);
  const iB = colonne(h, ["detail observe", "detail", "observation"]);
  const iH = colonne(h, ["accroche", "phrase d accroche"]);
  const iK = colonne(h, ["creneau conseille", "creneau"]);
  const iI = colonne(h, ["interlocuteur"]);
  const iJ = colonne(h, ["date rappel"]);

  const get = (c: string[], i: number) => (i > -1 ? (c[i] ?? "").trim() : "");
  const fiches: Partial<Lead>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const c = rows[r];
    const nom = get(c, iN);
    if (!nom) continue;
    const note = get(c, iG).replace(",", ".");
    const avis = get(c, iR).replace(/\D/g, "");
    const p = get(c, iP).toUpperCase();
    const rappel = get(c, iJ);
    fiches.push({
      secteur: get(c, iS) || secteur,
      nom,
      tel: get(c, iT),
      ville: get(c, iV),
      cp: get(c, iC),
      prio: p === "B" ? "B" : p === "C" ? "C" : "A",
      adresse: get(c, iA),
      note_google: note && !isNaN(Number(note)) ? Number(note) : null,
      nb_avis: avis ? Number(avis) : null,
      decideur: get(c, iD),
      associes: get(c, iO),
      effectif: effectifPropre(get(c, iE)),
      detail: get(c, iB),
      accroche: get(c, iH),
      creneau: get(c, iK),
      contact: get(c, iI),
      // Une date déjà posée dans le fichier ne vaut que si elle est lisible :
      // sinon la base refuse toute la ligne et on perd la fiche entière.
      rappel: /^\d{4}-\d{2}-\d{2}$/.test(rappel) ? rappel : null,
      notes: get(c, iX),
    });
  }
  return { fiches };
}
