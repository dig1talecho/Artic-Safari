/**
 * Booking dates, anchored to Tromsø.
 *
 * THE BUG THIS EXISTS TO KILL
 * `new Date().toISOString().split('T')[0]` gives the date in UTC, while
 * `new Date(new Date().toDateString())` gives midnight in the *browser's*
 * timezone. The booking form used the first to fill in "today" and the
 * validator used the second to check it — so between 22:00 and midnight
 * in Norway (UTC+2 in summer) the form submitted yesterday's date and was
 * then told to "choose a real date between today and 2 years from now".
 * Every late-night booking failed, which is exactly when people book taxis.
 *
 * WHY EUROPE/OSLO AND NOT THE VISITOR'S CLOCK
 * A booking date is a Tromsø date. A guest in Tokyo asking for "tomorrow"
 * means tomorrow here, and a guest in Hawaii must not be able to book a
 * tour for an evening that already ended. Anchoring both the default and
 * the check to one timezone also makes the result the same for everyone,
 * instead of depending on where the person happens to be standing.
 *
 * Everything here works on 'YYYY-MM-DD' strings. That format sorts
 * correctly as plain text, so comparisons never need a Date object and
 * cannot pick up a timezone on the way through.
 */

const TROMSO_TZ = 'Europe/Oslo'

/** Today in Tromsø, as 'YYYY-MM-DD'. `en-CA` is the locale that formats that way. */
export function tromsoToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TROMSO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * The same calendar day N years on, as 'YYYY-MM-DD'.
 *
 * Uses UTC arithmetic deliberately: the input is already a plain calendar
 * date with no time attached, so this is pure day counting and must not
 * drift across a daylight-saving boundary. 29 February is clamped back to
 * the 28th when the target year is not a leap year.
 */
export function tromsoDatePlusYears(years: number, now: Date = new Date()): string {
  const [y, m, d] = tromsoToday(now).split('-').map(Number)
  const target = new Date(Date.UTC(y + years, m - 1, d))
  if (target.getUTCMonth() !== m - 1) target.setUTCDate(0)
  return target.toISOString().split('T')[0]
}

/**
 * True when the string is a date that exists. '2026-02-31' passes a regex
 * but is not a day, and JavaScript would silently roll it to 3 March.
 */
export function isRealCalendarDate(value: string): boolean {
  const parts = value.split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return false
  const [y, m, d] = parts
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/** Today through two years out — the window a booking date must fall in. */
export function isBookableDate(value: string, now: Date = new Date()): boolean {
  if (!isRealCalendarDate(value)) return false
  return value >= tromsoToday(now) && value <= tromsoDatePlusYears(2, now)
}
