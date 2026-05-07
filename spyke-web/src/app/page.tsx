import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import { HOME_CSS } from './home-styles'

export const metadata: Metadata = {
  title: "Spyke – L'assistant IA des freelances français",
  description:
    "Créez vos devis, factures et contrats en quelques clics grâce à l'IA. Spyke automatise votre admin freelance pour que vous vous concentriez sur votre métier.",
  openGraph: {
    type: 'website',
    url: 'https://www.spykeapp.fr/',
    title: "Spyke – L'assistant IA des freelances français",
    description: "Créez vos devis, factures et contrats en quelques clics grâce à l'IA.",
    images: [{ url: '/hero-dashboard.jpg', width: 1200, height: 630, alt: 'Spyke dashboard' }],
  },
}

export default function Home() {
  return (
    <>
      <style>{HOME_CSS}</style>
      <HomeClient />
    </>
  )
}
