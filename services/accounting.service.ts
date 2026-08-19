import { supabase } from '@/lib/supabase'
import type { BookingStatus, PaymentStatus } from '@/lib/booking-lifecycle'

/**
 * Period reporting for the accountant.
 *
 * TWO THINGS THIS DELIBERATELY DOES NOT DECIDE
 *
 * 1. Which date a booking belongs to. Revenue is normally recognised when
 *    the service is delivered (the trip date), but a cash-basis view wants
 *    the date it was sold. Both are offered; the caller picks.
 *
 * 2. Whether a no-show is revenue. Some operators charge in full, some
 *    write it off. It is reported on its own line rather than folded into
 *    either total, so the decision stays with the person qualified to make
 *    it.
 *
 * VAT is not modelled here at all. Norwegian rates differ between
 * passenger transport and other services, and registration status changes
 * the answer again. The panel lets a rate be entered and applies it
 * arithmetically; it does not claim to know which rate is correct.
 */

export type DateBasis = 'trip' | 'booked'

export interface AccountingRow {
  /** Product name as booked. */
  item: string
  bookingType: string
  bookings: number
  guests: number
  /** What guests were charged, after any loyalty discount. */
  gross: number
  /** Kroner given away through reward points. */
  loyaltyDiscount: number
  /** Owed to hotel partners — a cost, not a deduction from gross. */
  commission: number
}

export interface AccountingBucket {
  rows: AccountingRow[]
  bookings: number
  guests: number
  gross: number
  loyaltyDiscount: number
  commission: number
}

export interface AccountingReport {
  from: string
  to: string
  basis: DateBasis
  /** Trips that happened. The safest definition of earned revenue. */
  completed: AccountingBucket
  /** Sold and expected, but not yet delivered. */
  committed: AccountingBucket
  /** Charged or written off — your accountant's call, so kept separate. */
  noShow: AccountingBucket
  /** Reported for completeness; never counted as revenue anywhere above. */
  cancelled: AccountingBucket
  /** Of the completed bucket, how much is actually collected. */
  paidGross: number
  unpaidGross: number
}

interface RawBooking {
  item_title: string
  booking_type: string
  status: BookingStatus
  total_price: number | null
  payment_status: PaymentStatus | null
  // Optional: these columns only exist once their migration has been run.
  // Typed as possibly-undefined so the code cannot forget that.
  party_size?: number | null
  loyalty_discount?: number | null
  commission_amount?: number | null
}

const COMMITTED: BookingStatus[] = ['pending', 'confirmed', 'assigned', 'in_progress']

function emptyBucket(): AccountingBucket {
  return { rows: [], bookings: 0, guests: 0, gross: 0, loyaltyDiscount: 0, commission: 0 }
}

function addTo(bucket: AccountingBucket, b: RawBooking) {
  const gross = Number(b.total_price ?? 0)
  const loyalty = Number(b.loyalty_discount ?? 0)
  const commission = Number(b.commission_amount ?? 0)
  const guests = Number(b.party_size ?? 1)

  let row = bucket.rows.find((r) => r.item === b.item_title)
  if (!row) {
    row = {
      item: b.item_title,
      bookingType: b.booking_type,
      bookings: 0,
      guests: 0,
      gross: 0,
      loyaltyDiscount: 0,
      commission: 0,
    }
    bucket.rows.push(row)
  }

  row.bookings += 1
  row.guests += guests
  row.gross += gross
  row.loyaltyDiscount += loyalty
  row.commission += commission

  bucket.bookings += 1
  bucket.guests += guests
  bucket.gross += gross
  bucket.loyaltyDiscount += loyalty
  bucket.commission += commission
}

/**
 * Aggregates a date range straight from the database rather than from
 * whatever the admin screen happens to have loaded — an accounting period
 * is usually older than the live booking list.
 */
