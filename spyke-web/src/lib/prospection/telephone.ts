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
 * Le composant ne sait pas raccrocher : ses six commandes sont dial, sendSMS,
 * openCallLog, changePage, reload et presenceSDK. L'API serveur de l'opérateur,
 * elle, le sait — le bouton « Raccrocher » de Spyke passe donc par le serveur,
 * seul endroit où la clé API a le droit d'exister.
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
        sdk.on("dialerReady", (d) => { trace("clavier prêt", d); poser("pret"); masquer(); });
        sdk.on("login", (d) => { trace("connecté", d); poser("pret"); masquer(); });
        sdk.on("logout", (d) => { trace("déconnecté", d); poser("a-connecter"); });
        for (const e of ["answeredCall", "changePage", "smsSent", "smsReceived"]) {
          sdk.on(e, (d) => trace("événement", e, d));
        }
        // Tout ce que l'iframe envoie à la page, y compris ce que le composant
        // ne relaie pas : c'est là qu'on verra un éventuel refus.
        window.addEventListener("message", (ev) => {
          if (typeof ev.origin === "string" && ev.origin.includes("ringover.com")) {
            trace("message reçu de l'opérateur", ev.data);
          }
        });
        sdk.on("ringingCall", (d) => {
          // Le composant appelle show() de lui-même à chaque sonnerie — lu dans
          // sa source. Sans ce remasquage, il réapparaîtrait à chaque appel et
          // tout le travail de discrétion serait annulé.
          trace("sonnerie", d);
          masquer();
          const brut = d as { to_number?: string; data?: { to_number?: string } } | undefined;
          const n = brut?.to_number ?? brut?.data?.to_number ?? appel?.numero ?? "";
          // La sonnerie est la preuve que l'appel est bien parti.
          appel = { numero: n, depuis: appel?.depuis ?? Date.now(), confirme: true };
          probleme = "";
          prevenir();
        });
        sdk.on("hangupCall", () => {
          if (veille) { window.clearTimeout(veille); veille = null; }
          appel = null; probleme = ""; masquer(); prevenir();
        });
        sdk.generate({ type: "fixed", position: "bottom-right" });
        poser("a-connecter");
        // Masqué dès l'ouverture : sans ça le clavier de l'opérateur s'installe
        // dans un coin de l'écran et n'en bouge plus.
        setTimeout(masquer, 0);
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

/**
 * Le composant pose deux éléments sur la page : son cadre et un lanceur
 * flottant. `hide()` ne s'occupe que du premier ; on masque les deux nous-mêmes.
 *
 * Le commercial ne doit pas voir l'interface de l'opérateur : il travaille dans
 * Spyke, il clique sur un numéro, ça appelle. Le clavier reste accessible d'un
 * bouton pour les cas où il faut raccrocher soi-même — le composant n'expose
 * pas de fonction pour le faire à sa place.
 */
function conteneur(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[id^="ringover-iframe-container"]');
}

/** Le lanceur flottant que le composant pose aussi sur la page. */
function lanceurs(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[id^="ringover-"]'))
    .filter((e) => e.tagName !== "IFRAME" && !e.id.startsWith("ringover-iframe-container"));
}

let cache = false;

export function afficher() {
  const c = conteneur();
  if (c) {
    c.style.position = "";
    c.style.left = "";
    c.style.top = "";
    c.style.pointerEvents = "";
    c.style.opacity = "1";
  }
  lanceurs().forEach((e) => { e.style.display = ""; });
  cache = false;
  sdk?.show?.();
}

/**
 * On sort le cadre de l'écran, en le laissant intact par ailleurs.
 *
 * Deux façons de cacher tuent l'appel, et j'ai fait les deux :
 *
 * - `display:none` suspend l'iframe. Le navigateur cesse de la rendre et la
 *   communication audio ne peut pas s'établir.
 * - Le `hide()` du composant impose `max-height:0` à son cadre. L'iframe est
 *   écrasée à zéro pixel de haut, ce qui revient au même.
 *
 * Dans les deux cas le chronomètre partait sans qu'aucun téléphone ne sonne.
 * On ne l'appelle donc plus, et on repose explicitement la hauteur au cas où il
 * l'aurait déjà rabotée.
 *
 * Hors champ mais à sa taille normale, le composant fonctionne : il est
 * simplement invisible. L'iframe, elle, n'est jamais touchée.
 */
