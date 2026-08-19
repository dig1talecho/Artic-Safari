import { ShieldIcon, BoltIcon, WhatsAppIcon } from '@/components/trust-icons'
import { getSiteContent } from '@/lib/get-site-content'
import { getAuroraConditions } from '@/services/aurora.service'
import { Compass, Car, Flame } from 'lucide-react'

/**
 * Why Artic Safari.
 *
 * This was three flat cards about transaction mechanics -- secure booking,
 * fast confirmation, WhatsApp support. Every booking site on earth says
 * those things, so they persuaded nobody.
 *
 * The real anxiety behind a Northern Lights booking is "what if we don't
 * see anything?". The strongest answer to that is not a claim, it is
 * evidence: the site already pulls live Kp and cloud figures from NOAA and
 * Open-Meteo, so tonight's actual conditions can sit right next to the
 * promise about routing around them.
 *
 * The layout is deliberately asymmetric. Three equal cards give three
 * claims equal weight; a business has one best argument and it should look
 * like it. The live panel leads, the supporting reasons follow, and the
 * hygiene facts shrink to a single quiet line.
 *
 * Icons stay in code. An icon is a design decision, and putting one behind
 * a text box invites a broken layout the first time somebody pastes an
 * emoji into it.
 */
export async function TrustFeatures() {
  const [content, conditions] = await Promise.all([getSiteContent(), getAuroraConditions()])

  const reasons = [
    { Icon: Car, titleKey: 'trust.card1.title', bodyKey: 'trust.card1.body' },
    { Icon: Flame, titleKey: 'trust.card2.title', bodyKey: 'trust.card2.body' },
    { Icon: WhatsAppIcon, titleKey: 'trust.card3.title', bodyKey: 'trust.card3.body' },
  ] as const

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
          {content('trust.eyebrow')}
        </p>
        <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.01em] text-white sm:text-4xl">
          {content('trust.heading')}
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-white/60">{content('trust.intro')}</p>
      </div>

      {/*
        The lead argument, with live numbers instead of adjectives. Falls
        back to the claim alone when the feeds are unreachable: an empty
        panel would be worse than a quiet one, and an invented Kp value
        would be worse than both.
      */}
      <div className="mt-10 overflow-hidden rounded-[24px] border border-[rgba(148,226,245,0.16)] bg-[rgba(10,26,34,0.55)] shadow-[0_24px_70px_-24px_rgba(0,0,0,0.75),0_0_48px_-18px_rgba(103,232,249,0.3)] backdrop-blur-xl lg:grid lg:grid-cols-[1.15fr_1fr]">
        <div className="p-7 sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(103,232,249,0.3)] bg-[rgba(34,211,238,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a5f3fc]">
            <Compass className="h-3.5 w-3.5" />
            {content('trust.lead.eyebrow')}
          </span>
          <h3 className="mt-4 text-balance font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-white sm:text-[28px]">
            {content('trust.lead.title')}
          </h3>
          <p className="mt-3 max-w-md text-pretty leading-relaxed text-white/60">
            {content('trust.lead.body')}
          </p>
        </div>

        <div className="border-t border-[rgba(148,226,245,0.12)] bg-[rgba(6,18,26,0.5)] p-7 sm:p-9 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7dd3e8]">
            {content('trust.lead.liveLabel')}
          </p>

          {conditions ? (
            <>
              {/*
                Probability leads because it is the number a guest can
                actually read. Kp is the physics behind it and cloud cover
                is what decides whether any of it is visible -- all three
                together are the whole argument, and none of them are ours
                to spin.
              */}
              <div className="mt-5 grid grid-cols-3 gap-4">
                <Reading
                  value={String(Math.round(conditions.auroraProbability))}
                  unit="%"
                  label="Aurora overhead"
                  bright
                />
                <Reading
                  value={conditions.currentKp.toFixed(1)}
                  unit="Kp"
                  label={conditions.kpLabel}
                />
                <Reading
                  value={String(Math.round(conditions.cloudCoverPercent))}
                  unit="%"
                  label={conditions.cloudLabel}
                />
              </div>
              {/*
                Right now is often a poor night -- that is weather, and
                hiding it would defeat the point of showing real data. The
                forecast peak is what a guest booking for later actually
                needs, and it turns an honest bad number into a useful one
                instead of a reason to close the tab.
              */}
              {conditions.peakWindow ? (
                <p className="mt-5 flex items-baseline justify-between gap-3 border-t border-[rgba(148,226,245,0.12)] pt-4">
                  <span className="text-[11px] uppercase tracking-wider text-white/40">
                    {content('trust.lead.peakLabel')}
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-sm font-semibold text-[#a5f3fc]">
                      Kp {conditions.peakWindow.kp.toFixed(1)}
                    </span>
                    <span className="block text-[11px] text-white/40">
                      {new Intl.DateTimeFormat('en-GB', {
                        timeZone: 'Europe/Oslo',
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(conditions.peakWindow.time))}
                    </span>
                  </span>
                </p>
              ) : null}

              <p className="mt-4 border-t border-[rgba(148,226,245,0.12)] pt-4 text-[11px] leading-relaxed text-white/40">
                {content('trust.lead.liveNote')}
              </p>
            </>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-white/50">
              {content('trust.lead.liveUnavailable')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {reasons.map(({ Icon, titleKey, bodyKey }) => (
          <div
            key={titleKey}
            className="group flex flex-col rounded-[20px] p-6 shadow-[var(--home-card-shadow)] transition-transform duration-300 hover:-translate-y-1"
            style={{ backgroundImage: 'var(--home-gradient-card)' }}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#04212b]"
              style={{
                backgroundImage:
                  'radial-gradient(120% 100% at 25% 12%, rgba(255,255,255,0.5) 0%, transparent 55%), linear-gradient(160deg, #67e8f9 0%, #22d3ee 48%, #0b8ba6 100%)',
                boxShadow:
                  'inset 0 1.5px 0 rgba(255,255,255,0.65), inset 0 -2px 4px rgba(3,55,70,0.55), 0 8px 20px -8px rgba(34,211,238,0.7)',
              }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-semibold text-white">
              {content(titleKey)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{content(bodyKey)}</p>
          </div>
        ))}
      </div>

      {/*
        Kept, but demoted to one quiet line. These are hygiene facts, not
        reasons to choose anyone -- giving them card-sized weight is what
        made the old section say nothing.
      */}
      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-[11px] text-white/35">
        <span className="inline-flex items-center gap-1.5">
          <ShieldIcon className="h-3.5 w-3.5" />
          {content('trust.hygiene.direct')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BoltIcon className="h-3.5 w-3.5" />
          {content('trust.hygiene.fast')}
        </span>
        <span>{content('trust.hygiene.noResellers')}</span>
      </p>
    </section>
  )
}

function Reading({
  value,
  unit,
  label,
  bright = false,
}: {
  value: string
  unit: string
  label: string
  bright?: boolean
}) {
  return (
    <div>
      <p className="flex items-baseline gap-1">
        <span
          className={`font-mono text-4xl font-bold tabular-nums ${bright ? 'text-[#67e8f9]' : 'text-white'}`}
        >
          {value}
        </span>
        <span className="text-sm font-medium text-white/40">{unit}</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-white/50">{label}</p>
    </div>
  )
}
