import type { Metadata } from 'next'
import SeoFacturePage from '@/components/seo/SeoFacturePage'

export const metadata: Metadata = {
  title: 'Générateur de Facture Gratuit en Ligne — Spyke',
  description:
    'Créez une facture professionnelle gratuitement en 2 minutes. Téléchargez votre facture en PDF, claire et prête à envoyer. Sans inscription.',
  alternates: { canonical: 'https://www.spykeapp.fr/facture-auto-entrepreneur' },
  openGraph: {
    title: 'Générateur de Facture Gratuit — Spyke',
    description: 'Créez une facture professionnelle en 2 minutes. Téléchargez en PDF gratuitement, sans inscription.',
    url: 'https://www.spykeapp.fr/facture-auto-entrepreneur',
    type: 'website',
  },
}

export default function Page() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Quelles sont les mentions obligatoires sur une facture ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Une facture doit notamment contenir : la date, un numéro unique, l'identité du vendeur/prestataire (nom/raison sociale, adresse, SIRET), l'identité du client, le détail des prestations, les montants HT/TVA/TTC et les conditions de paiement.",
        },
      },
      {
        '@type': 'Question',
        name: "Puis-je faire une facture gratuitement sans inscription ?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Oui : vous pouvez générer 1 facture gratuitement depuis cette page. Pour en générer davantage, créez un compte Spyke.",
        },
      },
    ],
  }

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Générateur de Facture Gratuit — Spyke',
    description: 'Créez une facture professionnelle gratuitement en ligne. Téléchargez en PDF.',
    url: 'https://www.spykeapp.fr/facture-auto-entrepreneur',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <SeoFacturePage />

      <section style={{ maxWidth: 900, margin: '56px auto 0', padding: '0 40px' }}>
        <div style={{ width: 60, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.6px' }}>Comment faire une facture auto-entrepreneur ?</h2>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Une facture propre et numérotée est indispensable pour votre comptabilité. Avec Spyke, vous générez un PDF clair et prêt à envoyer.
        </p>
        <div style={{ marginTop: 26, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/devis-freelance" style={{ color: '#0a0a0a', textDecoration: 'underline', fontWeight: 700 }}>Créer un devis gratuit</a>
          <a href="/contrat-freelance" style={{ color: '#0a0a0a', textDecoration: 'underline', fontWeight: 700 }}>Créer un contrat gratuit</a>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '56px auto 0', padding: '28px 40px', borderTop: '1px solid #e4e4e7', color: '#a1a1aa', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <span>© 2026 Spyke — Tous droits réservés</span>
        <span style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <a href="/mentions-legales.html" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Mentions légales</a>
          <a href="/confidentialite.html" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Confidentialité</a>
          <a href="/" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Accueil</a>
        </span>
      </div>
    </>
  )
}
