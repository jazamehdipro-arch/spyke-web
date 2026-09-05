"use client";

/**
 * Appeler depuis Spyke, sans rien installer.
 *
 * Ringover publie un composant qui embarque sa webapp dans une iframe posée sur
 * la page. Le commercial s'y connecte une fois avec ses identifiants Ringover ;
 * ensuite, un clic sur le numéro d'une fiche déclenche l'appel, et la voix
 * passe par le casque de l'ordinateur.
 *
 * Pourquoi cette voie plutôt que l'API « callback », qui fait sonner le
 * téléphone avant de composer : elle ne demande ni logiciel, ni extension, ni
 * clé à gérer par personne. Chaque commercial se connecte avec son propre
 * compte Ringover — ce qui donne au passage le bon numéro affiché et le bon
 * historique côté opérateur.
 *
 * Le composant pose lui-même `allow="microphone;autoplay;…"` sur son iframe —
 * vérifié dans sa source. Rien à corriger de ce côté ; ce qu'il fallait ouvrir,
 * c'est la politique du site, qui coupait le micro sur toutes les pages.
 *
 * Le clavier de l'opérateur reste affiché, dans un coin. Le cacher a été essayé
 * de quatre façons — display:none, son propre hide(), la sortie d'écran, la
 * transparence — et chacune empêche l'appel de partir. On garde donc ce qui
 * marche : le clavier montre l'appel et porte le bouton pour raccrocher, Spyke
 * se contente de lui passer le numéro et de noter l'appel sur la fiche.
 *
 * Ce fichier ne suppose jamais que le composant est là. Sur un téléphone, ou si
 * Ringover est indisponible, l'écran retombe sur le lien « tel: » d'origine :
 * le commercial appelle avec son mobile, comme avant. Un outil d'appel qui ne
 * sait plus appeler parce qu'un tiers ne répond pas ne vaut rien.
 */

const CDN = "https://webcdn.ringover.com/resources/SDK/1.1.3/ringover-sdk.js";

/**
 * Traces. Trois hypothèses fausses sur pourquoi un appel ne partait pas ont
 * suffi : on écrit désormais ce qui se passe, plutôt que de le déduire.
 *
 * Tout est préfixé [spyke-tel] pour se retrouver d'un filtre dans la console,
 * et les messages venus de l'opérateur sont journalisés bruts — c'est le seul
 * moyen de voir s'il répond quelque chose quand on lui demande d'appeler.
 */
function trace(...args: unknown[]) {
  if (typeof console !== "undefined") console.log("[spyke-tel]", ...args);
}

export type Etat = "absent" | "chargement" | "a-connecter" | "pret" | "indisponible";

/** L'appel en cours, pour l'afficher aux couleurs de Spyke plutôt qu'à celles
 *  de l'opérateur. */
export type Appel = { numero: string; depuis: number; confirme: boolean } | null;

type SdkRingover = {
  generate: (options?: Record<string, unknown>) => void;
  destroy?: () => void;
  show?: () => void;
  hide?: () => void;
  dial: (numero: string, depuis?: string) => boolean | void;
  on: (evenement: string, rappel: (donnees?: unknown) => void) => void;
};

let sdk: SdkRingover | null = null;
let etat: Etat = "absent";
let appel: Appel = null;
let probleme = "";
let veille: number | null = null;
/* L'origine réelle du cadre, apprise de ses propres messages. Voir composer(). */
let origineCadre: string | null = null;
let chargement: Promise<void> | null = null;
const abonnes = new Set<() => void>();

function prevenir() { abonnes.forEach((f) => f()); }

function poser(e: Etat) {
  if (etat === e) return;
  etat = e;
  prevenir();
}

export function appelEnCours(): Appel { return appel; }
export function problemeCourant(): string { return probleme; }

/**
 * Le composant dit « oui » à une demande d'appel sans garantir qu'il l'a
 * passée. La preuve qu'un appel est réellement parti, c'est la sonnerie qu'il
 * annonce ensuite. Faute de quoi, au bout de quelques secondes, on cesse de
 * prétendre : le chronomètre s'efface et son clavier reparaît, pour que la
 * personne puisse composer à la main plutôt que de fixer un compteur menteur.
 */
function surveillerLeDepart() {
  if (veille) window.clearTimeout(veille);
  veille = window.setTimeout(() => {
    veille = null;
    if (!appel || appel.confirme) return;
    trace("aucune sonnerie après 6 s — l'appel n'est pas parti");
    appel = null;
    probleme = "Rien n'a sonné. Vérifie que le clavier Ringover est ouvert et connecté.";
    afficher();
    prevenir();
  }, 6000);
}

