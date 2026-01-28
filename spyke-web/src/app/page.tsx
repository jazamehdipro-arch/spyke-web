import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-white/60">Spyke</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Assistant IA pour freelances</h1>
        <p className="mt-4 text-white/70">
          Gagne du temps sur les emails, les devis et l’analyse de briefs.
        </p>

        <div className="mt-8 flex gap-3">
          <Link className="rounded-md bg-white/10 border border-white/20 px-4 py-2 text-sm" href="/login">
            Créer un compte / Se connecter
          </Link>
          <Link className="rounded-md bg-white/5 border border-white/10 px-4 py-2 text-sm" href="/app">
            Ouvrir l’outil
          </Link>
        </div>

        <p className="mt-10 text-xs text-white/50">
          V1 technique: landing + login Supabase + page app (Spyke HTML embarqué). Stripe + paywall ensuite.
        </p>
      </div>
    </main>
  )
}
