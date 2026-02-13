import type { Metadata } from 'next'
import SeoFacturePage from '@/components/seo/SeoFacturePage'
import { ConversionBanner, FaqAccordion, OtherTools } from '@/components/seo/SeoBlocks'

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
  const faqItems = [
    {
      q: 'Quelles sont les mentions obligatoires sur une facture ?',
      a: "Une facture doit notamment contenir : la date, un numéro unique, l'identité du vendeur/prestataire (nom/raison sociale, adresse, SIRET), l'identité du client, le détail des prestations, les montants HT/TVA/TTC et les conditions de paiement.",
    },
    {
      q: 'Quand faut-il émettre une facture ?',
      a: "En général, une facture est émise après la réalisation de la prestation (ou selon l'échéancier convenu). Elle formalise la demande de paiement.",
    },
    {
      q: 'Puis-je faire une facture gratuitement sans inscription ?',
      a: "Oui : vous pouvez générer des factures gratuitement depuis cette page, sans inscription. Pour sauvegarder vos infos et retrouver vos factures, créez un compte Spyke.",
    },
    {
      q: "Quelle différence entre facture HT et TTC ?",
      a: "HT = hors taxes. TTC = toutes taxes comprises. Si vous appliquez la TVA, la facture indique HT, TVA et TTC. Sinon, la TVA peut être à 0% selon votre statut.",
    },
    {
      q: 'Pourquoi numéroter ses factures ?',
      a: "La numérotation unique facilite le suivi et la conformité comptable. Elle permet aussi d'éviter les doublons.",
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

      <ConversionBanner />

      <section style={{ maxWidth: 900, margin: '56px auto 0', padding: '0 40px' }}>
        <div style={{ width: 60, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.6px' }}>Comment faire une facture auto-entrepreneur ? (guide complet)</h2>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Une facture claire, numérotée et cohérente est indispensable pour votre suivi, votre comptabilité et la relation client.
          Dans Spyke, vous pouvez générer une facture PDF en quelques minutes : informations prestataire, informations client, lignes, totaux HT/TVA/TTC.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>1) Les mentions à inclure sur une facture</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          Dans la plupart des cas, une facture doit comporter une date, un numéro unique, les identités des parties (prestataire et client),
          la description des prestations, les quantités/prix unitaires, et les montants (HT, TVA, TTC selon le cas). Il est aussi recommandé d'ajouter des conditions de paiement.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>2) Date d'émission et date d'échéance</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          La date d'émission correspond au jour où vous émettez la facture. La date d'échéance indique la limite de paiement.
          Indiquer clairement cette échéance réduit les retards et facilite les relances.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>3) HT / TVA / TTC : quoi afficher ?</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          Si vous facturez avec TVA, la facture doit afficher le total HT, le montant de TVA et le total TTC.
          Si vous ne facturez pas la TVA, le total TTC est alors égal au total HT (TVA à 0%).
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>4) Bonnes pratiques</h3>
        <ul style={{ paddingLeft: 20, color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          <li><b>Numérotez vos factures</b> de façon chronologique (ex: F202602-001).</li>
          <li><b>Détaillez les lignes</b> : c'est plus clair pour le client, et utile en cas de contestation.</li>
          <li><b>Ajoutez un IBAN/BIC</b> si vous souhaitez simplifier le paiement.</li>
          <li><b>Fixez une échéance</b> : paiement à réception, 15 jours, 30 jours…</li>
        </ul>

        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Pour aller plus loin : créez un compte Spyke pour sauvegarder vos clients et transformer vos documents (devis → facture, etc.).
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
