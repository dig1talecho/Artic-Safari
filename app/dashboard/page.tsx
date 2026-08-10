import { AuroraBackground } from '@/components/aurora-background'
import { SiteHeader } from '@/components/site-header'
import { MyBookingsPanel } from '@/components/my-bookings-panel'
import { SocialRail } from '@/components/social-rail'

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AuroraBackground />
      <SiteHeader />
      <MyBookingsPanel />
      <SocialRail />
    </main>
  )
}
