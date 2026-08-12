import { supabase } from '@/lib/supabase'

export interface GalleryPhoto {
  id: string
  storage_path: string
  public_url: string
  caption: string | null
  created_at: string
}

export function listGalleryPhotosForHomepage(limit: number) {
  return supabase
    .from('gallery_photos')
    .select('id, public_url, caption')
    .order('created_at', { ascending: false })
    .limit(limit)
}

export function listAllGalleryPhotos() {
  return supabase.from('gallery_photos').select('*').order('created_at', { ascending: false })
}

export async function uploadGalleryPhoto(file: File) {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const { error: uploadError } = await supabase.storage.from('gallery-photos').upload(path, file)
  if (uploadError) return { error: uploadError }

  const { data: urlData } = supabase.storage.from('gallery-photos').getPublicUrl(path)

  const { error: insertError } = await supabase.from('gallery_photos').insert([
    {
      storage_path: path,
      public_url: urlData.publicUrl,
    },
  ])

  return { error: insertError }
}

export async function deleteGalleryPhoto(photo: Pick<GalleryPhoto, 'id' | 'storage_path'>) {
  await supabase.storage.from('gallery-photos').remove([photo.storage_path])
  return supabase.from('gallery_photos').delete().eq('id', photo.id)
}
