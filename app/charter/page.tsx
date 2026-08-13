import type { Metadata } from 'next'
import { SiteShell } from '@/components/site-shell'
import { CharterForm } from '@/components/charter-form'

export const metadata: Metadata = {
  title: 'VIP Private Charter | Artic Safari',
  description:
    'Request a private VIP vehicle charter in Tromsø, Norway. Choose your vehicle and passenger count for an instant estimated quote.',
}

export default function CharterPage() {
  return (
    <SiteShell>
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:pt-16">
        <div className="max-w-2xl border-b border-[var(--home-border)] pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
            VIP Charter
          </p>
          <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl uppercase leading-[1.05] tracking-tight text-[var(--home-foreground)] sm:text-5xl">
            Private Vehicle Charter
          </h1>
          <p className="mt-5 max-w-xl text-pretty leading-relaxed text-[var(--home-muted)]">
            Book a private vehicle for a day, an airport run, or a custom itinerary — configure your
            trip below for an instant estimated price.
          </p>
        </div>

        <div className="mt-12">
          <CharterForm />
        </div>
      </section>
    </SiteShell>
  )
}
