/* Service worker de l'outil de prospection.
 *
 * DÉLIMITATION — le point le plus important de ce fichier.
 *
 * Ce fichier est servi depuis /prospection/, ce qui plafonne sa portée à
 * /prospection/ : il ne pilotera jamais les pages devis, factures ou contrats.
 * Cette garantie vient du navigateur, pas d'une règle écrite ici.
 *
 * Mais la portée ne limite que les PAGES contrôlées, pas les REQUÊTES qu'elles
 * émettent : une page de /prospection/ qui demande une facture ferait tout de
 * même passer la requête par ici. On ne répond donc qu'à deux familles d'URL,
 * et on laisse le navigateur faire son travail habituel pour tout le reste.
 *
 * STRATÉGIES
 *
 * - /_next/static/… : le contenu est figé, son nom porte une empreinte. Cache
 *   d'abord, réseau seulement si absent. C'est ce qui permet à l'application de
 *   s'ouvrir sans réseau.
 * - Navigation vers /prospection… : réseau d'abord, cache en secours. Dans cet
 *   ordre, sinon un déploiement ne serait jamais vu par quelqu'un qui a déjà
 *   ouvert l'application.
 *
 * Ce qui n'est JAMAIS mis en cache : les appels à Supabase. Servir des fiches
 * périmées depuis le cache HTTP masquerait l'état réel de la connexion, alors
 * que l'application, elle, sait déjà les conserver — et sait le dire.
 */

const CACHE = "spyke-prospection-v1";

self.addEventListener("install", (e) => {
  // La coquille de l'application, pour que /prospection réponde hors ligne dès
  // la première coupure, même si la personne n'y est pas encore retournée.
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["/prospection", "/prospection/connexion"]))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Supabase et le reste

  const statique = url.pathname.startsWith("/_next/static/");
  const aNous = url.pathname === "/prospection" || url.pathname.startsWith("/prospection/");
  if (!statique && !aNous) return;

  if (statique) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((rep) => {
          if (rep.ok) {
            const copie = rep.clone();
            caches.open(CACHE).then((c) => c.put(req, copie));
          }
          return rep;
        })
      )
    );
    return;
  }

  e.respondWith(
    fetch(req)
      .then((rep) => {
        if (rep.ok) {
          const copie = rep.clone();
          caches.open(CACHE).then((c) => c.put(req, copie));
        }
        return rep;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match("/prospection"))
      )
  );
});
