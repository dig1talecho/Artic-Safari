'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  MapPin,
  Navigation,
  ArrowRight,
  Users,
  User,
  Mail,
  Phone,
  Loader2,
  Lock,
  ShieldCheck,
  BadgeCheck,
  Tag,
  Check,
  Route,
  Snowflake,
} from 'lucide-react'
import { insertBooking } from '@/services/bookings.service'
import { validatePromoCode, type PromoCodeInfo } from '@/services/partners.service'
import { getPricingRules, calculateTransferFare, type PricingRules } from '@/services/pricing.service'
import { listActiveFleetClasses, type FleetClass } from '@/services/fleet-classes.service'
import { useSpamGuard } from '@/lib/use-spam-guard'
import { useSession } from '@/lib/use-session'
import { useCustomerProfile } from '@/lib/use-customer-profile'
import { tromsoToday } from '@/lib/dates'
import { AddressAutocomplete, withTromsoContext } from '@/components/address-autocomplete'
import { PrivacyNotice } from '@/components/privacy-notice'
import dynamic from 'next/dynamic'

// Leaflet touches window on import, so it can only load in the browser.
const RouteMap = dynamic(() => import('@/components/route-map').then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="frost-field h-52 w-full animate-pulse rounded-2xl" />,
})

/**
 * The taxi console. One screen, one job.
 *
 * This used to be two competing panels: a tabbed console showing a flat
 * fleet price, and a separate "Custom Route Taximeter" below it that was
 * the only thing actually pricing by distance. The guest met the wrong
 * number first — the console quoted 490 kr for any journey, whether that
 * was four kilometres or forty. Tours were the console's second tab, which
 * duplicated the tour cards further down the same page.
 *
 * Now tours are booked from the tour cards and their own pages, and this
 * is the taxi. Distance pricing lives here, so the price a guest sees is
 * the price of the route they actually asked for.
 *
 * The fare here is still an estimate. `trg_0_calculate_transfer_fare`
 * recomputes it inside Postgres at insert time from the admin's own rates,
 * because everything in this file runs in a browser holding a public key.
 */

const WHATSAPP_NUMBER = '4792997190'

interface RouteInfo {
  distanceKm: number
  durationMinutes: number
}

type RouteStatus = 'idle' | 'calculating' | 'ready' | 'unavailable'

function formatKr(value: number) {
  return `${Math.round(value).toLocaleString('en-US')} kr`
}

/**
 * Pickup text with a link the driver can tap. Exact coordinates when the
 * guest picked a geocoded result, otherwise a map search on what they
 * typed, so a hand-entered address is still one tap from navigation.
 */
function pickupWithMapLink(address: string, coords: { lat: number; lon: number } | null) {
  const text = address.trim()
  if (coords) return `${text || 'Pickup Location'} (https://maps.google.com/?q=${coords.lat},${coords.lon})`
  if (!text) return 'Pickup Location'
  return `${text} (https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(withTromsoContext(text))})`
}

