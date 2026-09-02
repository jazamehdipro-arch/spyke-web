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
export function lireFiches(texte: string, secteur: string):
  | { erreur: string }
  | { fiches: Partial<Lead>[] } {
  const rows = parseCSV(texte);
  if (rows.length < 2) return { fiches: [] };
  const h = rows[0];

  const iN = colonne(h, ["cabinet", "agence", "etude", "etablissement", "nom", "office", "raison sociale"]);
  if (iN < 0) return { erreur: "Colonne du nom introuvable dans ce fichier" };

  const iT = colonne(h, ["telephone", "tel", "numero", "phone"]);
  const iV = colonne(h, ["ville"]);
  const iC = colonne(h, ["cp", "code postal"]);
  const iP = colonne(h, ["priorite"]);
  const iA = colonne(h, ["adresse"]);
  const iG = colonne(h, ["note google", "note"]);
  const iR = colonne(h, ["nb avis", "avis"]);
  const iX = colonne(h, ["notes"]);

  const get = (c: string[], i: number) => (i > -1 ? (c[i] ?? "").trim() : "");
  const fiches: Partial<Lead>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const c = rows[r];
    const nom = get(c, iN);
    if (!nom) continue;
    const note = get(c, iG).replace(",", ".");
    const avis = get(c, iR).replace(/\D/g, "");
    fiches.push({
      secteur,
      nom,
      tel: get(c, iT),
      ville: get(c, iV),
      cp: get(c, iC),
      prio: get(c, iP).toUpperCase() === "B" ? "B" : "A",
      adresse: get(c, iA),
      note_google: note && !isNaN(Number(note)) ? Number(note) : null,
      nb_avis: avis ? Number(avis) : null,
      notes: get(c, iX),
    });
  }
  return { fiches };
}
