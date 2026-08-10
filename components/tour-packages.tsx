'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/use-session'
import { useCustomerProfile } from '@/lib/use-customer-profile'
import {
  Plane,
  Sparkles,
  User,
  Users,
  Waves,
  Check,
  Wifi,
  Camera,
  Coffee,
  Thermometer,
  Route,
  Car,
  X,
  Calendar,
  Clock,
  Mail,
  Phone,
} from 'lucide-react'

function Feature({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-[var(--home-muted)]">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--home-accent-soft)] text-[var(--home-accent)]">
        {icon}
      </span>
      {children}
    </li>
  )
}

function Card({
  className = '',
  children,
  glow = 'accent',
}: {
  className?: string
  children: React.ReactNode
  glow?: 'accent' | 'gold'
}) {
  const ring =
    glow === 'gold'
      ? 'hover:border-[var(--home-gold)]/50'
      : 'hover:border-[var(--home-accent)]/40'
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 shadow-[0_2px_24px_-8px_rgba(33,31,27,0.08)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(33,31,27,0.16)] ${ring} ${className}`}
    >
      {children}
    </div>
  )
}

function CardHead({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode
  eyebrow: string
  title: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] text-[var(--home-accent)]">
        {icon}
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--home-muted)]">{eyebrow}</p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg leading-tight text-[var(--home-foreground)]">
          {title}
        </h3>
      </div>
    </div>
  )
}

function SegToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            value === o.id
              ? 'bg-[var(--home-accent)] text-white'
              : 'text-[var(--home-muted)] hover:text-[var(--home-foreground)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Price({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-3xl font-semibold tracking-tight text-[var(--home-foreground)] tabular-nums">
        {value}
      </span>
      {suffix ? <span className="text-sm text-[var(--home-muted)]">{suffix}</span> : null}
    </div>
  )
}

const transferSizes = [
  { id: 'small', label: 'Small · 1–4' },
  { id: 'large', label: 'Large · 4–8' },
] as const
const sommaroyaCars = [
  { id: 'small', label: 'Small Car' },
  { id: 'big', label: 'Big Car' },
] as const

interface BookingDetails {
  title: string
  option?: string
  price: string
}

export function TourPackages() {
  const { session } = useSession()
  const { profile: customerProfile } = useCustomerProfile(session)
  const isSignedIn = Boolean(customerProfile)

  const [transfer, setTransfer] = useState<(typeof transferSizes)[number]['id']>('small')
  const [sommaroya, setSommaroya] = useState<(typeof sommaroyaCars)[number]['id']>('small')

  // Booking modal state
  const [selectedPackage, setSelectedPackage] = useState<BookingDetails | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form input state'leri
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const transferPrice = transfer === 'small' ? '490 kr' : '850 kr'
  const sommaroyaPrice = sommaroya === 'small' ? '5,000 kr' : '9,000 kr'

  const handleBooking = (title: string, price: string, option?: string) => {
    setSelectedPackage({ title, price, option })
    setIsSubmitted(false)
    // Signed-in customers already have this on file — pre-fill it instead of asking again.
    setFullName(customerProfile?.full_name ?? '')
    setEmail(customerProfile?.email ?? session?.user?.email ?? '')
    setPhone(customerProfile?.phone ?? '')
    setDate('')
    setTime('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPackage) return

    setLoading(true)

    // Fiyat metninden sadece sayısal değeri ayıkla (Örn: "15,000 kr" -> 15000)
    const numericPrice = parseInt(selectedPackage.price.replace(/[^0-9]/g, '')) || 0

    try {
      const { data, error } = await supabase.from('bookings').insert([
        {
          customer_name: fullName.trim() || 'Guest User',
          customer_email: email.trim() || 'pending@articsafaritour.com',
          customer_phone: phone.trim() || null,
          booking_type: selectedPackage.title.includes('Transfer') ? 'transfer' : 'tour',
          item_title: `${selectedPackage.title}${selectedPackage.option ? ` (${selectedPackage.option})` : ''}`,
          booking_date: date || new Date().toISOString().split('T')[0],
          total_price: numericPrice,
          notes: time ? `Preferred Time: ${time}` : 'Direct package booking',
          status: 'pending'
        }
      ])

      if (error) {
        console.error('Modal Supabase hatasi:', error)
      } else {
        console.log('Modal Supabase kayit basarili:', data)
      }
    } catch (err) {
      console.error('Modal Supabase beklenmeyen hata:', err)
    } finally {
      setLoading(false)
      setIsSubmitted(true)
      setTimeout(() => {
        setSelectedPackage(null)
        setIsSubmitted(false)
      }, 2500)
    }
  }

  return (
    <section id="tours" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20">
      <div className="mb-12 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--home-accent)]">Tours &amp; Transfers</p>
        <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-normal tracking-tight text-[var(--home-foreground)] sm:text-4xl">
          Choose your Arctic expedition
        </h2>
        <p className="mt-3 text-pretty leading-relaxed text-[var(--home-muted)]">
          Private, chauffeured and endlessly flexible. Configure passengers and vehicles for an
          instant, all-inclusive rate.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {/* Card 1 — Airport Transfer (toggle) */}
        <Card className="md:col-span-2" glow="gold">
          <CardHead icon={<Plane className="h-5 w-5" />} eyebrow="Point to Point" title="Airport Transfer" />
          <SegToggle options={transferSizes} value={transfer} onChange={setTransfer} />
          <div className="mt-4">
            <Price value={transferPrice} />
            <p className="mt-1 text-xs text-[var(--home-muted)]">
              {transfer === 'small' ? '1 to 4 persons' : '4 to 8 persons'}
            </p>
          </div>
          <ul className="mt-5 space-y-2.5">
            <Feature icon={<Plane className="h-3 w-3" />}>Direct airport transfer</Feature>
            <Feature icon={<User className="h-3 w-3" />}>Chauffeur service</Feature>
            <Feature icon={<Wifi className="h-3 w-3" />}>Free Wi-Fi</Feature>
            <Feature icon={<Check className="h-3 w-3" />}>Generous luggage space</Feature>
          </ul>
          <button
            type="button"
            onClick={() => handleBooking('Airport Transfer', transferPrice, transfer === 'small' ? '1-4 Persons' : '4-8 Persons')}
            className="mt-6 w-full rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-3 text-sm font-medium text-[var(--home-foreground)] transition-[color,border-color,scale] hover:border-[var(--home-accent)] hover:text-[var(--home-accent)] active:scale-[0.96]"
          >
            Book Transfer
          </button>
        </Card>

        {/* Card 2 — Private Group (hero) */}
        <Card className="md:col-span-4 md:row-span-2">
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <CardHead
                icon={<Sparkles className="h-5 w-5" />}
                eyebrow="Signature Experience"
                title="Northern Lights Tour — Private Group"
              />
              <span className="shrink-0 rounded-full border border-[var(--home-gold)]/40 bg-[var(--home-gold-soft)] px-3 py-1.5 text-xs font-medium text-[var(--home-gold)]">
                Most Booked
              </span>
            </div>
            <p className="max-w-md text-pretty leading-relaxed text-[var(--home-muted)]">
              An exclusive private group expedition for 2 to 8 guests. Your own heated vehicle and a
              route customized in real time to hunt the clearest, most active skies.
            </p>

            <div className="mt-6 flex items-baseline gap-3">
              <Price value="15,000 kr" />
              <span className="rounded-full bg-[var(--home-surface-soft)] px-3 py-1 text-xs text-[var(--home-muted)]">
                Flat rate · up to 8 guests
              </span>
            </div>

            <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Feature icon={<Car className="h-3 w-3" />}>Private heated vehicle</Feature>
              <Feature icon={<Route className="h-3 w-3" />}>Customized chase route</Feature>
              <Feature icon={<Thermometer className="h-3 w-3" />}>Thermal suits provided</Feature>
              <Feature icon={<Camera className="h-3 w-3" />}>Professional photography</Feature>
              <Feature icon={<Coffee className="h-3 w-3" />}>Hot drinks &amp; snacks</Feature>
              <Feature icon={<Users className="h-3 w-3" />}>2 to 8 persons</Feature>
            </ul>

            <div className="mt-auto pt-7">
              <button
                type="button"
                onClick={() => handleBooking('Northern Lights — Private Group', '15,000 kr', 'Up to 8 guests')}
                className="w-full rounded-2xl bg-[var(--home-accent)] py-3.5 text-sm font-medium text-white transition-[opacity,scale] hover:opacity-90 active:scale-[0.96] sm:w-auto sm:px-8"
              >
                Reserve Private Group
              </button>
            </div>
          </div>
        </Card>

        {/* Card 3 — Per Person */}
        <Card className="md:col-span-2" glow="gold">
          <CardHead icon={<User className="h-5 w-5" />} eyebrow="Solo & Couples" title="Northern Lights — Per Person" />
          <Price value="2,000 kr" suffix="/ person" />
          <ul className="mt-5 space-y-2.5">
            <Feature icon={<Users className="h-3 w-3" />}>Shared small-group chase</Feature>
            <Feature icon={<Sparkles className="h-3 w-3" />}>Expert aurora guide</Feature>
            <Feature icon={<Coffee className="h-3 w-3" />}>Hot drinks included</Feature>
          </ul>
          <button
            type="button"
            onClick={() => handleBooking('Northern Lights — Per Person', '2,000 kr / person')}
            className="mt-6 w-full rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-3 text-sm font-medium text-[var(--home-foreground)] transition-[color,border-color,scale] hover:border-[var(--home-accent)] hover:text-[var(--home-accent)] active:scale-[0.96]"
          >
            Book Ticket
          </button>
        </Card>

        {/* Card 4 — Private Small Group */}
        <Card className="md:col-span-3">
          <CardHead
            icon={<Users className="h-5 w-5" />}
            eyebrow="Family & Friends"
            title="Northern Lights — Private Small Group"
          />
          <div className="flex items-baseline justify-between">
            <Price value="11,000 kr" />
            <span className="text-xs text-[var(--home-muted)]">1 to 4 persons</span>
          </div>
          <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Feature icon={<User className="h-3 w-3" />}>Private chauffeur</Feature>
            <Feature icon={<Route className="h-3 w-3" />}>Flexible timing</Feature>
            <Feature icon={<Thermometer className="h-3 w-3" />}>Thermal gear</Feature>
            <Feature icon={<Camera className="h-3 w-3" />}>Tripods provided</Feature>
          </ul>
          <button
            type="button"
            onClick={() => handleBooking('Northern Lights — Private Small Group', '11,000 kr', '1 to 4 persons')}
            className="mt-6 w-full rounded-2xl bg-[var(--home-surface-soft)] py-3 text-sm font-medium text-[var(--home-foreground)] transition-[background-color,color,scale] hover:bg-[var(--home-accent)] hover:text-white active:scale-[0.96]"
          >
            Book Small Group
          </button>
        </Card>

        {/* Card 5 — Sommarøya (vehicle selector) */}
        <Card className="md:col-span-3" glow="gold">
          <CardHead icon={<Waves className="h-5 w-5" />} eyebrow="Coastal Scenic" title="Sommarøya Tour" />
          <SegToggle options={sommaroyaCars} value={sommaroya} onChange={setSommaroya} />
          <div className="mt-4 flex items-baseline justify-between">
            <Price value={sommaroyaPrice} />
            <span className="text-xs text-[var(--home-muted)]">
              {sommaroya === 'small' ? 'Small car' : 'Big car'}
            </span>
          </div>
          <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Feature icon={<Route className="h-3 w-3" />}>Scenic coastal fjord drive</Feature>
            <Feature icon={<Waves className="h-3 w-3" />}>Sommarøy island exploration</Feature>
            <Feature icon={<Camera className="h-3 w-3" />}>Curated photo stops</Feature>
          </ul>
          <button
            type="button"
            onClick={() => handleBooking('Sommarøya Tour', sommaroyaPrice, sommaroya === 'small' ? 'Small Car' : 'Big Car')}
            className="mt-6 w-full rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-3 text-sm font-medium text-[var(--home-foreground)] transition-[color,border-color,scale] hover:border-[var(--home-accent)] hover:text-[var(--home-accent)] active:scale-[0.96]"
          >
            Book Scenic Tour
          </button>
        </Card>
      </div>

      {/* Booking Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--home-foreground)]/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 shadow-[0_24px_64px_-16px_rgba(33,31,27,0.35)]">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-[var(--home-muted)] hover:bg-[var(--home-surface-soft)] hover:text-[var(--home-foreground)]"
            >
              <X className="h-5 w-5" />
            </button>

            {isSubmitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--home-accent-soft)] text-[var(--home-accent)]">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--home-foreground)]">
                  Booking Request Sent
                </h3>
                <p className="mt-2 text-sm text-[var(--home-muted)]">
                  We will contact you shortly to confirm your reservation for {selectedPackage.title}.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-widest text-[var(--home-accent)]">Reservation</p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--home-foreground)]">
                    {selectedPackage.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 text-sm text-[var(--home-muted)]">
                    <span className="font-mono font-semibold text-[var(--home-accent)]">{selectedPackage.price}</span>
                    {selectedPackage.option && <span>• {selectedPackage.option}</span>}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignedIn ? (
                    <div className="rounded-xl border border-[var(--home-accent)]/25 bg-[var(--home-accent-soft)] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--home-accent)]">Booking as</p>
                      <p className="mt-1 text-sm font-medium text-[var(--home-foreground)]">{fullName}</p>
                      <p className="text-xs text-[var(--home-muted)]">
                        {email}
                        {phone ? ` · ${phone}` : ''}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-[var(--home-muted)] mb-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                          <input
                            required
                            type="text"
                            autoComplete="name"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-[var(--home-muted)] mb-1">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                            <input
                              required
                              type="email"
                              autoComplete="email"
                              placeholder="john@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--home-muted)] mb-1">Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                            <input
                              required
                              type="tel"
                              autoComplete="tel"
                              placeholder="+47 000 00 000"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[var(--home-muted)] mb-1">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                        <input
                          required
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none [color-scheme:light]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--home-muted)] mb-1">Preferred Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none [color-scheme:light]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full rounded-xl bg-[var(--home-accent)] py-3 text-sm font-medium text-white transition-[opacity,scale] hover:opacity-90 active:scale-[0.96] disabled:opacity-50"
                  >
                    {loading ? 'Saving…' : 'Confirm Booking'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
