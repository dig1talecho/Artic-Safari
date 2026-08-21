'use client'

import { useMemo, useState } from 'react'
import { Users, MapPin, UserCog, AlertTriangle, CalendarDays, Phone } from 'lucide-react'
import type { Booking } from './types'
import { STATUS_LABEL, STATUS_TONE, type StatusTone } from '@/lib/booking-lifecycle'
import { tromsoToday } from '@/lib/dates'

/**
 * Tonight.
 *
 * The admin panel had fifteen sections and none of them answered the
 * question an operator asks every single evening: what is happening
 * tonight, who is driving, how many guests, where are we collecting them.
 * That had to be assembled in your head from the bookings table.
 *
 * Everything here comes from data already loaded for the other screens --
 * no new query, no new table. It is a lens, not a feature.
 */

const TONE_CLASS: Record<StatusTone, string> = {
  attention: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  active: 'border-[#33bbcf]/30 bg-[#33bbcf]/10 text-[#33bbcf]',
  done: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  bad: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  muted: 'border-white/10 bg-white/5 text-slate-400',
}

export function TonightView({ bookings }: { bookings: Booking[] }) {
  const [offset, setOffset] = useState(0)
  const today = tromsoToday()

  const targetDate = useMemo(() => {
    const [y, m, d] = today.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d + offset))
    return dt.toISOString().split('T')[0]
  }, [today, offset])

  const trips = useMemo(
    () =>
      bookings
        .filter((b) => b.booking_date === targetDate && b.status !== 'cancelled')
        // By departure time, because that is the order the evening happens
        // in. Bookings with no time sort last: they are the ones still
        // needing a call.
        .sort((a, b) => (a.scheduled_time ?? '99:99').localeCompare(b.scheduled_time ?? '99:99')),
    [bookings, targetDate],
  )

  const guests = trips.reduce((n, b) => n + Number(b.party_size ?? 1), 0)
  const unassigned = trips.filter((b) => !b.assigned_driver)
  const unconfirmed = trips.filter((b) => b.status === 'pending')
  const drivers = new Set(trips.map((b) => b.assigned_driver).filter(Boolean))

  const label = offset === 0 ? 'Tonight' : offset === 1 ? 'Tomorrow' : `In ${offset} days`

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white">{label}</p>
            <p className="mt-1 text-xs text-slate-400">{targetDate}</p>
          </div>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {[0, 1, 2].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setOffset(n)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  offset === n ? 'bg-[#33bbcf] text-black' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {n === 0 ? 'Tonight' : n === 1 ? 'Tomorrow' : '+2 days'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={CalendarDays} label="Trips" value={trips.length} />
          <Stat icon={Users} label="Guests" value={guests} />
          <Stat icon={UserCog} label="Drivers" value={drivers.size} />
          <Stat
            icon={AlertTriangle}
            label="Need a driver"
            value={unassigned.length}
            tone={unassigned.length > 0 ? 'warn' : undefined}
          />
        </div>

        {/*
          The two things that ruin an evening if they are still true at
          departure. Surfaced above the list rather than buried in it.
        */}
        {(unconfirmed.length > 0 || unassigned.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {unconfirmed.length > 0 && (
              <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
                {unconfirmed.length} still awaiting confirmation
              </span>
            )}
            {unassigned.length > 0 && (
              <span className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-300">
                {unassigned.length} with no driver
              </span>
            )}
          </div>
        )}
      </section>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
          Nothing scheduled for {targetDate}.
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Departure time first: it is what orders the evening. */}
                    <span className="font-mono text-lg font-bold tabular-nums text-white">
                      {b.scheduled_time?.slice(0, 5) ?? '—:—'}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        TONE_CLASS[STATUS_TONE[b.status] ?? 'attention']
                      }`}
                    >
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-medium text-white">{b.item_title}</p>
                </div>

                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-white">
                    {Number(b.total_price || 0).toLocaleString()}{' '}
                    <span className="text-xs text-slate-500">NOK</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {Number(b.party_size ?? 1)} {Number(b.party_size ?? 1) === 1 ? 'guest' : 'guests'}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 border-t border-white/[0.06] pt-3 text-xs text-slate-400 sm:grid-cols-2">
                <span className="flex items-start gap-1.5">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="min-w-0">
                    <span className="text-slate-200">{b.customer_name}</span>
                    {b.customer_phone && (
                      <a
                        href={`tel:${b.customer_phone}`}
                        className="ml-2 inline-flex items-center gap-1 text-[#33bbcf] hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {b.customer_phone}
                      </a>
                    )}
                  </span>
                </span>

                <span className="flex items-start gap-1.5">
                  <UserCog className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  {b.assigned_driver ? (
                    <span className="text-slate-200">{b.assigned_driver}</span>
                  ) : (
                    <span className="font-medium text-rose-400">No driver yet</span>
                  )}
                </span>

                {b.pickup_address && (
                  <span className="flex items-start gap-1.5 sm:col-span-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="min-w-0 text-slate-300">
                      {b.pickup_address}
                      {b.dropoff_address ? (
                        <span className="text-slate-500"> → {b.dropoff_address}</span>
                      ) : null}
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone?: 'warn'
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${tone === 'warn' ? 'text-amber-400' : 'text-slate-600'}`} />
      </div>
      <p
        className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
          tone === 'warn' && value > 0 ? 'text-amber-400' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
