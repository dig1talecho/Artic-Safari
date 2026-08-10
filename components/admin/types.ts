export interface Booking {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  booking_type: string
  item_title: string
  booking_date: string
  total_price: number
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled'
  assigned_driver: string | null
  payment_status?: 'paid' | 'pending' | 'refunded'
}

export interface DriverOption {
  id: string
  display_name: string
}

export interface CurrentUser {
  name: string
  role: 'admin' | 'driver'
}
