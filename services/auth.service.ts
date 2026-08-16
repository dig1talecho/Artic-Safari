import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { siteUrl } from '@/lib/site-config'

export type OAuthProvider = 'google' | 'apple'

export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signUpCustomer(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function getSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * Browser OAuth (Google / Apple). Redirect-based: Supabase sends the user
 * to the provider, the provider returns to /dashboard with a session in
 * the URL hash, and components/auth-redirect-handler.tsx (already mounted
 * app-wide) exchanges it.
 *
 * Requires the provider to be enabled in Supabase Dashboard ->
 * Authentication -> Providers. Until then this returns Supabase's own
 * "provider is not enabled" error, which the caller should surface as-is.
 *
 * NOTE: the mobile app does NOT use this function -- React Native has no
 * URL redirect to come back to. See the Expo app's own services/auth.ts,
 * which uses native ID-token sign-in instead.
 */
export function signInWithOAuth(provider: OAuthProvider, redirectPath = '/dashboard') {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${siteUrl}${redirectPath}` },
  })
}
