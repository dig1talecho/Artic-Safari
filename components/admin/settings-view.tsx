'use client'

import { useEffect, useState } from 'react'
import { User, ShieldCheck, LogOut, Info, Gauge, Save } from 'lucide-react'
import type { CurrentUser } from './types'
import { getPricingRules, updatePricingRules, type PricingRules } from '@/services/pricing.service'

interface SettingsViewProps {
  currentUser: CurrentUser
  email?: string
  onSignOut: () => void
}

function PricingSettings() {
  const [rules, setRules] = useState<PricingRules | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPricingRules().then(({ data, error }) => {
      if (error) setError(error.message)
      else setRules(data)
      setLoading(false)
    })
  }, [])

  const set = <K extends keyof PricingRules>(key: K, value: PricingRules[K]) =>
    setRules((r) => (r ? { ...r, [key]: value } : r))

  const handleSave = async () => {
    if (!rules) return
    setSaving(true)
    setSaved(false)
    const { error } = await updatePricingRules(rules.id, {
      base_fee: rules.base_fee,
      price_per_km: rules.price_per_km,
      night_rate_multiplier: rules.night_rate_multiplier,
      min_price: rules.min_price,
    })
    setSaving(false)
    if (error) setError(error.message)
    else {
      setError(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading) return <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">Loading…</div>

  if (!rules) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">
        {error || 'Pricing rules not found. Run database_schema.sql to create the default row.'}
      </div>
    )
  }

  const field = (
    key: keyof Pick<PricingRules, 'base_fee' | 'price_per_km' | 'night_rate_multiplier' | 'min_price'>,
    label: string,
    hint: string,
  ) => (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <input
        type="number"
        step="0.01"
        value={rules[key]}
        onChange={(e) => set(key, Number(e.target.value) as PricingRules[typeof key])}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
      />
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </div>
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#33bbcf]">
          <Gauge className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="font-semibold text-white">Taximeter Parameters</p>
          <p className="text-xs text-slate-400">Drives the distance-based transfer pricing widget</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('base_fee', 'Base fee (NOK)', 'Flat opening charge added to every trip')}
        {field('price_per_km', 'Price per km (NOK)', 'Charged per kilometre of the route')}
        {field('night_rate_multiplier', 'Night / weekend multiplier', 'e.g. 1.25 = +25% after 22:00 or on weekends')}
        {field('min_price', 'Minimum price (NOK)', 'Price never drops below this, even for short trips')}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 font-mono text-[11px] text-slate-400">
        max(min_price, (base_fee + km × price_per_km) × multiplier)
      </div>

      {error && <p className="mt-3 text-xs font-medium text-rose-400">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-5 flex items-center gap-2 rounded-xl bg-[#33bbcf] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#33bbcf]/90 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save Pricing'}
      </button>
    </div>
  )
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

      {currentUser.role === 'admin' && <PricingSettings />}

      <div className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-slate-900/30 p-4 text-xs text-slate-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#33bbcf]" />
        <p>
          System and API configuration (Supabase, environment variables, deployment settings) is
          managed outside this dashboard in the Vercel and Supabase project dashboards, for security.
        </p>
      </div>
    </div>
  )
}
