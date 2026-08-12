'use client'

import {
  Calendar,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Clock3,
  Car,
  MapPin,
  CreditCard,
  AlertTriangle,
  Wand2,
} from 'lucide-react'
import type { Booking, DriverOption, CurrentUser } from '@/components/admin/types'
import { getDriverConflicts, recommendDriver } from './smart-assign'

interface TableMatrixProps {
  bookings: Booking[]
  allBookings: Booking[]
  loading: boolean
  currentUser: CurrentUser
  driverOptions: DriverOption[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  updateStatus: (id: string, status: 'confirmed' | 'cancelled' | 'pending') => void
  updatePaymentStatus: (id: string, status: 'paid' | 'pending' | 'refunded') => void
  assignDriver: (id: string, driverName: string | null) => void
  onRowClick: (booking: Booking) => void
}

export function TableMatrix({
  bookings,
  allBookings,
  loading,
  currentUser,
  driverOptions,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  updateStatus,
  updatePaymentStatus,
  assignDriver,
  onRowClick,
}: TableMatrixProps) {
  const allSelected = bookings.length > 0 && bookings.every((b) => selectedIds.has(b.id))

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading live data stream…</div>
  }

  if (bookings.length === 0) {
    return (
      <div className="border-dashed border-white/10 py-20 text-center text-slate-400">
        No matching records found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
            {currentUser.role === 'admin' && (
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-aurora"
                  aria-label="Select all rows"
                />
              </th>
            )}
            <th className="px-4 py-2.5">Status / Package</th>
            <th className="px-4 py-2.5">Customer & Payment</th>
            <th className="px-4 py-2.5">Schedule & Locations</th>
            <th className="px-4 py-2.5">Driver</th>
            <th className="px-4 py-2.5 text-right">Price</th>
            <th className="px-4 py-2.5 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm">
          {bookings.map((booking) => {
            const conflicts = getDriverConflicts(booking, allBookings)
            const recommendation =
              !booking.assigned_driver ? recommendDriver(booking, driverOptions, allBookings) : null

            return (
              <tr
                key={booking.id}
                className="group cursor-pointer transition-colors hover:bg-white/[0.02]"
                onClick={() => onRowClick(booking)}
              >
                {currentUser.role === 'admin' && (
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(booking.id)}
                      onChange={() => onToggleSelect(booking.id)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-aurora"
                      aria-label={`Select booking for ${booking.customer_name}`}
                    />
                  </td>
                )}

                <td className="space-y-1 px-4 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      booking.status === 'confirmed'
                        ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                        : booking.status === 'cancelled'
                        ? 'border border-rose-400/30 bg-rose-400/10 text-rose-300'
                        : 'border border-amber-400/30 bg-amber-400/10 text-amber-300'
                    }`}
                  >
                    {booking.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                    {booking.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                    {booking.status === 'pending' && <Clock3 className="h-3 w-3" />}
                    {booking.status}
                  </span>
                  <div className="font-medium text-white transition-colors group-hover:text-aurora">
                    {booking.item_title}
                  </div>
                </td>

                <td className="space-y-1 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-white">
                    <User className="h-3 w-3 text-slate-500" />
                    {booking.customer_name}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Mail className="h-3 w-3 text-slate-500" />
                    {booking.customer_email}
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <CreditCard className="h-3 w-3 text-slate-500" />
                    <select
                      value={booking.payment_status || 'pending'}
                      onChange={(e) =>
                        updatePaymentStatus(booking.id, e.target.value as 'paid' | 'pending' | 'refunded')
                      }
                      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide focus:outline-none ${
                        booking.payment_status === 'paid'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : booking.payment_status === 'refunded'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      <option value="paid" className="bg-slate-900 text-emerald-400">Paid</option>
                      <option value="pending" className="bg-slate-900 text-amber-400">Pending</option>
                      <option value="refunded" className="bg-slate-900 text-rose-400">Refunded</option>
                    </select>
                  </div>
                </td>

                <td className="space-y-1 px-4 py-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Calendar className="h-3 w-3 text-aurora" />
                    {booking.booking_date}
                    {booking.scheduled_time && (
                      <span className="text-slate-500">· {booking.scheduled_time}</span>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aurora" />
                    <span className="line-clamp-1">{booking.notes || 'No route details'}</span>
                  </div>
                </td>

                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                  {currentUser.role === 'admin' ? (
                    <div className="space-y-1">
                      <select
                        value={booking.assigned_driver || ''}
                        onChange={(e) => assignDriver(booking.id, e.target.value || null)}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white focus:border-aurora focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {driverOptions.map((d) => (
                          <option key={d.id} value={d.display_name}>
                            {d.display_name}
                          </option>
                        ))}
                      </select>
                      {conflicts.length > 0 && (
                        <span
                          title={`${booking.assigned_driver} has ${conflicts.length} other booking(s) around this time`}
                          className="flex items-center gap-1 text-[10px] font-medium text-amber-400"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {!booking.assigned_driver && recommendation && (
                        <button
                          type="button"
                          onClick={() => assignDriver(booking.id, recommendation.driverName)}
                          title={`Assign ${recommendation.driverName} (fewest bookings that day)`}
                          className="flex items-center gap-1 rounded-lg border border-aurora/30 bg-aurora/10 px-2 py-0.5 text-[10px] font-semibold text-aurora hover:bg-aurora hover:text-black"
                        >
                          <Wand2 className="h-3 w-3" />
                          Smart Assign
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-300">
                      <Car className="h-3 w-3 text-aurora" />
                      {booking.assigned_driver || 'Unassigned'}
                    </span>
                  )}
                </td>

                <td className="px-4 py-2.5 text-right font-mono font-semibold text-white">
                  {Number(booking.total_price || 0).toLocaleString()}
                  <span className="ml-1 text-[10px] text-slate-400">NOK</span>
                </td>

                <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    {booking.status !== 'confirmed' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'confirmed')}
                        title="Confirm Booking"
                        className="rounded-lg border border-aurora/30 bg-aurora/10 p-1.5 text-aurora transition-colors hover:bg-aurora hover:text-black"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        title="Cancel Booking"
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-400 transition-colors hover:bg-rose-500/20"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
