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

export interface CustomerReview {
  id: string
  booking_id: string | null
  rating: number
  comment: string
  published: boolean
  created_at: string
}

export interface CustomerReviewPayload {
  booking_id: string
  customer_name: string
  customer_email: string
  rating: number
  comment: string
}

// Requires supabase-reviews-customer-submissions.sql to have been run --
// until then these simply return an RLS/column error, which the dashboard
// treats the same as "no reviews yet" rather than crashing.
export function listReviewsForCustomer(email: string) {
  return supabase
    .from('reviews')
    .select('id, booking_id, rating, comment, published, created_at')
    .eq('customer_email', email)
}

export function createCustomerReview(payload: CustomerReviewPayload) {
  return supabase
    .from('reviews')
    .insert([{ ...payload, published: false }])
    .select('id, booking_id, rating, comment, published, created_at')
}
