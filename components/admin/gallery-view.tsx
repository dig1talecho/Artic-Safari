'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Trash2, ImageOff } from 'lucide-react'
import {
  listAllGalleryPhotos,
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  type GalleryPhoto,
} from '@/services/gallery.service'

export function GalleryView() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = async () => {
    setLoading(true)
    const { data, error } = await listAllGalleryPhotos()

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setPhotos(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)

    const { error } = await uploadGalleryPhoto(file)

    setUploading(false)

    if (error) {
      setError(error.message)
      return
    }

    fetchPhotos()
  }

  const handleDelete = async (photo: GalleryPhoto) => {
    const { error } = await deleteGalleryPhoto(photo)
    if (!error) {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
          Upload Customer Photos
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Photos you upload here appear in the homepage &quot;From Our Guests&quot; gallery. Only
          upload photos you have permission to share.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex items-center gap-2 rounded-xl bg-aurora px-4 py-2.5 text-sm font-semibold text-black hover:bg-aurora/90 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Choose Photo'}
        </button>
        {error && <p className="mt-2 text-xs font-medium text-rose-400">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-md">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Gallery ({photos.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading…</div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
            <ImageOff className="h-6 w-6" />
            No photos yet. Upload the first one above.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
                <Image
                  src={photo.public_url}
                  alt={photo.caption || 'Uploaded gallery photo'}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                <button
                  onClick={() => handleDelete(photo)}
                  title="Delete"
                  className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-rose-500/80 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
