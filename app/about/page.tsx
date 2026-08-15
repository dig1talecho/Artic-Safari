import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass, Radar, MessageCircle, ShieldCheck, MapPin, Phone, ArrowRight } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export const metadata: Metadata = {
  title: 'About Us | Artic Safari',
  description:
    'Artic Safari is a private tour operator based in Tromsø, Norway, running small-group Northern Lights chases and VIP airport transfers.',
}

const stats = [
  { value: '5', label: 'Experiences' },
  { value: '490 kr', label: 'Starting From' },
  { value: '69.65°N', label: 'Arctic Circle' },
]

const approach = [
  {
    icon: Radar,
    title: 'Weather-informed routing',
    description:
      'Our Aurora Radar tracks live NOAA and Open-Meteo data, so private group departures are timed around where the sky is actually clear -- not a fixed schedule.',
  },
  {
    icon: Compass,
    title: 'Small groups, real chauffeurs',
    description:
      'Private and small-group departures with a dedicated driver-guide, not a coach seat -- capped at 8 guests for our largest tour.',
  },
  {
    icon: MessageCircle,
    title: 'A real person on WhatsApp',
    description:
      'Every booking request is confirmed directly by our dispatch team over WhatsApp -- no call centers, no third-party resellers.',
  },
  {
    icon: ShieldCheck,
    title: 'Straightforward pricing',
    description:
      'Prices shown on the site are the prices you pay. No hidden booking fees, no bait-and-switch upsells at pickup.',
  },
]

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-10 sm:pt-16">
        <div className="max-w-2xl border-b border-[var(--home-border)] pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">About Us</p>
          <h1 className="mt-3 text-balance font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--home-foreground)] sm:text-5xl">
            A private tour operator based in Tromsø
          </h1>
          <p className="mt-5 max-w-xl text-pretty leading-relaxed text-[var(--home-muted)]">
            Artic Safari runs private and small-group Northern Lights chases, VIP airport transfers, and
            scenic coastal tours out of Tromsø, in the heart of the Arctic Circle. Every trip is a
            private, chauffeured departure -- no packed coach buses, no fixed itinerary regardless of
            the sky.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 border-b border-[var(--home-border)] pb-10 sm:max-w-md">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--home-foreground)] sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--home-muted)]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--home-foreground)]">
            How we work
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {approach.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col rounded-[20px] border border-white/5 p-6 shadow-[var(--home-card-shadow)]"
                style={{ backgroundImage: 'var(--home-gradient-card)' }}
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--home-bg)]"
                  style={{ backgroundImage: 'var(--home-gradient-cta)' }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--home-foreground)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--home-muted)]">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 rounded-[24px] border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--home-foreground)]">
              Where to find us
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--home-muted)]">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--home-accent)]" />
                Tromsø, Northern Norway
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[var(--home-accent)]" />
                <a href="https://wa.me/4792997190" className="hover:text-[var(--home-foreground)]">
                  +47 929 97 190 (WhatsApp)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <InstagramIcon className="h-4 w-4 shrink-0 text-[var(--home-accent)]" />
                <a
                  href="https://instagram.com/articsafaritour"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--home-foreground)]"
                >
                  @articsafaritour
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:items-end">
            <p className="text-sm text-[var(--home-muted)] sm:text-right">
              Ready to see the Arctic sky for yourself?
            </p>
            <div className="flex gap-3 sm:justify-end">
              <Link
                href="/tours"
                className="group inline-flex items-center gap-2 rounded-[10px] bg-[image:var(--home-gradient-cta)] px-6 py-3 text-sm font-semibold text-[var(--home-bg)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-10px_rgba(51,187,207,0.5)] active:translate-y-0 active:scale-[0.98]"
              >
                Browse Tours
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
