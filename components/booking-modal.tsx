'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { insertBooking } from '@/services/bookings.service'
import { listAddonsForTour, attachAddonsToBooking, calculateCartTotal, type TourAddon, type CartAddon } from '@/services/addons.service'
import { validatePromoCode, type PromoCodeInfo } from '@/services/partners.service'
import { useSpamGuard } from '@/lib/use-spam-guard'
import { PrivacyNotice } from '@/components/privacy-notice'
import { Check, X, Calendar, Clock, Mail, Phone, User, Minus, Plus, PackageOpen, Tag, Loader2 } from 'lucide-react'

export interface BookingModalTour {
  title: string
  price: string
  option?: string
  id?: string
}

interface BookingModalProps {
  tour: BookingModalTour
  isSignedIn: boolean
  prefill: { fullName: string; email: string; phone: string }
  onClose: () => void
}

const stepLabels = ['Date & Time', 'Extras', 'Your Details', 'Confirm'] as const

/**
 * Self-contained reservation flow -- used from both the homepage tour
 * cards and individual /tours/[slug] pages so there is exactly one
 * booking experience site-wide instead of two diverging ones.
 */
export function BookingModal({ tour, isSignedIn, prefill, onClose }: BookingModalProps) {
  const spamGuard = useSpamGuard()

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [fullName, setFullName] = useState(prefill.fullName)
  const [email, setEmail] = useState(prefill.email)
  const [phone, setPhone] = useState(prefill.phone)
  // Lets a signed-in customer override their stored profile info for just
  // this booking -- without this, a stale/invalid phone on their account
  // (e.g. one that fails the server-side format check) had no fix path
  // other than editing their whole profile outside the flow.
  const [editingContact, setEditingContact] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  // Bounds the native date picker so it can't be set to a bogus past/far-
  // future date (e.g. year 0002) -- lib/validation.ts's bookingInsertSchema
  // is the real server-side gate, this just keeps the picker sane.
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const maxDateStr = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 2)
    return d.toISOString().split('T')[0]
  }, [])

  const [addons, setAddons] = useState<TourAddon[]>([])
  const [addonsLoading, setAddonsLoading] = useState(false)
  const [cart, setCart] = useState<CartAddon[]>([])
  // Generated client-side (rather than waiting on the insert's response) so
  // it can be attached to booking_addons even though anon inserts don't get
  // a reliable SELECT-back under RLS -- see insertBooking()'s id passthrough.
  const [bookingId] = useState(() => crypto.randomUUID())

  useEffect(() => {
    if (!tour.id) {
      setAddons([])
      return
    }
    let cancelled = false
    setAddonsLoading(true)
    listAddonsForTour(tour.id).then(({ data, error }) => {
      if (cancelled) return
      setAddons(error ? [] : (data ?? []))
      setAddonsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [tour.id])

  const addonQuantity = (addonId: string) => cart.find((c) => c.addon_id === addonId)?.quantity ?? 0

  const setAddonQuantity = (addon: TourAddon, quantity: number) => {
    setCart((prev) => {
      const next = prev.filter((c) => c.addon_id !== addon.id)
      if (quantity > 0) {
        next.push({ addon_id: addon.id, name: addon.name, quantity, price_at_booking: addon.price })
      }
      return next
    })
  }

  const cartTotal = calculateCartTotal(cart)
  const basePrice = parseInt(tour.price.replace(/[^0-9]/g, '')) || 0
  const subtotal = basePrice + cartTotal

  const [promoInput, setPromoInput] = useState('')
  const [promoChecking, setPromoChecking] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeInfo | null>(null)

  const discountAmount = appliedPromo ? Math.round((subtotal * appliedPromo.customer_discount_percent) / 100) : 0
  const totalPrice = subtotal - discountAmount

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    setPromoChecking(true)
    setPromoError('')
    const info = await validatePromoCode(promoInput)
    setPromoChecking(false)
    if (!info) {
      setPromoError('That code isn’t valid or has expired.')
      setAppliedPromo(null)
      return
    }
    setAppliedPromo(info)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (spamGuard.isSpam()) {
      // Silently skip the insert for bot-like submissions without tipping them off.
      setIsSubmitted(true)
      setTimeout(onClose, 2500)
      return
    }

    setLoading(true)
    setSubmitError('')

    try {
      const { data, error } = await insertBooking({
        id: bookingId,
        customer_name: fullName.trim() || 'Guest User',
        customer_email: email.trim() || 'pending@articsafaritour.com',
        customer_phone: phone.trim() || null,
        booking_type: tour.title.includes('Transfer') ? 'transfer' : 'tour',
        item_title: `${tour.title}${tour.option ? ` (${tour.option})` : ''}`,
        booking_date: date || new Date().toISOString().split('T')[0],
        scheduled_time: time || null,
        total_price: totalPrice,
        notes: time ? `Preferred Time: ${time}` : 'Direct package booking',
        status: 'pending',
        promo_code: appliedPromo?.promo_code ?? null,
      })

      setLoading(false)

      if (error) {
        console.error('Booking insert error:', error)
        setSubmitError(
          error.message || 'Could not send your booking request. Please try again or contact us on WhatsApp.',
        )
        return
      }

      console.log('Booking insert success:', data)

      if (cart.length > 0) {
        const { error: addonError } = await attachAddonsToBooking(bookingId, cart)
        if (addonError) console.error('Add-on attach error:', addonError)
      }

      setIsSubmitted(true)
      setTimeout(onClose, 2500)
    } catch (err) {
      console.error('Booking unexpected error:', err)
      setLoading(false)
      setSubmitError('Something went wrong. Please try again or contact us on WhatsApp.')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{ backgroundImage: 'var(--home-gradient-card)' }}
          className="relative w-full max-w-lg rounded-[24px] border border-white/10 p-6 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)]"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full p-2 text-[var(--home-muted)] transition-colors hover:bg-white/5 hover:text-[var(--home-foreground)]"
          >
            <X className="h-5 w-5" />
          </button>

          {isSubmitted ? (
            <div className="py-12 text-center">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-[var(--home-bg)]"
                style={{ backgroundImage: 'var(--home-gradient-cta)' }}
              >
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--home-foreground)]">
                Booking Request Sent
              </h3>
              <p className="mt-2 text-sm text-[var(--home-muted)]">
                We will contact you shortly to confirm your reservation for {tour.title}.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest text-[var(--home-accent)]">Reservation</p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--home-foreground)]">
                  {tour.title}
                </h3>
                <div className="mt-2 flex items-center gap-3 text-sm text-[var(--home-muted)]">
                  <span className="font-mono font-semibold text-[var(--home-accent)]">{tour.price}</span>
                  {tour.option && <span>• {tour.option}</span>}
                </div>
              </div>

              {/* Step progress */}
              <div className="mb-6 flex items-center gap-2">
                {stepLabels.map((label, i) => {
                  const stepNum = (i + 1) as 1 | 2 | 3 | 4
                  const done = step > stepNum
                  const active = step >= stepNum
                  return (
                    <div key={label} className="flex flex-1 items-center gap-2">
                      <div
                        style={active ? { backgroundImage: 'var(--home-gradient-cta)' } : undefined}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                          active ? 'text-[var(--home-bg)]' : 'bg-white/5 text-[var(--home-muted)]'
                        }`}
                      >
                        {done ? <Check className="h-3 w-3" /> : stepNum}
                      </div>
                      <span
                        className={`hidden text-xs font-medium sm:block ${
                          active ? 'text-[var(--home-foreground)]' : 'text-[var(--home-muted)]'
                        }`}
                      >
                        {label}
                      </span>
                      {stepNum < 4 && <div className="h-px flex-1 bg-white/10" />}
                    </div>
                  )
                })}
              </div>

              {step < 4 &&
                (appliedPromo ? (
                  <div className="mb-4 flex items-center gap-1.5 text-xs font-medium text-[var(--home-accent)]">
                    <Tag className="h-3.5 w-3.5" />
                    {appliedPromo.customer_discount_percent}% off applied · {appliedPromo.hotel_name}
                  </div>
                ) : (
                  <p className="mb-4 flex items-center gap-1.5 text-xs text-[var(--home-muted)]">
                    <Tag className="h-3.5 w-3.5 text-[var(--home-accent)]" />
                    Have a partner promo code? You'll be able to enter it before confirming.
                  </p>
                ))}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {step === 1 && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[var(--home-muted)]">Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                          <input
                            required
                            type="date"
                            value={date}
                            min={todayStr}
                            max={maxDateStr}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none [color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[var(--home-muted)]">Preferred Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!date}
                      onClick={() => setStep(2)}
                      style={{ backgroundImage: 'var(--home-gradient-cta)' }}
                      className="mt-2 w-full rounded-[10px] py-3 text-sm font-semibold text-[var(--home-bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    {addonsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--home-muted)]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[var(--home-accent)]" />
                        Loading extras…
                      </div>
                    ) : addons.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 py-8 text-center">
                        <PackageOpen className="h-6 w-6 text-[var(--home-muted)]" />
                        <p className="text-sm text-[var(--home-muted)]">No extras available for this experience yet.</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {addons.map((addon) => {
                          const qty = addonQuantity(addon.id)
                          return (
                            <li
                              key={addon.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[var(--home-foreground)]">{addon.name}</p>
                                {addon.description && (
                                  <p className="truncate text-xs text-[var(--home-muted)]">{addon.description}</p>
                                )}
                                <p className="mt-0.5 font-mono text-xs text-[var(--home-accent)]">
                                  {addon.price.toLocaleString()} kr
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  disabled={qty === 0}
                                  onClick={() => setAddonQuantity(addon, qty - 1)}
                                  className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-[var(--home-foreground)] transition-colors hover:bg-white/10 disabled:opacity-30"
                                  aria-label={`Remove one ${addon.name}`}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-4 text-center text-sm font-semibold tabular-nums text-[var(--home-foreground)]">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setAddonQuantity(addon, qty + 1)}
                                  className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-[var(--home-foreground)] transition-colors hover:bg-white/10"
                                  aria-label={`Add one ${addon.name}`}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    {cart.length > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-[var(--home-accent-soft)] px-3.5 py-2.5 text-sm">
                        <span className="text-[var(--home-accent)]">Extras total</span>
                        <span className="font-mono font-semibold text-[var(--home-accent)]">
                          {cartTotal.toLocaleString()} kr
                        </span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-[10px] border border-white/10 px-5 py-3 text-sm font-semibold text-[var(--home-foreground)] transition-colors hover:bg-white/5"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        style={{ backgroundImage: 'var(--home-gradient-cta)' }}
                        className="flex-1 rounded-[10px] py-3 text-sm font-semibold text-[var(--home-bg)] transition-opacity hover:opacity-90"
                      >
                        {cart.length > 0 ? 'Continue' : 'Skip'}
                      </button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    {isSignedIn && !editingContact ? (
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-[var(--home-accent)]/25 bg-[var(--home-accent-soft)] p-3.5">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--home-accent)]">Booking as</p>
                          <p className="mt-1 text-sm font-medium text-[var(--home-foreground)]">{fullName}</p>
                          <p className="text-xs text-[var(--home-muted)]">
                            {email}
                            {phone ? ` · ${phone}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingContact(true)}
                          className="shrink-0 whitespace-nowrap text-xs font-semibold text-[var(--home-accent)] underline underline-offset-2 hover:text-[var(--home-foreground)]"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <>
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
                              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-[var(--home-muted)]">Phone</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                              <input
                                required
                                type="tel"
                                autoComplete="tel"
                                placeholder="+47 000 00 000"
                                pattern="^[+]?[\d\s()-]{7,20}$"
                                title="Enter a valid phone number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="rounded-[10px] border border-white/10 px-5 py-3 text-sm font-semibold text-[var(--home-foreground)] transition-colors hover:bg-white/5"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={(!isSignedIn || editingContact) && (!fullName || !email || !phone)}
                        onClick={() => setStep(4)}
                        style={{ backgroundImage: 'var(--home-gradient-cta)' }}
                        className="flex-1 rounded-[10px] py-3 text-sm font-semibold text-[var(--home-bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                      <div className="flex justify-between text-[var(--home-foreground)]">
                        <span className="text-[var(--home-muted)]">Package</span>
                        <span className="font-medium">{tour.title}</span>
                      </div>
                      <div className="flex justify-between text-[var(--home-foreground)]">
                        <span className="text-[var(--home-muted)]">Date</span>
                        <span className="font-medium">
                          {date}
                          {time ? ` · ${time}` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between text-[var(--home-foreground)]">
                        <span className="text-[var(--home-muted)]">Contact</span>
                        <span className="text-right font-medium">
                          {fullName}
                          <br />
                          {email}
                        </span>
                      </div>
                      {cart.map((item) => (
                        <div key={item.addon_id} className="flex justify-between text-[var(--home-foreground)]">
                          <span className="text-[var(--home-muted)]">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium">{(item.price_at_booking * item.quantity).toLocaleString()} kr</span>
                        </div>
                      ))}
                      {appliedPromo && (
                        <div className="flex justify-between text-[var(--home-accent)]">
                          <span>
                            {appliedPromo.customer_discount_percent}% off · {appliedPromo.hotel_name}
                          </span>
                          <span className="font-medium">−{discountAmount.toLocaleString()} kr</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-white/10 pt-2 text-[var(--home-foreground)]">
                        <span className="text-[var(--home-muted)]">Total</span>
                        <span className="font-mono font-semibold text-[var(--home-accent)]">
                          {totalPrice.toLocaleString()} kr
                          {tour.price.includes('/') ? ' + extras' : ''}
                        </span>
                      </div>
                    </div>

                    {appliedPromo ? (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--home-accent)]/25 bg-[var(--home-accent-soft)] px-3.5 py-2.5 text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-[var(--home-accent)]">
                          <Tag className="h-3.5 w-3.5" />
                          Code {appliedPromo.promo_code} applied
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null)
                            setPromoInput('')
                          }}
                          className="font-medium text-[var(--home-muted)] underline underline-offset-2 hover:text-[var(--home-foreground)]"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--home-muted)]">
                          <Tag className="h-3.5 w-3.5 text-[var(--home-accent)]" />
                          Have a partner promo code? Enter it for an instant discount
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3 top-3 h-4 w-4 text-[var(--home-muted)]" />
                            <input
                              type="text"
                              autoComplete="off"
                              placeholder="e.g. RADISSON10"
                              value={promoInput}
                              onChange={(e) => {
                                setPromoInput(e.target.value.toUpperCase())
                                setPromoError('')
                              }}
                              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm uppercase text-[var(--home-foreground)] focus:border-[var(--home-accent)] focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            disabled={promoChecking || !promoInput.trim()}
                            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-[var(--home-foreground)] transition-colors hover:bg-white/5 disabled:opacity-40"
                          >
                            {promoChecking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Apply
                          </button>
                        </div>
                        {promoError && <p className="mt-1 text-xs font-medium text-rose-400">{promoError}</p>}
                      </div>
                    )}

                    {submitError && <p className="text-xs font-medium text-rose-400">{submitError}</p>}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="rounded-[10px] border border-white/10 px-5 py-3 text-sm font-semibold text-[var(--home-foreground)] transition-colors hover:bg-white/5"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{ backgroundImage: 'var(--home-gradient-cta)' }}
                        className="flex-1 rounded-[10px] py-3 text-sm font-semibold text-[var(--home-bg)] transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {loading ? 'Saving…' : 'Confirm Booking'}
                      </button>
                    </div>
                    <PrivacyNotice className="mt-3 text-center" />
                  </>
                )}
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
