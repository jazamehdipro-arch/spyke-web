import TarifsClient from './TarifsClient'

export default function TarifsPage() {
  return (
    <>
      <style>{`
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
          --yellow-light: #fef9c3;
          --gradient: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--white);
          color: var(--gray-900);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

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

        .nav-links a:hover,
        .nav-links a.active {
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

        .hero {
          padding: 160px 48px 40px;
          text-align: center;
          background: linear-gradient(180deg, var(--gray-50) 0%, var(--white) 100%);
        }

        .hero-label {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--yellow-dark);
          margin-bottom: 20px;
        }

        .hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: 56px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -2px;
          color: var(--black);
          margin-bottom: 18px;
          max-width: 860px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero p {
          font-size: 20px;
          color: var(--gray-500);
          max-width: 720px;
          margin: 0 auto;
          line-height: 1.7;
        }

        .toggle-wrap {
          margin-top: 26px;
          display: flex;
          justify-content: center;
        }

        .toggle {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 999px;
          padding: 6px;
          display: inline-flex;
          gap: 6px;
          box-shadow: 0 18px 30px rgba(0, 0, 0, 0.06);
        }

        .toggle button {
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 800;
          color: var(--gray-600);
          font-size: 14px;
        }

        .toggle button.active {
          background: var(--yellow-light);
          color: var(--black);
          border: 1px solid rgba(250, 204, 21, 0.6);
        }

        .save-pill {
          margin-left: 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--black);
          color: var(--white);
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }

        .pricing {
          padding: 30px 48px 100px;
          background: var(--white);
        }

        .pricing-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 22px;
        }

        .card {
          border: 1px solid var(--gray-200);
          border-radius: 18px;
          padding: 26px;
          background: var(--white);
        }

        .card.featured {
          border: 2px solid rgba(250, 204, 21, 0.85);
          box-shadow: 0 22px 40px rgba(250, 204, 21, 0.10);
        }

        .name {
          font-size: 14px;
          font-weight: 900;
          color: var(--gray-700);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .desc {
          color: var(--gray-500);
          margin-bottom: 18px;
          font-size: 15px;
        }

        .price {
          font-family: 'Syne', sans-serif;
          font-size: 44px;
          font-weight: 800;
          color: var(--black);
          margin-bottom: 10px;
        }

        .price span {
          font-size: 16px;
          font-weight: 700;
          color: var(--gray-500);
          margin-left: 6px;
        }

        .subline {
          font-size: 13px;
          color: var(--gray-500);
          margin-bottom: 16px;
        }

        .feature-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 18px;
        }

        .feature-list li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: var(--gray-700);
          font-size: 14px;
        }

        .feature-list li svg {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          margin-top: 1px;
          stroke: var(--yellow-dark);
        }

        .btn {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 14px 18px;
          border-radius: 14px;
          font-weight: 900;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }

        .btn-primary {
          background: var(--black);
          color: var(--white);
        }

        .btn-secondary {
          background: var(--gray-100);
          color: var(--black);
        }

        .mobile-nav-toggle {
          display: none;
        }

        .error {
          margin-top: 14px;
          text-align: center;
          color: #b91c1c;
          font-size: 13px;
        }

        @media (max-width: 860px) {
          nav {
            padding: 16px 18px;
          }

          .mobile-nav-toggle {
            display: inline-flex;
            width: 52px;
            height: 52px;
            border: 1px solid var(--gray-200);
            background: #fff;
            border-radius: 16px;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .mobile-nav-toggle svg {
            width: 24px;
            height: 24px;
            stroke: var(--gray-800);
            stroke-width: 2;
            fill: none;
            stroke-linecap: round;
          }

          .nav-links {
            display: none;
            position: absolute;
            top: 74px;
            left: 16px;
            right: 16px;
            flex-direction: column;
            gap: 16px;
            padding: 18px;
            background: rgba(255, 255, 255, 0.98);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 18px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          }

          .nav-links.open {
            display: flex;
          }

          .hero {
            padding: 120px 18px 30px;
          }
          .hero h1 {
            font-size: 38px;
          }
          .pricing {
            padding: 20px 18px 70px;
          }
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <TarifsClient />
    </>
  )
}
