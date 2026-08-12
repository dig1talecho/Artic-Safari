import Image from 'next/image'
import { Activity, ArrowRight, ShieldCheck, Zap, MessageCircle } from 'lucide-react'
import { DispatchConsole } from './dispatch-console'

const trustBadges = [
  { icon: ShieldCheck, label: 'Secure Booking' },
  { icon: Zap, label: 'Instant Confirmation Request' },
  { icon: MessageCircle, label: 'WhatsApp Support' },
] as const

export function Hero() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 pt-10 sm:pt-16">
      {/* Live status pill */}
      <div className="animate-float-up flex justify-center">
        <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-[var(--home-foreground)] bg-[var(--home-surface)] px-4 py-1.5 shadow-[0_1px_2px_rgba(11,31,42,0.04)]">
          <span className="live-dot h-2 w-2 rounded-full bg-[var(--home-gold)]" />
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--home-foreground)]">
            <Activity className="h-3.5 w-3.5 text-[var(--home-accent)]" />
            High Aurora Activity Expected Tonight
            <span className="font-mono text-[var(--home-gold)]">(KP 5.6)</span>
          </span>
        </div>
      </div>

      {/* Headline */}
      <div className="mx-auto mt-10 max-w-4xl text-center">
        <p
          className="animate-float-up text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]"
          style={{ animationDelay: '0.05s' }}
        >
          Chasing Auroras in First-Class Comfort
        </p>
        <h1
          className="animate-float-up mt-3 text-balance font-[family-name:var(--font-display)] text-4xl uppercase leading-[1.05] tracking-tight text-[var(--home-foreground)] sm:text-6xl lg:text-7xl"
          style={{ animationDelay: '0.1s' }}
        >
          Private Northern Lights{' '}
          <span className="text-[var(--home-accent)]">Tours in Tromsø</span>
        </h1>
        <p
          className="animate-float-up mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-[var(--home-muted)] sm:text-lg"
          style={{ animationDelay: '0.2s' }}
        >
          Exclusive private Northern Lights tours and VIP airport transfers in Tromsø, Northern Norway.
        </p>

        <div
          className="animate-float-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: '0.25s' }}
        >
          <a
            href="#tours"
            className="group inline-flex items-center gap-2 rounded-xl bg-[var(--home-accent)] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_6px_0_0_#0876a8] transition-[opacity,scale,box-shadow] hover:opacity-90 active:translate-y-1 active:scale-[0.98] active:shadow-[0_2px_0_0_#0876a8]"
          >
            Book VIP Tour
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#tours"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--home-foreground)] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[var(--home-foreground)] transition-[background-color,scale] hover:bg-[var(--home-foreground)] hover:text-white active:scale-[0.96]"
          >
            Quick Transfer
          </a>
        </div>
      </div>

      {/* Hero image band */}
      <div
        className="animate-float-up relative mx-auto mt-14 overflow-hidden rounded-[1.75rem] ring-1 ring-inset ring-black/10"
        style={{ animationDelay: '0.3s' }}
      >
        <Image
          src="/aurora-hero.webp"
          alt="Private Northern Lights tour over an Arctic fjord near Tromsø, Norway"
          width={1024}
          height={1024}
          priority
          className="h-[260px] w-full object-cover sm:h-[420px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--home-bg)] via-transparent to-transparent" />
      </div>

      {/* Dispatch console overlapping */}
      <div className="relative z-10 mx-auto -mt-16 max-w-4xl px-1 sm:-mt-20">
        <DispatchConsole />
      </div>

      {/* Trust badges */}
      <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-1">
        {trustBadges.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--home-muted)]"
          >
            <Icon className="h-3.5 w-3.5 text-[var(--home-accent)]" />
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}
