import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./prospection.css";

/**
 * L'outil de prospection vit sous /prospection, à l'intérieur du site.
 *
 * Tout son balisage est enfermé dans .spk : son CSS redéfinit *, button et
 * input, et déborderait sinon sur les pages devis et factures. Ses fontes sont
 * chargées ici, pas dans la racine, pour ne rien peser sur le reste du site.
 *
 * Trois fontes, trois rôles, et aucun qui empiète sur l'autre : Space Grotesk
 * pour les titres et les noms d'entreprise, Inter pour le texte courant — plus
 * lisible en petit sur un téléphone —, IBM Plex Mono pour tout ce qui se
 * compare d'un coup d'œil : numéros, heures, montants, compteurs.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--spk-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--spk-disp",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--spk-mono",
  display: "swap",
});

export const metadata = {
  title: "Spyke · Prospection",
  description: "Outil d'appel et de suivi des audits Spyke.",
  robots: { index: false, follow: false },
};

export default function ProspectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`spk ${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable}`}>
      {children}
    </div>
  );
}
