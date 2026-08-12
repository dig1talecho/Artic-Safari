'use client'

import { useEffect, useState } from 'react'
import { signInWithPassword, signOut } from '@/services/auth.service'
import { listDrivers } from '@/services/staff.service'
import {
  listBookings,
  updateBookingStatus,
  updateBookingPaymentStatus,
  assignBookingDriver,
  subscribeToBookings,
  type SyncStatus,
} from '@/services/bookings.service'
import { logBookingChange } from '@/services/audit-log.service'
import { useSession } from '@/lib/use-session'
import { useStaffProfile } from '@/lib/use-staff-profile'
import { SocialRail } from '@/components/social-rail'
import { Sidebar, type AdminView } from '@/components/admin/sidebar'
import { TopHeader } from '@/components/admin/top-header'
import { BookingTable } from '@/components/admin/booking-table'
import { OverviewView } from '@/components/admin/overview-view'
import { CustomersView } from '@/components/admin/customers-view'
import { DriversView } from '@/components/admin/drivers-view'
import { FinanceView } from '@/components/admin/finance-view'
import { ReviewsView } from '@/components/admin/reviews-view'
import { GalleryView } from '@/components/admin/gallery-view'
import { SettingsView } from '@/components/admin/settings-view'
import type { Booking, DriverOption } from '@/components/admin/types'
import { Mail, Lock, ShieldAlert } from 'lucide-react'

const viewTitles: Record<AdminView, string> = {
  overview: 'Dashboard',
  tours: 'Tours & Activities',
  transfers: 'Transfers',
  customers: 'Customers & Users',
  drivers: 'Drivers & Guides',
  finance: 'Finance & Payments',
  reviews: 'Reviews',
  gallery: 'Gallery',
  settings: 'Settings',
}

