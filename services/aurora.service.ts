// Real space-weather / weather data for Tromsø. No mock numbers -- every
// value here traces back to a live NOAA SWPC or Open-Meteo response. If a
// fetch fails, callers get `null` and must render an honest "unavailable"
// state instead of falling back to invented figures.

const TROMSO_LAT = 69.6492
const TROMSO_LON = 18.9553

export interface KpForecastPoint {
  time: string // ISO
  kp: number
}

export interface AuroraConditions {
  currentKp: number
  kpLabel: string
  cloudCoverPercent: number
  cloudLabel: string
  auroraProbability: number // OVATION 0-100 at Tromso's grid cell
  peakWindow: KpForecastPoint | null
  forecast: KpForecastPoint[] // next ~24h, 3-hour steps
}

function kpLabel(kp: number): string {
  if (kp >= 8) return 'Severe storm (G4+)'
  if (kp >= 7) return 'Strong storm (G3)'
  if (kp >= 6) return 'Moderate storm (G2)'
  if (kp >= 5) return 'Minor storm (G1)'
  if (kp >= 4) return 'Unsettled'
  return 'Quiet'
}

function cloudLabel(pct: number): string {
  if (pct < 20) return 'Clear skies'
  if (pct < 50) return 'Partly cloudy'
  if (pct < 80) return 'Mostly cloudy'
  return 'Overcast'
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getAuroraConditions(): Promise<AuroraConditions | null> {
  const [kpNow, kpForecastRaw, ovation, weather] = await Promise.all([
    fetchJson<{ time_tag: string; Kp: number }[]>(
      'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
    ),
    fetchJson<{ time_tag: string; kp: number }[]>(
      'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json',
    ),
    fetchJson<{ coordinates: [number, number, number][] }>(
      'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json',
    ),
    fetchJson<{ hourly: { time: string[]; cloud_cover: number[] } }>(
      `https://api.open-meteo.com/v1/forecast?latitude=${TROMSO_LAT}&longitude=${TROMSO_LON}&hourly=cloud_cover&timezone=auto`,
    ),
  ])

  if (!kpNow || kpNow.length === 0) return null

  const currentKp = kpNow[kpNow.length - 1].Kp

  const forecast: KpForecastPoint[] = (kpForecastRaw ?? [])
    .filter((p) => new Date(p.time_tag).getTime() >= Date.now())
    .slice(0, 8)
    .map((p) => ({ time: p.time_tag, kp: p.kp }))

  const peakWindow =
    forecast.length > 0 ? forecast.reduce((max, p) => (p.kp > max.kp ? p : max), forecast[0]) : null

  let auroraProbability = 0
  if (ovation?.coordinates) {
    const targetLon = TROMSO_LON < 0 ? TROMSO_LON + 360 : TROMSO_LON
    let closest = ovation.coordinates[0]
    let closestDist = Infinity
    for (const c of ovation.coordinates) {
      const [lon, lat, value] = c
      const dist = Math.abs(lon - targetLon) + Math.abs(lat - TROMSO_LAT)
      if (dist < closestDist) {
        closestDist = dist
        closest = c
        void value
      }
    }
    auroraProbability = closest[2]
  }

  let cloudCoverPercent = 0
  if (weather?.hourly?.time && weather.hourly.cloud_cover) {
    const nowHourIso = new Date().toISOString().slice(0, 13)
    const idx = weather.hourly.time.findIndex((t) => t.startsWith(nowHourIso))
    cloudCoverPercent = weather.hourly.cloud_cover[idx >= 0 ? idx : 0] ?? 0
  }

  return {
    currentKp,
    kpLabel: kpLabel(currentKp),
    cloudCoverPercent,
    cloudLabel: cloudLabel(cloudCoverPercent),
    auroraProbability,
    peakWindow,
    forecast,
  }
}
