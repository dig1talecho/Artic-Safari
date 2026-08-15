import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check, ArrowLeft, Clock, MapPin } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { getTours, getTourBySlug } from '@/services/tours.service'
import { FALLBACK_TOURS, getFallbackTourBySlug } from '@/lib/tours-fallback'

// Keeps admin edits (price, description, publish/unpublish) showing up
// within 30s instead of only after the next deploy -- see the same note
// on app/tours/page.tsx.
export const revalidate = 30

export async function generateStaticParams() {
  const { data } = await getTours()
  const liveSlugs = new Set((data ?? []).map((tour) => tour.slug))
  const fallbackSlugs = FALLBACK_TOURS.map((tour) => tour.slug)
  return [...new Set([...fallbackSlugs, ...liveSlugs])].map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await getTourBySlug(slug)
  const tour = data ?? getFallbackTourBySlug(slug)
  if (!tour) return {}

  return {
    title: tour.meta_title || tour.title,
    description: tour.meta_description || tour.intro,
    openGraph: {
      title: tour.meta_title || tour.title,
      description: tour.meta_description || tour.intro,
      images: tour.cover_image ? [{ url: tour.cover_image }] : undefined,
    },
  }
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data } = await getTourBySlug(slug)
  const tour = data ?? getFallbackTourBySlug(slug)
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
            {tour.cover_image ? (
              <Image
                src={tour.cover_image}
                alt={tour.cover_image_alt || tour.title}
                width={900}
                height={700}
                className="h-[280px] w-full object-cover sm:h-[380px]"
                priority
              />
            ) : (
              <div className="h-[280px] w-full bg-[var(--home-surface-soft)] sm:h-[380px]" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
              {tour.eyebrow}
            </p>
            <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--home-foreground)] sm:text-4xl">
              {tour.title}
            </h1>
            <p className="mt-5 text-pretty leading-relaxed text-[var(--home-muted)]">{tour.intro}</p>

            {(tour.duration || tour.meeting_point) && (
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--home-muted)]">
                {tour.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[var(--home-accent)]" />
                    {tour.duration}
                  </span>
                )}
                {tour.meeting_point && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[var(--home-accent)]" />
                    {tour.meeting_point}
                  </span>
                )}
              </div>
            )}

            <div className="mt-6 flex items-baseline gap-3 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-5 py-4">
              <span className="font-mono text-2xl font-semibold text-[var(--home-foreground)]">
                {tour.price}
              </span>
              <span className="text-sm text-[var(--home-muted)]">{tour.price_note}</span>
            </div>

            {tour.features.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {tour.features.map((feature: string) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-[var(--home-muted)]">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--home-accent-soft)] text-[var(--home-accent)]">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/#tours"
              className="group mt-8 inline-flex items-center gap-2 rounded-[10px] bg-[image:var(--home-gradient-cta)] px-7 py-3.5 text-sm font-semibold text-[var(--home-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-10px_rgba(51,187,207,0.5)] active:translate-y-0 active:scale-[0.98]"
            >
              Book This Tour
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {tour.highlights.length > 0 && (
          <div className="mt-14 border-t border-[var(--home-border)] pt-10">
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--home-foreground)]">
              Route Highlights
            </h2>
            <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tour.highlights.map((stop: string, i: number) => (
                <li key={stop} className="flex items-center gap-3 text-sm text-[var(--home-muted)]">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--home-accent-soft)] font-mono text-xs text-[var(--home-accent)]">
                    {i + 1}
                  </span>
                  {stop}
                </li>
              ))}
            </ol>
          </div>
        )}

        {tour.gallery.length > 0 && (
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tour.gallery.map((url: string) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-2xl">
                <Image src={url} alt={tour.title} fill className="object-cover" sizes="240px" />
              </div>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  )
}
