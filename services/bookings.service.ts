import { supabase } from '@/lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { bookingInsertSchema } from '@/lib/validation'
import type { BookingStatus, PaymentStatus } from '@/lib/booking-lifecycle'

export interface BookingInsertPayload {
  id?: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  booking_type: string
  item_title: string | undefined
  booking_date: string
  scheduled_time?: string | null
  total_price: number
  notes: string
  status: string
  // Resolved server-side into partner_id/commission_amount by the
  // resolve_booking_partner() DB trigger -- never trusted client data.
  promo_code?: string | null
  pickup_address?: string | null
  pickup_lat?: number | null
  pickup_lng?: number | null
  dropoff_address?: string | null
  dropoff_lat?: number | null
  dropoff_lng?: number | null
  // What the fare was calculated from. The trg_0_calculate_transfer_fare
  // trigger recomputes total_price from these plus the admin's rates, so a
  // total_price sent from a browser cannot stick on a priced route.
  distance_km?: number | null
  duration_minutes?: number | null
  fleet_class?: string | null
  party_size?: number
  /** Catalogue tour this booking is for. Null for taxi work. */
  tour_id?: string | null
}

export function listBookings() {
  return supabase.from('bookings').select('*').order('created_at', { ascending: false })
}

export function listBookingsByCustomerEmail(email: string) {
  return supabase
    .from('bookings')
    .select('*')
    .eq('customer_email', email)
    .order('booking_date', { ascending: false })
}

// Validates every booking-creation payload the same way regardless of which
// UI produced it (dispatch console, tour packages modal, taximeter widget,
// admin command palette) -- catches malformed/manipulated data (e.g. a
// non-positive total_price) before it ever reaches Supabase.
export async function insertBooking(payload: BookingInsertPayload) {
  const parsed = bookingInsertSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      data: null,
      error: { message: parsed.error.issues[0]?.message ?? 'Invalid booking data' },
    }
  }
  return supabase.from('bookings').insert([parsed.data]).select()
}

/**
 * Moves a booking along its lifecycle.
 *
 * Legality is decided by trg_enforce_booking_status_transition in
 * Postgres, not here -- this signature only stops a typo at compile time.
 * An illegal move comes back as a normal Supabase error with the reason
 * in `message`, which is worth surfacing verbatim: "Cannot move a booking
 * from pending to completed" says more than "Update failed".
 */
export function updateBookingStatus(id: string, status: BookingStatus) {
  return supabase.from('bookings').update({ status }).eq('id', id)
}

export function updateBookingPaymentStatus(id: string, paymentStatus: PaymentStatus) {
  return supabase.from('bookings').update({ payment_status: paymentStatus }).eq('id', id)
}

/**
 * A driver taking a job: claim and advance in one statement.
 *
 * `.is('assigned_driver', null)` makes it race-safe -- two drivers tapping
 * together produce one winner and one empty result, rather than one
 * silently overwriting the other. Setting status in the same update means
 * a claimed job can never sit in `confirmed` with a driver attached.
 */
export function claimBooking(id: string, driverName: string) {
  return supabase
    .from('bookings')
    .update({ assigned_driver: driverName, status: 'assigned' satisfies BookingStatus })
    .eq('id', id)
    .is('assigned_driver', null)
    .select()
}

export function assignBookingDriver(id: string, driverName: string | null) {
  return supabase.from('bookings').update({ assigned_driver: driverName }).eq('id', id)
}

export type BookingsChangeHandler = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
export type SyncStatus = 'connecting' | 'live' | 'paused'

export function subscribeToBookings(onChange: BookingsChangeHandler, onStatusChange: (status: SyncStatus) => void) {
  const channel = supabase
    .channel('bookings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, onChange)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatusChange('live')
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') onStatusChange('paused')
    })

  return () => {
    supabase.removeChannel(channel)
  }
}
