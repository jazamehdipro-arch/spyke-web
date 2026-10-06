/**
 * La signature des e-mails de prospection.
 *
 * Un message de prospection arrive chez quelqu'un qui ne connaît ni
 * l'expéditeur ni l'entreprise. La signature répond en trois secondes aux deux
 * questions qu'il se pose : qui m'écrit, et comment je le joins si ça
 * m'intéresse. Elle reste donc courte, et donne le numéro direct avant le reste.
 *
 * Contraintes d'écriture, qui expliquent le HTML daté :
 *
 *   - tout est en styles sur les balises, parce que les messageries retirent
 *     les feuilles de style ;
 *   - la mise en page passe par un tableau, parce qu'Outlook ignore flex et
 *     grid ;
 *   - aucune image, parce que la plupart des messageries les bloquent par
 *     défaut : une signature qui repose sur un logo arrive vide ;
 *   - les polices sont celles du système, une police web ne se charge pas dans
 *     un e-mail.
 */

const ENCRE = "#121315";
const GRIS = "#6C6A64";
const JAUNE = "#F9C50D";
const TRAIT = "#E6E3DC";
const POLICE =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export type Signataire = {
  nom: string;
  email: string;
  telephone: string;
  /* L'intitulé de poste. Vide, la phrase de l'entreprise reste affichée. */
  poste: string;
};

/** Le texte tapé devient du HTML : on échappe, puis les retours à la ligne. */
export function enHtml(texte: string): string {
  const e = texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return e.replace(/\n/g, "<br>");
}

export function signatureHtml(s: Signataire): string {
  const tel = s.telephone.trim();
  const telLien = tel.replace(/[^\d+]/g, "");

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-collapse:collapse">
  <tr>
    <td style="width:3px;background-color:${JAUNE}" aria-hidden="true">&nbsp;</td>
    <td style="padding-left:14px;font-family:${POLICE};line-height:1.5">
      <div style="font-size:15px;font-weight:600;color:${ENCRE};letter-spacing:-0.2px">${s.nom}</div>
      <div style="font-size:12px;color:${GRIS};padding-top:2px">
        <span style="font-weight:700;color:${ENCRE};letter-spacing:1.4px">SPYKE</span>
        &nbsp;${s.poste.trim() || "Automatisation IA pour PME"}
      </div>
      <div style="height:11px;line-height:11px">&nbsp;</div>
      ${
        tel
          ? `<div style="font-size:13px;padding-bottom:3px">
        <a href="tel:${telLien}" style="color:${ENCRE};text-decoration:none;font-weight:600">${tel}</a>
      </div>`
          : ""
      }
      <div style="font-size:13px;padding-bottom:3px">
        <a href="mailto:${s.email}" style="color:${GRIS};text-decoration:none">${s.email}</a>
      </div>
      <div style="font-size:13px">
        <a href="https://spykeconseil.fr" style="color:${GRIS};text-decoration:none">spykeconseil.fr</a>
      </div>
    </td>
  </tr>
</table>
<div style="margin-top:20px;padding-top:12px;border-top:1px solid ${TRAIT};font-family:${POLICE};font-size:11px;color:${GRIS};line-height:1.5">
  Vous recevez ce message dans le cadre d'une prospection commerciale.
  Répondez-nous pour ne plus être contacté, nous retirerons vos coordonnées.
</div>`.trim();
}

/** La même chose en texte brut, pour les messageries qui refusent le HTML. */
export function signatureTexte(s: Signataire): string {
  const l = [s.nom, "Spyke — " + (s.poste.trim() || "Automatisation IA pour PME")];
  if (s.telephone.trim()) l.push(s.telephone.trim());
  l.push(s.email, "spykeconseil.fr");
  l.push(
    "",
    "Vous recevez ce message dans le cadre d'une prospection commerciale.",
    "Répondez-nous pour ne plus être contacté, nous retirerons vos coordonnées."
  );
  return l.join("\n");
}