export default function AdminDashboard() {
  const { session, loading: sessionLoading } = useSession()
  const { profile, loading: profileLoading } = useStaffProfile(session)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [driverOptions, setDriverOptions] = useState<DriverOption[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting')

  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentUser = profile ? { name: profile.display_name, role: profile.role } : null

  useEffect(() => {
    if (currentUser) fetchBookings()
  }, [currentUser?.name, currentUser?.role])

  useEffect(() => {
    listDrivers().then(({ data, error }) => {
      if (!error) setDriverOptions(data ?? [])
    })
  }, [currentUser?.role])

  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToBookings((payload) => {
      setBookings((prev) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as unknown as Booking
          if (prev.some((b) => b.id === row.id)) return prev
          return [
            { ...row, payment_status: row.payment_status || (row.status === 'confirmed' ? 'paid' : 'pending') },
            ...prev,
          ]
        }
        if (payload.eventType === 'UPDATE') {
          const row = payload.new as unknown as Booking
          return prev.map((b) => (b.id === row.id ? { ...b, ...row } : b))
        }
        if (payload.eventType === 'DELETE') {
          const row = payload.old as Partial<Booking>
          return prev.filter((b) => b.id !== row.id)
        }
        return prev
      })
    }, setSyncStatus)

    return unsubscribe
  }, [currentUser?.name, currentUser?.role])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError(false)

    const { error } = await signInWithPassword(loginEmail.trim(), loginPassword)

    setLoggingIn(false)
    if (error) {
      setLoginError(true)
      setLoginPassword('')
    }
  }

  const handleSignOut = () => {
    signOut()
    setBookings([])
  }

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await listBookings()

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      // Veritabanında payment_status yoksa varsayılan olarak 'paid' ya da 'pending' atayalım
      const formattedData = (data || []).map((b) => ({
        ...b,
        payment_status: b.payment_status || (b.status === 'confirmed' ? 'paid' : 'pending'),
      }))
      setBookings(formattedData)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled' | 'pending') => {
    const previous = bookings.find((b) => b.id === id)?.status
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)))

    const { error } = await updateBookingStatus(id, newStatus)

    if (error) {
      console.error('Error updating status:', error)
      if (previous) setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: previous } : b)))
    } else if (currentUser) {
      logBookingChange({
        booking_id: id,
        changed_by: currentUser.name,
        change_type: 'status_changed',
        old_value: previous ?? null,
        new_value: newStatus,
      })
    }
  }

  const updatePaymentStatus = async (id: string, newPaymentStatus: 'paid' | 'pending' | 'refunded') => {
    const previous = bookings.find((b) => b.id === id)?.payment_status
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, payment_status: newPaymentStatus } : b)),
    )

    const { error } = await updateBookingPaymentStatus(id, newPaymentStatus)

    if (error) {
      console.error('Error updating payment status:', error)
      if (previous) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, payment_status: previous } : b)))
      }
    } else if (currentUser) {
      logBookingChange({
        booking_id: id,
        changed_by: currentUser.name,
        change_type: 'payment_status_changed',
        old_value: previous ?? null,
        new_value: newPaymentStatus,
      })
    }
  }

  const assignDriver = async (id: string, driverName: string | null) => {
    const previous = bookings.find((b) => b.id === id)?.assigned_driver ?? null
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, assigned_driver: driverName } : b)))

    const { error } = await assignBookingDriver(id, driverName)

    if (error) {
      console.error('Error assigning driver:', error)
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, assigned_driver: previous } : b)))
    } else if (currentUser) {
      logBookingChange({
        booking_id: id,
        changed_by: currentUser.name,
        change_type: 'driver_assigned',
        old_value: previous,
        new_value: driverName,
      })
    }
  }

  const pendingCount = bookings.filter((b) => b.status === 'pending').length

  if (sessionLoading || (session && profileLoading)) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <p className="text-sm text-slate-400">Loading...</p>
      </main>
    )
  }

  if (session && !profile) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <SocialRail />
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Not Authorized</h1>
          <p className="mt-1 text-xs text-slate-400">
            This account has no operations access. Contact an administrator.
          </p>
          <button
            onClick={handleSignOut}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium hover:bg-white/10"
          >
            Sign Out
          </button>
        </div>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <SocialRail />
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-aurora">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Artic Safari Operations</h1>
            <p className="mt-1 text-xs text-slate-400">Sign in with your staff account</p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="you@articsafaritour.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>

            {loginError && (
              <p className="text-center text-xs font-medium text-rose-400">Invalid email or password</p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-xl bg-aurora py-2.5 text-sm font-semibold text-black transition-all hover:bg-aurora/90 disabled:opacity-50"
            >
              {loggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  const tourBookings = bookings.filter((b) => b.booking_type === 'tour')
  const transferBookings = bookings.filter((b) => b.booking_type === 'transfer')

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SocialRail />
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        role={currentUser.role}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="md:pl-64">
        <TopHeader
          title={viewTitles[activeView]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          pendingCount={pendingCount}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          {activeView === 'overview' && <OverviewView bookings={bookings} />}

          {activeView === 'tours' && (
            <BookingTable
              title="Tour Bookings"
              bookings={tourBookings}
              loading={loading}
              currentUser={currentUser}
              driverOptions={driverOptions}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              updateStatus={updateStatus}
              updatePaymentStatus={updatePaymentStatus}
              assignDriver={assignDriver}
            />
          )}

          {activeView === 'transfers' && (
            <BookingTable
              title="Live Booking Feed, Payment & Location Matrix"
              bookings={transferBookings}
              loading={loading}
              currentUser={currentUser}
              driverOptions={driverOptions}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              updateStatus={updateStatus}
              updatePaymentStatus={updatePaymentStatus}
              assignDriver={assignDriver}
            />
          )}

          {activeView === 'customers' && currentUser.role === 'admin' && (
            <CustomersView bookings={bookings} />
          )}

          {activeView === 'drivers' && currentUser.role === 'admin' && (
            <DriversView driverOptions={driverOptions} bookings={bookings} />
          )}

          {activeView === 'finance' && currentUser.role === 'admin' && (
            <FinanceView bookings={bookings} />
          )}

          {activeView === 'reviews' && currentUser.role === 'admin' && <ReviewsView />}

          {activeView === 'gallery' && currentUser.role === 'admin' && <GalleryView />}

          {activeView === 'settings' && (
            <SettingsView currentUser={currentUser} email={session?.user?.email} onSignOut={handleSignOut} />
          )}
        </div>
      </div>
    </main>
  )
}
