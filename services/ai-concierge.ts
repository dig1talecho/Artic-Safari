import { supabase } from '@/lib/supabase'
import { itineraryPreferencesSchema } from '@/lib/validation'
import { z } from 'zod'

export type ItineraryPreferences = z.infer<typeof itineraryPreferencesSchema>

export interface ItineraryActivity {
  time: string // "HH:MM"
  title: string
  description: string
}

export interface ItineraryDay {
  day: number
  theme: string
  activities: ItineraryActivity[]
}

export interface GeneratedItinerary {
  days: ItineraryDay[]
  summary: string
}

export type ItineraryResult =
  | { ok: true; itinerary: GeneratedItinerary }
  | { ok: false; reason: 'not_configured' | 'invalid_input' | 'generation_failed'; error?: string }

function buildPrompt(prefs: ItineraryPreferences): string {
  return `You are a Tromso Arctic travel concierge. Build a day-by-day, hour-by-hour itinerary for a private guest.

Guests: ${prefs.pax}
Trip vibe: ${prefs.vibe}
Cold tolerance: ${prefs.cold_tolerance}
Stay duration: ${prefs.stay_duration_days} day(s)

Only suggest activities genuinely available in Tromso, Norway (Northern Lights chases, fjord/coastal drives, city sights, Arctic Cathedral, Fjellheisen cable car, whale safaris in season, dog sledding). Do not invent businesses or prices.

Respond with ONLY valid JSON matching this TypeScript type, no prose outside the JSON:
{
  "summary": string,
  "days": [
    { "day": number, "theme": string, "activities": [{ "time": "HH:MM", "title": string, "description": string }] }
  ]
}`
}

/**
 * Real Anthropic Messages API call when ANTHROPIC_API_KEY is set (server-
 * side only -- call this from a Route Handler, not a client component).
 * Returns a structured not_configured result otherwise, same pattern as
 * every other external-service integration in this project.
 */
export async function generateItinerary(input: ItineraryPreferences): Promise<ItineraryResult> {
  const parsed = itineraryPreferencesSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, reason: 'invalid_input', error: parsed.error.issues[0]?.message }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { ok: false, reason: 'not_configured' }
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(parsed.data) }],
      }),
    })

    if (!res.ok) {
      return { ok: false, reason: 'generation_failed', error: `Anthropic API returned ${res.status}` }
    }

    const data = await res.json()
    const text: string = data?.content?.[0]?.text ?? ''
    const itinerary = JSON.parse(text) as GeneratedItinerary

    await supabase.from('ai_itineraries').insert([
      { booking_id: parsed.data.booking_id ?? null, preferences: parsed.data, itinerary },
    ])

    return { ok: true, itinerary }
  } catch (err) {
    return { ok: false, reason: 'generation_failed', error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
