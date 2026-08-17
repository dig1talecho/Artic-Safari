import { AuroraBackground } from '@/components/aurora-background'
import { SiteHeader } from '@/components/site-header'
import { FloatingActionBar } from '@/components/floating-action-bar'
import { SocialRail } from '@/components/social-rail'
import { SiteFooter } from '@/components/site-footer'

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="home-theme relative min-h-screen overflow-x-hidden bg-[var(--home-bg)] font-sans text-[var(--home-foreground)]">
      <AuroraBackground variant="light" />
      <SiteHeader variant="light" />
      {children}
      <FloatingActionBar />
      <SocialRail variant="light" />
      <SiteFooter />
    </main>
  )
}
