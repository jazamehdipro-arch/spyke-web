export const HOME_CSS = `
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

        /* Help the browser keep animations composited */
        .hero-content,
        .hero-visual,
        .hero-card,
        .hero-social-proof {
          will-change: transform, opacity;
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

        .hero-visual-img {
          width: 100%;
          height: auto;
          display: block;
          aspect-ratio: 16 / 9;
          border-radius: 24px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .hero-card {
          position: absolute;
          background: var(--white);
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.10);
          animation: float 3s ease-in-out infinite;
          transform-origin: center;
        }

        .hero-card-1 {
          top: 10%;
          right: -30px;
          animation-delay: 0s;
          transform: scale(0.88);
        }

        .hero-card-2 {
          bottom: 15%;
          left: -40px;
          animation-delay: 1.5s;
          transform: scale(0.88);
        }

        .hero-card-3 {
          top: 48%;
          right: -26px;
          animation-delay: 0.8s;
          transform: scale(0.62);
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

        /* Make the "signed docs" card more compact */
        .hero-card-3 {
          max-width: 220px;
        }

        .hero-card-3 h4 {
          font-size: 12px;
          line-height: 1.25;
        }

        .hero-card-3 p {
          font-size: 18px;
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

        .testimonials-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-top: 22px;
        }

        .testimonials-nav {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .nav-arrow {
          width: 52px;
          height: 52px;
          border-radius: 999px;
          border: 1px solid var(--gray-200);
          background: var(--white);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-arrow:hover {
          transform: translateY(-1px);
          border-color: var(--gray-300);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
        }

        .nav-arrow svg {
          width: 18px;
          height: 18px;
          stroke: var(--gray-800);
        }

        .testimonials-pager {
          font-size: 13px;
          color: var(--gray-500);
          min-width: 70px;
          text-align: center;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 44px;
        }

        .testimonial-card {
          transition: transform 220ms ease, opacity 220ms ease;
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

          /* Prevent hero visual/cards from overlapping the CTA on small screens */
          .hero {
            min-height: auto;
            align-items: flex-start;
          }

          .hero-container {
            gap: 28px;
          }

          .hero-visual {
            margin-top: 12px;
            z-index: 1;
          }

          .hero-card {
            display: none;
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

          .testimonials-head {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
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
`
