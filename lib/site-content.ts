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
    description: 'The first screen a visitor sees. Defaults below are the wording live today.',
    fields: {
      'hero.statusBadge': {
        label: 'Status pill (top left)',
        default: 'High Aurora Activity Tonight',
        hint: 'The KP number beside it is live NOAA data and is not editable.',
      },
      'hero.headline': {
        label: 'Main headline',
        default: 'Chase the Northern Lights, in First-Class Comfort',
        kind: 'multiline',
        hint: 'Animates in word by word, so it is split on spaces — no line breaks.',
      },
      'hero.ctaPrimary': { label: 'Button under the headline', default: 'Get Started' },
      'hero.rightEyebrow': { label: 'Small label, right column', default: 'VIP Private Tours' },
      'hero.rightHeading': {
        label: 'Heading, right column',
        default: 'A private guide, a heated vehicle, and the clearest sky we can find.',
        kind: 'multiline',
      },
      'hero.rightBody': {
        label: 'Paragraph, right column',
        default:
          "Exclusive private Northern Lights tours and VIP airport transfers in Tromsø, Northern Norway -- routed in real time around tonight's forecast.",
        kind: 'multiline',
      },
      'hero.rightCta': { label: 'Button, right column', default: 'Book VIP Tour' },
      'hero.statExperiences': {
        label: 'Stat 3 label',
        default: 'Arctic Circle',
        hint: 'The other two stats are live figures (tour count, cheapest fare) and are not editable.',
      },
    },
  },

  tours: {
    title: 'Tours section',
    description: 'The heading above the tour cards. The cards themselves come from Tour Catalog.',
    fields: {
      'tours.heading': { label: 'Section heading', default: 'Tours & Transfers' },
    },
  },

  trust: {
    title: 'Why Artic Safari',
    description: 'The section under the hero. Its job is to answer "what if we see nothing?"',
    fields: {
      'trust.eyebrow': { label: 'Small label', default: 'Why Artic Safari' },
      'trust.heading': {
        label: 'Section heading',
        default: 'The lights do not wait. Neither do we.',
        kind: 'multiline',
      },
      'trust.intro': {
        label: 'Intro sentence',
        default:
          'Nobody can promise an aurora. What we can promise is that we spend the night looking for the clearest sky within reach of Tromsø, in a warm car, with a driver who has done this a thousand times.',
        kind: 'multiline',
        hint: 'Do not promise a sighting here. Guests know it is weather, and the honesty is what earns the booking.',
      },

      'trust.lead.eyebrow': { label: 'Lead panel — small label', default: 'We chase the clear sky' },
      'trust.lead.title': {
        label: 'Lead panel — headline',
        default: 'Your route is decided the night you travel, not the week you book.',
        kind: 'multiline',
      },
      'trust.lead.body': {
        label: 'Lead panel — text',
        default:
          'We read the same aurora and cloud forecasts you see here, then drive to wherever the sky is open — sometimes twenty minutes away, sometimes two hours. A fixed itinerary cannot do that.',
        kind: 'multiline',
      },
      'trust.lead.liveLabel': { label: 'Live panel — label', default: 'Over Tromsø right now' },
      'trust.lead.peakLabel': {
        label: 'Live panel — label for the forecast peak',
        default: 'Strongest in the next 24h',
        hint: 'Shown only when the forecast feed returns a peak.',
      },
      'trust.lead.liveNote': {
        label: 'Live panel — note under the numbers',
        default:
          'Live from NOAA and Open-Meteo, updated continuously. Conditions change hour to hour — a quiet reading now says nothing about the night you travel.',
        kind: 'multiline',
      },
      'trust.lead.liveUnavailable': {
        label: 'Live panel — when the feeds are down',
        default:
          'Live conditions are unavailable at the moment. Our drivers check them again before every departure.',
        kind: 'multiline',
      },

      'trust.card1.title': { label: 'Reason 1 — title', default: 'A private car, not a coach' },
      'trust.card1.body': {
        label: 'Reason 1 — text',
        default:
          'Your group and your guide. No waiting for forty strangers to board, and no compromise on where the night goes.',
        kind: 'multiline',
      },
      'trust.card2.title': { label: 'Reason 2 — title', default: 'Warm the whole night' },
      'trust.card2.body': {
        label: 'Reason 2 — text',
        default:
          'Heated vehicle, thermal suits, and somewhere to get out of the wind between stops. Cold is what ends most aurora hunts early.',
        kind: 'multiline',
      },
      'trust.card3.title': { label: 'Reason 3 — title', default: 'A real person on WhatsApp' },
      'trust.card3.body': {
        label: 'Reason 3 — text',
        default:
          'Before, during and after your trip. Not a ticket queue, and not a chatbot — the same people who will be driving.',
        kind: 'multiline',
      },

      'trust.hygiene.direct': { label: 'Small print 1', default: 'Booked directly with us' },
      'trust.hygiene.fast': { label: 'Small print 2', default: 'Confirmed fast, by a human' },
      'trust.hygiene.noResellers': { label: 'Small print 3', default: 'No third-party resellers' },
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
