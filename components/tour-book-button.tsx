'use client'

import { useState } from 'react'
import { useSession } from '@/lib/use-session'
import { useCustomerProfile } from '@/lib/use-customer-profile'
import { BookingModal, type BookingModalTour } from '@/components/booking-modal'

interface TourBookButtonProps {
  tour: BookingModalTour
  className?: string
  children: React.ReactNode
}

/**
 * Client-side wrapper so a Server Component tour detail page can still
 * mount the real booking flow -- previously this button just linked to
 * /#tours, dropping the visitor back on the homepage instead of letting
 * them book the tour they were actually looking at.
 */
export function TourBookButton({ tour, className, children }: TourBookButtonProps) {
  const [open, setOpen] = useState(false)
  const { session } = useSession()
  const { profile } = useCustomerProfile(session)
  const isSignedIn = Boolean(profile)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <BookingModal
          tour={tour}
          isSignedIn={isSignedIn}
          prefill={{
            fullName: profile?.full_name ?? '',
            email: profile?.email ?? session?.user?.email ?? '',
            phone: profile?.phone ?? '',
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
