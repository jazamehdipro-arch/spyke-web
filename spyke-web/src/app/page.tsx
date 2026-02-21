"use client"

import { useState } from 'react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --black: #0a0a0a;
          --white: #ffffff;
          --gray-50: #fafafa;
          --gray-100: #f4f4f5;
          --gray-200: #e4e4e7;
          --gray-300: #d4d4d8;
          --gray-400: #a1a1aa;
          --gray-500: #71717a;
          --gray-600: #52525b;
          --gray-700: #3f3f46;
          --gray-800: #27272a;
          --gray-900: #18181b;
          --yellow: #facc15;
          --yellow-dark: #eab308;
          --blue: #3b82f6;
          --gradient: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--white);
          color: var(--gray-900);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ===== NAVIGATION ===== */
        nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 16px 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--black);
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: var(--black);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-icon svg {
          width: 20px;
          height: 20px;
          fill: var(--yellow);
        }

        .mobile-nav-toggle {
          display: none;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid var(--gray-200);
          background: var(--white);
          color: var(--gray-700);
          align-items: center;
          justify-content: center;
        }

        .mobile-nav-toggle svg {
          width: 22px;
          height: 22px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 40px;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--gray-600);
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .nav-links a:hover {
          color: var(--black);
        }

        .nav-cta {
          background: var(--black);
          color: var(--white) !important;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .nav-cta:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }

        /* ===== HERO SECTION ===== */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 140px 48px 80px;
          background: linear-gradient(180deg, var(--gray-50) 0%, var(--white) 100%);
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .hero-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
          width: 100%;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--white);
          border: 1px solid var(--gray-200);
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-600);
          margin-bottom: 24px;
          animation: fadeInUp 0.6s ease;
        }

        .hero-badge span {
          background: var(--gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 600;
        }

        .hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: 64px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -2px;
          color: var(--black);
          margin-bottom: 24px;
          animation: fadeInUp 0.6s ease 0.1s both;
        }

        .hero h1 .highlight {
          background: var(--gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 20px;
          color: var(--gray-600);
          margin-bottom: 40px;
          max-width: 500px;
          line-height: 1.7;
          animation: fadeInUp 0.6s ease 0.2s both;
        }

        .hero-btn {
          display: inline-block;
          padding: 18px 36px;
          background: var(--black);
          color: var(--white);
          text-decoration: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .hero-btn:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }

        .cta-btn {
          display: inline-block;
          padding: 18px 36px;
          background: var(--yellow);
          color: var(--black);
          text-decoration: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .cta-btn:hover {
          background: var(--yellow-dark);
          transform: translateY(-2px);
        }

        .hero-social-proof {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 32px;
          animation: fadeInUp 0.6s ease 0.4s both;
        }

        .avatars {
          display: flex;
        }

        .avatars img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid var(--white);
          margin-left: -12px;
          object-fit: cover;
        }

        .avatars img:first-child {
          margin-left: 0;
        }

        .hero-social-proof p {
          font-size: 14px;
          color: var(--gray-500);
        }

        .hero-social-proof strong {
          color: var(--gray-900);
        }

        /* Hero Visual */
        .hero-visual {
          position: relative;
          animation: fadeInRight 0.8s ease 0.3s both;
        }

        .hero-visual img {
          width: 100%;
          border-radius: 24px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.15);
        }

        .hero-card {
          position: absolute;
          background: var(--white);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          animation: float 3s ease-in-out infinite;
        }

        .hero-card-1 {
          top: 10%;
          right: -30px;
          animation-delay: 0s;
        }

        .hero-card-2 {
          bottom: 15%;
          left: -40px;
          animation-delay: 1.5s;
        }

        .hero-card-icon {
          width: 48px;
          height: 48px;
          background: var(--gradient);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .hero-card h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 4px;
        }

        .hero-card p {
          font-size: 24px;
          font-weight: 700;
          color: var(--black);
        }

        /* ===== STATS SECTION ===== */
        .stats {
          padding: 100px 48px;
          background: var(--black);
          color: var(--white);
        }

        .stats-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 48px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-family: 'Syne', sans-serif;
          font-size: 72px;
          font-weight: 700;
          background: var(--gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 12px;
        }

        .stat-label {
          font-size: 16px;
          color: var(--gray-400);
          font-weight: 500;
        }

        /* ===== FEATURES SECTION ===== */
        .features {
          padding: 120px 48px;
          background: var(--white);
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 80px;
        }

        .section-label {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--yellow-dark);
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-family: 'Syne', sans-serif;
          font-size: 48px;
          font-weight: 700;
          letter-spacing: -1px;
          color: var(--black);
          margin-bottom: 20px;
        }

        .section-header p {
          font-size: 18px;
          color: var(--gray-500);
          line-height: 1.7;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .feature-card {
          background: var(--gray-50);
          border-radius: 24px;
          padding: 40px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .feature-card:hover {
          background: var(--white);
          border-color: var(--gray-200);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          background: var(--black);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .feature-icon svg {
          width: 28px;
          height: 28px;
          stroke: var(--yellow);
          fill: none;
          stroke-width: 2;
        }

        .feature-card h3 {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 12px;
        }

        .feature-card p {
          font-size: 16px;
          color: var(--gray-500);
          line-height: 1.7;
        }

        /* ===== HOW IT WORKS ===== */
        .how-it-works {
          padding: 120px 48px;
          background: var(--gray-50);
        }

        .how-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 48px;
          margin-top: 80px;
        }

        .step {
          position: relative;
          text-align: center;
        }

        .step-number {
          width: 80px;
          height: 80px;
          background: var(--black);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--yellow);
          margin: 0 auto 24px;
        }

        .step h3 {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 12px;
        }

        .step p {
          font-size: 16px;
          color: var(--gray-500);
          line-height: 1.7;
          max-width: 300px;
          margin: 0 auto;
        }

        .step-connector {
          position: absolute;
          top: 40px;
          right: -24px;
          width: 48px;
          height: 2px;
          background: var(--gray-300);
        }

        .step:last-child .step-connector {
          display: none;
        }

        /* ===== TESTIMONIALS ===== */
        .testimonials {
          padding: 120px 48px;
          background: var(--white);
        }

        .testimonials-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 80px;
        }

        .testimonial-card {
          background: var(--gray-50);
          border-radius: 24px;
          padding: 40px;
          position: relative;
        }

        .testimonial-card::before {
          content: '"';
          position: absolute;
          top: 24px;
          left: 32px;
          font-family: 'Syne', sans-serif;
          font-size: 80px;
          color: var(--yellow);
          opacity: 0.3;
          line-height: 1;
        }

        .testimonial-content {
          position: relative;
          z-index: 1;
        }

        .testimonial-text {
          font-size: 17px;
          color: var(--gray-700);
          line-height: 1.8;
          margin-bottom: 24px;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .testimonial-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--black);
        }

        .testimonial-info h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--black);
        }

        .testimonial-info p {
          font-size: 14px;
          color: var(--gray-500);
        }

        /* ===== PRICING ===== */
        .pricing {
          padding: 120px 48px;
          background: var(--gray-50);
        }

        .pricing-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          margin-top: 80px;
        }

        .pricing-card {
          background: var(--white);
          border-radius: 24px;
          padding: 48px;
          border: 2px solid var(--gray-200);
          transition: all 0.3s ease;
        }

        .pricing-card.featured {
          border-color: var(--black);
          position: relative;
          transform: scale(1.05);
        }

        .pricing-card.featured::before {
          content: 'Populaire';
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--black);
          color: var(--yellow);
          padding: 6px 20px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
        }

        .pricing-name {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 8px;
        }

        .pricing-desc {
          font-size: 15px;
          color: var(--gray-500);
          margin-bottom: 24px;
        }

        .pricing-price {
          font-family: 'Syne', sans-serif;
          font-size: 56px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 8px;
        }

        .pricing-price span {
          font-size: 18px;
          font-weight: 500;
          color: var(--gray-500);
        }

        .pricing-features {
          list-style: none;
          margin: 32px 0;
        }

        .pricing-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          font-size: 15px;
          color: var(--gray-700);
          border-bottom: 1px solid var(--gray-100);
        }

        .pricing-features li:last-child {
          border-bottom: none;
        }

        .pricing-features svg {
          width: 20px;
          height: 20px;
          stroke: var(--yellow-dark);
          flex-shrink: 0;
        }

        .pricing-btn {
          display: block;
          width: 100%;
          padding: 18px;
          text-align: center;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .pricing-card .pricing-btn {
          background: var(--gray-100);
          color: var(--black);
        }

        .pricing-card .pricing-btn:hover {
          background: var(--gray-200);
        }

        .pricing-card.featured .pricing-btn {
          background: var(--black);
          color: var(--white);
        }

        .pricing-card.featured .pricing-btn:hover {
          background: var(--gray-800);
        }

        /* ===== CTA SECTION ===== */
        .cta {
          padding: 120px 48px;
          background: var(--black);
          text-align: center;
        }

        .cta-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .cta h2 {
          font-family: 'Syne', sans-serif;
          font-size: 48px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 20px;
        }

        .cta p {
          font-size: 18px;
          color: var(--gray-400);
          margin-bottom: 40px;
        }

        /* ===== FOOTER ===== */
        footer {
          padding: 60px 48px;
          background: var(--gray-900);
          border-top: 1px solid var(--gray-800);
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--white);
        }

        .footer-logo .logo-icon {
          width: 32px;
          height: 32px;
        }

        .footer-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
          row-gap: 10px;
        }

        .footer-links a {
          color: var(--gray-400);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid transparent;
        }

        .footer-links a:active {
          border-color: rgba(255, 255, 255, 0.10);
        }

        .footer-links a:hover {
          color: var(--white);
        }

        .footer-copy {
          font-size: 14px;
          color: var(--gray-500);
        }

        /* ===== ANIMATIONS ===== */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 60px;
          }

          .hero h1 {
            font-size: 48px;
          }

          .hero-visual {
            max-width: 600px;
            margin: 0 auto;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .features-grid,
          .testimonials-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .steps {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .step-connector {
            display: none;
          }
        }

        @media (max-width: 768px) {
          nav {
            padding: 16px 18px;
          }

          .mobile-nav-toggle {
            display: inline-flex;
          }

          .nav-links {
            position: fixed;
            top: 72px;
            left: 12px;
            right: 12px;
            background: rgba(255, 255, 255, 0.98);
            border: 1px solid var(--gray-200);
            border-radius: 16px;
            padding: 12px;
            display: none;
            flex-direction: column;
            gap: 8px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          }

          .nav-links.open {
            display: flex;
          }

          .nav-links li {
            width: 100%;
          }

          .nav-links a {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 14px;
            border-radius: 12px;
            background: var(--white);
            border: 1px solid var(--gray-200);
          }

          .nav-cta {
            justify-content: center !important;
            border: none !important;
          }

          .hero {
            padding: 120px 24px 60px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .section-header h2 {
            font-size: 36px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-number {
            font-size: 56px;
          }

          .features-grid,
          .testimonials-grid {
            grid-template-columns: 1fr;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card.featured {
            transform: scale(1);
          }

          .cta h2 {
            font-size: 32px;
          }

          .footer-container {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav>
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
            <a href="/fonctionnalites.html" onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
          </li>
          <li>
            <a href="/comment-ca-marche.html" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</a>
          </li>
          <li>
            <a href="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</a>
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
                <img src="https://i.pravatar.cc/80?img=1" alt="User" />
                <img src="https://i.pravatar.cc/80?img=2" alt="User" />
                <img src="https://i.pravatar.cc/80?img=3" alt="User" />
                <img src="https://i.pravatar.cc/80?img=4" alt="User" />
              </div>
              <p>
                <strong>50+ freelances</strong> nous font déjà confiance
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="/window.svg"
              alt="Interface Spyke"
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

            <div className="hero-card hero-card-2">
              <div className="hero-card-icon">
                <svg width="24" height="24" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4>Temps gagné</h4>
              <p>10h/mois</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Freelances actifs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10h</div>
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
            <h2>Ils nous font confiance</h2>
            <p>Découvrez ce que les freelances pensent de Spyke.</p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  L&apos;IA a vraiment capté mon style. Mes clients ne voient pas la différence avec mes
                  vrais emails. Je gagne un temps fou sur les réponses.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">SL</div>
                  <div className="testimonial-info">
                    <h4>Sophie Laurent</h4>
                    <p>Développeuse freelance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  Fini les 20 minutes à rédiger un email de relance. Je décris la situation, Spyke
                  génère un message parfait avec le bon ton.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">TM</div>
                  <div className="testimonial-info">
                    <h4>Thomas Martin</h4>
                    <p>Designer UI/UX</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  Les devis personnalisés c&apos;est top. Je choisis le template, je modifie deux
                  trucs, et c&apos;est envoyé. Professionnel et rapide.
                </p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">JD</div>
                  <div className="testimonial-info">
                    <h4>Julie Dubois</h4>
                    <p>Consultante marketing</p>
                  </div>
                </div>
              </div>
            </div>
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
              <a href="/tarifs.html" className="pricing-btn">Voir les tarifs</a>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-name">Pro</div>
              <p className="pricing-desc">Mensuel ou annuel</p>
              <div className="pricing-price">
                16,58€<span>/mois</span>
              </div>
              <a href="/tarifs.html" className="pricing-btn">Choisir mon offre</a>
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--gray-500)' }}>Facturé 199€ / an — économisez 2 mois</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2>Prêt à écrire plus vite ?</h2>
          <p>Rejoignez les freelances qui ont adopté l&apos;IA pour leurs emails et documents (devis, factures, contrats).</p>
          <a href="/tarifs.html" className="cta-btn">
            Voir les tarifs →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer>
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
            <a href="/confidentialite.html">Confidentialité</a>
          </div>
          <p className="footer-copy">Spyke © 2025 – L’assistant freelance (emails, devis, factures, contrats)</p>
        </div>
      </footer>
    </>
  )
}
