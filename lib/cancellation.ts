/**
 * Cancellation policy, client side.
 *
 * Postgres is the authority: `refund_entitlement()` computes the number
 * and `stamp_booking_cancellation()` freezes it onto the row. This mirror
 * exists so a guest can be told what they will get back *before* they
 * confirm — being shown a number after the fact is not a choice.
 *
 * The tiers themselves come from the `cancellation_rules` table, never
 * from here. Hardcoding "48 hours, 100%" in the app would mean the policy
 * silently disagreeing with itself the first time the owner changed it.
 */

export interface CancellationRule {
  id: string
  min_hours_before: number
  refund_percent: number
  label: string
}

export interface RefundEstimate {
  refund: number
  percent: number
  label: string
  hoursBefore: number
}

/**
 * Departure as an instant.
 *
 * A booking with no scheduled time is treated as departing at the end of
 * that day — the reading that favours the guest, and for a Northern Lights
 * chase also the true one. Anchored to Europe/Oslo like every other date
 * in this codebase, so a guest cancelling from another timezone gets the
 * same answer as one standing in Tromsø.
 */
export function departureInstant(bookingDate: string, scheduledTime: string | null): Date {
  const time = scheduledTime && /^\d{2}:\d{2}/.test(scheduledTime) ? scheduledTime.slice(0, 5) : '23:59'
  // Oslo is UTC+1 in winter and UTC+2 in summer. Rather than guess, ask
  // Intl what the offset is on that specific date.
  const naive = new Date(`${bookingDate}T${time}:00Z`)
  const osloParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    timeZoneName: 'shortOffset',
  }).formatToParts(naive)
  const offsetName = osloParts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1'
  const offsetHours = Number(offsetName.replace('GMT', '')) || 0
  return new Date(naive.getTime() - offsetHours * 3600_000)
}

export function hoursUntilDeparture(
  bookingDate: string,
  scheduledTime: string | null,
  now: Date = new Date(),
): number {
  const diff = (departureInstant(bookingDate, scheduledTime).getTime() - now.getTime()) / 3600_000
  // Already departed counts as zero, not negative: a negative figure would
  // match no tier and read as "policy unknown" rather than "no refund".
  return Math.max(0, diff)
}

/**
 * The most generous tier the guest qualifies for.
 *
 * Deliberately not "the first matching row": if the rules are ever
 * entered in an odd order, picking the first would quietly cost somebody
 * money. Sorting by refund makes the outcome independent of row order.
 */
export function estimateRefund(
  totalPrice: number,
  bookingDate: string,
  scheduledTime: string | null,
  rules: CancellationRule[],
  now: Date = new Date(),
): RefundEstimate | null {
  if (rules.length === 0) return null

  const hoursBefore = hoursUntilDeparture(bookingDate, scheduledTime, now)
  const eligible = rules.filter((r) => r.min_hours_before <= hoursBefore)
  if (eligible.length === 0) return null

  const best = eligible.reduce((a, b) => (b.refund_percent > a.refund_percent ? b : a))

  return {
    refund: Math.round(totalPrice * best.refund_percent) / 100,
    percent: best.refund_percent,
    label: best.label,
    hoursBefore,
  }
}

/** Statuses a guest is allowed to cancel from. */
const GUEST_CANCELLABLE = ['pending', 'confirmed', 'assigned']

/**
 * A trip already under way or finished is not the guest's to call off —
 * that becomes a conversation, not a button.
 */
export function guestCanCancel(status: string): boolean {
  return GUEST_CANCELLABLE.includes(status)
}
