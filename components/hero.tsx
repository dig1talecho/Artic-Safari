'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, ArrowRight, ArrowUpRight } from 'lucide-react'
import { DispatchConsole } from './dispatch-console'
import type { Tour } from '@/services/tours.service'

export interface HeroCopy {
  statusBadge: string
  headline: string
  ctaPrimary: string
  rightEyebrow: string
  rightHeading: string
  rightBody: string
  rightCta: string
  statExperiences: string
}

/** Split on spaces at render time so an edited headline still animates. */
function SplitHeadline({ text }: { text: string }) {
  const reduceMotion = useReducedMotion()
  const headline = text.split(/\s+/).filter(Boolean)

  return (
    <h1 className="flex flex-wrap gap-x-3 text-balance font-[family-name:var(--font-display)] text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[56px] lg:text-[68px] lg:leading-[1.05]">
      {headline.map((word, i) => (
        <span key={word + i} className="overflow-hidden py-1">
          <motion.span
            className="inline-block"
            initial={reduceMotion ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

// Real, verifiable numbers only -- no invented "10,000+ happy guests"
// style stats. 5 live products, the lowest published rate, and Tromsø's
// actual coordinates.
/**
 * Only the latitude is a constant -- it is a fact about Tromso. The other
 * two are live figures passed in from the server, because a hardcoded
 * price on a homepage goes stale the first time you change a rate and
 * nobody notices for months.
 */
function buildStats(startingFrom: number | null, tourCount: number | null, statLabel: string) {
  return [
    tourCount ? { value: String(tourCount), label: 'Experiences' } : null,
    startingFrom ? { value: `${startingFrom} kr`, label: 'Starting From' } : null,
    { value: '69.65°N', label: statLabel },
  ].filter((s): s is { value: string; label: string } => s !== null)
}

interface HeroProps {
  /** Cheapest possible fare, from the live pricing rules. */
  startingFrom?: number | null
  tourCount?: number | null
  copy: HeroCopy
  toursBySlug?: Record<string, Tour>
}

export function Hero({ toursBySlug = {}, startingFrom = null, tourCount = null, copy }: HeroProps) {
  const stats = buildStats(startingFrom, tourCount, copy.statExperiences)
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 pt-8 sm:pt-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-6">
        {/* Left column */}
        {/* order-1 on a phone: headline first, as it should be. */}
        <div className="animate-float-up order-1 lg:order-none">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--home-gold)]" />
            <span className="flex items-center gap-1.5 text-xs font-medium text-white/80">
              <Activity className="h-3.5 w-3.5 text-[var(--home-accent)]" />
              {copy.statusBadge}
              <span className="font-mono text-[var(--home-gold)]">KP 5.6</span>
            </span>
          </div>

          <div className="mt-6">
            <SplitHeadline text={copy.headline} />
          </div>

          <a
            href="#tours"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white"
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-full text-[var(--home-bg)] transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: 'var(--home-gradient-cta)' }}
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
            {copy.ctaPrimary}
          </a>

          {/* Real stats -- see comment above */}
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-white/10 pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        {/*
          order-3 on a phone, so the taxi panel comes before the tour pitch
          and its photo. Below lg the grid collapses to one column, which
          put the console under both columns -- and the person who needs a
          taxi is on a phone, at the airport, in the cold. On lg and up the
          two-column layout is unaffected: order only matters while these
          are stacked.
        */}
        <div className="animate-float-up order-3 flex flex-col lg:order-none" style={{ animationDelay: '0.15s' }}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
            {copy.rightEyebrow}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug tracking-[-0.01em] text-white sm:text-3xl">
            {copy.rightHeading}
          </h2>
          <p className="mt-4 max-w-md text-pretty leading-relaxed text-white/60">
            {copy.rightBody}
          </p>

          <div className="relative mt-6 flex-1 overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/10">
            <Image
              src="/aurora-hero.webp"
              alt="Private Northern Lights tour over an Arctic fjord near Tromsø, Norway"
              width={1024}
              height={1024}
              priority
              className="h-[220px] w-full object-cover sm:h-[280px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--home-bg)]/60 via-transparent to-transparent" />
          </div>

          <a
            href="#tours"
            className="group mt-6 inline-flex items-center justify-center gap-2 self-start rounded-[10px] px-6 py-4 text-sm font-medium text-[var(--home-bg)] shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-[opacity,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-10px_rgba(51,187,207,0.5)]"
            style={{ backgroundImage: 'var(--home-gradient-cta)' }}
          >
            {copy.rightCta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
        {/*
          Inside the grid, not after it, so `order` can do its job. Below
          lg the grid is a single column and this sits second: headline,
          taxi panel, then the tour pitch and its photo. Previously it came
          after both columns, which on a phone meant scrolling past a
          220px image to reach the thing an arriving guest needs most.

          On lg and up it spans both columns and drops back to source
          order, so the desktop layout is exactly as before.
        */}
        <div className="order-2 mx-auto mt-14 w-full max-w-4xl px-1 lg:order-none lg:col-span-2">
          <DispatchConsole />
        </div>
      </div>
    </section>
  )
}
