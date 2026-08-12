'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, RefreshCw, PlusCircle, LayoutDashboard, Map, Car, ArrowRight } from 'lucide-react'
import type { Booking } from '@/components/admin/types'
import type { AdminView } from '@/components/admin/sidebar'
import { insertBooking } from '@/services/bookings.service'

interface CommandPaletteProps {
  bookings: Booking[]
  onNavigate: (view: AdminView) => void
  onSearch: (term: string) => void
  onRefresh: () => void
}

export function CommandPalette({ bookings, onNavigate, onSearch, onRefresh }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'search' | 'new-transfer'>('search')
  const [newTransfer, setNewTransfer] = useState({
    customerName: '',
    customerPhone: '',
    pickup: 'Tromsø Airport (TOS)',
    dropoff: '',
    date: '',
    price: '',
  })
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setMode('search')
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  if (!open) return null

  const results = query.trim()
    ? bookings
        .filter(
          (b) =>
            b.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
            b.customer_email?.toLowerCase().includes(query.toLowerCase()) ||
            b.item_title?.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 6)
    : []

  const goToBooking = (booking: Booking) => {
    onNavigate(booking.booking_type === 'transfer' ? 'transfers' : 'tours')
    onSearch(booking.customer_name)
    setOpen(false)
  }

  const handleCreateTransfer = async () => {
    if (!newTransfer.customerName.trim() || !newTransfer.date) return
    setCreating(true)

    await insertBooking({
      customer_name: newTransfer.customerName.trim(),
      customer_email: 'pending@articsafaritour.com',
      customer_phone: newTransfer.customerPhone.trim() || null,
      booking_type: 'transfer',
      item_title: 'VIP Transfer (staff-created)',
      booking_date: newTransfer.date,
      total_price: parseInt(newTransfer.price.replace(/[^0-9]/g, ''), 10) || 0,
      notes: `Pickup: ${newTransfer.pickup} - Dropoff: ${newTransfer.dropoff || 'N/A'}`,
      status: 'confirmed',
    })

    setCreating(false)
    setNewTransfer({ customerName: '', customerPhone: '', pickup: 'Tromsø Airport (TOS)', dropoff: '', date: '', price: '' })
    onNavigate('transfers')
    setOpen(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="fixed left-1/2 top-24 z-[61] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        {mode === 'search' ? (
          <>
            <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bookings, or run a command…"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">esc</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim() ? (
                results.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-slate-500">No bookings match "{query}"</p>
                ) : (
                  results.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => goToBooking(b)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/5"
                    >
                      <span className="text-white">
                        {b.customer_name} <span className="text-slate-500">· {b.item_title}</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                  ))
                )
              ) : (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setMode('new-transfer')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                  >
                    <PlusCircle className="h-4 w-4 text-aurora" />
                    New Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh()
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                  >
                    <RefreshCw className="h-4 w-4 text-aurora" />
                    Refresh Data
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('overview')
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                  >
                    <LayoutDashboard className="h-4 w-4 text-aurora" />
                    Go to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('transfers')
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                  >
                    <Map className="h-4 w-4 text-aurora" />
                    Go to Transfers
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('drivers')
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                  >
                    <Car className="h-4 w-4 text-aurora" />
                    Go to Drivers
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">New Transfer</p>
            <input
              autoFocus
              placeholder="Customer name"
              value={newTransfer.customerName}
              onChange={(e) => setNewTransfer((v) => ({ ...v, customerName: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
            />
            <input
              placeholder="Phone"
              value={newTransfer.customerPhone}
              onChange={(e) => setNewTransfer((v) => ({ ...v, customerPhone: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newTransfer.pickup}
                onChange={(e) => setNewTransfer((v) => ({ ...v, pickup: e.target.value }))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              >
                <option className="bg-slate-900">Tromsø Airport (TOS)</option>
                <option className="bg-slate-900">Tromsø City Center</option>
              </select>
              <input
                type="date"
                value={newTransfer.date}
                onChange={(e) => setNewTransfer((v) => ({ ...v, date: e.target.value }))}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
              />
            </div>
            <input
              placeholder="Dropoff destination"
              value={newTransfer.dropoff}
              onChange={(e) => setNewTransfer((v) => ({ ...v, dropoff: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
            />
            <input
              placeholder="Price (kr)"
              value={newTransfer.price}
              onChange={(e) => setNewTransfer((v) => ({ ...v, price: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-aurora focus:outline-none"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMode('search')}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={handleCreateTransfer}
                className="flex-1 rounded-xl bg-aurora py-2 text-xs font-semibold text-black hover:bg-aurora/90 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Transfer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
