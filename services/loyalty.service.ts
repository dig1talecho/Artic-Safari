import { supabase } from '@/lib/supabase'
import { loyaltyRulesUpdateSchema, loyaltyAdjustmentSchema } from '@/lib/validation'

// Requires supabase-loyalty-points-setup.sql. Every read here degrades to
// null/[] if that migration hasn't run, so the booking flow keeps working
// without loyalty rather than erroring -- same pattern as promo codes.

export interface LoyaltyRules {
  id: string
  points_per_100_kr: number
  kr_per_point: number
  min_redeem_points: number
  max_redeem_percent: number
  updated_at: string
}

export interface LoyaltyBalance {
  user_id: string
  balance: number
  lifetime_earned: number
  lifetime_spent: number
  last_activity_at: string | null
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  booking_id: string | null
  points: number
  kind: 'earned' | 'redeemed' | 'adjustment' | 'expired'
  reason: string | null
  created_at: string
}

export function getLoyaltyRules() {
  return supabase.from('loyalty_rules').select('*').limit(1).maybeSingle()
}

export function updateLoyaltyRules(id: string, payload: Partial<Omit<LoyaltyRules, 'id' | 'updated_at'>>) {
  const parsed = loyaltyRulesUpdateSchema.partial().safeParse(payload)
  if (!parsed.success) {
    return Promise.resolve({
      data: null,
      error: { message: parsed.error.issues[0]?.message ?? 'Invalid loyalty rules' },
    })
  }
  return supabase
    .from('loyalty_rules')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
}

/** RLS scopes this to the caller's own row. */
export function getMyLoyaltyBalance(userId: string) {
  return supabase.from('loyalty_balances').select('*').eq('user_id', userId).maybeSingle()
}

export function listMyLoyaltyTransactions(userId: string, limit = 50) {
  return supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

/** Admin-only goodwill credit/debit -- the only client-writable ledger path. */
export async function createLoyaltyAdjustment(input: {
  user_id: string
  points: number
  reason: string
}) {
  const parsed = loyaltyAdjustmentSchema.safeParse({ ...input, kind: 'adjustment' as const })
  if (!parsed.success) {
    return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid adjustment' } }
  }
  return supabase.from('loyalty_transactions').insert([parsed.data]).select().single()
}

/**
 * UI preview of what a redemption would be worth. Deliberately mirrors the
 * apply_loyalty_redemption() trigger's math so the number shown matches
 * what the server grants -- but this is a *preview only*. The authoritative
 * values come back on the inserted booking as points_redeemed /
 * loyalty_discount, because only the DB can see the guest's real balance.
 */
export function previewRedemption(
  pointsRequested: number,
  balance: number,
  subtotal: number,
  rules: Pick<LoyaltyRules, 'kr_per_point' | 'min_redeem_points' | 'max_redeem_percent'>,
): { points: number; discount: number; reason?: string } {
  if (pointsRequested <= 0) return { points: 0, discount: 0 }
  if (balance < rules.min_redeem_points) {
    return { points: 0, discount: 0, reason: `Minimum ${rules.min_redeem_points} points to redeem` }
  }
  if (rules.kr_per_point <= 0) return { points: 0, discount: 0 }

  const wanted = Math.min(pointsRequested, balance)
  const maxDiscount = Math.round((subtotal * rules.max_redeem_percent) / 100)
  const points = Math.min(wanted, Math.floor(maxDiscount / rules.kr_per_point))

  if (points <= 0) return { points: 0, discount: 0 }
  return { points, discount: Math.round(points * rules.kr_per_point) }
}

/** "You'll earn ~N points" shown before booking. */
export function estimatePointsEarned(totalPrice: number, rules: Pick<LoyaltyRules, 'points_per_100_kr'>): number {
  return Math.floor((totalPrice / 100) * rules.points_per_100_kr)
}
