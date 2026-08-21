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
import { ToursView } from '@/components/admin/tours-view'
import { PartnersView } from '@/components/admin/partners-view'
import { AddonsView } from '@/components/admin/addons-view'
import { CharterVehiclesView } from '@/components/admin/charter-vehicles-view'
import { TaximeterView } from '@/components/admin/taximeter-view'
import type { BookingStatus, PaymentStatus } from '@/lib/booking-lifecycle'
import { ContentView } from '@/components/admin/content-view'
import { AccountingView } from '@/components/admin/accounting-view'
import { TonightView } from '@/components/admin/tonight-view'
import { SettingsView } from '@/components/admin/settings-view'
import { TransferOpsView } from '@/components/admin/transfer-ops/transfer-ops-view'
import { CommandPalette } from '@/components/admin/transfer-ops/command-palette'
import type { Booking, DriverOption, AdminNotification } from '@/components/admin/types'
import { Mail, Lock, ShieldAlert } from 'lucide-react'

const viewTitles: Record<AdminView, string> = {
  overview: 'Dashboard',
  tours: 'Tours & Activities',
  transfers: 'Transfers',
  'tour-catalog': 'Tour Catalog',
  customers: 'Customers & Users',
  drivers: 'Drivers & Guides',
  finance: 'Finance & Payments',
  reviews: 'Reviews',
  gallery: 'Gallery',
  partners: 'Partners',
  addons: 'Add-ons',
  'charter-vehicles': 'Charter Vehicles',
  taximeter: 'Taximeter',
  content: 'Site Text',
  accounting: 'Accounting',
  tonight: 'Tonight',
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
  const [notifications, setNotifications] = useState<AdminNotification[]>([])

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
      if (payload.eventType === 'INSERT') {
        const row = payload.new as unknown as Booking

        setBookings((prev) => {
          if (prev.some((b) => b.id === row.id)) return prev
          return [
            { ...row, payment_status: row.payment_status || (row.status === 'confirmed' ? 'paid' : 'pending') },
            ...prev,
          ]
        })

        // Real notification, generated from the same live event -- not a
        // decorative/mock feed.
        setNotifications((prev) => {
          if (prev.some((n) => n.id === row.id)) return prev
          return [
            {
              id: row.id,
              message: `New ${row.booking_type} booking — ${row.item_title} for ${row.customer_name}`,
              createdAt: row.created_at || new Date().toISOString(),
              read: false,
              bookingType: row.booking_type,
            },
            ...prev,
          ].slice(0, 20)
        })
        return
      }

      if (payload.eventType === 'UPDATE') {
        const row = payload.new as unknown as Booking
        setBookings((prev) => prev.map((b) => (b.id === row.id ? { ...b, ...row } : b)))
        return
      }

      if (payload.eventType === 'DELETE') {
        const row = payload.old as Partial<Booking>
        setBookings((prev) => prev.filter((b) => b.id !== row.id))
      }
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

  const updateStatus = async (id: string, newStatus: BookingStatus) => {
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

  const updatePaymentStatus = async (id: string, newPaymentStatus: PaymentStatus) => {
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

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleNotificationClick = (notification: AdminNotification) => {
    markNotificationRead(notification.id)
    setActiveView(notification.bookingType === 'transfer' ? 'transfers' : 'tours')
  }

  if (sessionLoading || (session && profileLoading)) {
    return (
      <main className="min-h-screen bg-[#00040f] text-slate-100 flex items-center justify-center p-4">
        <p className="text-sm text-slate-400">Loading...</p>
      </main>
    )
  }

  if (session && !profile) {
    return (
      <main className="min-h-screen bg-[#00040f] text-slate-100 flex items-center justify-center p-4">
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
      <main className="min-h-screen bg-[#00040f] text-slate-100 flex items-center justify-center p-4">
        <SocialRail />
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#33bbcf]">
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
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
              />
            </div>

            {loginError && (
              <p className="text-center text-xs font-medium text-rose-400">Invalid email or password</p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-xl bg-[#33bbcf] py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#33bbcf]/90 disabled:opacity-50"
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
    <main className="min-h-screen bg-[#00040f] text-slate-100">
      <SocialRail />
      <CommandPalette
        bookings={bookings}
        onNavigate={setActiveView}
        onSearch={setSearchTerm}
        onRefresh={fetchBookings}
      />
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
          notifications={notifications}
          onMarkNotificationRead={markNotificationRead}
          onMarkAllNotificationsRead={markAllNotificationsRead}
          onNotificationClick={handleNotificationClick}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8">
          {activeView === 'overview' && <OverviewView bookings={bookings} />}
          {activeView === 'tonight' && <TonightView bookings={bookings} />}

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
              isAdmin={currentUser.role === 'admin'}
              assignDriver={assignDriver}
            />
          )}

          {activeView === 'transfers' && (
            <TransferOpsView
              bookings={transferBookings}
              loading={loading}
              currentUser={currentUser}
              driverOptions={driverOptions}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              syncStatus={syncStatus}
              updateStatus={updateStatus}
              updatePaymentStatus={updatePaymentStatus}
              isAdmin={currentUser.role === 'admin'}
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
            <FinanceView bookings={bookings} updatePaymentStatus={updatePaymentStatus} />
          )}

          {activeView === 'reviews' && currentUser.role === 'admin' && <ReviewsView />}

          {activeView === 'gallery' && currentUser.role === 'admin' && <GalleryView />}

          {activeView === 'tour-catalog' && currentUser.role === 'admin' && <ToursView />}

          {activeView === 'partners' && currentUser.role === 'admin' && <PartnersView />}

          {activeView === 'addons' && currentUser.role === 'admin' && <AddonsView />}
          {activeView === 'charter-vehicles' && currentUser.role === 'admin' && <CharterVehiclesView />}
          {activeView === 'taximeter' && currentUser.role === 'admin' && <TaximeterView />}
          {activeView === 'content' && currentUser.role === 'admin' && <ContentView />}
          {activeView === 'accounting' && currentUser.role === 'admin' && <AccountingView />}

          {activeView === 'settings' && (
            <SettingsView currentUser={currentUser} email={session?.user?.email} onSignOut={handleSignOut} />
          )}
        </div>
      </div>
    </main>
  )
}
