import { supabase } from '@/lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface BookingInsertPayload {
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

export function insertBooking(payload: BookingInsertPayload) {
  return supabase.from('bookings').insert([payload])
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
