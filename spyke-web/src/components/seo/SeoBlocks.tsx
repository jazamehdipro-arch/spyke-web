'use client'

import { useMemo, useState } from 'react'

export function ConversionBanner({
  title = 'Devis → Contrat → Facture → Relance en 1 clic',
  subtitle = "Avec Spyke Pro, transformez ce document en contrat puis en facture automatiquement. Plus besoin de retaper les infos. L'IA fait le reste.",
  cta = 'Essayer gratuitement',
  href = '/connexion.html',
}: {
  title?: string
  subtitle?: string
  cta?: string
  href?: string
}) {
  return (
    <section style={{ maxWidth: 900, margin: '40px auto 0', padding: '0 40px' }}>
      <div
        style={{
          background: '#0a0a0a',
          borderRadius: 20,
          padding: '34px 38px',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          position: 'relative',
          overflow: 'hidden',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: 999,
            background: '#facc15',
            opacity: 0.08,
            right: -60,
            top: -60,
            filter: 'blur(60px)',
          }}
        />

        <div
          style={{
            width: 56,
            height: 56,
            background: 'rgba(250, 204, 21, 0.15)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(250, 204, 21, 0.2)',
            zIndex: 1,
          }}
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#facc15"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"/></svg>
        </div>

        <div style={{ flex: 1, minWidth: 240, zIndex: 1 }}>
          <div style={{ fontFamily: 'Syne, ui-sans-serif, system-ui', fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{title}</div>
          <div style={{ marginTop: 6, fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>{subtitle}</div>
        </div>

        <a
          href={href}
          style={{
            padding: '14px 26px',
            background: '#facc15',
            color: '#0a0a0a',
            borderRadius: 12,
            fontFamily: 'Syne, ui-sans-serif, system-ui',
            fontSize: 14,
            fontWeight: 900,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {cta}
        </a>
      </div>
    </section>
  )
}

export function OtherTools() {
  const tools = useMemo(
    () => [
      {
        href: '/devis-freelance',
        name: 'Générateur de devis',
        desc: 'Freelance, PDF gratuit',
        color: '#facc15',
      },
      {
        href: '/facture-auto-entrepreneur',
        name: 'Générateur de facture',
        desc: 'Auto-entrepreneur, PDF gratuit',
        color: '#3b82f6',
      },
      {
        href: '/contrat-freelance',
        name: 'Générateur de contrat',
        desc: 'Prestation freelance, gratuit',
        color: '#f97316',
      },
    ],
    []
  )

  return (
    <section style={{ maxWidth: 900, margin: '48px auto 0', padding: '0 40px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.4px', marginBottom: 14 }}>Nos autres outils gratuits</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {tools.map((t) => (
          <a
            key={t.href}
            href={t.href}
            style={{
              background: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: 14,
              padding: '18px 20px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: '#0a0a0a',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `color-mix(in srgb, ${t.color} 14%, white)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid color-mix(in srgb, ${t.color} 20%, white)`,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 999, background: t.color, display: 'inline-block' }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>{t.desc}</div>
            </div>
          </a>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          section { padding: 0 20px !important; }
          div[style*='gridTemplateColumns: repeat(3, 1fr)'] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

export type FaqItem = { q: string; a: string }

export function FaqAccordion({ title = 'Questions fréquentes', items }: { title?: string; items: FaqItem[] }) {
  const [open, setOpen] = useState(0)

  return (
    <section style={{ maxWidth: 900, margin: '48px auto 0', padding: '0 40px' }}>
      <div style={{ width: 60, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 20 }} />
      <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.6px', marginBottom: 14 }}>{title}</h2>

      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((it, idx) => {
          const isOpen = open === idx
          return (
            <div
              key={idx}
              style={{
                background: '#fff',
                border: '1px solid #e4e4e7',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen((cur) => (cur === idx ? -1 : idx))}
                style={{
                  width: '100%',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontFamily: 'Syne, ui-sans-serif, system-ui',
                  fontWeight: 900,
                  fontSize: 15,
                  color: '#0a0a0a',
                }}
              >
                <span>{it.q}</span>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: isOpen ? 'rgba(250, 204, 21, 0.18)' : '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke={isOpen ? '#eab308' : '#71717a'} strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              <div style={{ padding: isOpen ? '0 22px 18px' : '0 22px', maxHeight: isOpen ? 400 : 0, overflow: 'hidden', transition: 'all 0.25s ease' }}>
                <p style={{ margin: 0, color: '#52525b', lineHeight: 1.75, fontSize: 14 }}>{it.a}</p>
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          section { padding: 0 20px !important; }
        }
      `}</style>
    </section>
  )
}
