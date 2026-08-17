import { supabase } from '@/lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { bookingInsertSchema } from '@/lib/validation'

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

export function updateBookingStatus(id: string, status: 'confirmed' | 'cancelled' | 'pending') {
  return supabase.from('bookings').update({ status }).eq('id', id)
}

export function updateBookingPaymentStatus(id: string, paymentStatus: 'paid' | 'pending' | 'refunded') {
  return supabase.from('bookings').update({ payment_status: paymentStatus }).eq('id', id)
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
