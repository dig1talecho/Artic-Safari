'use client'

import { useEffect, useState } from 'react'
import { XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  estimateRefund,
  guestCanCancel,
  type CancellationRule,
  type RefundEstimate,
} from '@/lib/cancellation'

/**
 * Guest-side cancellation.
 *
 * The refund figure is shown BEFORE the guest confirms, because being told
 * what you got back after the fact is not a choice. Postgres recalculates
 * it and freezes the real number onto the row, so this is a preview -- but
 * a preview that disagrees with the outcome would be worse than none, which
 * is why the tiers come from the same table the database reads and the
 * arithmetic is tested against it.
 *
 * The policy is never hardcoded here. An empty rules table renders nothing
 * rather than assuming either a full refund or none.
 */
export function CancelBookingPanel({
  bookingId,
  status,
  totalPrice,
  bookingDate,
  scheduledTime,
  onCancelled,
}: {
  bookingId: string
  status: string
  totalPrice: number
  bookingDate: string
  scheduledTime: string | null
  onCancelled: () => void
}) {
  const [rules, setRules] = useState<CancellationRule[] | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!guestCanCancel(status)) return
    supabase
      .from('cancellation_rules')
      .select('id, min_hours_before, refund_percent, label')
      .then(({ data }) => setRules((data as CancellationRule[]) ?? []))
  }, [status])

  if (!guestCanCancel(status)) return null

  const estimate: RefundEstimate | null = rules
    ? estimateRefund(totalPrice, bookingDate, scheduledTime, rules)
    : null

  const handleCancel = async () => {
    setBusy(true)
    setError('')

    // Only the status and the reason are sent. refund_due is stamped by the
    // database from its own policy -- a client-supplied refund amount would
    // be a number the guest chose for themselves.
    const { error: err } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: reason.trim() || null })
      .eq('id', bookingId)

    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    onCancelled()
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-destructive"
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancel this booking
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-semibold text-foreground">Cancel this booking?</p>

      {rules === null ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking the cancellation policy…
        </p>
      ) : estimate ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">{estimate.label}</p>
          <p className="text-sm text-foreground">
            You would get back{' '}
            <strong className="font-mono">{estimate.refund.toLocaleString()} NOK</strong>
            {estimate.percent < 100 && (
              <span className="text-muted-foreground"> of {totalPrice.toLocaleString()} NOK</span>
            )}
          </p>
          {estimate.percent > 0 && (
            /*
              Said plainly because no processor is connected: recording a
              refund is not paying one, and letting a guest believe money is
              already on its way would be the worst kind of quiet lie.
            */
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Refunds are processed by our team and confirmed with you directly — this cancels the
              booking, it does not move money yet.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Cancellation terms for this booking aren&apos;t available here. Cancel below and we&apos;ll
          confirm the details with you.
        </p>
      )}

      <label className="mt-3 block">
        <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
          Reason (optional)
        </span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          placeholder="Change of plans, weather, …"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-[#33bbcf] focus:outline-none"
        />
      </label>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {busy ? 'Cancelling…' : 'Yes, cancel it'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Keep it
        </button>
      </div>
    </div>
  )
}
