import { supabase } from '@/lib/supabase'

export interface PricingRules {
  id: string
  base_fee: number
  price_per_km: number
  night_rate_multiplier: number
  min_price: number
  updated_at: string
}

export type PricingRulesUpdatePayload = Partial<
  Pick<PricingRules, 'base_fee' | 'price_per_km' | 'night_rate_multiplier' | 'min_price'>
>

/** Single-row table -- there is always exactly one active rule set. */
export function getPricingRules() {
  return supabase.from('pricing_rules').select('*').limit(1).maybeSingle()
}

export function updatePricingRules(id: string, payload: PricingRulesUpdatePayload) {
  return supabase
    .from('pricing_rules')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
}

/** True for 22:00-06:00 local, or Saturday/Sunday. Matches "gece/hafta sonu katsayısı". */
export function isNightOrWeekendRate(date: Date = new Date()): boolean {
  const day = date.getDay()
  const hour = date.getHours()
  const isWeekend = day === 0 || day === 6
  const isNight = hour >= 22 || hour < 6
  return isWeekend || isNight
}

/**
 * Total Price = max(min_price, (base_fee + distance_km * price_per_km) * multiplier)
 * Pure function -- no I/O, fully unit-testable, matches the formula exactly as specified.
 */
export function calculateTransferPrice(
  distanceKm: number,
  rules: Pick<PricingRules, 'base_fee' | 'price_per_km' | 'night_rate_multiplier' | 'min_price'>,
  applyNightRate: boolean,
): number {
  const multiplier = applyNightRate ? rules.night_rate_multiplier : 1
  const raw = (rules.base_fee + distanceKm * rules.price_per_km) * multiplier
  return Math.max(rules.min_price, Math.round(raw))
}
