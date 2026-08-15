import { UserCog, Car, CheckCircle2 } from 'lucide-react'
import type { Booking, DriverOption } from './types'

interface DriversViewProps {
  driverOptions: DriverOption[]
  bookings: Booking[]
}

export function DriversView({ driverOptions, bookings }: DriversViewProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
        <p className="text-xs text-slate-400">
          {driverOptions.length} driver account{driverOptions.length === 1 ? '' : 's'} registered.
        </p>
      </div>

      {driverOptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/40 py-16 text-center text-slate-400">
          No driver accounts found. Make sure the staff_profiles read-fix policy has been applied in
          Supabase (see supabase-staff-profiles-read-fix.sql).
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {driverOptions.map((driver) => {
            const assigned = bookings.filter(
              (b) => b.assigned_driver === driver.display_name && b.status !== 'cancelled',
            )
            const active = assigned.filter((b) => b.status === 'confirmed').length

            return (
              <div key={driver.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#33bbcf]">
                    <UserCog className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{driver.display_name}</p>
                    <p className="text-xs text-slate-400">Driver</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Car className="h-3.5 w-3.5 text-[#33bbcf]" />
                      Assigned
                    </div>
                    <p className="mt-1 text-lg font-bold text-white">{assigned.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Confirmed
                    </div>
                    <p className="mt-1 text-lg font-bold text-white">{active}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
