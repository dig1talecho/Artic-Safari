export interface TourData {
  slug: string
  eyebrow: string
  title: string
  metaTitle: string
  metaDescription: string
  intro: string
  price: string
  priceNote: string
  features: string[]
  image: string
  imageAlt: string
}

export const tours: TourData[] = [
  {
    slug: 'airport-transfer',
    eyebrow: 'Point to Point',
    title: 'Airport Transfer',
    metaTitle: 'Private VIP Airport Transfer Tromsø | Artic Safari',
    metaDescription:
      'Private chauffeured airport transfers in Tromsø, Norway. Direct pickup, free Wi-Fi, and generous luggage space. From 490 kr. Book online today.',
    intro:
      'Skip the taxi queue. A private, chauffeured transfer between Tromsø Airport and your hotel or the city center — direct, comfortable, and ready when you land.',
    price: 'From 490 kr',
    priceNote: '1–4 passengers, large vehicle available for 4–8',
    features: ['Direct airport transfer', 'Chauffeur service', 'Free Wi-Fi', 'Generous luggage space'],
    image: '/gallery/airport-transfer.jpg',
    imageAlt: 'Private VIP vehicles used for premium airport transfer service (representative image)',
  },
  {
    slug: 'northern-lights-private-group',
    eyebrow: 'Signature Experience',
    title: 'Northern Lights Tour — Private Group',
    metaTitle: 'Private Northern Lights Tour Tromsø | Private Group | Artic Safari',
    metaDescription:
      'Exclusive private Northern Lights expedition for up to 8 guests in Tromsø. Heated vehicle, custom aurora chase route, thermal suits. Flat rate 15,000 kr.',
    intro:
      'Our most-booked experience: an exclusive private group expedition for 2 to 8 guests. Your own heated vehicle and a route customized in real time to hunt the clearest, most active skies.',
    price: '15,000 kr flat rate',
    priceNote: 'Up to 8 guests',
    features: [
      'Private heated vehicle',
      'Customized chase route',
      'Thermal suits provided',
      'Professional photography',
      'Hot drinks & snacks',
    ],
    image: '/gallery/northern-lights-private-group.jpg',
    imageAlt: 'Private group watching the Northern Lights over a fjord near Tromsø',
  },
  {
    slug: 'northern-lights-per-person',
    eyebrow: 'Solo & Couples',
    title: 'Northern Lights — Per Person',
    metaTitle: 'Northern Lights Tour Tromsø Per Person | Artic Safari',
    metaDescription:
      'Join a shared small-group Northern Lights chase in Tromsø with an expert aurora guide. Hot drinks included. From 2,000 kr per person.',
    intro:
      'A shared small-group aurora chase for solo travelers and couples — expert guiding, hot drinks, and a genuine shot at the lights without booking a full private tour.',
    price: '2,000 kr',
    priceNote: 'Per person',
    features: ['Shared small-group chase', 'Expert aurora guide', 'Hot drinks included'],
    image: '/gallery/northern-lights-per-person.jpg',
    imageAlt: 'Small group of travelers on a shared Northern Lights tour in Norway',
  },
  {
    slug: 'northern-lights-small-group',
    eyebrow: 'Family & Friends',
    title: 'Northern Lights — Private Small Group',
    metaTitle: 'Private Small Group Northern Lights Tour Tromsø | Artic Safari',
    metaDescription:
      'A private Northern Lights chase for 1–4 guests in Tromsø. Private chauffeur, thermal gear, and tripods provided. 11,000 kr.',
    intro:
      'For families and small groups of friends — a private chase with flexible timing, your own chauffeur, and photography gear so nobody misses the shot.',
    price: '11,000 kr',
    priceNote: '1 to 4 persons',
    features: ['Private chauffeur', 'Flexible timing', 'Thermal gear', 'Tripods provided'],
    image: '/gallery/northern-lights-small-group.jpg',
    imageAlt: 'Vivid purple and green aurora borealis over snowy mountains near Tromsø',
  },
  {
    slug: 'sommaroya-tour',
    eyebrow: 'Coastal Scenic',
    title: 'Sommarøya Tour',
    metaTitle: 'Sommarøya Scenic Coastal Tour Tromsø | Artic Safari',
    metaDescription:
      'Scenic coastal drive from Tromsø to Sommarøy island. Fjord views, curated photo stops, and island exploration. From 5,000 kr.',
    intro:
      "A daytime escape from Tromsø along the coast to Sommarøy — dramatic fjord scenery, curated photo stops, and time to explore one of Northern Norway's most photographed islands.",
    price: 'From 5,000 kr',
    priceNote: 'Small or big car, price varies by group size',
    features: ['Scenic coastal fjord drive', 'Sommarøy island exploration', 'Curated photo stops'],
    image: '/gallery/sommaroya-tour.jpg',
    imageAlt: 'Coastal road and fjord landscape on the way to Sommarøy, Norway',
  },
]

export function getTourBySlug(slug: string) {
  return tours.find((t) => t.slug === slug)
}
