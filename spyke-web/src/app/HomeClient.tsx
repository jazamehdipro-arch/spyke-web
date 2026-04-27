"use client"

import { useEffect, useMemo, useState } from 'react'
import { track } from '@/lib/analytics'

type Testimonial = {
  initials: string
  name: string
  role: string
  text: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    initials: 'SL',
    name: 'Sophie Laurent',
    role: 'Développeuse freelance',
    text: "L’IA a vraiment capté mon style. Mes clients ne voient pas la différence avec mes vrais emails. Je gagne un temps fou sur les réponses.",
  },
  {
    initials: 'TM',
    name: 'Thomas Martin',
    role: 'Designer UI/UX',
    text: "Fini les 20 minutes à rédiger un email de relance. Je décris la situation, Spyke génère un message propre, avec le bon ton.",
  },
  {
    initials: 'JD',
    name: 'Julie Dubois',
    role: 'Consultante marketing',
    text: "Les devis personnalisés c’est top. Je choisis le template, je modifie deux trucs, et c’est envoyé. Pro et rapide.",
  },
  {
    initials: 'AR',
    name: 'Antoine Roux',
    role: 'Développeur web (freelance)',
    text: "Le combo devis + facture derrière me fait gagner du temps. Même numérotation, mêmes infos, et le PDF est clean.",
  },
  {
    initials: 'CM',
    name: 'Clara Morel',
    role: 'Rédactrice / SEO',
    text: "Pour les relances impayés, c’est parfait : ton ferme mais poli. Je garde la main et j’édite avant envoi.",
  },
  {
    initials: 'NB',
    name: 'Nicolas Bernard',
    role: 'Consultant data',
    text: "L’analyse de brief m’aide à cadrer vite (questions à poser + risques). Je parais beaucoup plus structuré face au client.",
  },
  {
    initials: 'LP',
    name: 'Lina Petit',
    role: 'Graphiste',
    text: "J’envoie un devis en 2 minutes, et je peux le signer direct dans le PDF. Ça fait tout de suite plus pro.",
  },
  {
    initials: 'HK',
    name: 'Hugo Klein',
    role: 'Chef de projet freelance',
    text: "J’ai arrêté de copier-coller des modèles Word. Je garde une base de clients et tout est cohérent.",
  },
  {
    initials: 'MA',
    name: 'Mélanie Aubry',
    role: 'Consultante RH',
    text: "Les emails générés sont super naturels. J’ai juste à donner le contexte et je retouche deux phrases.",
  },
  {
    initials: 'PC',
    name: 'Pauline Caron',
    role: 'Product designer',
    text: "Les statuts (devis en attente / factures payées) me donnent une vue simple. Je sais quoi relancer sans réfléchir.",
  },
  {
    initials: 'GG',
    name: 'Guillaume Giraud',
    role: 'Consultant no-code',
    text: "Le contrat généré est clair et réutilisable. Ça sécurise la mission, surtout quand le scope bouge.",
  },
  {
    initials: 'SA',
    name: 'Sarah Adam',
    role: 'Développeuse mobile',
    text: "Entre les templates d’emails et les docs, je gagne facilement plusieurs heures par semaine. Ça fait la diff.",
  },
  {
    initials: 'ET',
    name: 'Emma Tessier',
    role: 'Consultante communication',
    text: "J’aime le côté ‘copilote’ : je garde mon style, mais j’ai toujours une réponse propre à envoyer.",
  },
]

