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
  Car
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
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">Artic Safari — Operations</h1>
              <span className="rounded-full bg-aurora/10 border border-aurora/30 px-3 py-0.5 text-xs font-semibold text-aurora uppercase">
                {currentUser.role}: {currentUser.name}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {currentUser.role === 'admin' ? 'Full management & dispatch dashboard' : 'Driver assigned bookings view'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBookings}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setCurrentUser(null)}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, email, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
            />
          </div>
          <div className="flex rounded-xl border border-white/10 bg-slate-900/60 p-1">
            {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
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

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-slate-400">
            No bookings found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col border border-white/10 rounded-2xl bg-slate-900/40 p-5 gap-4 md:flex-row md:items-center md:justify-between hover:border-white/20 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-aurora/20 text-aurora'
                          : booking.status === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {booking.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                      {booking.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                      {booking.status === 'pending' && <Clock3 className="h-3 w-3" />}
                      {booking.status}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white/5 border border-white/10 text-slate-300">
                      <Car className="h-3 w-3 text-aurora" />
                      {booking.assigned_driver ? `Assigned to: ${booking.assigned_driver}` : 'Unassigned'}
                    </span>

                    <h3 className="text-lg font-semibold text-white">{booking.item_title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      {booking.customer_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      {booking.customer_email}
                    </span>
                    {booking.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        {booking.customer_phone}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {booking.booking_date}
                    </span>
                    {booking.notes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {booking.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between md:justify-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                  <div className="flex items-center gap-2">
                    {currentUser.role === 'admin' ? (
                      <select
                        value={booking.assigned_driver || ''}
                        onChange={(e) => assignDriver(booking.id, e.target.value || null)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-aurora focus:outline-none"
                      >
                        <option value="" className="bg-slate-900">Assign Driver...</option>
                        {getSystemUsers().filter(u => u.role === 'driver').map(d => (
                          <option key={d.pin} value={d.name} className="bg-slate-900">{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      !booking.assigned_driver && (
                        <button
                          onClick={() => assignDriver(booking.id, currentUser.name)}
                          className="rounded-xl bg-aurora/10 border border-aurora/30 px-3 py-2 text-xs font-semibold text-aurora hover:bg-aurora hover:text-black transition-all"
                        >
                          Take Tour
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.status !== 'confirmed' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'confirmed')}
                        className="rounded-xl bg-aurora/20 border border-aurora/30 px-3 py-2 text-xs font-semibold text-aurora hover:bg-aurora hover:text-black transition-all"
                      >
                        Confirm
                      </button>
                    )}
                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        className="rounded-xl bg-rose-500/20 border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}