export function DispatchConsole() {
  const spamGuard = useSpamGuard()

  const [pickup, setPickup] = useState('')
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [dropoff, setDropoff] = useState('')
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lon: number } | null>(null)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  /*
    Signing in is NOT required to call a taxi and must never become
    required. Someone standing outside at minus eight wants a car, not a
    registration form, and a signup wall in front of a taxi button is the
    cheapest way to lose the booking.

    What an account is good for is not typing your own phone number again.
    If the guest happens to be signed in already, their details fill
    themselves in -- and stay editable, because the number on the account
    is not always the number they want the driver to ring tonight.
  */
  const { session } = useSession()
  const { profile } = useCustomerProfile(session)
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    // Only once, and never over something already typed: the profile
    // arrives after a round trip, and clobbering a half-filled form at
    // that moment is maddening.
    if (!profile || prefilled) return
    setCustomerName((v) => v || profile.full_name)
    setCustomerEmail((v) => v || profile.email)
    setCustomerPhone((v) => v || profile.phone)
    setPrefilled(true)
  }, [profile, prefilled])

  const [rules, setRules] = useState<PricingRules | null>(null)
  const [fleetClasses, setFleetClasses] = useState<FleetClass[]>([])
  const [fleetCode, setFleetCode] = useState('')

  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('idle')

  /*
    Two stages in one panel, the way a ride app does it: ask where you are
    going, show what it costs, and only then ask who you are.

    The old order put three contact fields in front of the price, so the
    guest filled in a form before learning the fare -- which is both more
    to read and a worse deal for them. Collapsing stage one to two address
    boxes and a vehicle also makes the panel roughly a third of its height,
    which is what a phone screen has room for above the fold.
  */
  const [stage, setStage] = useState<'route' | 'details'>('route')

  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState('')

  const [promoInput, setPromoInput] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeInfo | null>(null)

  // Rates and vehicle classes both come from the admin panel. The classes
  // used to be a hardcoded array in this file carrying their own prices,
  // which is exactly how the tour price drifted out of sync before.
  useEffect(() => {
    Promise.all([getPricingRules(), listActiveFleetClasses()]).then(([r, f]) => {
      if (r.data) setRules(r.data)
      if (f.data?.length) {
        setFleetClasses(f.data)
        setFleetCode((current) => current || f.data[0].code)
      }
    })
  }, [])

  const selectedFleet = fleetClasses.find((f) => f.code === fleetCode) ?? null
  const fleetMultiplier = selectedFleet ? Number(selectedFleet.multiplier) : 1

  // Ask for the driving distance once both ends are known. Debounced, and
  // aborted on change so a slow reply cannot overwrite a newer one.
  useEffect(() => {
    const from = pickup.trim()
    const to = dropoff.trim()
    if (!from || !to) {
      setRoute(null)
      setRouteStatus('idle')
      return
    }

    const controller = new AbortController()
    setRouteStatus('calculating')

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: from,
            destination: to,
            // The pins the guest picked. Without these, route pricing
            // needs a Google key; with them OSRM can answer for free.
            originCoords: pickupCoords,
            destinationCoords: dropoffCoords,
          }),
          signal: controller.signal,
        })
        if (!res.ok) {
          setRoute(null)
          setRouteStatus('unavailable')
          return
        }
        const data = await res.json()
        setRoute({ distanceKm: data.distanceKm, durationMinutes: data.durationMinutes })
        setRouteStatus('ready')
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setRoute(null)
        setRouteStatus('unavailable')
      }
    }, 600)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [pickup, dropoff, pickupCoords, dropoffCoords])

  const basePrice = useMemo(() => {
    if (!rules) return 0
    if (route) {
      return calculateTransferFare(rules, {
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
        fleetMultiplier,
      })
    }
    // No route yet: show the floor for this vehicle rather than inventing a
    // number. It is a real figure from the admin's own rates, and it is
    // labelled "From" so nobody reads it as a quote for their trip.
    return Math.round(rules.min_price * fleetMultiplier)
  }, [rules, route, fleetMultiplier])

  const discountAmount = appliedPromo
    ? Math.round((basePrice * appliedPromo.customer_discount_percent) / 100)
    : 0
  const finalPrice = basePrice - discountAmount
  const priceIsQuote = routeStatus === 'ready' && route !== null

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

  const handleReserve = async () => {
    if (spamGuard.isSpam()) return

    setReserveError('')
    setReserving(true)

    const pickupText = pickupWithMapLink(pickup, pickupCoords)

    try {
      const { error } = await insertBooking({
        customer_name: customerName.trim() || 'Guest User',
        customer_email: customerEmail.trim() || 'pending@articsafaritour.com',
        customer_phone: customerPhone.trim() || null,
        booking_type: 'transfer',
        item_title: `${selectedFleet?.label ?? 'Transfer'} Transfer`,
        booking_date: tromsoToday(),
        total_price: finalPrice,
        notes: `Pickup: ${pickupText} - Dropoff: ${dropoff || 'N/A'}${
          route ? ` (${route.distanceKm} km, ~${route.durationMinutes} min)` : ''
        }`,
        status: 'pending',
        promo_code: appliedPromo?.promo_code ?? null,
        pickup_address: pickup || null,
        pickup_lat: pickupCoords?.lat ?? null,
        pickup_lng: pickupCoords?.lon ?? null,
        dropoff_address: dropoff || null,
        dropoff_lat: dropoffCoords?.lat ?? null,
        dropoff_lng: dropoffCoords?.lon ?? null,
        // What the fare was calculated from. Postgres recalculates the
        // price from these, so a tampered total_price cannot stick.
        distance_km: route?.distanceKm ?? null,
        duration_minutes: route?.durationMinutes ?? null,
        fleet_class: fleetCode || null,
      })

      if (error) {
        console.error('Supabase detayli hata:', error)
        setReserving(false)
        setReserveError(
          error.message ||
            'Could not save your reservation. Please try again or contact us on WhatsApp directly.',
        )
        return
      }
    } catch (err) {
      console.error('Supabase beklenmeyen hata:', err)
      setReserving(false)
      setReserveError('Something went wrong. Please try again or contact us on WhatsApp directly.')
      return
    }

    setReserving(false)

    const message = `*ARTIC SAFARI - VIP TRANSFER BOOKING*
----------------------------------------
Customer: ${customerName || 'Guest'}
Email: ${customerEmail || 'N/A'}
Phone: ${customerPhone || 'N/A'}
Pickup: ${pickupText}
Dropoff: ${dropoff || 'Not specified'}
Vehicle: ${selectedFleet?.label ?? 'Transfer'} (${selectedFleet?.capacity_hint ?? '-'} passengers)
${route ? `Route: ${route.distanceKm} km, ~${route.durationMinutes} min\n` : ''}${
      appliedPromo
        ? `Promo Code: ${appliedPromo.promo_code} (-${appliedPromo.customer_discount_percent}%)\n`
        : ''
    }Estimated Total: ${formatKr(finalPrice)}
----------------------------------------
Please confirm availability and dispatch driver.`

    window.open(
      `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`,
      '_blank',
    )
  }

  return (
    <div
      className="animate-float-up frost frost-animate rounded-[28px] p-2"
      style={{ animationDelay: '0.3s' }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleReserve()
        }}
        className="relative z-[2] rounded-[22px] p-4 sm:p-6"
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

        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a5f3fc]">
            <Snowflake className="h-3.5 w-3.5" />
            VIP Taxi &amp; Transfer
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#7dd3e8]">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#67e8f9]" />
            {priceIsQuote ? 'Route priced' : 'Live pricing'}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <AddressAutocomplete
            value={pickup}
            onChange={setPickup}
            label="Pickup Point"
            fieldIcon={<MapPin className="h-4 w-4" />}
            placeholder="Search any address in Tromsø"
            onCoordsChange={setPickupCoords}
            allowLiveLocation
            showMap={false}
          />
          <AddressAutocomplete
            value={dropoff}
            onChange={setDropoff}
            label="Dropoff Destination"
            fieldIcon={<Navigation className="h-4 w-4" />}
            placeholder="Search hotel, address, or landmark"
            onCoordsChange={setDropoffCoords}
            showMap={false}
          />
        </div>

        {/* One map for the journey, not a lonely pin under each field. */}
        {stage === 'details' && (pickupCoords || dropoffCoords) && (
          <div className="mt-3">
            <RouteMap origin={pickupCoords} destination={dropoffCoords} />
            <p className="mt-1.5 flex items-center gap-3 text-[10px] text-[#7dd3e8]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#67e8f9]" />
                Pickup
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full border-2 border-[#e0fcff]" />
                Drop-off
              </span>
            </p>
          </div>
        )}

        {/* Vehicle class. Labels, capacities and multipliers all come from
            the admin panel, so a third class needs no code change here. */}
        <fieldset className="mt-3">
          <legend className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#7dd3e8]">
            <Users className="h-3.5 w-3.5" />
            Vehicle
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {fleetClasses.map((f) => {
              const active = f.code === fleetCode
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFleetCode(f.code)}
                  aria-pressed={active}
                  className={`frost-field flex items-center justify-between rounded-2xl px-4 py-3 text-left ${
                    active ? 'frost-selected' : 'hover:border-[rgba(103,232,249,0.35)]'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">{f.label}</span>
                    <span className="block text-[11px] text-[#7dd3e8]">
                      {f.capacity_hint} passengers
                    </span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-[#67e8f9]" />}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Route readout, shown only once there is something real to say. */}
        {routeStatus !== 'idle' && (
          <div className="frost-field mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-2xl px-4 py-3 text-xs text-[#a5c9d6]">
            <span className="flex items-center gap-1.5 font-medium text-[#a5f3fc]">
              <Route className="h-3.5 w-3.5" />
              Route
            </span>
            {routeStatus === 'calculating' && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Measuring your route…
              </span>
            )}
            {routeStatus === 'ready' && route && (
              <>
                <span>{route.distanceKm} km</span>
                <span>~{route.durationMinutes} min</span>
              </>
            )}
            {routeStatus === 'unavailable' && (
              <span>
                Route pricing is unavailable right now — we&apos;ll confirm your exact fare on
                WhatsApp.
              </span>
            )}
          </div>
        )}

        {stage === 'details' && (
          <div className="mt-4 space-y-4 border-t border-[rgba(148,226,245,0.12)] pt-4">
        {profile && (
          <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#7dd3e8]">
            <Check className="h-3.5 w-3.5 text-[#67e8f9]" />
            Booking as <span className="font-semibold text-white">{profile.full_name}</span>
            <span className="text-[#7dd3e8]/60">— edit any field below if tonight is different.</span>
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <FrostField icon={<User className="h-4 w-4" />} label="Full Name">
            <input
              type="text"
              autoComplete="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </FrostField>
          <FrostField icon={<Mail className="h-4 w-4" />} label="Email Address">
            <input
              type="email"
              autoComplete="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </FrostField>
          <FrostField icon={<Phone className="h-4 w-4" />} label="Phone Number">
            <input
              type="tel"
              autoComplete="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+47 000 00 000"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </FrostField>
        </div>
        <div className="mt-4">
          <label className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#7dd3e8]">
            <Tag className="h-3.5 w-3.5" />
            Have a partner promo code?
          </label>
          <div className="flex gap-2">
            <div className="frost-field flex flex-1 items-center rounded-2xl px-4 py-3">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="PROMO CODE (OPTIONAL)"
                className="w-full bg-transparent text-sm uppercase tracking-wide text-white outline-none placeholder:text-white/25"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={promoChecking || !promoInput.trim()}
              className="frost-field rounded-2xl px-5 text-sm font-semibold text-[#a5f3fc] hover:border-[rgba(103,232,249,0.5)] disabled:opacity-40"
            >
              {promoChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
          {promoError && <p className="mt-2 text-xs font-medium text-rose-300">{promoError}</p>}
          {appliedPromo && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#67e8f9]">
              <BadgeCheck className="h-3.5 w-3.5" />
              {appliedPromo.hotel_name} — {appliedPromo.customer_discount_percent}% off applied
            </p>
          )}
        </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="frost-field rounded-2xl px-5 py-3.5">
            <span className="block text-[10px] uppercase tracking-[0.16em] text-[#7dd3e8]">
              {priceIsQuote ? 'Your fare' : 'From'}
            </span>
            <span className="mt-0.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tracking-tight text-white">
                {formatKr(finalPrice)}
              </span>
              {discountAmount > 0 && (
                <span className="font-mono text-sm text-white/35 line-through">
                  {formatKr(basePrice)}
                </span>
              )}
            </span>
            {!priceIsQuote && (
              <span className="mt-1 block text-[10px] text-[#8fb4c2]">
                Enter both addresses for your exact fare
              </span>
            )}
          </div>

          {stage === 'route' ? (
            <button
              // Not a submit: this reveals the rest of the form rather than
              // sending anything, and a stray Enter in an address box must
              // not book a car.
              type="button"
              onClick={() => setStage('details')}
              disabled={!pickup.trim() || !dropoff.trim()}
              className="frost-cta flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold tracking-wide text-[#04212b] disabled:opacity-40"
            >
              {priceIsQuote ? 'Continue' : 'See price'}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={reserving}
              className="frost-cta flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold tracking-wide text-[#04212b] disabled:opacity-50"
            >
              {reserving && <Loader2 className="h-4 w-4 animate-spin" />}
              {reserving ? 'Reserving…' : 'Reserve Dispatch'}
              {!reserving && <ArrowRight className="h-4 w-4" />}
            </button>
          )}
        </div>

        {stage === 'details' && (
          <button
            type="button"
            onClick={() => setStage('route')}
            className="mt-3 text-[11px] font-medium text-[#7dd3e8] underline underline-offset-2 hover:text-[#a5f3fc]"
          >
            ← Change pickup or drop-off
          </button>
        )}

        {reserveError && <p className="mt-3 text-xs font-medium text-rose-300">{reserveError}</p>}

        {stage === 'details' && <PrivacyNotice className="mt-3 text-center" />}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[rgba(148,226,245,0.12)] pt-4">
          {[
            { icon: Lock, label: 'Encrypted Connection' },
            { icon: ShieldCheck, label: 'Secure Booking Request' },
            { icon: BadgeCheck, label: 'WhatsApp Confirmed' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[11px] text-[#8fb4c2]">
              <Icon className="h-3.5 w-3.5 text-[#67e8f9]" />
              {label}
            </span>
          ))}
        </div>
      </form>
    </div>
  )
}

function FrostField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="frost-field flex flex-col gap-1.5 rounded-2xl px-4 py-3">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#7dd3e8]">
        <span className="text-[#67e8f9]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  )
}
