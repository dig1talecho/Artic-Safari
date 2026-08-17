/**
 * Single source of truth for the privacy policy.
 *
 * WHY THIS FILE EXISTS
 * A privacy policy is only useful if it describes what the code actually
 * does. Everything below was read out of this codebase, not copied from a
 * template -- the third parties are the real ones the site contacts, and
 * the data categories are the real columns in `database_schema.sql`. When
 * you add an integration or a column that holds personal data, add it here
 * too, or the published policy silently becomes wrong.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ YOU MUST FILL IN `controller` BELOW.                            │
 * │                                                                 │
 * │ GDPR Article 13 requires the *identity of the data controller*  │
 * │ -- the registered company name, organisation number, and a      │
 * │ postal address. I do not know yours and will not invent them.   │
 * │ Any field left null is simply omitted from the page rather than │
 * │ printed as a placeholder, so the page stays presentable, but it │
 * │ is incomplete until you fill these in.                          │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * This is a careful, accurate draft. It is not legal advice, and I am not
 * a lawyer. Norwegian data protection is supervised by Datatilsynet; if
 * the business grows or you start processing payments, have someone
 * qualified read it.
 */

export const legal = {
  /** Last substantive change to the policy text. Update when you edit it. */
  lastUpdated: '2026-08-17',

  controller: {
    /** Trading name -- true today. */
    tradingName: 'Artic Safari',
    /** TODO: registered company name, e.g. "Artic Safari AS". */
    legalName: null as string | null,
    /** TODO: Norwegian organisasjonsnummer (9 digits). */
    orgNumber: null as string | null,
    /** TODO: registered postal address. */
    address: null as string | null,
    country: 'Norway',
    city: 'Tromsø',
  },

  contact: {
    /**
     * TODO: create this mailbox (or change it to one you read). A privacy
     * contact that bounces is worse than none -- GDPR gives you one month
     * to answer a request, and the clock starts when it is sent.
     */
    privacyEmail: 'privacy@articsafaritour.com',
    bookingsEmail: 'bookings@articsafaritour.com',
    whatsapp: '+47 92 99 71 90',
    whatsappUrl: 'https://wa.me/4792997190',
  },

  /**
   * Supervisory authority for Norway. A data subject has the right to be
   * told they can complain here -- this is not optional wording.
   */
  authority: {
    name: 'Datatilsynet (Norwegian Data Protection Authority)',
    url: 'https://www.datatilsynet.no',
  },

  /**
   * TODO: confirm in your Supabase dashboard (Project Settings → General)
   * and set this to the real region, e.g. 'eu-central-1 (Frankfurt)'.
   * It matters: if the database sits outside the EEA, personal data is
   * being transferred internationally and the policy must say so under a
   * valid transfer mechanism. Rendered only when set.
   */
  databaseRegion: null as string | null,
} as const

export interface DataCategory {
  what: string
  why: string
  /** GDPR Art. 6 lawful basis. */
  basis: string
  keptFor: string
}

/** Read off the real columns in database_schema.sql. */
export const dataCategories: DataCategory[] = [
  {
    what: 'Name, email address and phone number',
    why: 'To identify your booking, confirm it with you, and reach you if the pickup or the weather changes.',
    basis: 'Performance of a contract',
    keptFor:
      'Five years after the trip, because Norwegian bookkeeping law requires transaction records to be retained. After that the booking is anonymised rather than deleted, so the revenue figures survive without the person attached.',
  },
  {
    what: 'Pickup and drop-off address, and their coordinates',
    why: 'So the driver can find you and the fare can be calculated by distance.',
    basis: 'Performance of a contract',
    keptFor: 'Kept with the booking; anonymised on the same five-year schedule.',
  },
  {
    what: 'Your precise location, when you press "Use my location"',
    why: 'To place your pickup pin exactly, so a driver is not searching a street for you at night.',
    basis: 'Consent — this only happens if you press the button and your browser or phone grants permission',
    keptFor:
      'Stored as the pickup coordinates on that booking. You can clear the field before submitting, and the pickup point is editable afterwards.',
  },
  {
    what: 'Account details: full name, phone, email, password',
    why: 'So you can sign in and see your own bookings, reward points and trip photos.',
    basis: 'Performance of a contract',
    keptFor:
      'Until you ask us to delete the account. Your password is never stored — our authentication provider stores only a one-way hash, which we cannot read or reverse.',
  },
  {
    what: 'Reward point history',
    why: 'To calculate the balance you can spend on a booking.',
    basis: 'Performance of a contract',
    keptFor: 'For the life of the account.',
  },
  {
    what: 'Photos taken on your trip',
    why: 'So we can share them with you afterwards.',
    basis: 'Legitimate interest in delivering the experience you booked',
    keptFor:
      'Until you ask us to remove them. Photos are never published to the public gallery without asking you first.',
  },
  {
    what: 'A review, if you write one',
    why: 'To show prospective guests real feedback.',
    basis: 'Consent — reviews are only published after you submit one and we approve it',
    keptFor: 'Until you ask us to remove it.',
  },
  {
    what: "The driver's live position during your trip",
    why: 'So you can see the car approaching.',
    basis: 'Performance of a contract',
    keptFor:
      'One current position per booking, overwritten as the driver moves. It is not a trail history.',
  },
]

