import Link from 'next/link'

function ArrowRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h12" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white px-8 py-10 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center text-xl">
        {icon}
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight text-black">{title}</h3>
      <p className="mt-4 text-lg leading-relaxed text-black/60">{desc}</p>
    </div>
  )
}

function Step({
  n,
  title,
  desc,
}: {
  n: number
  title: string
  desc: string
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-white text-xl font-semibold">
        {n}
      </div>
      <h3 className="mt-6 text-3xl font-semibold tracking-tight text-black">{title}</h3>
      <p className="mt-4 text-lg leading-relaxed text-black/60">{desc}</p>
    </div>
  )
}

export default function Home() {
  return (
    <main className="bg-white text-black">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <span className="text-2xl font-semibold tracking-tight">Spyke</span>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-black px-7 py-3 text-sm font-medium text-white shadow-sm hover:bg-black/90"
          >
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-black/[0.04] px-5 py-3 text-sm text-black/70">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Nouveau : Analyse de briefs avec IA</span>
          </div>

          <h1 className="mt-10 text-balance text-5xl sm:text-6xl font-semibold leading-[1.02] tracking-tight">
            L&apos;admin en moins.
            <br />
            Le freelance en plus.
          </h1>

          <p className="mt-8 text-pretty text-xl leading-relaxed text-black/60">
            Spyke génère vos emails, devis et analyses de briefs en quelques secondes.
            Concentrez-vous sur ce qui compte vraiment.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full bg-black px-10 py-4 text-base font-medium text-white hover:bg-black/90"
            >
              Commencer gratuitement <ArrowRight />
            </Link>
            <a
              href="#features"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-black/10 bg-white px-10 py-4 text-base font-medium text-black/80 hover:bg-black/[0.02]"
            >
              En savoir plus
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-tight">Tout ce dont vous avez besoin</h2>
          <p className="mt-6 text-xl leading-relaxed text-black/60">
            Les outils essentiels pour gérer votre activité freelance, propulsés par l&apos;intelligence
            artificielle.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <FeatureCard
            icon={<span aria-hidden>✉️</span>}
            title="Emails intelligents"
            desc="Réponses, relances, négociations. L’IA génère des emails professionnels adaptés à chaque situation en quelques secondes."
          />
          <FeatureCard
            icon={<span aria-hidden>📄</span>}
            title="Devis professionnels"
            desc="Créez des devis impeccables en PDF. Calculs automatiques, templates personnalisables, suivi des statuts."
          />
          <FeatureCard
            icon={<span aria-hidden>🔎</span>}
            title="Analyse de briefs"
            desc="L’IA analyse les briefs clients et vous dit si vous devez accepter, négocier ou refuser. Score de clarté inclus."
          />
          <FeatureCard
            icon={<span aria-hidden>👥</span>}
            title="Gestion clients"
            desc="Suivez vos clients, leur historique, leur CA généré et leur taux de conversion. Tout au même endroit."
          />
          <FeatureCard
            icon={<span aria-hidden>🔔</span>}
            title="Relances automatiques"
            desc="Ne perdez plus de devis. Spyke vous rappelle quand relancer et génère l’email de relance parfait."
          />
          <FeatureCard
            icon={<span aria-hidden>📊</span>}
            title="Dashboard analytics"
            desc="CA mensuel, taux de conversion, meilleur client. Visualisez votre performance en un coup d’œil."
          />
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-tight">Simple comme bonjour</h2>
          <p className="mt-6 text-xl leading-relaxed text-black/60">
            Trois étapes pour transformer votre quotidien de freelance.
          </p>
        </div>

        <div className="mt-16 grid gap-14 md:grid-cols-3">
          <Step n={1} title="Créez votre compte" desc="Inscription gratuite en 30 secondes. Aucune carte bancaire requise." />
          <Step
            n={2}
            title="Configurez votre profil"
            desc="Ajoutez vos informations pour des devis et emails personnalisés."
          />
          <Step
            n={3}
            title="Laissez l&apos;IA travailler"
            desc="Générez emails, devis et analyses en un clic. Gagnez des heures chaque semaine."
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-tight">Un prix simple</h2>
          <p className="mt-6 text-xl leading-relaxed text-black/60">Pas de surprise. Pas d&apos;engagement.</p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <div className="rounded-[32px] border border-black/10 bg-white p-10">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.2em] text-black/50">GRATUIT</p>
              <div className="mt-6 text-7xl font-semibold tracking-tight">0€</div>
              <p className="mt-3 text-lg text-black/60">Pour découvrir Spyke</p>
            </div>

            <ul className="mt-10 space-y-5 text-lg text-black/70">
              <li className="flex items-center gap-3">
                <span className="text-black"><Check /></span>
                <span>10 générations IA / mois</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-black"><Check /></span>
                <span>3 clients max</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-black"><Check /></span>
                <span>Devis PDF basiques</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-black"><Check /></span>
                <span>Dashboard limité</span>
              </li>
            </ul>

            <div className="mt-10">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-black px-10 py-4 text-base font-medium text-white hover:bg-black/90"
              >
                Commencer gratuitement <ArrowRight />
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] bg-black p-10 text-white">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.2em] text-white/60">PRO</p>
              <div className="mt-6 text-7xl font-semibold tracking-tight">
                19€<span className="text-2xl font-medium text-white/70">/mois</span>
              </div>
              <p className="mt-3 text-lg text-white/70">Pour les freelances sérieux</p>
            </div>

            <ul className="mt-10 space-y-5 text-lg text-white/80">
              <li className="flex items-center gap-3">
                <span className="text-white"><Check /></span>
                <span>Générations IA illimitées</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-white"><Check /></span>
                <span>Clients illimités</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-white"><Check /></span>
                <span>Devis PDF personnalisés</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-white"><Check /></span>
                <span>Relances automatiques</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-white"><Check /></span>
                <span>Analytics complets</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-white"><Check /></span>
                <span>Support prioritaire</span>
              </li>
            </ul>

            <div className="mt-10">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-10 py-4 text-base font-medium text-black hover:bg-white/90"
              >
                Essai gratuit 14 jours <ArrowRight />
              </Link>
              <p className="mt-4 text-center text-sm text-white/50">
                Le paiement n&apos;est pas encore activé (v1). Pour l&apos;instant, l&apos;accès passe par l&apos;auth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-8 bg-black">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center text-white">
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-tight">Prêt à gagner du temps ?</h2>
          <p className="mt-6 text-xl leading-relaxed text-white/70">
            Rejoignez les freelances qui ont automatisé leur admin.
          </p>
          <div className="mt-10">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-12 py-4 text-base font-medium text-black hover:bg-white/90"
            >
              Commencer gratuitement <ArrowRight />
            </Link>
          </div>
          <p className="mt-14 text-sm text-white/40">Spyke © 2025 – Votre assistant freelance intelligent</p>
        </div>
      </section>

      {/* Tiny link for owners */}
      <div className="sr-only">
        <Link href="/app">Aller à l&apos;app</Link>
      </div>
    </main>
  )
}
