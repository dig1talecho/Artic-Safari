import { Snowflake, User } from 'lucide-react'

const links = [
  { label: 'Tours', href: '#tours' },
  { label: 'Aurora Radar', href: '#radar' },
  { label: 'Transfers', href: '#tours' },
]

interface SiteHeaderProps {
  variant?: 'dark' | 'light'
}

export function SiteHeader({ variant = 'dark' }: SiteHeaderProps) {
  if (variant === 'light') {
    return (
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-7">
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] text-[var(--home-accent)]">
            <Snowflake className="h-4 w-4" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[16px] tracking-tight text-[var(--home-foreground)]">
            Artic <span className="italic text-[var(--home-muted)]">Safari</span>
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[13px] uppercase tracking-[0.14em] text-[var(--home-muted)] transition-colors hover:text-[var(--home-foreground)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="hidden items-center gap-1.5 rounded-full border border-[var(--home-border)] px-4 py-2 text-[13px] font-medium text-[var(--home-foreground)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)] sm:flex"
          >
            <User className="h-3.5 w-3.5" />
            My Bookings
          </a>
          <a
            href="#tours"
            className="rounded-full bg-[var(--home-accent)] px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Book Now
          </a>
        </div>
      </header>
    )
  }

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6">
      <a href="#" className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-aurora">
          <Snowflake className="h-5 w-5" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          Artic<span className="text-muted-foreground"> Safari</span>
        </span>
      </a>

      <nav className="hidden items-center gap-8 md:flex">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <a
          href="/dashboard"
          className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-xl transition-colors hover:border-aurora/40 hover:text-aurora sm:flex"
        >
          <User className="h-3.5 w-3.5" />
          My Bookings
        </a>
        <a
          href="#tours"
          className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-xl transition-colors hover:border-aurora/40 hover:text-aurora"
        >
          Book Now
        </a>
      </div>
    </header>
  )
}
