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
  title: "Spyke – L'assistant IA des freelances français",
  description:
    "Spyke génère vos devis, factures et relances en quelques clics grâce à l'intelligence artificielle. Concentrez-vous sur votre métier.",
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
