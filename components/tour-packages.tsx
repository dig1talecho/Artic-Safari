'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import type { Tour } from '@/services/tours.service'
import { useSession } from '@/lib/use-session'
import { useCustomerProfile } from '@/lib/use-customer-profile'
import { BookingModal, type BookingModalTour } from '@/components/booking-modal'
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
      ? 'hover:shadow-[var(--home-card-shadow),0_0_40px_-14px_rgba(92,225,230,0.45)]'
      : 'hover:shadow-[var(--home-card-shadow),0_0_40px_-14px_rgba(51,187,207,0.35)]'

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 32 + (index % 2) * 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { y: -8, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
      style={{ backgroundImage: 'var(--home-gradient-card)' }}
      className={`group relative flex flex-col overflow-hidden rounded-[20px] border border-white/5 p-6 shadow-[var(--home-card-shadow)] transition-[box-shadow,border-color] duration-300 ${glowShadow} ${ring} ${className}`}
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

// The 5 cards below are hand-built (bespoke grid spans, toggles, the
// "Most Booked" ribbon) rather than mapped generically, so a new tour
// created in Tour Catalog wouldn't otherwise appear here. Any active tour
// whose slug isn't one of these 5 renders as a generic card in the
// dynamic section right after them instead.
const KNOWN_SLUGS = [
  'airport-transfer',
  'northern-lights-private-group',
  'northern-lights-per-person',
  'northern-lights-small-group',
  'sommaroya-tour',
]

interface TourPackagesProps {
  /** Editable from the admin Site Text screen. */
  heading?: string
  toursBySlug?: Record<string, Tour>
}

export function TourPackages({ toursBySlug = {}, heading = 'Tours & Transfers' }: TourPackagesProps) {
  // CMS content (title/price/image) overrides the hardcoded fallback below when
  // an admin has edited that tour in /admin -> Tour Catalog. Per-option pricing
  // (small/large, small/big car) and the feature bullet icons stay hand-authored
  // -- the tours table doesn't model per-variant prices, and icons aren't CMS data.
  const t = (slug: string) => toursBySlug[slug]

  // Any active CMS tour outside the 5 curated slugs above -- new tours
  // created in Tour Catalog show up here automatically.
  const extraTours = Object.values(toursBySlug).filter((tour) => !KNOWN_SLUGS.includes(tour.slug))

  const { session } = useSession()
  const { profile: customerProfile } = useCustomerProfile(session)
  const isSignedIn = Boolean(customerProfile)

  const [transfer, setTransfer] = useState<(typeof transferSizes)[number]['id']>('small')
  const [sommaroya, setSommaroya] = useState<(typeof sommaroyaCars)[number]['id']>('small')

  const [selectedPackage, setSelectedPackage] = useState<BookingModalTour | null>(null)

  // Minimum fares from the Taximeter screen. The real fare is the route's.
  const transferPrice = transfer === 'small' ? 'from 145 kr' : 'from 218 kr'
  const sommaroyaPrice = sommaroya === 'small' ? '5,000 kr' : '9,000 kr'

  const handleBooking = (title: string, price: string, option?: string, tourId?: string) => {
    setSelectedPackage({ title, price, option, id: tourId })
  }

  return (
    <section id="tours" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20">
      <div className="mb-12 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--home-accent)]">{heading}</p>
        <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--home-foreground)] sm:text-4xl">
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
            onClick={() => handleBooking('Airport Transfer', transferPrice, transfer === 'small' ? '1-4 Persons' : '4-8 Persons', t('airport-transfer')?.id)}
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
                    t('northern-lights-private-group')?.id,
                  )
                }
                style={{ backgroundImage: 'var(--home-gradient-cta)' }}
                className="w-full rounded-[10px] py-3.5 text-sm font-semibold text-[var(--home-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-10px_rgba(51,187,207,0.5)] active:translate-y-0 active:scale-[0.98] sm:w-auto sm:px-8"
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
                undefined,
                t('northern-lights-per-person')?.id,
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
                t('northern-lights-small-group')?.id,
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
            onClick={() => handleBooking('Sommarøya Tour', sommaroyaPrice, sommaroya === 'small' ? 'Small Car' : 'Big Car', t('sommaroya-tour')?.id)}
            className="mt-6 w-full rounded-xl border-2 border-[var(--home-foreground)] bg-[var(--home-surface-soft)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-[background-color,color,scale] hover:bg-[var(--home-foreground)] hover:text-white active:scale-[0.96]"
          >
            Book Scenic Tour
          </button>
        </Card>
      </div>

      {/* Additional tours created in the admin Tour Catalog beyond the 5
          curated experiences above -- rendered generically so new tours
          show up here without a code change. */}
      {extraTours.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {extraTours.map((tour, i) => (
            <Card key={tour.id} index={5 + i}>
              <CardImage src={tour.cover_image || '/aurora-hero.webp'} alt={tour.cover_image_alt || tour.title} />
              <CardHead
                icon={<Sparkles className="h-5 w-5" />}
                eyebrow={tour.eyebrow || 'New Experience'}
                title={tour.title}
              />
              {tour.intro && (
                <p className="text-sm leading-relaxed text-[var(--home-muted)]">{tour.intro}</p>
              )}
              <div className="mt-4 flex items-baseline justify-between">
                <Price value={tour.price} />
                {tour.price_note && <span className="text-xs text-[var(--home-muted)]">{tour.price_note}</span>}
              </div>
              <button
                type="button"
                onClick={() => handleBooking(tour.title, tour.price, undefined, tour.id)}
                className="mt-6 w-full rounded-xl border-2 border-[var(--home-foreground)] bg-[var(--home-surface-soft)] py-3 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-[background-color,color,scale] hover:bg-[var(--home-foreground)] hover:text-white active:scale-[0.96]"
              >
                Book Now
              </button>
            </Card>
          ))}
        </div>
      )}

      {selectedPackage && (
        <BookingModal
          tour={selectedPackage}
          isSignedIn={isSignedIn}
          prefill={{
            fullName: customerProfile?.full_name ?? '',
            email: customerProfile?.email ?? session?.user?.email ?? '',
            phone: customerProfile?.phone ?? '',
          }}
          onClose={() => setSelectedPackage(null)}
        />
      )}
    </section>
  )
}
