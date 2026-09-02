"use client";

import { useRef, useState } from "react";
import * as q from "@/lib/prospection/queries";
import type { Ctx } from "../App";
import { DAYS, DUR, HOURS } from "@/lib/prospection/types";
import { commission } from "@/lib/prospection/argent";
import { eur, jours, median, today } from "@/lib/prospection/format";
import { lireFiches, secteurDuFichier } from "@/lib/prospection/csv";
import Equipe from "./Equipe";

export default function VueReglages({ ctx }: { ctx: Ctx }) {
  const [secteurImport, setSecteurImport] = useState("");
  const [enCours, setEnCours] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);

  const ouvert = (d: number, h: string) =>
    ctx.d.creneaux.some((c) => c.weekday === d && c.heure === h);

  async function basculer(d: number, h: string) {
    try {
      if (ouvert(d, h)) await q.fermerCreneau(d, h);
      else await q.ouvrirCreneau(d, h);
      await ctx.recharger();
    } catch {
      ctx.toast("Créneau non enregistré");
    }
  }

  async function semaineType() {
    const h = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
    await q.viderCreneaux();
    for (const d of [1, 2, 3, 4, 5]) for (const x of h) await q.ouvrirCreneau(d, x);
    await ctx.recharger();
    ctx.toast("Semaine type appliquée");
  }

  async function toutDecocher() {
    await q.viderCreneaux();
    await ctx.recharger();
    ctx.toast("Créneaux effacés");
  }

  /* ------------------------------------------------------------------ import */
  async function importer(files: FileList | null) {
    if (!files?.length) return;
    setEnCours(true);
    let a = 0, d = 0;
    try {
      for (const f of Array.from(files)) {
        const res = lireFiches(await f.text(), secteurImport.trim() || secteurDuFichier(f.name));
        if ("erreur" in res) { ctx.toast(res.erreur); continue; }
        const r = await q.importerLeads(res.fiches);
        a += r.ajoutes; d += r.doublons;
      }
      await ctx.recharger();
      ctx.toast(
        a
          ? `${a} fiche${a > 1 ? "s" : ""} ajoutée${a > 1 ? "s" : ""}` +
            (d ? ` · ${d} doublon${d > 1 ? "s" : ""} ignoré${d > 1 ? "s" : ""}` : "")
          : d ? "Tout était déjà importé" : "Aucune fiche trouvée"
      );
    } catch (e) {
      ctx.toast((e as { message?: string }).message ?? "Import impossible");
    }
    setSecteurImport("");
    setEnCours(false);
  }

  /* ------------------------------------------------------------------ export */
  function telecharger(nom: string, type: string, texte: string) {
    const u = URL.createObjectURL(new Blob([texte], { type }));
    const a = document.createElement("a");
    a.href = u; a.download = nom; a.click();
    URL.revokeObjectURL(u);
  }

  function exporterCSV() {
    const h = ["Secteur", "Priorite", "Cabinet", "Ville", "CP", "Telephone", "Adresse",
      "Note Google", "Nb avis", "Statut", "RDV", "Date rappel", "Interlocuteur", "Notes",
      "Commercial", "Audit encaisse", "Projet encaisse", "Abonnement mensuel",
      "Commission due", "Commission versee"];
    const g = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const lignes = ctx.d.leads.map((l) => {
      const d = ctx.d.deals.find((x) => x.lead_id === l.id);
      const c = commission(d);
      return [
        l.secteur, l.prio, l.nom, l.ville, l.cp, l.tel, l.adresse,
        l.note_google ?? "", l.nb_avis ?? "", l.statut,
        l.rdv ? l.rdv.replace("T", " ").slice(0, 16) : "", l.rappel ?? "", l.contact, l.notes,
        ctx.d.equipe.find((m) => m.id === l.owner_id)?.nom ?? "",
        d?.audit_in ?? "", d?.projet_in ?? "", d?.abo ?? "",
        d ? Math.round(c.total) : "", d?.verse ?? "",
      ].map(g).join(",");
    });
    telecharger(
      "spyke-prospection-" + today() + ".csv",
      "text/csv",
      "﻿" + [h.map(g).join(","), ...lignes].join("\n")
    );
    ctx.toast("Export téléchargé");
  }

  function exporterICS() {
    const rdv = ctx.d.leads.filter((l) => l.statut === "rdv" && l.rdv);
    if (!rdv.length) { ctx.toast("Aucun rendez-vous daté à exporter"); return; }
    const pad = (n: number) => String(n).padStart(2, "0");
    const t = (d: Date) =>
      d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z";
    const cl = (s: string) => String(s || "").replace(/([\;,])/g, "\\$1").replace(/\n/g, "\\n");
    const now = new Date();
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Spyke//Prospection//FR", "CALSCALE:GREGORIAN"]
      .concat(
        rdv.flatMap((l) => {
          const s = new Date(l.rdv!);
          const e = new Date(s.getTime() + DUR * 60000);
          return [
            "BEGIN:VEVENT", "UID:" + l.id + "@spyke", "DTSTAMP:" + t(now),
            "DTSTART:" + t(s), "DTEND:" + t(e),
            "SUMMARY:Audit Spyke · " + cl(l.nom),
            "LOCATION:" + cl([l.adresse, l.cp, l.ville].filter(Boolean).join(" ")),
            "DESCRIPTION:" + cl([l.secteur, l.tel, l.contact && "Interlocuteur : " + l.contact, l.notes].filter(Boolean).join("\n")),
            "END:VEVENT",
          ];
        })
      )
      .concat("END:VCALENDAR").join("\r\n");
    telecharger("spyke-rdv-" + today() + ".ics", "text/calendar", ics);
    ctx.toast(rdv.length + " rendez-vous exporté" + (rdv.length > 1 ? "s" : ""));
  }

  /* ------------------------------------------------------ résultats et délais */
  const commerciaux = ctx.d.equipe.filter((m) => m.role !== "admin" && m.actif);
  const d7 = new Date(); d7.setDate(d7.getDate() - 6);
  const depuis = d7.toLocaleDateString("sv-SE");

  const delais = (() => {
    const a: number[] = [], b: number[] = [], c: number[] = [];
    for (const l of ctx.d.leads) {
      const d = ctx.d.deals.find((x) => x.lead_id === l.id);
      const j1 = jours(l.first_call, l.rdv_at);
      if (j1 != null && j1 >= 0) a.push(j1);
      const j2 = jours(l.rdv ? l.rdv.slice(0, 10) : null, d?.audit_date ?? null);
      if (j2 != null && j2 >= 0) b.push(j2);
      const j3 = jours(d?.audit_date ?? null, d?.projet_date ?? null);
      if (j3 != null && j3 >= 0) c.push(j3);
    }
    const passes = ctx.d.leads.filter((l) => l.rdv && l.rdv.slice(0, 10) <= today());
    const ok = passes.filter((l) => l.rdv_honore === true).length;
    const no = passes.filter((l) => l.statut === "no_show" || l.rdv_honore === false).length;
    return { a, b, c, ok, no };
  })();

  const ligneDelai = (lab: string, v: number | null, n: number) => (
    <div className="stat" key={lab}>
      <span>{lab}</span>
      <b>{v == null ? "—" : v + " j"}{n ? ` · ${n} cas` : ""}</b>
    </div>
  );

  const parSecteur = ctx.d.leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.secteur] = (acc[l.secteur] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="panel">
        <h3>Mes créneaux d&apos;audit</h3>
        <p className="hint">
          Coche les heures où tu es disponible chaque semaine. Le commercial ne voit que ces
          créneaux et ne peut caler un rendez-vous que dedans.
        </p>
        <div className="grid">
          <table>
            <tbody>
              <tr>
                <th />
                {HOURS.map((h) => <th key={h}>{h.slice(0, 2)}h</th>)}
              </tr>
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <tr key={d}>
                  <td className="d">{DAYS[d].slice(0, 3)}</td>
                  {HOURS.map((h) => (
                    <td key={h}>
                      <button
                        className="cell"
                        aria-pressed={ouvert(d, h)}
                        aria-label={`${DAYS[d]} ${h}`}
                        onClick={() => basculer(d, h)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="btns">
          <button className="btn ghost" onClick={semaineType}>Semaine type 9h-17h</button>
          <button className="btn ghost" onClick={toutDecocher}>Tout décocher</button>
        </div>
      </div>

      <div className="panel">
        <h3>Importer un fichier</h3>
        <p className="hint">
          Dépose un CSV Spyke. Les colonnes Cabinet, Ville, Téléphone et Priorité sont
          reconnues automatiquement, les numéros déjà présents sont ignorés.
        </p>
        <div className="drop" onClick={() => fichier.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void importer(e.dataTransfer.files); }}>
          <b>{enCours ? "Import en cours…" : "Déposer un fichier CSV"}</b>
          <span>ou cliquer pour choisir</span>
          <input
            ref={fichier} type="file" accept=".csv,text/csv" multiple className="hide"
            onChange={(e) => { void importer(e.target.files); e.target.value = ""; }}
          />
        </div>
        <label htmlFor="secIn">Secteur appliqué à cet import</label>
        <input
          type="text" id="secIn" placeholder="Deviné d'après le nom du fichier"
          value={secteurImport} onChange={(e) => setSecteurImport(e.target.value)}
        />
      </div>

      <div className="panel">
        <h3>Résultats par commercial</h3>
        <p className="hint">
          Compté à partir de l&apos;historique des appels. Chaque action est attribuée à la
          personne connectée.
        </p>
        <div className="scoreboard" style={{ marginTop: 12 }}>
          {commerciaux.length === 0 ? (
            <p className="hint">Ajoute un commercial pour voir ses résultats ici.</p>
          ) : (
            commerciaux.map((m) => {
              const siennes = ctx.d.leads.filter((l) => l.owner_id === m.id);
              const appels = ctx.d.activities.filter(
                (h) => h.author_id === m.id && h.label === "Appel passé"
              );
              const cj = appels.filter((h) => h.date === today()).length;
              const c7 = appels.filter((h) => h.date >= depuis).length;
              const rdv = siennes.filter((l) => l.statut === "rdv").length;
              const chauds = siennes.filter((l) => l.statut === "chaud").length;
              const taux = appels.length ? Math.round((rdv / appels.length) * 1000) / 10 : 0;
              const parRdv = rdv ? Math.round(appels.length / rdv) : 0;
              const gain = siennes.reduce((n, l) => {
                const d = ctx.d.deals.find((x) => x.lead_id === l.id);
                return n + (d && !d.perdu ? commission(d).total : 0);
              }, 0);
              const reste = siennes.reduce((n, l) => {
                const d = ctx.d.deals.find((x) => x.lead_id === l.id);
                return n + (d && !d.perdu ? commission(d).reste : 0);
              }, 0);
              return (
                <div className="score" key={m.id}>
                  <div className="h">
                    <b>{m.nom}</b>
                    <span>{siennes.length} fiche{siennes.length > 1 ? "s" : ""} en main</span>
                  </div>
                  <div className="g">
                    <div><b>{cj}</b><small>Aujourd&apos;hui</small></div>
                    <div><b>{c7}</b><small>7 jours</small></div>
                    <div><b className="hot">{chauds}</b><small>Chauds</small></div>
                    <div><b className="won">{rdv}</b><small>RDV</small></div>
                  </div>
                  <div className="rate">
                    {appels.length} appel{appels.length > 1 ? "s" : ""} au total · taux de RDV{" "}
                    <b>{taux} %</b>
                    {parRdv ? <> · un RDV tous les <b>{parRdv}</b> appels</> : null}
                  </div>
                  <div className="rate">
                    Commissions <b>{eur(gain)}</b>
                    {reste ? <> · reste <b>{eur(reste)}</b> à verser</> : " · tout est versé"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Equipe moi={ctx.moi} equipe={ctx.d.equipe} recharger={ctx.recharger} />

      <div className="panel">
        <h3>Délais médians du tunnel</h3>
        <p className="hint">
          Calculé sur les affaires terminées. C&apos;est là que tu vois où ça bloque.
        </p>
        <div style={{ marginTop: 10 }}>
          {ligneDelai("Premier appel → RDV calé", median(delais.a), delais.a.length)}
          {ligneDelai("RDV → audit encaissé", median(delais.b), delais.b.length)}
          {ligneDelai("Audit → projet encaissé", median(delais.c), delais.c.length)}
          <div className="stat">
            <span>Taux de présence aux RDV</span>
            <b>
              {delais.ok + delais.no
                ? Math.round((delais.ok / (delais.ok + delais.no)) * 100)
                : 0} %
              {delais.no ? ` · ${delais.no} absent${delais.no > 1 ? "s" : ""}` : ""}
            </b>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>État du fichier</h3>
        <div>
          <div className="stat"><span>Fiches au total</span><b>{ctx.d.leads.length}</b></div>
          <div className="stat">
            <span>Avec un numéro</span>
            <b>{ctx.d.leads.filter((l) => l.tel).length}</b>
          </div>
          <div className="stat">
            <span>Créneaux ouverts par semaine</span><b>{ctx.d.creneaux.length}</b>
          </div>
          {Object.keys(parSecteur).sort().map((k) => (
            <div className="stat" key={k}><span>{k}</span><b>{parSecteur[k]}</b></div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Sauvegarde</h3>
        <p className="hint">
          Les données vivent dans la base, sauvegardée par l&apos;hébergeur. L&apos;export
          reste utile pour travailler dans un tableur ou garder une copie hors ligne.
        </p>
        <div className="btns">
          <button className="btn" onClick={exporterICS}>Envoyer les RDV vers mon agenda</button>
          <button className="btn ghost" onClick={exporterCSV}>Exporter en CSV</button>
          <button className="btn ghost" onClick={() => void ctx.recharger()}>Recharger</button>
        </div>
        <p className="hint" style={{ marginTop: 10 }}>
          Le bouton agenda télécharge un fichier .ics : tu l&apos;ouvres et tous les
          rendez-vous d&apos;audit se posent dans Google Agenda, Outlook ou Apple Calendrier.
        </p>
      </div>
    </>
  );
}
