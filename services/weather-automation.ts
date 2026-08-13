import { supabase } from '@/lib/supabase'
import { weatherStatusSchema } from '@/lib/validation'
import type { AuroraConditions } from '@/services/aurora.service'
import { z } from 'zod'

export type WeatherStatus = z.infer<typeof weatherStatusSchema>

export interface WeatherEvaluation {
  suggestedStatus: WeatherStatus
  reason: string
}

/**
 * Real rule, not a placeholder: driven by the same NOAA/Open-Meteo cloud
 * cover this project already fetches for the homepage Aurora Radar
 * (services/aurora.service.ts). Deliberately never suggests
 * AUTO_CANCELLED on its own for anything short of near-certain washout --
 * cancelling a paid booking is a business decision, so this function
 * *suggests*, and applyWeatherStatus() is a separate, explicit write that
 * an admin (or a deliberately-wired cron, if the user asks for one later)
 * has to call.
 */
export function evaluateWeatherStatus(conditions: Pick<AuroraConditions, 'cloudCoverPercent'>): WeatherEvaluation {
  if (conditions.cloudCoverPercent >= 95) {
    return { suggestedStatus: 'AUTO_CANCELLED', reason: `Cloud cover ${conditions.cloudCoverPercent}% — near-total washout expected` }
  }
  if (conditions.cloudCoverPercent >= 75) {
    return { suggestedStatus: 'DELAYED', reason: `Cloud cover ${conditions.cloudCoverPercent}% — poor visibility likely` }
  }
  return { suggestedStatus: 'SCHEDULED', reason: `Cloud cover ${conditions.cloudCoverPercent}% — conditions acceptable` }
}

export function applyWeatherStatus(bookingId: string, status: WeatherStatus) {
  const parsed = weatherStatusSchema.safeParse(status)
  if (!parsed.success) {
    return Promise.resolve({ data: null, error: { message: 'Invalid weather status' } })
  }
  return supabase.from('bookings').update({ weather_status: parsed.data }).eq('id', bookingId)
}

function generateToken(): string {
  // crypto.randomUUID() is available in both the browser and Node 19+ (this
  // project targets modern runtimes only, matching next.config.mjs).
  return crypto.randomUUID().replace(/-/g, '')
}

export interface RebookToken {
  id: string
  booking_id: string
  token: string
  used: boolean
  expires_at: string
  created_at: string
}

/** Creates a single-use, 14-day link a customer can use to pick a new date
 * after a weather-triggered delay/cancellation notice. */
export async function createRebookToken(bookingId: string) {
  return supabase
    .from('rebook_tokens')
    .insert([{ booking_id: bookingId, token: generateToken() }])
    .select()
    .single()
}

export async function redeemRebookToken(token: string): Promise<{ bookingId: string | null; error?: string }> {
  const { data, error } = await supabase
    .from('rebook_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) return { bookingId: null, error: 'This rebooking link is invalid or has expired.' }

  await supabase.from('rebook_tokens').update({ used: true }).eq('id', data.id)
  return { bookingId: data.booking_id }
}
