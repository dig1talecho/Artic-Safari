import { supabase } from '@/lib/supabase'

export type CharterVehicleType = 'suv' | 'van' | 'luxury_sedan' | 'minibus'

export interface CharterVehicle {
  vehicle_type: CharterVehicleType
  label: string
  capacity_label: string
  day_rate: number
  image_url: string | null
  updated_at: string
}

// Requires supabase-charter-vehicles-setup.sql. Callers (charter-form.tsx,
// services/charter.ts) fall back to hardcoded defaults when this errors or
// returns nothing, so /charter keeps working before that migration runs.
export function listCharterVehicles() {
  return supabase.from('charter_vehicles').select('*').order('day_rate', { ascending: true })
}

export function updateCharterVehicle(
  vehicleType: CharterVehicleType,
  payload: Partial<Pick<CharterVehicle, 'label' | 'capacity_label' | 'day_rate' | 'image_url'>>,
) {
  return supabase.from('charter_vehicles').update(payload).eq('vehicle_type', vehicleType)
}

// Reuses the existing public tour-media bucket under a charter-vehicles/
// prefix rather than provisioning a whole new storage bucket for 4 photos.
export async function uploadCharterVehicleImage(file: File) {
  const path = `charter-vehicles/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const { error: uploadError } = await supabase.storage.from('tour-media').upload(path, file)
  if (uploadError) return { publicUrl: null, error: uploadError }
  const { data } = supabase.storage.from('tour-media').getPublicUrl(path)
  return { publicUrl: data.publicUrl, error: null }
}
