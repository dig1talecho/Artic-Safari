import { AuroraBackground } from '@/components/aurora-background'
import { SiteHeader } from '@/components/site-header'
import { MyBookingsPanel } from '@/components/my-bookings-panel'

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AuroraBackground />
      <SiteHeader />
      <MyBookingsPanel />
    </main>
  )
}
