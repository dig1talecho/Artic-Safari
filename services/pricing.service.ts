import { supabase } from '@/lib/supabase'
import { pricingRulesUpdateSchema } from '@/lib/validation'

export interface PricingRules {
  id: string
  base_fee: number
  price_per_km: number
  price_per_minute: number
  night_rate_multiplier: number
  min_price: number
  updated_at: string
}

export type PricingRulesUpdatePayload = Partial<
  Pick<
    PricingRules,
    'base_fee' | 'price_per_km' | 'price_per_minute' | 'night_rate_multiplier' | 'min_price'
  >
>

/** Single-row table -- there is always exactly one active rule set. */
export function getPricingRules() {
  return supabase.from('pricing_rules').select('*').limit(1).maybeSingle()
}

export async function updatePricingRules(id: string, payload: PricingRulesUpdatePayload) {
  const parsed = pricingRulesUpdateSchema.partial().safeParse(payload)
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid pricing values' } }
  }
  return supabase
    .from('pricing_rules')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
}

/**
 * Night / weekend test, evaluated in TROMSØ time regardless of where the
 * viewer is.
 *
 * This used to read the visitor's own clock, which meant a guest whose
 * phone was set to another timezone could miss the night rate for a car
 * that is genuinely driving at 02:00 here. `calculate_transfer_fare()` in
 * Postgres does the same conversion, so the two agree.
 */
export function isNightOrWeekendRate(date: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date)

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? ''

  const isWeekend = weekday === 'Sat' || weekday === 'Sun'
  const isNight = hour >= 22 || hour < 6
  return isWeekend || isNight
}

export interface FareInput {
  distanceKm: number
  durationMinutes?: number
  /** Multiplier from the chosen vehicle class. 1 when none is selected. */
  fleetMultiplier?: number
  at?: Date
}

/**
 * PREVIEW ONLY -- the database is the authority.
 *
 * A deliberate mirror of `calculate_transfer_fare()` in
 * supabase-taximeter-pricing.sql, kept in step with it line for line so
 * the admin panel can recalculate instantly while someone types, without
 * a round trip per keystroke.
 *
 *   fare  = (base + km·per_km + min·per_min) · night · fleet
 *   total = max(round(min_price · fleet), round(fare))
 *
 * The real price of a booking is set by the trg_0_calculate_transfer_fare
 * trigger at insert time, so a tampered client value cannot stick. If this
 * function and the trigger ever disagree, the trigger wins and this one is
 * the bug. `verifyFareAgainstDatabase()` below exists to catch exactly
 * that drift.
 */
export function calculateTransferFare(
  rules: Pick<
    PricingRules,
    'base_fee' | 'price_per_km' | 'price_per_minute' | 'night_rate_multiplier' | 'min_price'
  >,
  { distanceKm, durationMinutes = 0, fleetMultiplier = 1, at = new Date() }: FareInput,
): number {
  const nightMultiplier = isNightOrWeekendRate(at) ? rules.night_rate_multiplier : 1

  const raw =
    (rules.base_fee +
      distanceKm * rules.price_per_km +
      durationMinutes * (rules.price_per_minute ?? 0)) *
    nightMultiplier *
    fleetMultiplier

  // Postgres round() on numeric rounds half away from zero; Math.round
  // rounds half up. Fares are always positive, so the two agree.
  return Math.max(Math.round(rules.min_price * fleetMultiplier), Math.round(raw))
}

/**
 * Asks Postgres for the same fare and reports whether the mirror above
 * still matches. Cheap insurance against the two formulas drifting the
 * next time one of them is edited -- the admin panel runs it after a save.
 *
 * Returns null when the function is missing, which means the migration
 * has not been run yet rather than that the numbers disagree.
 */
export async function verifyFareAgainstDatabase(input: {
  distanceKm: number
  durationMinutes: number
  fleetCode: string | null
}): Promise<{ dbFare: number; error: null } | { dbFare: null; error: string }> {
  const { data, error } = await supabase.rpc('calculate_transfer_fare', {
    p_distance_km: input.distanceKm,
    p_duration_minutes: input.durationMinutes,
    p_fleet_class: input.fleetCode,
  })

  if (error) return { dbFare: null, error: error.message }
  if (data === null || data === undefined) {
    return { dbFare: null, error: 'No pricing rules found in the database.' }
  }
  return { dbFare: Number(data), error: null }
}

/**
 * @deprecated Use calculateTransferFare, which also handles the per-minute
 * rate and the vehicle-class multiplier. Kept so the existing taximeter
 * widget keeps compiling until the taxi panel is rebuilt.
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
