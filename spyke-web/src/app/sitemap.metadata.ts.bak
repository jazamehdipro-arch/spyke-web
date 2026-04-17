import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.spykeapp.fr'
  const now = new Date()

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },

    // SEO tools (public)
    { url: `${base}/devis-freelance`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/facture-auto-entrepreneur`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/contrat-freelance`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },

    // App / auth
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]
}
