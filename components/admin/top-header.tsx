'use client'

import { useState } from 'react'
import { Search, Bell, LogOut, ChevronDown } from 'lucide-react'
import { MobileSidebarToggle } from './sidebar'

interface TopHeaderProps {
  title: string
  searchTerm: string
  onSearchChange: (value: string) => void
  pendingCount: number
  currentUser: { name: string; role: 'admin' | 'driver' }
  onSignOut: () => void
  onOpenMobileMenu: () => void
}

export function TopHeader({
  title,
  searchTerm,
  onSearchChange,
  pendingCount,
  currentUser,
  onSignOut,
  onOpenMobileMenu,
}: TopHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <MobileSidebarToggle onClick={onOpenMobileMenu} />

      <h1 className="hidden text-lg font-semibold text-white sm:block">{title}</h1>

      <div className="relative ml-auto w-full max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search bookings, customers..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white focus:border-aurora focus:outline-none"
        />
      </div>

      <button
        type="button"
        aria-label={`Notifications: ${pendingCount} pending`}
        className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10"
      >
        <Bell className="h-4 w-4" />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {pendingCount}
          </span>
        )}
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2.5 hover:bg-white/10"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-aurora/10 text-xs font-semibold text-aurora">
            {currentUser.name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-medium leading-tight text-white">{currentUser.name}</span>
            <span className="block text-[10px] capitalize leading-tight text-slate-400">{currentUser.role}</span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] w-48 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">
            <div className="border-b border-white/10 px-3.5 py-2.5">
              <p className="text-xs font-medium text-white">{currentUser.name}</p>
              <p className="text-[11px] capitalize text-slate-400">{currentUser.role}</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
