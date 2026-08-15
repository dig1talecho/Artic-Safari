'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, ArrowRight, ShieldCheck, Zap, MessageCircle } from 'lucide-react'
import { DispatchConsole } from './dispatch-console'
import type { Tour } from '@/services/tours.service'

const headline = [
  { word: 'Private', accent: false },
  { word: 'Northern', accent: false },
  { word: 'Lights', accent: false },
  { word: 'Tours', accent: true },
  { word: 'in', accent: true },
  { word: 'Tromsø', accent: true },
]

function SplitHeadline() {
  const reduceMotion = useReducedMotion()

  return (
    <h1 className="mt-3 flex flex-wrap justify-center gap-x-3 text-balance font-[family-name:var(--font-display)] text-4xl italic leading-[1.1] tracking-tight text-[var(--home-foreground)] sm:text-6xl lg:text-7xl">
      {headline.map(({ word, accent }, i) => (
        <span key={word} className="overflow-hidden py-1">
          <motion.span
            className={`inline-block ${accent ? 'text-[var(--home-accent)]' : ''}`}
            initial={reduceMotion ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

const trustBadges = [
  { icon: ShieldCheck, label: 'Secure Booking' },
  { icon: Zap, label: 'Instant Confirmation Request' },
  { icon: MessageCircle, label: 'WhatsApp Support' },
] as const

function HeroIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] w-full sm:h-[520px]"
    >
      <defs>
        <linearGradient id="heroAuroraGreen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--home-accent)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--home-accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--home-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="heroAuroraGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--home-gold)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--home-gold)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--home-gold)" stopOpacity="0" />
        </linearGradient>
        <filter id="heroAuroraBlur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* aurora ribbons */}
      <path
        d="M -50 90 C 200 20, 400 140, 620 60 S 1000 20, 1250 100"
        fill="none"
        stroke="url(#heroAuroraGreen)"
        strokeWidth="70"
        filter="url(#heroAuroraBlur)"
      />
      <path
        d="M -50 150 C 250 90, 450 200, 700 120 S 1050 80, 1250 170"
        fill="none"
        stroke="url(#heroAuroraGold)"
        strokeWidth="55"
        filter="url(#heroAuroraBlur)"
      />

      {/* mountain silhouette */}
      <path
        d="M -20 400 L 120 260 L 220 330 L 340 190 L 460 320 L 560 240 L 680 360 L 800 220 L 920 340 L 1040 250 L 1160 380 L 1220 340 L 1220 420 L -20 420 Z"
        fill="var(--home-foreground)"
        fillOpacity="0.05"
      />
    </svg>
  )
}

interface HeroProps {
  toursBySlug?: Record<string, Tour>
}

export function Hero({ toursBySlug = {} }: HeroProps) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 pt-10 sm:pt-16">
      <HeroIllustration />

      {/* Contrast lift -- a soft warm-white pool behind the live-status pill
          and headline so they stay crisp over the aurora ribbons rather
          than blending into them. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] w-full bg-[radial-gradient(ellipse_65%_55%_at_50%_30%,var(--home-bg),transparent_72%)] opacity-90 sm:h-[560px]"
      />

      {/* Live status pill */}
      <div className="animate-float-up flex justify-center">
        <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-[var(--home-foreground)] bg-[var(--home-surface)] px-4 py-1.5 shadow-[0_1px_2px_rgba(38,36,31,0.04)]">
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
        <SplitHeadline />
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
            className="group inline-flex items-center gap-2 rounded-xl bg-[var(--home-accent)] px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_1px_2px_rgba(38,36,31,0.08)] transition-[opacity,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_16px_28px_-10px_rgba(47,75,60,0.45)] active:translate-y-0 active:scale-[0.98]"
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
        <DispatchConsole toursBySlug={toursBySlug} />
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
