import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="home-theme flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--home-bg)] px-5 text-center text-[var(--home-foreground)]">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] text-[var(--home-accent)]">
        <Compass className="h-6 w-6" />
      </span>
      <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight">Page not found</h1>
      <p className="max-w-md text-sm text-[var(--home-muted)]">
        This page doesn't exist, or the tour/guide you're looking for may have been unpublished.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-[var(--home-accent)] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
      >
        Back to Homepage
      </Link>
    </main>
  )
}
