'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Car, Bus, Users, UtensilsCrossed, User, Mail, Phone, Check } from 'lucide-react'
import { calculateCharterQuote, createCharterRequest } from '@/services/charter'
import { listCharterVehicles, type CharterVehicle, type CharterVehicleType } from '@/services/charter-vehicles.service'
import { useSpamGuard } from '@/lib/use-spam-guard'
import { PrivacyNotice } from '@/components/privacy-notice'

type VehicleType = CharterVehicleType

const vehicleIcon: Record<VehicleType, React.ReactNode> = {
  luxury_sedan: <Car className="h-5 w-5" />,
  suv: <Car className="h-5 w-5" />,
  van: <Bus className="h-5 w-5" />,
  minibus: <Bus className="h-5 w-5" />,
}

// Shown immediately and while /admin's live charter_vehicles data loads (or
// if supabase-charter-vehicles-setup.sql hasn't been run yet) -- matches
// the same values services/charter.ts falls back to server-side.
const FALLBACK_VEHICLES: CharterVehicle[] = [
  { vehicle_type: 'luxury_sedan', label: 'Luxury Sedan', capacity_label: '1–3 guests', day_rate: 5500, image_url: null, updated_at: '' },
  { vehicle_type: 'suv', label: 'Premium SUV', capacity_label: '1–5 guests', day_rate: 4500, image_url: null, updated_at: '' },
  { vehicle_type: 'van', label: 'VIP Van', capacity_label: '4–8 guests', day_rate: 6000, image_url: null, updated_at: '' },
  { vehicle_type: 'minibus', label: 'Minibus', capacity_label: '8–16 guests', day_rate: 8000, image_url: null, updated_at: '' },
]

export function CharterForm() {
  const spamGuard = useSpamGuard()

  const [vehicles, setVehicles] = useState<CharterVehicle[]>(FALLBACK_VEHICLES)
  const [vehicleType, setVehicleType] = useState<VehicleType>('luxury_sedan')
  const [pax, setPax] = useState(2)
  const [catering, setCatering] = useState('')

  useEffect(() => {
    listCharterVehicles().then(({ data, error }) => {
      if (!error && data && data.length > 0) setVehicles(data as CharterVehicle[])
    })
  }, [])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState<number | null>(null)

  const selectedVehicle = vehicles.find((v) => v.vehicle_type === vehicleType) ?? vehicles[0]

  const quote = useMemo(
    () => calculateCharterQuote(selectedVehicle.day_rate, pax, catering),
    [selectedVehicle, pax, catering],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return

    if (spamGuard.isSpam()) {
      setSubmitted(quote)
      return
    }

    setSubmitting(true)
    setError('')

    const { data, error: reqError } = await createCharterRequest({
      customer_name: fullName.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim() || null,
      vehicle_type: vehicleType,
      catering_preferences: catering.trim() || null,
      pax,
    })

    setSubmitting(false)

    if (reqError || !data) {
      console.error('Charter request error:', reqError)
      setError('Could not send your request. Please try again or contact us on WhatsApp.')
      return
    }

    setSubmitted(data.total_quote)
  }

  if (submitted !== null) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-8 text-center shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--home-accent-soft)] text-[var(--home-accent)]">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--home-foreground)]">
          Request Sent
        </h3>
        <p className="mt-2 text-sm text-[var(--home-muted)]">
          Estimated quote:{' '}
          <span className="font-mono font-semibold text-[var(--home-accent)]">{submitted.toLocaleString()} kr</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--home-muted)]">
          Our team will confirm final availability and pricing with you shortly by email or WhatsApp.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-3">
        <input
          type="text"
          name="company"
          value={spamGuard.honeypot}
          onChange={(e) => spamGuard.setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--home-muted)]">
            Vehicle
          </label>
          <div className="grid grid-cols-2 gap-3">
            {vehicles.map((v) => (
              <button
                key={v.vehicle_type}
                type="button"
                onClick={() => setVehicleType(v.vehicle_type)}
                className={`flex flex-col items-start gap-2 overflow-hidden rounded-2xl border text-left transition-colors ${
                  vehicleType === v.vehicle_type
                    ? 'border-[var(--home-accent)] bg-[var(--home-accent-soft)]'
                    : 'border-[var(--home-border)] bg-[var(--home-surface)] hover:border-[var(--home-accent)]/40'
                }`}
              >
                {v.image_url ? (
                  <div className="relative h-24 w-full">
                    <Image src={v.image_url} alt={v.label} fill className="object-cover" sizes="240px" />
                  </div>
                ) : null}
                <span className="flex w-full flex-col items-start gap-2 p-4 pt-2">
                  <span className={vehicleType === v.vehicle_type ? 'text-[var(--home-accent)]' : 'text-[var(--home-muted)]'}>
                    {vehicleIcon[v.vehicle_type]}
                  </span>
                  <span className="text-sm font-semibold text-[var(--home-foreground)]">{v.label}</span>
                  <span className="text-xs text-[var(--home-muted)]">{v.capacity_label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--home-muted)]">
            Passengers
          </label>
          <div className="flex items-center gap-4">
            <Users className="h-4 w-4 text-[var(--home-muted)]" />
            <input
              type="range"
              min={1}
              max={16}
              value={pax}
              onChange={(e) => setPax(Number(e.target.value))}
              className="flex-1 accent-[var(--home-accent)]"
            />
            <span className="w-10 text-right font-mono text-sm font-semibold text-[var(--home-foreground)]">
              {pax}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--home-muted)]">
            Catering preferences (optional)
          </label>
          <div className="relative">
            <UtensilsCrossed className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
            <textarea
              rows={2}
              placeholder="e.g. warm drinks and snacks on board"
              value={catering}
              onChange={(e) => setCatering(e.target.value)}
              className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--home-muted)]">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
              <input
                required
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--home-muted)]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
              <input
                required
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--home-muted)]">Phone (optional)</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+47 000 00 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[var(--home-accent)] py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Request This Charter'}
        </button>

        <PrivacyNotice className="text-center" />
      </form>

      <div className="lg:col-span-2">
        <div className="sticky top-24 rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 shadow-[0_2px_24px_-8px_rgba(0,0,0,0.08)]">
          <p className="text-xs uppercase tracking-widest text-[var(--home-accent)]">Estimated Quote</p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-4xl font-semibold tracking-tight text-[var(--home-foreground)] tabular-nums">
              {quote.toLocaleString()}
            </span>
            <span className="text-sm text-[var(--home-muted)]">kr</span>
          </div>
          <p className="mt-1 text-xs text-[var(--home-muted)]">
            {selectedVehicle.label} · {pax} guest{pax === 1 ? '' : 's'}
            {catering.trim() ? ' · catering' : ''}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-[var(--home-muted)]">
            This is an instant estimate. Final pricing is confirmed by our team based on real-time
            availability, route, and season.
          </p>
        </div>
      </div>
    </div>
  )
}
