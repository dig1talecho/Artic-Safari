/**
 * The booking lifecycle, as the app sees it.
 *
 * Postgres is the authority: `trg_enforce_booking_status_transition` and
 * its payment twin reject anything illegal, whatever a client sends. This
 * file exists so the UI can avoid *offering* a move that would be
 * rejected — a disabled option is kinder than an error toast.
 *
 * TWO AXES ON PURPOSE
 * Fulfilment and payment are independent timelines. A booking can be
 * confirmed and unpaid, or cancelled and refunded. Merging them into one
 * column would make only one observable at a time, and the driver queue
 * asks "is this assigned?" — a payment value cannot answer that.
 */

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
] as const

export const PAYMENT_STATUSES = [
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/**
 * Mirror of `booking_status_transitions`. Kept in code as well as in the
 * database because the alternative is a round trip before rendering a
 * dropdown — and if the two ever disagree, the database wins and the user
 * sees its error rather than a wrong outcome.
 *
 * `true` means admin-only.
 */
export const STATUS_TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatus, boolean>>> = {
  pending: { confirmed: false, cancelled: false },
  confirmed: { assigned: false, in_progress: false, completed: false, cancelled: false, no_show: false },
  assigned: { in_progress: false, confirmed: false, cancelled: false, no_show: false },
  in_progress: { completed: false, cancelled: false },
  // Terminal, but an admin can still correct a mistake. The audit log
  // records that they did.
  completed: { confirmed: true, cancelled: true },
  cancelled: { pending: true, confirmed: true },
  no_show: { confirmed: true, completed: true },
}

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, Partial<Record<PaymentStatus, boolean>>> = {
  pending: { processing: false, paid: false },
  processing: { paid: false, failed: false },
  failed: { processing: false, paid: false },
  paid: { refunded: false, pending: true },
  refunded: { paid: true },
}

/** What this actor may move this booking to, right now. */
export function allowedStatuses(from: BookingStatus, isAdmin: boolean): BookingStatus[] {
  return Object.entries(STATUS_TRANSITIONS[from] ?? {})
    .filter(([, adminOnly]) => isAdmin || !adminOnly)
    .map(([to]) => to as BookingStatus)
}

export function allowedPaymentStatuses(from: PaymentStatus, isAdmin: boolean): PaymentStatus[] {
  return Object.entries(PAYMENT_TRANSITIONS[from] ?? {})
    .filter(([, adminOnly]) => isAdmin || !adminOnly)
    .map(([to]) => to as PaymentStatus)
}

export function canTransition(from: BookingStatus, to: BookingStatus, isAdmin: boolean): boolean {
  const rule = STATUS_TRANSITIONS[from]?.[to]
  if (rule === undefined) return false
  return isAdmin || !rule
}

/** Wording for people, not for logs. */
export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  assigned: 'Driver assigned',
  in_progress: 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Unpaid',
  processing: 'Payment in progress',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
}

/**
 * Semantic colour, not brand colour. `attention` is anything that needs a
 * human, `bad` is money or a trip that went wrong, `done` is settled.
 */
export type StatusTone = 'attention' | 'active' | 'done' | 'bad' | 'muted'

export const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  pending: 'attention',
  confirmed: 'active',
  assigned: 'active',
  in_progress: 'active',
  completed: 'done',
  cancelled: 'muted',
  no_show: 'bad',
}

export const PAYMENT_TONE: Record<PaymentStatus, StatusTone> = {
  pending: 'attention',
  processing: 'active',
  paid: 'done',
  failed: 'bad',
  refunded: 'muted',
}

/** A booking is live work if it is neither settled nor called off. */
export function isOpenBooking(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'assigned' || status === 'in_progress'
}