export default function HomeClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [testimonialAnimKey, setTestimonialAnimKey] = useState(0)

  useEffect(() => {
    track('page_view', { path: '/' })
  }, [])

  const perView = 3
  const totalSlides = TESTIMONIALS.length
  const viewTestimonials = useMemo(() => {
    return Array.from({ length: perView }, (_, i) => TESTIMONIALS[(testimonialIndex + i) % totalSlides])
  }, [testimonialIndex])

  return (
    <>
      {/* Navigation */}
      <nav aria-label="Navigation principale">
        <a href="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
          <div className="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          Spyke
        </a>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label="Ouvrir le menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li>
            <a href="/fonctionnalites.html" onClick={() => setMobileMenuOpen(false)}>
              Fonctionnalités
            </a>
          </li>
          <li>
            <a href="/comment-ca-marche.html" onClick={() => setMobileMenuOpen(false)}>
              Comment ça marche
            </a>
          </li>
          <li>
            <a href="/blog" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </a>
          </li>
          <li>
            <a href="/tarifs.html" onClick={() => setMobileMenuOpen(false)}>
              Tarifs
            </a>
          </li>
          <li>
            <a href="/connexion.html" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
              Commencer
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>✨ Nouveau</span> L&apos;IA au service des freelances
            </div>

            <h1>
              Vos emails et documents.
              <br />
              <span className="highlight">Votre style.</span>
            </h1>

            <p className="hero-description">
              Spyke est votre copilote freelance : emails, devis, factures, contrats — et même la
              <strong> question juridique</strong> quand vous bloquez. Vous gardez votre style, Spyke vous fait gagner du temps.
            </p>

            <a href="/connexion.html" className="hero-btn">
              Créer un compte →
            </a>

            <div className="hero-social-proof">
              <div className="avatars">
                <img src="https://i.pravatar.cc/80?img=1" alt="Photo de profil d'un freelance Spyke" width={40} height={40} loading="lazy" decoding="async" />
                <img src="https://i.pravatar.cc/80?img=2" alt="Photo de profil d'un freelance Spyke" width={40} height={40} loading="lazy" decoding="async" />
                <img src="https://i.pravatar.cc/80?img=3" alt="Photo de profil d'un freelance Spyke" width={40} height={40} loading="lazy" decoding="async" />
                <img src="https://i.pravatar.cc/80?img=4" alt="Photo de profil d'un freelance Spyke" width={40} height={40} loading="lazy" decoding="async" />
              </div>
              <p>
                <strong>2 450+ documents</strong> générés par des freelances
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-visual-img"
              src="/hero-dashboard.jpg"
              alt="Aperçu du dashboard Spyke"
              width={1200}
              height={675}
              loading="eager"
              decoding="async"
            />

            <div className="hero-card hero-card-1">
              <div className="hero-card-icon">
                <svg width="24" height="24" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4>Emails générés</h4>
              <p>+2 450</p>
            </div>

            <div className="hero-card hero-card-3">
              <div className="hero-card-icon">
                <svg width="24" height="24" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4>Devis / Facture / Contrat signés</h4>
              <p>+500</p>
            </div>

            <div className="hero-card hero-card-2">
              <div className="hero-card-icon">
                <svg width="24" height="24" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4>Temps gagné</h4>
              <p>25h/mois</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Documents signés</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">25h</div>
              <div className="stat-label">Économisées par mois</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10+</div>
              <div className="stat-label">Templates d&apos;emails</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">30s</div>
              <div className="stat-label">Pour un email parfait</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="features-container">
          <div className="section-header">
            <span className="section-label">Fonctionnalités</span>
            <h2>L&apos;IA qui parle comme vous</h2>
            <p>
              Des outils pensés pour les freelances qui veulent garder leur style tout en gagnant du
              temps.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3>Emails IA (à partir d&apos;un mail reçu)</h3>
              <p>
                Collez le message de votre client (ou le contexte) et Spyke rédige une réponse
                prête à envoyer, avec votre ton.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <h3>Chatbox d&apos;aide</h3>
              <p>
                Une chatbox intégrée pour poser vos questions (emails, docs, administratif) sans
                quitter l&apos;app.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3>Devis, factures & contrats</h3>
              <p>
                Générez des documents pros en quelques clics : devis, factures et contrats. Le tout
                cohérent avec votre profil, vos mentions et votre style.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3>Relances intelligentes</h3>
              <p>
                Détectez les devis sans réponse et les factures en retard. Spyke suggère quand et
                comment relancer (devis, paiement, suivi projet…).
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h3>Gestion clients</h3>
              <p>
                Centralisez vos contacts et leur historique. L&apos;IA connaît le contexte de chaque
                client.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 13h6" />
                  <path d="M9 17h6" />
                </svg>
              </div>
              <h3>Question juridique (Pro)</h3>
              <p>
                Un bouton “Question juriste” quand tu as un doute (contrat, impayé, clause…). Réponse
                structurée et exploitable.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </div>
              <h3>Signature & e-signature</h3>
              <p>
                Ajoutez votre signature sur vos PDFs et lancez des demandes de signature en ligne
                pour vos contrats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works" id="how">
        <div className="how-container">
          <div className="section-header">
            <span className="section-label">Comment ça marche</span>
            <h2>Simple comme bonjour</h2>
            <p>Trois étapes pour transformer votre quotidien de freelance.</p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Configurez votre profil</h3>
              <p>
                Renseignez votre activité, votre ton, vos tarifs. L&apos;IA apprend votre façon de
                communiquer.
              </p>
              <div className="step-connector" />
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Ajoutez vos clients</h3>
              <p>Importez vos contacts. Spyke garde le contexte de chaque relation client.</p>
              <div className="step-connector" />
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Générez en 1 clic</h3>
              <p>
                Emails, devis, factures, contrats, relances… l&apos;IA écrit avec votre voix. Vous validez
                et exportez.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="testimonials-container">
          <div className="section-header">
            <span className="section-label">Témoignages</span>
            <div className="testimonials-head">
              <div>
                <h2>Ils nous font confiance</h2>
                <p>Découvrez ce que les freelances pensent de Spyke.</p>
              </div>

              <div className="testimonials-nav" aria-label="Navigation témoignages">
                <button
                  type="button"
                  className="nav-arrow"
                  onClick={() => {
                    setTestimonialIndex((i) => (i - 1 + totalSlides) % totalSlides)
                    setTestimonialAnimKey((k) => k + 1)
                  }}
                  aria-label="Témoignage précédent"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <div className="testimonials-pager">
                  {testimonialIndex + 1}/{totalSlides}
                </div>
                <button
                  type="button"
                  className="nav-arrow"
                  onClick={() => {
                    setTestimonialIndex((i) => (i + 1) % totalSlides)
                    setTestimonialAnimKey((k) => k + 1)
                  }}
                  aria-label="Témoignage suivant"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="testimonials-grid" aria-live="polite" key={testimonialAnimKey}>
            {viewTestimonials.map((t) => (
              <div key={`${testimonialIndex}-${t.name}`} className="testimonial-card">
                <div className="testimonial-content">
                  <p className="testimonial-text">{t.text}</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.initials}</div>
                    <div className="testimonial-info">
                      <h4>{t.name}</h4>
                      <p>{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="pricing" id="pricing">
        <div className="pricing-container">
          <div className="section-header">
            <span className="section-label">Tarifs</span>
            <h2>À partir de 16,58€/mois</h2>
            <p>Mensuel ou annuel. Un plan gratuit + un plan Pro. Simple.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-name">Gratuit</div>
              <p className="pricing-desc">Pour découvrir Spyke</p>
              <div className="pricing-price">
                0€<span>/mois</span>
              </div>
              <a href="/tarifs.html" className="pricing-btn">
                Voir les tarifs
              </a>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-name">Pro</div>
              <p className="pricing-desc">Mensuel ou annuel</p>
              <div className="pricing-price">
                16,58€<span>/mois</span>
              </div>
              <a href="/tarifs.html" className="pricing-btn">
                Choisir mon offre
              </a>
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--gray-500)' }}>
                Facturé 199€ / an — économisez 2 mois
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2>Prêt à écrire plus vite ?</h2>
          <p>Rejoignez les freelances qui ont adopté l&apos;IA pour leurs emails et documents (devis, factures, contrats).</p>
          <a href="/connexion.html" className="cta-btn">
            Créer un compte gratuit →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer aria-label="Pied de page">
        <div className="footer-container">
          <div className="footer-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
              </svg>
            </div>
            Spyke
          </div>
          <div className="footer-links">
            <a href="/fonctionnalites.html">Fonctionnalités</a>
            <a href="/comment-ca-marche.html">Comment ça marche</a>
            <a href="/tarifs.html">Tarifs</a>
            <a href="/mentions-legales.html">Mentions légales</a>
            <a href="/cgu.html">CGU</a>
            <a href="/confidentialite.html">Confidentialité</a>
          </div>
          <p className="footer-copy">Spyke © 2026 – L’assistant freelance (emails, devis, factures, contrats)</p>
        </div>
      </footer>
    </>
  )
}
