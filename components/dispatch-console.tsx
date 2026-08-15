'use client'
import { insertBooking } from '@/services/bookings.service'
import { useSpamGuard } from '@/lib/use-spam-guard'
import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  MapPin,
  CalendarDays,
  Compass,
  ArrowRight,
  Navigation,
  Users,
  Search,
  User,
  Mail,
  Phone,
  Loader2,
  Lock,
  ShieldCheck,
  BadgeCheck,
  LocateFixed,
  ExternalLink,
  Tag,
  ChevronDown,
  Check,
} from 'lucide-react'
import type { Tour } from '@/services/tours.service'
import type { GeocodeResult } from '@/app/api/geocode/search/route'
import { validatePromoCode, type PromoCodeInfo } from '@/services/partners.service'

const LiveMap = dynamic(() => import('./live-map').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="h-36 w-full animate-pulse rounded-2xl bg-[var(--home-surface-soft)]" />,
})

// Audit fix: these used to be permanently hardcoded and drifted out of sync
// with the Tour Catalog CMS (e.g. per-person stayed at 2,000 kr after the
// live price moved to 2,250 kr). Falls back to the last-known-correct value
// only when the CMS hasn't loaded/has no row for that tour yet.
function parsePriceNumber(price: string | undefined, fallback: number): number {
  if (!price) return fallback
  const n = parseInt(price.replace(/[^0-9]/g, ''), 10)
  return Number.isNaN(n) ? fallback : n
}

function getTourOptions(toursBySlug: Record<string, Tour>) {
  return [
    {
      id: 'private-group',
      label: 'Northern Lights (Private Group)',
      price: parsePriceNumber(toursBySlug['northern-lights-private-group']?.price, 15000),
    },
    {
      id: 'per-person',
      label: 'Northern Lights (Per Person)',
      price: parsePriceNumber(toursBySlug['northern-lights-per-person']?.price, 2250),
    },
    {
      id: 'small-group',
      label: 'Northern Lights (Private Small Group)',
      price: parsePriceNumber(toursBySlug['northern-lights-small-group']?.price, 11000),
    },
    {
      id: 'sommaroya',
      label: 'Sommarøya Tour',
      price: parsePriceNumber(toursBySlug['sommaroya-tour']?.price, 5000),
    },
  ]
}

const fleets = [
  { id: 'small', label: 'Small', hint: '1–4', price: 490 },
  { id: 'large', label: 'Large', hint: '4–8', price: 890 },
]

const modes = [
  { id: 'taxi', label: 'VIP Taxi & Transfer' },
  { id: 'tours', label: 'Northern Lights Tours' },
] as const

type Mode = (typeof modes)[number]['id']

function formatKr(value: number) {
  return `${value.toLocaleString('en-US')} kr`
}

type GeoStatus = 'idle' | 'locating' | 'success' | 'error'

interface DispatchConsoleProps {
  toursBySlug?: Record<string, Tour>
}

