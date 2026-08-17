import { describe, it, expect, afterEach, vi } from 'vitest'
import { tromsoToday, tromsoDatePlusYears, isRealCalendarDate, isBookableDate } from './dates'

afterEach(() => {
  vi.useRealTimers()
})

/** Freezes the clock at a real instant so "today" is not a moving target. */
function at(iso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

describe('tromsoToday', () => {
  it('is a Tromsø date, not a UTC one', () => {
    // 22:30 UTC on 18 August is already 00:30 on the 19th in Tromsø.
    at('2026-08-18T22:30:00Z')
    expect(tromsoToday()).toBe('2026-08-19')
  })

  it('does not roll over early when Tromsø is still on the previous day', () => {
    // 23:30 UTC in winter is 00:30 Tromsø, so this one does roll over…
    at('2026-01-15T23:30:00Z')
    expect(tromsoToday()).toBe('2026-01-16')
    // …but 22:30 UTC in winter is only 23:30 Tromsø (UTC+1), so it must not.
    at('2026-01-15T22:30:00Z')
    expect(tromsoToday()).toBe('2026-01-15')
  })

  it('gives the same answer wherever the guest is', () => {
    at('2026-08-18T22:30:00Z')
    const fromNorway = tromsoToday()
    // Same instant, expressed from a different clock. The function reads
    // the instant, not the caller's timezone, so the answer cannot differ.
    const fromTokyo = tromsoToday(new Date('2026-08-19T07:30:00+09:00'))
    expect(fromTokyo).toBe(fromNorway)
  })
})

/**
 * THE REGRESSION THAT PROMPTED ALL OF THIS.
 *
 * The booking form filled in the date one way and the validator checked it
 * another. East of UTC, after local midnight, those were different days and
 * every booking was rejected as being in the past — during exactly the
 * hours people book taxis.
 */
describe('booking at 00:30 local time', () => {
  it('accepts the auto-filled date instead of calling it the past', () => {
    at('2026-08-18T22:30:00Z') // 00:30 on the 19th in Tromsø

    const autoFilled = tromsoToday()
    expect(autoFilled).toBe('2026-08-19')
    expect(isBookableDate(autoFilled)).toBe(true)

    // What the old code produced. Kept so nobody reintroduces it.
    const oldUtcBehaviour = new Date().toISOString().split('T')[0]
    expect(oldUtcBehaviour).toBe('2026-08-18')
    expect(isBookableDate(oldUtcBehaviour)).toBe(false)
  })
})

describe('isBookableDate', () => {
  it('accepts today and rejects yesterday', () => {
    at('2026-08-18T10:00:00Z')
    expect(isBookableDate('2026-08-18')).toBe(true)
    expect(isBookableDate('2026-08-17')).toBe(false)
  })

  it('accepts the last day of the window and rejects the day after', () => {
    at('2026-08-18T10:00:00Z')
    expect(isBookableDate('2028-08-18')).toBe(true)
    expect(isBookableDate('2028-08-19')).toBe(false)
  })

  it('rejects a date that does not exist', () => {
    at('2026-01-01T10:00:00Z')
    // Passes the YYYY-MM-DD regex; JavaScript would roll it to 3 March.
    expect(isBookableDate('2026-02-31')).toBe(false)
  })
})

describe('isRealCalendarDate', () => {
  it.each([
    ['2026-02-28', true],
    ['2028-02-29', true], // leap year
    ['2026-02-29', false], // not a leap year
    ['2026-13-01', false],
    ['2026-04-31', false],
    ['not-a-date', false],
  ])('%s -> %s', (value, expected) => {
    expect(isRealCalendarDate(value)).toBe(expected)
  })
})

describe('tromsoDatePlusYears', () => {
  it('clamps 29 February to the 28th when the target year is not a leap year', () => {
    at('2028-02-29T12:00:00Z')
    expect(tromsoDatePlusYears(2)).toBe('2030-02-28')
  })

  it('keeps 29 February when the target year is a leap year', () => {
    at('2028-02-29T12:00:00Z')
    expect(tromsoDatePlusYears(4)).toBe('2032-02-29')
  })

  it('is unaffected by the daylight-saving change in between', () => {
    // Winter start, summer end. Naive date arithmetic drifts by an hour
    // here and can land on the previous day.
    at('2026-01-15T12:00:00Z')
    expect(tromsoDatePlusYears(1)).toBe('2027-01-15')
  })
})
