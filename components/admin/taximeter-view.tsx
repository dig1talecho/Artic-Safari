'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Gauge, Save, Plus, Trash2, RotateCcw, CheckCircle2, AlertTriangle, Moon, Sun } from 'lucide-react'
import {
  getPricingRules,
  updatePricingRules,
  calculateTransferFare,
  verifyFareAgainstDatabase,
  type PricingRules,
} from '@/services/pricing.service'
import {
  listFleetClasses,
  updateFleetClass,
  type FleetClass,
} from '@/services/fleet-classes.service'

/**
 * Taximeter control panel.
 *
 * The point of this screen is that you never have to imagine what a number
 * does. Every rate is an input, and the fare table underneath recalculates
 * on each keystroke using the same formula Postgres will apply -- so what
 * you see here is what a guest is quoted, before you save anything.
 *
 * While there are unsaved edits the table also shows the currently live
 * price next to the new one, because "this makes the airport run go from
 * 800 to 450 kr" is the question actually being asked, and reading it off
 * two separate numbers in your head is where mistakes come from.
 */

/** Real Tromsø routes, so the preview means something. Distances are approximate. */
const DEFAULT_ROUTES = [
  { id: 'r1', name: 'Airport → City centre', km: 5, minutes: 12 },
  { id: 'r2', name: 'City → Tromsdalen', km: 4, minutes: 10 },
  { id: 'r3', name: 'City → Ersfjordbotn', km: 25, minutes: 35 },
  { id: 'r4', name: 'Long transfer', km: 45, minutes: 55 },
]

interface Route {
  id: string
  name: string
  km: number
  minutes: number
}

/** Fixed reference moments so day/night columns are stable while typing. */
const DAY_AT = new Date('2026-08-19T12:00:00+02:00') // Wednesday midday, Oslo
const NIGHT_AT = new Date('2026-08-19T02:00:00+02:00') // Wednesday 02:00, Oslo

const kr = (n: number) => `${Math.round(n).toLocaleString('en-US')} kr`

