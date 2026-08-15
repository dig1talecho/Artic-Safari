import { supabase } from '@/lib/supabase'

export interface GalleryPhoto {
  id: string
  storage_path: string
  public_url: string
  caption: string | null
  tour_id: string | null
  created_at: string
}

export interface GalleryPhotoWithTour extends GalleryPhoto {
  tour: { id: string; title: string; slug: string } | null
}

export function listGalleryPhotosForHomepage(limit: number) {
  return supabase
    .from('gallery_photos')
    .select('id, public_url, caption')
    .order('created_at', { ascending: false })
    .limit(limit)
}

/**
 * Full /gallery page: every photo plus its associated tour (if any), so
 * the page can group photos into per-tour sections. Requires
 * supabase-gallery-tour-association.sql -- if tour_id/the embed aren't
 * there yet, callers should fall back to treating every photo as
 * ungrouped rather than failing the whole page.
 */
export function listGalleryPhotosWithTours() {
  return supabase
    .from('gallery_photos')
    .select('id, storage_path, public_url, caption, tour_id, created_at, tour:tours(id, title, slug)')
    .order('created_at', { ascending: false })
}

export function listAllGalleryPhotos() {
  return supabase.from('gallery_photos').select('*').order('created_at', { ascending: false })
}

export async function uploadGalleryPhoto(
  file: File,
  options?: { caption?: string; tourId?: string | null },
) {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const { error: uploadError } = await supabase.storage.from('gallery-photos').upload(path, file)
  if (uploadError) return { error: uploadError }

  const { data: urlData } = supabase.storage.from('gallery-photos').getPublicUrl(path)

  const { error: insertError } = await supabase.from('gallery_photos').insert([
    {
      storage_path: path,
      public_url: urlData.publicUrl,
      caption: options?.caption?.trim() || null,
      tour_id: options?.tourId || null,
    },
  ])

  return { error: insertError }
}

export async function deleteGalleryPhoto(photo: Pick<GalleryPhoto, 'id' | 'storage_path'>) {
  await supabase.storage.from('gallery-photos').remove([photo.storage_path])
  return supabase.from('gallery_photos').delete().eq('id', photo.id)
}
