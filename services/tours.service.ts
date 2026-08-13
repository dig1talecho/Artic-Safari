import { supabase } from '@/lib/supabase'

export interface Tour {
  id: string
  slug: string
  status: 'active' | 'draft'
  eyebrow: string
  title: string
  meta_title: string
  meta_description: string
  intro: string
  price: string
  price_note: string
  duration: string
  meeting_point: string
  highlights: string[]
  features: string[]
  cover_image: string
  cover_image_alt: string
  gallery: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export type TourInsertPayload = Omit<Tour, 'id' | 'created_at' | 'updated_at'>
export type TourUpdatePayload = Partial<TourInsertPayload>

/** Public: active tours only, in display order. Used by / and /tours. */
export function getTours() {
  return supabase.from('tours').select('*').eq('status', 'active').order('sort_order', { ascending: true })
}

/** Public: a single active tour by slug. Used by /tours/[slug]. */
export function getTourBySlug(slug: string) {
  return supabase.from('tours').select('*').eq('slug', slug).eq('status', 'active').maybeSingle()
}

/** Admin: every tour regardless of status, in display order. */
export function getAllToursAdmin() {
  return supabase.from('tours').select('*').order('sort_order', { ascending: true })
}

export function getTourByIdAdmin(id: string) {
  return supabase.from('tours').select('*').eq('id', id).maybeSingle()
}

export function createTour(payload: TourInsertPayload) {
  return supabase.from('tours').insert([payload]).select().single()
}

export function updateTour(id: string, payload: TourUpdatePayload) {
  return supabase
    .from('tours')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export function deleteTour(id: string) {
  return supabase.from('tours').delete().eq('id', id)
}

export async function uploadTourImage(file: File) {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const { error: uploadError } = await supabase.storage.from('tour-media').upload(path, file)
  if (uploadError) return { publicUrl: null, error: uploadError }

  const { data } = supabase.storage.from('tour-media').getPublicUrl(path)
  return { publicUrl: data.publicUrl, path, error: null }
}

export async function deleteTourImage(path: string) {
  return supabase.storage.from('tour-media').remove([path])
}
