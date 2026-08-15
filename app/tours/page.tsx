import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clock, Users } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { getTours } from '@/services/tours.service'
import { mergeWithFallback } from '@/lib/tours-fallback'

export const metadata: Metadata = {
  title: 'Tours & Transfers Tromsø | Artic Safari',
  description:
    'Private Northern Lights tours and VIP airport transfers in Tromsø, Norway. Compare all Artic Safari tour and transfer options and prices.',
}

export default async function ToursIndexPage() {
  const { data } = await getTours()
  const tours = mergeWithFallback(data ?? [])

  const prices = tours.map((tour) => parseInt(tour.price.replace(/[^\d]/g, ''), 10)).filter((n) => !Number.isNaN(n))
  const startingPrice = prices.length > 0 ? Math.min(...prices) : null

  return (
    <SiteShell>
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-10 sm:pt-16">
        <div className="flex flex-col items-start justify-between gap-8 border-b border-[var(--home-border)] pb-10 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
              All Experiences
            </p>
            <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--home-foreground)] sm:text-5xl">
              Tours &amp; Transfers in Tromsø
            </h1>
            <p className="mt-5 max-w-xl text-pretty leading-relaxed text-[var(--home-muted)]">
              Private, chauffeured, and endlessly flexible. Browse every Artic Safari experience and
              find the one that fits your trip.
            </p>
          </div>

          <div className="flex shrink-0 gap-8">
            <div>
              <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--home-foreground)]">
                {tours.length}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--home-muted)]">
                Experiences
              </p>
            </div>
            {startingPrice !== null && (
              <div>
                <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--home-foreground)]">
                  {startingPrice.toLocaleString('en-US')} kr
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--home-muted)]">
                  Starting From
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <Link
              key={tour.slug}
              href={`/tours/${tour.slug}`}
              className="group flex flex-col overflow-hidden rounded-[20px] border border-white/5 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.3)] transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-[var(--home-accent)]/40 hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.5),0_0_40px_-18px_rgba(51,187,207,0.35)]"
              style={{ backgroundImage: 'var(--home-gradient-card)' }}
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={tour.cover_image || '/aurora-hero.webp'}
                  alt={tour.cover_image_alt || tour.title}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                  {tour.eyebrow}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--home-foreground)]">
                  {tour.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--home-muted)]">{tour.intro}</p>

                {(tour.duration || tour.price_note) && (
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--home-muted)]">
                    {tour.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[var(--home-accent)]" />
                        {tour.duration}
                      </span>
                    )}
                    {tour.price_note && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[var(--home-accent)]" />
                        {tour.price_note}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-[var(--home-border)] pt-4">
                  <span className="font-mono text-lg font-semibold text-[var(--home-foreground)]">
                    {tour.price}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--home-accent)]">
                    Details
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
