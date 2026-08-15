import { Mail, Phone, ListChecks, Wallet } from 'lucide-react'
import type { Booking } from './types'

interface CustomersViewProps {
  bookings: Booking[]
}

interface CustomerRow {
  email: string
  name: string
  phone: string
  bookingsCount: number
  lifetimeSpend: number
  lastBookingDate: string
}

export function CustomersView({ bookings }: CustomersViewProps) {
  const byEmail = new Map<string, CustomerRow>()

  for (const b of bookings) {
    const email = b.customer_email || 'unknown'
    const existing = byEmail.get(email)
    const spend = b.status !== 'cancelled' ? Number(b.total_price) || 0 : 0

    if (existing) {
      existing.bookingsCount += 1
      existing.lifetimeSpend += spend
      if (b.booking_date > existing.lastBookingDate) existing.lastBookingDate = b.booking_date
      if (b.customer_phone) existing.phone = b.customer_phone
    } else {
      byEmail.set(email, {
        email,
        name: b.customer_name || 'Guest',
        phone: b.customer_phone || '—',
        bookingsCount: 1,
        lifetimeSpend: spend,
        lastBookingDate: b.booking_date,
      })
    }
  }

  const customers = Array.from(byEmail.values()).sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-md">
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Customer Directory</h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Derived from booking history — {customers.length} unique customers
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="py-20 text-center text-slate-400">No customers yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Contact</th>
                <th className="px-6 py-3.5 text-center">Bookings</th>
                <th className="px-6 py-3.5">Last Booking</th>
                <th className="px-6 py-3.5 text-right">Lifetime Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((c) => (
                <tr key={c.email} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      {c.email}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      {c.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                      <ListChecks className="h-3 w-3 text-[#33bbcf]" />
                      {c.bookingsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{c.lastBookingDate}</td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                    <span className="inline-flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-[#33bbcf]" />
                      {c.lifetimeSpend.toLocaleString()} NOK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
