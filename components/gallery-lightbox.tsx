'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Calendar, Compass } from 'lucide-react'
import type { GalleryPhotoWithTour } from '@/services/gallery.service'

interface GalleryLightboxProps {
  photos: GalleryPhotoWithTour[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function GalleryLightbox({ photos, index, onClose, onNavigate }: GalleryLightboxProps) {
  const photo = photos[index]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') onNavigate((index + 1) % photos.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, photos.length, onClose, onNavigate])

  if (!photo) return null

  const uploadedDate = new Date(photo.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-6 w-6" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((index - 1 + photos.length) % photos.length)
            }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:left-4"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((index + 1) % photos.length)
            }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:right-4"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      <div
        className="flex max-h-full w-full max-w-4xl flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-[70vh] w-full overflow-hidden rounded-2xl bg-black">
          <Image
            src={photo.public_url}
            alt={photo.caption || 'Gallery photo'}
            width={1400}
            height={1050}
            className="max-h-[70vh] w-full object-contain"
            priority
          />
        </div>
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-xl">
          {photo.caption && <p className="text-sm text-white">{photo.caption}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {uploadedDate}
            </span>
            {photo.tour && (
              <span className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                {photo.tour.title}
              </span>
            )}
            <span className="text-white/40">
              {index + 1} / {photos.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
