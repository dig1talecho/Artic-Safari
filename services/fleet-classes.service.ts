import { supabase } from '@/lib/supabase'
import { fleetClassUpdateSchema } from '@/lib/validation'

export interface FleetClass {
  id: string
  /** Stable key stored on bookings. Never rename an existing one. */
  code: string
  label: string
  capacity_hint: string
  multiplier: number
  sort_order: number
  active: boolean
  updated_at: string
}

export type FleetClassUpdatePayload = Partial<
  Pick<FleetClass, 'label' | 'capacity_hint' | 'multiplier' | 'sort_order' | 'active'>
>

/** Everything, including inactive rows — the admin needs to see those to re-enable them. */
export function listFleetClasses() {
  return supabase.from('fleet_classes').select('*').order('sort_order', { ascending: true })
}

/** Only what a guest may choose from. Used by the public booking forms. */
export function listActiveFleetClasses() {
  return supabase
    .from('fleet_classes')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
}

export async function updateFleetClass(id: string, payload: FleetClassUpdatePayload) {
  const parsed = fleetClassUpdateSchema.partial().safeParse(payload)
  if (!parsed.success) {
    return {
      data: null,
      error: { message: parsed.error.issues[0]?.message ?? 'Invalid vehicle class values' },
    }
  }
  return supabase
    .from('fleet_classes')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
}
