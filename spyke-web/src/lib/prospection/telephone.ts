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
            if (origineCadre !== ev.origin) {
              origineCadre = ev.origin;
              trace("origine réelle du cadre :", ev.origin);
            }
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
  cache = false;
  sdk?.show?.();
}

/**
 * On rend le cadre transparent, sans le déplacer ni le redimensionner.
 *
 * Quatre façons de cacher tuent l'appel, et je les ai toutes essayées :
 *
 * - `display:none` suspend l'iframe : le navigateur cesse de la rendre.
 * - Le `hide()` du composant impose `max-height:0` : écrasée à zéro pixel.
 * - `left:-10000px` la sort du champ de vision du navigateur, qui la traite
 *   alors comme invisible : Chrome ralentit ses minuteries et lui refuse le
 *   micro. C'est la dernière en date, et c'est celle qui expliquait que le
 *   clavier accepte l'ordre — dial() renvoie true, l'ordre est délivré à la
 *   bonne origine — sans jamais composer.
 *
 * Le seul masquage qui laisse une iframe pleinement vivante est l'opacité :
 * elle reste à sa place, à sa taille, dans l'écran, donc le navigateur la rend
 * et la traite comme visible. Elle est simplement transparente, et ne prend
 * aucun clic.
 *
 * Rappel de ce qu'on sait : quand le clavier était affiché, cliquer sur le
 * numéro appelait. Tout ce qui a cassé depuis vient de la façon de le cacher.
 */
export function masquer() {
  const c = conteneur();
  if (c) {
    c.style.opacity = "0";
    c.style.pointerEvents = "none";
    // Repose la place que le composant lui donne, au cas où un masquage
    // précédent l'aurait déplacée ou rabotée. Sans surface, pas de son.
    c.style.position = "fixed";
    c.style.left = "";
    c.style.top = "";
    c.style.right = "64px";
    c.style.bottom = "0";
    c.style.maxHeight = "620px";
    c.style.height = "620px";
    c.style.width = "380px";
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

  // Sans micro, le clavier de l'opérateur accepte l'ordre et ne compose rien.
  if (!(await autoriserMicro())) {
    probleme =
      "Le micro est bloqué pour ce site. Clique sur le cadenas à gauche de l'adresse, autorise le micro, puis rappelle.";
    appel = null;
    prevenir();
    return { ok: false, erreur: probleme };
  }

  if (sdk && etat === "pret") {
    try {
      const rendu = sdk.dial(chiffres);
      trace("composant : dial(", chiffres, ") →", rendu);
      // Puis le même ordre, à la vraie adresse du cadre. Si celui du composant
      // a été délivré, le second est simplement redondant.
      composer(chiffres);
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
