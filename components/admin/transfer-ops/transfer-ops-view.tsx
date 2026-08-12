'use client'

import { useMemo, useState } from 'react'
import { Table2, Calendar as CalendarIcon, Map as MapIcon, Radio, RadioOff } from 'lucide-react'
import type { Booking, DriverOption, CurrentUser } from '@/components/admin/types'
import type { SyncStatus } from '@/services/bookings.service'
import { TableMatrix } from './table-matrix'
import { CalendarView } from './calendar-view'
import { MapView } from './map-view'
import { BulkActionBar } from './bulk-action-bar'
import { BookingDrawer } from './booking-drawer'

interface TransferOpsViewProps {
  bookings: Booking[]
  loading: boolean
  currentUser: CurrentUser
  driverOptions: DriverOption[]
  searchTerm: string
  filterStatus: string
  onFilterStatusChange: (status: string) => void
  syncStatus: SyncStatus
  updateStatus: (id: string, status: 'confirmed' | 'cancelled' | 'pending') => void
  updatePaymentStatus: (id: string, status: 'paid' | 'pending' | 'refunded') => void
  assignDriver: (id: string, driverName: string | null) => void
}

type View = 'table' | 'calendar' | 'map'
type QuickFilter = 'all' | 'unassigned' | 'pending_approval'

const syncBadge: Record<SyncStatus, { label: string; className: string; Icon: typeof Radio }> = {
  live: { label: 'Live Sync Active', className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', Icon: Radio },
  connecting: { label: 'Connecting…', className: 'border-amber-400/30 bg-amber-400/10 text-amber-300', Icon: Radio },
  paused: { label: 'Sync Paused', className: 'border-rose-400/30 bg-rose-400/10 text-rose-300', Icon: RadioOff },
}

export function TransferOpsView({
  bookings,
  loading,
  currentUser,
  driverOptions,
  searchTerm,
  filterStatus,
  onFilterStatusChange,
  syncStatus,
  updateStatus,
  updatePaymentStatus,
  assignDriver,
}: TransferOpsViewProps) {
  const [view, setView] = useState<View>('table')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerBooking, setDrawerBooking] = useState<Booking | null>(null)

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (currentUser.role === 'driver') {
        const isAssignedToMe = b.assigned_driver === currentUser.name
        const isUnassigned = !b.assigned_driver
        if (!isAssignedToMe && !isUnassigned) return false
      }

      const matchesSearch =
        b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.item_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.notes?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === 'all' || b.status === filterStatus

      const matchesQuickFilter =
        quickFilter === 'all' ||
        (quickFilter === 'unassigned' && !b.assigned_driver) ||
        (quickFilter === 'pending_approval' && b.status === 'pending')

      return matchesSearch && matchesStatus && matchesQuickFilter
    })
  }, [bookings, currentUser, searchTerm, filterStatus, quickFilter])

  const badge = syncBadge[syncStatus]

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      filteredBookings.every((b) => prev.has(b.id)) ? new Set() : new Set(filteredBookings.map((b) => b.id)),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}
          >
            <badge.Icon className={`h-3 w-3 ${syncStatus === 'live' ? 'animate-pulse' : ''}`} />
            {badge.label}
          </span>

          <span className="text-xs text-slate-400">
            Showing {filteredBookings.length} of {bookings.length} entries
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/80 p-1">
          {([
            { id: 'table', label: 'Table', Icon: Table2 },
            { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
            { id: 'map', label: 'Map', Icon: MapIcon },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                view === id ? 'bg-aurora font-semibold text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-x-auto rounded-xl border border-white/10 bg-slate-900/80 p-1">
          {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => onFilterStatusChange(status)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                filterStatus === status ? 'bg-aurora font-semibold text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex overflow-x-auto rounded-xl border border-white/10 bg-slate-900/80 p-1">
          {([
            { id: 'all', label: 'All Transfers' },
            { id: 'unassigned', label: 'Unassigned' },
            { id: 'pending_approval', label: 'Pending Approval' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setQuickFilter(id)}
              className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                quickFilter === id ? 'bg-aurora/20 text-aurora' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {currentUser.role === 'admin' && (
        <BulkActionBar
          selectedIds={selectedIds}
          bookings={filteredBookings}
          driverOptions={driverOptions}
          updateStatus={updateStatus}
          assignDriver={assignDriver}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-md">
        <div className="p-4">
          {view === 'table' && (
            <TableMatrix
              bookings={filteredBookings}
              allBookings={bookings}
              loading={loading}
              currentUser={currentUser}
              driverOptions={driverOptions}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              updateStatus={updateStatus}
              updatePaymentStatus={updatePaymentStatus}
              assignDriver={assignDriver}
              onRowClick={setDrawerBooking}
            />
          )}
          {view === 'calendar' && <CalendarView bookings={filteredBookings} onSelectBooking={setDrawerBooking} />}
          {view === 'map' && <MapView bookings={filteredBookings} onSelectBooking={setDrawerBooking} />}
        </div>
      </div>

      <BookingDrawer
        booking={drawerBooking}
        currentUser={currentUser}
        onClose={() => setDrawerBooking(null)}
        updateStatus={updateStatus}
        updatePaymentStatus={updatePaymentStatus}
      />
    </div>
  )
}
