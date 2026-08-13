import { supabase } from '@/lib/supabase'

// Honest-degradation pattern used everywhere else in this project (Google
// Maps, service-role booking authority): every function here checks for
// its real credential and makes a genuine API call when present. Absent a
// credential, it logs to notification_log as 'skipped' and returns
// { sent: false, reason: 'not_configured' } instead of pretending to send.

export interface NotificationResult {
  sent: boolean
  reason?: 'not_configured' | 'send_failed'
  error?: string
}

async function logNotification(
  bookingId: string | null,
  type: string,
  channel: 'whatsapp' | 'email' | 'sms',
  status: 'sent' | 'failed' | 'skipped',
  error?: string,
) {
  try {
    await supabase.from('notification_log').insert([{ booking_id: bookingId, type, channel, status, error: error ?? null }])
  } catch {
    // logging must never break the calling flow
  }
}

async function sendWhatsAppCloudMessage(toPhoneE164: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return { ok: false, error: 'not_configured' }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhoneE164.replace(/[^0-9+]/g, ''),
        type: 'text',
        text: { body },
      }),
    })
    if (!res.ok) return { ok: false, error: `WhatsApp API returned ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown WhatsApp send error' }
  }
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? 'bookings@articsafaritour.com'
  if (!apiKey) return { ok: false, error: 'not_configured' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress, to, subject, html }),
    })
    if (!res.ok) return { ok: false, error: `Resend API returned ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown Resend send error' }
  }
}

export async function sendBookingConfirmation(booking: {
  id: string
  customer_email: string
  customer_name: string
  item_title: string
  booking_date: string
  total_price: number
}): Promise<NotificationResult> {
  const html = `<p>Hi ${booking.customer_name},</p><p>Your request for <b>${booking.item_title}</b> on ${booking.booking_date} (${booking.total_price} kr) has been received. We'll confirm shortly.</p>`
  const result = await sendResendEmail(booking.customer_email, 'Artic Safari — Booking Received', html)

  await logNotification(booking.id, 'booking_confirmation', 'email', result.ok ? 'sent' : result.error === 'not_configured' ? 'skipped' : 'failed', result.error)

  if (!result.ok) return { sent: false, reason: result.error === 'not_configured' ? 'not_configured' : 'send_failed', error: result.error }
  return { sent: true }
}

export async function sendAuroraAlert(
  subscriberPhoneE164: string,
  currentKp: number,
  bookingId: string | null = null,
): Promise<NotificationResult> {
  const body = `Artic Safari Aurora Alert: KP index is now ${currentKp.toFixed(1)} over Tromso. Clear skies chase conditions may be active tonight.`
  const result = await sendWhatsAppCloudMessage(subscriberPhoneE164, body)

  await logNotification(bookingId, 'aurora_alert', 'whatsapp', result.ok ? 'sent' : result.error === 'not_configured' ? 'skipped' : 'failed', result.error)

  if (!result.ok) return { sent: false, reason: result.error === 'not_configured' ? 'not_configured' : 'send_failed', error: result.error }
  return { sent: true }
}

export async function sendDriverPickupNotice(booking: {
  id: string
  customer_phone: string | null
}, driverName: string, etaMinutes: number): Promise<NotificationResult> {
  if (!booking.customer_phone) {
    await logNotification(booking.id, 'driver_pickup_notice', 'whatsapp', 'skipped', 'No customer phone on file')
    return { sent: false, reason: 'send_failed', error: 'No customer phone on file' }
  }

  const body = `Your Artic Safari driver ${driverName} is on the way and will arrive in approximately ${etaMinutes} minutes.`
  const result = await sendWhatsAppCloudMessage(booking.customer_phone, body)

  await logNotification(booking.id, 'driver_pickup_notice', 'whatsapp', result.ok ? 'sent' : result.error === 'not_configured' ? 'skipped' : 'failed', result.error)

  if (!result.ok) return { sent: false, reason: result.error === 'not_configured' ? 'not_configured' : 'send_failed', error: result.error }
  return { sent: true }
}
