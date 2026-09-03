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
 * Ce fichier ne suppose jamais que le composant est là. Sur un téléphone, ou si
 * Ringover est indisponible, l'écran retombe sur le lien « tel: » d'origine :
 * le commercial appelle avec son mobile, comme avant. Un outil d'appel qui ne
 * sait plus appeler parce qu'un tiers ne répond pas ne vaut rien.
 */

const CDN = "https://webcdn.ringover.com/resources/SDK/1.1.3/ringover-sdk.js";

export type Etat = "absent" | "chargement" | "a-connecter" | "pret" | "indisponible";

/** L'appel en cours, pour l'afficher aux couleurs de Spyke plutôt qu'à celles
 *  de l'opérateur. */
export type Appel = { numero: string; depuis: number } | null;

type SdkRingover = {
  generate: (options?: Record<string, unknown>) => void;
  destroy?: () => void;
  show?: () => void;
  hide?: () => void;
  dial: (numero: string, depuis?: string) => void;
  on: (evenement: string, rappel: (donnees?: unknown) => void) => void;
};

let sdk: SdkRingover | null = null;
let etat: Etat = "absent";
let appel: Appel = null;
let chargement: Promise<void> | null = null;
const abonnes = new Set<() => void>();

function prevenir() { abonnes.forEach((f) => f()); }

function poser(e: Etat) {
  if (etat === e) return;
  etat = e;
  prevenir();
}

export function appelEnCours(): Appel { return appel; }

export function etatCourant(): Etat {
  return etat;
}

export function sAbonner(f: () => void): () => void {
  abonnes.add(f);
  return () => { abonnes.delete(f); };
}

/**
 * Le composant crée son iframe lui-même. Une iframe d'une autre origine n'a pas
 * le micro sans l'attribut `allow` — sans lui l'appel part, mais personne ne
 * nous entend. On le pose donc dès son apparition, avant qu'elle ne charge.
 */
function surveillerIframe() {
  const equiper = (n: Element) => {
    if (n.tagName !== "IFRAME") return;
    const f = n as HTMLIFrameElement;
    if (!f.src.includes("ringover.com")) return;
    if (f.getAttribute("allow")?.includes("microphone")) return;
    // Posé à l'insertion, donc avant que l'iframe ne charge : l'attribut sera
    // lu à temps. On ne force surtout pas un rechargement pour le cas
    // contraire — le composant établit un dialogue avec sa page dès son
    // ouverture, et le relancer sous ses pieds le laisse dans le vide.
    f.setAttribute("allow", "microphone; autoplay; clipboard-write");
  };

  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        equiper(n);
        n.querySelectorAll?.("iframe").forEach(equiper);
      });
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll("iframe").forEach(equiper);
  return obs;
}

/** Charge le composant. Sans effet si déjà chargé ; sans conséquence s'il échoue. */
export function charger(): Promise<void> {
  if (chargement) return chargement;
  if (typeof window === "undefined") return Promise.resolve();

  poser("chargement");
  surveillerIframe();

  chargement = new Promise<void>((resolve) => {
    const s = document.createElement("script");
    s.src = CDN;
    s.async = true;
    s.onload = () => {
      const Constructeur = (window as unknown as { RingoverSDK?: new () => SdkRingover }).RingoverSDK;
      if (!Constructeur) { poser("indisponible"); resolve(); return; }
      try {
        sdk = new Constructeur();
        sdk.on("dialerReady", () => { poser("pret"); masquer(); });
        sdk.on("login", () => { poser("pret"); masquer(); });
        sdk.on("logout", () => poser("a-connecter"));
        sdk.on("ringingCall", (d) => {
          const n = (d as { to_number?: string } | undefined)?.to_number;
          appel = { numero: n ?? "", depuis: Date.now() };
          prevenir();
        });
        sdk.on("hangupCall", () => { appel = null; masquer(); prevenir(); });
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
function elementsRingover(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[id^="ringover-"]'));
}

export function afficher() {
  elementsRingover().forEach((e) => { e.style.display = ""; });
  sdk?.show?.();
}

export function masquer() {
  sdk?.hide?.();
  elementsRingover().forEach((e) => { e.style.display = "none"; });
}

export function estVisible(): boolean {
  return elementsRingover().some((e) => e.style.display !== "none");
}

/**
 * Compose le numéro. Rend `false` si le composant n'est pas en état d'appeler —
 * l'écran retombe alors sur le lien « tel: », qui marche partout.
 */
export function appeler(numeroE164: string): boolean {
  if (!sdk || etat !== "pret") return false;
  try {
    sdk.dial(numeroE164);
    appel = { numero: numeroE164, depuis: Date.now() };
    prevenir();
    return true;
  } catch {
    return false;
  }
}
