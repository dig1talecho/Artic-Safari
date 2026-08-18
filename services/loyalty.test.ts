import { describe, it, expect } from 'vitest'
import { previewRedemption, estimatePointsEarned, type LoyaltyRules } from './loyalty.service'

/**
 * Reward points decide how much a guest actually pays, and a wrong answer
 * here is silent: no error, no crash, just a total that is quietly wrong
 * on every booking until somebody complains.
 *
 * This is a PREVIEW. `apply_loyalty_redemption()` in Postgres re-reads the
 * real balance and rewrites total_price, so a tampered client value gets
 * clamped rather than trusted. These tests pin the preview to the same
 * arithmetic, because a preview that disagrees with the charge is its own
 * kind of broken -- the guest sees one number and is billed another.
 */

// The live defaults: 2% cashback, 1 point = 1 kr, 100 to unlock, half the
// booking at most.
const rules: Pick<LoyaltyRules, 'kr_per_point' | 'min_redeem_points' | 'max_redeem_percent'> = {
  kr_per_point: 1,
  min_redeem_points: 100,
  max_redeem_percent: 50,
}

describe('previewRedemption', () => {
  it('spends what was asked for when everything allows it', () => {
    expect(previewRedemption(200, 500, 2250, rules)).toEqual({ points: 200, discount: 200 })
  })

  it('never spends more than the guest actually has', () => {
    // Asking for 900 with 300 in the account must not invent 600 points.
    expect(previewRedemption(900, 300, 5000, rules)).toEqual({ points: 300, discount: 300 })
  })

  it('caps the discount at half the booking', () => {
    // 2,000 kr booking, 50% cap -> 1,000 kr, even with 5,000 points held.
    expect(previewRedemption(5000, 5000, 2000, rules)).toEqual({ points: 1000, discount: 1000 })
  })

  it('refuses below the minimum, and says why', () => {
    const result = previewRedemption(50, 50, 2250, rules)
    expect(result.points).toBe(0)
    expect(result.discount).toBe(0)
    expect(result.reason).toContain('100')
  })

  it('treats the minimum as a balance test, not a request test', () => {
    // 150 in the account clears the 100 threshold; spending only 120 of
    // them is allowed. The old reading would have rejected this.
    expect(previewRedemption(120, 150, 2250, rules)).toEqual({ points: 120, discount: 120 })
  })

  it('gives nothing away for a zero or negative request', () => {
    expect(previewRedemption(0, 500, 2250, rules)).toEqual({ points: 0, discount: 0 })
    expect(previewRedemption(-100, 500, 2250, rules)).toEqual({ points: 0, discount: 0 })
  })

  it('cannot make a booking free', () => {
    const result = previewRedemption(99999, 99999, 1000, rules)
    expect(result.discount).toBeLessThan(1000)
    expect(result.discount).toBe(500)
  })

  it('survives a misconfigured point value instead of dividing by zero', () => {
    const broken = { ...rules, kr_per_point: 0 }
    expect(previewRedemption(500, 500, 2250, broken)).toEqual({ points: 0, discount: 0 })
  })

  it('honours a point worth more than a krone', () => {
    // 2 kr per point, 2,000 kr booking, 50% cap -> 1,000 kr -> 500 points.
    const richer = { ...rules, kr_per_point: 2 }
    expect(previewRedemption(5000, 5000, 2000, richer)).toEqual({ points: 500, discount: 1000 })
  })

  it('rounds points down, never up, when the cap does not divide evenly', () => {
    // 1,001 kr booking, 50% -> 501 (rounded) -> at 2 kr/point, 250 points
    // and 500 kr. Rounding up would hand out a krone nobody earned.
    const richer = { ...rules, kr_per_point: 2 }
    const result = previewRedemption(5000, 5000, 1001, richer)
    expect(result.points).toBe(250)
    expect(result.discount).toBe(500)
  })
})

describe('estimatePointsEarned', () => {
  // 2% cashback: 100 kr spent earns 2 points.
  const earn = { points_per_100_kr: 2 }

  /*
    Points accrue PER KRONE and are floored, not in whole 100 kr blocks.
    99 kr therefore earns 1 point (0.99 x 2 = 1.98 -> 1), not 0.
    Documented here because it is easy to read "2 points per 100 kr" as
    block-based and then quietly change the behaviour while "fixing" it.

    OPEN QUESTION for whoever wires the award trigger: award_loyalty_points()
    in Postgres is what actually credits the account, and if it blocks
    instead of pro-rating, a guest is shown 1 point and credited 0. Worth
    running both against the same total before payment goes live.
  */
  it.each([
    [2250, 45],
    [5000, 100],
    [15000, 300],
    [99, 1],
    [100, 2],
    [49, 0], // genuinely too small to earn anything
  ])('%s kr -> %s points', (total, expected) => {
    expect(estimatePointsEarned(total, earn)).toBe(expected)
  })

  it('never awards a fraction of a point', () => {
    expect(Number.isInteger(estimatePointsEarned(1234, earn))).toBe(true)
  })
})

/**
 * Partner promo discount.
 *
 * The percentage is applied in the booking forms, but the commission it
 * implies is resolved by resolve_booking_partner() in Postgres from the
 * code alone -- the rate never reaches the browser. What is testable here
 * is the guest-facing half: the discount the customer is shown.
 */
function applyPromo(subtotal: number, discountPercent: number) {
  const discount = Math.round((subtotal * discountPercent) / 100)
  return { discount, total: subtotal - discount }
}

describe('partner promo discount', () => {
  it('takes the stated percentage off', () => {
    expect(applyPromo(2250, 10)).toEqual({ discount: 225, total: 2025 })
  })

  it('rounds to whole kroner', () => {
    // 2,255 x 10% = 225.5 -> 226, matching the booking forms.
    expect(applyPromo(2255, 10)).toEqual({ discount: 226, total: 2029 })
  })

  it('is a no-op at zero percent', () => {
    expect(applyPromo(2250, 0)).toEqual({ discount: 0, total: 2250 })
  })

  it('cannot produce a negative total at the schema ceiling', () => {
    // partnerInsertSchema caps customer_discount_percent at 50.
    const { total } = applyPromo(2250, 50)
    expect(total).toBe(1125)
    expect(total).toBeGreaterThan(0)
  })
})
