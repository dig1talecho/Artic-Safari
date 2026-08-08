import Image from 'next/image'
import { Activity, ArrowRight } from 'lucide-react'
import { DispatchConsole } from './dispatch-console'

export function Hero() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 pt-10 sm:pt-16">
      {/* Live status pill */}
      <div className="animate-float-up flex justify-center">
        <div className="glass inline-flex items-center gap-2.5 rounded-full border border-aurora/30 px-4 py-1.5">
          <span className="live-dot h-2 w-2 rounded-full bg-aurora" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/90">
            <Activity className="h-3.5 w-3.5 text-aurora" />
            LIVE STATUS: High Aurora Activity Expected Tonight
            <span className="font-mono text-aurora">(KP 5.6)</span>
          </span>
        </div>
      </div>

      {/* Headline */}
      <div className="mx-auto mt-8 max-w-4xl text-center">
        <h1
          className="animate-float-up text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          style={{ animationDelay: '0.1s' }}
        >
          Arctic Safari: Chasing Auroras in{' '}
          <span className="bg-gradient-to-r from-aurora via-aurora to-violet bg-clip-text text-transparent">
            First-Class Comfort
          </span>
        </h1>
        <p
          className="animate-float-up mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: '0.2s' }}
        >
          Exclusive Northern Lights expeditions and private VIP airport transfers in Northern Norway.
        </p>

        <div
          className="animate-float-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: '0.25s' }}
        >
          <a
            href="#tours"
            className="group inline-flex items-center gap-2 rounded-full bg-violet px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_36px_-6px_rgba(110,58,255,0.85)]"
          >
            Book VIP Tour
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#tours"
            className="glass inline-flex items-center gap-2 rounded-full border border-white/12 px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-white/25"
          >
            Quick Transfer
          </a>
        </div>
      </div>

      {/* Hero image band */}
      <div
        className="animate-float-up relative mx-auto mt-12 overflow-hidden rounded-[1.75rem] border border-white/10"
        style={{ animationDelay: '0.3s' }}
      >
        <Image
          src="/aurora-hero.png"
          alt="Northern lights over an Arctic Norwegian fjord at night"
          width={1600}
          height={720}
          priority
          className="h-[240px] w-full object-cover sm:h-[380px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Dispatch console overlapping */}
      <div className="relative z-10 mx-auto -mt-16 max-w-4xl px-1 sm:-mt-20">
        <DispatchConsole />
      </div>
    </section>
  )
}
