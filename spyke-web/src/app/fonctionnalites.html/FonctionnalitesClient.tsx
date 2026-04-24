"use client"

import { useState } from 'react'

export default function FonctionnalitesClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
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
            <a href="/fonctionnalites.html" className="active" onClick={() => setMobileMenuOpen(false)}>
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

      {/* Hero */}
      <section className="hero">
        <span className="hero-label">Fonctionnalités</span>
        <h1>Tout ce qu&apos;il vous faut pour automatiser votre quotidien</h1>
        <p>Découvrez les outils qui vont transformer votre façon de gérer vos missions freelance.</p>
      </section>

      {/* Feature 1 */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <div className="feature-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Assistant IA
            </div>
            <h2>Des emails parfaits en quelques secondes</h2>
            <p>
              Fini les heures passées à rédiger des emails. L&apos;IA génère des messages professionnels
              adaptés à chaque situation et à chaque client.
            </p>
            <div className="feature-list">
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>
                  Types d&apos;emails : réponse, relance, devis, facture, négociation, remerciement,
                  prospection…
                </span>
              </div>
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Choix du ton : professionnel, chaleureux, formel ou décontracté</span>
              </div>
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Collez un email reçu ou un contexte : Spyke répond avec votre ton</span>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <img src="/feature-assistant-preview.jpg" alt="Aperçu Assistant IA" className="feature-image" />
            <div className="feature-floating-card card-1">
              <div className="floating-stat">
                <div className="floating-stat-icon">⚡</div>
                <div className="floating-stat-text">
                  <h4>30 sec</h4>
                  <p>pour un email parfait</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <div className="feature-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              Documents
            </div>
            <h2>Devis, factures et contrats — au même endroit</h2>
            <p>
              Créez vos documents conformes et cohérents (profil, mentions, numérotation) sans
              jongler entre Excel, Word et des modèles copiés-collés.
            </p>
            <div className="feature-list">
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Devis : calculs auto (HT/TVA/TTC), acompte, validité, statuts</span>
              </div>
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Factures : échéances, suivi “payée/en retard”, relances plus simples</span>
              </div>
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Contrats : génération structurée + export PDF, import depuis un devis</span>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <img src="/feature-documents-preview.jpg" alt="Aperçu documents Spyke" className="feature-image" />
            <div className="feature-floating-card card-2">
              <div className="floating-stat">
                <div className="floating-stat-icon">📄</div>
                <div className="floating-stat-text">
                  <h4>PDF prêt</h4>
                  <p>devis, facture, contrat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3 */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <div className="feature-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Analyse de brief
            </div>
            <h2>Évaluez vos projets avant de vous engager</h2>
            <p>
              Collez le brief d&apos;un client et laissez l&apos;IA analyser la faisabilité, les points
              d&apos;attention et vous donner une recommandation claire.
            </p>
            <div className="feature-list">
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Score de clarté du brief client</span>
              </div>
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Détection des points d&apos;attention et red flags</span>
              </div>
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Recommandation : accepter, négocier ou refuser</span>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <img src="/feature-gonogo-preview.jpg" alt="Analyse de brief" className="feature-image" />
            <div className="feature-floating-card card-1">
              <div className="floating-stat">
                <div className="floating-stat-icon">✅</div>
                <div className="floating-stat-text">
                  <h4>Go / No Go</h4>
                  <p>en 10 secondes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4 */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <div className="feature-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Gestion clients
            </div>
            <h2>Tous vos clients au même endroit</h2>
            <p>
              Centralisez les informations de vos clients, leur historique et leurs documents. Plus
              jamais de "c&apos;était dans quel email déjà ?"
            </p>
            <div className="feature-list">
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Fiche client complète : contact, notes, historique</span>
              </div>
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Suivi du CA généré par client</span>
              </div>
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Accès rapide aux devis et documents associés</span>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <img src="/feature-clients-preview.jpg" alt="Gestion clients" className="feature-image" />
            <div className="feature-floating-card card-2">
              <div className="floating-stat">
                <div className="floating-stat-icon">👥</div>
                <div className="floating-stat-text">
                  <h4>Tout en 1</h4>
                  <p>fini les fichiers Excel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features */}
      <section className="all-features">
        <div className="all-features-container">
          <div className="section-header">
            <h2>Et bien plus encore...</h2>
            <p>Des fonctionnalités pensées pour vous faire gagner du temps</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card-icon">🔔</div>
              <h3>Relances automatiques</h3>
              <p>
                Recevez des suggestions de relance quand un devis reste sans réponse ou qu’une facture
                approche de l’échéance / passe en retard.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">📊</div>
              <h3>Dashboard intelligent</h3>
              <p>
                Visualisez votre CA, vos devis en attente, vos factures à encaisser et vos relances en
                un coup d&apos;œil.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">💬</div>
              <h3>Chatbox intégrée</h3>
              <p>
                Posez une question à tout moment (email, contrat, impayé, administratif). Vous
                n&apos;êtes jamais bloqué.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">🔒</div>
              <h3>Données sécurisées</h3>
              <p>Vos données sont chiffrées et hébergées en France. RGPD compliant.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">✍️</div>
              <h3>Signature & e-signature</h3>
              <p>Ajoutez votre signature sur les PDFs et lancez des demandes de signature en ligne pour vos contrats.</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">⚖️</div>
              <h3>Question juriste</h3>
              <p>Un bouton dédié pour poser une question et obtenir une réponse claire (service payant à la question).</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-container">
          <h2>Prêt à automatiser votre quotidien ?</h2>
          <p>Rejoignez les freelances qui gagnent des heures chaque semaine grâce à Spyke.</p>
          <div className="cta-buttons">
            <a href="/connexion.html" className="btn btn-primary">
              14 jours gratuits — annulable à tout moment
            </a>
            <a href="/tarifs.html" className="btn btn-secondary">
              Voir les tarifs
            </a>
          </div>
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
            <a href="/cgu.html">CGU</a>
            <a href="/confidentialite.html">Confidentialité</a>
          </div>
          <p className="footer-copy">Spyke © 2025 – L’assistant freelance (emails, devis, factures, contrats)</p>
        </div>
      </footer>
    </>
  )
}
