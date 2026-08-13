import crypto from 'node:crypto'

// Server-only module (uses node:crypto and a server secret) -- import this
// from a Route Handler or Server Component, never from a 'use client'
// component, or the signing secret would end up in the browser bundle.

export interface BookingTicketPayload {
  bookingId: string
  itemTitle: string
  customerName: string
  bookingDate: string
}

/**
 * HMAC-SHA256 verification token for a booking, used as the QR code
 * payload. This part works today with zero external accounts -- a driver
 * or gate staff scanning the code can call verifyBookingToken() to confirm
 * it's a genuine, unmodified ticket for that booking, entirely within our
 * own infrastructure.
 */
export function generateBookingToken(bookingId: string): string {
  const secret = process.env.WALLET_PASS_SECRET
  if (!secret) {
    throw new Error(
      'WALLET_PASS_SECRET is not set. Add a random 32+ char secret to the environment before issuing ticket tokens.',
    )
  }
  const hmac = crypto.createHmac('sha256', secret).update(bookingId).digest('hex')
  return `${bookingId}.${hmac.slice(0, 16)}`
}

export function verifyBookingToken(token: string): { valid: boolean; bookingId?: string } {
  const secret = process.env.WALLET_PASS_SECRET
  if (!secret) return { valid: false }

  const [bookingId, signature] = token.split('.')
  if (!bookingId || !signature) return { valid: false }

  const expected = crypto.createHmac('sha256', secret).update(bookingId).digest('hex').slice(0, 16)
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  return valid ? { valid: true, bookingId } : { valid: false }
}

/** QR payload is just the token as a URL your check-in page can read --
 * rendering it as an actual QR image only needs a client-side library
 * (e.g. `qrcode.react`), no server/account dependency. */
export function buildQrCodeValue(token: string, siteUrl: string): string {
  return `${siteUrl}/checkin?token=${encodeURIComponent(token)}`
}

// ---------------- Apple Wallet (PKPass) ----------------

/** The pass.json structure Apple's PassKit format requires. Real, typed,
 * spec-accurate -- but a valid .pkpass file also needs a ZIP container
 * signed with a Pass Type ID certificate issued by Apple (Apple Developer
 * Program membership, $99/year). That signing step is intentionally not
 * implemented here: shipping untested manifest-signing/PKCS#7 code against
 * a certificate we've never actually had would be more likely to produce a
 * silently-broken pass than a working one. Once APPLE_PASS_CERT /
 * APPLE_PASS_KEY / APPLE_TEAM_ID / APPLE_PASS_TYPE_ID are available, the
 * signing step (e.g. via the `passkit-generator` package) can be added and
 * tested against a real certificate. */
export interface PkPassData {
  formatVersion: 1
  passTypeIdentifier: string
  teamIdentifier: string
  organizationName: 'Artic Safari'
  serialNumber: string
  description: string
  logoText: 'Artic Safari'
  foregroundColor: 'rgb(238, 241, 246)'
  backgroundColor: 'rgb(7, 10, 15)'
  barcodes: [{ message: string; format: 'PKBarcodeFormatQR'; messageEncoding: 'iso-8859-1' }]
  generic: {
    primaryFields: [{ key: 'tour'; label: 'Experience'; value: string }]
    secondaryFields: [{ key: 'date'; label: 'Date'; value: string }, { key: 'guest'; label: 'Guest'; value: string }]
  }
}

export function buildPkPassData(booking: BookingTicketPayload, token: string): PkPassData {
  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID ?? 'pass.com.articsafaritour.ticket'
  const teamIdentifier = process.env.APPLE_TEAM_ID ?? 'UNCONFIGURED_TEAM_ID'

  return {
    formatVersion: 1,
    passTypeIdentifier,
    teamIdentifier,
    organizationName: 'Artic Safari',
    serialNumber: booking.bookingId,
    description: `Artic Safari — ${booking.itemTitle}`,
    logoText: 'Artic Safari',
    foregroundColor: 'rgb(238, 241, 246)',
    backgroundColor: 'rgb(7, 10, 15)',
    barcodes: [{ message: token, format: 'PKBarcodeFormatQR', messageEncoding: 'iso-8859-1' }],
    generic: {
      primaryFields: [{ key: 'tour', label: 'Experience', value: booking.itemTitle }],
      secondaryFields: [
        { key: 'date', label: 'Date', value: booking.bookingDate },
        { key: 'guest', label: 'Guest', value: booking.customerName },
      ],
    },
  }
}

export function isApplePassSigningConfigured(): boolean {
  return Boolean(process.env.APPLE_PASS_CERT && process.env.APPLE_PASS_KEY && process.env.APPLE_TEAM_ID)
}

// ---------------- Google Wallet ----------------

/** Google Wallet uses a signed JWT "save link" rather than a downloaded
 * file -- still needs a Google Wallet Console issuer account + service
 * account credentials the project doesn't have yet. Same honest gate. */
export function isGoogleWalletConfigured(): boolean {
  return Boolean(process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON)
}
