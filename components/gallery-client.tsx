'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { GalleryLightbox } from '@/components/gallery-lightbox'
import type { GalleryPhotoWithTour } from '@/services/gallery.service'

const UNGROUPED_LABEL = 'More from our guests'

function sectionAnchor(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function GalleryClient({ photos }: { photos: GalleryPhotoWithTour[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const sections = useMemo(() => {
    const map = new Map<string, { title: string; photos: GalleryPhotoWithTour[] }>()
    for (const photo of photos) {
      const key = photo.tour?.id ?? 'ungrouped'
      const title = photo.tour?.title ?? UNGROUPED_LABEL
      if (!map.has(key)) map.set(key, { title, photos: [] })
      map.get(key)!.photos.push(photo)
    }
    const entries = Array.from(map.entries())
    entries.sort((a, b) => (a[0] === 'ungrouped' ? 1 : b[0] === 'ungrouped' ? -1 : 0))
    return entries.map(([, section]) => section)
  }, [photos])

  return (
    <>
      {sections.length > 1 && (
        <nav className="mt-8 flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.title}
              href={`#${sectionAnchor(section.title)}`}
              className="rounded-full border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-3.5 py-1.5 text-xs font-medium text-[var(--home-muted)] transition-colors hover:border-[var(--home-accent)]/40 hover:text-[var(--home-foreground)]"
            >
              {section.title}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-10 space-y-14">
        {sections.map((section) => (
          <div key={section.title} id={sectionAnchor(section.title)} className="scroll-mt-24">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--home-foreground)]">
              {section.title}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {section.photos.map((photo) => {
                const globalIndex = photos.findIndex((p) => p.id === photo.id)
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setLightboxIndex(globalIndex)}
                    className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-inset ring-black/10 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <Image
                      src={photo.public_url}
                      alt={photo.caption || `Photo from ${section.title}`}
                      fill
                      loading="lazy"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(min-width: 1024px) 25vw, 50vw"
                    />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}