export function etatCourant(): Etat {
  return etat;
}

export function sAbonner(f: () => void): () => void {
  abonnes.add(f);
  return () => { abonnes.delete(f); };
}

/** Charge le composant. Sans effet si déjà chargé ; sans conséquence s'il échoue. */
export function charger(): Promise<void> {
  if (chargement) return chargement;
  if (typeof window === "undefined") return Promise.resolve();

  poser("chargement");

  chargement = new Promise<void>((resolve) => {
    const s = document.createElement("script");
    s.src = CDN;
    s.async = true;
    s.onload = () => {
      const Constructeur = (window as unknown as { RingoverSDK?: new () => SdkRingover }).RingoverSDK;
      if (!Constructeur) { poser("indisponible"); resolve(); return; }
      try {
        sdk = new Constructeur();
        sdk.on("dialerReady", (d) => { trace("clavier prêt", d); poser("pret"); });
        sdk.on("login", (d) => { trace("connecté", d); poser("pret"); });
        sdk.on("logout", (d) => { trace("déconnecté", d); poser("a-connecter"); });
        for (const e of ["answeredCall", "changePage", "smsSent", "smsReceived"]) {
          sdk.on(e, (d) => trace("événement", e, d));
        }
        // Tout ce que l'iframe envoie à la page, y compris ce que le composant
        // ne relaie pas : c'est là qu'on verra un éventuel refus.
        window.addEventListener("message", (ev) => {
          if (typeof ev.origin === "string" && ev.origin.includes("ringover.com")) {
            if (origineCadre !== ev.origin) {
              origineCadre = ev.origin;
              trace("origine réelle du cadre :", ev.origin);
            }
            trace("message reçu de l'opérateur", ev.data);
          }
        });
        sdk.on("ringingCall", (d) => {
          trace("sonnerie", d);
          const brut = d as { to_number?: string; data?: { to_number?: string } } | undefined;
          const n = brut?.to_number ?? brut?.data?.to_number ?? appel?.numero ?? "";
          // La sonnerie est la preuve que l'appel est bien parti.
          appel = { numero: n, depuis: appel?.depuis ?? Date.now(), confirme: true };
          probleme = "";
          prevenir();
        });
        sdk.on("hangupCall", () => {
          if (veille) { window.clearTimeout(veille); veille = null; }
          appel = null; probleme = ""; prevenir();
        });
        sdk.generate({ type: "fixed", position: "bottom-right" });
        poser("a-connecter");
      } catch {
        poser("indisponible");
      }
      resolve();
    };
    s.onerror = () => { poser("indisponible"); resolve(); };
    document.head.appendChild(s);
  });
  return chargement;
}

/** Le cadre que le composant pose sur la page. */
function conteneur(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[id^="ringover-iframe-container"]');
}

/** Le lanceur flottant que le composant pose aussi sur la page. */
function lanceurs(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[id^="ringover-"]'))
    .filter((e) => e.tagName !== "IFRAME" && !e.id.startsWith("ringover-iframe-container"));
}

/**
 * Remet le clavier de l'opérateur en évidence.
 *
 * Il reste affiché en permanence, et c'est un choix assumé. Quatre façons de le
 * cacher ont été essayées — display:none, le hide() du composant, la sortie
 * d'écran, la transparence — et aucune ne laisse l'appel partir : le clavier
 * accepte l'ordre, dit oui, et ne compose rien. Plutôt qu'un cinquième essai,
 * on garde ce qui marche. Le commercial voit un petit clavier dans le coin, il
 * clique sur le numéro dans Spyke, ça appelle, et il raccroche là où l'appel
 * se passe.
 */
export function afficher() {
  const c = conteneur();
  if (c) {
    c.style.position = "fixed";
    c.style.left = "";
    c.style.top = "";
    c.style.right = "64px";
    c.style.bottom = "0";
    c.style.pointerEvents = "";
    c.style.opacity = "1";
    c.style.maxHeight = "620px";
  }
  lanceurs().forEach((e) => { e.style.display = ""; });
  sdk?.show?.();
}

/**
 * Compose le numéro.
 *
 * Le clavier de l'opérateur est affiché : c'est lui qui mène l'appel, montre
 * l'état et porte le bouton pour raccrocher. Spyke se contente de lui passer le
 * numéro, puis de noter l'appel dans l'historique de la fiche.
 *
 * Le repli par le serveur ne sert plus que si le clavier n'est pas prêt — pas
 * connecté, pas chargé. Tant qu'il l'est, on ne double pas l'ordre : deux voies
 * lancées sur un seul clic, c'est le risque d'appeler deux fois.
 */
