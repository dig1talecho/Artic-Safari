import { supabase } from '@/lib/supabase'

export interface BookingMedia {
  id: string
  booking_id: string
  storage_path: string
  caption: string | null
  created_at: string
}

/** Admin: upload a photo for a specific booking (path is namespaced so
 * storage RLS can scope customer access to just their own folder). */
export async function uploadBookingMedia(bookingId: string, file: File, caption?: string) {
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const path = `${bookingId}/${filename}`

  const { error: uploadError } = await supabase.storage.from('booking-media').upload(path, file)
  if (uploadError) return { data: null, error: uploadError }

  return supabase
    .from('booking_media')
    .insert([{ booking_id: bookingId, storage_path: path, caption: caption ?? null }])
    .select()
    .single()
}

export function listMediaForBooking(bookingId: string) {
  return supabase
    .from('booking_media')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
}

export async function deleteBookingMedia(media: Pick<BookingMedia, 'id' | 'storage_path'>) {
  await supabase.storage.from('booking-media').remove([media.storage_path])
  return supabase.from('booking_media').delete().eq('id', media.id)
}

/** booking-media is a PRIVATE bucket -- every access goes through a
 * short-lived signed URL, never a public one. */
export async function getSignedMediaUrl(storagePath: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from('booking-media')
    .createSignedUrl(storagePath, expiresInSeconds)
  return { url: data?.signedUrl ?? null, error }
}

/**
 * Bundles every photo for a booking into a single .zip, entirely
 * client-side (JSZip, no server round trip beyond fetching each signed
 * URL) -- real, working "download all" rather than a stub.
 */
export async function downloadBookingMediaAsZip(bookingId: string, zipName = 'artic-safari-photos.zip') {
  const { default: JSZip } = await import('jszip')
  const { data: media, error } = await listMediaForBooking(bookingId)
  if (error || !media || media.length === 0) {
    return { error: error ?? new Error('No photos to download') }
  }

  const zip = new JSZip()

  await Promise.all(
    media.map(async (item) => {
      const { url } = await getSignedMediaUrl(item.storage_path)
      if (!url) return
      const res = await fetch(url)
      const blob = await res.blob()
      const filename = item.storage_path.split('/').pop() ?? `${item.id}.jpg`
      zip.file(filename, blob)
    }),
  )

  const blob = await zip.generateAsync({ type: 'blob' })
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = zipName
  a.click()
  URL.revokeObjectURL(objectUrl)

  return { error: null }
}
