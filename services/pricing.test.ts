import { describe, it, expect, afterEach, vi } from 'vitest'
import { calculateTransferFare, isNightOrWeekendRate, type PricingRules } from './pricing.service'

/**
 * The fare formula decides real money and is duplicated in Postgres as
 * `calculate_transfer_fare()`. These cases are the contract between the
 * two: the expected numbers below were produced by running that SQL
 * function against the live database, not by re-deriving the arithmetic
 * here. If a change makes one of them fail, the two have drifted and the
 * database is the one that is right.
 */

const rules: PricingRules = {
  id: 'test',
  base_fee: 500,
  price_per_km: 35,
  price_per_minute: 0,
  night_rate_multiplier: 1.25,
  min_price: 800,
  updated_at: '',
}

afterEach(() => {
  vi.useRealTimers()
})

const DAY = new Date('2026-08-19T12:00:00+02:00') // Wednesday midday, Oslo
const NIGHT = new Date('2026-08-19T02:00:00+02:00') // Wednesday 02:00, Oslo

describe('isNightOrWeekendRate', () => {
  it.each([
    ['weekday midday', '2026-08-19T12:00:00+02:00', false],
    ['weekday 21:59', '2026-08-19T21:59:00+02:00', false],
    ['weekday 22:00', '2026-08-19T22:00:00+02:00', true],
    ['weekday 05:59', '2026-08-19T05:59:00+02:00', true],
    ['weekday 06:00', '2026-08-19T06:00:00+02:00', false],
    ['Saturday midday', '2026-08-22T12:00:00+02:00', true],
    ['Sunday midday', '2026-08-23T12:00:00+02:00', true],
  ])('%s -> %s', (_label, iso, expected) => {
    expect(isNightOrWeekendRate(new Date(iso))).toBe(expected)
  })

  it('uses Tromsø time, not the visitor’s', () => {
    // 02:00 in Oslo is 09:00 in Tokyo. A guest booking from Japan must
    // still be charged the night rate for a car driving here at 2am.
    const sameInstantFromTokyo = new Date('2026-08-19T09:00:00+09:00')
    expect(isNightOrWeekendRate(sameInstantFromTokyo)).toBe(true)
  })
})

describe('calculateTransferFare', () => {
  // Verified against calculate_transfer_fare() in Postgres.
  it.each([
    // distance, minutes, multiplier, at,   expected
    [4, 10, 1.0, DAY, 800], // minimum wins: 500+140 = 640
    [4, 10, 1.0, NIGHT, 800], // 640 * 1.25 = 800 exactly
    [4, 10, 1.5, DAY, 1200], // minimum scales with the vehicle
    [5, 12, 1.0, DAY, 800],
    [5, 12, 1.0, NIGHT, 844], // 675 * 1.25 = 843.75 -> 844
    [12, 20, 1.0, NIGHT, 1150],
    [12, 20, 1.5, NIGHT, 1725],
    [25, 35, 1.0, DAY, 1375],
    [25, 35, 1.0, NIGHT, 1719], // 1718.75 -> 1719
    [25, 35, 1.5, DAY, 2063], // 2062.5 -> 2063
    [25, 35, 1.5, NIGHT, 2578], // 2578.125 -> 2578
    [45, 55, 1.0, NIGHT, 2594], // 2593.75 -> 2594
    [45, 55, 1.5, DAY, 3113], // 3112.5 -> 3113
    [45, 55, 1.5, NIGHT, 3891], // 3890.625 -> 3891
  ])('%s km, %s min, x%s -> %s kr', (distanceKm, durationMinutes, fleetMultiplier, at, expected) => {
    expect(
      calculateTransferFare(rules, { distanceKm, durationMinutes, fleetMultiplier, at }),
    ).toBe(expected)
  })

  it('charges for time once a per-minute rate is set', () => {
    const timed = { ...rules, price_per_minute: 5 }
    // 500 + 12*35 + 20*5 = 1020, above the 800 floor.
    expect(calculateTransferFare(timed, { distanceKm: 12, durationMinutes: 20, at: DAY })).toBe(1020)
  })

  it('ignores duration while the per-minute rate is zero', () => {
    const a = calculateTransferFare(rules, { distanceKm: 12, durationMinutes: 0, at: DAY })
    const b = calculateTransferFare(rules, { distanceKm: 12, durationMinutes: 90, at: DAY })
    expect(a).toBe(b)
  })

  it('never returns less than the minimum, scaled by the vehicle', () => {
    const zero = calculateTransferFare(rules, { distanceKm: 0, fleetMultiplier: 1.5, at: DAY })
    expect(zero).toBe(1200)
  })

  it('defaults to a multiplier of 1 when no vehicle is chosen', () => {
    expect(calculateTransferFare(rules, { distanceKm: 25, durationMinutes: 35, at: DAY })).toBe(1375)
  })

  /**
   * Postgres round() on numeric rounds half away from zero; Math.round
   * rounds half up. Fares are always positive so the two agree — this
   * pins that assumption rather than leaving it in a comment.
   */
  it('rounds a half-krone up, matching Postgres', () => {
    const halfKrone: PricingRules = { ...rules, base_fee: 100.5, price_per_km: 0, min_price: 0 }
    expect(calculateTransferFare(halfKrone, { distanceKm: 0, at: DAY })).toBe(101)
  })

  it('rejects nothing and invents nothing when rates are all zero', () => {
    const free: PricingRules = { ...rules, base_fee: 0, price_per_km: 0, min_price: 0 }
    expect(calculateTransferFare(free, { distanceKm: 10, at: DAY })).toBe(0)
  })
})
