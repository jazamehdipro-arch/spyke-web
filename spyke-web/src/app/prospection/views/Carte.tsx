"use client";

import { useCallback, useEffect, useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import type { Activity, Lead, Statut } from "@/lib/prospection/types";
import { STATUS } from "@/lib/prospection/types";
import { enE164, estMobile, fmtD, norm, today } from "@/lib/prospection/format";
import {
  appeler as appelerDepuisLeSite,
  autoriserMicro,
  etatCourant,
} from "@/lib/prospection/telephone";
import { jetonCourant } from "@/lib/prospection/auth";
import ChoixCreneau from "./ChoixCreneau";
import Email from "./Email";

/** Les six boutons de résultat d'appel, dans l'ordre du prototype. */
const RESULTATS: [Statut, string, string][] = [
  ["chaud", "Chaud", "act hot"],
  ["tiede", "Tiède", "act warm"],
  ["rdv", "RDV calé", "act won"],
  ["rappeler", "À rappeler", "act"],
  ["injoignable", "Injoignable", "act dead"],
  ["refus", "Pas intéressé", "act dead"],
];

/**
 * L'adresse en une ligne, sans répéter ce qu'elle contient déjà.
 *
 * Les fichiers donnent l'adresse complète — « 27 rue Ferrandière, 69002 Lyon »
 * — et, à côté, la ville et le code postal dans leurs propres colonnes. Les
 * coller bout à bout affichait « 27 rue Ferrandière, 69002 Lyon · Lyon 69002 ».
 */
export function adresseLisible(l: Lead): string {
  const bouts = [l.adresse.trim()];
  const deja = norm(l.adresse);
  if (l.ville && !deja.includes(norm(l.ville))) bouts.push(l.ville);
  if (l.cp && !deja.includes(l.cp)) bouts.push(l.cp);
  return bouts.filter(Boolean).join(" · ");
}

/**
 * La fiche d'un prospect, telle qu'on la travaille.
 *
 * Le même objet sert dans la file d'appel et dans le fichier : un commercial
 * qui rouvre une fiche depuis la liste doit y retrouver ce qu'il avait sous les
 * yeux en appelant, et pouvoir faire la même chose. Deux écrans qui montrent la
 * même fiche différemment, c'est deux écrans à tenir à jour et un commercial
 * qui cherche où est passé le bouton.
 *
 * Tout ce qui touche à cette fiche vit donc ici : composer, corriger le numéro,
 * écrire, poser un résultat, saisir les notes. L'écran qui l'accueille décide
 * seulement de ce qui se passe après — servir la suivante, ou refermer.
 */
export default function Carte({
  ctx,
  lead,
  onLead,
  apresResultat,
  historiqueLocal,
}: {
  ctx: Ctx;
  lead: Lead;
  /** La fiche a changé sous nos pieds : numéro corrigé, champs enregistrés. */
  onLead: (l: Lead) => void;
  /** Ce que fait l'écran d'accueil une fois le résultat posé. */
  apresResultat: () => void | Promise<void>;
  /** Hors ligne, l'historique vient de l'instantané déjà chargé. */
  historiqueLocal?: Activity[];
}) {
  const [corrigeTel, setCorrigeTel] = useState(false);
  const [telSaisi, setTelSaisi] = useState("");
  const [telErreur, setTelErreur] = useState("");
  /* L'adresse et le LinkedIn se corrigent ensemble : ce sont les deux mêmes
     informations, trouvées au même moment, et deux boutons séparés feraient
     deux allers-retours là où un seul suffit. */
  const [corrigeVoies, setCorrigeVoies] = useState(false);
  const [emailSaisi, setEmailSaisi] = useState("");
  const [linkedinSaisi, setLinkedinSaisi] = useState("");
  const [voiesErreur, setVoiesErreur] = useState("");
  const [rappel, setRappel] = useState(lead.rappel ?? "");
  const [contact, setContact] = useState(lead.contact);
  const [notes, setNotes] = useState(lead.notes);
  const [hist, setHist] = useState<Activity[]>([]);

  /* Changer de fiche remet tout à zéro. Sans cela, les notes du prospect
     précédent se retrouveraient dans le champ du suivant, et seraient
     enregistrées chez lui au premier changement de champ. */
  useEffect(() => {
    setCorrigeTel(false);
    setTelErreur("");
    setCorrigeVoies(false);
    setVoiesErreur("");
    setRappel(lead.rappel ?? "");
    setContact(lead.contact);
    setNotes(lead.notes);
    let vivant = true;
    q.historique(lead.id)
      .then((h) => { if (vivant) setHist(h); })
      .catch(() => {
        if (vivant) setHist((historiqueLocal ?? []).filter((a) => a.lead_id === lead.id));
      });
    return () => { vivant = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  /* Enregistre ce qui est tapé dans les champs avant de changer de fiche. */
  const enregistrerChamps = useCallback(async () => {
    const patch: Partial<Lead> = {};
    if ((lead.rappel ?? "") !== rappel) patch.rappel = rappel || null;
    if (lead.contact !== contact) patch.contact = contact;
    if (lead.notes !== notes) patch.notes = notes;
    if (Object.keys(patch).length) {
      const maj = await q.majLead(lead.id, patch);
      onLead(maj ?? { ...lead, ...patch });
    }
  }, [lead, rappel, contact, notes, onLead]);

  /**
   * Un clic sur le numéro. Si le clavier de l'opérateur est chargé et connecté,
   * l'appel part d'ici et le lien « tel: » est neutralisé. Sinon on le laisse
   * agir : sur un téléphone il ouvre le clavier, sur un ordinateur il passe la
   * main au logiciel installé s'il y en a un. Dans tous les cas, l'appel est
   * noté.
   */
  async function appeler(e?: React.MouseEvent) {
    const e164 = enE164(lead.tel);
    if (e164 && etatCourant() === "pret") {
      e?.preventDefault();
      // Le micro se demande pendant le clic : c'est le seul moment où Chrome
      // accepte d'afficher sa question. Le jeton, lui, peut attendre.
      const micro = autoriserMicro();
      const jeton = (await jetonCourant()) ?? "";
      await micro;
      void appelerDepuisLeSite(e164, jeton);
    }
    try {
      await q.noter(lead.id, "Appel passé", ctx.moi.id);
      setHist(await q.historique(lead.id));
      void ctx.recharger();
    } catch {
      ctx.toast("Appel non enregistré, il repartira à la reconnexion");
    }
  }

  /**
   * Enregistre le numéro corrigé.
   *
   * La base refuse un numéro déjà porté par une autre fiche : c'est l'index
   * unique qui tient la déduplication de tout le fichier, et on ne le contourne
   * pas. On traduit simplement son refus en une phrase lisible au téléphone.
   */
  async function enregistrerTel() {
    const propre = telSaisi.trim();
    if (!propre) {
      setTelErreur("Il faut un numéro.");
      return;
    }
    if (propre === lead.tel) {
      setCorrigeTel(false);
      return;
    }
    setTelErreur("");
    const ancien = lead.tel;
    try {
      const maj = await q.majLead(lead.id, { tel: propre });
      // Hors ligne, majLead met la correction en file et ne renvoie rien : on
      // pose quand même le nouveau numéro à l'écran, il partira au retour du
      // réseau comme le reste.
      onLead(maj ?? { ...lead, tel: propre });
      await q.noter(lead.id, `Numéro corrigé : ${ancien} → ${propre}`, ctx.moi.id);
      setHist(await q.historique(lead.id).catch(() => hist));
      setCorrigeTel(false);
      ctx.toast("Numéro corrigé");
      void ctx.recharger();
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setTelErreur(
        err.code === "23505"
          ? "Ce numéro est déjà sur une autre fiche."
          : err.message ?? "Enregistrement impossible."
      );
    }
  }

  /**
   * Enregistre l'adresse et le profil corrigés.
   *
   * La base refuse une adresse mal écrite et un lien sans protocole : la
   * première enverrait le message dans le vide, le second serait traité par le
   * navigateur comme une page de Spyke. On vérifie donc ici aussi, pour le dire
   * avant l'aller-retour plutôt qu'après.
   */
  async function enregistrerVoies() {
    const mail = emailSaisi.trim().toLowerCase();
    const lien = linkedinSaisi.trim();

    if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(mail)) {
      setVoiesErreur("Cette adresse e-mail n'est pas valide.");
      return;
    }
    // Un lien donné sans « https:// » est complété plutôt que refusé : c'est la
    // forme sous laquelle LinkedIn le présente quand on le copie.
    const lienPropre =
      lien && !/^https?:\/\//i.test(lien) ? "https://" + lien.replace(/^\/+/, "") : lien;

    if (mail === lead.email && lienPropre === lead.linkedin) {
      setCorrigeVoies(false);
      return;
    }

    setVoiesErreur("");
    try {
      const maj = await q.majLead(lead.id, { email: mail, linkedin: lienPropre });
      onLead(maj ?? { ...lead, email: mail, linkedin: lienPropre });
      if (mail !== lead.email) {
        await q.noter(
          lead.id,
          mail ? "Adresse e-mail corrigée" : "Adresse e-mail retirée",
          ctx.moi.id
        );
      }
      setHist(await q.historique(lead.id).catch(() => hist));
      setCorrigeVoies(false);
      ctx.toast("Fiche à jour");
      void ctx.recharger();
    } catch (e) {
      const err = e as { message?: string };
      setVoiesErreur(err.message ?? "Enregistrement impossible.");
    }
  }

  async function poser(statut: Statut) {
    await enregistrerChamps();

    if (statut === "rdv") {
      // Caler un rendez-vous sans réseau reviendrait à promettre un horaire
      // qu'un collègue vient peut-être de prendre : seule la base peut garantir
      // qu'un créneau réservé est bloqué pour tout le monde. On refuse et on le
      // dit, plutôt que de faire déplacer quelqu'un pour rien.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        ctx.toast("Pas de réseau : note « chaud » et cale le RDV en revenant");
        return;
      }
      ctx.ouvrirSheet(<ChoixCreneau ctx={ctx} lead={lead} />);
      return;
    }

    let dateRappel = rappel;
    if (statut === "rappeler" && !dateRappel) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dateRappel = d.toLocaleDateString("sv-SE");
    }

    try {
      await q.majLead(lead.id, {
        statut,
        rdv: null,
        rappel: dateRappel || null,
        contact,
        notes,
      });
      await q.noter(
        lead.id,
        STATUS[statut].l + (statut === "rappeler" ? " le " + fmtD(dateRappel) : ""),
        ctx.moi.id
      );
      ctx.toast(STATUS[statut].l + " · enregistré");
      void ctx.recharger();
      await apresResultat();
    } catch {
      ctx.toast("Résultat non enregistré");
    }
  }

  return (
    <div className="card">
      <div className="card-h">
        <div className="meta">
          <span className={"tagp " + lead.prio.toLowerCase()}>{lead.prio}</span>
          <span className="sect">{lead.secteur}</span>
          {lead.statut === "rappeler" && lead.rappel && lead.rappel <= today() && (
            <span className="tagp a">RAPPEL DU {fmtD(lead.rappel)}</span>
          )}
        </div>
        <div className="name">{lead.nom}</div>
        <div className="addr">{adresseLisible(lead)}</div>
        <div className="rev">
          {lead.nb_avis != null && (
            <span>{lead.note_google}/5 · {lead.nb_avis} avis Google</span>
          )}
          {lead.effectif && <span>{lead.effectif}</span>}
        </div>
      </div>

      {/* Le positionnement, avant de décrocher. Un cabinet d'affaires ne
          s'aborde pas comme un cabinet de droit de la famille, et la page
          LinkedIn dit ce que la structure raconte en ce moment — un
          recrutement, une fusion — ce qui fait souvent l'accroche. Donc tout
          en haut : ça se lit avant l'appel, pas pendant. */}
      {(lead.site || lead.linkedin_entreprise) && (
        <div className="positionnement">
          {lead.site && (
            <a href={lead.site} target="_blank" rel="noreferrer noopener">
              Site du cabinet
            </a>
          )}
          {lead.linkedin_entreprise && (
            <a href={lead.linkedin_entreprise} target="_blank" rel="noreferrer noopener">
              Page LinkedIn
            </a>
          )}
        </div>
      )}

      {/* Qui demander. C'est la première phrase de l'appel : sans un nom, on
          reste à l'accueil et on n'en sort pas. Donc au-dessus du numéro, pas
          en dessous. */}
      {lead.decideur && (
        <div className="demander">
          <span className="l">Demander</span>
          <b>{lead.decideur}</b>
          {lead.associes && <small>Sinon : {lead.associes}</small>}
        </div>
      )}

      {/* Le numéro, et de quoi le corriger sans quitter la fiche. L'accueil
          donne la ligne directe du décideur pendant l'appel : c'est le seul
          moment où on a l'information, et la noter ailleurs revient à refaire
          le même appel la semaine suivante. */}
      <div className="dialzone">
        {corrigeTel ? (
          <div className="dial edit">
            <input
              className="num"
              type="tel"
              inputMode="tel"
              autoFocus
              aria-label="Numéro de téléphone"
              value={telSaisi}
              onChange={(e) => setTelSaisi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void enregistrerTel();
                if (e.key === "Escape") { setCorrigeTel(false); setTelErreur(""); }
              }}
            />
            {telErreur && <div className="err">{telErreur}</div>}
            <div className="deux">
              <button className="ok" onClick={() => void enregistrerTel()}>
                Enregistrer
              </button>
              <button
                className="non"
                onClick={() => { setCorrigeTel(false); setTelErreur(""); }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            {lead.tel ? (
              <a
                className={"dial" + (estMobile(lead.tel) ? " mob" : "")}
                href={"tel:" + lead.tel.replace(/\s/g, "")}
                onClick={appeler}
              >
                <div className="num">{lead.tel}</div>
                <div className="cta">
                  {estMobile(lead.tel) ? "Ligne directe · Appeler" : "Appeler le standard"}
                </div>
              </a>
            ) : (
              <div className="dial">
                <div className="num">—</div>
                <div className="cta">Numéro manquant</div>
              </div>
            )}
            <button
              className="corriger"
              onClick={() => {
                setTelSaisi(lead.tel);
                setTelErreur("");
                setCorrigeTel(true);
              }}
            >
              {lead.tel ? "Corriger" : "Saisir"}
            </button>
          </>
        )}
      </div>

      {/* Les deux autres portes d'entrée, sous le numéro parce qu'elles
          viennent après lui : on appelle d'abord, on écrit ensuite. Le profil
          LinkedIn sert surtout à vérifier à qui on parle.

          Elles se corrigent comme le numéro, et pour la même raison : l'accueil
          épelle l'adresse du décideur pendant l'appel, et c'est le seul moment
          où on l'a. Les deux ensemble, parce qu'on les trouve au même moment. */}
      {corrigeVoies ? (
        <div className="voies-edit">
          <div>
            <label htmlFor={"v-mail-" + lead.id}>Adresse e-mail</label>
            <input
              id={"v-mail-" + lead.id}
              type="email"
              inputMode="email"
              autoFocus
              placeholder="prenom.nom@cabinet.fr"
              value={emailSaisi}
              onChange={(e) => setEmailSaisi(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 11 }}>
            <label htmlFor={"v-in-" + lead.id}>Profil LinkedIn</label>
            <input
              id={"v-in-" + lead.id}
              type="url"
              placeholder="linkedin.com/in/…"
              value={linkedinSaisi}
              onChange={(e) => setLinkedinSaisi(e.target.value)}
            />
          </div>
          {voiesErreur && (
            <p className="hint" style={{ marginTop: 9, color: "var(--hot)" }}>
              {voiesErreur}
            </p>
          )}
          <div className="btns">
            <button className="btn" onClick={() => void enregistrerVoies()}>
              Enregistrer
            </button>
            <button
              className="btn ghost"
              onClick={() => { setCorrigeVoies(false); setVoiesErreur(""); }}
            >
              Annuler
            </button>
          </div>
          <p className="hint" style={{ marginTop: 10 }}>
            Vide l&apos;un des deux champs pour retirer l&apos;information de la
            fiche.
          </p>
        </div>
      ) : (
        <div className="joindre">
          {lead.email && (
            <button
              className="voie mail"
              onClick={() => ctx.ouvrirSheet(<Email ctx={ctx} lead={lead} />)}
            >
              <span className="l">E-mail</span>
              <b>{lead.email}</b>
            </button>
          )}
          {lead.linkedin && (
            <a
              className="voie in"
              href={lead.linkedin}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="l">LinkedIn</span>
              <b>Voir le profil</b>
            </a>
          )}
          <button
            className="voie ajout"
            onClick={() => {
              setEmailSaisi(lead.email);
              setLinkedinSaisi(lead.linkedin);
              setVoiesErreur("");
              setCorrigeVoies(true);
            }}
          >
            <span className="l">{lead.email || lead.linkedin ? "Corriger" : "Compléter"}</span>
            <b>
              {lead.email || lead.linkedin
                ? "E-mail et LinkedIn"
                : "Ajouter une adresse ou un profil"}
            </b>
          </button>
        </div>
      )}

      {/* Pourquoi on appelle celui-là. Placé juste sous le numéro : le
          commercial clique, ça sonne, et il le relit pendant la sonnerie. */}
      {lead.detail && (
        <div className="script">
          <p className="pourquoi">
            <span>Ce qu&apos;on a vu</span>
            {lead.detail}
          </p>
        </div>
      )}

      <div className="sechead">Résultat de l&apos;appel</div>
      <div className="acts">
        {RESULTATS.map(([s, lab, cls]) => (
          <button key={s} className={cls} onClick={() => poser(s)}>
            {lab}
          </button>
        ))}
      </div>

      <div className="fields">
        <div className="row2">
          <div>
            <label htmlFor={"f-rap-" + lead.id}>Rappeler le</label>
            <input
              type="date" id={"f-rap-" + lead.id} value={rappel}
              onChange={(e) => setRappel(e.target.value)}
              onBlur={enregistrerChamps}
            />
          </div>
          <div>
            <label htmlFor={"f-int-" + lead.id}>Interlocuteur</label>
            <input
              type="text" id={"f-int-" + lead.id} value={contact} placeholder="Nom, fonction"
              onChange={(e) => setContact(e.target.value)}
              onBlur={enregistrerChamps}
            />
          </div>
        </div>
        <div>
          <label htmlFor={"f-not-" + lead.id}>Notes</label>
          <textarea
            id={"f-not-" + lead.id} value={notes}
            placeholder="Ce qu'il a dit, ce qu'il faut retenir…"
            onChange={(e) => setNotes(e.target.value)}
            onBlur={enregistrerChamps}
          />
          <p className="hint" style={{ marginTop: 6 }}>
            Ces notes sont communicables à la personne concernée si elle les demande.
          </p>
        </div>
      </div>

      {hist.length > 0 && (
        <div className="log">
          <div className="sechead" style={{ padding: "0 0 7px" }}>Historique</div>
          <ul>
            {hist.slice(0, 6).map((h) => (
              <li key={h.id}>
                <time>{fmtD(h.date)}</time>
                <span>{h.label}{h.author_nom ? " · " + h.author_nom : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

