import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { tours } from '@/lib/tours-data'

export const metadata: Metadata = {
  title: 'Tours & Transfers Tromsø | Artic Safari',
  description:
    'Private Northern Lights tours and VIP airport transfers in Tromsø, Norway. Compare all Artic Safari tour and transfer options and prices.',
}

const startingPrice = Math.min(
  ...tours.map((tour) => parseInt(tour.price.replace(/[^\d]/g, ''), 10)),
)

export default function ToursIndexPage() {
  return (
    <SiteShell>
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-10 sm:pt-16">
        <div className="flex flex-col items-start justify-between gap-8 border-b border-[var(--home-border)] pb-10 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
              All Experiences
            </p>
            <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl uppercase leading-[1.05] tracking-tight text-[var(--home-foreground)] sm:text-5xl">
              Tours &amp; Transfers in Tromsø
            </h1>
            <p className="mt-5 max-w-xl text-pretty leading-relaxed text-[var(--home-muted)]">
              Private, chauffeured, and endlessly flexible. Browse every Artic Safari experience and
              find the one that fits your trip.
            </p>
          </div>

          <div className="flex shrink-0 gap-8">
            <div>
              <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--home-foreground)]">
                {tours.length}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--home-muted)]">
                Experiences
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--home-foreground)]">
                {startingPrice.toLocaleString('en-US')} kr
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--home-muted)]">
                Starting From
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <Link
              key={tour.slug}
              href={`/tours/${tour.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] shadow-[0_2px_24px_-8px_rgba(11,31,42,0.08)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--home-accent)]/40 hover:shadow-[0_16px_40px_-12px_rgba(11,31,42,0.16)]"
            >
              <div className="flex flex-1 flex-col p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--home-muted)]">
                  {tour.eyebrow}
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl leading-tight text-[var(--home-foreground)]">
                  {tour.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--home-muted)]">
                  {tour.intro}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--home-border)] pt-4">
                  <span className="font-mono text-lg font-semibold text-[var(--home-foreground)]">
                    {tour.price}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-[var(--home-accent)]">
                    Details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
