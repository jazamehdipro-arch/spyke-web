export default function BlogTjmPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --black: #0a0a0a; --white: #ffffff; --yellow: #facc15; --yellow-dark: #eab308;
          --gray-300: #d4d4d8; --gray-400: #a1a1aa; --gray-500: #71717a; --gray-600: #52525b;
          --gray-700: #3f3f46; --gray-800: #27272a; --gray-900: #18181b;
          --font-display: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;
        }
        body { font-family: var(--font-body); background: var(--black); color: var(--gray-300); -webkit-font-smoothing: antialiased; line-height: 1.75; }
        a { color: var(--yellow); text-decoration: none; }
        a:hover { text-decoration: underline; }

        nav { position: sticky; top: 0; z-index: 100; background: rgba(10,10,10,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 24px; }
        .nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
        .nav-logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; font-size: 1.25rem; color: var(--white); text-decoration: none; }
        .nav-logo:hover { text-decoration: none; }
        .nav-logo-icon { width: 36px; height: 36px; background: var(--gray-800); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
        .nav-links a { font-size: 0.9rem; color: var(--gray-400); transition: color 0.2s; text-decoration: none; }
        .nav-links a:hover { color: var(--white); text-decoration: none; }
        .nav-cta { background: var(--yellow); color: var(--black); padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 0.88rem; transition: background 0.2s; }
        .nav-cta:hover { background: var(--yellow-dark); text-decoration: none; }
        @media (max-width: 768px) { .nav-links { display: none; } }

        .article-hero { max-width: 800px; margin: 0 auto; padding: 64px 24px 40px; animation: fadeUp 0.7s ease-out; }
        .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--gray-500); margin-bottom: 28px; flex-wrap: wrap; }
        .breadcrumb a { color: var(--gray-400); text-decoration: none; }
        .breadcrumb a:hover { color: var(--yellow); }
        .breadcrumb span { color: var(--gray-600); }
        .article-tag-top { display: inline-flex; align-items: center; gap: 6px; background: rgba(250,204,21,0.12); color: var(--yellow); padding: 5px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 20px; }
        .article-hero h1 { font-family: var(--font-display); font-size: clamp(2rem, 4.5vw, 2.8rem); font-weight: 800; line-height: 1.18; color: var(--white); margin-bottom: 20px; letter-spacing: -0.02em; }
        .article-hero-desc { font-size: 1.12rem; color: var(--gray-400); line-height: 1.7; margin-bottom: 28px; }
        .article-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.85rem; color: var(--gray-500); }
        .article-meta span { display: flex; align-items: center; gap: 6px; }

        .toc { max-width: 800px; margin: 0 auto 48px; padding: 0 24px; animation: fadeUp 0.7s ease-out 0.1s both; }
        .toc-box { background: var(--gray-900); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px 32px; }
        .toc-title { font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: var(--white); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .toc-list { list-style: none; counter-reset: toc; }
        .toc-list li { counter-increment: toc; margin-bottom: 8px; }
        .toc-list li a { display: flex; align-items: baseline; gap: 10px; font-size: 0.92rem; color: var(--gray-400); text-decoration: none; transition: color 0.2s, padding-left 0.2s; padding: 4px 0; }
        .toc-list li a:hover { color: var(--yellow); padding-left: 4px; text-decoration: none; }
        .toc-list li a::before { content: counter(toc, decimal-leading-zero); font-family: var(--font-display); font-weight: 700; font-size: 0.78rem; color: var(--yellow); min-width: 22px; }

        .article-content { max-width: 800px; margin: 0 auto; padding: 0 24px 60px; animation: fadeUp 0.7s ease-out 0.2s both; }
        .article-content h2 { font-family: var(--font-display); font-size: 1.55rem; font-weight: 700; color: var(--white); margin: 56px 0 20px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); line-height: 1.3; letter-spacing: -0.01em; }
        .article-content h2:first-child { margin-top: 0; padding-top: 0; border-top: none; }
        .article-content h3 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; color: var(--white); margin: 36px 0 14px; line-height: 1.35; }
        .article-content p { font-size: 1.02rem; line-height: 1.8; margin-bottom: 20px; color: var(--gray-300); }
        .article-content strong { color: var(--white); font-weight: 600; }

        .formula-box { background: var(--gray-900); border: 1px solid rgba(250,204,21,0.15); border-radius: 14px; padding: 32px; margin: 32px 0; text-align: center; }
        .formula-label { font-family: var(--font-display); font-weight: 700; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--yellow); margin-bottom: 16px; }
        .formula { font-family: var(--font-display); font-size: clamp(1.1rem, 3vw, 1.5rem); font-weight: 700; color: var(--white); line-height: 1.5; }
        .formula span { color: var(--yellow); }

        .step-card { background: var(--gray-900); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 28px; margin: 28px 0; position: relative; overflow: hidden; }
        .step-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--yellow); border-radius: 4px 0 0 4px; }
        .step-number { font-family: var(--font-display); font-weight: 800; font-size: 3rem; color: rgba(250,204,21,0.1); position: absolute; top: 12px; right: 24px; line-height: 1; }
        .step-card h3 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--white); margin: 0 0 10px; }
        .step-card p { font-size: 0.95rem; margin-bottom: 0; color: var(--gray-400); line-height: 1.7; }
        .step-card p + p { margin-top: 12px; }

        .calc-block { background: rgba(250,204,21,0.04); border: 1px dashed rgba(250,204,21,0.2); border-radius: 10px; padding: 18px 22px; margin-top: 16px; font-size: 0.92rem; line-height: 1.8; color: var(--gray-300); }
        .calc-block .calc-result { font-family: var(--font-display); font-weight: 700; color: var(--yellow); font-size: 1.05rem; margin-top: 8px; display: block; }

        .simulator { background: var(--gray-900); border: 1px solid rgba(250,204,21,0.15); border-radius: 16px; padding: 32px; margin: 40px 0; }
        .simulator-title { font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; color: var(--white); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
        .simulator-desc { font-size: 0.9rem; color: var(--gray-500); margin-bottom: 24px; }
        .sim-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .sim-row label { flex: 1; font-size: 0.92rem; color: var(--gray-300); }
        .sim-row input, .sim-row select { width: 160px; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--gray-700); background: var(--gray-800); color: var(--white); font-family: var(--font-body); font-size: 0.92rem; outline: none; transition: border-color 0.2s; }
        .sim-row input:focus, .sim-row select:focus { border-color: var(--yellow); }
        .sim-row input::placeholder { color: var(--gray-600); }
        .sim-row select { cursor: pointer; }
        .sim-row select option { background: var(--gray-800); }
        .sim-result { margin-top: 24px; padding: 20px 24px; background: rgba(250,204,21,0.06); border: 1px solid rgba(250,204,21,0.15); border-radius: 10px; text-align: center; }
        .sim-result-label { font-size: 0.85rem; color: var(--gray-400); margin-bottom: 4px; }
        .sim-result-value { font-family: var(--font-display); font-weight: 800; font-size: 2rem; color: var(--yellow); }
        .sim-result-detail { font-size: 0.82rem; color: var(--gray-500); margin-top: 6px; }
        @media (max-width: 600px) { .sim-row { flex-direction: column; align-items: stretch; gap: 6px; } .sim-row input, .sim-row select { width: 100%; } }

        .comparison-table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 28px 0; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
        .comparison-table thead th { background: var(--gray-800); font-family: var(--font-display); font-weight: 700; font-size: 0.85rem; color: var(--white); padding: 14px 18px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .comparison-table tbody td { background: var(--gray-900); padding: 12px 18px; font-size: 0.9rem; color: var(--gray-300); border-bottom: 1px solid rgba(255,255,255,0.04); }
        .comparison-table tbody tr:last-child td { border-bottom: none; }
        .comparison-table .highlight-cell { color: var(--yellow); font-weight: 600; }

        .info-box { background: rgba(250,204,21,0.06); border-left: 4px solid var(--yellow); border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 28px 0; }
        .info-box p { margin-bottom: 0; font-size: 0.95rem; color: var(--gray-300); }
        .info-box strong { color: var(--yellow); }
        .warning-box { background: rgba(239,68,68,0.06); border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 28px 0; }
        .warning-box p { margin-bottom: 0; font-size: 0.95rem; }
        .warning-box strong { color: #ef4444; }

        .article-content ol { list-style: none; counter-reset: article-list; margin: 20px 0; padding-left: 0; }
        .article-content ol li { counter-increment: article-list; padding: 8px 0 8px 40px; position: relative; font-size: 0.98rem; line-height: 1.7; }
        .article-content ol li::before { content: counter(article-list); position: absolute; left: 0; top: 8px; width: 28px; height: 28px; border-radius: 8px; background: rgba(250,204,21,0.12); color: var(--yellow); font-family: var(--font-display); font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; }

        .cta-inline { background: linear-gradient(135deg, var(--gray-900), #1a1520); border: 1px solid rgba(250,204,21,0.12); border-radius: 16px; padding: 36px 32px; margin: 40px 0; text-align: center; position: relative; overflow: hidden; }
        .cta-inline::before { content: ''; position: absolute; width: 250px; height: 250px; background: radial-gradient(circle, rgba(250,204,21,0.06), transparent 70%); top: -80px; right: -80px; }
        .cta-inline h3 { font-family: var(--font-display); font-size: 1.3rem; color: var(--white); margin-bottom: 10px; position: relative; }
        .cta-inline p { color: var(--gray-400); font-size: 0.95rem; margin-bottom: 22px; position: relative; }
        .cta-btn { display: inline-block; background: var(--yellow); color: var(--black); padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; font-family: var(--font-display); transition: background 0.2s, transform 0.2s; position: relative; text-decoration: none; }
        .cta-btn:hover { background: var(--yellow-dark); transform: translateY(-2px); text-decoration: none; }

        .related { max-width: 800px; margin: 0 auto; padding: 0 24px 64px; }
        .related h2 { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--white); margin-bottom: 24px; padding-left: 16px; border-left: 4px solid var(--yellow); }
        .related-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .related-card { background: var(--gray-900); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 24px; transition: transform 0.3s, border-color 0.3s; text-decoration: none; display: block; }
        .related-card:hover { transform: translateY(-3px); border-color: rgba(250,204,21,0.15); text-decoration: none; }
        .related-card-tag { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--yellow); margin-bottom: 8px; }
        .related-card h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: var(--white); line-height: 1.35; margin-bottom: 8px; transition: color 0.2s; }
        .related-card:hover h3 { color: var(--yellow); }
        .related-card p { font-size: 0.84rem; color: var(--gray-500); line-height: 1.5; }
        @media (max-width: 600px) { .related-grid { grid-template-columns: 1fr; } }

        footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 40px 24px; text-align: center; }
        .footer-inner { max-width: 1200px; margin: 0 auto; }
        .footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; margin-bottom: 20px; }
        .footer-links a { font-size: 0.85rem; color: var(--gray-500); transition: color 0.2s; text-decoration: none; }
        .footer-links a:hover { color: var(--white); text-decoration: none; }
        .footer-copy { font-size: 0.8rem; color: var(--gray-600); }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <nav>
        <div className="nav-inner">
          <a href="/" className="nav-logo"><div className="nav-logo-icon">⚡</div>Spyke</a>
          <ul className="nav-links">
            <li><a href="/fonctionnalites.html">Fonctionnalités</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/#pricing">Tarifs</a></li>
            <li><a href="/connexion.html" className="nav-cta">Créer un compte gratuit</a></li>
          </ul>
        </div>
      </nav>

      <header className="article-hero">
        <div className="breadcrumb">
          <a href="/">Spyke</a><span>›</span><a href="/blog">Blog</a><span>›</span><span>Calculer son TJM</span>
        </div>
        <div className="article-tag-top">💰 Gestion</div>
        <h1>Calculer son TJM freelance : la méthode pas à pas</h1>
        <p className="article-hero-desc">
          Trop de freelances fixent leur TJM au hasard et finissent par gagner moins qu&apos;un salarié. Voici la méthode
          complète pour calculer un tarif rentable, avec un simulateur intégré et les erreurs qui coûtent cher.
        </p>
        <div className="article-meta">
          <span>📅 16 février 2026</span>
          <span>⏱ 5 min de lecture</span>
          <span>✍️ Spyke</span>
        </div>
      </header>

      <section className="toc">
        <div className="toc-box">
          <div className="toc-title">📑 Sommaire</div>
          <ol className="toc-list">
            <li><a href="#definition">C&apos;est quoi le TJM exactement ?</a></li>
            <li><a href="#formule">La formule de calcul</a></li>
            <li><a href="#methode">La méthode en 4 étapes</a></li>
            <li><a href="#simulateur">Simulateur de TJM</a></li>
            <li><a href="#reperes">Fourchettes de TJM par métier</a></li>
            <li><a href="#erreurs">Les 5 erreurs à éviter</a></li>
            <li><a href="#negocier">Négocier et ajuster son TJM</a></li>
          </ol>
        </div>
      </section>

      <article className="article-content">
        <h2 id="definition">C&apos;est quoi le TJM exactement ?</h2>

        <p>
          Le TJM, ou <strong>Taux Journalier Moyen</strong>, c&apos;est le prix que vous facturez pour une journée de travail
          en tant que freelance. C&apos;est la métrique de base du marché freelance : quand un client vous demande
          &quot;quel est votre tarif ?&quot;, c&apos;est votre TJM qu&apos;il veut connaître.
        </p>

        <p>
          Mais le TJM n&apos;est pas un salaire journalier. C&apos;est un montant qui doit couvrir <strong>beaucoup plus</strong>{' '}
          que votre rémunération : vos charges sociales, vos frais professionnels, vos congés, vos jours de
          prospection, vos jours de maladie, votre matériel, vos logiciels, et une marge de sécurité. Si vous fixez
          votre TJM comme un simple &quot;salaire divisé par les jours du mois&quot;, vous allez droit dans le mur.
        </p>

        <div className="warning-box">
          <p>
            <strong>Le piège classique :</strong> Un salarié à 3 000 € net/mois pourrait se dire &quot;3 000 ÷ 20 jours = 150
            € par jour&quot;. Mais à 150 €/jour en freelance, une fois les charges payées et les jours non facturés
            déduits, il gagne l&apos;équivalent d&apos;un SMIC. C&apos;est l&apos;erreur numéro 1 des freelances débutants.
          </p>
        </div>

        <h2 id="formule">La formule de calcul</h2>

        <p>La formule est simple dans son principe, même si chaque variable mérite d&apos;être réfléchie :</p>

        <div className="formula-box">
          <div className="formula-label">Formule du TJM</div>
          <div className="formula">
            TJM = <span>(Revenu cible + Charges + Frais)</span> ÷ Jours facturés
          </div>
        </div>

        <p>
          Chaque élément de cette formule a un impact direct sur votre TJM. Sous-estimer un seul d&apos;entre eux et vous
          vous retrouvez avec un tarif qui ne couvre pas vos besoins réels.
        </p>

        <h2 id="methode">La méthode en 4 étapes</h2>

        <div className="step-card">
          <div className="step-number">01</div>
          <h3>Définissez votre revenu net cible</h3>
          <p>
            Commencez par ce que vous voulez réellement gagner chaque mois, <strong>net dans votre poche</strong>, après
            toutes les charges. C&apos;est votre salaire de freelance. Soyez réaliste mais ne vous sous-estimez pas. Si
            vous êtes développeur senior avec 8 ans d&apos;expérience, ne visez pas un revenu de junior.
          </p>
          <p>
            Prenez en compte votre situation personnelle : vos charges fixes (loyer, crédit, famille), votre train de
            vie actuel, et votre épargne souhaitée. Un bon point de départ : prenez votre ancien salaire net et ajoutez
            20 % (parce que vous n&apos;avez plus de congés payés, de mutuelle d&apos;entreprise, etc.).
          </p>
          <div className="calc-block">
            <strong>Exemple :</strong> Salaire net souhaité = 3 500 €/mois → <strong>42 000 €/an</strong>
          </div>
        </div>

        <div className="step-card">
          <div className="step-number">02</div>
          <h3>Calculez vos charges totales</h3>
          <p>
            En tant que freelance, vous payez des charges que votre ancien employeur couvrait pour vous. Le montant
            varie selon votre statut juridique.
          </p>
          <p>
            En <strong>micro-entreprise</strong>, les charges sociales représentent environ <strong>22 à 23 %</strong> de votre
            chiffre d&apos;affaires pour les prestations de service (BNC).
          </p>
          <p>
            En <strong>EURL/SASU</strong>, les charges sont plus élevées (environ 40-50 % du résultat) mais vous pouvez
            déduire vos frais et optimiser votre rémunération.
          </p>
          <div className="calc-block">
            <strong>Exemple (micro-entreprise) :</strong>
            <br />
            Revenu net cible : 42 000 €/an
            <br />
            Charges sociales (~23 %) : il faut facturer environ <strong>54 500 €/an</strong> pour obtenir 42 000 € net
            <br />
            <span className="calc-result">CA nécessaire ≈ 54 500 €/an</span>
          </div>
        </div>

        <div className="step-card">
          <div className="step-number">03</div>
          <h3>Ajoutez vos frais professionnels</h3>
          <p>
            Même en micro-entreprise (où vous ne déduisez pas les frais), vous les payez quand même. Il faut les
            intégrer dans votre calcul.
          </p>
          <div className="calc-block">
            <strong>Exemple :</strong>
            <br />
            Frais mensuels estimés : 400 €/mois → <strong>4 800 €/an</strong>
            <br />
            <span className="calc-result">CA nécessaire = 54 500 + 4 800 = 59 300 €/an</span>
          </div>
        </div>

        <div className="step-card">
          <div className="step-number">04</div>
          <h3>Comptez vos jours réellement facturés</h3>
          <p>
            C&apos;est l&apos;étape que tout le monde sous-estime. Vous ne facturez <strong>pas</strong> 220 jours par an.
            Un taux d&apos;occupation réaliste est de 75 à 85 %, ce qui donne environ <strong>140 à 160 jours facturés</strong>{' '}
            par an.
          </p>
          <div className="calc-block">
            <strong>Exemple :</strong>
            <br />
            Jours facturés estimés : 150 jours/an
            <br />
            TJM = 59 300 € ÷ 150 jours
            <br />
            <span className="calc-result">TJM = 395 €/jour</span>
          </div>
        </div>

        <p>
          Dans cet exemple, pour gagner l&apos;équivalent de 3 500 € net/mois en micro-entreprise, il faut facturer{' '}
          <strong>environ 400 €/jour</strong>.
        </p>

        <h2 id="simulateur">Simulateur de TJM</h2>

        <p>Utilisez ce simulateur pour calculer votre TJM en fonction de votre situation.</p>

        <div className="simulator">
          <div className="simulator-title">⚡ Simulateur de TJM freelance</div>
          <div className="simulator-desc">Renseignez vos informations pour obtenir votre TJM recommandé.</div>

          <div className="sim-row">
            <label htmlFor="salary">Revenu net mensuel souhaité (€)</label>
            <input type="number" id="salary" placeholder="3 500" defaultValue={3500} />
          </div>
          <div className="sim-row">
            <label htmlFor="status">Statut juridique</label>
            <select id="status" defaultValue="micro">
              <option value="micro">Micro-entreprise (~23 %)</option>
              <option value="eurl">EURL / SASU (~45 %)</option>
            </select>
          </div>
          <div className="sim-row">
            <label htmlFor="frais">Frais professionnels mensuels (€)</label>
            <input type="number" id="frais" placeholder="400" defaultValue={400} />
          </div>
          <div className="sim-row">
            <label htmlFor="jours">Jours facturés par an</label>
            <input type="number" id="jours" placeholder="150" defaultValue={150} />
          </div>

          <div className="sim-result">
            <div className="sim-result-label">Votre TJM recommandé</div>
            <div className="sim-result-value" id="tjm-result">—</div>
            <div className="sim-result-detail" id="tjm-detail">—</div>
          </div>
        </div>

        <h2 id="reperes">Fourchettes de TJM par métier en 2026</h2>

        <p>
          Pour vous situer, voici les fourchettes courantes du marché français. Ces chiffres varient selon
          l&apos;expérience, la spécialisation et la localisation.
        </p>

        <table className="comparison-table">
          <thead>
            <tr>
              <th>Métier</th>
              <th>Junior (0-2 ans)</th>
              <th>Confirmé (3-5 ans)</th>
              <th>Senior (6+ ans)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Développeur web</strong>
              </td>
              <td>250 — 350 €</td>
              <td>350 — 500 €</td>
              <td className="highlight-cell">500 — 700 €</td>
            </tr>
            <tr>
              <td>
                <strong>Designer UI/UX</strong>
              </td>
              <td>250 — 350 €</td>
              <td>350 — 450 €</td>
              <td className="highlight-cell">450 — 600 €</td>
            </tr>
            <tr>
              <td>
                <strong>Consultant marketing</strong>
              </td>
              <td>250 — 350 €</td>
              <td>350 — 500 €</td>
              <td className="highlight-cell">500 — 700 €</td>
            </tr>
            <tr>
              <td>
                <strong>Rédacteur / copywriter</strong>
              </td>
              <td>200 — 300 €</td>
              <td>300 — 400 €</td>
              <td className="highlight-cell">400 — 550 €</td>
            </tr>
            <tr>
              <td>
                <strong>Chef de projet</strong>
              </td>
              <td>300 — 400 €</td>
              <td>400 — 550 €</td>
              <td className="highlight-cell">550 — 750 €</td>
            </tr>
            <tr>
              <td>
                <strong>Data / DevOps</strong>
              </td>
              <td>350 — 450 €</td>
              <td>450 — 600 €</td>
              <td className="highlight-cell">600 — 900 €</td>
            </tr>
          </tbody>
        </table>

        <div className="info-box">
          <p>
            <strong>Important :</strong> Ces fourchettes sont indicatives. Votre TJM réel dépend de votre valeur perçue.
          </p>
        </div>

        <h2 id="erreurs">Les 5 erreurs qui coûtent cher</h2>

        <ol>
          <li>
            <strong>Diviser son salaire par 20 jours.</strong> Cela oublie les charges, les frais et les jours non
            facturés.
          </li>
          <li>
            <strong>Ignorer les jours non facturés.</strong> Prospection, admin, formation, maladie, inter-contrats…
          </li>
          <li>
            <strong>Se baser uniquement sur la concurrence.</strong> Partez de vos charges réelles.
          </li>
          <li>
            <strong>Ne pas réévaluer chaque année.</strong> Réévaluez au minimum une fois par an.
          </li>
          <li>
            <strong>Appliquer le même TJM à tout.</strong> Mission longue, urgence, forfait… justifient des tarifs
            différents.
          </li>
        </ol>

        <h2 id="negocier">Négocier et ajuster son TJM</h2>

        <h3>Quand baisser son TJM</h3>
        <p>
          Une baisse de tarif peut se justifier pour une mission longue durée, un client récurrent, ou une période
          creuse. Ne descendez <strong>jamais</strong> en dessous de votre seuil de rentabilité.
        </p>

        <h3>Quand augmenter son TJM</h3>
        <p>
          Augmentez quand : vous avez plus de demandes que de disponibilité, vous avez gagné en expertise, ou quand
          cela fait plus d&apos;un an que vous n&apos;avez pas réévalué.
        </p>

        <h3>Comment annoncer son TJM</h3>
        <p>
          Annoncez votre TJM avec confiance. Si le client négocie, ajustez le périmètre plutôt que le prix.
        </p>

        <div className="info-box">
          <p>
            <strong>Astuce Spyke :</strong> Quand vous créez un <a href="/devis-freelance">devis sur Spyke</a>, vos prestations
            sont détaillées par ligne avec prix unitaire.
          </p>
        </div>

        <div className="cta-inline">
          <h3>⚡ Créez des devis à la hauteur de votre TJM</h3>
          <p>Devis, contrats et factures professionnels. Gratuit pour commencer.</p>
          <a href="/connexion.html" className="cta-btn">Essayer Spyke gratuitement →</a>
        </div>
      </article>

      <section className="related">
        <h2>Pour aller plus loin</h2>
        <div className="related-grid">
          <a href="/devis-freelance" className="related-card">
            <div className="related-card-tag">Devis</div>
            <h3>Générer un devis freelance (gratuit)</h3>
            <p>Mentions obligatoires + PDF pro en 2 minutes.</p>
          </a>
          <a href="/facture-auto-entrepreneur" className="related-card">
            <div className="related-card-tag">Factures</div>
            <h3>Générer une facture conforme (gratuit)</h3>
            <p>Facture auto-entrepreneur en PDF, mentions obligatoires incluses.</p>
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-links">
            <a href="/">Accueil</a>
            <a href="/fonctionnalites.html">Fonctionnalités</a>
            <a href="/blog">Blog</a>
            <a href="/#pricing">Tarifs</a>
            <a href="/devis-freelance">Devis gratuit</a>
            <a href="/facture-auto-entrepreneur">Facture gratuite</a>
            <a href="/contrat-freelance">Contrat gratuit</a>
            <a href="/mentions-legales.html">Mentions légales</a>
            <a href="/confidentialite.html">Confidentialité</a>
          </div>
          <p className="footer-copy">Spyke © 2026 — L&apos;assistant IA des freelances français</p>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Calculer son TJM Freelance : la Méthode Pas à Pas',
            description: 'Comment calculer son TJM freelance en 2026. Méthode complète avec simulateur intégré.',
            datePublished: '2026-02-16',
            dateModified: '2026-02-16',
            author: { '@type': 'Organization', name: 'Spyke' },
            publisher: { '@type': 'Organization', name: 'Spyke', url: 'https://www.spykeapp.fr' },
            mainEntityOfPage: 'https://www.spykeapp.fr/blog/calculer-tjm-freelance',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: "C'est quoi le TJM d'un freelance ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Le TJM (Taux Journalier Moyen) est le prix facturé par un freelance pour une journée de travail. Il inclut le salaire souhaité, les charges, les frais professionnels et une marge pour les jours non facturés.",
                },
              },
              {
                '@type': 'Question',
                name: "Quel est le TJM moyen d'un freelance en France ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    'Le TJM moyen varie fortement selon le métier et l\'expérience. En 2026, les fourchettes courantes sont : développeur web 350-600 €, designer UI/UX 300-550 €, consultant marketing 350-500 €, rédacteur 200-400 €. Les profils seniors ou très spécialisés dépassent facilement ces fourchettes.',
                },
              },
              {
                '@type': 'Question',
                name: "Comment passer d'un salaire brut à un TJM freelance ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Prenez votre salaire brut annuel, ajoutez environ 30-50% pour couvrir les charges, les congés et les frais professionnels, puis divisez par le nombre de jours facturés dans l'année (environ 130-180 jours). Un salarié à 40 000 € brut devrait viser un TJM de 350-400 € minimum.",
                },
              },
            ],
          }),
        }}
      />

      <script
        defer
        dangerouslySetInnerHTML={{
          __html: `
            function calculateTJM() {
              var salaryEl = document.getElementById('salary');
              var statusEl = document.getElementById('status');
              var fraisEl = document.getElementById('frais');
              var joursEl = document.getElementById('jours');
              if (!salaryEl || !statusEl || !fraisEl || !joursEl) return;

              var salary = parseFloat(salaryEl.value) || 0;
              var status = statusEl.value;
              var frais = parseFloat(fraisEl.value) || 0;
              var jours = parseFloat(joursEl.value) || 1;

              var annualNet = salary * 12;
              var chargeRate = status === 'micro' ? 0.23 : 0.45;
              var caBeforeFrais = annualNet / (1 - chargeRate);
              var annualFrais = frais * 12;
              var totalCA = caBeforeFrais + annualFrais;

              var tjm = Math.round(totalCA / jours);

              var res = document.getElementById('tjm-result');
              var det = document.getElementById('tjm-detail');
              if (res) res.textContent = tjm.toLocaleString('fr-FR') + ' €';
              if (det) {
                det.textContent =
                  'CA annuel nécessaire : ' + Math.round(totalCA).toLocaleString('fr-FR') + ' € · ' + jours + ' jours facturés';
              }
            }

            function initTjmSimulator() {
              var salaryEl = document.getElementById('salary');
              var statusEl = document.getElementById('status');
              var fraisEl = document.getElementById('frais');
              var joursEl = document.getElementById('jours');

              if (salaryEl) salaryEl.addEventListener('input', calculateTJM);
              if (statusEl) statusEl.addEventListener('change', calculateTJM);
              if (fraisEl) fraisEl.addEventListener('input', calculateTJM);
              if (joursEl) joursEl.addEventListener('input', calculateTJM);

              calculateTJM();
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initTjmSimulator);
            } else {
              initTjmSimulator();
            }
          `,
        }}
      />
    </>
  )
}
