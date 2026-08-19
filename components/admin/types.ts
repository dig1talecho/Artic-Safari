import type { BookingStatus, PaymentStatus } from '@/lib/booking-lifecycle'

export interface Booking {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  booking_type: string
  item_title: string
  booking_date: string
  scheduled_time: string | null
  total_price: number
  notes: string
  status: BookingStatus
  assigned_driver: string | null
  payment_status?: PaymentStatus
  party_size?: number
  // Written by stamp_booking_cancellation() when status becomes cancelled.
  cancelled_at?: string | null
  cancelled_by?: string | null
  cancellation_reason?: string | null
  /** What the policy owed at the moment of cancelling, frozen. */
  refund_due?: number | null
}

export interface DriverOption {
  id: string
  display_name: string
}

export interface CurrentUser {
  name: string
  role: 'admin' | 'driver'
}

/** Generated live from the same Supabase Realtime bookings subscription
 * that already keeps the booking list in sync -- not a mock feed. */
export interface AdminNotification {
  id: string
  message: string
  createdAt: string
  read: boolean
  bookingType: string
}
