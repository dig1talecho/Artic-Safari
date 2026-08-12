import { supabase } from '@/lib/supabase'

export interface CustomerProfileInsertPayload {
  id: string
  full_name: string
  phone: string
  email: string
}

export function getCustomerProfile(userId: string) {
  return supabase.from('customer_profiles').select('full_name, phone, email').eq('id', userId).maybeSingle()
}

export function createCustomerProfile(payload: CustomerProfileInsertPayload) {
  return supabase.from('customer_profiles').insert([payload])
}
