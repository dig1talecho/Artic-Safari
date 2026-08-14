import { AuroraBackground } from '@/components/aurora-background'
import { SiteHeader } from '@/components/site-header'
import { FloatingActionBar } from '@/components/floating-action-bar'
import { SocialRail } from '@/components/social-rail'

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="home-theme relative min-h-screen overflow-x-hidden bg-[var(--home-bg)] font-sans text-[var(--home-foreground)]">
      <AuroraBackground variant="light" />
      <SiteHeader variant="light" />
      {children}
      <FloatingActionBar />
      <SocialRail variant="light" />
      <footer
        id="site-footer"
        className="relative z-10 mx-auto w-full max-w-7xl border-t border-[var(--home-border)] px-5 py-12 text-center text-sm text-[var(--home-muted)]"
      >
        Artic Safari — Nordic VIP Private Tours &amp; Transit · Tromsø, Northern Norway
      </footer>
    </main>
  )
}
