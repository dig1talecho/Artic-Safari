import type { Metadata } from 'next'
import { SiteShell } from '@/components/site-shell'
import { GalleryClient } from '@/components/gallery-client'
import { listGalleryPhotosWithTours, type GalleryPhotoWithTour } from '@/services/gallery.service'

export const metadata: Metadata = {
  title: 'Photo Gallery | Artic Safari',
  description:
    'Real photos shared by Artic Safari guests, browsable by tour -- Northern Lights chases, the Sommarøy scenic drive, and VIP transfers around Tromsø.',
}

// Keeps newly-uploaded admin photos showing up here within 30s instead of
// only after the next deploy -- same reasoning as /tours.
export const revalidate = 30

export default async function GalleryPage() {
  const { data } = await listGalleryPhotosWithTours()
  const photos = (data ?? []) as unknown as GalleryPhotoWithTour[]

  return (
    <SiteShell>
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-10 sm:pt-16">
        <div className="max-w-2xl border-b border-[var(--home-border)] pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">Gallery</p>
          <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--home-foreground)] sm:text-5xl">
            Through our guests&apos; eyes
          </h1>
          <p className="mt-5 max-w-xl text-pretty leading-relaxed text-[var(--home-muted)]">
            Real photos shared by real guests, organized by the experience they were taken on. Click any
            photo for details and to browse the rest.
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="mt-14 rounded-2xl border border-dashed border-[var(--home-border)] py-20 text-center text-[var(--home-muted)]">
            No photos yet -- check back soon.
          </div>
        ) : (
          <GalleryClient photos={photos} />
        )}
      </section>
    </SiteShell>
  )
}