export async function getAccountingReport(
  from: string,
  to: string,
  basis: DateBasis = 'trip',
): Promise<{ data: AccountingReport | null; error: { message: string } | null }> {
  const dateColumn = basis === 'trip' ? 'booking_date' : 'created_at'

  // created_at is a timestamp, so an inclusive end date needs the whole of
  // that day. Comparing against the bare date would silently drop every
  // booking made after midnight on the last day of the period.
  const upperBound = basis === 'trip' ? to : `${to}T23:59:59.999Z`

  /*
    `select('*')` rather than a column list on purpose.
    loyalty_discount and commission_amount come from optional migrations,
    and naming a column that does not exist makes Postgres reject the whole
    query -- so the accounting screen died completely because the rewards
    module had never been installed. Selecting everything and reading each
    field defensively means a missing optional feature costs you that
    column, not the report.
  */
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte(dateColumn, from)
    .lte(dateColumn, upperBound)

  if (error) return { data: null, error: { message: error.message } }

  const report: AccountingReport = {
    from,
    to,
    basis,
    completed: emptyBucket(),
    committed: emptyBucket(),
    noShow: emptyBucket(),
    cancelled: emptyBucket(),
    paidGross: 0,
    unpaidGross: 0,
  }

  for (const b of (data ?? []) as RawBooking[]) {
    if (b.status === 'completed') {
      addTo(report.completed, b)
      if (b.payment_status === 'paid') report.paidGross += Number(b.total_price ?? 0)
      else report.unpaidGross += Number(b.total_price ?? 0)
    } else if (b.status === 'no_show') {
      addTo(report.noShow, b)
    } else if (b.status === 'cancelled') {
      addTo(report.cancelled, b)
    } else if (COMMITTED.includes(b.status)) {
      addTo(report.committed, b)
    }
  }

  const byGross = (a: AccountingRow, b: AccountingRow) => b.gross - a.gross
  report.completed.rows.sort(byGross)
  report.committed.rows.sort(byGross)
  report.noShow.rows.sort(byGross)
  report.cancelled.rows.sort(byGross)

  return { data: report, error: null }
}

/** First and last day of a month, quarter or year, as YYYY-MM-DD. */
export function periodRange(kind: 'month' | 'quarter' | 'year', year: number, index = 0) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()

  if (kind === 'year') {
    return { from: `${year}-01-01`, to: `${year}-12-31` }
  }
  if (kind === 'quarter') {
    const startMonth = index * 3 + 1
    const endMonth = startMonth + 2
    return {
      from: `${year}-${pad(startMonth)}-01`,
      to: `${year}-${pad(endMonth)}-${pad(lastDay(year, endMonth))}`,
    }
  }
  const month = index + 1
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(lastDay(year, month))}` }
}

/**
 * CSV for the accountant.
 *
 * Semicolon-separated with a comma decimal mark: that is what Norwegian
 * Excel expects, and a comma-separated file with dot decimals opens as a
 * single mangled column on a Norwegian machine.
 */
export function reportToCsv(report: AccountingReport, vatPercent: number | null): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const num = (n: number) => n.toFixed(2).replace('.', ',')

  const lines: string[] = []
  lines.push(esc('Artic Safari — period report'))
  lines.push(`${esc('Period')};${esc(`${report.from} to ${report.to}`)}`)
  lines.push(
    `${esc('Dated by')};${esc(report.basis === 'trip' ? 'Trip date (service delivered)' : 'Booking date (when sold)')}`,
  )
  lines.push('')

  const section = (title: string, bucket: AccountingBucket) => {
    if (bucket.rows.length === 0) return
    lines.push(esc(title))
    lines.push(
      ['Product', 'Type', 'Bookings', 'Guests', 'Gross NOK', 'Loyalty discount NOK', 'Partner commission NOK']
        .map(esc)
        .join(';'),
    )
    for (const r of bucket.rows) {
      lines.push(
        [
          esc(r.item),
          esc(r.bookingType),
          r.bookings,
          r.guests,
          num(r.gross),
          num(r.loyaltyDiscount),
          num(r.commission),
        ].join(';'),
      )
    }
    lines.push(
      [esc('Total'), '', bucket.bookings, bucket.guests, num(bucket.gross), num(bucket.loyaltyDiscount), num(bucket.commission)].join(';'),
    )
    lines.push('')
  }

  section('Completed — service delivered', report.completed)
  section('Committed — sold, not yet delivered', report.committed)
  section('No-show — charge or write off, your decision', report.noShow)
  section('Cancelled — not counted as revenue', report.cancelled)

  lines.push(esc('Collection status, completed only'))
  lines.push(`${esc('Paid')};${num(report.paidGross)}`)
  lines.push(`${esc('Outstanding')};${num(report.unpaidGross)}`)

  if (vatPercent !== null && vatPercent > 0) {
    const gross = report.completed.gross
    const net = gross / (1 + vatPercent / 100)
    lines.push('')
    lines.push(esc(`VAT split at ${vatPercent}% — rate entered by the operator, not verified`))
    lines.push(`${esc('Gross')};${num(gross)}`)
    lines.push(`${esc('Net')};${num(net)}`)
    lines.push(`${esc('VAT')};${num(gross - net)}`)
  }

  return lines.join('\n')
}
