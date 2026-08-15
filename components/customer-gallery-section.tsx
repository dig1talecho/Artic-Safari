import Image from 'next/image'
import { Camera } from 'lucide-react'
import { listGalleryPhotosForHomepage } from '@/services/gallery.service'

export async function CustomerGallerySection() {
  const { data, error } = await listGalleryPhotosForHomepage(8)

  const photos = error ? [] : (data ?? [])

  // Honest empty state: nothing is shown until the business has uploaded real photos.
  if (photos.length === 0) return null

  return (
    <section id="gallery" className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-5 pb-20">
      <div
        className="rounded-[28px] border border-[var(--home-glass-border)] bg-[var(--home-glass)] p-6 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8"
      >
        <div className="mb-8 max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
            <Camera className="h-4 w-4" />
            From Our Guests
          </p>
          <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] tracking-tight text-[var(--home-foreground)] sm:text-4xl">
            Through their eyes
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-inset ring-black/10"
            >
              <Image
                src={photo.public_url}
                alt={photo.caption || 'Photo shared by an Artic Safari guest'}
                fill
                loading="lazy"
                className="object-cover"
                sizes="(min-width: 640px) 25vw, 50vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
