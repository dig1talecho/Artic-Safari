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

// NOT confirmed real pricing -- placeholder day-rate assumptions in the
// same spirit as the original taximeter constants, so the instant-quote
// formula has something concrete to compute with. Get the business's
// actual charter day-rates before this quote is shown as final to a real
// customer (same rule this project has followed for every other price:
// present research/assumptions, get explicit sign-off, then treat as real).
const VEHICLE_DAY_RATE: Record<CharterRequestInput['vehicle_type'], number> = {
  suv: 4500,
  van: 6000,
  luxury_sedan: 5500,
  minibus: 8000,
}
const PER_PAX_RATE = 150
const CATERING_FLAT_FEE = 800

export function calculateCharterQuote(input: Pick<CharterRequestInput, 'vehicle_type' | 'pax' | 'catering_preferences'>): number {
  const base = VEHICLE_DAY_RATE[input.vehicle_type]
  const paxCost = input.pax * PER_PAX_RATE
  const cateringCost = input.catering_preferences?.trim() ? CATERING_FLAT_FEE : 0
  return Math.round(base + paxCost + cateringCost)
}

export async function createCharterRequest(input: CharterRequestInput) {
  const parsed = charterRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid charter request' } }
  }

  const total_quote = calculateCharterQuote(parsed.data)

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
