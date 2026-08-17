import Link from 'next/link'

/**
 * Notice shown where personal data is actually collected.
 *
 * GDPR Article 13 requires people to be told what happens to their data
 * *at the moment they hand it over*, not only on a page they might never
 * visit. This is deliberately a plain sentence with a link, not a tick-box
 * — consent is not the lawful basis for a booking (performing the contract
 * is), so demanding a tick would misrepresent why we may hold the data.
 */
export function PrivacyNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-[var(--home-muted)] ${className}`}>
      We use your name, contact details and pickup address only to arrange this trip. See our{' '}
      <Link
        href="/privacy"
        className="underline underline-offset-2 transition-colors hover:text-[var(--home-accent)]"
      >
        Privacy Policy
      </Link>
      .
    </p>
  )
}
