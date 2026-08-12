export interface BlogSection {
  heading?: string
  paragraphs: string[]
}

export interface BlogPost {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  publishedAt: string
  readingTime: string
  excerpt: string
  sections: BlogSection[]
}

export const posts: BlogPost[] = [
  {
    slug: 'what-to-wear-northern-lights-tromso',
    title: 'What to Wear for a Northern Lights Chase in Tromsø (Layering Guide)',
    metaTitle: 'What to Wear for Northern Lights Tours in Tromsø | Layering Guide',
    metaDescription:
      'A practical layering guide for Northern Lights tours in Tromsø, Norway — what to wear, how cold it gets, and what Artic Safari provides.',
    publishedAt: '2026-01-12',
    readingTime: '5 min read',
    excerpt:
      'Standing still outside at midnight in Arctic Norway is a different kind of cold. Here is how to layer properly for a Northern Lights chase in Tromsø.',
    sections: [
      {
        paragraphs: [
          "Chasing the aurora means standing mostly still outside, often for an hour or more, in temperatures that regularly drop to -10°C to -20°C (14°F to -4°F) around Tromsø between November and March. That's a very different cold from a brisk winter walk — the right layers make the difference between an unforgettable night and a miserable one.",
        ],
      },
      {
        heading: 'The three-layer system',
        paragraphs: [
          'Base layer: a moisture-wicking layer against your skin — merino wool or synthetic thermal underwear. Avoid cotton entirely; it holds moisture and gets cold fast once you sweat even a little.',
          'Mid layer: insulation to trap warm air — a fleece or a down/synthetic insulated jacket. This is the layer you can adjust if you warm up moving between viewing spots.',
          'Outer shell: a windproof, waterproof jacket and pants. Wind chill is the real enemy on the Norwegian coast, even on a clear night.',
        ],
      },
      {
        heading: "Don't forget your extremities",
        paragraphs: [
          'Insulated, waterproof boots rated for cold weather, plus wool socks (bring a spare pair). Insulated gloves or mittens — mittens are warmer if you can sacrifice some finger dexterity for your camera. A warm hat that covers your ears, and a neck gaiter or buff you can pull up over your face in wind.',
        ],
      },
      {
        heading: 'What Artic Safari provides',
        paragraphs: [
          'Every Artic Safari Northern Lights tour includes a thermal suit, so you do not need full expedition-grade outerwear of your own — just warm layers underneath as described above. Bring your own hat, gloves, and sturdy boots, and you will be comfortable for the whole chase.',
        ],
      },
    ],
  },
  {
    slug: 'best-months-aurora-borealis-norway',
    title: 'Best Months to See the Aurora Borealis in Norway',
    metaTitle: 'Best Time to See Northern Lights in Norway | Tromsø Aurora Season',
    metaDescription:
      'When is the best time to see the Northern Lights in Tromsø and Northern Norway? A season-by-season guide to aurora borealis viewing.',
    publishedAt: '2026-01-20',
    readingTime: '4 min read',
    excerpt:
      'The aurora borealis is visible over Tromsø from late September to late March. Here is how to think about timing your trip.',
    sections: [
      {
        paragraphs: [
          'The Northern Lights are present year-round — the aurora itself is a constant phenomenon in the upper atmosphere. What changes with the seasons is whether the sky is dark enough to see it. Around Tromsø, that window runs from roughly late September to late March, when the nights are long and dark enough for the aurora to be visible.',
        ],
      },
      {
        heading: 'Polar night (late November – mid January)',
        paragraphs: [
          "Tromsø sits above the Arctic Circle, so during the polar night the sun doesn't rise at all — you get the most hours of darkness per day, which means more opportunities to catch a clear window between clouds. Weather is more variable during this period, so flexibility helps.",
        ],
      },
      {
        heading: 'The equinox seasons (September–October and February–March)',
        paragraphs: [
          'Aurora researchers have long observed that geomagnetic activity tends to be statistically higher around the spring and autumn equinoxes (a pattern known as the Russell–McPherron effect). Combined with milder temperatures than the depths of winter, September–October and February–March are often considered the sweet spot for a Northern Lights trip to Tromsø.',
        ],
      },
      {
        heading: 'Practical tips',
        paragraphs: [
          'Clear skies matter as much as the season — the aurora forecast (KP index) is only useful if the clouds cooperate. Booking 2–3 nights rather than a single night meaningfully improves your odds, since a private, flexible chase route (like our Private Group and Small Group tours) can relocate to wherever the sky is clearest.',
        ],
      },
    ],
  },
  {
    slug: 'camera-settings-northern-lights-photography',
    title: 'Camera Settings for Northern Lights Photography',
    metaTitle: 'Best Camera Settings for Northern Lights Photography | Aurora Guide',
    metaDescription:
      'A practical guide to camera settings for photographing the aurora borealis: aperture, ISO, shutter speed, and focus.',
    publishedAt: '2026-01-28',
    readingTime: '6 min read',
    excerpt:
      'Manual mode, a wide aperture, and a steady tripod — the fundamentals of photographing the Northern Lights, explained simply.',
    sections: [
      {
        paragraphs: [
          'You do not need professional gear to photograph the aurora, but you do need to shoot in manual mode — automatic settings will almost always underexpose a night sky. Here are the fundamentals.',
        ],
      },
      {
        heading: 'Aperture, ISO, and shutter speed',
        paragraphs: [
          'Aperture: use the widest your lens allows, ideally f/2.8 or wider, to let in as much light as possible.',
          'ISO: start around 800–1600 and adjust up to 3200 if your camera handles noise well at higher ISOs. Modern mirrorless and DSLR cameras vary a lot here — test a few shots and check the histogram.',
          'Shutter speed: 5–15 seconds is a good starting range. A fast, bright, fast-moving aurora needs a shorter exposure (5–8s) to keep detail and avoid the light bands smearing into a flat glow; a faint, slow aurora can take a longer exposure (10–15s).',
        ],
      },
      {
        heading: 'Focus and stability',
        paragraphs: [
          "Autofocus struggles in the dark, so switch to manual focus. Focus on a distant light (a star, or the horizon) using your camera's zoomed-in live view, then leave the focus ring there for the rest of the night.",
          'A sturdy tripod is essential — handholding is not viable at these shutter speeds. A remote shutter release or a 2-second self-timer avoids the small shake of pressing the shutter button by hand.',
        ],
      },
      {
        heading: 'A few extra tips',
        paragraphs: [
          'Shoot in RAW format rather than JPEG for far more flexibility adjusting exposure and white balance afterward. Cold drains batteries fast — bring at least one spare and keep it in an inner pocket, close to your body, until you need it.',
          'If photography is a priority for your trip, our Private Group tour includes professional photography assistance, so you can focus on the sky while getting shots you will actually want to keep.',
        ],
      },
    ],
  },
]

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug)
}
