import { Snowflake } from 'lucide-react'

const links = [
  { label: 'Tours', href: '#tours' },
  { label: 'Aurora Radar', href: '#radar' },
  { label: 'Transfers', href: '#tours' },
]

export function SiteHeader() {
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

      <a
        href="#tours"
        className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground backdrop-blur-xl transition-colors hover:border-aurora/40 hover:text-aurora"
      >
        Book Now
      </a>
    </header>
  )
}
