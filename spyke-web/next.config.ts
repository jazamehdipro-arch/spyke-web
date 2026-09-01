import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Content-Security-Policy.
 *
 * Choix assumés, dictés par ce que l'application charge réellement :
 *
 * - `'unsafe-inline'` sur script-src : les pages calculateurs embarquent des
 *   scripts inline, et les blocs JSON-LD sont inline eux aussi. Une CSP à base
 *   de nonce imposerait un middleware qui rendrait toutes les pages dynamiques
 *   et détruirait le rendu statique (et donc les scores de performance).
 *   L'essentiel de la protection vient ici de la restriction des *origines*.
 * - `'unsafe-inline'` sur style-src : styled-jsx, les blocs <style> des pages
 *   et les milliers de style={{…}} React l'exigent.
 * - pas de `'unsafe-eval'` en production : pdf.js détecte que eval est bloqué
 *   et bascule seul sur son interpréteur. En dev, le bundler en a besoin.
 * - img-src https: : les logos que l'utilisateur renseigne peuvent pointer
 *   vers n'importe quel domaine. Une image ne peut pas exécuter de code ; on
 *   se contente d'interdire le http: en clair.
 * - frame-ancestors 'self' (et non 'none') : l'app affiche ses propres PDF
 *   dans des iframes de même origine. 'none' les bloquerait aussi.
 */
function buildCsp(extra: Partial<Record<string, string[]>> = {}) {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'", 'https://checkout.stripe.com', 'https://billing.stripe.com'],
    'script-src': ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", ...(isDev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    // Supabase : REST + Auth en https, Realtime en wss. Le wildcard évite de
    // coder en dur la référence du projet, absente du dépôt.
    'connect-src': ["'self'", 'blob:', 'data:', 'https://*.supabase.co', 'wss://*.supabase.co'],
    // Aperçus PDF (blob: et routes /api internes), PDF signés servis depuis le
    // stockage Supabase, et le tunnel de signature Yousign.
    'frame-src': [
      "'self'",
      'blob:',
      'data:',
      'https://*.supabase.co',
      'https://yousign.app',
      'https://*.yousign.app',
    ],
    'worker-src': ["'self'", 'blob:'],
    'media-src': ["'self'", 'blob:', 'data:'],
    'manifest-src': ["'self'"],
  }

  for (const [key, values] of Object.entries(extra)) {
    directives[key] = [...(directives[key] ?? []), ...(values ?? [])]
  }

  const serialized = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')

  return `${serialized}; upgrade-insecure-requests`
}

const securityHeaders = [
  { key: 'Content-Security-Policy', value: buildCsp() },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'usb=()',
      'xr-spatial-tracking=()',
    ].join(', '),
  },
]

/**
 * Prototype autonome historique, encore servi depuis public/. Il charge jsPDF
 * via cdnjs, les Google Fonts, et appelle l'API Anthropic depuis le navigateur
 * avec une clé saisie par l'utilisateur. On lui laisse les origines dont il a
 * besoin plutôt que d'élargir la politique de tout le site.
 */
const legacyPageHeaders = [
  ...securityHeaders.filter((h) => h.key !== 'Content-Security-Policy'),
  {
    key: 'Content-Security-Policy',
    value: buildCsp({
      'script-src': ['https://cdnjs.cloudflare.com'],
      'style-src': ['https://fonts.googleapis.com'],
      'font-src': ['https://fonts.gstatic.com'],
      'connect-src': ['https://api.anthropic.com'],
    }),
  },
]

/**
 * Outil de prospection, servi sous /prospection.
 *
 * C'est une application séparée (dépôt spyke-prospection, base Supabase
 * distincte) : elle a ses propres tables, ses propres comptes, et un CSS global
 * hérité de son prototype qui écraserait celui du site s'il était importé ici.
 * On la laisse donc chez elle et on renvoie l'URL vers son déploiement.
 *
 * Pour le visiteur c'est bien spykeapp.fr/prospection : le renvoi est fait par
 * le serveur, l'adresse ne change pas dans la barre du navigateur, et les
 * cookies de session restent sur le domaine spykeapp.fr.
 *
 * Côté application de prospection, next.config.ts porte basePath: '/prospection'
 * pour que ses liens et ses fichiers statiques gardent le même préfixe.
 */
const PROSPECTION_ORIGIN = 'https://spyke-prospection-mehdis-projects-2102cbdc.vercel.app'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/prospection',
        destination: `${PROSPECTION_ORIGIN}/prospection`,
      },
      {
        source: '/prospection/:path*',
        destination: `${PROSPECTION_ORIGIN}/prospection/:path*`,
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    // Next.js applique toutes les règles qui matchent : la dernière l'emporte
    // pour une même clé d'en-tête. La règle spécifique doit donc venir après
    // la règle générale, sans quoi `/:path*` l'écrase.
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/spyke-v3_1.html', headers: legacyPageHeaders },
    ]
  },
}

export default nextConfig
