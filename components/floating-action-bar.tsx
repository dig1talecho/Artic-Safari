'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Phone, Headset, CalendarCheck } from 'lucide-react'

/**
 * Hides on scroll-down and whenever the page footer approaches the
 * viewport (via IntersectionObserver on #site-footer, with a rootMargin
 * buffer so it tucks away before it would ever overlap the footer text).
 * Reappears on scroll-up, as long as the footer isn't the reason it's
 * hidden.
 */
export function FloatingActionBar() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const footerNear = useRef(false)

  useEffect(() => {
    lastY.current = window.scrollY

    let ticking = false
    const evaluate = () => {
      const y = window.scrollY
      const delta = y - lastY.current

      if (footerNear.current) {
        setHidden(true)
      } else if (delta > 6 && y > 140) {
        setHidden(true)
      } else if (delta < -6 || y < 40) {
        setHidden(false)
      }

      lastY.current = y
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(evaluate)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const footer = document.getElementById('site-footer')
    if (!footer) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        footerNear.current = entry.isIntersecting
        setHidden(entry.isIntersecting)
      },
      // Positive bottom margin makes the footer "count" as visible ~120px
      // before it actually enters the viewport, so the bar has finished
      // sliding away by the time the user reaches it.
      { rootMargin: '0px 0px 120px 0px', threshold: 0 },
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        hidden ? 'pointer-events-none translate-y-[calc(100%+1.5rem)] opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--home-glass-border)] bg-[var(--home-glass)] p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl backdrop-saturate-150 sm:gap-1.5">
        <a
          href="#tours"
          aria-label="Book now"
          className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--home-gold)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
        >
          <CalendarCheck className="h-4 w-4 shrink-0" />
          Book Now
        </a>
        <span className="mx-0.5 h-6 w-px shrink-0 bg-[var(--home-border)]" />
        <a
          href="https://wa.me/+4792997190"
          aria-label="Chat with us on WhatsApp"
          className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--home-accent)] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
        <a
          href="tel:+4792997190"
          aria-label="Call dispatch"
          className="flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-[var(--home-foreground)] transition-colors hover:bg-[var(--home-surface-soft)]"
        >
          <Phone className="h-4 w-4 shrink-0 text-[var(--home-gold)]" />
          <span className="hidden sm:inline">Call Dispatch</span>
        </a>
        <button
          type="button"
          aria-label="Open live support"
          className="flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-[var(--home-foreground)] transition-colors hover:bg-[var(--home-surface-soft)]"
        >
          <Headset className="h-4 w-4 shrink-0 text-[var(--home-gold)]" />
          <span className="hidden sm:inline">Live Support</span>
        </button>
        <span className="mx-1 hidden h-6 w-px shrink-0 bg-[var(--home-border)] sm:block" />
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[var(--home-surface-soft)] px-3.5 py-3 font-mono text-xs text-[var(--home-muted)] sm:flex">
          NOK kr
        </span>
      </div>
    </div>
  )
}
