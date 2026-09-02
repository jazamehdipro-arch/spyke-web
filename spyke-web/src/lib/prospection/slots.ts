import { HORIZON } from "./types";
import type { Creneau } from "./types";
import { slotParts } from "./format";

export type Slot = { iso: string; jour: string; heure: string; pris: boolean };

/**
 * Les créneaux des quatre prochaines semaines, à partir de la grille
 * hebdomadaire du responsable, avec l'occupation venue du serveur.
 *
 * Le calcul se fait en heure de Paris : la grille dit « mardi 10:00 », pas un
 * instant absolu. On fabrique l'instant en passant par la chaîne locale, ce qui
 * reste juste au changement d'heure.
 */
export function prochainsCreneaux(grille: Creneau[], prisISO: string[]): Slot[] {
  const pris = new Set(prisISO.map((s) => new Date(s).getTime()));
  const parJour = new Map<number, string[]>();
  for (const c of grille) {
    const l = parJour.get(c.weekday) ?? [];
    l.push(c.heure);
    parJour.set(c.weekday, l);
  }

  const out: Slot[] = [];
  const maintenant = Date.now();
  const base = new Date();

  for (let i = 0; i < HORIZON; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const heures = (parJour.get(d.getDay()) ?? []).slice().sort();
    const jour = d.toLocaleDateString("sv-SE");
    for (const heure of heures) {
      const iso = new Date(`${jour}T${heure}:00`).toISOString();
      const t = new Date(iso).getTime();
      if (t <= maintenant) continue;
      out.push({ iso, jour, heure, pris: pris.has(t) });
    }
  }
  return out;
}

/** Regroupe des créneaux par jour, en conservant l'ordre. */
export function parJour<T extends { jour: string }>(slots: T[]) {
  const m = new Map<string, T[]>();
  for (const s of slots) {
    const l = m.get(s.jour) ?? [];
    l.push(s);
    m.set(s.jour, l);
  }
  return [...m.entries()];
}

export { slotParts };
