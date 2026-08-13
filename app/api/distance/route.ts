import { NextResponse } from 'next/server'
import { distanceRequestSchema } from '@/lib/validation'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Server-side only -- the Google Maps API key never reaches the browser.
// Until GOOGLE_MAPS_API_KEY is set, this route returns a clear "not
// configured" response rather than inventing a distance.
export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`distance:${ip}`, 10, 60_000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() } },
    )
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'not_configured', message: 'GOOGLE_MAPS_API_KEY is not set.' },
      { status: 503 },
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

  const { origin, destination } = parsed.data

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('origins', origin)
    url.searchParams.set('destinations', destination)
    url.searchParams.set('units', 'metric')
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString())
    const data = await res.json()

    const element = data?.rows?.[0]?.elements?.[0]
    if (data.status !== 'OK' || !element || element.status !== 'OK') {
      return NextResponse.json(
        { error: 'route_not_found', message: 'Could not calculate a route between these addresses.' },
        { status: 422 },
      )
    }

    return NextResponse.json({
      distanceKm: Math.round((element.distance.value / 1000) * 10) / 10,
      durationMinutes: Math.round(element.duration.value / 60),
      originAddress: data.origin_addresses?.[0] ?? origin,
      destinationAddress: data.destination_addresses?.[0] ?? destination,
    })
  } catch {
    return NextResponse.json({ error: 'upstream_error', message: 'Distance service is unavailable.' }, { status: 502 })
  }
}
