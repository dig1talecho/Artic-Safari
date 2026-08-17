/**
 * Dimensional icons for the trust row.
 *
 * The flat line icons read as placeholders next to the frosted taxi
 * console. These are built the way a real object catches light in the
 * Arctic: a cool rim where the sky hits the top edge, a warmer bounce
 * underneath, and a specular highlight offset from centre so nothing
 * looks symmetrically fake. Each is one inline SVG with its own gradient
 * ids -- no icon font, no runtime cost, and they scale without blurring.
 *
 * Ids are suffixed per icon because two SVGs on the same page sharing a
 * gradient id will silently take whichever the browser parsed last.
 */

interface IconProps {
  className?: string
}

/** Shared 3D treatment: rim light on top, bounce below, gloss on the face. */
function Dimensional({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#d8fbff" />
          <stop offset="100%" stopColor="#7fd9ea" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-drop`} x="-30%" y="-30%" width="160%" height="170%">
          {/* Contact shadow, tight and low, so the shape sits on the disc
              rather than floating above it. */}
          <feDropShadow dx="0" dy="1.1" stdDeviation="1" floodColor="#012b38" floodOpacity="0.55" />
        </filter>
      </defs>
      {children}
    </>
  )
}

/** Shield with a check — bookings confirmed by us, not a reseller. */
export function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <Dimensional id="tf-shield">
        <g filter="url(#tf-shield-drop)">
          <path
            d="M16 3.2 6.6 7v8.1c0 5.9 3.9 11.2 9.4 13.1 5.5-1.9 9.4-7.2 9.4-13.1V7L16 3.2Z"
            fill="url(#tf-shield-body)"
          />
          {/* Bevel: a darker inner edge is what makes it read as thick. */}
          <path
            d="M16 5.6 8.8 8.5v6.6c0 4.8 3 9.1 7.2 10.8 4.2-1.7 7.2-6 7.2-10.8V8.5L16 5.6Z"
            fill="none"
            stroke="#0b6d84"
            strokeOpacity="0.28"
            strokeWidth="1"
          />
          <path
            d="M16 3.2 6.6 7v8.1c0 2.1.5 4.1 1.4 6C10.6 19.4 13 14 13 8.2c0-1.5-.2-3-.5-4.4L16 3.2Z"
            fill="url(#tf-shield-gloss)"
          />
          <path
            d="m11.6 15.7 3 3.1 6-6.4"
            fill="none"
            stroke="#04303d"
            strokeOpacity="0.75"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </Dimensional>
    </svg>
  )
}

/** Bolt — the instant part of instant confirmation. */
export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <Dimensional id="tf-bolt">
        <g filter="url(#tf-bolt-drop)">
          <path d="M18.6 2.5 7.4 17.6h6.6l-1.4 12 12-15.6h-6.7l.7-11.5Z" fill="url(#tf-bolt-body)" />
          <path
            d="M18.6 2.5 7.4 17.6h6.6l-1.4 12 12-15.6h-6.7l.7-11.5Z"
            fill="none"
            stroke="#0b6d84"
            strokeOpacity="0.3"
            strokeWidth="0.9"
          />
          {/* Lit left face only -- light comes from one side, as outdoors. */}
          <path d="M18.6 2.5 7.4 17.6h4.2L17.9 4l.7-1.5Z" fill="url(#tf-bolt-gloss)" />
        </g>
      </Dimensional>
    </svg>
  )
}

/**
 * The real WhatsApp mark: their phone-in-a-bubble glyph, drawn from the
 * official outline rather than a generic chat bubble, because that is the
 * shape people recognise at a glance. Used only to say which service we
 * are reachable on.
 */
export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <Dimensional id="tf-wa">
        <g filter="url(#tf-wa-drop)">
          <path
            d="M16.05 3.2A12.7 12.7 0 0 0 5.2 22.55L3.6 28.4l6-1.57a12.7 12.7 0 1 0 6.45-23.63Z"
            fill="url(#tf-wa-body)"
          />
          <path
            d="M16.05 3.2A12.7 12.7 0 0 0 5.2 22.55L3.6 28.4l6-1.57a12.7 12.7 0 1 0 6.45-23.63Z"
            fill="none"
            stroke="#0b6d84"
            strokeOpacity="0.28"
            strokeWidth="0.9"
          />
          <path
            d="M16.05 3.2A12.7 12.7 0 0 0 5.2 22.55l1.1-4a12.7 12.7 0 0 1 9.75-15.35Z"
            fill="url(#tf-wa-gloss)"
          />
          {/* The handset, in the negative space -- the detail that makes it
              WhatsApp rather than any messaging app. */}
          <path
            d="M12.3 9.9c-.28-.63-.57-.64-.84-.65h-.71c-.25 0-.65.09-.99.46-.34.37-1.3 1.27-1.3 3.1s1.33 3.6 1.51 3.85c.19.25 2.57 4.12 6.35 5.61 3.14 1.24 3.78 1 4.46.93.68-.06 2.19-.9 2.5-1.76.31-.86.31-1.6.22-1.76-.09-.15-.34-.25-.71-.43-.37-.19-2.19-1.08-2.53-1.2-.34-.12-.59-.19-.84.19-.25.37-.96 1.2-1.18 1.45-.22.25-.43.28-.8.09-.37-.19-1.57-.58-2.99-1.84-1.1-.98-1.85-2.19-2.07-2.56-.22-.37-.02-.57.16-.76.17-.17.37-.43.56-.65.19-.22.25-.37.37-.62.12-.25.06-.46-.03-.65-.09-.19-.82-2.03-1.14-2.77Z"
            fill="#04303d"
            fillOpacity="0.8"
          />
        </g>
      </Dimensional>
    </svg>
  )
}
