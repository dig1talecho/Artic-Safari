'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, FileSpreadsheet, Loader2, AlertTriangle, Info } from 'lucide-react'
import {
  getAccountingReport,
  periodRange,
  reportToCsv,
  type AccountingReport,
  type AccountingBucket,
  type DateBasis,
} from '@/services/accounting.service'

/**
 * Period report for the accountant.
 *
 * Built around one idea: show the numbers separated the way an accountant
 * separates them, and refuse to make the judgement calls that are theirs.
 * Completed, committed, no-show and cancelled are four different things,
 * and a single "revenue" figure that quietly folds some of them together
 * is worse than no figure at all.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const kr = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export function AccountingView() {
  const now = new Date()
  const [kind, setKind] = useState<'month' | 'quarter' | 'year'>('month')
  const [year, setYear] = useState(now.getUTCFullYear())
  const [index, setIndex] = useState(now.getUTCMonth())
  const [basis, setBasis] = useState<DateBasis>('trip')
  const [vat, setVat] = useState<string>('')

  const [report, setReport] = useState<AccountingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { from, to } = periodRange(kind, year, kind === 'year' ? 0 : index)
    const { data, error: err } = await getAccountingReport(from, to, basis)
    if (err) setError(err.message)
    else setReport(data)
    setLoading(false)
  }, [kind, year, index, basis])

  useEffect(() => {
    load()
  }, [load])

  const vatPercent = vat.trim() === '' ? null : Number(vat)

  const download = () => {
    if (!report) return
    const csv = reportToCsv(report, Number.isFinite(vatPercent as number) ? vatPercent : null)
    // A BOM so Norwegian Excel opens it as UTF-8 and does not mangle ø.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `artic-safari-${report.from}-to-${report.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const periodOptions =
    kind === 'month'
      ? MONTHS.map((m, i) => ({ value: i, label: m }))
      : kind === 'quarter'
        ? [0, 1, 2, 3].map((i) => ({ value: i, label: `Q${i + 1}` }))
        : []

  const years = Array.from({ length: 6 }, (_, i) => now.getUTCFullYear() - i)

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-[#33bbcf]">
            <FileSpreadsheet className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="font-semibold text-white">Period report</p>
            <p className="text-xs text-slate-400">
              Revenue by product for a month, quarter or year. Export as a spreadsheet for your
              accountant.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <Field label="Period">
            <select
              value={kind}
              onChange={(e) => {
                const k = e.target.value as typeof kind
                setKind(k)
                setIndex(k === 'month' ? now.getUTCMonth() : 0)
              }}
              className={selectClass}
            >
              <option value="month" className="bg-slate-900">Month</option>
              <option value="quarter" className="bg-slate-900">Quarter</option>
              <option value="year" className="bg-slate-900">Year</option>
            </select>
          </Field>

          {periodOptions.length > 0 && (
            <Field label="Which">
              <select
                value={index}
                onChange={(e) => setIndex(Number(e.target.value))}
                className={selectClass}
              >
                {periodOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-slate-900">
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Year">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-900">{y}</option>
              ))}
            </select>
          </Field>

          <Field label="Dated by">
            <select
              value={basis}
              onChange={(e) => setBasis(e.target.value as DateBasis)}
              className={selectClass}
            >
              <option value="trip" className="bg-slate-900">Trip date</option>
              <option value="booked" className="bg-slate-900">Booking date</option>
            </select>
          </Field>

          <Field label="VAT %">
            <input
              value={vat}
              onChange={(e) => setVat(e.target.value)}
              placeholder="optional"
              inputMode="decimal"
              className={`${selectClass} w-24`}
            />
          </Field>

          <button
            type="button"
            onClick={download}
            disabled={!report || loading}
            className="flex items-center gap-2 rounded-xl bg-[#33bbcf] px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-relaxed text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#33bbcf]" />
          <p>
            <strong className="text-slate-300">Trip date</strong> groups by when the service was
            delivered; <strong className="text-slate-300">Booking date</strong> by when it was sold.
            Which one your accounts use is your accountant&rsquo;s decision, not this
            screen&rsquo;s. The VAT box applies whatever rate you enter — Norwegian rates differ
            between passenger transport and other services, so confirm the figure before filing.
          </p>
        </div>
      </section>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : report ? (
        <>
          <Bucket
            title="Completed"
            note="Trips that happened. The safest definition of earned revenue."
            bucket={report.completed}
            vatPercent={vatPercent}
            accent
          />

          {report.completed.gross > 0 && (
            <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
              <p className="text-sm font-semibold text-white">Collection</p>
              <p className="mt-1 text-xs text-slate-400">Of the completed trips above.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Figure label="Paid" value={report.paidGross} tone="ok" />
                <Figure label="Still outstanding" value={report.unpaidGross} tone="warn" />
              </div>
            </section>
          )}

          <Bucket
            title="Committed"
            note="Sold and expected, but the trip has not happened yet."
            bucket={report.committed}
            vatPercent={null}
          />
          <Bucket
            title="No-show"
            note="Kept separate on purpose: whether these are charged or written off is your accountant's call, so nothing here folds them into revenue."
            bucket={report.noShow}
            vatPercent={null}
          />
          <Bucket
            title="Cancelled"
            note="Shown for completeness. Never counted as revenue anywhere above."
            bucket={report.cancelled}
            vatPercent={null}
          />

          {report.completed.bookings === 0 &&
            report.committed.bookings === 0 &&
            report.noShow.bookings === 0 &&
            report.cancelled.bookings === 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">
                No bookings in this period.
              </div>
            )}
        </>
      ) : null}
    </div>
  )
}

const selectClass =
  'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#33bbcf] focus:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function Figure({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
          tone === 'ok' ? 'text-emerald-400' : 'text-amber-300'
        }`}
      >
        {kr(value)} <span className="text-xs text-slate-500">NOK</span>
      </p>
    </div>
  )
}

function Bucket({
  title,
  note,
  bucket,
  vatPercent,
  accent = false,
}: {
  title: string
  note: string
  bucket: AccountingBucket
  vatPercent: number | null
  accent?: boolean
}) {
  if (bucket.rows.length === 0) return null

  const showVat = accent && vatPercent !== null && vatPercent > 0 && Number.isFinite(vatPercent)
  const net = showVat ? bucket.gross / (1 + vatPercent / 100) : null

  return (
    <section
      className={`rounded-2xl border p-6 ${
        accent ? 'border-[#33bbcf]/25 bg-[#33bbcf]/[0.04]' : 'border-white/10 bg-slate-900/50'
      }`}
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">{note}</p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Product', 'Bookings', 'Guests', 'Gross', 'Loyalty', 'Commission'].map((h, i) => (
                <th
                  key={h}
                  className={`pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${
                    i === 0 ? 'pr-4' : 'px-4 text-right'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bucket.rows.map((r) => (
              <tr key={r.item} className="border-b border-white/[0.06]">
                <td className="py-3 pr-4 font-medium text-white">{r.item}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">{r.bookings}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">{r.guests}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-white">{kr(r.gross)}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-400">
                  {r.loyaltyDiscount ? `−${kr(r.loyaltyDiscount)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-400">
                  {r.commission ? `−${kr(r.commission)}` : '—'}
                </td>
              </tr>
            ))}
            <tr className="border-t border-white/20">
              <td className="py-3 pr-4 font-semibold text-white">Total</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">{bucket.bookings}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">{bucket.guests}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-white">
                {kr(bucket.gross)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-400">
                {bucket.loyaltyDiscount ? `−${kr(bucket.loyaltyDiscount)}` : '—'}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-400">
                {bucket.commission ? `−${kr(bucket.commission)}` : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {showVat && net !== null && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Figure label="Gross" value={bucket.gross} tone="ok" />
          <Figure label={`Net (excl. ${vatPercent}%)`} value={net} tone="ok" />
          <Figure label="VAT" value={bucket.gross - net} tone="warn" />
        </div>
      )}
    </section>
  )
}
