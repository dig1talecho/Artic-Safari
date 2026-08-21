'use client'

import Image from 'next/image'
import {
  LayoutDashboard,
  Map,
  Car,
  Users,
  UserCog,
  Wallet,
  Star,
  Images,
  Settings,
  Menu,
  X,
  BookImage,
  Building2,
  Tag,
  Truck,
  Gauge,
  PencilLine,
  FileSpreadsheet,
  Moon,
} from 'lucide-react'

export type AdminView =
  | 'overview'
  | 'tonight'
  | 'tours'
  | 'transfers'
  | 'tour-catalog'
  | 'customers'
  | 'drivers'
  | 'finance'
  | 'reviews'
  | 'gallery'
  | 'partners'
  | 'addons'
  | 'charter-vehicles'
  | 'taximeter'
  | 'content'
  | 'accounting'
  | 'settings'

interface NavItem {
  id: AdminView
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tonight', label: 'Tonight', icon: Moon },
  { id: 'tours', label: 'Tours & Activities', icon: Map },
  { id: 'transfers', label: 'Transfers', icon: Car },
  { id: 'tour-catalog', label: 'Tour Catalog', icon: BookImage, adminOnly: true },
  { id: 'customers', label: 'Customers & Users', icon: Users, adminOnly: true },
  { id: 'drivers', label: 'Drivers & Guides', icon: UserCog, adminOnly: true },
  { id: 'finance', label: 'Finance & Payments', icon: Wallet, adminOnly: true },
  { id: 'reviews', label: 'Reviews', icon: Star, adminOnly: true },
  { id: 'gallery', label: 'Gallery', icon: Images, adminOnly: true },
  { id: 'partners', label: 'Partners', icon: Building2, adminOnly: true },
  { id: 'addons', label: 'Add-ons', icon: Tag, adminOnly: true },
  { id: 'charter-vehicles', label: 'Charter Vehicles', icon: Truck, adminOnly: true },
  { id: 'taximeter', label: 'Taximeter', icon: Gauge, adminOnly: true },
  { id: 'content', label: 'Site Text', icon: PencilLine, adminOnly: true },
  { id: 'accounting', label: 'Accounting', icon: FileSpreadsheet, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  activeView: AdminView
  onNavigate: (view: AdminView) => void
  role: 'admin' | 'driver'
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ activeView, onNavigate, role, mobileOpen, onCloseMobile }: SidebarProps) {
  const items = navItems.filter((item) => !item.adminOnly || role === 'admin')

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#00040f] transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2.5 border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Artic Safari"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-contain"
            />
            <div>
              <p className="text-sm font-semibold leading-tight text-white">Artic Safari</p>
              <p className="text-[11px] leading-tight text-slate-500">Operations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id)
                  onCloseMobile()
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#33bbcf]/10 text-[#33bbcf]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export function MobileSidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 md:hidden"
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}