export function masquer() {
  const c = conteneur();
  if (c) {
    c.style.position = "fixed";
    c.style.left = "-10000px";
    c.style.top = "0";
    c.style.pointerEvents = "none";
    // Repose ce que hide() aurait pu raboter. Sans hauteur, pas de son.
    c.style.maxHeight = "620px";
    c.style.height = "620px";
    c.style.width = "380px";
    c.style.opacity = "1";
    c.style.display = "";
  }
  lanceurs().forEach((e) => { e.style.display = "none"; });
  cache = true;
}

export function estVisible(): boolean {
  return !cache;
}

/**
 * Compose le numéro. Deux voies, essayées dans l'ordre sur un seul clic.
 *
 * D'abord le composant embarqué, avec le numéro EN CHIFFRES SEULS. C'est le
 * format que leur API impose ailleurs — « digits only » — et le composant
 * transmet ce qu'on lui donne sans le corriger : envoyer « +33… » revenait
 * peut-être à lui parler une langue qu'il ne comprend pas, ce qui expliquerait
 * qu'il accepte l'ordre sans rien faire.
 *
 * Si rien ne sonne, on demande l'appel à leur serveur avec la clé API. Les deux
 * voies échouant pour des raisons différentes, les essayer toutes les deux est
 * le seul moyen d'en avoir une qui marche sans un aller-retour de plus.
 */
export async function appeler(
  numeroE164: string,
  jeton: string
): Promise<{ ok: boolean; erreur?: string }> {
  const chiffres = numeroE164.replace(/\D/g, "");
  probleme = "";

  if (sdk && etat === "pret") {
    try {
      const rendu = sdk.dial(chiffres);
      trace("composant : dial(", chiffres, ") →", rendu);
      if (rendu !== false) {
        appel = { numero: chiffres, depuis: Date.now(), confirme: false };
        prevenir();
        setTimeout(masquer, 0);
        // Laissé quatre secondes pour sonner. Passé ce délai, on ne s'obstine
        // pas : on passe à l'autre voie plutôt que d'attendre en vain.
        const aSonne = await attendreSonnerie(4000);
        if (aSonne) return { ok: true };
        trace("composant : rien n'a sonné, on passe par le serveur");
      }
    } catch (e) {
      trace("composant : dial a échoué", e);
    }
  }

  return appelerParLeServeur(chiffres, jeton);
}

/** Vrai si la sonnerie est annoncée avant l'échéance. */
function attendreSonnerie(ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (appel?.confirme) return resolve(true);
    const fin = Date.now() + ms;
    const t = window.setInterval(() => {
      if (appel?.confirme) { window.clearInterval(t); resolve(true); }
      else if (Date.now() > fin) { window.clearInterval(t); resolve(false); }
    }, 150);
  });
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

/**
 * Raccroche l'appel en cours.
 *
 * Le composant ne sait pas le faire ; l'API de l'opérateur, si. Elle exige la
 * clé API, qui reste sur le serveur : la demande passe donc par Spyke.
 */
export async function raccrocher(jeton: string): Promise<{ ok: boolean; erreur?: string }> {
  if (!appel) return { ok: false, erreur: "Aucun appel en cours." };
  try {
    const rep = await fetch("/api/prospection/raccrocher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jeton, numero: appel.numero }),
    });
    const r = (await rep.json()) as { ok: boolean; erreur?: string };
    if (r.ok) { appel = null; probleme = ""; prevenir(); }
    return r;
  } catch {
    return { ok: false, erreur: "Le serveur n'a pas répondu." };
  }
}
