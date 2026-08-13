'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { insertBooking } from '@/services/bookings.service'
import type { Tour } from '@/services/tours.service'
import { useSession } from '@/lib/use-session'
import { useCustomerProfile } from '@/lib/use-customer-profile'
import { useSpamGuard } from '@/lib/use-spam-guard'
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
  index = 0,
}: {
  className?: string
  children: React.ReactNode
  glow?: 'accent' | 'gold'
  index?: number
}) {
  const reduceMotion = useReducedMotion()
  const ring = glow === 'gold' ? 'hover:border-[var(--home-gold)]/50' : 'hover:border-[var(--home-accent)]/40'
  const glowShadow =
    glow === 'gold'
      ? 'hover:shadow-[0_16px_40px_-12px_rgba(11,31,42,0.16),0_0_50px_-12px_rgba(216,183,131,0.35)]'
      : 'hover:shadow-[0_16px_40px_-12px_rgba(11,31,42,0.16),0_0_50px_-12px_rgba(127,208,224,0.35)]'

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 32 + (index % 2) * 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 ${glowShadow} ${ring} ${className}`}
    >
      {children}
    </motion.div>
  )
}

function CardImage({
  src,
  alt,
  tall = false,
}: {
  src: string
  alt: string
  tall?: boolean
}) {
  return (
    <div
      className={`relative -mx-6 -mt-6 mb-5 overflow-hidden ${tall ? 'h-44 sm:h-56' : 'h-36 sm:h-40'}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        loading="lazy"
        className="object-cover"
        sizes="(min-width: 768px) 500px, 100vw"
      />
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

interface TourPackagesProps {
  toursBySlug?: Record<string, Tour>
}

export function TourPackages({ toursBySlug = {} }: TourPackagesProps) {
  // CMS content (title/price/image) overrides the hardcoded fallback below when
  // an admin has edited that tour in /admin -> Tour Catalog. Per-option pricing
  // (small/large, small/big car) and the feature bullet icons stay hand-authored
  // -- the tours table doesn't model per-variant prices, and icons aren't CMS data.
  const t = (slug: string) => toursBySlug[slug]

  const { session } = useSession()
  const { profile: customerProfile } = useCustomerProfile(session)
  const isSignedIn = Boolean(customerProfile)
  const spamGuard = useSpamGuard()

  const [transfer, setTransfer] = useState<(typeof transferSizes)[number]['id']>('small')
  const [sommaroya, setSommaroya] = useState<(typeof sommaroyaCars)[number]['id']>('small')

  // Booking modal state
  const [selectedPackage, setSelectedPackage] = useState<BookingDetails | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

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
    setStep(1)
    spamGuard.reset()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPackage) return

    if (spamGuard.isSpam()) {
      // Silently skip the insert for bot-like submissions without tipping them off.
      setIsSubmitted(true)
      setTimeout(() => {
        setSelectedPackage(null)
        setIsSubmitted(false)
      }, 2500)
      return
    }

    setLoading(true)

    // Fiyat metninden sadece sayısal değeri ayıkla (Örn: "15,000 kr" -> 15000)
    const numericPrice = parseInt(selectedPackage.price.replace(/[^0-9]/g, '')) || 0

    try {
      const { data, error } = await insertBooking({
        customer_name: fullName.trim() || 'Guest User',
        customer_email: email.trim() || 'pending@articsafaritour.com',
        customer_phone: phone.trim() || null,
        booking_type: selectedPackage.title.includes('Transfer') ? 'transfer' : 'tour',
        item_title: `${selectedPackage.title}${selectedPackage.option ? ` (${selectedPackage.option})` : ''}`,
        booking_date: date || new Date().toISOString().split('T')[0],
        scheduled_time: time || null,
        total_price: numericPrice,
        notes: time ? `Preferred Time: ${time}` : 'Direct package booking',
        status: 'pending'
      })

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
        <Card className="md:col-span-2" glow="gold" index={0}>
          <CardImage
            src={t('airport-transfer')?.cover_image || '/gallery/airport-transfer.jpg'}
            alt={t('airport-transfer')?.cover_image_alt || 'Private VIP vehicles used for premium airport transfer service'}
          />
          <CardHead
            icon={<Plane className="h-5 w-5" />}
            eyebrow={t('airport-transfer')?.eyebrow || 'Point to Point'}
            title={t('airport-transfer')?.title || 'Airport Transfer'}
          />
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
            className="mt-6 w-full rounded-xl border-2 border-[var(--home-foreground)] bg-[var(--home-surface-soft)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-[background-color,color,scale] hover:bg-[var(--home-foreground)] hover:text-white active:scale-[0.96]"
          >
            Book Transfer
          </button>
        </Card>

        {/* Card 2 — Private Group (hero) */}
        <Card className="md:col-span-4 md:row-span-2" index={1}>
          <div className="relative flex h-full flex-col">
            <CardImage
              src={t('northern-lights-private-group')?.cover_image || '/gallery/northern-lights-private-group.jpg'}
              alt={t('northern-lights-private-group')?.cover_image_alt || 'Private group watching the Northern Lights over a fjord near Tromsø'}
              tall
            />
            <div className="flex items-start justify-between gap-4">
              <CardHead
                icon={<Sparkles className="h-5 w-5" />}
                eyebrow={t('northern-lights-private-group')?.eyebrow || 'Signature Experience'}
                title={t('northern-lights-private-group')?.title || 'Northern Lights Tour — Private Group'}
              />
              <span
                className="shrink-0 bg-[var(--home-gold)] py-1.5 pl-3.5 pr-5 text-xs font-bold uppercase tracking-wide text-white [clip-path:polygon(0%_0%,100%_0%,85%_50%,100%_100%,0%_100%)]"
              >
                Most Booked
              </span>
            </div>
            <p className="max-w-md text-pretty leading-relaxed text-[var(--home-muted)]">
              {t('northern-lights-private-group')?.intro ||
                'An exclusive private group expedition for 2 to 8 guests. Your own heated vehicle and a route customized in real time to hunt the clearest, most active skies.'}
            </p>

            <div className="mt-6 flex items-baseline gap-3">
              <Price value={t('northern-lights-private-group')?.price || '15,000 kr'} />
              <span className="rounded-full bg-[var(--home-surface-soft)] px-3 py-1 text-xs text-[var(--home-muted)]">
                {t('northern-lights-private-group')?.price_note || 'Flat rate · up to 8 guests'}
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
                onClick={() =>
                  handleBooking(
                    t('northern-lights-private-group')?.title || 'Northern Lights — Private Group',
                    t('northern-lights-private-group')?.price || '15,000 kr',
                    'Up to 8 guests',
                  )
                }
                className="w-full rounded-xl bg-[var(--home-accent)] py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_6px_0_0_#0876a8] transition-[opacity,scale,box-shadow] hover:opacity-90 active:translate-y-1 active:scale-[0.98] active:shadow-[0_2px_0_0_#0876a8] sm:w-auto sm:px-8"
              >
                Reserve Private Group
              </button>
            </div>
          </div>
        </Card>

        {/* Card 3 — Per Person */}
        <Card className="md:col-span-2" glow="gold" index={2}>
          <CardImage
            src={t('northern-lights-per-person')?.cover_image || '/gallery/northern-lights-per-person.jpg'}
            alt={t('northern-lights-per-person')?.cover_image_alt || 'Small group of travelers on a shared Northern Lights tour in Norway'}
          />
          <CardHead
            icon={<User className="h-5 w-5" />}
            eyebrow={t('northern-lights-per-person')?.eyebrow || 'Solo & Couples'}
            title={t('northern-lights-per-person')?.title || 'Northern Lights — Per Person'}
          />
          <Price value={t('northern-lights-per-person')?.price || '2,250 kr'} suffix="/ person" />
          <ul className="mt-5 space-y-2.5">
            <Feature icon={<Users className="h-3 w-3" />}>Shared small-group chase</Feature>
            <Feature icon={<Sparkles className="h-3 w-3" />}>Expert aurora guide</Feature>
            <Feature icon={<Coffee className="h-3 w-3" />}>Hot drinks included</Feature>
          </ul>
          <button
            type="button"
            onClick={() =>
              handleBooking(
                t('northern-lights-per-person')?.title || 'Northern Lights — Per Person',
                `${t('northern-lights-per-person')?.price || '2,250 kr'} / person`,
              )
            }
            className="mt-6 w-full rounded-xl border-2 border-[var(--home-foreground)] bg-[var(--home-surface-soft)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-[background-color,color,scale] hover:bg-[var(--home-foreground)] hover:text-white active:scale-[0.96]"
          >
            Book Ticket
          </button>
        </Card>

        {/* Card 4 — Private Small Group */}
        <Card className="md:col-span-3" index={3}>
          <CardImage
            src={t('northern-lights-small-group')?.cover_image || '/gallery/northern-lights-small-group.jpg'}
            alt={t('northern-lights-small-group')?.cover_image_alt || 'Vivid purple and green aurora borealis over snowy mountains near Tromsø'}
          />
          <CardHead
            icon={<Users className="h-5 w-5" />}
            eyebrow={t('northern-lights-small-group')?.eyebrow || 'Family & Friends'}
            title={t('northern-lights-small-group')?.title || 'Northern Lights — Private Small Group'}
          />
          <div className="flex items-baseline justify-between">
            <Price value={t('northern-lights-small-group')?.price || '11,000 kr'} />
            <span className="text-xs text-[var(--home-muted)]">
              {t('northern-lights-small-group')?.price_note || '1 to 4 persons'}
            </span>
          </div>
          <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Feature icon={<User className="h-3 w-3" />}>Private chauffeur</Feature>
            <Feature icon={<Route className="h-3 w-3" />}>Flexible timing</Feature>
            <Feature icon={<Thermometer className="h-3 w-3" />}>Thermal gear</Feature>
            <Feature icon={<Camera className="h-3 w-3" />}>Tripods provided</Feature>
          </ul>
          <button
            type="button"
            onClick={() =>
              handleBooking(
                t('northern-lights-small-group')?.title || 'Northern Lights — Private Small Group',
                t('northern-lights-small-group')?.price || '11,000 kr',
                '1 to 4 persons',
              )
            }
            className="mt-6 w-full rounded-xl bg-[var(--home-surface-soft)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-[background-color,color,scale] hover:bg-[var(--home-accent)] hover:text-white active:scale-[0.96]"
          >
            Book Small Group
          </button>
        </Card>

        {/* Card 5 — Sommarøya (vehicle selector) */}
        <Card className="md:col-span-3" glow="gold" index={4}>
          <CardImage
            src={t('sommaroya-tour')?.cover_image || '/gallery/sommaroya-tour.jpg'}
            alt={t('sommaroya-tour')?.cover_image_alt || 'Coastal road and fjord landscape on the way to Sommarøy, Norway'}
          />
          <CardHead
            icon={<Waves className="h-5 w-5" />}
            eyebrow={t('sommaroya-tour')?.eyebrow || 'Coastal Scenic'}
            title={t('sommaroya-tour')?.title || 'Sommarøya Tour'}
          />
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
            className="mt-6 w-full rounded-xl border-2 border-[var(--home-foreground)] bg-[var(--home-surface-soft)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-[background-color,color,scale] hover:bg-[var(--home-foreground)] hover:text-white active:scale-[0.96]"
          >
            Book Scenic Tour
          </button>
        </Card>
      </div>

      {/* Booking Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--home-foreground)]/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 shadow-[0_24px_64px_-16px_rgba(11,31,42,0.35)]">
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

                {/* Step progress */}
                <div className="mb-6 flex items-center gap-2">
                  {(['Date & Time', 'Your Details', 'Confirm'] as const).map((label, i) => {
                    const stepNum = (i + 1) as 1 | 2 | 3
                    return (
                      <div key={label} className="flex flex-1 items-center gap-2">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            step >= stepNum
                              ? 'bg-[var(--home-accent)] text-white'
                              : 'bg-[var(--home-surface-soft)] text-[var(--home-muted)]'
                          }`}
                        >
                          {step > stepNum ? <Check className="h-3 w-3" /> : stepNum}
                        </div>
                        <span
                          className={`hidden text-xs font-medium sm:block ${
                            step >= stepNum ? 'text-[var(--home-foreground)]' : 'text-[var(--home-muted)]'
                          }`}
                        >
                          {label}
                        </span>
                        {stepNum < 3 && <div className="h-px flex-1 bg-[var(--home-border)]" />}
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="company"
                    value={spamGuard.honeypot}
                    onChange={(e) => spamGuard.setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="sr-only"
                  />

                  {step === 1 && (
                    <>
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
                        type="button"
                        disabled={!date}
                        onClick={() => setStep(2)}
                        className="mt-2 w-full rounded-xl bg-[var(--home-accent)] py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        Continue
                      </button>
                    </>
                  )}

                  {step === 2 && (
                    <>
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

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="rounded-xl border-2 border-[var(--home-foreground)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-colors hover:bg-[var(--home-foreground)] hover:text-white"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={!isSignedIn && (!fullName || !email || !phone)}
                          onClick={() => setStep(3)}
                          className="flex-1 rounded-xl bg-[var(--home-accent)] py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          Continue
                        </button>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="space-y-2 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-4 text-sm">
                        <div className="flex justify-between text-[var(--home-foreground)]">
                          <span className="text-[var(--home-muted)]">Package</span>
                          <span className="font-medium">{selectedPackage.title}</span>
                        </div>
                        <div className="flex justify-between text-[var(--home-foreground)]">
                          <span className="text-[var(--home-muted)]">Date</span>
                          <span className="font-medium">
                            {date}
                            {time ? ` · ${time}` : ''}
                          </span>
                        </div>
                        <div className="flex justify-between text-[var(--home-foreground)]">
                          <span className="text-[var(--home-muted)]">Contact</span>
                          <span className="text-right font-medium">
                            {fullName}
                            <br />
                            {email}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-[var(--home-border)] pt-2 text-[var(--home-foreground)]">
                          <span className="text-[var(--home-muted)]">Price</span>
                          <span className="font-mono font-semibold text-[var(--home-accent)]">
                            {selectedPackage.price}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="rounded-xl border-2 border-[var(--home-foreground)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-colors hover:bg-[var(--home-foreground)] hover:text-white"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 rounded-xl bg-[var(--home-accent)] py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {loading ? 'Saving…' : 'Confirm Booking'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
