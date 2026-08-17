import { NextResponse } from 'next/server'
import { distanceRequestSchema } from '@/lib/validation'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Driving distance between two points, server-side only so no map key
 * ever reaches the browser.
 *
 * TWO PROVIDERS, IN ORDER.
 * This used to return 503 whenever GOOGLE_MAPS_API_KEY was unset, which
 * meant live route pricing simply did not work — the console fell back to
 * a "From" figure and told every guest their fare would be confirmed on
 * WhatsApp. Google needs a billing account, so that state was going to
 * last indefinitely.
 *
 * OSRM is a public routing service that needs no key and returns real
 * driving routes, so it now handles the request whenever Google is not
 * configured. Google still takes priority when the key exists: it has an
 * SLA and understands free-text addresses, whereas OSRM needs
 * coordinates and its demo server offers no guarantees.
 *
 * The 503 is kept for the case where neither can answer. It is the only
 * honest response left — better an explicit "we'll confirm on WhatsApp"
 * than a made-up number attached to a real car.
 */

interface RouteResult {
  distanceKm: number
  durationMinutes: number
  originAddress: string
  destinationAddress: string
  /** Which service answered. Useful when a fare is later disputed. */
  provider: 'google' | 'osrm'
}

async function viaGoogle(
  origin: string,
  destination: string,
  apiKey: string,
): Promise<RouteResult | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
  url.searchParams.set('origins', origin)
  url.searchParams.set('destinations', destination)
  url.searchParams.set('units', 'metric')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
  const data = await res.json()

  const element = data?.rows?.[0]?.elements?.[0]
  if (data.status !== 'OK' || !element || element.status !== 'OK') return null

  return {
    distanceKm: Math.round((element.distance.value / 1000) * 10) / 10,
    durationMinutes: Math.round(element.duration.value / 60),
    originAddress: data.origin_addresses?.[0] ?? origin,
    destinationAddress: data.destination_addresses?.[0] ?? destination,
    provider: 'google',
  }
}

/**
 * OSRM routes between coordinates, not text, so this only runs when the
 * caller sends the pins the guest actually chose. The address fields
 * already carry them — every geocoded result and every "use my location"
 * fix has a lat/lon.
 */
async function viaOsrm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  origin: string,
  destination: string,
): Promise<RouteResult | null> {
  const path = `${from.lon},${from.lat};${to.lon},${to.lat}`
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${path}?overview=false&alternatives=false`,
    { signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) return null

  const data = await res.json()
  const route = data?.routes?.[0]
  if (data.code !== 'Ok' || !route) return null

  return {
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMinutes: Math.round(route.duration / 60),
    originAddress: origin,
    destinationAddress: destination,
    provider: 'osrm',
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`distance:${ip}`, 10, 60_000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many requests. Please wait a moment and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() },
      },
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const parsed = distanceRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_request', message: parsed.error.issues[0]?.message ?? 'Invalid request.' },
      { status: 400 },
    )
  }

  const { origin, destination, originCoords, destinationCoords } = parsed.data
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  try {
    if (apiKey) {
      const result = await viaGoogle(origin, destination, apiKey)
      if (result) return NextResponse.json(result)
    }

    if (originCoords && destinationCoords) {
      const result = await viaOsrm(originCoords, destinationCoords, origin, destination)
      if (result) return NextResponse.json(result)
    }
  } catch {
    return NextResponse.json(
      { error: 'upstream_error', message: 'Distance service is unavailable.' },
      { status: 502 },
    )
  }

  // Neither provider could answer. Most often this means the guest typed
  // an address the geocoder did not recognise, so there are no pins for
  // OSRM and no Google key to fall back on.
  return NextResponse.json(
    {
      error: 'not_available',
      message: 'Could not calculate a route. Pick both addresses from the suggestions.',
    },
    { status: 503 },
  )
}
