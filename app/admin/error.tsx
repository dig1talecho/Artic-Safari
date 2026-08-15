'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#00040f] px-5 text-center text-slate-100">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-rose-400">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="text-xl font-bold text-white">Operations console error</h1>
      <p className="max-w-md text-sm text-slate-400">
        Something broke in the admin dashboard. Booking data is unaffected — try reloading this
        view.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-xl bg-[#33bbcf] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#33bbcf]/90"
      >
        Try Again
      </button>
    </main>
  )
}
