'use client'

import { useCallback, useRef, useState } from 'react'

const MIN_FILL_TIME_MS = 2000

/**
 * Lightweight, no-dependency spam mitigation for public forms: a hidden
 * honeypot field bots tend to fill in, plus a minimum time-since-shown
 * guard (real people take longer than a script to fill a multi-field form).
 */
export function useSpamGuard() {
  const startedAtRef = useRef(Date.now())
  const [honeypot, setHoneypot] = useState('')

  const reset = useCallback(() => {
    startedAtRef.current = Date.now()
    setHoneypot('')
  }, [])

  const isSpam = useCallback(() => {
    if (honeypot.trim() !== '') return true
    if (Date.now() - startedAtRef.current < MIN_FILL_TIME_MS) return true
    return false
  }, [honeypot])

  return { honeypot, setHoneypot, reset, isSpam }
}
