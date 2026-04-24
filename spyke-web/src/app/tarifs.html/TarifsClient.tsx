"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

type ProPeriod = 'monthly' | 'annual'

export default function TarifsClient() {
  const [period, setPeriod] = useState<ProPeriod>('annual')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profilePlan, setProfilePlan] = useState<'free' | 'pro' | null>(null)
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase) return
        const { data } = await supabase.auth.getSession()
        const userId = data.session?.user?.id
        if (!userId) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan,onboarding_completed')
          .eq('id', userId)
          .maybeSingle()

        const plan = String((profile as any)?.plan || 'free') === 'pro' ? 'pro' : 'free'
        setProfilePlan(plan)
        setOnboardingDone(Boolean((profile as any)?.onboarding_completed))
      } catch {
        // ignore
      }
    })()
  }, [supabase])

  async function chooseFree() {
    try {
      if (!supabase) {
        window.location.href = '/app.html?tour=1'
        return
      }

      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id
      if (!userId) {
        window.location.href = '/connexion.html'
        return
      }

      if (onboardingDone === false) {
        window.location.href = '/onboarding.html'
        return
      }

      window.location.href = '/app.html?tour=1'
    } catch {
      window.location.href = '/app.html?tour=1'
    }
  }

  async function startProCheckout() {
    try {
      setError('')
      setLoading(true)

      if (!supabase) throw new Error('Supabase non configuré')
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        window.location.href = '/connexion.html'
        return
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ period }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur paiement (${res.status})`)
      const url = String(json?.url || '')
      if (!url) throw new Error('URL Stripe manquante')
      window.location.href = url
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const proPrice = period === 'annual' ? '199€' : '19,90€'
  const proSuffix = period === 'annual' ? '/an' : '/mois'

  return (
    <>
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
            <a href="/tarifs.html" className="active" onClick={() => setMobileMenuOpen(false)}>
              Tarifs
            </a>
          </li>
          <li>
            <a href="/connexion.html" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>
              Créer un compte
            </a>
          </li>
        </ul>
      </nav>

      <section className="hero">
        <span className="hero-label">Tarifs</span>
        <h1>Un prix simple. Choisissez le rythme.</h1>
        <p>Commencez en gratuit, puis passez Pro quand vous voulez. Annulable à tout moment.</p>

        <div className="toggle-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="toggle" role="tablist" aria-label="Période">
              <button type="button" className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>
                Mensuel
              </button>
              <button type="button" className={period === 'annual' ? 'active' : ''} onClick={() => setPeriod('annual')}>
                Annuel
              </button>
            </div>
            {period === 'annual' ? <div className="save-pill">Économisez 2 mois</div> : null}
          </div>
        </div>
      </section>

      <section className="pricing">
        <div className="pricing-container">
          <div className="pricing-grid">
            <div className="card">
              <div className="name">Gratuit</div>
              <div className="desc">Pour découvrir Spyke</div>
              <div className="price">
                0€<span>/mois</span>
              </div>
              <div className="subline">Pas de carte bancaire.</div>
              <button className="btn btn-secondary" type="button" onClick={chooseFree}>
                {profilePlan === 'pro' ? 'Accéder à mon compte Pro' : 'Continuer en gratuit'}
              </button>
              <ul className="feature-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  10 emails IA / mois
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  3 documents / mois (devis, factures, contrats)
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  3 clients maximum
                </li>
              </ul>
            </div>

            <div className="card featured">
              <div className="name">Pro</div>
              <div className="desc">Pour les freelances qui facturent régulièrement</div>
              <div className="price">
                {proPrice}
                <span>{proSuffix}</span>
              </div>
              {period === 'annual' ? (
                <div className="subline">199€/an, soit 16,58€/mois.</div>
              ) : (
                <div className="subline">Abonnement mensuel, annulable à tout moment.</div>
              )}
              <button className="btn btn-primary" type="button" onClick={startProCheckout} disabled={loading}>
                {loading ? 'Redirection…' : 'Passer Pro'}
              </button>
              <ul className="feature-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Emails IA illimités
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Documents illimités (devis, factures, contrats)
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Chatbox d&apos;aide intégrée
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Signature sur PDF + demandes d&apos;e-signature
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Accès “Question juriste” (5€ / question)
                </li>
              </ul>
            </div>
          </div>

          {error ? <div className="error">{error}</div> : null}

          <div style={{ maxWidth: 920, margin: '48px auto 0' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, letterSpacing: '-1px', marginBottom: 14 }}>FAQ</h2>
            <div style={{ color: 'var(--gray-500)', marginBottom: 18 }}>Réponses rapides aux questions les plus fréquentes.</div>

            {[
              {
                q: 'L’essai gratuit Pro, comment ça marche ?',
                a: 'Tu peux activer Pro et tester pendant 14 jours. À la fin de l’essai, l’abonnement mensuel (19,90€/mois) démarre sauf résiliation avant.',
              },
              {
                q: 'Puis-je payer en annuel ?',
                a: 'Oui. L’annuel est à 199€/an, soit 16,58€/mois. Tu économises l’équivalent de 2 mois par rapport au mensuel.',
              },
              {
                q: 'Je peux annuler quand je veux ?',
                a: 'Oui. Tu peux résilier à tout moment depuis ton espace client (Stripe).',
              },
              {
                q: 'Que se passe-t-il si je reste en Gratuit ?',
                a: 'Le plan Gratuit te permet de tester l’app avec des limites mensuelles (emails IA, documents et clients). Tu peux passer Pro quand tu veux.',
              },
              {
                q: 'La question juriste est incluse dans Pro ?',
                a: 'Le bouton est inclus dans Pro, mais la prestation est facturée à la question (5€) car elle déclenche un traitement côté juristes.',
              },
            ].map((item) => (
              <details
                key={item.q}
                style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 10,
                  background: 'var(--white)',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 900, color: 'var(--gray-800)' }}>{item.q}</summary>
                <div style={{ marginTop: 10, color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.7 }}>{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
