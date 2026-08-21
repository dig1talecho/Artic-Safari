/**
 * Asks the server to email the guest their booking confirmation.
 *
 * Deliberately fire-and-forget and deliberately silent. The booking is
 * already saved by the time this runs; if the email fails, telling the
 * guest their booking failed would be a lie, and telling them the email
 * failed is noise they can do nothing about. Failures are recorded in
 * notification_log, which is where an operator can see them.
 */
export function notifyBookingCreated(bookingId: string): void {
  if (!bookingId) return
  void fetch('/api/booking-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId }),
  }).catch(() => {
    // Nothing useful to do here, and nothing the guest should see.
  })
}
