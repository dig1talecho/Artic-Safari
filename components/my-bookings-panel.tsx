'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock3,
  LogOut,
  Wallet,
  ListChecks,
  CalendarClock,
  ArrowRight,
  Images,
  Star,
  MessageSquarePlus,
  Hourglass,
} from 'lucide-react'

import { signInWithPassword, signUpCustomer, signOut } from '@/services/auth.service'
import { createCustomerProfile } from '@/services/customers.service'
import { listBookingsByCustomerEmail } from '@/services/bookings.service'
import {
  listReviewsForCustomer,
  createCustomerReview,
  type CustomerReview,
} from '@/services/reviews.service'
import { useSession } from '@/lib/use-session'
import { useCustomerProfile } from '@/lib/use-customer-profile'
import { Card, CardEyebrow, CardTitle, CardIcon, CardHeader } from '@/components/ui/card'
import { GlowPanel, GlowPanelContent } from '@/components/ui/glow-panel'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { MediaVaultModal } from '@/components/media-vault-modal'

interface Booking {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  booking_type: string
  item_title: string
  booking_date: string
  total_price: number
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
}

function statusBadge(status: Booking['status']) {
  if (status === 'confirmed') {
    return (
      <Badge variant="aurora">
        <CheckCircle2 className="h-3 w-3" />
        Confirmed
      </Badge>
    )
  }
  if (status === 'cancelled') {
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3" />
        Cancelled
      </Badge>
    )
  }
  return (
    <Badge variant="warning">
      <Clock3 className="h-3 w-3" />
      Pending
    </Badge>
  )
}

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`)
  const today = new Date(new Date().toDateString())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function CountdownBadge({ bookingDate }: { bookingDate: string }) {
  const days = daysUntil(bookingDate)
  if (days < 0) return null
  const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`
  return (
    <span className="flex items-center gap-1 rounded-full border border-[#33bbcf]/25 bg-[#33bbcf]/10 px-2.5 py-1 text-[11px] font-medium text-[#33bbcf]">
      <Hourglass className="h-3 w-3" />
      {label}
    </span>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < (hover || value)
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i + 1)}
            onClick={() => onChange(i + 1)}
            aria-label={`${i + 1} star${i === 0 ? '' : 's'}`}
            className="p-0.5"
          >
            <Star className={`h-5 w-5 transition-colors ${filled ? 'fill-[#33bbcf] text-[#33bbcf]' : 'fill-transparent text-white/20'}`} />
          </button>
        )
      })}
    </div>
  )
}

/**
 * Distinct from a public "submit a review" form -- only reachable by a
 * signed-in customer, only for a booking that's genuinely theirs and
 * confirmed (enforced by RLS in supabase-reviews-customer-submissions.sql).
 * Submissions land unpublished; the admin Reviews screen still has the only
 * "publish" switch.
 */
function ReviewPanel({
  booking,
  existingReview,
  onSubmitted,
}: {
  booking: Booking
  existingReview: CustomerReview | undefined
  onSubmitted: (review: CustomerReview) => void
}) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (booking.status !== 'confirmed') return null

  if (existingReview) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < existingReview.rating ? 'fill-[#33bbcf] text-[#33bbcf]' : 'fill-transparent text-white/15'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {existingReview.published ? 'Your review is live' : 'Review submitted — pending approval'}
        </span>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="mt-4 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#33bbcf] transition-colors hover:text-[#33bbcf]/80"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Leave a review
        </button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !comment.trim()) return

    setSubmitting(true)
    setError('')

    const { data, error: submitError } = await createCustomerReview({
      booking_id: booking.id,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      rating,
      comment: comment.trim(),
    })

    setSubmitting(false)

    if (submitError || !data || data.length === 0) {
      console.error('Customer review insert error:', submitError)
      setError('Could not submit your review. Please try again shortly.')
      return
    }

    onSubmitted(data[0])
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-white/10 pt-4">
      <p className="text-xs font-medium text-foreground">How was {booking.item_title}?</p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        required
        rows={2}
        placeholder="Tell future guests what to expect…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-[#33bbcf]/50"
      />
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || rating === 0 || !comment.trim()}
          className="rounded-lg bg-[#33bbcf] px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}