export function TaximeterView() {
  const [savedRules, setSavedRules] = useState<PricingRules | null>(null)
  const [rules, setRules] = useState<PricingRules | null>(null)
  const [savedFleet, setSavedFleet] = useState<FleetClass[]>([])
  const [fleet, setFleet] = useState<FleetClass[]>([])
  const [routes, setRoutes] = useState<Route[]>(DEFAULT_ROUTES)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [check, setCheck] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    Promise.all([getPricingRules(), listFleetClasses()]).then(([r, f]) => {
      if (r.error) setError(r.error.message)
      else if (r.data) {
        setSavedRules(r.data)
        setRules(r.data)
      }
      if (f.error) setError((e) => e ?? f.error.message)
      else if (f.data) {
        setSavedFleet(f.data)
        setFleet(f.data)
      }
      setLoading(false)
    })
  }, [])

  const setRule = <K extends keyof PricingRules>(key: K, value: PricingRules[K]) =>
    setRules((r) => (r ? { ...r, [key]: value } : r))

  const setFleetField = <K extends keyof FleetClass>(id: string, key: K, value: FleetClass[K]) =>
    setFleet((list) => list.map((f) => (f.id === id ? { ...f, [key]: value } : f)))

  const dirty = useMemo(() => {
    if (!rules || !savedRules) return false
    const rulesChanged = (
      ['base_fee', 'price_per_km', 'price_per_minute', 'night_rate_multiplier', 'min_price'] as const
    ).some((k) => Number(rules[k]) !== Number(savedRules[k]))
    const fleetChanged = fleet.some((f) => {
      const s = savedFleet.find((x) => x.id === f.id)
      if (!s) return false
      return (
        s.label !== f.label ||
        s.capacity_hint !== f.capacity_hint ||
        Number(s.multiplier) !== Number(f.multiplier) ||
        s.active !== f.active
      )
    })
    return rulesChanged || fleetChanged
  }, [rules, savedRules, fleet, savedFleet])

  const activeFleet = fleet.filter((f) => f.active)

  const handleSave = async () => {
    if (!rules) return
    setSaving(true)
    setError(null)
    setCheck(null)

    const { error: rulesError } = await updatePricingRules(rules.id, {
      base_fee: Number(rules.base_fee),
      price_per_km: Number(rules.price_per_km),
      price_per_minute: Number(rules.price_per_minute),
      night_rate_multiplier: Number(rules.night_rate_multiplier),
      min_price: Number(rules.min_price),
    })
    if (rulesError) {
      setSaving(false)
      return setError(rulesError.message)
    }

    for (const f of fleet) {
      const s = savedFleet.find((x) => x.id === f.id)
      if (
        s &&
        s.label === f.label &&
        s.capacity_hint === f.capacity_hint &&
        Number(s.multiplier) === Number(f.multiplier) &&
        s.active === f.active
      ) {
        continue
      }
      const { error: fleetError } = await updateFleetClass(f.id, {
        label: f.label,
        capacity_hint: f.capacity_hint,
        multiplier: Number(f.multiplier),
        active: f.active,
      })
      if (fleetError) {
        setSaving(false)
        return setError(`${f.label}: ${fleetError.message}`)
      }
    }

    setSavedRules(rules)
    setSavedFleet(fleet)
    setSaving(false)

    // Ask Postgres for one fare and confirm this screen's arithmetic still
    // agrees with the trigger that will actually price the booking.
    const sample = routes[0]
    const sampleClass = activeFleet[0]
    if (sample && sampleClass) {
      // Kept as one object rather than destructured: the return is a
      // discriminated union, and destructuring loses the narrowing that
      // proves dbFare is a number once error is null.
      const result = await verifyFareAgainstDatabase({
        distanceKm: sample.km,
        durationMinutes: sample.minutes,
        fleetCode: sampleClass.code,
      })
      if (result.error !== null) {
        setCheck({
          ok: false,
          message: `Saved. Could not cross-check with the database: ${result.error}`,
        })
      } else {
        const dbFare = result.dbFare
        const local = calculateTransferFare(rules, {
          distanceKm: sample.km,
          durationMinutes: sample.minutes,
          fleetMultiplier: Number(sampleClass.multiplier),
        })
        setCheck(
          dbFare === local
            ? { ok: true, message: `Saved. Database agrees with this preview (${kr(local)}).` }
            : {
                ok: false,
                message: `Saved, but the database returned ${kr(dbFare)} where this screen shows ${kr(local)}. The database wins — tell Claude, the preview formula is out of date.`,
              },
        )
      }
    }
  }

  const handleRevert = () => {
    setRules(savedRules)
    setFleet(savedFleet)
    setError(null)
    setCheck(null)
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">
        Loading…
      </div>
    )
  }

  if (!rules) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Pricing rules not found.</p>
          <p className="mt-1 text-amber-200/80">
            {error ?? 'Run database_schema.sql, then supabase-taximeter-pricing.sql, in Supabase.'}
          </p>
        </div>
      </div>
    )
  }

  const fareFor = (source: PricingRules, route: Route, multiplier: number, at: Date) =>
    calculateTransferFare(source, {
      distanceKm: route.km,
      durationMinutes: route.minutes,
      fleetMultiplier: multiplier,
      at,
    })

  return (
    <div className="space-y-5">
      {/* ---------------- rates ---------------- */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#33bbcf]">
            <Gauge className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="font-semibold text-white">Rates</p>
            <p className="text-xs text-slate-400">
              Change a number and watch the fare table below update. Nothing is live until you save.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RateField
            label="Opening fee"
            unit="kr"
            hint="Added to every trip before distance"
            value={rules.base_fee}
            onChange={(v) => setRule('base_fee', v)}
          />
          <RateField
            label="Per kilometre"
            unit="kr / km"
            hint="The main lever on longer transfers"
            value={rules.price_per_km}
            onChange={(v) => setRule('price_per_km', v)}
          />
          <RateField
            label="Per minute"
            unit="kr / min"
            hint="Leave at 0 to price purely by distance"
            value={rules.price_per_minute}
            onChange={(v) => setRule('price_per_minute', v)}
          />
          <RateField
            label="Night / weekend"
            unit="×"
            step={0.05}
            hint="Applies 22:00–06:00 and all weekend, Tromsø time"
            value={rules.night_rate_multiplier}
            onChange={(v) => setRule('night_rate_multiplier', v)}
          />
          <RateField
            label="Minimum fare"
            unit="kr"
            hint="Floor for very short trips. Scales with vehicle class"
            value={rules.min_price}
            onChange={(v) => setRule('min_price', v)}
          />
        </div>

        <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-slate-400">
          fare = (opening + km × per_km + min × per_min) × night × vehicle
          <br />
          total = max(minimum × vehicle, fare)
        </p>

        <MinimumWarning rules={rules} />
      </section>

      {/* ---------------- vehicle classes ---------------- */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <p className="font-semibold text-white">Vehicle classes</p>
        <p className="mt-1 text-xs text-slate-400">
          The multiplier scales both the fare and the minimum. 1.5 means a Large costs half again as
          much as a Small for the same route.
        </p>

        <div className="mt-5 space-y-3">
          {fleet.map((f) => (
            <div
              key={f.id}
              className="grid grid-cols-2 items-end gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_1fr_120px_auto]"
            >
              <TextField
                label="Name"
                value={f.label}
                onChange={(v) => setFleetField(f.id, 'label', v)}
              />
              <TextField
                label="Capacity"
                value={f.capacity_hint}
                onChange={(v) => setFleetField(f.id, 'capacity_hint', v)}
              />
              <RateField
                label="Multiplier"
                unit="×"
                step={0.05}
                value={f.multiplier}
                onChange={(v) => setFleetField(f.id, 'multiplier', v)}
              />
              <label className="flex items-center gap-2 pb-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={f.active}
                  onChange={(e) => setFleetField(f.id, 'active', e.target.checked)}
                  className="h-4 w-4 accent-[#33bbcf]"
                />
                Offered
              </label>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Turning a class off hides it from guests. Existing bookings keep the class they were made
          with.
        </p>
      </section>

      {/* ---------------- live fare table ---------------- */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white">What a guest would pay</p>
            <p className="mt-1 text-xs text-slate-400">
              {dirty
                ? 'Struck-through figures are the prices live on the site right now.'
                : 'These are the prices live on the site right now.'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-amber-300" /> Weekday midday
            </span>
            <span className="flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-indigo-300" /> Weekday 02:00
            </span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Route
                </th>
                <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  km / min
                </th>
                {activeFleet.map((f) => (
                  <th
                    key={f.id}
                    colSpan={2}
                    className="pb-3 pr-4 text-center text-[11px] font-semibold uppercase tracking-wider text-[#33bbcf]"
                  >
                    {f.label} ×{Number(f.multiplier)}
                  </th>
                ))}
                <th className="pb-3" />
              </tr>
              <tr className="border-b border-white/10">
                <th />
                <th />
                {activeFleet.map((f) => (
                  // Fragment carries the key: a bare <> in a map has none,
                  // and React warns for every row.
                  <Fragment key={f.id}>
                    <th className="pb-2 pr-4 text-right text-[10px] font-medium uppercase text-slate-500">
                      Day
                    </th>
                    <th className="pb-2 pr-4 text-right text-[10px] font-medium uppercase text-slate-500">
                      Night
                    </th>
                  </Fragment>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className="border-b border-white/[0.06]">
                  <td className="py-3 pr-4">
                    <input
                      value={route.name}
                      onChange={(e) =>
                        setRoutes((rs) =>
                          rs.map((r) => (r.id === route.id ? { ...r, name: e.target.value } : r)),
                        )
                      }
                      className="w-full min-w-[150px] rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-sm text-white hover:border-white/10 focus:border-[#33bbcf] focus:outline-none"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <NumberCell
                        value={route.km}
                        onChange={(v) =>
                          setRoutes((rs) => rs.map((r) => (r.id === route.id ? { ...r, km: v } : r)))
                        }
                      />
                      <span className="text-slate-600">/</span>
                      <NumberCell
                        value={route.minutes}
                        onChange={(v) =>
                          setRoutes((rs) =>
                            rs.map((r) => (r.id === route.id ? { ...r, minutes: v } : r)),
                          )
                        }
                      />
                    </div>
                  </td>
                  {activeFleet.map((f) => {
                    const savedClass = savedFleet.find((x) => x.id === f.id)
                    return (
                      <Fragment key={f.id}>
                        <FareCell
                          next={fareFor(rules, route, Number(f.multiplier), DAY_AT)}
                          prev={
                            dirty && savedRules && savedClass
                              ? fareFor(savedRules, route, Number(savedClass.multiplier), DAY_AT)
                              : null
                          }
                        />
                        <FareCell
                          next={fareFor(rules, route, Number(f.multiplier), NIGHT_AT)}
                          prev={
                            dirty && savedRules && savedClass
                              ? fareFor(savedRules, route, Number(savedClass.multiplier), NIGHT_AT)
                              : null
                          }
                          muted
                        />
                      </Fragment>
                    )
                  })}
                  <td className="py-3 text-right">
                    {routes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRoutes((rs) => rs.filter((r) => r.id !== route.id))}
                        aria-label={`Remove ${route.name}`}
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() =>
            setRoutes((rs) => [
              ...rs,
              { id: `r${Date.now()}`, name: 'New route', km: 10, minutes: 15 },
            ])
          }
          className="mt-4 flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-[#33bbcf] hover:text-[#33bbcf]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add a route to test
        </button>
        <p className="mt-2 text-[11px] text-slate-500">
          Routes here are only for checking prices — they are not saved and guests never see them.
        </p>
      </section>

      {/* ---------------- save bar ---------------- */}
      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
          {error}
        </p>
      )}
      {check && (
        <p
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            check.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
          }`}
        >
          {check.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {check.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 rounded-xl bg-[#33bbcf] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : dirty ? 'Save and go live' : 'No changes'}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={handleRevert}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-white/25"
          >
            <RotateCcw className="h-4 w-4" />
            Discard changes
          </button>
        )}
        {dirty && (
          <span className="text-xs text-amber-300">
            Unsaved — guests are still being quoted the struck-through prices.
          </span>
        )}
      </div>
    </div>
  )
}

/* ---------------- small pieces ---------------- */

function RateField({
  label,
  unit,
  hint,
  value,
  step = 1,
  onChange,
}: {
  label: string
  unit: string
  hint?: string
  value: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{unit}</span>
      </label>
      <input
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm tabular-nums text-white focus:border-[#33bbcf] focus:outline-none"
      />
      {hint && <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p>}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
      />
    </div>
  )
}

function NumberCell({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      className="w-14 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-sm tabular-nums text-slate-300 hover:border-white/10 focus:border-[#33bbcf] focus:outline-none"
    />
  )
}

function FareCell({
  next,
  prev,
  muted = false,
}: {
  next: number
  prev: number | null
  muted?: boolean
}) {
  const changed = prev !== null && prev !== next
  return (
    <td className="py-3 pr-4 text-right tabular-nums">
      {changed && (
        <span className="mr-2 text-xs text-slate-600 line-through">{kr(prev)}</span>
      )}
      <span
        className={
          changed
            ? 'font-semibold text-[#33bbcf]'
            : muted
              ? 'text-slate-400'
              : 'text-white'
        }
      >
        {kr(next)}
      </span>
    </td>
  )
}

/**
 * The failure mode that actually bit this business: with a high minimum
 * and a low per-km rate, every city trip lands on the floor and the meter
 * stops meaning anything. This says where that happens, in kilometres.
 */
function MinimumWarning({ rules }: { rules: PricingRules }) {
  const perKm = Number(rules.price_per_km)
  if (perKm <= 0) return null

  const breakEvenKm = (Number(rules.min_price) - Number(rules.base_fee)) / perKm
  if (breakEvenKm <= 3) return null

  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-xs text-amber-200/90">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
      <p>
        Every daytime trip under <strong>{breakEvenKm.toFixed(1)} km</strong> costs exactly the
        minimum, so distance stops mattering below that. Tromsø city centre is only a few kilometres
        across — lower the minimum or raise the per-km rate if you want the meter to work on
        in-town rides.
      </p>
    </div>
  )
}
