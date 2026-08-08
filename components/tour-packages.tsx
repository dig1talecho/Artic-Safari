'use client'

import { useState } from 'react'
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
    <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/[0.04] text-aurora">
        {icon}
      </span>
      {children}
    </li>
  )
}

function Card({
  className = '',
  children,
  glow = 'violet',
}: {
  className?: string
  children: React.ReactNode
  glow?: 'violet' | 'aurora'
}) {
  const ring =
    glow === 'aurora'
      ? 'hover:border-aurora/40 hover:shadow-[0_0_40px_-12px_rgba(0,255,163,0.45)]'
      : 'hover:border-violet/40 hover:shadow-[0_0_40px_-12px_rgba(110,58,255,0.5)]'
  return (
    <div
      className={`glass group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 ${ring} ${className}`}
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
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-aurora">
        {icon}
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-semibold leading-tight text-foreground">{title}</h3>
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
    <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            value === o.id
              ? 'bg-aurora text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground'
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
      <span className="font-mono text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
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
  const [transfer, setTransfer] = useState<(typeof transferSizes)[number]['id']>('small')
  const [sommaroya, setSommaroya] = useState<(typeof sommaroyaCars)[number]['id']>('small')
  
  // Booking modal state
  const [selectedPackage, setSelectedPackage] = useState<BookingDetails | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const transferPrice = transfer === 'small' ? '490 kr' : '850 kr'
  const sommaroyaPrice = sommaroya === 'small' ? '5,000 kr' : '9,000 kr'

  const handleBooking = (title: string, price: string, option?: string) => {
    setSelectedPackage({ title, price, option })
    setIsSubmitted(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => {
      setSelectedPackage(null)
      setIsSubmitted(false)
    }, 2500)
  }

  return (
    <section id="tours" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20">
      <div className="mb-12 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-aurora">Tours &amp; Transfers</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Choose your Arctic expedition
        </h2>
        <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
          Private, chauffeured and endlessly flexible. Configure passengers and vehicles for an
          instant, all-inclusive rate.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {/* Card 1 — Airport Transfer (toggle) */}
        <Card className="md:col-span-2" glow="aurora">
          <CardHead icon={<Plane className="h-5 w-5" />} eyebrow="Point to Point" title="Airport Transfer" />
          <SegToggle options={transferSizes} value={transfer} onChange={setTransfer} />
          <div className="mt-4">
            <Price value={transferPrice} />
            <p className="mt-1 text-xs text-muted-foreground">
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
            className="mt-6 w-full rounded-2xl border border-aurora/30 bg-aurora/10 py-3 text-sm font-semibold text-aurora transition-all hover:bg-aurora hover:text-black"
          >
            Book Transfer
          </button>
        </Card>

        {/* Card 2 — Private Group (hero) */}
        <Card className="md:col-span-4 md:row-span-2" glow="violet">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet/20 blur-[90px]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <CardHead
                icon={<Sparkles className="h-5 w-5" />}
                eyebrow="Signature Experience"
                title="Northern Lights Tour — Private Group"
              />
              <span className="glass shrink-0 rounded-full border border-violet/40 px-3 py-1.5 text-xs font-semibold text-violet">
                Most Booked
              </span>
            </div>
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              An exclusive private group expedition for 2 to 8 guests. Your own heated vehicle and a
              route customized in real time to hunt the clearest, most active skies.
            </p>

            <div className="mt-6 flex items-baseline gap-3">
              <Price value="15,000 kr" />
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
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
                className="w-full rounded-2xl bg-violet py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_36px_-6px_rgba(110,58,255,0.85)] sm:w-auto sm:px-8"
              >
                Reserve Private Group
              </button>
            </div>
          </div>
        </Card>

        {/* Card 3 — Per Person */}
        <Card className="md:col-span-2" glow="aurora">
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
            className="mt-6 w-full rounded-2xl border border-aurora/30 bg-aurora/10 py-3 text-sm font-semibold text-aurora transition-all hover:bg-aurora hover:text-black"
          >
            Book Ticket
          </button>
        </Card>

        {/* Card 4 — Private Small Group */}
        <Card className="md:col-span-3" glow="violet">
          <CardHead
            icon={<Users className="h-5 w-5" />}
            eyebrow="Family & Friends"
            title="Northern Lights — Private Small Group"
          />
          <div className="flex items-baseline justify-between">
            <Price value="11,000 kr" />
            <span className="text-xs text-muted-foreground">1 to 4 persons</span>
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
            className="mt-6 w-full rounded-2xl bg-white/10 py-3 text-sm font-semibold text-foreground hover:bg-violet transition-all"
          >
            Book Small Group
          </button>
        </Card>

        {/* Card 5 — Sommarøya (vehicle selector) */}
        <Card className="md:col-span-3" glow="aurora">
          <CardHead icon={<Waves className="h-5 w-5" />} eyebrow="Coastal Scenic" title="Sommarøya Tour" />
          <SegToggle options={sommaroyaCars} value={sommaroya} onChange={setSommaroya} />
          <div className="mt-4 flex items-baseline justify-between">
            <Price value={sommaroyaPrice} />
            <span className="text-xs text-muted-foreground">
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
            className="mt-6 w-full rounded-2xl border border-aurora/30 bg-aurora/10 py-3 text-sm font-semibold text-aurora transition-all hover:bg-aurora hover:text-black"
          >
            Book Scenic Tour
          </button>
        </Card>
      </div>

      {/* Booking Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {isSubmitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aurora/20 text-aurora">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">Booking Request Sent</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We will contact you shortly to confirm your reservation for {selectedPackage.title}.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-widest text-aurora">Reservation</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">{selectedPackage.title}</h3>
                  <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-mono text-aurora font-semibold">{selectedPackage.price}</span>
                    {selectedPackage.option && <span>• {selectedPackage.option}</span>}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          required
                          type="email"
                          placeholder="john@example.com"
                          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          required
                          type="tel"
                          placeholder="+47 000 00 000"
                          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          required
                          type="date"
                          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          type="time"
                          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-6 w-full rounded-xl bg-aurora py-3 text-sm font-semibold text-black transition-all hover:bg-aurora/90"
                  >
                    Confirm Booking
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