import { NextResponse } from 'next/server'

// Server-side only -- the Google Maps API key never reaches the browser.
// Until GOOGLE_MAPS_API_KEY is set, this route returns a clear "not
// configured" response rather than inventing a distance.
export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'not_configured', message: 'GOOGLE_MAPS_API_KEY is not set.' },
      { status: 503 },
    )
  }

  let body: { origin?: string; destination?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const { origin, destination } = body
  if (!origin?.trim() || !destination?.trim()) {
    return NextResponse.json({ error: 'invalid_request', message: 'origin and destination are required.' }, { status: 400 })
  }

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