export function DispatchConsole({ toursBySlug = {} }: DispatchConsoleProps) {
  const tourOptions = useMemo(() => getTourOptions(toursBySlug), [toursBySlug])

  const spamGuard = useSpamGuard()
  const [mode, setMode] = useState<Mode>('taxi')
  const [pickup, setPickup] = useState('')
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [dropoff, setDropoff] = useState('')
  const [fleet, setFleet] = useState(fleets[0].id)
  const [date, setDate] = useState('')
  const [tour, setTour] = useState(tourOptions[0].id)

  // Müşteri bilgileri state'leri
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [geoError, setGeoError] = useState('')
  const [liveLocationNonce, setLiveLocationNonce] = useState(0)
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState('')

  const [promoInput, setPromoInput] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeInfo | null>(null)

  const price = useMemo(() => {
    if (mode === 'taxi') {
      return fleets.find((f) => f.id === fleet)?.price ?? 0
    }
    return tourOptions.find((t) => t.id === tour)?.price ?? 0
  }, [mode, fleet, tour, tourOptions])

  // Bounds the native date picker so it can't be set to a bogus past/far-
  // future date (e.g. year 0002) -- the server-side check in
  // bookingInsertSchema is the real gate, this is just so the picker
  // itself doesn't offer nonsense.
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const maxDateStr = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 2)
    return d.toISOString().split('T')[0]
  }, [])

  const discountAmount = appliedPromo ? Math.round((price * appliedPromo.customer_discount_percent) / 100) : 0
  const finalPrice = price - discountAmount

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    setPromoChecking(true)
    setPromoError('')
    const info = await validatePromoCode(promoInput)
    setPromoChecking(false)
    if (!info) {
      setPromoError('That code isn’t valid or has expired.')
      setAppliedPromo(null)
      return
    }
    setAppliedPromo(info)
  }

  function requestLiveLocation() {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('error')
      setGeoError('Geolocation is not supported on this device.')
      return
    }

    setGeoStatus('locating')
    setGeoError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickupCoords({ lat: position.coords.latitude, lon: position.coords.longitude })
        setGeoStatus('success')
        // Bumps the sync effect inside the Pickup Point combobox so it
        // adopts this as its selection, the same way picking a search
        // result does -- one flow instead of a separate "live" mode.
        setLiveLocationNonce((n) => n + 1)
      },
      (error) => {
        setGeoStatus('error')
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access or search a pickup address.'
            : 'Unable to retrieve your location. Please try again.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const handleReserve = async () => {
    if (spamGuard.isSpam()) {
      // Silently skip bot-like submissions — no insert, no WhatsApp redirect.
      return
    }

    setReserveError('')
    setReserving(true)

    const phoneNumber = "4792997190"

    // 1. Supabase Veritabanına Dinamik Kayıt ve Hata Yakalama
    try {
      const selectedFleet = fleets.find((f) => f.id === fleet)
      const selectedTour = tourOptions.find((t) => t.id === tour)

      const pickupText = pickupCoords
        ? `${pickup || 'Pickup Location'} (https://maps.google.com/?q=${pickupCoords.lat},${pickupCoords.lon})`
        : pickup

      const { data, error } = await insertBooking({
        customer_name: customerName.trim() || 'Guest User',
        customer_email: customerEmail.trim() || 'pending@articsafaritour.com',
        customer_phone: customerPhone.trim() || null,
        booking_type: mode === 'taxi' ? 'transfer' : 'tour',
        item_title: mode === 'taxi' ? `${selectedFleet?.label} Fleet` : selectedTour?.label,
        booking_date: date || new Date().toISOString().split('T')[0],
        total_price: finalPrice,
        notes: mode === 'taxi' ? `Pickup: ${pickupText} - Dropoff: ${dropoff || 'N/A'}` : '',
        status: 'pending',
        promo_code: appliedPromo?.promo_code ?? null,
      })

      if (error) {
        console.error('Supabase detayli hata:', error)
        setReserving(false)
        setReserveError(
          error.message || 'Could not save your reservation. Please try again or contact us on WhatsApp directly.',
        )
        return
      }
      console.log('Supabase kayit basarili:', data)
    } catch (err) {
      console.error('Supabase beklenmeyen hata:', err)
      setReserving(false)
      setReserveError('Something went wrong. Please try again or contact us on WhatsApp directly.')
      return
    }

    setReserving(false)

    // 2. WhatsApp Mesajını Oluştur ve Gönder
    let plainText = ""

    if (mode === 'taxi') {
      const selectedFleet = fleets.find((f) => f.id === fleet)

      const pickupText = pickupCoords
        ? `${pickup || 'Pickup Location'} (https://maps.google.com/?q=${pickupCoords.lat},${pickupCoords.lon})`
        : pickup

      plainText =
`*ARTIC SAFARI - VIP TRANSFER BOOKING*
----------------------------------------
Customer: ${customerName || 'Guest'}
Email: ${customerEmail || 'N/A'}
Phone: ${customerPhone || 'N/A'}
Pickup: ${pickupText}
Dropoff: ${dropoff || 'Not specified'}
Vehicle: ${selectedFleet?.label} Fleet (${selectedFleet?.hint} Passengers)
${appliedPromo ? `Promo Code: ${appliedPromo.promo_code} (-${appliedPromo.customer_discount_percent}%)\n` : ''}Estimated Total: ${formatKr(finalPrice)}
----------------------------------------
Please confirm availability and dispatch driver.`
    } else {
      const selectedTour = tourOptions.find((t) => t.id === tour)

      plainText =
`*ARTIC SAFARI - TOUR RESERVATION*
----------------------------------------
Customer: ${customerName || 'Guest'}
Email: ${customerEmail || 'N/A'}
Phone: ${customerPhone || 'N/A'}
Tour Package: ${selectedTour?.label}
Selected Date: ${date || 'Not specified'}
${appliedPromo ? `Promo Code: ${appliedPromo.promo_code} (-${appliedPromo.customer_discount_percent}%)\n` : ''}Total Price: ${formatKr(finalPrice)}
----------------------------------------
Please confirm booking for this date.`
    }

    const encodedMessage = encodeURIComponent(plainText)
    window.open(`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`, '_blank')
  }

  return (
    <div
      className="animate-float-up rounded-3xl border border-[var(--home-glass-border)] bg-[var(--home-glass)] p-2 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.75)_0%,black_10%,black_90%,rgba(0,0,0,0.75)_100%)]"
      style={{ animationDelay: '0.3s' }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleReserve()
        }}
        className="rounded-[1.35rem] border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-4 sm:p-5"
      >
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
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--home-muted)]">
            Dispatch Console
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--home-accent)]">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--home-gold)]" />
            Live pricing
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Dispatch mode"
          className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] p-1"
        >
          {modes.map((m) => (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                mode === m.id
                  ? 'bg-[var(--home-accent)] text-white'
                  : 'text-[var(--home-muted)] hover:text-[var(--home-foreground)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Müşteri İletişim Bilgileri Alanı */}
        <div className="mb-3 grid gap-3 md:grid-cols-3">
          <Field icon={<User className="h-4 w-4" />} label="Full Name">
            <input
              required
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none placeholder:text-[var(--home-muted)]/60"
            />
          </Field>

          <Field icon={<Mail className="h-4 w-4" />} label="Email Address">
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none placeholder:text-[var(--home-muted)]/60"
            />
          </Field>

          <Field icon={<Phone className="h-4 w-4" />} label="Phone Number">
            <input
              required
              type="tel"
              autoComplete="tel"
              placeholder="+47 000 00 000"
              pattern="^[+]?[\d\s()-]{7,20}$"
              title="Enter a valid phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none placeholder:text-[var(--home-muted)]/60"
            />
          </Field>
        </div>

        {mode === 'taxi' ? (
          <div className="grid gap-3 md:grid-cols-3">
            <AddressAutocomplete
              value={pickup}
              onChange={(v) => setPickup(v)}
              label="Pickup Point"
              fieldIcon={<MapPin className="h-4 w-4" />}
              placeholder="Search any address in Tromsø"
              onCoordsChange={setPickupCoords}
              onRequestLiveLocation={requestLiveLocation}
              liveLocating={geoStatus === 'locating'}
              liveError={geoStatus === 'error' ? geoError : undefined}
              liveLocation={pickupCoords ? { coords: pickupCoords, nonce: liveLocationNonce } : null}
            />

            <AddressAutocomplete
              value={dropoff}
              onChange={setDropoff}
              label="Dropoff Destination"
              fieldIcon={<Navigation className="h-4 w-4" />}
              placeholder="Search hotel, address, or landmark"
            />

            <Field icon={<Users className="h-4 w-4" />} label="Fleet Size">
              <div className="flex gap-1">
                {fleets.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={fleet === f.id}
                    onClick={() => setFleet(f.id)}
                    className={`flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                      fleet === f.id
                        ? 'bg-[var(--home-accent-soft)] text-[var(--home-foreground)] ring-1 ring-[var(--home-accent)]/40'
                        : 'text-[var(--home-muted)] hover:text-[var(--home-foreground)]'
                    }`}
                  >
                    {f.label}
                    <span className="ml-1 text-[var(--home-muted)]">{f.hint}</span>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <StyledSelect
              icon={<Compass className="h-4 w-4" />}
              label="Tour Selection"
              value={tour}
              options={tourOptions}
              onChange={setTour}
            />

            <Field icon={<CalendarDays className="h-4 w-4" />} label="Date">
              <input
                type="date"
                value={date}
                min={todayStr}
                max={maxDateStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none [color-scheme:dark]"
              />
            </Field>
          </div>
        )}

        <div className="mt-4">
          {appliedPromo ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--home-accent)]/25 bg-[var(--home-accent-soft)] px-3.5 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-[var(--home-accent)]">
                <Tag className="h-3.5 w-3.5" />
                {appliedPromo.customer_discount_percent}% off applied · {appliedPromo.hotel_name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAppliedPromo(null)
                  setPromoInput('')
                }}
                className="font-medium text-[var(--home-muted)] underline underline-offset-2 hover:text-[var(--home-foreground)]"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--home-muted)]">
                <Tag className="h-3 w-3 text-[var(--home-accent)]" />
                Have a partner promo code? Enter it for an instant discount
              </p>
              <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Promo code (optional)"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase())
                    setPromoError('')
                  }}
                  className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] py-2.5 pl-10 pr-4 text-sm uppercase text-[var(--home-foreground)] outline-none focus:border-[var(--home-accent)]"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoChecking || !promoInput.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--home-border)] px-4 py-2.5 text-sm font-semibold text-[var(--home-foreground)] transition-colors hover:bg-[var(--home-surface)] disabled:opacity-40"
              >
                {promoChecking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Apply
              </button>
              </div>
            </div>
          )}
          {promoError && <p className="mt-1 text-xs font-medium text-rose-500">{promoError}</p>}
        </div>

        <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3">
            <span className="text-xs text-[var(--home-muted)]">Instant estimate</span>
            {appliedPromo && (
              <span className="font-mono text-sm text-[var(--home-muted)] line-through">{formatKr(price)}</span>
            )}
            <span className="font-mono text-2xl font-semibold tracking-tight text-[var(--home-foreground)] tabular-nums">
              {formatKr(finalPrice)}
            </span>
          </div>
          <button
            type="submit"
            disabled={reserving}
            className="group inline-flex items-center justify-center gap-2 rounded-[10px] bg-[image:var(--home-gradient-cta)] px-6 py-3.5 text-sm font-semibold text-[var(--home-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-10px_rgba(51,187,207,0.5)] active:translate-y-0 active:scale-[0.98] disabled:opacity-60"
          >
            {reserving ? 'Reserving…' : 'Reserve Dispatch'}
            {!reserving && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
          </button>
        </div>
        {reserveError && (
          <p className="mt-2 text-xs font-medium text-rose-500">{reserveError}</p>
        )}

        {/* Honest trust signals only -- no payment-network logos until a
            real processor is actually connected. */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--home-border)] pt-4">
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--home-muted)]">
            <Lock className="h-3.5 w-3.5 text-[var(--home-accent)]" />
            Encrypted Connection
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--home-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--home-accent)]" />
            Secure Booking Request
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--home-muted)]">
            <BadgeCheck className="h-3.5 w-3.5 text-[var(--home-accent)]" />
            WhatsApp Confirmed
          </span>
        </div>
      </form>
    </div>
  )
}

