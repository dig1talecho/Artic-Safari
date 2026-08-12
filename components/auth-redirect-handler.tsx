'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getSession, onAuthStateChange } from '@/services/auth.service'

/**
 * Supabase magic-link emails redirect back to the app with the session
 * tokens in the URL hash (e.g. "/#access_token=..."). Depending on the
 * Supabase project's Redirect URL allow-list, that can land on any page
 * (often the root "/") instead of the intended emailRedirectTo target.
 * This component runs on every page, detects that hash, waits for
 * supabase-js to finish establishing the session from it, then cleans the
 * URL and sends the user to /dashboard.
 */
export function AuthRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const hasAuthTokens =
      hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('type=magiclink')

    if (!hasAuthTokens) return

    let redirected = false
    const redirectToDashboard = () => {
      if (redirected) return
      redirected = true
      window.history.replaceState(null, '', window.location.pathname)
      router.replace('/dashboard')
    }

    // The session may already be set by the time this effect runs.
    getSession().then(({ data }) => {
      if (data.session) redirectToDashboard()
    })

    // Otherwise, catch it as soon as supabase-js finishes parsing the hash.
    const { data: listener } = onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') redirectToDashboard()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router])

  return null
}