export async function appeler(
  numeroE164: string,
  jeton: string
): Promise<{ ok: boolean; erreur?: string }> {
  const chiffres = numeroE164.replace(/\D/g, "");
  probleme = "";

  if (sdk && etat === "pret") {
    // Le micro est demandé depuis Spyke : le clavier est un cadre d'un autre
    // domaine, il n'obtient l'autorisation que si la page qui l'héberge l'a.
    await autoriserMicro();
    try {
      const rendu = sdk.dial(chiffres);
      trace("composant : dial(", chiffres, ") →", rendu);
      composer(chiffres);
      afficher();
      if (rendu !== false) {
        appel = { numero: chiffres, depuis: Date.now(), confirme: false };
        surveillerLeDepart();
        prevenir();
        return { ok: true };
      }
    } catch (e) {
      trace("composant : dial a échoué", e);
    }
  }

  return appelerParLeServeur(chiffres, jeton);
}

/**
 * Envoie l'ordre d'appeler au cadre, à sa vraie adresse.
 *
 * Le composant adresse ses ordres à « app.ringover.com », en dur. Or le cadre
 * n'y reste pas : il part sur un autre sous-domaine — ce qui s'est vu quand
 * autoriser app.ringover.com dans la politique de sécurité du site n'a pas
 * suffi et qu'il a fallu ouvrir tout ringover.com. Le navigateur refuse alors
 * de délivrer un message adressé à une origine qui n'est pas celle du
 * destinataire : l'ordre part, personne ne le reçoit. Les événements en sens
 * inverse passent, eux, puisque c'est le cadre qui choisit son adresse.
 *
 * On réémet donc l'ordre nous-mêmes, vers l'origine que le cadre a lui-même
 * employée pour nous écrire. On ne l'invente pas : on ne répond qu'à qui a
 * déjà parlé.
 */
function composer(chiffres: string): boolean {
  const f = document.querySelector<HTMLIFrameElement>('iframe[id^="ringover-iframe-"]');
  if (!f?.contentWindow) return false;
  const cible = origineCadre ?? "https://app.ringover.com";
  try {
    f.contentWindow.postMessage({ action: "dial", number: chiffres, from_number: null }, cible);
    trace("ordre d'appel réémis vers", cible);
    return true;
  } catch (e) {
    trace("réémission impossible", e);
    return false;
  }
}

/**
 * Demande le micro depuis Spyke, avant le premier appel.
 *
 * Le clavier de l'opérateur est un cadre d'un autre domaine, posé hors champ.
 * Pour téléphoner il lui faut le micro, et un cadre étranger ne l'obtient que
 * si la page qui l'héberge — spykeapp.fr — a elle-même l'autorisation. Or
 * Chrome n'affiche pas volontiers sa demande pour un cadre invisible : elle
 * part, personne ne la voit, elle est refusée en silence. Le clavier accepte
 * alors l'ordre d'appel, dit oui, et ne compose rien. C'est exactement ce
 * qu'on observait.
 *
 * On la demande donc nous-mêmes, depuis la page visible et au moment du clic.
 * Une fois accordée à spykeapp.fr, le cadre en hérite sans redemander. Le flux
 * est refermé aussitôt : Spyke n'écoute rien, il ouvre juste la porte.
 */
let micro: "inconnu" | "accorde" | "refuse" = "inconnu";

export async function autoriserMicro(): Promise<boolean> {
  if (micro === "accorde") return true;
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return true;
  try {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
    flux.getTracks().forEach((piste) => piste.stop());
    micro = "accorde";
    trace("micro autorisé");
    return true;
  } catch (e) {
    micro = "refuse";
    trace("micro refusé", e);
    return false;
  }
}

async function appelerParLeServeur(
  chiffres: string,
  jeton: string
): Promise<{ ok: boolean; erreur?: string }> {
  try {
    const rep = await fetch("/api/prospection/appeler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jeton, numero: chiffres }),
    });
    const r = (await rep.json()) as { ok: boolean; erreur?: string };
    trace("serveur : demande d'appel →", r);
    if (!r.ok) {
      appel = null;
      probleme = r.erreur ?? "L'appel n'est pas parti.";
      afficher();
      prevenir();
      return r;
    }
    appel = { numero: chiffres, depuis: appel?.depuis ?? Date.now(), confirme: false };
    surveillerLeDepart();
    prevenir();
    return r;
  } catch {
    appel = null;
    probleme = "Le serveur n'a pas répondu.";
    prevenir();
    return { ok: false, erreur: probleme };
  }
}
