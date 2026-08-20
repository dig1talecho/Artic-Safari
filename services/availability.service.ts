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
  tourId?: string,
): Promise<TourAvailability | null> {
  if (!date) return null
  if (!itemTitle && !tourId) return null

  /*
    By id when we have one. The title path is a fallback and a known
    liability: the catalogue holds "Northern Lights Tour - Private Group"
    while real bookings carry "Northern Lights (Private Group)", so name
    matching silently found nothing and capacity quietly did not apply.
  */
  const { data, error } = tourId
    ? await supabase.rpc('tour_availability_by_id', { p_tour_id: tourId, p_date: date }).maybeSingle()
    : await supabase.rpc('tour_availability', { p_item_title: itemTitle, p_date: date }).maybeSingle()

  if (error || !data) return null

  const row = data as TourAvailability
  if (row.capacity === null) return null
  return row
}
