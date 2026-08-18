import type { Tour } from '@/services/tours.service'

/**
 * The 5 real Artic Safari products, hardcoded as a resilience layer.
 * /tours and /tours/[slug] read live data from the `tours` CMS table
 * first -- this only fills in whatever the live table doesn't have yet
 * (e.g. before the operator has run database_schema.sql / populated
 * rows), so those pages are never empty or 404 by default. Content
 * mirrors what's hand-authored in components/tour-packages.tsx so the
 * homepage cards and the /tours catalog never contradict each other.
 */
const FIXED_DATE = '2024-01-01T00:00:00.000Z'

export const FALLBACK_TOURS: Tour[] = [
  {
    id: 'fallback-airport-transfer',
    slug: 'airport-transfer',
    status: 'active',
    eyebrow: 'Point to Point',
    title: 'Airport Transfer',
    meta_title: 'VIP Airport Transfer Tromsø | Artic Safari',
    meta_description:
      'Direct, chauffeured airport transfer between Tromsø Airport (TOS) and your hotel, with free Wi-Fi and generous luggage space.',
    intro:
      'A direct, chauffeured transfer between Tromsø Airport and your hotel -- no shared shuttles, no waiting.',
    price: '145 kr',
    price_note: '1 to 4 persons · from',
    duration: '20–30 minutes',
    meeting_point: 'Tromsø Airport (TOS) or your hotel',
    highlights: [],
    features: ['Direct airport transfer', 'Chauffeur service', 'Free Wi-Fi', 'Generous luggage space'],
    cover_image: '/gallery/airport-transfer.jpg',
    cover_image_alt: 'Private VIP vehicles used for premium airport transfer service',
    gallery: [],
    sort_order: 0,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  },
  {
    id: 'fallback-northern-lights-private-group',
    slug: 'northern-lights-private-group',
    status: 'active',
    eyebrow: 'Signature Experience',
    title: 'Northern Lights Tour — Private Group',
    meta_title: 'Private Northern Lights Tour Tromsø | Artic Safari',
    meta_description:
      'An exclusive private aurora chase for 2 to 8 guests, with your own heated vehicle and a route planned in real time around tonight’s forecast.',
    intro:
      'An exclusive private group expedition for 2 to 8 guests. Your own heated vehicle and a route customized in real time to hunt the clearest, most active skies.',
    price: '15,000 kr',
    price_note: 'Flat rate · up to 8 guests',
    duration: '5–7 hours (evening departure)',
    meeting_point: 'Hotel pickup in central Tromsø',
    highlights: [
      'Hotel pickup in a private heated vehicle',
      'Real-time route planning around the aurora forecast',
      'Guided photography stops',
      'Hot drinks and snacks under the sky',
      'Return to your hotel',
    ],
    features: [
      'Private heated vehicle',
      'Customized chase route',
      'Thermal suits provided',
      'Professional photography',
      'Hot drinks & snacks',
      '2 to 8 persons',
    ],
    cover_image: '/gallery/northern-lights-private-group.jpg',
    cover_image_alt: 'Private group watching the Northern Lights over a fjord near Tromsø',
    gallery: [],
    sort_order: 1,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  },
  {
    id: 'fallback-northern-lights-per-person',
    slug: 'northern-lights-per-person',
    status: 'active',
    eyebrow: 'Solo & Couples',
    title: 'Northern Lights — Per Person',
    meta_title: 'Northern Lights Tour Per Person Tromsø | Artic Safari',
    meta_description:
      'Join a small shared-group aurora chase with an expert guide -- the full Northern Lights experience for solo travelers and couples.',
    intro:
      'Join a small shared-group chase with an expert aurora guide -- ideal for solo travelers and couples who want the full experience without booking a private vehicle.',
    price: '2,250 kr',
    price_note: 'per person',
    duration: '5–6 hours (evening departure)',
    meeting_point: 'Central Tromsø meeting point',
    highlights: [
      'Small shared-group departure',
      'Expert aurora guide',
      'Guided photography stops',
      'Hot drinks included',
    ],
    features: ['Shared small-group chase', 'Expert aurora guide', 'Hot drinks included'],
    cover_image: '/gallery/northern-lights-per-person.jpg',
    cover_image_alt: 'Small group of travelers on a shared Northern Lights tour in Norway',
    gallery: [],
    sort_order: 2,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  },
  {
    id: 'fallback-northern-lights-small-group',
    slug: 'northern-lights-small-group',
    status: 'active',
    eyebrow: 'Family & Friends',
    title: 'Northern Lights — Private Small Group',
    meta_title: 'Private Small Group Northern Lights Tour Tromsø | Artic Safari',
    meta_description:
      'A private vehicle for your group of up to 4, with flexible timing and a chauffeur who chases the clearest skies just for you.',
    intro:
      'A private vehicle for your group of up to 4, with flexible timing and a chauffeur who chases the clearest skies just for you.',
    price: '11,000 kr',
    price_note: '1 to 4 persons',
    duration: '5–7 hours (evening departure)',
    meeting_point: 'Hotel pickup in central Tromsø',
    highlights: [
      'Hotel pickup in a private vehicle',
      'Flexible departure timing',
      'Thermal gear and tripods provided',
      'Return to your hotel',
    ],
    features: ['Private chauffeur', 'Flexible timing', 'Thermal gear', 'Tripods provided'],
    cover_image: '/gallery/northern-lights-small-group.jpg',
    cover_image_alt: 'Vivid purple and green aurora borealis over snowy mountains near Tromsø',
    gallery: [],
    sort_order: 3,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  },
  {
    id: 'fallback-sommaroya-tour',
    slug: 'sommaroya-tour',
    status: 'active',
    eyebrow: 'Coastal Scenic',
    title: 'Sommarøya Tour',
    meta_title: 'Sommarøy Coastal Day Tour Tromsø | Artic Safari',
    meta_description:
      'A scenic daytime drive along the fjords to the island of Sommarøy, with curated photo stops along the way.',
    intro:
      'A scenic daytime drive along the fjords to the island of Sommarøy, with curated photo stops along the way.',
    price: '5,000 kr',
    price_note: 'Small car',
    duration: '4–5 hours',
    meeting_point: 'Hotel pickup in central Tromsø',
    highlights: [
      'Hotel pickup',
      'Scenic coastal fjord drive',
      'Sommarøy island exploration',
      'Curated photo stops',
    ],
    features: ['Scenic coastal fjord drive', 'Sommarøy island exploration', 'Curated photo stops'],
    cover_image: '/gallery/sommaroya-tour.jpg',
    cover_image_alt: 'Coastal road and fjord landscape on the way to Sommarøy, Norway',
    gallery: [],
    sort_order: 4,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  },
]

/**
 * Merges live CMS tours over the fallback set by slug -- live data wins
 * per-field-set (whole row), fallback fills any slug the CMS hasn't got
 * yet, and any brand-new CMS-only tour (a slug not in the fallback set)
 * is appended at the end.
 */
export function mergeWithFallback(liveTours: Tour[]): Tour[] {
  const liveBySlug = new Map(liveTours.map((t) => [t.slug, t]))
  const merged = FALLBACK_TOURS.map((fallback) => liveBySlug.get(fallback.slug) ?? fallback)
  const knownSlugs = new Set(FALLBACK_TOURS.map((t) => t.slug))
  const extra = liveTours.filter((t) => !knownSlugs.has(t.slug))
  return [...merged, ...extra].sort((a, b) => a.sort_order - b.sort_order)
}

export function getFallbackTourBySlug(slug: string): Tour | undefined {
  return FALLBACK_TOURS.find((t) => t.slug === slug)
}
