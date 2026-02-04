"use client"

import Link from 'next/link'

export default function Home() {
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

        .hero-form {
          display: flex;
          gap: 12px;
          animation: fadeInUp 0.6s ease 0.3s both;
        }

        .hero-form input {
          flex: 1;
          padding: 18px 24px;
          border: 2px solid var(--gray-200);
          border-radius: 14px;
          font-size: 16px;
          font-family: inherit;
          transition: all 0.3s ease;
          background: var(--white);
        }

        .hero-form input:focus {
          outline: none;
          border-color: var(--yellow);
          box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.15);
        }

        .hero-form button {
          padding: 18px 36px;
          background: var(--black);
          color: var(--white);
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .hero-form button:hover {
          background: var(--gray-800);
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

        .cta-form {
          display: flex;
          gap: 12px;
          max-width: 500px;
          margin: 0 auto;
        }

        .cta-form input {
          flex: 1;
          padding: 18px 24px;
          border: 2px solid var(--gray-700);
          border-radius: 14px;
          font-size: 16px;
          font-family: inherit;
          background: transparent;
          color: var(--white);
          transition: all 0.3s ease;
        }

        .cta-form input::placeholder {
          color: var(--gray-500);
        }

        .cta-form input:focus {
          outline: none;
          border-color: var(--yellow);
        }

        .cta-form button {
          padding: 18px 36px;
          background: var(--yellow);
          color: var(--black);
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cta-form button:hover {
          background: var(--yellow-dark);
          transform: translateY(-2px);
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
          gap: 24px;
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
          gap: 32px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-links a {
          color: var(--gray-400);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: var(--white);
        }

        .footer-copy {
          font-size: 14px;
          color: var(--gray-500);
          text-align: right;
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
            padding: 16px 24px;
          }

          .nav-links {
            display: none;
          }

          .hero {
            padding: 120px 24px 60px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .hero-form {
            flex-direction: column;
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

          .cta-form {
            flex-direction: column;
          }

          .footer-container {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }

          .footer-copy {
            text-align: center;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav>
        <a href="#" className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          Spyke
        </a>
        <ul className="nav-links">
          <li>
            <a href="#features">Fonctionnalités</a>
          </li>
          <li>
            <a href="#how">Comment ça marche</a>
          </li>
          <li>
            <a href="#pricing">Tarifs</a>
          </li>
          <li>
            <Link href="/login" className="nav-cta">
              Commencer
            </Link>
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
              Automatisez vos tâches.
              <br />
              <span className="highlight">Gagnez du temps.</span>
            </h1>
            <p className="hero-description">
              Spyke génère vos devis, factures et relances en quelques clics grâce à l&apos;intelligence
              artificielle. Concentrez-vous sur votre métier.
            </p>
            <form
              className="hero-form"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <input type="email" placeholder="Votre email professionnel" />
              <button type="submit">Essai gratuit</button>
            </form>
            <div className="hero-social-proof">
              <div className="avatars">
                <img src="https://i.pravatar.cc/80?img=1" alt="User" />
                <img src="https://i.pravatar.cc/80?img=2" alt="User" />
                <img src="https://i.pravatar.cc/80?img=3" alt="User" />
                <img src="https://i.pravatar.cc/80?img=4" alt="User" />
              </div>
              <p>
                <strong>500+ freelances</strong> nous font déjà confiance
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://placehold.co/700x500/f4f4f5/a1a1aa?text=Interface+Spyke"
              alt="Interface Spyke"
            />
            <div className="hero-card hero-card-1">
              <div className="hero-card-icon">
                <svg width="24" height="24" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4>Temps économisé</h4>
              <p>10h/mois</p>
            </div>

            <div className="hero-card hero-card-2">
              <div className="hero-card-icon">
                <svg width="24" height="24" fill="none" stroke="#000" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4>Devis envoyés</h4>
              <p>+340%</p>
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
              <div className="stat-label">Freelances actifs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10h</div>
              <div className="stat-label">Économisées par mois</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction client</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2min</div>
              <div className="stat-label">Pour créer un devis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="features-container">
          <div className="section-header">
            <span className="section-label">Fonctionnalités</span>
            <h2>Tout ce dont vous avez besoin</h2>
            <p>
              Des outils puissants conçus spécifiquement pour simplifier la vie des freelances
              français.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3>Devis intelligents</h3>
              <p>
                Générez des devis professionnels en quelques secondes. L&apos;IA adapte le contenu
                selon votre client.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3>Facturation auto</h3>
              <p>
                Transformez vos devis en factures conformes. Numérotation automatique et mentions
                légales incluses.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3>Relances automatiques</h3>
              <p>
                Fini les impayés. Spyke relance vos clients automatiquement avec des messages
                personnalisés.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3>Emails IA</h3>
              <p>
                Rédigez des emails professionnels en un clic. Réponses clients, négociations, suivis
                de projet.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3>Gestion clients</h3>
              <p>
                Centralisez toutes les infos de vos clients. Historique, documents, notes, tout au
                même endroit.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3>Dashboard analytics</h3>
              <p>
                Visualisez votre activité en temps réel. CA, devis en attente, factures à encaisser.
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
              <h3>Créez votre compte</h3>
              <p>
                Inscription gratuite en 30 secondes. Aucune carte bancaire requise pour commencer.
              </p>
              <div className="step-connector" />
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Personnalisez votre profil</h3>
              <p>
                Ajoutez vos infos entreprise pour des documents et emails parfaitement adaptés.
              </p>
              <div className="step-connector" />
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Laissez l&apos;IA travailler</h3>
              <p>
                Générez devis, factures et emails en un clic. Gagnez des heures chaque semaine.
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
                  Spyke m&apos;a fait gagner un temps fou. Avant je passais 2h par semaine sur mes devis
                  et factures, maintenant c&apos;est 15 minutes max.
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
                  Les relances automatiques ont changé ma vie. Je n&apos;ai plus d&apos;impayés depuis que
                  j&apos;utilise Spyke. L&apos;IA rédige des messages parfaits.
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
                  Interface super intuitive, pas besoin de formation. J&apos;ai créé mon premier devis en
                  moins de 2 minutes. Je recommande à 100%.
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

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="pricing-container">
          <div className="section-header">
            <span className="section-label">Tarifs</span>
            <h2>Un prix simple et transparent</h2>
            <p>Pas de surprise. Pas d&apos;engagement. Annulez quand vous voulez.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-name">Gratuit</div>
              <p className="pricing-desc">Pour découvrir Spyke</p>
              <div className="pricing-price">
                0€<span>/mois</span>
              </div>
              <ul className="pricing-features">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  5 devis par mois
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  5 factures par mois
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  3 clients maximum
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  10 générations IA
                </li>
              </ul>
              <Link href="/login" className="pricing-btn">
                Commencer gratuitement
              </Link>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-name">Pro</div>
              <p className="pricing-desc">Pour les freelances sérieux</p>
              <div className="pricing-price">
                19€<span>/mois</span>
              </div>
              <ul className="pricing-features">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Devis illimités
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Factures illimitées
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Clients illimités
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  IA illimitée
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Relances automatiques
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Support prioritaire
                </li>
              </ul>
              <Link href="/login" className="pricing-btn">
                Essai gratuit 14 jours
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2>Prêt à gagner du temps ?</h2>
          <p>Rejoignez les 500+ freelances qui ont automatisé leur quotidien avec Spyke.</p>
          <form
            className="cta-form"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <input type="email" placeholder="Votre email professionnel" />
            <button type="submit">Démarrer maintenant</button>
          </form>
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
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
            <a href="#">Contact</a>
            <a href="#">Mentions légales</a>
          </div>
          <p className="footer-copy">Spyke © 2025 – Votre assistant freelance intelligent</p>
        </div>
      </footer>
    </>
  )
}
