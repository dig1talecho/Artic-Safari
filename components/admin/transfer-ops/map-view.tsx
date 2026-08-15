'use client'

import { useMemo } from 'react'
import { MapPin, Info } from 'lucide-react'
import type { Booking } from '@/components/admin/types'

interface MapViewProps {
  bookings: Booking[]
  onSelectBooking: (booking: Booking) => void
}

const PICKUP_NOTE_PATTERN = /^Pickup:\s*(.+?)\s*-\s*Dropoff:/

function extractPickupPoint(notes: string): string | null {
  const match = notes.match(PICKUP_NOTE_PATTERN)
  return match ? match[1] : null
}

interface PickupGroup {
  key: string
  label: string
  x: number
  y: number
  bookings: Booking[]
}

export function MapView({ bookings, onSelectBooking }: MapViewProps) {
  const { fixedGroups, otherBookings } = useMemo(() => {
    const airport: Booking[] = []
    const cityCenter: Booking[] = []
    const other: Booking[] = []

    for (const b of bookings) {
      const pickup = b.notes ? extractPickupPoint(b.notes) : null
      if (pickup === 'Tromsø Airport (TOS)') airport.push(b)
      else if (pickup === 'Tromsø City Center') cityCenter.push(b)
      else other.push(b)
    }

    const groups: PickupGroup[] = [
      { key: 'airport', label: 'Tromsø Airport (TOS)', x: 90, y: 70, bookings: airport },
      { key: 'city', label: 'Tromsø City Center', x: 230, y: 130, bookings: cityCenter },
    ]

    return { fixedGroups: groups, otherBookings: other }
  }, [bookings])

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
        Static route overview grouped by real pickup point — not a live GPS map. Driver location
        sharing isn't built, so vehicle positions aren't tracked in real time.
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <svg viewBox="0 0 320 200" className="h-48 w-full">
          <path
            d="M 90 70 Q 160 40 230 130"
            fill="none"
            stroke="rgba(148,163,184,0.25)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {fixedGroups.map((g) => (
            <g key={g.key}>
              <circle cx={g.x} cy={g.y} r="22" fill="rgba(56,189,248,0.08)" />
              <circle cx={g.x} cy={g.y} r="7" fill="var(--[#33bbcf], #38bdf8)" />
              <text x={g.x} y={g.y - 16} textAnchor="middle" className="fill-slate-300 text-[10px] font-semibold">
                {g.label}
              </text>
              <text x={g.x} y={g.y + 4} textAnchor="middle" className="fill-slate-950 text-[10px] font-bold">
                {g.bookings.length}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fixedGroups.map((g) => (
          <div key={g.key} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-[#33bbcf]" />
              {g.label} ({g.bookings.length})
            </h3>
            {g.bookings.length === 0 ? (
              <p className="text-xs text-slate-500">No transfers from this point right now.</p>
            ) : (
              <div className="space-y-1.5">
                {g.bookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectBooking(b)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.05]"
                  >
                    <span className="text-white">{b.customer_name}</span>
                    <span className="text-slate-400">{b.booking_date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {otherBookings.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Other / Live Location Pickups ({otherBookings.length})
          </h3>
          <div className="space-y-1.5">
            {otherBookings.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBooking(b)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.05]"
              >
                <span className="text-white">{b.customer_name}</span>
                <span className="line-clamp-1 max-w-[60%] text-slate-400">{b.notes || b.booking_date}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
