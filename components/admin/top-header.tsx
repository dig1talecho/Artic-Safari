'use client'

import { useState } from 'react'
import { Search, Bell, LogOut, ChevronDown, CalendarPlus, CheckCheck } from 'lucide-react'
import { MobileSidebarToggle } from './sidebar'
import type { AdminNotification } from './types'

interface TopHeaderProps {
  title: string
  searchTerm: string
  onSearchChange: (value: string) => void
  notifications: AdminNotification[]
  onMarkNotificationRead: (id: string) => void
  onMarkAllNotificationsRead: () => void
  onNotificationClick: (notification: AdminNotification) => void
  currentUser: { name: string; role: 'admin' | 'driver' }
  onSignOut: () => void
  onOpenMobileMenu: () => void
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function TopHeader({
  title,
  searchTerm,
  onSearchChange,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNotificationClick,
  currentUser,
  onSignOut,
  onOpenMobileMenu,
}: TopHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/10 bg-[#00040f]/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <MobileSidebarToggle onClick={onOpenMobileMenu} />

      <h1 className="hidden text-lg font-semibold text-white sm:block">{title}</h1>

      <div className="relative ml-auto w-full max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search bookings, customers..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
        />
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setNotifOpen((v) => !v)
            setMenuOpen(false)
          }}
          aria-label={`Notifications: ${unreadCount} unread`}
          aria-expanded={notifOpen}
          className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] w-80 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a1f] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllNotificationsRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#33bbcf] hover:text-[#5ce1e6]"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <CalendarPlus className="h-5 w-5 text-slate-500" />
                  <p className="text-xs text-slate-400">
                    No notifications yet. New bookings will appear here the moment they come in.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onNotificationClick(n)
                          setNotifOpen(false)
                        }}
                        onMouseEnter={() => !n.read && onMarkNotificationRead(n.id)}
                        className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      >
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-[#33bbcf]'}`}
                        />
                        <span className="min-w-0">
                          <span className="block text-xs leading-relaxed text-white/90">{n.message}</span>
                          <span className="mt-0.5 block text-[10px] text-slate-500">{timeAgo(n.createdAt)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setMenuOpen((v) => !v)
            setNotifOpen(false)
          }}
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2.5 hover:bg-white/10"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#33bbcf]/10 text-xs font-semibold text-[#33bbcf]">
            {currentUser.name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-medium leading-tight text-white">{currentUser.name}</span>
            <span className="block text-[10px] capitalize leading-tight text-slate-400">{currentUser.role}</span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a1f] shadow-2xl shadow-black/50">
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
