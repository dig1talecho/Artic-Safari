import { supabase } from '@/lib/supabase'
import { driverLocationUpdateSchema } from '@/lib/validation'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Fully real, no external account needed -- Supabase Realtime is already
// used for the admin booking feed (services/bookings.service.ts). This is
// the same primitive applied to driver position: one upserted row per
// booking, broadcast to whoever is subscribed via Postgres logical
// replication (Realtime), not polling.

export interface DriverLocation {
  id: string
  booking_id: string
  driver_name: string
  lat: number
  lng: number
  heading: number | null
  speed: number | null
  updated_at: string
}

export type DriverLocationUpdate = Pick<DriverLocation, 'booking_id' | 'driver_name' | 'lat' | 'lng'> &
  Partial<Pick<DriverLocation, 'heading' | 'speed'>>

/** Driver PWA calls this on each GPS ping. One row per booking (upsert on
 * booking_id), so this models current position, not a trail history. */
export async function pushDriverLocation(update: DriverLocationUpdate) {
  const parsed = driverLocationUpdateSchema.safeParse(update)
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid location update' } }
  }

  return supabase
    .from('driver_locations')
    .upsert([{ ...parsed.data, updated_at: new Date().toISOString() }], { onConflict: 'booking_id' })
    .select()
    .single()
}

export function getDriverLocation(bookingId: string) {
  return supabase.from('driver_locations').select('*').eq('booking_id', bookingId).maybeSingle()
}

/** Customer dashboard subscribes here to watch their driver approach in
 * real time -- filtered server-side to just this booking's row. */
export function subscribeToDriverLocation(
  bookingId: string,
  onUpdate: (location: DriverLocation) => void,
) {
  const channel = supabase
    .channel(`driver-location-${bookingId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'driver_locations', filter: `booking_id=eq.${bookingId}` },
      (payload: RealtimePostgresChangesPayload<DriverLocation>) => {
        if (payload.new && 'id' in payload.new) onUpdate(payload.new as DriverLocation)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/** Great-circle distance in meters -- shared with pickup-logistics.ts for
 * the geofence check. */
export function haversineDistanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
