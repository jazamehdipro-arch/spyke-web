import type { Metadata } from 'next'
import SeoContratPage from '@/components/seo/SeoContratPage'

export const metadata: Metadata = {
  title: 'Générateur de Contrat Freelance Gratuit — Spyke',
  description:
    'Créez un contrat de prestation freelance gratuitement. Modifiez le texte et téléchargez votre contrat en PDF. Sans inscription.',
  alternates: { canonical: 'https://www.spykeapp.fr/contrat-freelance' },
  openGraph: {
    title: 'Générateur de Contrat Freelance Gratuit — Spyke',
    description: 'Créez un contrat freelance gratuitement. Téléchargez en PDF sans inscription.',
    url: 'https://www.spykeapp.fr/contrat-freelance',
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
        name: 'Pourquoi faire un contrat de prestation de services ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Un contrat précise le périmètre, le prix, les responsabilités et les conditions de résiliation. Il réduit les risques de litige.",
        },
      },
      {
        '@type': 'Question',
        name: "Puis-je générer un contrat gratuitement ?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Oui : vous pouvez générer des contrats gratuitement depuis cette page, sans inscription. Pour sauvegarder et réutiliser vos contrats, créez un compte Spyke.",
        },
      },
    ],
  }

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Générateur de Contrat Freelance Gratuit — Spyke',
    description: 'Créez un contrat freelance gratuitement en ligne. Téléchargez en PDF.',
    url: 'https://www.spykeapp.fr/contrat-freelance',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <SeoContratPage />

      <section style={{ maxWidth: 900, margin: '56px auto 0', padding: '0 40px' }}>
        <div style={{ width: 60, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.6px' }}>Contrat freelance : bonnes pratiques</h2>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Un bon contrat mentionne le périmètre, les livrables, les délais, le prix, la propriété intellectuelle et les conditions de résiliation.
          Vous pouvez partir du modèle proposé puis l'adapter.
        </p>
        <div style={{ marginTop: 26, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/devis-freelance" style={{ color: '#0a0a0a', textDecoration: 'underline', fontWeight: 700 }}>Créer un devis gratuit</a>
          <a href="/facture-auto-entrepreneur" style={{ color: '#0a0a0a', textDecoration: 'underline', fontWeight: 700 }}>Créer une facture gratuite</a>
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
