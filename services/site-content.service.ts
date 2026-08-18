import { supabase } from '@/lib/supabase'

export interface SiteContentRow {
  key: string
  value: string
  updated_at: string
  updated_by: string | null
}

/** Every override. Small table by design -- only edited keys live here. */
export function listSiteContent() {
  return supabase.from('site_content').select('*').order('key')
}

/**
 * Writes one override. Blank means "go back to the code's wording", which
 * is a delete rather than storing an empty string -- otherwise the page
 * would render a gap where the original sentence used to be.
 */
export async function setSiteContent(key: string, value: string) {
  const trimmed = value.trim()

  if (trimmed === '') {
    return supabase.from('site_content').delete().eq('key', key)
  }

  // updated_at and updated_by are stamped by a trigger from the caller's
  // JWT, so they are not sent from here -- a browser could claim anything.
  return supabase.from('site_content').upsert({ key, value: trimmed }, { onConflict: 'key' })
}

/** Explicit "reset to default". */
export function clearSiteContent(key: string) {
  return supabase.from('site_content').delete().eq('key', key)
}
