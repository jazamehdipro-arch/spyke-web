/** Les mêmes helpers d'affichage que le prototype, au comportement identique. */

export const today = () => new Date().toLocaleDateString("sv-SE");

export const norm = (s: string | null | undefined) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export const fmtD = (d: string | null | undefined) =>
  d ? new Date(d + "T00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "";

export const longD = (d: string) =>
  new Date(d + "T00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

export const eur = (n: number) => Math.round(n || 0).toLocaleString("fr-FR") + " €";

/** Jours entre deux dates ISO, ou null si l'une manque. */
export const jours = (a: string | null, b: string | null) =>
  !a || !b ? null : Math.round((+new Date(b + "T00:00") - +new Date(a + "T00:00")) / 864e5);

export const median = (a: number[]) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

/**
 * Un instant absolu vers le jour et l'heure locale d'un créneau.
 * L'agenda raisonne en heure de Paris, comme la grille du responsable.
 */
const TZ = "Europe/Paris";

export function slotParts(iso: string) {
  const d = new Date(iso);
  const jour = d.toLocaleDateString("sv-SE", { timeZone: TZ });
  const heure = d.toLocaleTimeString("fr-FR", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  });
  return { jour, heure };
}

/** Le mobile se reconnaît au 06/07, comme dans le prototype. */
export const estMobile = (tel: string) => /^(\+33\s?[67]|0[67])/.test(tel || "");
