import { supabase } from '@/lib/supabase'

export interface ReviewInsertPayload {
  customer_name: string
  rating: number
  comment: string
  published: boolean
}

export function listPublishedReviews() {
  return supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
}

export function listPublishedReviewRatings() {
  return supabase.from('reviews').select('rating').eq('published', true)
}

export function listAllReviews() {
  return supabase.from('reviews').select('*').order('created_at', { ascending: false })
}

export function createReview(payload: ReviewInsertPayload) {
  return supabase.from('reviews').insert([payload])
}

export function setReviewPublished(id: string, published: boolean) {
  return supabase.from('reviews').update({ published }).eq('id', id)
}

export function deleteReview(id: string) {
  return supabase.from('reviews').delete().eq('id', id)
}
