'use client'

import { useState } from 'react'

export function MarketingNav(props: {
  active?: 'Fonctionnalités' | 'Comment ça marche' | 'Tarifs' | 'Blog' | ''
  pricingHref?: string
}) {
  const [open, setOpen] = useState(false)

  const pricingHref = props.pricingHref || '/tarifs.html'

  return (
    <nav aria-label="Navigation principale">
      <div className="nav-inner">
        <a href="/" className="nav-logo" onClick={() => setOpen(false)}>
          <div className="nav-logo-icon">⚡</div>
          Spyke
        </a>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        <ul className={`nav-links ${open ? 'open' : ''}`}>
          <li>
            <a
              href="/fonctionnalites.html"
              className={props.active === 'Fonctionnalités' ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              Fonctionnalités
            </a>
          </li>
          <li>
            <a
              href="/comment-ca-marche.html"
              className={props.active === 'Comment ça marche' ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              Comment ça marche
            </a>
          </li>
          <li>
            <a href="/blog" className={props.active === 'Blog' ? 'active' : ''} onClick={() => setOpen(false)}>
              Blog
            </a>
          </li>
          <li>
            <a href={pricingHref} className={props.active === 'Tarifs' ? 'active' : ''} onClick={() => setOpen(false)}>
              Tarifs
            </a>
          </li>
          <li>
            <a href="/connexion.html" className="nav-cta" onClick={() => setOpen(false)}>
              Créer un compte gratuit
            </a>
          </li>
        </ul>
      </div>

      <style jsx>{`
        .mobile-nav-toggle {
          display: none;
        }

        @media (max-width: 860px) {
          .mobile-nav-toggle {
            display: inline-flex;
            width: 52px;
            height: 52px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .mobile-nav-toggle svg {
            width: 24px;
            height: 24px;
            stroke: rgba(255, 255, 255, 0.9);
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
            background: rgba(10, 10, 10, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 18px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
          }

          .nav-links.open {
            display: flex;
          }

          .nav-links a {
            width: 100%;
          }
        }
      `}</style>
    </nav>
  )
}