/**
 * Real-time destination search: every keystroke (debounced 250ms) queries
 * /api/geocode/search, which proxies Photon (a keyless, prefix-aware OSM
 * geocoder) scoped to the Tromsø region -- so "t" genuinely surfaces
 * Tromsø Airport, Tromsø domkirke, Tromsdalen, etc. as the user types,
 * not a fixed local list. Selecting a result drops a live pin on an
 * inline map at its real coordinates.
 */
function AddressAutocomplete({
  value,
  onChange,
  label,
  fieldIcon,
  placeholder,
  onCoordsChange,
  liveLocation,
  onRequestLiveLocation,
  liveLocating,
  liveError,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  fieldIcon: React.ReactNode
  placeholder: string
  onCoordsChange?: (coords: { lat: number; lon: number } | null) => void
  liveLocation?: { coords: { lat: number; lon: number }; nonce: number } | null
  onRequestLiveLocation?: () => void
  liveLocating?: boolean
  liveError?: string
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<GeocodeResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = value.trim()
    if (selected || q.length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        const data = await res.json()
        setResults(res.ok ? (data.results ?? []) : [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value, selected])

  // Adopts a device-geolocation pickup ("Live" button) into this combobox
  // exactly as if it were a chosen search result -- same map pin, same
  // Open in Maps buttons -- instead of a separate hardcoded "live" mode.
  useEffect(() => {
    if (!liveLocation) return
    const label = `My Current Location (${liveLocation.coords.lat.toFixed(4)}, ${liveLocation.coords.lon.toFixed(4)})`
    onChange(label)
    setSelected(true)
    setSelectedResult({
      id: 'live-location',
      name: label,
      address: '',
      lat: liveLocation.coords.lat,
      lon: liveLocation.coords.lon,
      type: 'live',
    })
    setOpen(false)
    // Only re-sync when a fresh location comes in, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveLocation?.nonce])

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  function handleSelect(result: GeocodeResult) {
    onChange(result.name)
    setSelected(true)
    setSelectedResult(result)
    onCoordsChange?.({ lat: result.lat, lon: result.lon })
    setOpen(false)
  }

  return (
    <div ref={containerRef} onBlur={handleBlur} className="relative">
      <label className="flex flex-col gap-1.5 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3 transition-[border-color,background-image] focus-within:border-[var(--home-accent)] focus-within:[background-image:radial-gradient(160px_60px_at_15%_50%,var(--home-accent-soft),transparent_70%)]">
        <span className="flex items-center justify-between gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--home-muted)]">
            <span className="text-[var(--home-accent)]">{fieldIcon}</span>
            {label}
          </span>
          {onRequestLiveLocation && (
            <button
              type="button"
              onClick={onRequestLiveLocation}
              title="Use my current location"
              className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--home-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--home-accent)] transition-colors hover:bg-[var(--home-accent)] hover:text-white"
            >
              {liveLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
              Live
            </button>
          )}
        </span>
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--home-accent)]" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-[var(--home-muted)]" />
          )}
          <input
            type="text"
            autoComplete="off"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setSelected(false)
              setSelectedResult(null)
              onCoordsChange?.(null)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none placeholder:text-[var(--home-muted)]/60"
          />
          {selected && value && <MapPin className="h-4 w-4 shrink-0 text-[var(--home-accent)]" />}
        </div>
      </label>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] py-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]"
        >
          {results.map((r) => (
            <li key={r.id} role="option" aria-selected={value === r.name}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--home-surface-soft)]"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--home-accent)]" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-[var(--home-foreground)]">{r.name}</span>
                  {r.address && <span className="truncate text-xs text-[var(--home-muted)]">{r.address}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && value.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-2.5 text-xs text-[var(--home-muted)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]">
          No matches for “{value}” in the Tromsø area
        </div>
      )}
      {liveError && !open && (
        <button
          type="button"
          onClick={onRequestLiveLocation}
          className="mt-1 text-left text-[11px] text-destructive underline underline-offset-2"
        >
          {liveError} Retry
        </button>
      )}

      {selectedResult && (
        <div className="mt-2 space-y-2">
          <LiveMap lat={selectedResult.lat} lon={selectedResult.lon} />
          <MapOpenButtons lat={selectedResult.lat} lon={selectedResult.lon} />
        </div>
      )}
    </div>
  )
}

