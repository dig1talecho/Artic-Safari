'use client'
import { insertBooking } from '@/services/bookings.service'
import { useSpamGuard } from '@/lib/use-spam-guard'
import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, CalendarDays, Compass, ArrowRight, Navigation, Users, Search, User, Mail, Phone, Loader2 } from 'lucide-react'
import type { Tour } from '@/services/tours.service'
import type { GeocodeResult } from '@/app/api/geocode/search/route'

const LiveMap = dynamic(() => import('./live-map').then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="h-36 w-full animate-pulse rounded-2xl bg-[var(--home-surface-soft)]" />,
})

const LIVE_LOCATION = 'live-location'

const pickups = [
  { value: 'Tromsø Airport (TOS)', label: 'Tromsø Airport (TOS)' },
  { value: 'Tromsø City Center', label: 'Tromsø City Center' },
  { value: LIVE_LOCATION, label: '📍 Use My Live Location' },
]

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
  const [pickup, setPickup] = useState(pickups[0].value)
  const [dropoff, setDropoff] = useState('')
  const [fleet, setFleet] = useState(fleets[0].id)
  const [date, setDate] = useState('')
  const [tour, setTour] = useState(tourOptions[0].id)

  // Müşteri bilgileri state'leri
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = useState('')
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState('')

  const price = useMemo(() => {
    if (mode === 'taxi') {
      return fleets.find((f) => f.id === fleet)?.price ?? 0
    }
    return tourOptions.find((t) => t.id === tour)?.price ?? 0
  }, [mode, fleet, tour, tourOptions])

  function requestLiveLocation() {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('error')
      setGeoError('Geolocation is not supported on this device.')
      return
    }

    setGeoStatus('locating')
    setGeoError('')
    setCoords(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setGeoStatus('success')
      },
      (error) => {
        setGeoStatus('error')
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access or pick a point.'
            : 'Unable to retrieve your location. Please try again.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  function handlePickupChange(value: string) {
    setPickup(value)
    if (value === LIVE_LOCATION) {
      requestLiveLocation()
    } else {
      setGeoStatus('idle')
      setGeoError('')
      setCoords(null)
    }
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

      const pickupText = pickup === LIVE_LOCATION && coords
        ? `Live Location (https://maps.google.com/?q=${coords.lat},${coords.lng})`
        : pickup

      const { data, error } = await insertBooking({
        customer_name: customerName.trim() || 'Guest User',
        customer_email: customerEmail.trim() || 'pending@articsafaritour.com',
        customer_phone: customerPhone.trim() || null,
        booking_type: mode === 'taxi' ? 'transfer' : 'tour',
        item_title: mode === 'taxi' ? `${selectedFleet?.label} Fleet` : selectedTour?.label,
        booking_date: date || new Date().toISOString().split('T')[0],
        total_price: price,
        notes: mode === 'taxi' ? `Pickup: ${pickupText} - Dropoff: ${dropoff || 'N/A'}` : '',
        status: 'pending'
      })

      if (error) {
        console.error('Supabase detayli hata:', error)
        setReserving(false)
        setReserveError('Could not save your reservation. Please try again or contact us on WhatsApp directly.')
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

      const pickupText = pickup === LIVE_LOCATION && coords
        ? `Live Location (https://maps.google.com/?q=${coords.lat},${coords.lng})`
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
Estimated Total: ${formatKr(price)}
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
Total Price: ${formatKr(price)}
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
      <div className="rounded-[1.35rem] border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-4 sm:p-5">
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
              type="tel"
              autoComplete="tel"
              placeholder="+47 000 00 000"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none placeholder:text-[var(--home-muted)]/60"
            />
          </Field>
        </div>

        {mode === 'taxi' ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Field icon={<MapPin className="h-4 w-4" />} label="Pickup Point">
              <select
                value={pickup}
                onChange={(e) => handlePickupChange(e.target.value)}
                className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none [&>option]:bg-white"
              >
                {pickups.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {pickup === LIVE_LOCATION && (
                <span className="mt-1 text-[11px] normal-case tracking-normal">
                  {geoStatus === 'locating' && (
                    <span className="text-[var(--home-muted)]">Locating you…</span>
                  )}
                  {geoStatus === 'success' && coords && (
                    <span className="font-mono text-[var(--home-accent)] tabular-nums">
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </span>
                  )}
                  {geoStatus === 'error' && (
                    <button
                      type="button"
                      onClick={requestLiveLocation}
                      className="text-left text-destructive underline underline-offset-2"
                    >
                      {geoError} Retry
                    </button>
                  )}
                </span>
              )}
            </Field>

            <AddressAutocomplete value={dropoff} onChange={setDropoff} />

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
            <Field icon={<Compass className="h-4 w-4" />} label="Tour Selection">
              <select
                value={tour}
                onChange={(e) => setTour(e.target.value)}
                className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none [&>option]:bg-white"
              >
                {tourOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field icon={<CalendarDays className="h-4 w-4" />} label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm text-[var(--home-foreground)] outline-none [color-scheme:light]"
              />
            </Field>
          </div>
        )}

        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3">
            <span className="text-xs text-[var(--home-muted)]">Instant estimate</span>
            <span className="font-mono text-2xl font-semibold tracking-tight text-[var(--home-foreground)] tabular-nums">
              {formatKr(price)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleReserve}
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
      </div>
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
}: {
  value: string
  onChange: (value: string) => void
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

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  function handleSelect(result: GeocodeResult) {
    onChange(result.name)
    setSelected(true)
    setSelectedResult(result)
    setOpen(false)
  }

  return (
    <div ref={containerRef} onBlur={handleBlur} className="relative">
      <label className="flex flex-col gap-1.5 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-3 transition-[border-color,background-image] focus-within:border-[var(--home-accent)] focus-within:[background-image:radial-gradient(160px_60px_at_15%_50%,var(--home-accent-soft),transparent_70%)]">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--home-muted)]">
          <span className="text-[var(--home-accent)]">
            <Navigation className="h-4 w-4" />
          </span>
          Dropoff Destination
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
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search hotel, address, or landmark"
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

      {selectedResult && (
        <div className="mt-2">
          <LiveMap lat={selectedResult.lat} lon={selectedResult.lon} />
        </div>
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
