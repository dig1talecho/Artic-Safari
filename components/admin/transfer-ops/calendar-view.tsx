'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import type { Booking } from '@/components/admin/types'

interface CalendarViewProps {
  bookings: Booking[]
  onSelectBooking: (booking: Booking) => void
}

const statusDot: Record<Booking['status'], string> = {
  confirmed: 'bg-emerald-400',
  pending: 'bg-amber-400',
  cancelled: 'bg-rose-400',
}

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0]
}

export function CalendarView({ bookings, onSelectBooking }: CalendarViewProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const byDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings) {
      const key = b.booking_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(b)
    }
    return map
  }, [bookings])

  const weeks = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)

    const result: (Date | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7))
    return result
  }, [viewMonth])

  const selectedBookings = selectedDate ? byDate.get(selectedDate) ?? [] : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <CalendarIcon className="h-4 w-4 text-[#33bbcf]" />
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weeks.flatMap((week, wi) =>
          week.map((date, di) => {
            if (!date) return <div key={`${wi}-${di}`} />
            const iso = toIsoDate(date)
            const dayBookings = byDate.get(iso) ?? []
            const isSelected = selectedDate === iso
            const isToday = iso === toIsoDate(new Date())

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(isSelected ? null : iso)}
                className={`flex min-h-16 flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition-colors ${
                  isSelected
                    ? 'border-[#33bbcf] bg-[#33bbcf]/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <span className={`text-xs ${isToday ? 'font-bold text-[#33bbcf]' : 'text-slate-300'}`}>
                  {date.getDate()}
                </span>
                {dayBookings.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {dayBookings.slice(0, 6).map((b) => (
                      <span key={b.id} className={`h-1.5 w-1.5 rounded-full ${statusDot[b.status]}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          }),
        )}
      </div>

      {selectedDate && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {selectedBookings.length} booking{selectedBookings.length === 1 ? '' : 's'} on{' '}
            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-slate-500">No bookings this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedBookings.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBooking(b)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-left hover:bg-white/[0.05]"
                >
                  <span className="flex items-center gap-2 text-sm text-white">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[b.status]}`} />
                    {b.customer_name} — {b.item_title}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {Number(b.total_price || 0).toLocaleString()} kr
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