/**
 * One-tap navigation for whichever map app the viewer actually has --
 * Google Maps and Apple Maps both resolve to their native app via
 * universal links on mobile and fall back to the web viewer on desktop,
 * so this single pair of links covers "Google Maps, Apple Maps, or web."
 */
function MapOpenButtons({ lat, lon }: { lat: number; lon: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://www.google.com/maps?q=${lat},${lon}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-1.5 text-xs font-medium text-[var(--home-foreground)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)]"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Google Maps
      </a>
      <a
        href={`https://maps.apple.com/?ll=${lat},${lon}&q=Pickup+Location`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-1.5 text-xs font-medium text-[var(--home-foreground)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)]"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Apple Maps
      </a>
    </div>
  )
}

/**
 * Replaces a raw <select> -- browsers render its open dropdown with
 * unstyleable OS chrome (stark white box), which broke the dark
 * glassmorphic console. This renders the closed state AND the open list
 * entirely in our own markup instead.
 */
function StyledSelect({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  value: string
  options: readonly { id: string; label: string }[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
  }

  return (
    <div onBlur={handleBlur} className="relative">
      <label className="flex flex-col gap-1.5 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3 transition-[border-color,background-image] focus-within:border-[var(--home-accent)]">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--home-muted)]">
          <span className="text-[var(--home-accent)]">{icon}</span>
          {label}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex w-full items-center justify-between text-left text-sm text-[var(--home-foreground)] outline-none"
        >
          <span className="truncate">{selected?.label ?? 'Select…'}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--home-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </label>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] py-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]"
        >
          {options.map((o) => (
            <li key={o.id} role="option" aria-selected={o.id === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-[var(--home-surface-soft)] ${
                  o.id === value ? 'text-[var(--home-accent)]' : 'text-[var(--home-foreground)]'
                }`}
              >
                {o.label}
                {o.id === value && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3 transition-[border-color,background-image] focus-within:border-[var(--home-accent)] focus-within:[background-image:radial-gradient(160px_60px_at_15%_50%,var(--home-accent-soft),transparent_70%)]">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--home-muted)]">
        <span className="text-[var(--home-accent)]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  )
}
