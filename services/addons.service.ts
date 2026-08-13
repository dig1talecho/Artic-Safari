import { supabase } from '@/lib/supabase'
import { tourAddonInsertSchema, cartAddonSchema } from '@/lib/validation'
import { z } from 'zod'

export interface TourAddon {
  id: string
  tour_id: string
  name: string
  description: string
  price: number
  active: boolean
  created_at: string
}

export type TourAddonInsertPayload = Omit<TourAddon, 'id' | 'created_at'>

export interface BookingAddon {
  id: string
  booking_id: string
  addon_id: string | null
  name: string
  quantity: number
  price_at_booking: number
  created_at: string
}

export type CartAddon = z.infer<typeof cartAddonSchema>

export function listAddonsForTour(tourId: string) {
  return supabase.from('tour_addons').select('*').eq('tour_id', tourId).eq('active', true).order('price')
}

export function listAllAddonsForTourAdmin(tourId: string) {
  return supabase.from('tour_addons').select('*').eq('tour_id', tourId).order('created_at', { ascending: false })
}

export async function createAddon(payload: TourAddonInsertPayload) {
  const parsed = tourAddonInsertSchema.safeParse(payload)
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid add-on data' } }
  }
  return supabase.from('tour_addons').insert([parsed.data]).select().single()
}

export function updateAddon(id: string, payload: Partial<TourAddonInsertPayload>) {
  return supabase.from('tour_addons').update(payload).eq('id', id)
}

export function deleteAddon(id: string) {
  return supabase.from('tour_addons').delete().eq('id', id)
}

/** Called right after the parent booking insert succeeds -- each cart line
 * becomes one booking_addons row, price/name snapshotted at booking time. */
export async function attachAddonsToBooking(bookingId: string, cart: CartAddon[]) {
  if (cart.length === 0) return { data: [], error: null }

  const parsed = z.array(cartAddonSchema).safeParse(cart)
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid add-on selection' } }
  }

  const rows = parsed.data.map((item) => ({
    booking_id: bookingId,
    addon_id: item.addon_id,
    name: item.name,
    quantity: item.quantity,
    price_at_booking: item.price_at_booking,
  }))

  return supabase.from('booking_addons').insert(rows).select()
}

export function listAddonsForBooking(bookingId: string) {
  return supabase.from('booking_addons').select('*').eq('booking_id', bookingId)
}

export function calculateCartTotal(cart: CartAddon[]): number {
  return cart.reduce((sum, item) => sum + item.price_at_booking * item.quantity, 0)
}
