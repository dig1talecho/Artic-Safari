import { AuroraBackground } from '@/components/aurora-background'
import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { TourPackages } from '@/components/tour-packages'
import { AuroraRadar } from '@/components/aurora-radar'
import { FloatingActionBar } from '@/components/floating-action-bar'

export default function Page() {
  return (
    <main className="home-theme relative min-h-screen overflow-x-hidden bg-[var(--home-bg)] font-sans text-[var(--home-foreground)]">
      <AuroraBackground variant="light" />
      <SiteHeader variant="light" />
      <Hero />
      <TourPackages />
      <AuroraRadar />
      <FloatingActionBar />
      <footer className="relative z-10 mx-auto w-full max-w-7xl border-t border-[var(--home-border)] px-5 py-10 text-center text-sm text-[var(--home-muted)]">
        Artic Safari — Nordic VIP Private Tours &amp; Transit · Tromsø, Northern Norway
      </footer>
    </main>
  )
}
