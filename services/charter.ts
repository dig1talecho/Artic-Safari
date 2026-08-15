import { supabase } from '@/lib/supabase'
import { charterRequestSchema } from '@/lib/validation'
import { z } from 'zod'

export interface CharterRequest {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  vehicle_type: 'suv' | 'van' | 'luxury_sedan' | 'minibus'
  catering_preferences: string | null
  pax: number
  total_quote: number
  status: 'pending' | 'confirmed' | 'declined' | 'expired'
  created_at: string
}

export type CharterRequestInput = z.infer<typeof charterRequestSchema>

// Fallback day rates -- used only if supabase-charter-vehicles-setup.sql
// hasn't been run yet or the row is momentarily unreachable. Once that
// migration runs, live rates come from charter_vehicles and an admin's
// price edit takes effect immediately without a code change.
const FALLBACK_DAY_RATE: Record<CharterRequestInput['vehicle_type'], number> = {
  suv: 4500,
  van: 6000,
  luxury_sedan: 5500,
  minibus: 8000,
}
const PER_PAX_RATE = 150
const CATERING_FLAT_FEE = 800

export function calculateCharterQuote(dayRate: number, pax: number, cateringPreferences?: string | null): number {
  const paxCost = pax * PER_PAX_RATE
  const cateringCost = cateringPreferences?.trim() ? CATERING_FLAT_FEE : 0
  return Math.round(dayRate + paxCost + cateringCost)
}

export async function createCharterRequest(input: CharterRequestInput) {
  const parsed = charterRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid charter request' } }
  }

  // Re-reads the live day rate rather than trusting any client-computed
  // total, so an admin's price edit is authoritative and can't be spoofed
  // by a stale or tampered client-side quote.
  const { data: vehicle } = await supabase
    .from('charter_vehicles')
    .select('day_rate')
    .eq('vehicle_type', parsed.data.vehicle_type)
    .maybeSingle()

  const dayRate = vehicle?.day_rate ?? FALLBACK_DAY_RATE[parsed.data.vehicle_type]
  const total_quote = calculateCharterQuote(dayRate, parsed.data.pax, parsed.data.catering_preferences)

  return supabase
    .from('charter_requests')
    .insert([{ ...parsed.data, total_quote, status: 'pending' }])
    .select()
    .single()
}

export function listCharterRequests() {
  return supabase.from('charter_requests').select('*').order('created_at', { ascending: false })
}

export function updateCharterRequestStatus(id: string, status: CharterRequest['status']) {
  return supabase.from('charter_requests').update({ status }).eq('id', id)
}
