import type { Metadata } from 'next'
import SeoDevisPage from '@/components/seo/SeoDevisPage'

export const metadata: Metadata = {
  title: 'Générateur de Devis Freelance Gratuit en Ligne — Spyke',
  description:
    'Créez un devis professionnel freelance gratuitement en 2 minutes. Téléchargez votre devis en PDF, conforme et personnalisable. Sans inscription.',
  alternates: { canonical: 'https://www.spykeapp.fr/devis-freelance' },
  openGraph: {
    title: 'Générateur de Devis Freelance Gratuit — Spyke',
    description: 'Créez un devis professionnel en 2 minutes. Téléchargez en PDF gratuitement, sans inscription.',
    url: 'https://www.spykeapp.fr/devis-freelance',
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
        name: 'Quelles sont les mentions obligatoires sur un devis freelance ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "En France, un devis doit notamment contenir : la date, un numéro unique, l'identité du prestataire (nom/raison sociale, adresse, SIRET), l'identité du client, la description détaillée des prestations, les quantités, les prix (HT, TVA, TTC selon le cas) et la durée de validité.",
        },
      },
      {
        '@type': 'Question',
        name: 'Un devis signé a-t-il une valeur légale ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Oui : un devis signé vaut accord sur le périmètre, le prix et les conditions indiquées. Il peut servir de preuve en cas de litige.",
        },
      },
      {
        '@type': 'Question',
        name: 'Quelle est la différence entre un devis et une facture ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Le devis est une proposition avant la prestation, la facture est émise après (ou selon l'échéancier) pour demander le paiement.",
        },
      },
      {
        '@type': 'Question',
        name: 'Combien de temps un devis est-il valable ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "La durée de validité est libre (souvent 15 à 30 jours). Il est recommandé de l'indiquer sur le devis.",
        },
      },
      {
        '@type': 'Question',
        name: "Cet outil est-il vraiment gratuit ?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Oui : vous pouvez générer 1 devis gratuitement sans inscription depuis cette page. Pour en générer davantage, créez un compte Spyke.",
        },
      },
    ],
  }

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Générateur de Devis Freelance Gratuit — Spyke',
    description: 'Créez un devis professionnel freelance gratuitement en ligne. Téléchargez en PDF.',
    url: 'https://www.spykeapp.fr/devis-freelance',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <SeoDevisPage />

      {/* SEO content block (indexable text) */}
      <section style={{ maxWidth: 900, margin: '56px auto 0', padding: '0 40px' }}>
        <div style={{ width: 60, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.6px' }}>Comment faire un devis freelance professionnel ?</h2>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Un devis clair et complet protège le freelance et le client : il formalise le périmètre, le prix, la TVA et les délais.
          Avec Spyke, vous pouvez générer un PDF propre (HT/TVA/TTC) en quelques minutes.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>Checklist : mentions clés à inclure</h3>
        <ul style={{ paddingLeft: 20, color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          <li>Date et numéro unique</li>
          <li>Identité prestataire (nom/raison sociale, adresse, SIRET)</li>
          <li>Identité client</li>
          <li>Description détaillée des prestations</li>
          <li>Quantités, prix unitaires, total HT, TVA, total TTC</li>
          <li>Durée de validité</li>
        </ul>

        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Pour aller plus loin : créez un compte Spyke pour sauvegarder vos clients, réutiliser vos infos et transformer un devis en contrat/facture.
        </p>

        <div style={{ marginTop: 26, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/facture-auto-entrepreneur" style={{ color: '#0a0a0a', textDecoration: 'underline', fontWeight: 700 }}>Créer une facture gratuite</a>
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
