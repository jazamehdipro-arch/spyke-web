const base = 'https://www.spykeapp.fr'

function xmlEscape(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildSitemapXml(urls: Array<{ loc: string; lastmod?: string }>) {
  const body = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : ''
      return `<url><loc>${xmlEscape(u.loc)}</loc>${lastmod}</url>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>\n`
}

export async function GET() {
  const now = new Date().toISOString()

  const urls: Array<{ loc: string; lastmod?: string }> = [
    { loc: `${base}/`, lastmod: now },

    // SEO tools (public)
    { loc: `${base}/devis-freelance`, lastmod: now },
    { loc: `${base}/facture-auto-entrepreneur`, lastmod: now },
    { loc: `${base}/contrat-freelance`, lastmod: now },

    // Static pages
    { loc: `${base}/comment-ca-marche.html`, lastmod: now },
    { loc: `${base}/fonctionnalites.html`, lastmod: now },
    { loc: `${base}/tarifs.html`, lastmod: now },
    { loc: `${base}/mentions-legales.html`, lastmod: now },
    { loc: `${base}/confidentialite.html`, lastmod: now },
    { loc: `${base}/cgu.html`, lastmod: now },

    // App / auth
    { loc: `${base}/login`, lastmod: now },
  ]

  const xml = buildSitemapXml(urls)

  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // Reasonable caching for a mostly-static sitemap
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
