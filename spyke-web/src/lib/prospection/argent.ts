import { ABO_MOIS, RATE, type Deal, type Lead } from "./types";

/**
 * Mois d'abonnement commissionnés, plafonnés à 12. Même calcul que moisAbo()
 * dans le prototype et que abo_mois() en base.
 */
export function moisAbo(d: Deal | undefined): number {
  if (!d || !d.abo || !d.abo_start) return 0;
  const a = new Date(d.abo_start + "T00:00");
  const b = new Date();
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m--;
  return Math.max(0, Math.min(ABO_MOIS, m + 1));
}

/** Commission du commercial, sur l'encaissé, jamais sur le signé. */
export function commission(d: Deal | undefined) {
  const m = moisAbo(d);
  const audit = (d?.audit_in ?? 0) * RATE.audit;
  const projet = (d?.projet_in ?? 0) * RATE.projet;
  const abo = (d?.abo ?? 0) * RATE.abo * m;
  const total = audit + projet + abo;
  return { audit, projet, abo, total, reste: Math.max(0, total - (d?.verse ?? 0)), mois: m };
}

export function encaisse(d: Deal | undefined) {
  return (d?.audit_in ?? 0) + (d?.projet_in ?? 0) + (d?.abo ?? 0) * moisAbo(d);
}

/** L'étape du tunnel, dans l'ordre de priorité du prototype. */
export function etape(lead: Lead, d: Deal | undefined): string {
  if (d?.perdu) return "perdu";
  if (d?.abo && d.abo_start) return "abo";
  if ((d?.projet_in ?? 0) > 0) return "projet";
  if ((d?.audit_in ?? 0) > 0) return "audit";
  if (lead.statut === "no_show" || lead.rdv_honore === false) return "noshow";
  return "rdv";
}

export const dansPipeline = (lead: Lead, d: Deal | undefined) =>
  lead.statut === "rdv" ||
  lead.statut === "no_show" ||
  !!(d && ((d.audit_in ?? 0) > 0 || (d.projet_in ?? 0) > 0 || (d.abo ?? 0) > 0 || d.perdu));
