'use client'

import { User, ShieldCheck, LogOut, Info } from 'lucide-react'
import type { CurrentUser } from './types'

interface SettingsViewProps {
  currentUser: CurrentUser
  email?: string
  onSignOut: () => void
}

export function SettingsView({ currentUser, email, onSignOut }: SettingsViewProps) {
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#33bbcf]">
            <User className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-white">{currentUser.name}</p>
            {email && <p className="text-xs text-slate-400">{email}</p>}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-300">
          <ShieldCheck className="h-4 w-4 text-[#33bbcf]" />
          Role: <span className="font-semibold capitalize text-white">{currentUser.role}</span>
        </div>

        <button
          onClick={onSignOut}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/20"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-slate-900/30 p-4 text-xs text-slate-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#33bbcf]" />
        <p>
          Transfer pricing moved to its own <strong className="text-slate-300">Taximeter</strong>{' '}
          screen, where you can see what each change does to a real fare before saving it.
          <br />
          <br />
          System and API configuration (Supabase, environment variables, deployment settings) is
          managed outside this dashboard in the Vercel and Supabase project dashboards, for security.
        </p>
      </div>
    </div>
  )
}
