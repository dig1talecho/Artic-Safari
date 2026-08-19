import { describe, it, expect } from 'vitest'
import {
  estimateRefund,
  hoursUntilDeparture,
  guestCanCancel,
  departureInstant,
  type CancellationRule,
} from './cancellation'

/**
 * Refunds are money leaving the business, so the arithmetic gets the same
 * treatment as the fare formula: pinned, and pinned against the same rules
 * Postgres uses.
 *
 * `refund_entitlement()` in SQL is the authority and freezes its answer
 * onto the row at cancellation time. These tests exist because the guest
 * is shown a number *before* confirming, and a preview that disagrees with
 * the charge is its own kind of broken.
 */

const rules: CancellationRule[] = [
  { id: '1', min_hours_before: 48, refund_percent: 100, label: 'Free up to 48 hours before' },
  { id: '2', min_hours_before: 24, refund_percent: 50, label: '50% between 24 and 48 hours' },
  { id: '3', min_hours_before: 0, refund_percent: 0, label: 'No refund within 24 hours' },
]

// A Wednesday, 20:00 Oslo — a plausible Northern Lights departure.
const DEPARTURE_DATE = '2026-09-02'
const DEPARTURE_TIME = '20:00'

/** N hours before that departure, as a real instant. */
function hoursBefore(n: number): Date {
  return new Date(departureInstant(DEPARTURE_DATE, DEPARTURE_TIME).getTime() - n * 3600_000)
}

describe('hoursUntilDeparture', () => {
  it('measures from now to the departure instant', () => {
    expect(hoursUntilDeparture(DEPARTURE_DATE, DEPARTURE_TIME, hoursBefore(72))).toBeCloseTo(72, 1)
  })

  it('treats a departed trip as zero, not negative', () => {
    // Negative would match no tier and read as "policy unknown" rather
    // than "no refund", which is a very different message to show someone.
    expect(hoursUntilDeparture(DEPARTURE_DATE, DEPARTURE_TIME, hoursBefore(-5))).toBe(0)
  })

  it('treats a booking with no time as departing at end of day', () => {
    // 23:59, which favours the guest — and for an aurora chase is true.
    const midday = new Date(`${DEPARTURE_DATE}T12:00:00+02:00`)
    expect(hoursUntilDeparture(DEPARTURE_DATE, null, midday)).toBeCloseTo(11.98, 1)
  })

  it('gives the same answer from any timezone', () => {
    // Same instant, expressed two ways. The function reads the instant,
    // not the caller's clock.
    const fromOslo = new Date('2026-08-31T20:00:00+02:00')
    const fromTokyo = new Date('2026-09-01T03:00:00+09:00')
    expect(hoursUntilDeparture(DEPARTURE_DATE, DEPARTURE_TIME, fromOslo)).toBeCloseTo(
      hoursUntilDeparture(DEPARTURE_DATE, DEPARTURE_TIME, fromTokyo),
      5,
    )
  })
})

describe('estimateRefund', () => {
  it('returns everything well outside the window', () => {
    const r = estimateRefund(2250, DEPARTURE_DATE, DEPARTURE_TIME, rules, hoursBefore(72))
    expect(r).toMatchObject({ refund: 2250, percent: 100 })
  })

  it('returns half inside the middle tier', () => {
    const r = estimateRefund(2250, DEPARTURE_DATE, DEPARTURE_TIME, rules, hoursBefore(30))
    expect(r).toMatchObject({ refund: 1125, percent: 50 })
  })

  it('returns nothing inside the final tier', () => {
    const r = estimateRefund(2250, DEPARTURE_DATE, DEPARTURE_TIME, rules, hoursBefore(6))
    expect(r).toMatchObject({ refund: 0, percent: 0 })
  })

  it('is generous exactly on a boundary', () => {
    // At precisely 48 hours the guest qualifies for the 48-hour tier.
    // A strict > would silently downgrade someone who cancelled on time.
    const r = estimateRefund(2250, DEPARTURE_DATE, DEPARTURE_TIME, rules, hoursBefore(48))
    expect(r?.percent).toBe(100)
  })

  it('picks the most generous tier regardless of row order', () => {
    // Rules entered backwards must not cost the guest money.
    const shuffled = [rules[2], rules[0], rules[1]]
    const r = estimateRefund(2250, DEPARTURE_DATE, DEPARTURE_TIME, shuffled, hoursBefore(72))
    expect(r?.percent).toBe(100)
  })

  it('rounds to the øre, never up to a whole krone', () => {
    // 1,999 x 50% = 999.50, which must stay 999.5 rather than becoming 1000.
    const r = estimateRefund(1999, DEPARTURE_DATE, DEPARTURE_TIME, rules, hoursBefore(30))
    expect(r?.refund).toBe(999.5)
  })

  it('returns null rather than guessing when no policy is configured', () => {
    // An empty table must not silently mean "full refund" or "no refund".
    expect(estimateRefund(2250, DEPARTURE_DATE, DEPARTURE_TIME, [], hoursBefore(72))).toBeNull()
  })

  it('returns null when no tier covers the time remaining', () => {
    const gapped: CancellationRule[] = [
      { id: '1', min_hours_before: 100, refund_percent: 100, label: 'Only very early' },
    ]
    expect(estimateRefund(2250, DEPARTURE_DATE, DEPARTURE_TIME, gapped, hoursBefore(10))).toBeNull()
  })

  it('never returns more than was paid', () => {
    const overGenerous: CancellationRule[] = [
      { id: '1', min_hours_before: 0, refund_percent: 100, label: 'Always full' },
    ]
    const r = estimateRefund(2250, DEPARTURE_DATE, DEPARTURE_TIME, overGenerous, hoursBefore(1))
    expect(r?.refund).toBeLessThanOrEqual(2250)
  })
})

describe('guestCanCancel', () => {
  it.each([
    ['pending', true],
    ['confirmed', true],
    ['assigned', true],
    // A trip under way or finished is a conversation, not a button.
    ['in_progress', false],
    ['completed', false],
    ['cancelled', false],
    ['no_show', false],
  ])('%s -> %s', (status, expected) => {
    expect(guestCanCancel(status)).toBe(expected)
  })
})
