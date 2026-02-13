import type { Metadata } from 'next'
import SeoContratPage from '@/components/seo/SeoContratPage'
import { ConversionBanner, FaqAccordion, OtherTools } from '@/components/seo/SeoBlocks'

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
  const faqItems = [
    {
      q: 'Pourquoi faire un contrat de prestation de services ?',
      a: "Un contrat précise le périmètre, le prix, les responsabilités et les conditions de résiliation. Il réduit les risques de litige.",
    },
    {
      q: 'Que doit contenir un contrat freelance ?',
      a: "Un bon contrat mentionne au minimum : les parties, l'objet de la mission, le périmètre/livrables, les délais, le prix et les modalités de paiement, la propriété intellectuelle, la confidentialité et la résiliation.",
    },
    {
      q: 'Contrat ou devis signé : faut-il les deux ?',
      a: "Un devis signé peut suffire pour acter un accord simple. Pour une mission plus longue ou plus risquée, un contrat détaillé apporte une meilleure protection (résiliation, IP, responsabilités, etc.).",
    },
    {
      q: "Puis-je générer un contrat gratuitement ?",
      a: "Oui : vous pouvez générer des contrats gratuitement depuis cette page, sans inscription. Pour sauvegarder et réutiliser vos contrats, créez un compte Spyke.",
    },
    {
      q: 'Puis-je modifier le texte avant de générer le PDF ?',
      a: "Oui : Spyke propose un modèle semi-guidé. Vous remplissez les champs clés, puis vous pouvez modifier librement le texte des clauses avant génération.",
    },
  ]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
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

      <ConversionBanner />

      <section style={{ maxWidth: 900, margin: '56px auto 0', padding: '0 40px' }}>
        <div style={{ width: 60, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.6px' }}>Contrat freelance : guide pratique</h2>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Un contrat est votre filet de sécurité : il clarifie le périmètre, les livrables, le prix, les délais, la propriété intellectuelle et les conditions de résiliation.
          Plus la mission est longue (ou le budget élevé), plus il est utile d'avoir un texte clair et précis.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>1) Parties et objet de la mission</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          Identifiez les parties (prestataire et client) et décrivez l'objet : quel travail, pour quel résultat.
          Dans Spyke, vous remplissez ces champs puis un modèle de clauses est proposé automatiquement.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>2) Périmètre, livrables et délais</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          Le nerf de la guerre : ce qui est inclus / exclu. Définissez les livrables, les étapes, et comment se passe la validation.
          Une description trop vague augmente le risque de "scope creep".
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>3) Prix et modalités de paiement</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          Précisez le type de prix (forfait / TJM) et les modalités : acompte, solde, échéance.
          L'objectif est de rendre la facturation évidente et incontestable.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>4) Propriété intellectuelle, confidentialité, résiliation</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          Même sur une mission simple, ces clauses évitent de gros problèmes : qui détient quoi, quand les droits sont cédés, comment résilier,
          et comment gérer les infos sensibles.
        </p>

        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Pour gagner du temps : créez un compte Spyke pour retrouver vos contrats, les dupliquer, et enchaîner devis → contrat → facture.
        </p>
      </section>

      <FaqAccordion items={faqItems} />

      <OtherTools />

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
