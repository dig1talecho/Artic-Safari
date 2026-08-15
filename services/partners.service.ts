import { supabase } from '@/lib/supabase'
import { partnerInsertSchema } from '@/lib/validation'

export interface Partner {
  id: string
  hotel_name: string
  contact_name: string | null
  contact_email: string | null
  commission_rate: number
  promo_code: string
  customer_discount_percent: number
  active: boolean
  created_at: string
}

export type PartnerInsertPayload = Omit<Partner, 'id' | 'created_at'>

/** Admin-only: commission_rate/contact details are internal, not public. */
export function listPartners() {
  return supabase.from('partners').select('*').order('created_at', { ascending: false })
}

export async function createPartner(payload: PartnerInsertPayload) {
  const parsed = partnerInsertSchema.safeParse(payload)
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid partner data' } }
  }
  return supabase.from('partners').insert([parsed.data]).select().single()
}

export function updatePartner(id: string, payload: Partial<PartnerInsertPayload>) {
  return supabase.from('partners').update(payload).eq('id', id)
}

export function deletePartner(id: string) {
  return supabase.from('partners').delete().eq('id', id)
}

export interface PromoCodeInfo {
  promo_code: string
  hotel_name: string
  customer_discount_percent: number
}

/**
 * Public-safe lookup used by the booking forms -- reads from
 * public_promo_codes (see supabase-partner-promo-discounts.sql), a view
 * that only ever exposes promo_code/hotel_name/customer_discount_percent,
 * never commission_rate or contact details. Returns null for an unknown,
 * inactive, or 0%-discount code, or if that migration hasn't been run yet.
 */
export async function validatePromoCode(code: string): Promise<PromoCodeInfo | null> {
  const trimmed = code.trim()
  if (!trimmed) return null

  const { data, error } = await supabase
    .from('public_promo_codes')
    .select('promo_code, hotel_name, customer_discount_percent')
    .ilike('promo_code', trimmed)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export interface PartnerCommissionSummary {
  partner: Partner
  bookingCount: number
  totalCommission: number
}

/**
 * Aggregates bookings.commission_amount for a partner. commission_amount is
 * only ever populated by the resolve_booking_partner() DB trigger (never
 * client-writable), so this summary reflects real, server-computed figures.
 */
export async function getPartnerCommissionSummary(partnerId: string): Promise<PartnerCommissionSummary | null> {
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .maybeSingle()

  if (partnerError || !partner) return null

  const { data: bookings } = await supabase
    .from('bookings')
    .select('commission_amount')
    .eq('partner_id', partnerId)
    .neq('status', 'cancelled')

  const rows = bookings ?? []
  return {
    partner,
    bookingCount: rows.length,
    totalCommission: rows.reduce((sum, b) => sum + (Number(b.commission_amount) || 0), 0),
  }
}