function LabeledField({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-3 h-4 w-4 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  )
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setSigningIn(true)
    setError(null)

    const { error } = await signInWithPassword(email.trim(), password)

    setSigningIn(false)
    if (error) {
      console.error('Supabase signInWithPassword error:', error)
      setError(error.message || 'Something went wrong signing in. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LabeledField label="Email" icon={<Mail className="h-4 w-4" />}>
        <Input
          required
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
        />
      </LabeledField>
      <LabeledField label="Password" icon={<Lock className="h-4 w-4" />}>
        <Input
          required
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10"
        />
      </LabeledField>
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
      <button
        type="submit"
        disabled={signingIn}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#33bbcf] py-3 text-sm font-semibold text-black transition-all hover:bg-[#33bbcf]/90 disabled:opacity-50"
      >
        {signingIn ? 'Signing in...' : 'Sign in'}
        {!signingIn && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  )
}

function SignUpForm({ onSignedUp }: { onSignedUp: () => void }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) return

    setSubmitting(true)
    setError(null)

    const { data, error: signUpError } = await signUpCustomer(email.trim(), password)

    if (signUpError) {
      console.error('Supabase signUp error:', signUpError)
      setError(signUpError.message || 'Something went wrong creating your account. Please try again.')
      setSubmitting(false)
      return
    }

    if (!data.session || !data.user) {
      // Email confirmation is still enabled on the Supabase project.
      setPendingConfirmation(true)
      setSubmitting(false)
      return
    }

    const { error: profileError } = await createCustomerProfile({
      id: data.user.id,
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
    })

    setSubmitting(false)

    if (profileError) {
      console.error('Supabase customer_profiles insert error:', profileError)
      setError(profileError.message || 'Your account was created but saving your profile failed.')
      return
    }

    onSignedUp()
  }

  if (pendingConfirmation) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#33bbcf]/20 text-[#33bbcf]">
          <Mail className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">
          Check your inbox to confirm <span className="text-foreground">{email}</span>, then sign in.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LabeledField label="Full Name" icon={<User className="h-4 w-4" />}>
        <Input
          required
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="pl-10"
        />
      </LabeledField>
      <LabeledField label="Phone" icon={<Phone className="h-4 w-4" />}>
        <Input
          required
          type="tel"
          placeholder="+47 000 00 000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="pl-10"
        />
      </LabeledField>
      <LabeledField label="Email" icon={<Mail className="h-4 w-4" />}>
        <Input
          required
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
        />
      </LabeledField>
      <LabeledField label="Password" icon={<Lock className="h-4 w-4" />}>
        <Input
          required
          type="password"
          placeholder="Choose a password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10"
        />
      </LabeledField>
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#33bbcf] py-3 text-sm font-semibold text-black transition-all hover:bg-[#33bbcf]/90 disabled:opacity-50"
      >
        {submitting ? 'Creating account...' : 'Create account'}
        {!submitting && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  )
}

function AuthForms() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <Card glow="violet" className="mx-auto max-w-md">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet/20 blur-[90px]" />
      <div className="relative">
        <CardHeader>
          <CardIcon>
            <Sparkles className="h-5 w-5" />
          </CardIcon>
          <div>
            <CardEyebrow>My Dashboard</CardEyebrow>
            <CardTitle>
              {mode === 'signin' ? 'Sign in to view your bookings' : 'Create your account'}
            </CardTitle>
          </div>
        </CardHeader>

        <div className="mb-5 flex rounded-xl border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              mode === 'signin'
                ? 'bg-[#33bbcf] text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-[#33bbcf] text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signin' ? (
          <SignInForm />
        ) : (
          <SignUpForm onSignedUp={() => setMode('signin')} />
        )}
      </div>
    </Card>
  )
}

