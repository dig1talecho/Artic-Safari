import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBookingConfirmation } from '@/services/notifications.service'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Sends the "we received your booking" email.
 *
 * Called by the booking forms right after a successful insert. It has to
 * be a server route because RESEND_API_KEY is a secret and must never
 * reach a browser.
 *
 * WHY IT ONLY TAKES AN ID
 * An endpoint that emails whatever address is posted to it is a spam relay
 * with our domain's reputation attached. So the body carries a booking id
 * and nothing else -- the name, address and price are read back from the
 * database. The worst an attacker can do is re-trigger an email to someone
 * who already booked, and only if they know that booking's UUID.
 *
 * Three further limits on that:
 *   - rate limited per IP
 *   - one confirmation per booking, ever, checked against notification_log
 *   - only bookings created in the last hour, so an old id cannot be
 *     replayed months later
 */
export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`booking-confirmation:${ip}`, 10, 60_000)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: { bookingId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const bookingId = body.bookingId
  if (!bookingId || !/^[0-9a-f-]{36}$/i.test(bookingId)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  /*
    Reading a booking back needs more than the anon key: guests may insert
    but not select, which is exactly the RLS rule that protects everyone
    else's details. Without the service key this route cannot do its job,
    and says so rather than pretending.
  */
  if (!url || !serviceKey) {
    return NextResponse.json(
      { sent: false, reason: 'not_configured', detail: 'SUPABASE_SERVICE_ROLE_KEY is not set.' },
      { status: 200 },
    )
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: booking, error } = await admin
    .from('bookings')
    .select('id, customer_email, customer_name, item_title, booking_date, total_price, created_at')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !booking) {
    // Deliberately the same answer as a booking that exists but was already
    // confirmed: probing this endpoint should not reveal which ids are real.
    return NextResponse.json({ sent: false, reason: 'nothing_to_do' }, { status: 200 })
  }

  const ageMs = Date.now() - new Date(booking.created_at as string).getTime()
  if (ageMs > 60 * 60 * 1000) {
    return NextResponse.json({ sent: false, reason: 'nothing_to_do' }, { status: 200 })
  }

  // Already sent? notification_log is written by the service itself, so
  // this is the same record that proves delivery.
  const { count } = await admin
    .from('notification_log')
    .select('id', { head: true, count: 'exact' })
    .eq('booking_id', bookingId)
    .eq('type', 'booking_confirmation')
    .eq('status', 'sent')

  if ((count ?? 0) > 0) {
    return NextResponse.json({ sent: false, reason: 'nothing_to_do' }, { status: 200 })
  }

  const result = await sendBookingConfirmation({
    id: booking.id as string,
    customer_email: booking.customer_email as string,
    customer_name: booking.customer_name as string,
    item_title: booking.item_title as string,
    booking_date: booking.booking_date as string,
    total_price: Number(booking.total_price ?? 0),
  })

  return NextResponse.json(result, { status: 200 })
}
