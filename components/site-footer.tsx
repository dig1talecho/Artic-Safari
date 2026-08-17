import Link from 'next/link'

/**
 * One footer for the whole site.
 *
 * This markup used to be duplicated byte-for-byte in app/page.tsx and
 * site-shell.tsx, which meant the privacy link would have had to be added
 * twice and would have drifted the first time somebody edited one of them.
 */
export function SiteFooter() {
  return (
    <footer
      id="site-footer"
      className="relative z-10 mx-auto w-full max-w-7xl border-t border-[var(--home-border)] px-5 py-12 text-sm text-[var(--home-muted)]"
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <p>Artic Safari — Nordic VIP Private Tours &amp; Transit · Tromsø, Northern Norway</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/tours" className="transition-colors hover:text-[var(--home-accent)]">
            Tours
          </Link>
          <Link href="/blog" className="transition-colors hover:text-[var(--home-accent)]">
            Journal
          </Link>
          <Link href="/gallery" className="transition-colors hover:text-[var(--home-accent)]">
            Gallery
          </Link>
          <Link href="/about" className="transition-colors hover:text-[var(--home-accent)]">
            About
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-[var(--home-accent)]">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