function BookingsList({ session }: { session: Session }) {
  const email = session.user.email as string
  const { profile } = useCustomerProfile(session)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<CustomerReview[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMediaBooking, setActiveMediaBooking] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([listBookingsByCustomerEmail(email), listReviewsForCustomer(email)]).then(
      ([bookingsRes, reviewsRes]) => {
        if (!active) return
        if (!bookingsRes.error) setBookings(bookingsRes.data ?? [])
        // Table may not have the customer_email/booking_id columns yet if
        // supabase-reviews-customer-submissions.sql hasn't been run --
        // treat that the same as "no reviews yet" instead of failing.
        if (!reviewsRes.error) setReviews(reviewsRes.data ?? [])
        setLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [email])

  const reviewByBooking = Object.fromEntries(
    reviews.filter((r) => r.booking_id).map((r) => [r.booking_id as string, r]),
  )

  const totalSpend = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, b) => acc + (Number(b.total_price) || 0), 0)

  const upcoming = bookings.filter(
    (b) => b.status !== 'cancelled' && new Date(b.booking_date) >= new Date(new Date().toDateString()),
  ).length

  const handleSignOut = () => {
    signOut()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#33bbcf]">My Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Your bookings'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlowPanel>
          <GlowPanelContent className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-[#33bbcf]">
              <ListChecks className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total bookings
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{bookings.length}</p>
            </div>
          </GlowPanelContent>
        </GlowPanel>

        <GlowPanel>
          <GlowPanelContent className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-[#33bbcf]">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Upcoming</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{upcoming}</p>
            </div>
          </GlowPanelContent>
        </GlowPanel>

        <GlowPanel>
          <GlowPanelContent className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-[#33bbcf]">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Lifetime spend
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
                {totalSpend.toLocaleString()} <span className="text-sm">NOK</span>
              </p>
            </div>
          </GlowPanelContent>
        </GlowPanel>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm text-muted-foreground">
            No bookings yet under this email.
          </p>
          <a
            href="/#tours"
            className="mt-4 inline-flex items-center gap-2 self-center rounded-xl border border-[#33bbcf]/30 bg-[#33bbcf]/10 px-4 py-2 text-sm font-semibold text-[#33bbcf] transition-all hover:bg-[#33bbcf] hover:text-black"
          >
            Browse tours
            <ArrowRight className="h-4 w-4" />
          </a>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {bookings.map((booking) => (
            <Card key={booking.id} glow="aurora">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {booking.booking_type}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold leading-tight text-foreground">
                    {booking.item_title}
                  </h3>
                </div>
                {statusBadge(booking.status)}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-[#33bbcf]" />
                {booking.booking_date}
                {booking.status === 'confirmed' && <CountdownBadge bookingDate={booking.booking_date} />}
              </div>

              {booking.notes && (
                <p className="mt-2 text-xs text-muted-foreground">{booking.notes}</p>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-xl font-semibold text-foreground">
                    {Number(booking.total_price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">NOK</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMediaBooking({ id: booking.id, title: booking.item_title })}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <Images className="h-3.5 w-3.5" />
                  Photos
                </button>
              </div>

              <ReviewPanel
                booking={booking}
                existingReview={reviewByBooking[booking.id]}
                onSubmitted={(review) => setReviews((prev) => [...prev, review])}
              />
            </Card>
          ))}
        </div>
      )}

      {activeMediaBooking && (
        <MediaVaultModal
          bookingId={activeMediaBooking.id}
          bookingTitle={activeMediaBooking.title}
          onClose={() => setActiveMediaBooking(null)}
        />
      )}
    </div>
  )
}

export function MyBookingsPanel() {
  const { session, loading } = useSession()

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20">
      {loading ? (
        <div className="mx-auto max-w-md space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : session?.user?.email ? (
        <BookingsList session={session} />
      ) : (
        <AuthForms />
      )}
    </section>
  )
}
