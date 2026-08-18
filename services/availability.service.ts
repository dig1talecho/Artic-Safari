import { supabase } from '@/lib/supabase'

export interface TourAvailability {
  capacity: number | null
  taken: number
  /** null when capacity is unlimited. */
  free: number | null
  is_exclusive: boolean
}

/**
 * Seats left on a tour for a date.
 *
 * Advisory only. `trg_enforce_booking_capacity` is what actually refuses
 * an overfill, and it holds a lock while it counts -- this call does not,
 * so between reading it and submitting, someone else may take the seat.
 * Its job is to stop a guest filling in a whole form before being told
 * the night is full, not to decide anything.
 *
 * Returns null when the capacity migration has not been run, when the
 * tour has no capacity configured, or on any error. Callers treat null as
 * "no limit known" and show nothing rather than guessing.
 */
export async function getTourAvailability(
  itemTitle: string,
  date: string,
): Promise<TourAvailability | null> {
  if (!itemTitle || !date) return null

  const { data, error } = await supabase
    .rpc('tour_availability', { p_item_title: itemTitle, p_date: date })
    .maybeSingle()

  if (error || !data) return null

  const row = data as TourAvailability
  if (row.capacity === null) return null
  return row
}
