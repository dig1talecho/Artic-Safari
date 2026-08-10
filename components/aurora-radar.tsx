import { Cloud, Gauge, Radar } from 'lucide-react'

const hours = [
  { t: '18', p: 35 },
  { t: '19', p: 52 },
  { t: '20', p: 61 },
  { t: '21', p: 78 },
  { t: '22', p: 92 },
  { t: '23', p: 88 },
  { t: '00', p: 74 },
  { t: '01', p: 58 },
]

const max = 100

export function AuroraRadar() {
  return (
    <section id="radar" className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24">
      <div className="overflow-hidden rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 shadow-[0_2px_24px_-8px_rgba(33,31,27,0.08)] sm:p-8">
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
            Updated moments ago
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Stat
            icon={<Gauge className="h-4 w-4" />}
            label="Current KP Index"
            value="5.6"
            note="High activity"
            tone="accent"
          />
          <Stat
            icon={<Cloud className="h-4 w-4" />}
            label="Cloud Coverage"
            value="12%"
            note="Clear skies"
            tone="gold"
          />
          <Stat
            icon={<Radar className="h-4 w-4" />}
            label="Peak Window"
            value="22:00"
            note="92% probability"
            tone="accent"
          />
        </div>

        {/* Hourly probability graph */}
        <div className="mt-6 rounded-2xl border border-[var(--home-border)] bg-[var(--home-surface-soft)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--home-foreground)]">Hourly aurora probability</span>
            <span className="text-xs text-[var(--home-muted)]">Local time · %</span>
          </div>
          <div className="flex h-44 items-stretch gap-2 sm:gap-3">
            {hours.map((h) => (
              <div key={h.t} className="flex h-full flex-1 flex-col items-center gap-2">
                <span className="font-mono text-[10px] text-[var(--home-muted)] tabular-nums">
                  {h.p}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[var(--home-accent)]/40 to-[var(--home-accent)] transition-all"
                    style={{ height: `${(h.p / max) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-[var(--home-muted)] tabular-nums">
                  {h.t}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
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
