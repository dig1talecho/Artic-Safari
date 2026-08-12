'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { getStaffProfile } from '@/services/staff.service'

interface StaffProfile {
  role: 'admin' | 'driver'
  display_name: string
}

export function useStaffProfile(session: Session | null) {
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    getStaffProfile(session.user.id)
      .then(({ data, error }) => {
        if (!active) return
        setProfile(!error && data ? (data as StaffProfile) : null)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  return { profile, loading }
}
