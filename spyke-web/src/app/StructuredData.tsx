/**
 * Données structurées JSON-LD (schema.org).
 *
 * Rendues sur toutes les pages via le layout racine : les moteurs de recherche
 * et les assistants IA (ChatGPT, Perplexity, Google AI) s'appuient dessus pour
 * identifier la marque avec certitude plutôt que de la déduire.
 *
 * Les champs sont volontairement limités aux informations vérifiables publiées
 * dans les mentions légales — ne rien inventer ici, une donnée fausse est pire
 * qu'une donnée absente.
 */

const SITE_URL = 'https://spykeapp.fr'

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Spyke',
  legalName: 'Spyke',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/hero-dashboard.jpg`,
    width: 1200,
    height: 630,
  },
  image: `${SITE_URL}/hero-dashboard.jpg`,
  description:
    "Spyke est l'assistant IA des freelances français : génération de devis, factures et contrats conformes en quelques clics.",
  email: 'contact@spykeapp.fr',
  taxID: '92923856600020',
  areaServed: {
    '@type': 'Country',
    name: 'France',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contact@spykeapp.fr',
      availableLanguage: ['French'],
      areaServed: 'FR',
    },
  ],
}

const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: 'Spyke',
  description:
    "Créez vos devis, factures et contrats freelance en quelques clics grâce à l'IA.",
  inLanguage: 'fr-FR',
  publisher: { '@id': `${SITE_URL}/#organization` },
}

const softwareApplication = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#app`,
  name: 'Spyke',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  inLanguage: 'fr-FR',
  description:
    "Assistant IA pour freelances français : devis, factures et contrats générés et conformes en quelques clics.",
  publisher: { '@id': `${SITE_URL}/#organization` },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Générateurs de devis, factures et contrats utilisables gratuitement sans inscription.',
  },
}

const graph = {
  '@context': 'https://schema.org',
  '@graph': [organization, website, softwareApplication],
}

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify échappe déjà le contenu ; on neutralise `<` pour éviter
      // toute fermeture prématurée de la balise <script>.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, '\\u003c'),
      }}
    />
  )
}
