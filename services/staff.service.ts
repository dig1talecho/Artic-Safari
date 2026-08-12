import { supabase } from '@/lib/supabase'

export function getStaffProfile(userId: string) {
  return supabase.from('staff_profiles').select('role, display_name').eq('id', userId).maybeSingle()
}

export function listDrivers() {
  return supabase.from('staff_profiles').select('id, display_name').eq('role', 'driver')
}
