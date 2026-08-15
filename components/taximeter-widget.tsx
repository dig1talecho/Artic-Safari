'use client'

import { useState } from 'react'
import { MapPin, Navigation, Clock, Gauge, MessageCircle, Check } from 'lucide-react'
import { insertBooking } from '@/services/bookings.service'
import { getPricingRules, calculateTransferPrice, isNightOrWeekendRate } from '@/services/pricing.service'
import { useSpamGuard } from '@/lib/use-spam-guard'
import { AddressAutocomplete } from '@/components/address-autocomplete'

type GeoStatus = 'idle' | 'locating' | 'success' | 'error'

interface DistanceResult {
  distanceKm: number
  durationMinutes: number
  originAddress: string
  destinationAddress: string
}

type Status = 'idle' | 'calculating' | 'ready' | 'not_configured' | 'error'

export function TaximeterWidget() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [geoError, setGeoError] = useState('')
  const [liveLocationNonce, setLiveLocationNonce] = useState(0)
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<DistanceResult | null>(null)
  const [price, setPrice] = useState<number | null>(null)

  const [showBookingForm, setShowBookingForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const spamGuard = useSpamGuard()

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
        setOriginCoords({ lat: position.coords.latitude, lon: position.coords.longitude })
        setGeoStatus('success')
        setLiveLocationNonce((n) => n + 1)
      },
      (error) => {
        setGeoStatus('error')
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access or search an address.'
            : 'Unable to retrieve your location. Please try again.',
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const handleCalculate = async () => {
    if (!origin.trim() || !destination.trim()) return

    setStatus('calculating')
    setErrorMessage('')
    setResult(null)
    setPrice(null)

    try {
      const res = await fetch('/api/distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination }),
      })
      const data = await res.json()

      if (res.status === 503) {
        setStatus('not_configured')
        return
      }
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.message || 'Could not calculate this route.')
        return
      }

      const { data: rules, error: rulesError } = await getPricingRules()
      if (rulesError || !rules) {
        setStatus('error')
        setErrorMessage('Pricing is not configured yet.')
        return
      }

      const computedPrice = calculateTransferPrice(data.distanceKm, rules, isNightOrWeekendRate())
      setResult(data)
      setPrice(computedPrice)
      setStatus('ready')
    } catch {
      setStatus('error')
      setErrorMessage('Distance service is unavailable right now.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!result || price === null || spamGuard.isSpam()) return

    setSubmitting(true)
    await insertBooking({
      customer_name: name.trim() || 'Guest User',
      customer_email: email.trim() || 'pending@articsafaritour.com',
      customer_phone: phone.trim() || null,
      booking_type: 'transfer',
      item_title: 'Custom Route Transfer',
      booking_date: new Date().toISOString().split('T')[0],
      total_price: price,
      notes: `Pickup: ${result.originAddress} - Dropoff: ${result.destinationAddress} (${result.distanceKm} km, ~${result.durationMinutes} min)`,
      status: 'pending',
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <section className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-20">
      <div className="rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)] sm:p-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
          <Gauge className="h-4 w-4" />
          Custom Route Taximeter
        </p>
        <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--home-foreground)] sm:text-3xl">
          Going somewhere off the usual route?
        </h2>
        <p className="mt-2 text-sm text-[var(--home-muted)]">
          Enter your pickup and drop-off addresses for an instant distance-based price.
        </p>

        {!submitted ? (
          <>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AddressAutocomplete
                value={origin}
                onChange={setOrigin}
                label="Pickup Address"
                fieldIcon={<MapPin className="h-4 w-4" />}
                placeholder="Search any address in Tromsø"
                onCoordsChange={setOriginCoords}
                onRequestLiveLocation={requestLiveLocation}
                liveLocating={geoStatus === 'locating'}
                liveError={geoStatus === 'error' ? geoError : undefined}
                liveLocation={originCoords ? { coords: originCoords, nonce: liveLocationNonce } : null}
              />
              <AddressAutocomplete
                value={destination}
                onChange={setDestination}
                label="Drop-off Address"
                fieldIcon={<Navigation className="h-4 w-4" />}
                placeholder="Search hotel, address, or landmark"
              />
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              disabled={!origin.trim() || !destination.trim() || status === 'calculating'}
              className="mt-4 w-full rounded-xl bg-[var(--home-accent)] py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {status === 'calculating' ? 'Calculating…' : 'Calculate Price'}
            </button>

            {status === 'not_configured' && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-4 text-sm text-[var(--home-muted)]">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--home-accent)]" />
                <div>
                  Instant route pricing isn&apos;t connected yet. Message us on WhatsApp with your
                  pickup and drop-off and we&apos;ll send you a quote directly.
                  <a
                    href="https://wa.me/+4792997190"
                    className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[var(--home-accent)]"
                  >
                    Chat on WhatsApp →
                  </a>
                </div>
              </div>
            )}

            {status === 'error' && (
              <p className="mt-4 text-sm font-medium text-rose-500">{errorMessage}</p>
            )}

            {status === 'ready' && result && price !== null && (
              <div className="mt-6 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-5">
                <div className="flex flex-wrap items-center gap-5 text-sm text-[var(--home-muted)]">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="h-4 w-4 text-[var(--home-accent)]" />
                    {result.distanceKm} km
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[var(--home-accent)]" />
                    ~{result.durationMinutes} min
                  </span>
                </div>
                <p className="mt-3 font-mono text-3xl font-semibold text-[var(--home-foreground)]">
                  {price.toLocaleString()} <span className="text-base text-[var(--home-muted)]">kr</span>
                </p>

                {!showBookingForm ? (
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(true)}
                    className="mt-4 w-full rounded-xl bg-[var(--home-accent)] py-3 text-sm font-bold uppercase tracking-wide text-white hover:opacity-90 sm:w-auto sm:px-8"
                  >
                    Book This Transfer
                  </button>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-[var(--home-border)] pt-5">
                    <input
                      value={spamGuard.honeypot}
                      onChange={(e) => spamGuard.setHoneypot(e.target.value)}
                      className="sr-only"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />
                    <input
                      required
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-3.5 py-2.5 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-3.5 py-2.5 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                    />
                    <input
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-3.5 py-2.5 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-[var(--home-foreground)] py-3 text-sm font-bold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? 'Sending…' : 'Confirm Booking Request'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-5 text-sm text-[var(--home-foreground)]">
            <Check className="h-5 w-5 shrink-0 text-[var(--home-accent)]" />
            Request received — we&apos;ll confirm your custom transfer by email or WhatsApp shortly.
          </div>
        )}
      </div>
    </section>
  )
}
