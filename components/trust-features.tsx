import { ShieldIcon, BoltIcon, WhatsAppIcon } from '@/components/trust-icons'

const features: {
  Icon: (props: { className?: string }) => React.ReactElement
  title: string
  description: string
}[] = [
  {
    Icon: ShieldIcon,
    title: 'Secure Booking',
    description:
      'Every reservation is confirmed directly with our dispatch team — no third-party resellers.',
  },
  {
    Icon: BoltIcon,
    title: 'Instant Confirmation',
    description:
      'Submit a request and hear back fast, with real-time pricing calculated on the spot.',
  },
  {
    Icon: WhatsAppIcon,
    title: 'WhatsApp Support',
    description: 'Reach a real person before, during, and after your tour — no ticket queues.',
  },
]

export function TrustFeatures() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">
          Why Artic Safari
        </p>
        <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.01em] text-white sm:text-4xl">
          Built around a smoother way to chase the lights.
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map(({ Icon, title, description }) => (
          <div
            key={title}
            className="group flex flex-col rounded-[20px] p-6 shadow-[var(--home-card-shadow)] transition-transform duration-300 hover:-translate-y-1"
            style={{ backgroundImage: 'var(--home-gradient-card)' }}
          >
            {/*
              The disc is lit from the top-left and sits in a shallow well,
              so the icon on it has somewhere to cast its shadow. Without
              the inset ring it reads as a sticker rather than an object.
            */}
            <span
              className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-[1.06]"
              style={{
                backgroundImage:
                  'radial-gradient(120% 100% at 25% 12%, rgba(255,255,255,0.5) 0%, transparent 55%), linear-gradient(160deg, #67e8f9 0%, #22d3ee 48%, #0b8ba6 100%)',
                boxShadow:
                  'inset 0 1.5px 0 rgba(255,255,255,0.65), inset 0 -2px 4px rgba(3,55,70,0.55), 0 8px 20px -8px rgba(34,211,238,0.7)',
              }}
            >
              <Icon className="relative h-7 w-7" />
            </span>
            <h3 className="mt-5 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
