import type { Booking, DriverOption } from '@/components/admin/types'

/**
 * Real, explainable load-balancing heuristic -- not AI. There is no
 * driver-location data in this system, so "smart" means: recommend the
 * driver with the fewest other bookings on the same date. When both
 * bookings being compared have a scheduled_time, a same-day pair is only
 * flagged as a conflict if the times are within two hours of each other;
 * bookings without a time (most transfers -- same-day dispatch has no
 * time-of-day field) fall back to a same-date-only conflict check, since
 * that's the real granularity available for them.
 */

const CONFLICT_WINDOW_MINUTES = 120

function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function bookingsConflict(a: Booking, b: Booking): boolean {
  if (a.id === b.id) return false
  if (a.booking_date !== b.booking_date) return false

  const aMinutes = timeToMinutes(a.scheduled_time)
  const bMinutes = timeToMinutes(b.scheduled_time)

  if (aMinutes !== null && bMinutes !== null) {
    return Math.abs(aMinutes - bMinutes) <= CONFLICT_WINDOW_MINUTES
  }

  // At least one side has no time-of-day data -- same-date is the most we can say.
  return true
}

export function getDriverConflicts(booking: Booking, allBookings: Booking[]): Booking[] {
  if (!booking.assigned_driver) return []
  return allBookings.filter(
    (other) => other.assigned_driver === booking.assigned_driver && bookingsConflict(booking, other),
  )
}

export interface DriverRecommendation {
  driverName: string
  sameDateLoad: number
}

export function recommendDriver(
  booking: Booking,
  drivers: DriverOption[],
  allBookings: Booking[],
): DriverRecommendation | null {
  if (drivers.length === 0) return null

  const loads = drivers.map((driver) => {
    const sameDateLoad = allBookings.filter(
      (b) => b.id !== booking.id && b.assigned_driver === driver.display_name && b.booking_date === booking.booking_date,
    ).length
    return { driverName: driver.display_name, sameDateLoad }
  })

  loads.sort((a, b) => a.sameDateLoad - b.sameDateLoad)
  return loads[0]
}
