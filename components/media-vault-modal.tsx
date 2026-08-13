'use client'

import { useEffect, useState } from 'react'
import { X, Download, ImageOff, ZoomIn } from 'lucide-react'
import {
  listMediaForBooking,
  getSignedMediaUrl,
  downloadBookingMediaAsZip,
  type BookingMedia,
} from '@/services/media-vault.service'
import { Skeleton } from '@/components/ui/skeleton'

interface MediaItem extends BookingMedia {
  signedUrl: string | null
}

export function MediaVaultModal({
  bookingId,
  bookingTitle,
  onClose,
}: {
  bookingId: string
  bookingTitle: string
  onClose: () => void
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const { data, error: listError } = await listMediaForBooking(bookingId)
      if (!active) return

      if (listError || !data) {
        setError(true)
        setLoading(false)
        return
      }

      const withUrls = await Promise.all(
        data.map(async (media) => {
          const { url } = await getSignedMediaUrl(media.storage_path)
          return { ...media, signedUrl: url }
        }),
      )

      if (!active) return
      setItems(withUrls)
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [bookingId])

  const handleDownloadAll = async () => {
    setDownloading(true)
    setDownloadError(false)
    const { error: zipError } = await downloadBookingMediaAsZip(
      bookingId,
      `artic-safari-${bookingId.slice(0, 8)}.zip`,
    )
    setDownloading(false)
    if (zipError) setDownloadError(true)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d1117] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-aurora">Media Vault</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{bookingTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="aspect-square w-full" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ImageOff className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Could not load photos right now. Please try again later.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ImageOff className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No photos yet for this booking. Your guide will add highlights here after your tour.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item) =>
                item.signedUrl ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLightbox(item.signedUrl)}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed URLs are short-lived and not next/image-cacheable */}
                    <img
                      src={item.signedUrl}
                      alt={item.caption ?? 'Tour photo'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                      <ZoomIn className="h-5 w-5 text-white" />
                    </span>
                  </button>
                ) : (
                  <div
                    key={item.id}
                    className="grid aspect-square place-items-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground"
                  >
                    <ImageOff className="h-5 w-5" />
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/10 p-5">
            {downloadError && (
              <p className="mb-2 text-xs font-medium text-rose-400">
                Could not build the zip file. Please try again.
              </p>
            )}
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={downloading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-aurora py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Preparing zip…' : 'Download All (Zip)'}
            </button>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset */}
          <img src={lightbox} alt="Tour photo" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  )
}
