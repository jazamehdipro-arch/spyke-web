import type { Metadata } from 'next'
import SeoDevisPage from '@/components/seo/SeoDevisPage'
import { ConversionBanner, FaqAccordion, OtherTools } from '@/components/seo/SeoBlocks'

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
  const faqItems = [
    {
      q: 'Quelles sont les mentions obligatoires sur un devis freelance ?',
      a: "En France, un devis doit notamment contenir : la date, un numéro unique, l'identité du prestataire (nom/raison sociale, adresse, SIRET), l'identité du client, la description détaillée des prestations, les quantités, les prix (HT, TVA, TTC selon le cas) et la durée de validité.",
    },
    {
      q: 'Un devis signé a-t-il une valeur légale ?',
      a: "Oui : un devis signé vaut accord sur le périmètre, le prix et les conditions indiquées. Il peut servir de preuve en cas de litige.",
    },
    {
      q: 'Quelle est la différence entre un devis et une facture ?',
      a: "Le devis est une proposition avant la prestation, la facture est émise après (ou selon l'échéancier) pour demander le paiement.",
    },
    {
      q: 'Combien de temps un devis est-il valable ?',
      a: "La durée de validité est libre (souvent 15 à 30 jours). Il est recommandé de l'indiquer sur le devis.",
    },
    {
      q: "Cet outil est-il vraiment gratuit ?",
      a: "Oui : vous pouvez générer des devis gratuitement depuis cette page, sans inscription. Si vous souhaitez sauvegarder vos clients et retrouver vos devis plus tard, créez un compte Spyke.",
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

      <ConversionBanner />

      {/* SEO content block (indexable text) */}
      <section style={{ maxWidth: 900, margin: '56px auto 0', padding: '0 40px' }}>
        <div style={{ width: 60, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.6px' }}>Comment faire un devis freelance professionnel ? (guide complet)</h2>

        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Un devis est souvent le premier document que vous envoyez à un client. Il doit être clair, lisible et suffisamment précis pour éviter les malentendus.
          Un bon devis protège les deux parties : il fixe le périmètre, le prix, la TVA, les délais et la durée de validité.
          Sur cette page, vous pouvez générer un devis en PDF en quelques minutes (HT/TVA/TTC), puis décider ensuite si vous voulez créer un compte pour retrouver vos documents.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>1) Les informations indispensables sur un devis</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          En pratique, un devis doit comporter : la date et un numéro unique, l'identité du prestataire (nom/raison sociale, adresse, SIRET), l'identité du client,
          une description détaillée des prestations et les prix (HT, TVA, TTC selon votre situation). Pensez aussi à indiquer une durée de validité.
        </p>

        <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 14, padding: '20px 22px', marginTop: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>Checklist rapide</div>
          <ul style={{ paddingLeft: 20, color: '#52525b', lineHeight: 1.9, margin: 0 }}>
            <li><b>Date</b> + <b>numéro</b> de devis</li>
            <li><b>Prestataire</b> : identité + SIRET + adresse</li>
            <li><b>Client</b> : identité + adresse</li>
            <li><b>Prestations</b> : description, quantités, prix unitaires</li>
            <li><b>Totaux</b> : HT, TVA, TTC</li>
            <li><b>Validité</b> du devis</li>
          </ul>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>2) Devis HT, TVA, TTC : comment s'y retrouver ?</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          Beaucoup de freelances sont en micro-entreprise et facturent sans TVA. D'autres sont assujettis et doivent appliquer un taux (souvent 20%).
          L'important : votre devis doit rester cohérent. Sur Spyke, vous pouvez définir un taux de TVA par ligne (0%, 5,5%, 10%, 20%) et le total se calcule automatiquement.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>3) Bonnes pratiques (et erreurs à éviter)</h3>
        <ul style={{ paddingLeft: 20, color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          <li><b>Être précis</b> : détailler le périmètre et les livrables (ce qui est inclus / exclu).</li>
          <li><b>Fixer une validité</b> : 15–30 jours est courant.</li>
          <li><b>Prévoir un acompte</b> si nécessaire (ex: 30%).</li>
          <li><b>Éviter les totaux flous</b> : un prix global sans détail rend la discussion plus difficile.</li>
        </ul>

        <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 26 }}>4) Devis signé : quelles conséquences ?</h3>
        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 10 }}>
          Un devis signé vaut accord sur les éléments indiqués. Il peut servir de preuve en cas de litige.
          Pour aller plus loin, il est conseillé de formaliser la relation via un contrat, surtout si la mission est longue ou complexe.
        </p>

        <p style={{ color: '#52525b', lineHeight: 1.9, marginTop: 14 }}>
          Pour gagner du temps au quotidien : créez un compte Spyke afin de sauvegarder vos clients, retrouver vos devis et transformer un devis en contrat puis en facture.
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
