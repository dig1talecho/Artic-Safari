import { supabase } from '@/lib/supabase'

export interface AuditLogEntry {
  booking_id: string
  changed_by: string
  change_type: 'created' | 'status_changed' | 'payment_status_changed' | 'driver_assigned'
  old_value: string | null
  new_value: string | null
}

export interface AuditLogRow extends AuditLogEntry {
  id: string
  created_at: string
}

export async function logBookingChange(entry: AuditLogEntry) {
  // Best-effort: a missing booking_audit_log table (not yet created via
  // database_schema.sql) must never break the underlying booking mutation.
  try {
    await supabase.from('booking_audit_log').insert([entry])
  } catch {
    // swallow — logging is not on the critical path
  }
}

export function listBookingAudit(bookingId: string) {
  return supabase
    .from('booking_audit_log')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
}
