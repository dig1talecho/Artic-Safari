import { supabase } from '@/lib/supabase'
import { pickupPointSchema } from '@/lib/validation'
import { haversineDistanceMeters } from '@/services/tracking'
import { sendDriverPickupNotice } from '@/services/notifications.service'

export interface PickupPoint {
  id: string
  name: string
  lat: number
  lng: number
  geofence_radius_m: number
  created_at: string
}

export type PickupPointInsertPayload = Omit<PickupPoint, 'id' | 'created_at'>

export function listPickupPoints() {
  return supabase.from('pickup_points').select('*').order('name')
}

export async function createPickupPoint(payload: PickupPointInsertPayload) {
  const parsed = pickupPointSchema.safeParse(payload)
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid pickup point' } }
  }
  return supabase.from('pickup_points').insert([parsed.data]).select().single()
}

export function deletePickupPoint(id: string) {
  return supabase.from('pickup_points').delete().eq('id', id)
}

/**
 * Real geofence check: true distance (haversine) between the driver's
 * current position and a pickup point, compared against that point's
 * configured radius. No fabricated ETA/proximity -- just the math applied
 * to whatever driver_locations row actually exists.
 */
export function isWithinGeofence(
  driverLat: number,
  driverLng: number,
  point: Pick<PickupPoint, 'lat' | 'lng' | 'geofence_radius_m'>,
): boolean {
  return haversineDistanceMeters(driverLat, driverLng, point.lat, point.lng) <= point.geofence_radius_m
}

/**
 * Call this after every driver_locations update (e.g. from the same
 * handler that receives the GPS ping). Fires GUEST_APPROACHING_NOTIFIED
 * at most once per booking (enforced by the unique index on
 * pickup_events(booking_id, event_type)), and reuses the existing
 * notifications service -- so it's real end-to-end once WHATSAPP_CLOUD_API
 * credentials are configured, and a harmless no-op (still logged) if not.
 */
export async function checkAndNotifyGuestApproaching(params: {
  bookingId: string
  driverName: string
  driverLat: number
  driverLng: number
  pickupPoint: PickupPoint
  customerPhone: string | null
  etaMinutes: number
}) {
  if (!isWithinGeofence(params.driverLat, params.driverLng, params.pickupPoint)) {
    return { notified: false, reason: 'outside_geofence' as const }
  }

  const { error: insertError } = await supabase.from('pickup_events').insert([
    {
      booking_id: params.bookingId,
      pickup_point_id: params.pickupPoint.id,
      event_type: 'GUEST_APPROACHING_NOTIFIED',
    },
  ])

  // Unique index violation means this booking was already notified --
  // that's the expected "only once" path, not a real error.
  if (insertError) {
    return { notified: false, reason: 'already_notified' as const }
  }

  const result = await sendDriverPickupNotice(
    { id: params.bookingId, customer_phone: params.customerPhone },
    params.driverName,
    params.etaMinutes,
  )

  return { notified: result.sent, reason: result.sent ? ('sent' as const) : ('notification_failed' as const) }
}
