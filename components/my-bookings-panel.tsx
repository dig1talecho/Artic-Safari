'use client'

import { useEffect, useState } from 'react'
import {
  Mail,
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
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/use-session'
import { Card, CardEyebrow, CardTitle, CardIcon, CardHeader } from '@/components/ui/card'
import { GlowPanel, GlowPanelContent } from '@/components/ui/glow-panel'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

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

function SignInForm() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
      },
    })

    setSending(false)
    if (error) {
      setError('Something went wrong sending your link. Please try again.')
    } else {
      setSent(true)
    }
  }

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
            <CardTitle>Sign in to view your bookings</CardTitle>
          </div>
        </CardHeader>

        {sent ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aurora/20 text-aurora">
              <Mail className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Check your inbox — we&apos;ve sent a secure sign-in link to{' '}
              <span className="text-foreground">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-pretty leading-relaxed text-muted-foreground">
              Enter the email you used when booking. We&apos;ll send you a magic link — no
              password needed.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-aurora py-3 text-sm font-semibold text-black transition-all hover:bg-aurora/90 disabled:opacity-50"
            >
              {sending ? 'Sending link...' : 'Send magic link'}
              {!sending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}
      </div>
    </Card>
  )
}

function BookingsList({ email }: { email: string }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('bookings')
      .select('*')
      .eq('customer_email', email)
      .order('booking_date', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (!error) setBookings(data ?? [])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [email])

  const totalSpend = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, b) => acc + (Number(b.total_price) || 0), 0)

  const upcoming = bookings.filter(
    (b) => b.status !== 'cancelled' && new Date(b.booking_date) >= new Date(new Date().toDateString()),
  ).length

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-aurora">My Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Your bookings
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
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-aurora">
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
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-aurora">
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
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-aurora">
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
            className="mt-4 inline-flex items-center gap-2 self-center rounded-xl border border-aurora/30 bg-aurora/10 px-4 py-2 text-sm font-semibold text-aurora transition-all hover:bg-aurora hover:text-black"
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

              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-aurora" />
                {booking.booking_date}
              </div>

              {booking.notes && (
                <p className="mt-2 text-xs text-muted-foreground">{booking.notes}</p>
              )}

              <div className="mt-4 flex items-baseline gap-1.5 border-t border-white/10 pt-4">
                <span className="font-mono text-xl font-semibold text-foreground">
                  {Number(booking.total_price || 0).toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">NOK</span>
              </div>
            </Card>
          ))}
        </div>
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
        <BookingsList email={session.user.email} />
      ) : (
        <SignInForm />
      )}
    </section>
  )
}
