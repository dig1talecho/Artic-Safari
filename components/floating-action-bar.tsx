import { MessageCircle, Phone, Headset } from 'lucide-react'

export function FloatingActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="glass flex items-center gap-1.5 rounded-full border border-white/12 p-1.5 shadow-2xl shadow-black/50">
        <a
          href="https://wa.me/+4792997190"
          className="group flex items-center gap-2 rounded-full bg-aurora px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:shadow-[0_0_24px_-4px_rgba(0,255,163,0.7)]"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
        <a
          href="tel:+4792997190"
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.06]"
        >
          <Phone className="h-4 w-4 text-violet" />
          <span className="hidden sm:inline">Call Dispatch</span>
        </a>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.06]"
        >
          <Headset className="h-4 w-4 text-violet" />
          <span className="hidden sm:inline">Live Support</span>
        </button>
        <span className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />
        <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.04] px-3.5 py-2.5 font-mono text-xs text-muted-foreground sm:flex">
          NOK kr
        </span>
      </div>
    </div>
  )
}
