'use client'
import { supabase } from '@/lib/supabase';
import { useMemo, useRef, useState } from 'react'
import { MapPin, CalendarDays, Compass, ArrowRight, Navigation, Users, Search } from 'lucide-react'

const LIVE_LOCATION = 'live-location'

const placeSuggestions = [
  { name: 'Scandic Ishavshotel', address: 'Fredrik Langes gate 2, Tromsø' },
  { name: 'Sommarøy Arctic Hotel', address: 'Skipsholmvegen 62, Sommarøy' },
  { name: 'Clarion Hotel The Edge', address: 'Kaigata 6, Tromsø' },
  { name: 'Radisson Blu Hotel Tromsø', address: 'Sjøgata 7, Tromsø' },
  { name: 'Tromsø Airport (TOS)', address: 'Langnes, Tromsø' },
  { name: 'Arctic Cathedral', address: 'Hans Nilsens veg 41, Tromsø' },
  { name: 'Fjellheisen Cable Car', address: 'Sjøgata 100, Tromsø' },
  { name: 'Malangen Resort', address: 'Mestervikveien 152, Malangen' },
]

const pickups = [
  { value: 'Tromsø Airport (TOS)', label: 'Tromsø Airport (TOS)' },
  { value: 'Tromsø City Center', label: 'Tromsø City Center' },
  { value: LIVE_LOCATION, label: '📍 Use My Live Location' },
]

const tourOptions = [
  { id: 'private-group', label: 'Northern Lights (Private Group)', price: 15000 },
  { id: 'per-person', label: 'Northern Lights (Per Person)', price: 2000 },
  { id: 'small-group', label: 'Northern Lights (Private Small Group)', price: 11000 },
  { id: 'sommaroya', label: 'Sommarøya Tour', price: 5000 },
]

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

export function DispatchConsole() {
  const [mode, setMode] = useState<Mode>('taxi')
  const [pickup, setPickup] = useState(pickups[0].value)
  const [dropoff, setDropoff] = useState('')
  const [fleet, setFleet] = useState(fleets[0].id)
  const [date, setDate] = useState('')
  const [tour, setTour] = useState(tourOptions[0].id)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = useState('')

  const price = useMemo(() => {
    if (mode === 'taxi') {
      return fleets.find((f) => f.id === fleet)?.price ?? 0
    }
    return tourOptions.find((t) => t.id === tour)?.price ?? 0
  }, [mode, fleet, tour])

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
  const phoneNumber = "4792997190"

  // 1. Supabase Veritabanına Kaydet
  try {
    const selectedFleet = fleets.find((f) => f.id === fleet)
    const selectedTour = tourOptions.find((t) => t.id === tour)
    
    const pickupText = pickup === LIVE_LOCATION && coords 
      ? `Live Location (https://maps.google.com/?q=${coords.lat},${coords.lng})` 
      : pickup

    await supabase.from('bookings').insert([
      {
        customer_name: 'Guest User', // Formda isim alanı eklenene kadar varsayılan
        customer_email: 'pending@articsafaritour.com',
        booking_type: mode === 'taxi' ? 'transfer' : 'tour',
        item_title: mode === 'taxi' ? `${selectedFleet?.label} Fleet` : selectedTour?.label,
        booking_date: date || new Date().toISOString().split('T')[0],
        total_price: price,
        notes: mode === 'taxi' ? `Pickup: ${pickupText} - Dropoff: ${dropoff || 'N/A'}` : '',
        status: 'pending'
      }
    ])
  } catch (err) {
    console.error('Supabase kayit hatasi:', err)
  }

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
    <div className="glass animate-float-up rounded-3xl border border-white/10 p-2 shadow-2xl shadow-black/40" style={{ animationDelay: '0.3s' }}>
      <div className="rounded-[1.35rem] border border-white/[0.06] bg-black/20 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Dispatch Console
          </span>
          <span className="flex items-center gap-1.5 text-xs text-aurora">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-aurora" />
            Live pricing
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Dispatch mode"
          className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1"
        >
          {modes.map((m) => (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                mode === m.id
                  ? 'bg-violet text-primary-foreground shadow-[0_0_24px_-6px_rgba(110,58,255,0.8)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'taxi' ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Field icon={<MapPin className="h-4 w-4" />} label="Pickup Point">
              <select
                value={pickup}
                onChange={(e) => handlePickupChange(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none [&>option]:bg-card"
              >
                {pickups.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {pickup === LIVE_LOCATION && (
                <span className="text-[11px] normal-case tracking-normal mt-1">
                  {geoStatus === 'locating' && (
                    <span className="text-muted-foreground">Locating you…</span>
                  )}
                  {geoStatus === 'success' && coords && (
                    <span className="font-mono text-aurora tabular-nums">
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
                    className={`flex-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                      fleet === f.id
                        ? 'bg-violet/20 text-foreground ring-1 ring-violet/60'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                    <span className="ml-1 text-muted-foreground">{f.hint}</span>
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
                className="w-full bg-transparent text-sm text-foreground outline-none [&>option]:bg-card"
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
                className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
              />
            </Field>
          </div>
        )}

        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="text-xs text-muted-foreground">Instant estimate</span>
            <span className="font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {formatKr(price)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleReserve}
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-aurora px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-all hover:shadow-[0_0_30px_-4px_rgba(0,255,163,0.6)]"
          >
            Reserve Dispatch
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AddressAutocomplete({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return placeSuggestions.slice(0, 5)
    return placeSuggestions.filter(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    )
  }, [value])

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOpen(false)
    }
  }

  function handleSelect(name: string) {
    onChange(name)
    setSelected(true)
    setOpen(false)
  }

  return (
    <div ref={containerRef} onBlur={handleBlur} className="relative">
      <label className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors focus-within:border-violet/50">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="text-violet">
            <Navigation className="h-4 w-4" />
          </span>
          Dropoff Destination
        </span>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setSelected(false)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search hotel, address, or landmark"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
          {selected && value && <MapPin className="h-4 w-4 shrink-0 text-aurora" />}
        </div>
      </label>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="glass absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-card/95 py-1 shadow-2xl shadow-black/50"
        >
          {results.map((p) => (
            <li key={p.name} role="option" aria-selected={value === p.name}>
              <button
                type="button"
                onClick={() => handleSelect(p.name)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-foreground">{p.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{p.address}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && value.trim() && results.length === 0 && (
        <div className="glass absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 rounded-2xl border border-white/10 bg-card/95 px-3 py-2.5 text-xs text-muted-foreground shadow-2xl shadow-black/50">
          No matches for “{value}”
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
    <label className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors focus-within:border-violet/50">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="text-violet">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  )
}