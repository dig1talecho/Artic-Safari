'use client'

import { useEffect, useState } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Car,
  History,
} from 'lucide-react'
import type { Booking, CurrentUser } from '@/components/admin/types'
import { listBookingAudit, type AuditLogRow } from '@/services/audit-log.service'

interface BookingDrawerProps {
  booking: Booking | null
  currentUser: CurrentUser
  onClose: () => void
  updateStatus: (id: string, status: 'confirmed' | 'cancelled' | 'pending') => void
  updatePaymentStatus: (id: string, status: 'paid' | 'pending' | 'refunded') => void
}

const changeTypeLabel: Record<string, string> = {
  created: 'Booking created',
  status_changed: 'Status changed',
  payment_status_changed: 'Payment status changed',
  driver_assigned: 'Driver assigned',
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 text-slate-500">{icon}</span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-white">{value}</p>
      </div>
    </div>
  )
}

export function BookingDrawer({ booking, onClose, updateStatus, updatePaymentStatus }: BookingDrawerProps) {
  const [audit, setAudit] = useState<AuditLogRow[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  useEffect(() => {
    if (!booking) return
    let active = true
    setAuditLoading(true)

    listBookingAudit(booking.id).then(({ data, error }) => {
      if (!active) return
      if (!error) setAudit(data ?? [])
      setAuditLoading(false)
    })

    return () => {
      active = false
    }
  }, [booking?.id])

  if (!booking) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{booking.booking_type}</p>
            <h2 className="text-sm font-semibold text-white">{booking.item_title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <DetailRow icon={<User className="h-4 w-4" />} label="Customer" value={booking.customer_name} />
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={booking.customer_email} />
            {booking.customer_phone && (
              <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={booking.customer_phone} />
            )}
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Date"
              value={booking.scheduled_time ? `${booking.booking_date} · ${booking.scheduled_time}` : booking.booking_date}
            />
            {booking.notes && (
              <DetailRow icon={<MapPin className="h-4 w-4" />} label="Notes" value={booking.notes} />
            )}
            <DetailRow icon={<Car className="h-4 w-4" />} label="Driver" value={booking.assigned_driver || 'Unassigned'} />
            <DetailRow
              icon={<CreditCard className="h-4 w-4" />}
              label="Price"
              value={`${Number(booking.total_price || 0).toLocaleString()} NOK · ${booking.payment_status || 'pending'}`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {booking.status !== 'confirmed' && (
              <button
                type="button"
                onClick={() => updateStatus(booking.id, 'confirmed')}
                className="rounded-xl border border-aurora/30 bg-aurora/10 px-3 py-1.5 text-xs font-semibold text-aurora hover:bg-aurora hover:text-black"
              >
                Confirm
              </button>
            )}
            {booking.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => updateStatus(booking.id, 'cancelled')}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
              >
                Cancel
              </button>
            )}
            {booking.payment_status !== 'paid' && (
              <button
                type="button"
                onClick={() => updatePaymentStatus(booking.id, 'paid')}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
              >
                Mark Paid
              </button>
            )}
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <History className="h-3.5 w-3.5" />
              Change History
            </h3>

            {auditLoading ? (
              <p className="text-xs text-slate-500">Loading…</p>
            ) : audit.length === 0 ? (
              <p className="text-xs text-slate-500">
                No changes recorded yet. Once booking_audit_log is set up (see database_schema.sql),
                future edits to this booking will appear here.
              </p>
            ) : (
              <ol className="space-y-3 border-l border-white/10 pl-4">
                {audit.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-aurora" />
                    <p className="text-xs font-medium text-white">
                      {changeTypeLabel[entry.change_type] || entry.change_type}
                    </p>
                    {(entry.old_value || entry.new_value) && (
                      <p className="text-[11px] text-slate-400">
                        {entry.old_value || '—'} → {entry.new_value || '—'}
                      </p>
                    )}
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" />
                      {entry.changed_by} · {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
