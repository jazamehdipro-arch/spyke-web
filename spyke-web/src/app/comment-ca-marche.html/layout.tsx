import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comment ça marche — Spyke',
  description:
    "Découvrez comment Spyke vous aide à gérer votre activité freelance : créez vos devis, factures et contrats en quelques clics grâce à l'intelligence artificielle.",
  openGraph: {
    title: "Comment fonctionne Spyke — L'IA pour les freelances",
    description: 'Devis, factures, contrats et relances automatiques. Découvrez comment Spyke simplifie votre admin.',
    url: 'https://www.spykeapp.fr/comment-ca-marche.html',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
