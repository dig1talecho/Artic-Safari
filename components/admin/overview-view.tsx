import { DollarSign, TrendingUp, Clock3, ShieldAlert, Map, Car } from 'lucide-react'
import type { Booking } from './types'

interface OverviewViewProps {
  bookings: Booking[]
}

export function OverviewView({ bookings }: OverviewViewProps) {
  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)

  const paidRevenue = bookings
    .filter((b) => b.payment_status === 'paid' && b.status !== 'cancelled')
    .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)

  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const unassignedCount = bookings.filter((b) => !b.assigned_driver && b.status !== 'cancelled').length
  const tourCount = bookings.filter((b) => b.booking_type === 'tour').length
  const transferCount = bookings.filter((b) => b.booking_type === 'transfer').length

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Volume (Gross)"
          value={`${totalRevenue.toLocaleString()} NOK`}
          note="All bookings value"
          icon={<DollarSign className="h-5 w-5 text-[#33bbcf]" />}
          barClass="from-[#33bbcf]/50"
        />
        <KpiCard
          label="Collected (Paid)"
          value={`${paidRevenue.toLocaleString()} NOK`}
          note="Verified payment completed"
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          valueClass="text-emerald-400"
          barClass="from-emerald-400/50"
        />
        <KpiCard
          label="Pending Approvals"
          value={String(pendingCount)}
          suffix="requests"
          note="Requires status confirmation"
          icon={<Clock3 className="h-5 w-5 text-amber-400" />}
          valueClass="text-amber-400"
          barClass="from-amber-400/50"
        />
        <KpiCard
          label="Unassigned Tours"
          value={String(unassignedCount)}
          suffix="tours"
          note="Waiting for driver dispatch"
          icon={<ShieldAlert className="h-5 w-5 text-rose-400" />}
          valueClass="text-rose-400"
          barClass="from-rose-400/50"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Northern Lights Tours</span>
            <Map className="h-5 w-5 text-[#33bbcf]" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{tourCount} bookings</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">VIP Transfers</span>
            <Car className="h-5 w-5 text-[#33bbcf]" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{transferCount} bookings</div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  suffix,
  note,
  icon,
  valueClass = 'text-white',
  barClass,
}: {
  label: string
  value: string
  suffix?: string
  note: string
  icon: React.ReactNode
  valueClass?: string
  barClass: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${valueClass}`}>{value}</span>
        {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
      </div>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${barClass} to-transparent`} />
    </div>
  )
}
