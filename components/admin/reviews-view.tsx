'use client'

import { useEffect, useState } from 'react'
import { Star, Trash2, Eye, EyeOff, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  published: boolean
  created_at: string
}

export function ReviewsView() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setReviews(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim() || !comment.trim()) return

    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert([
      {
        customer_name: customerName.trim(),
        rating,
        comment: comment.trim(),
        published: true,
      },
    ])
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setCustomerName('')
    setRating(5)
    setComment('')
    fetchReviews()
  }

  const togglePublished = async (id: string, published: boolean) => {
    const { error } = await supabase.from('reviews').update({ published: !published }).eq('id', id)
    if (!error) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, published: !published } : r)))
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Add a Review</h2>
        <p className="mt-1 text-xs text-slate-400">
          Add reviews you've actually collected from customers (email, word of mouth, etc.). There is
          no public submission form — this keeps the homepage free of fake reviews.
        </p>

        <form onSubmit={handleAdd} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-aurora focus:outline-none"
            />
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  aria-label={`${i + 1} stars`}
                >
                  <Star
                    className={`h-4 w-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            required
            rows={3}
            placeholder="What did they say?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-aurora focus:outline-none"
          />
          {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-aurora px-4 py-2.5 text-sm font-semibold text-black hover:bg-aurora/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {submitting ? 'Adding…' : 'Add Review'}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-md">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            All Reviews ({reviews.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading…</div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            No reviews yet. Add your first one above.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {reviews.map((review) => (
              <div key={review.id} className="flex items-start justify-between gap-4 px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{review.customer_name}</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </span>
                    {!review.published && (
                      <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{review.comment}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => togglePublished(review.id, review.published)}
                    title={review.published ? 'Unpublish' : 'Publish'}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                  >
                    {review.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    title="Delete"
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
