'use client'

import { allowedStatuses, STATUS_LABEL, type BookingStatus, type PaymentStatus } from '@/lib/booking-lifecycle'
import {
  Calendar,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Clock3,
  Car,
  Activity,
  MapPin,
  CreditCard,
} from 'lucide-react'
import type { Booking, DriverOption, CurrentUser } from './types'

interface BookingTableProps {
  title: string
  bookings: Booking[]
  loading: boolean
  currentUser: CurrentUser
  driverOptions: DriverOption[]
  searchTerm: string
  filterStatus: string
  onFilterStatusChange: (status: string) => void
  updateStatus: (id: string, status: BookingStatus) => void
  updatePaymentStatus: (id: string, status: PaymentStatus) => void
  /** Admins get the correction moves; drivers do not. */
  isAdmin?: boolean
  assignDriver: (id: string, driverName: string | null) => void
}

export function BookingTable({
  title,
  bookings,
  loading,
  currentUser,
  driverOptions,
  searchTerm,
  filterStatus,
  onFilterStatusChange,
  updateStatus,
  updatePaymentStatus,
  isAdmin = false,
  assignDriver,
}: BookingTableProps) {
  const filteredBookings = bookings.filter((b) => {
    if (currentUser.role === 'driver') {
      const isAssignedToMe = b.assigned_driver === currentUser.name
      const isUnassigned = !b.assigned_driver
      if (!isAssignedToMe && !isUnassigned) return false
    }

    const matchesSearch =
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.item_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || b.status === filterStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filtre */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-400">
          Showing {filteredBookings.length} of {bookings.length} entries
        </span>
        <div className="flex w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-900/80 p-1 sm:w-auto">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => onFilterStatusChange(status)}
              className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-[#33bbcf] font-semibold text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Canlı Tablo */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse text-[#33bbcf]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{title}</h2>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading live data stream…</div>
        ) : filteredBookings.length === 0 ? (
          <div className="border-dashed border-white/10 py-20 text-center text-slate-400">
            No matching records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Status / Package</th>
                  <th className="px-6 py-3.5">Customer & Payment</th>
                  <th className="px-6 py-3.5">Schedule & Locations</th>
                  <th className="px-6 py-3.5">Assigned Driver</th>
                  <th className="px-6 py-3.5 text-right">Price (NOK)</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="group transition-colors hover:bg-white/[0.02]">
                    {/* Durum ve Paket */}
                    <td className="space-y-1.5 px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          booking.status === 'confirmed'
                            ? 'border border-[#33bbcf]/30 bg-[#33bbcf]/20 text-[#33bbcf]'
                            : booking.status === 'cancelled'
                            ? 'border border-rose-500/30 bg-rose-500/20 text-rose-400'
                            : 'border border-amber-500/30 bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {booking.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                        {booking.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                        {booking.status === 'pending' && <Clock3 className="h-3 w-3" />}
                        {booking.status}
                      </span>
                      <div className="font-semibold text-white transition-colors group-hover:text-[#33bbcf]">
                        {booking.item_title}
                      </div>
                    </td>

                    {/* Müşteri ve Ödeme Durumu */}
                    <td className="space-y-1.5 px-6 py-4 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        {booking.customer_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        {booking.customer_email}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                        <select
                          value={booking.payment_status || 'pending'}
                          onChange={(e) =>
                            updatePaymentStatus(booking.id, e.target.value as PaymentStatus)
                          }
                          className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider focus:outline-none ${
                            booking.payment_status === 'paid'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : booking.payment_status === 'refunded'
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          <option value="paid" className="bg-slate-900 text-emerald-400">Paid / Ödendi</option>
                          <option value="pending" className="bg-slate-900 text-amber-400">Pending / Ödeme Bekliyor</option>
                          <option value="refunded" className="bg-slate-900 text-rose-400">Refunded / İade</option>
                        </select>
                      </div>
                    </td>

                    {/* Tarih ve Konum Bilgileri */}
                    <td className="space-y-1.5 px-6 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <Calendar className="h-3.5 w-3.5 text-[#33bbcf]" />
                        {booking.booking_date}
                      </div>
                      <div className="flex items-start gap-1.5 rounded-xl border border-white/5 bg-white/5 p-2 text-slate-300">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#33bbcf]" />
                        <div className="space-y-0.5">
                          <span className="block text-[11px] text-slate-400">Route & Location Info:</span>
                          <span className="font-medium text-white">
                            {booking.notes || 'Pickup / Dropoff details not specified'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Şoför Atama */}
                    <td className="px-6 py-4">
                      {currentUser.role === 'admin' ? (
                        <select
                          value={booking.assigned_driver || ''}
                          onChange={(e) => assignDriver(booking.id, e.target.value || null)}
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-[#33bbcf] focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {driverOptions.map((d) => (
                            <option key={d.id} value={d.display_name}>
                              {d.display_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                            <Car className="h-3 w-3 text-[#33bbcf]" />
                            {booking.assigned_driver || 'Unassigned'}
                          </span>
                          {!booking.assigned_driver && (
                            <button
                              onClick={() => assignDriver(booking.id, currentUser.name)}
                              className="rounded-xl border border-[#33bbcf]/30 bg-[#33bbcf]/10 px-3 py-1 text-xs font-semibold text-[#33bbcf] transition-colors hover:bg-[#33bbcf] hover:text-black"
                            >
                              Take Tour
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Tutar */}
                    <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                      {Number(booking.total_price || 0).toLocaleString()}{' '}
                      <span className="text-xs text-slate-400">NOK</span>
                    </td>

                    {/* İşlemler */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/*
                          Was two fixed buttons, Confirm and Cancel, shown
                          by !== comparison. With a lifecycle that offered
                          moves the database would refuse -- confirming an
                          already-completed trip, for one. The options are
                          now whatever the state machine actually allows
                          from here, for this role.
                        */}
                        {(() => {
                          const next = allowedStatuses(booking.status, isAdmin)
                          if (next.length === 0) {
                            return (
                              <span className="text-[11px] text-slate-600" title="No further moves from this state">
                                —
                              </span>
                            )
                          }
                          return (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) updateStatus(booking.id, e.target.value as BookingStatus)
                              }}
                              aria-label={`Change status for ${booking.customer_name}`}
                              className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:border-[#33bbcf] focus:outline-none"
                            >
                              <option value="">Move to…</option>
                              {next.map((s) => (
                                <option key={s} value={s} className="bg-slate-900">
                                  {STATUS_LABEL[s]}
                                </option>
                              ))}
                            </select>
                          )
                        })()}
                      </div>
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
