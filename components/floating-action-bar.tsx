import { MessageCircle, Phone, Headset } from 'lucide-react'

export function FloatingActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-1.5 rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] p-1.5 shadow-[0_16px_40px_-12px_rgba(33,31,27,0.25)]">
        <a
          href="https://wa.me/+4792997190"
          aria-label="Chat with us on WhatsApp"
          className="group flex items-center gap-2 rounded-full bg-[var(--home-accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
        <a
          href="tel:+4792997190"
          aria-label="Call dispatch"
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--home-foreground)] transition-colors hover:bg-[var(--home-surface-soft)]"
        >
          <Phone className="h-4 w-4 text-[var(--home-gold)]" />
          <span className="hidden sm:inline">Call Dispatch</span>
        </a>
        <button
          type="button"
          aria-label="Open live support"
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--home-foreground)] transition-colors hover:bg-[var(--home-surface-soft)]"
        >
          <Headset className="h-4 w-4 text-[var(--home-gold)]" />
          <span className="hidden sm:inline">Live Support</span>
        </button>
        <span className="mx-1 hidden h-6 w-px bg-[var(--home-border)] sm:block" />
        <span className="hidden items-center gap-1.5 rounded-full bg-[var(--home-surface-soft)] px-3.5 py-2.5 font-mono text-xs text-[var(--home-muted)] sm:flex">
          NOK kr
        </span>
      </div>
    </div>
  )
}
