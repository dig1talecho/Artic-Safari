'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { getCustomerProfile } from '@/services/customers.service'

interface CustomerProfile {
  full_name: string
  phone: string
  email: string
}

export function useCustomerProfile(session: Session | null) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    getCustomerProfile(session.user.id)
      .then(({ data, error }) => {
        if (!active) return
        setProfile(!error && data ? (data as CustomerProfile) : null)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  return { profile, loading }
}
