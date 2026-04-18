import type { Metadata } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
})

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.spykeapp.fr'),
  title: "Spyke – L'assistant IA des freelances français",
  description:
    "Spyke génère vos devis, factures et relances en quelques clics grâce à l'intelligence artificielle. Concentrez-vous sur votre métier.",
  openGraph: {
    type: 'website',
    url: 'https://www.spykeapp.fr/',
    title: "Spyke – L'assistant IA des freelances français",
    description:
      "Spyke génère vos devis, factures et relances en quelques clics grâce à l'intelligence artificielle. Concentrez-vous sur votre métier.",
    images: [
      {
        url: '/hero-dashboard.jpg',
        width: 1200,
        height: 630,
        alt: 'Spyke – aperçu du dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Spyke – L'assistant IA des freelances français",
    description:
      "Spyke génère vos devis, factures et relances en quelques clics grâce à l'intelligence artificielle. Concentrez-vous sur votre métier.",
    images: ['/hero-dashboard.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${syne.variable} antialiased`}>{children}</body>
    </html>
  )
}
