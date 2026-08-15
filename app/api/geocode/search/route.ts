import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Real-time place search backed by Photon (komoot's free, keyless OSM
// geocoder) -- unlike Nominatim's /search, Photon indexes name prefixes,
// so a partial query like "t" genuinely returns "Tromsø", "Tromsø
// lufthavn" (Airport), "Tromsø domkirke" (Cathedral), etc. as the user
// types, not just complete-word matches. Results are biased + boxed to
// the greater Tromsø region (city, airport, Sommarøy, the fjord
// approaches). Proxied server-side to attach a descriptive User-Agent
// (courtesy to the free public instance) and to rate-limit this origin's
// call volume regardless of how fast a visitor types.
const TROMSO_BBOX = '17.4,69.15,20.6,70.05' // minLon,minLat,maxLon,maxLat
const TROMSO_CENTER = { lat: 69.6496, lon: 18.9553 }
const USER_AGENT = 'ArticSafariTour/1.0 (+https://articsafaritour.com)'

export interface GeocodeResult {
  id: string
  name: string
  address: string
  lat: number
  lon: number
  type: string
}

interface PhotonFeature {
  properties: {
    osm_id: number
    name?: string
    street?: string
    locality?: string
    district?: string
    city?: string
    county?: string
    country?: string
    osm_value?: string
  }
  geometry: { coordinates: [number, number] }
}

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`geocode:${ip}`, 40, 60_000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many searches. Please slow down.' },
      { status: 429, headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() } },
    )
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (q.length === 0) {
    return NextResponse.json({ results: [] })
  }
  if (q.length > 200) {
    return NextResponse.json({ error: 'invalid_request', message: 'Query is too long.' }, { status: 400 })
  }

  try {
    const url = new URL('https://photon.komoot.io/api/')
    url.searchParams.set('q', q)
    url.searchParams.set('limit', '8')
    url.searchParams.set('lat', String(TROMSO_CENTER.lat))
    url.searchParams.set('lon', String(TROMSO_CENTER.lon))
    url.searchParams.set('bbox', TROMSO_BBOX)

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream_error', message: 'Location search is unavailable.' }, { status: 502 })
    }

    const data = (await res.json()) as { features: PhotonFeature[] }

    const results: GeocodeResult[] = (data.features ?? [])
      .filter((f) => f.properties.name)
      .map((f) => {
        const p = f.properties
        const address = [p.street, p.district ?? p.locality, p.city, p.country].filter(Boolean).join(', ')
        return {
          id: String(p.osm_id),
          name: p.name as string,
          address,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          type: p.osm_value ?? 'place',
        }
      })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'upstream_error', message: 'Location search is unavailable.' }, { status: 502 })
  }
}
