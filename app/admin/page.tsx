'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  RefreshCw,
  Search,
  Lock,
  KeyRound,
  Car,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  Activity,
  Layers
} from 'lucide-react'

interface Booking {
  id: string
  created_at: string
  customer_name: string
  customer_email: string
  customer_phone: string
  booking_type: string
  item_title: string
  booking_date: string
  total_price: number
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled'
  assigned_driver: string | null
}

const getSystemUsers = () => [
  { pin: process.env.NEXT_PUBLIC_ADMIN_PIN || 'admin.artic#2026', name: 'General Admin', role: 'admin' },
  { pin: process.env.NEXT_PUBLIC_DRIVER_1_PIN || 'johan-tour!84', name: process.env.NEXT_PUBLIC_DRIVER_1_NAME || 'Driver Johan', role: 'driver' },
  { pin: process.env.NEXT_PUBLIC_DRIVER_2_PIN || 'astrid_safari#99', name: process.env.NEXT_PUBLIC_DRIVER_2_NAME || 'Driver Astrid', role: 'driver' },
]

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const users = getSystemUsers()
    const matchedUser = users.find((u) => u.pin === pinInput.trim())
    if (matchedUser) {
      setCurrentUser({ name: matchedUser.name, role: matchedUser.role })
      setPinError(false)
      fetchBookings()
    } else {
      setPinError(true)
      setPinInput('')
    }
  }

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: 'confirmed' | 'cancelled' | 'pending') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating status:', error)
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      )
    }
  }

  const assignDriver = async (id: string, driverName: string | null) => {
    const { error } = await supabase
      .from('bookings')
      .update({ assigned_driver: driverName })
      .eq('id', id)

    if (error) {
      console.error('Error assigning driver:', error)
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, assigned_driver: driverName } : b))
      )
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (currentUser?.role === 'driver') {
      const isAssignedToMe = b.assigned_driver === currentUser.name
      const isUnassigned = !b.assigned_driver
      if (!isAssignedToMe && !isUnassigned) return false
    }

    const matchesSearch =
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.item_title?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || b.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Analiz ve İstatistik Hesaplamaları
  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)

  const confirmedRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const unassignedCount = bookings.filter(b => !b.assigned_driver && b.status !== 'cancelled').length

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-aurora">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Artic Safari Operations</h1>
            <p className="mt-1 text-xs text-slate-400">Enter your secure access password</p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="Enter password..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>

            {pinError && (
              <p className="text-center text-xs font-medium text-rose-400">Incorrect password</p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-aurora py-2.5 text-sm font-semibold text-black transition-all hover:bg-aurora/90"
            >
              Sign In
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Üst Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Artic Safari — Live Control</h1>
              <span className="rounded-full bg-aurora/10 border border-aurora/30 px-3 py-1 text-xs font-semibold text-aurora uppercase tracking-wider">
                {currentUser.role}: {currentUser.name}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {currentUser.role === 'admin' ? 'Real-time financial tracking, tour dispatch, and operational analytics' : 'Driver active tour management view'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBookings}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </button>
            <button
              onClick={() => setCurrentUser(null)}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Canlı Analiz ve Finans Kartları (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Volume (Gross)</span>
              <DollarSign className="h-5 w-5 text-aurora" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{totalRevenue.toLocaleString()} NOK</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Includes pending & confirmed</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-aurora/50 to-transparent" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Secured Revenue</span>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">{confirmedRevenue.toLocaleString()} NOK</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Confirmed bookings only</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/50 to-transparent" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Approvals</span>
              <Clock3 className="h-5 w-5 text-amber-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
              <span className="text-xs text-slate-400">requests</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Requires status confirmation</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400/50 to-transparent" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Unassigned Tours</span>
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-400">{unassignedCount}</span>
              <span className="text-xs text-slate-400">tours</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Waiting for driver dispatch</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400/50 to-transparent" />
          </div>
        </div>

        {/* Filtre ve Arama Alanı */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/30 p-4 rounded-2xl border border-white/10">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, email, package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
            />
          </div>
          <div className="flex rounded-xl border border-white/10 bg-slate-900/80 p-1 w-full sm:w-auto overflow-x-auto">
            {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-aurora text-black font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Canlı Takip Tablosu (Live Operations Table) */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-aurora animate-pulse" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Live Booking Feed & Dispatch</h2>
            </div>
            <span className="text-xs text-slate-400">Showing {filteredBookings.length} entries</span>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading live data stream...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-20 text-slate-400 border-dashed border-white/10">
              No matching tour records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Status / Package</th>
                    <th className="py-3.5 px-6">Customer Details</th>
                    <th className="py-3.5 px-6">Schedule</th>
                    <th className="py-3.5 px-6">Assigned Driver</th>
                    <th className="py-3.5 px-6 text-right">Price (NOK)</th>
                    <th className="py-3.5 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors group">
                      
                      {/* Durum ve Tur Adı */}
                      <td className="py-4 px-6 space-y-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            booking.status === 'confirmed'
                              ? 'bg-aurora/20 text-aurora border border-aurora/30'
                              : booking.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {booking.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                          {booking.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                          {booking.status === 'pending' && <Clock3 className="h-3 w-3" />}
                          {booking.status}
                        </span>
                        <div className="font-semibold text-white group-hover:text-aurora transition-colors">
                          {booking.item_title}
                        </div>
                      </td>

                      {/* Müşteri Bilgileri */}
                      <td className="py-4 px-6 space-y-1 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          {booking.customer_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          {booking.customer_email}
                        </div>
                        {booking.customer_phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="h-3.5 w-3.5 text-slate-500" />
                            {booking.customer_phone}
                          </div>
                        )}
                      </td>

                      {/* Tarih ve Notlar */}
                      <td className="py-4 px-6 space-y-1 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Calendar className="h-3.5 w-3.5 text-aurora" />
                          {booking.booking_date}
                        </div>
                        {booking.notes && (
                          <div className="flex items-center gap-1.5 text-slate-500 italic max-w-xs truncate">
                            <Clock className="h-3.5 w-3.5" />
                            {booking.notes}
                          </div>
                        )}
                      </td>

                      {/* Şoför Atama */}
                      <td className="py-4 px-6">
                        {currentUser.role === 'admin' ? (
                          <select
                            value={booking.assigned_driver || ''}
                            onChange={(e) => assignDriver(booking.id, e.target.value || null)}
                            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-aurora focus:outline-none"
                          >
                            <option value="">Unassigned</option>
                            {getSystemUsers().filter(u => u.role === 'driver').map(d => (
                              <option key={d.pin} value={d.name}>{d.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-white/5 border border-white/10 text-slate-300">
                              <Car className="h-3 w-3 text-aurora" />
                              {booking.assigned_driver || 'Unassigned'}
                            </span>
                            {!booking.assigned_driver && (
                              <button
                                onClick={() => assignDriver(booking.id, currentUser.name)}
                                className="rounded-xl bg-aurora/10 border border-aurora/30 px-3 py-1 text-xs font-semibold text-aurora hover:bg-aurora hover:text-black transition-all"
                              >
                                Take Tour
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Tutar */}
                      <td className="py-4 px-6 text-right font-mono font-semibold text-white">
                        {Number(booking.total_price || 0).toLocaleString()} <span className="text-xs text-slate-400">NOK</span>
                      </td>

                      {/* İşlemler (Onayla / İptal Et) */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {booking.status !== 'confirmed' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              title="Confirm Booking"
                              className="rounded-xl bg-aurora/10 border border-aurora/30 p-2 text-aurora hover:bg-aurora hover:text-black transition-all"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              title="Cancel Booking"
                              className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-2 text-rose-400 hover:bg-rose-500/20 transition-all"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}