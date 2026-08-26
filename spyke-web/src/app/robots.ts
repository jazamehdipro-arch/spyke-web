import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Espaces authentifiés et endpoints techniques : aucun intérêt pour
        // l'indexation, et inutile de les exposer aux crawlers.
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: 'https://spykeapp.fr/sitemap.xml',
    host: 'https://spykeapp.fr',
  }
}
