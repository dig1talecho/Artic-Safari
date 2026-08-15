'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Car, Download, X } from 'lucide-react'
import type { Booking, DriverOption } from '@/components/admin/types'

interface BulkActionBarProps {
  selectedIds: Set<string>
  bookings: Booking[]
  driverOptions: DriverOption[]
  updateStatus: (id: string, status: 'confirmed' | 'cancelled' | 'pending') => void
  assignDriver: (id: string, driverName: string | null) => void
  onClear: () => void
}

function downloadCsv(rows: Booking[]) {
  const headers = ['Customer', 'Email', 'Type', 'Item', 'Date', 'Time', 'Status', 'Payment', 'Driver', 'Price']
  const lines = rows.map((b) =>
    [
      b.customer_name,
      b.customer_email,
      b.booking_type,
      b.item_title,
      b.booking_date,
      b.scheduled_time || '',
      b.status,
      b.payment_status || '',
      b.assigned_driver || '',
      String(b.total_price ?? 0),
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(','),
  )
  const csv = [headers.join(','), ...lines].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function BulkActionBar({
  selectedIds,
  bookings,
  driverOptions,
  updateStatus,
  assignDriver,
  onClear,
}: BulkActionBarProps) {
  const [assignTo, setAssignTo] = useState('')

  if (selectedIds.size === 0) return null

  const selectedBookings = bookings.filter((b) => selectedIds.has(b.id))

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#33bbcf]/30 bg-[#33bbcf]/10 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-semibold text-[#33bbcf]">{selectedIds.size} selected</span>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selectedBookings.forEach((b) => updateStatus(b.id, 'confirmed'))}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-[#33bbcf]" />
          Confirm
        </button>
        <button
          type="button"
          onClick={() => selectedBookings.forEach((b) => updateStatus(b.id, 'cancelled'))}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
        >
          <XCircle className="h-3.5 w-3.5 text-rose-400" />
          Cancel
        </button>

        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
          <Car className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={assignTo}
            onChange={(e) => {
              const driver = e.target.value
              setAssignTo(driver)
              if (driver) {
                selectedBookings.forEach((b) => assignDriver(b.id, driver))
                setAssignTo('')
              }
            }}
            className="bg-transparent text-xs text-white focus:outline-none"
          >
            <option value="" className="bg-slate-900">Assign driver…</option>
            {driverOptions.map((d) => (
              <option key={d.id} value={d.display_name} className="bg-slate-900">
                {d.display_name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => downloadCsv(selectedBookings)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>

        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
