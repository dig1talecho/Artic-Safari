'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Menu, X, User, ArrowRight } from 'lucide-react'

const links = [
  { label: 'Tours', href: '/#tours' },
  { label: 'Charter', href: '/charter' },
  { label: 'Aurora Radar', href: '/#radar' },
  { label: 'Blog', href: '/blog' },
]

interface SiteHeaderProps {
  variant?: 'dark' | 'light'
}

export function SiteHeader({ variant = 'dark' }: SiteHeaderProps) {
  const isLight = variant === 'light'
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lock body scroll while the mobile panel is open so the page behind it
  // doesn't scroll along with the menu.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const barBg = isLight ? 'bg-[var(--home-glass)]' : 'bg-[#0b0e15]/70'
  const barBorder = isLight ? 'border-[var(--home-glass-border)]' : 'border-white/10'
  const textColor = isLight ? 'text-[var(--home-foreground)]' : 'text-foreground'
  const accentColor = isLight ? 'text-[var(--home-accent)]' : 'text-aurora'
  const navLinkClass = isLight
    ? 'text-[13px] uppercase tracking-[0.14em] text-[var(--home-muted)] hover:text-[var(--home-foreground)]'
    : 'text-sm text-muted-foreground hover:text-foreground'
  const secondaryBtnClass = isLight
    ? 'border-[var(--home-border)] text-[var(--home-foreground)] hover:border-[var(--home-accent)] hover:text-[var(--home-accent)]'
    : 'border-white/10 bg-white/[0.03] text-foreground backdrop-blur-xl hover:border-aurora/40 hover:text-aurora'
  const primaryBtnClass = isLight
    ? 'bg-[var(--home-accent)] text-white hover:opacity-90'
    : 'border border-white/10 bg-white/[0.03] text-foreground backdrop-blur-xl hover:border-aurora/40 hover:text-aurora'
  const mobilePanelClass = isLight
    ? 'border-[var(--home-glass-border)] bg-[var(--home-glass)]'
    : 'border-white/10 bg-[#0b0e15]/95'
  const mobileLinkClass = isLight
    ? 'text-[var(--home-muted)] hover:text-[var(--home-foreground)]'
    : 'text-muted-foreground hover:text-foreground'

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b ${barBg} backdrop-blur-xl backdrop-saturate-150 transition-[box-shadow,border-color] duration-300 ${
        scrolled ? `${barBorder} shadow-[0_8px_30px_-16px_rgba(0,0,0,0.6)]` : 'border-transparent shadow-none'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4">
        <a href="/" className="group flex items-center gap-2.5">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center transition-transform duration-300 group-hover:scale-105">
            <Image src="/logo.png" alt="Artic Safari Tour" width={40} height={40} className="h-10 w-10" priority />
          </span>
          <span
            className={`font-[family-name:var(--font-display)] text-[15px] uppercase tracking-tight ${textColor}`}
          >
            Artic <span className={accentColor}>Safari</span>
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`relative py-1 font-medium transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-300 hover:after:w-full ${navLinkClass}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <a
            href="/dashboard"
            className={`hidden items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-[color,border-color,scale] active:scale-[0.96] sm:flex ${secondaryBtnClass}`}
          >
            <User className="h-3.5 w-3.5" />
            My Bookings
          </a>
          <a
            href="/#tours"
            className={`rounded-xl px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide transition-[opacity,scale] active:scale-[0.96] ${primaryBtnClass}`}
          >
            Book Now
          </a>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors md:hidden ${secondaryBtnClass}`}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={`grid overflow-hidden backdrop-blur-xl backdrop-saturate-150 transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          mobileOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        } ${mobilePanelClass}`}
      >
        <div className="overflow-hidden">
          <nav className={`flex flex-col gap-1 border-t px-5 py-4 ${mobilePanelClass}`}>
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium uppercase tracking-[0.12em] transition-colors hover:bg-white/5 ${mobileLinkClass}`}
              >
                {l.label}
                <ArrowRight className="h-3.5 w-3.5 opacity-40" />
              </a>
            ))}
            <a
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`mt-2 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${secondaryBtnClass}`}
            >
              <User className="h-4 w-4" />
              My Bookings
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
