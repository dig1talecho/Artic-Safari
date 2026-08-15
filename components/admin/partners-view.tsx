'use client'

import { useEffect, useState } from 'react'
import { Building2, Trash2, Plus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import {
  listPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerCommissionSummary,
  type Partner,
} from '@/services/partners.service'

type CommissionMap = Record<string, { bookingCount: number; totalCommission: number }>

export function PartnersView() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [commissions, setCommissions] = useState<CommissionMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hotelName, setHotelName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [commissionRate, setCommissionRate] = useState('10')
  const [promoCode, setPromoCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPartners = async () => {
    setLoading(true)
    const { data, error } = await listPartners()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setError(null)
    setPartners(data ?? [])
    setLoading(false)

    const summaries = await Promise.all((data ?? []).map((p) => getPartnerCommissionSummary(p.id)))
    const map: CommissionMap = {}
    summaries.forEach((s) => {
      if (s) map[s.partner.id] = { bookingCount: s.bookingCount, totalCommission: s.totalCommission }
    })
    setCommissions(map)
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hotelName.trim() || !promoCode.trim()) return

    setSubmitting(true)
    setError(null)
    const { error } = await createPartner({
      hotel_name: hotelName.trim(),
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      commission_rate: (Number(commissionRate) || 0) / 100,
      promo_code: promoCode.trim().toUpperCase(),
      active: true,
    })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setHotelName('')
    setContactName('')
    setContactEmail('')
    setCommissionRate('10')
    setPromoCode('')
    fetchPartners()
  }

  const toggleActive = async (partner: Partner) => {
    const { error } = await updatePartner(partner.id, { active: !partner.active })
    if (!error) {
      setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, active: !p.active } : p)))
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deletePartner(id)
    if (!error) {
      setPartners((prev) => prev.filter((p) => p.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Add a Partner</h2>
        <p className="mt-1 text-xs text-slate-400">
          Hotels/agencies that refer bookings via a promo code. Commission is calculated automatically
          server-side (resolve_booking_partner trigger) whenever a booking uses their code — the rate
          here only sets the percentage, never a manually-entered total.
        </p>

        <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            required
            type="text"
            placeholder="Hotel / partner name"
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
          />
          <input
            type="text"
            placeholder="Contact name (optional)"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
          />
          <input
            type="email"
            placeholder="Contact email (optional)"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
          />
          <div className="flex gap-3">
            <input
              required
              type="number"
              min={0}
              max={100}
              step={0.5}
              placeholder="Commission %"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-28 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:border-[#33bbcf] focus:outline-none"
            />
            <input
              required
              type="text"
              placeholder="PROMOCODE"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#33bbcf] focus:outline-none"
            />
          </div>
          {error && <p className="text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#33bbcf] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#33bbcf]/90 disabled:opacity-50 sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            {submitting ? 'Adding…' : 'Add Partner'}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-md">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Partners ({partners.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : partners.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No partners yet. Add your first one above.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {partners.map((partner) => {
              const summary = commissions[partner.id]
              return (
                <div key={partner.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#33bbcf]">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{partner.hotel_name}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-[#33bbcf]">
                          {partner.promo_code}
                        </span>
                        {!partner.active && (
                          <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {partner.contact_name || 'No contact name'}
                        {partner.contact_email ? ` · ${partner.contact_email}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(partner.commission_rate * 100).toFixed(1)}% commission
                        {summary
                          ? ` · ${summary.bookingCount} booking${summary.bookingCount === 1 ? '' : 's'} · ${summary.totalCommission.toLocaleString()} kr earned`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => toggleActive(partner)}
                      title={partner.active ? 'Deactivate' : 'Activate'}
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                    >
                      {partner.active ? <ToggleRight className="h-4 w-4 text-[#33bbcf]" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(partner.id)}
                      title="Delete"
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
