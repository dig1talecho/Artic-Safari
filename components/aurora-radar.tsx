import { Cloud, Gauge, Radar, AlertCircle } from 'lucide-react'
import { getAuroraConditions } from '@/services/aurora.service'
import { AuroraWaveform } from './aurora-waveform'

export async function AuroraRadar() {
  const conditions = await getAuroraConditions()

  return (
    <section id="radar" className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24">
      <div className="overflow-hidden rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 shadow-[0_2px_24px_-8px_rgba(11,31,42,0.08)] sm:p-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--home-accent)]">
              <Radar className="h-4 w-4" />
              Live Aurora Radar
            </p>
            <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-2xl text-[var(--home-foreground)] sm:text-3xl">
              Tonight&apos;s aurora forecast over Tromsø
            </h2>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-[var(--home-border)] bg-[var(--home-surface-soft)] px-3 py-1.5 text-xs text-[var(--home-foreground)]">
            <span className="live-dot h-2 w-2 rounded-full bg-[var(--home-gold)]" />
            NOAA SWPC &amp; Open-Meteo
          </span>
        </div>

        {!conditions ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-6 text-sm text-[var(--home-muted)]">
            <AlertCircle className="h-5 w-5 shrink-0 text-[var(--home-gold)]" />
            Aurora data is temporarily unavailable (NOAA/weather feed did not respond). Try again shortly.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <Stat
                icon={<Gauge className="h-4 w-4" />}
                label="Current KP Index"
                value={conditions.currentKp.toFixed(2)}
                note={conditions.kpLabel}
                tone="accent"
              />
              <Stat
                icon={<Cloud className="h-4 w-4" />}
                label="Cloud Coverage"
                value={`${Math.round(conditions.cloudCoverPercent)}%`}
                note={conditions.cloudLabel}
                tone="gold"
              />
              <Stat
                icon={<Radar className="h-4 w-4" />}
                label="Aurora Probability"
                value={`${Math.round(conditions.auroraProbability)}%`}
                note={conditions.peakWindow ? `Peak forecast ${formatHour(conditions.peakWindow.time)}` : 'NOAA OVATION'}
                tone="accent"
              />
            </div>

            {conditions.forecast.length > 0 && (
              <div className="mt-6 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--home-foreground)]">
                    NOAA Kp forecast (next 24h)
                  </span>
                  <span className="text-xs text-[var(--home-muted)]">Local time · Kp (0–9)</span>
                </div>
                <AuroraWaveform forecast={conditions.forecast} currentKp={conditions.currentKp} />
                <div className="flex justify-between px-1">
                  {conditions.forecast.map((h) => (
                    <span key={h.time} className="font-mono text-[10px] text-[var(--home-muted)] tabular-nums">
                      {formatHour(h.time)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function Stat({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
  tone: 'accent' | 'gold'
}) {
  const toneClass = tone === 'accent' ? 'text-[var(--home-accent)]' : 'text-[var(--home-gold)]'
  return (
    <div className="rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-5">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--home-muted)]">
        <span className={toneClass}>{icon}</span>
        {label}
      </p>
      <p className="mt-3 font-mono text-4xl font-semibold tracking-tight text-[var(--home-foreground)] tabular-nums">
        {value}
      </p>
      <p className={`mt-1 text-sm ${toneClass}`}>{note}</p>
    </div>
  )
}