export interface Recipient {
  name: string
  role: string
  /** Does the visitor's own browser contact them, or only our server? */
  reach: 'browser' | 'server'
  /** Only active when the relevant key is configured. */
  conditional?: boolean
  url: string
}

/**
 * The real external services, split by whether the visitor's browser
 * reaches them directly. The distinction is the whole point: a
 * server-side call exposes our server's address, not the visitor's.
 */
export const recipients: Recipient[] = [
  {
    name: 'Supabase',
    role: 'Database, sign-in, and file storage. Holds everything in the table above.',
    reach: 'browser',
    url: 'https://supabase.com/privacy',
  },
  {
    name: 'Vercel',
    role: 'Hosts the website, and provides its visitor statistics. The statistics are cookieless and do not identify you or follow you to other sites.',
    reach: 'browser',
    url: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'CARTO / OpenStreetMap',
    role: 'Supplies the map images shown once you select an address. Loading a map image reveals your IP address to them.',
    reach: 'browser',
    url: 'https://carto.com/privacy/',
  },
  {
    name: 'Komoot (Photon)',
    role: 'Turns the address you type into coordinates. Our server asks on your behalf, so they receive the search text but not your IP address.',
    reach: 'server',
    url: 'https://www.komoot.com/privacy',
  },
  {
    name: 'Google Maps',
    role: 'Calculates the driving distance between two addresses for the fare estimate. Our server sends the two addresses only.',
    reach: 'server',
    conditional: true,
    url: 'https://policies.google.com/privacy',
  },
  {
    name: 'Meta (WhatsApp Business)',
    role: 'Delivers booking messages when you contact us or we confirm a trip.',
    reach: 'server',
    conditional: true,
    url: 'https://www.whatsapp.com/legal/privacy-policy',
  },
  {
    name: 'Resend',
    role: 'Sends transactional email such as booking confirmations.',
    reach: 'server',
    conditional: true,
    url: 'https://resend.com/legal/privacy-policy',
  },
]

/**
 * Cookies and browser storage, verified by searching the codebase: there
 * is no `document.cookie` anywhere, and the only stored item is the
 * sign-in session. That is why this site has no consent banner -- there is
 * nothing non-essential to consent to. If you ever add advertising or
 * cross-site analytics, that changes and a banner becomes necessary.
 */
export const storageItems = [
  {
    name: 'Sign-in session',
    kind: 'Local storage, set only after you sign in',
    why: 'Keeps you signed in between visits. Signing out removes it.',
    essential: true,
  },
  {
    name: 'Visitor statistics',
    kind: 'No cookie, no stored identifier',
    why: 'Counts page views so we know which pages are useful. It cannot identify you or track you across other websites.',
    essential: true,
  },
]

/** GDPR Chapter 3, in plain words. */
export const rights = [
  ['See your data', 'Ask for a copy of everything we hold about you.'],
  ['Correct it', 'Tell us if a name, phone number or address is wrong and we will fix it.'],
  [
    'Delete it',
    'Ask us to erase your account and personal details. We will keep the financial record of past trips for the five years the law requires, with your name and contact details stripped out.',
  ],
  ['Object', 'Tell us to stop using your data for a particular purpose.'],
  ['Take it elsewhere', 'Ask for your data in a machine-readable file.'],
  ['Withdraw consent', 'Where we relied on your consent, you can take it back at any time.'],
  [
    'Complain',
    'If you are unhappy with how we responded, you can complain to the Norwegian Data Protection Authority.',
  ],
] as const
