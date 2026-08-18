/**
 * Every editable string on the site, with its current wording as the
 * default.
 *
 * This file is the source of truth for WHICH keys exist and what they say
 * when nobody has overridden them. The `site_content` table stores only
 * overrides, so:
 *
 *   - the site works with an empty table
 *   - adding an entry here makes it editable in the admin panel
 *     immediately, pre-filled with the wording below
 *   - "reset to default" deletes a row rather than retyping this text
 *
 * ADDING A NEW EDITABLE STRING
 * 1. Add it here with the copy that is currently hardcoded.
 * 2. Replace the hardcoded text at the call site with `content('your.key')`.
 * That is the whole procedure -- no migration, no admin data entry.
 */

export type ContentKind = 'text' | 'multiline' | 'image'

export interface ContentField {
  /** Shown as the field label in the admin panel. */
  label: string
  /** The wording currently on the site. Rendered whenever no override exists. */
  default: string
  kind?: ContentKind
  /** One line of guidance for whoever edits it. */
  hint?: string
}

export interface ContentGroup {
  title: string
  description: string
  fields: Record<string, ContentField>
}

/**
 * Grouped by where it appears on the site, not by data type, because the
 * person editing is looking for "the bit under the big heading" and not
 * for "all the multiline fields".
 */
export const CONTENT_GROUPS: Record<string, ContentGroup> = {
  hero: {
    title: 'Homepage hero',
    description: 'The first thing a visitor reads, above the taxi console.',
    fields: {
      'hero.eyebrow': {
        label: 'Small label above the headline',
        default: 'Tromsø · 69°N',
        hint: 'Keep it short — it sits on one line on a phone.',
      },
      'hero.headline': {
        label: 'Headline',
        default: 'Chase the northern lights in a private, heated car.',
        kind: 'multiline',
        hint: 'The single most important sentence on the site.',
      },
      'hero.subheadline': {
        label: 'Supporting sentence',
        default:
          'Small groups, local guides who know where the sky is clearest tonight, and a driver who waits with you.',
        kind: 'multiline',
      },
      'hero.ctaPrimary': { label: 'Main button', default: 'Book a tour' },
      'hero.ctaSecondary': { label: 'Second button', default: 'Call a taxi' },
    },
  },

  trust: {
    title: 'Why Artic Safari',
    description: 'The three cards under the hero.',
    fields: {
      'trust.eyebrow': { label: 'Small label', default: 'Why Artic Safari' },
      'trust.heading': {
        label: 'Section heading',
        default: 'Built around a smoother way to chase the lights.',
        kind: 'multiline',
      },
      'trust.card1.title': { label: 'Card 1 — title', default: 'Secure Booking' },
      'trust.card1.body': {
        label: 'Card 1 — text',
        default:
          'Every reservation is confirmed directly with our dispatch team — no third-party resellers.',
        kind: 'multiline',
      },
      'trust.card2.title': { label: 'Card 2 — title', default: 'Instant Confirmation' },
      'trust.card2.body': {
        label: 'Card 2 — text',
        default:
          'Submit a request and hear back fast, with real-time pricing calculated on the spot.',
        kind: 'multiline',
      },
      'trust.card3.title': { label: 'Card 3 — title', default: 'WhatsApp Support' },
      'trust.card3.body': {
        label: 'Card 3 — text',
        default: 'Reach a real person before, during, and after your tour — no ticket queues.',
        kind: 'multiline',
      },
    },
  },

  taxi: {
    title: 'Taxi console',
    description: 'Labels on the booking panel. Prices are set on the Taximeter screen.',
    fields: {
      'taxi.title': { label: 'Panel title', default: 'VIP Taxi & Transfer' },
      'taxi.pickupLabel': { label: 'Pickup field label', default: 'Pickup Point' },
      'taxi.dropoffLabel': { label: 'Drop-off field label', default: 'Dropoff Destination' },
      'taxi.submit': { label: 'Booking button', default: 'Reserve Dispatch' },
      'taxi.priceHintNoRoute': {
        label: 'Note under the price before both addresses are entered',
        default: 'Enter both addresses for your exact fare',
      },
    },
  },

  contact: {
    title: 'Contact details',
    description: 'Used in the footer, the floating bar, and the WhatsApp link.',
    fields: {
      'contact.whatsappNumber': {
        label: 'WhatsApp number',
        default: '4792997190',
        hint: 'Digits only, with country code and no + or spaces. Used to build the chat link.',
      },
      'contact.email': { label: 'Public email address', default: 'bookings@articsafaritour.com' },
      'contact.footerLine': {
        label: 'Footer line',
        default: 'Artic Safari — Nordic VIP Private Tours & Transit · Tromsø, Northern Norway',
      },
    },
  },
}

/** Flat map of key -> default, built from the groups above. */
export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  Object.values(CONTENT_GROUPS).flatMap((group) =>
    Object.entries(group.fields).map(([key, field]) => [key, field.default]),
  ),
)

export type ContentKey = string

/**
 * Looks a key up in the overrides, falling back to the code's default.
 *
 * An override that has been blanked out counts as "no override" rather
 * than as an empty string -- clearing a field in the admin panel should
 * restore the original wording, not leave a hole in the page.
 */
export function resolveContent(overrides: Record<string, string>, key: ContentKey): string {
  const override = overrides[key]
  if (typeof override === 'string' && override.trim() !== '') return override
  return CONTENT_DEFAULTS[key] ?? ''
}

/** Convenience: bind a set of overrides once, then read keys off it. */
export function createContentReader(overrides: Record<string, string>) {
  return (key: ContentKey) => resolveContent(overrides, key)
}
