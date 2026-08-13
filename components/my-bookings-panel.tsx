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
} from 'lucide-react'

import { signInWithPassword, signUpCustomer, signOut } from '@/services/auth.service'
import { createCustomerProfile } from '@/services/customers.service'
import { listBookingsByCustomerEmail } from '@/services/bookings.service'
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-aurora py-3 text-sm font-semibold text-black transition-all hover:bg-aurora/90 disabled:opacity-50"
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
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aurora/20 text-aurora">
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-aurora py-3 text-sm font-semibold text-black transition-all hover:bg-aurora/90 disabled:opacity-50"
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
                ? 'bg-aurora text-accent-foreground'
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
                ? 'bg-aurora text-accent-foreground'
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
  const [loading, setLoading] = useState(true)
  const [activeMediaBooking, setActiveMediaBooking] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    let active = true

    listBookingsByCustomerEmail(email)
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
    signOut()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-aurora">My Dashboard</p>
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
