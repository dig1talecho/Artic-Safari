import type { PaymentStatus } from '@/lib/booking-lifecycle'
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import type { Booking } from './types'

interface FinanceViewProps {
  bookings: Booking[]
  /** Moves payment_status paid -> refunded. The transition is validated in Postgres. */
  updatePaymentStatus?: (id: string, status: PaymentStatus) => void
}

export function FinanceView({ bookings, updatePaymentStatus }: FinanceViewProps) {
  const active = bookings.filter((b) => b.status !== 'cancelled')
  const totalRevenue = active.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0)
  const paidRevenue = active
    .filter((b) => b.payment_status === 'paid')
    .reduce((acc, b) => acc + (Number(b.total_price) || 0), 0)
  const pendingRevenue = active
    .filter((b) => (b.payment_status ?? 'pending') === 'pending')
    .reduce((acc, b) => acc + (Number(b.total_price) || 0), 0)
  /*
    Counted across ALL bookings, not just active ones. A refunded booking
    is almost always a cancelled one, so filtering cancellations out first
    meant this figure was very nearly always zero -- the one number on the
    screen that could never be right.
  */
  const refundedRevenue = bookings
    .filter((b) => b.payment_status === 'refunded')
    .reduce((acc, b) => acc + (Number(b.total_price) || 0), 0)

  /*
    The question an operator actually has after a cancellation: who am I
    holding money for? A booking owes a refund when the policy calculated
    one, the guest had paid, and it has not been sent back yet.
  */
  const refundsOwed = bookings
    .filter(
      (b) =>
        b.status === 'cancelled' &&
        Number(b.refund_due ?? 0) > 0 &&
        b.payment_status === 'paid',
    )
    .sort((a, b) => Number(b.refund_due ?? 0) - Number(a.refund_due ?? 0))

  const refundsOwedTotal = refundsOwed.reduce((acc, b) => acc + Number(b.refund_due ?? 0), 0)

  const transactions = [...bookings].sort((a, b) => (a.payment_status === 'pending' ? -1 : 1))

  return (
    <div className="space-y-6">
      {refundsOwed.length > 0 && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-semibold text-white">Refunds owed</p>
              <p className="mt-1 text-xs text-amber-200/80">
                Cancelled, already paid, and not yet sent back. Marking one refunded records that
                you sent it — it does not move money, because no processor is connected.
              </p>
            </div>
            <p className="font-mono text-xl font-bold text-amber-300">
              {refundsOwedTotal.toLocaleString()} NOK
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {refundsOwed.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {b.customer_name} — {b.item_title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {b.booking_date}
                    {b.cancelled_by ? ` · cancelled by ${b.cancelled_by}` : ''}
                    {b.cancellation_reason ? ` · "${b.cancellation_reason}"` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-amber-300">
                    {Number(b.refund_due ?? 0).toLocaleString()} NOK
                  </span>
                  {updatePaymentStatus && (
                    <button
                      type="button"
                      onClick={() => updatePaymentStatus(b.id, 'refunded')}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-emerald-400/50 hover:text-emerald-300"
                    >
                      Mark refunded
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Collected</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-400">{paidRevenue.toLocaleString()} NOK</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Awaiting Payment</span>
            <AlertCircle className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-400">{pendingRevenue.toLocaleString()} NOK</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Refunded</span>
            <DollarSign className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-400">{refundedRevenue.toLocaleString()} NOK</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-md">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Transactions</h2>
          <p className="mt-0.5 text-xs text-slate-400">Gross total: {totalRevenue.toLocaleString()} NOK</p>
        </div>
        {transactions.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Item</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-white">{b.customer_name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{b.item_title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          b.payment_status === 'paid'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : b.payment_status === 'refunded'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {b.payment_status ?? 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                      {Number(b.total_price || 0).toLocaleString()} NOK
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
