import { AuroraBackground } from '@/components/aurora-background'
import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { TourPackages } from '@/components/tour-packages'
import { TaximeterWidget } from '@/components/taximeter-widget'
import { AuroraRadar } from '@/components/aurora-radar'
import { ReviewsSection } from '@/components/reviews-section'
import { CustomerGallerySection } from '@/components/customer-gallery-section'
import { FaqSection } from '@/components/faq-section'
import { faqs } from '@/components/faq-data'
import { FloatingActionBar } from '@/components/floating-action-bar'
import { SocialRail } from '@/components/social-rail'
import { listPublishedReviewRatings } from '@/services/reviews.service'
import { getTours } from '@/services/tours.service'
import { siteUrl } from '@/lib/site-config'

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default async function Page() {
  const { data: reviewRatings } = await listPublishedReviewRatings()
  const { data: liveTours } = await getTours()
  const toursBySlug = Object.fromEntries((liveTours ?? []).map((tour) => [tour.slug, tour]))

  const reviewCount = reviewRatings?.length ?? 0
  const averageRating =
    reviewCount > 0
      ? reviewRatings!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0

  const travelAgencySchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'Artic Safari',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/aurora-hero.png`,
    description:
      'Private VIP Northern Lights tours and airport transfers in Tromsø, Northern Norway.',
    telephone: '+4792997190',
    priceRange: '490 kr - 15000 kr',
    areaServed: {
      '@type': 'City',
      name: 'Tromsø',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Tromsø',
      addressCountry: 'NO',
    },
    sameAs: ['https://instagram.com/articsafaritour'],
    ...(reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating.toFixed(1),
        reviewCount,
      },
    }),
  }

  return (
    <main className="home-theme relative min-h-screen overflow-x-hidden bg-[var(--home-bg)] font-sans text-[var(--home-foreground)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(travelAgencySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <AuroraBackground variant="light" />
      <SiteHeader variant="light" />
      <Hero toursBySlug={toursBySlug} />
      <TourPackages toursBySlug={toursBySlug} />
      <TaximeterWidget />
      <AuroraRadar />
      <ReviewsSection />
      <CustomerGallerySection />
      <FaqSection />
      <FloatingActionBar />
      <SocialRail variant="light" />
      <footer className="relative z-10 mx-auto w-full max-w-7xl border-t border-[var(--home-border)] px-5 py-10 text-center text-sm text-[var(--home-muted)]">
        Artic Safari — Nordic VIP Private Tours &amp; Transit · Tromsø, Northern Norway
      </footer>
    </main>
  )
}
