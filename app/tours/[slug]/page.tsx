import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check, ArrowLeft } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { tours, getTourBySlug } from '@/lib/tours-data'

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tour = getTourBySlug(slug)
  if (!tour) return {}

  return {
    title: tour.metaTitle,
    description: tour.metaDescription,
    openGraph: {
      title: tour.metaTitle,
      description: tour.metaDescription,
      images: [{ url: tour.image }],
    },
  }
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tour = getTourBySlug(slug)
  if (!tour) notFound()

  return (
    <SiteShell>
      <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-10 sm:pt-16">
        <Link
          href="/tours"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--home-muted)] transition-colors hover:text-[var(--home-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          All Tours &amp; Transfers
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div className="overflow-hidden rounded-[1.75rem] ring-1 ring-inset ring-black/10">
            <Image
              src={tour.image}
              alt={tour.imageAlt}
              width={900}
              height={700}
              className="h-[280px] w-full object-cover sm:h-[380px]"
              priority
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
              {tour.eyebrow}
            </p>
            <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl uppercase leading-[1.05] tracking-tight text-[var(--home-foreground)] sm:text-4xl">
              {tour.title}
            </h1>
            <p className="mt-5 text-pretty leading-relaxed text-[var(--home-muted)]">{tour.intro}</p>

            <div className="mt-6 flex items-baseline gap-3 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-5 py-4">
              <span className="font-mono text-2xl font-semibold text-[var(--home-foreground)]">
                {tour.price}
              </span>
              <span className="text-sm text-[var(--home-muted)]">{tour.priceNote}</span>
            </div>

            <ul className="mt-6 space-y-2.5">
              {tour.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-[var(--home-muted)]">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--home-accent-soft)] text-[var(--home-accent)]">
                    <Check className="h-3 w-3" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/#tours"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--home-accent)] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_6px_0_0_#0876a8] transition-[opacity,scale,box-shadow] hover:opacity-90 active:translate-y-1 active:scale-[0.98] active:shadow-[0_2px_0_0_#0876a8]"
            >
              Book This Tour
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
