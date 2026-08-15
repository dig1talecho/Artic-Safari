import { Star, Quote } from 'lucide-react'
import { listPublishedReviews } from '@/services/reviews.service'

export async function ReviewsSection() {
  const { data, error } = await listPublishedReviews()

  const reviews = error ? [] : (data ?? [])

  // Honest empty state: nothing is shown until there's at least one real review.
  if (reviews.length === 0) return null

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
          What Guests Say
        </p>
        <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] tracking-tight text-[var(--home-foreground)] sm:text-4xl">
          Reviews from our guests
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{ backgroundImage: 'var(--home-gradient-card)' }}
            className="flex flex-col rounded-[20px] border border-white/5 p-6 shadow-[var(--home-card-shadow)]"
          >
            <Quote className="h-5 w-5 text-[var(--home-accent)]" />
            <div className="mt-3 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? 'fill-[var(--home-gold)] text-[var(--home-gold)]'
                      : 'fill-transparent text-[var(--home-border)]'
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-[var(--home-muted)]">
              {review.comment}
            </p>
            <p className="mt-4 text-sm font-bold text-[var(--home-foreground)]">
              {review.customer_name}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
