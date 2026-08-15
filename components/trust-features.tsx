import { ShieldCheck, Zap, MessageCircle, type LucideIcon } from 'lucide-react'

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Secure Booking',
    description: 'Every reservation is confirmed directly with our dispatch team -- no third-party resellers.',
  },
  {
    icon: Zap,
    title: 'Instant Confirmation',
    description: 'Submit a request and hear back fast, with real-time pricing calculated on the spot.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Support',
    description: 'Reach a real person before, during, and after your tour -- no ticket queues.',
  },
]

export function TrustFeatures() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-accent)]">Why Artic Safari</p>
        <h2 className="mt-3 text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.01em] text-white sm:text-4xl">
          Built around a smoother way to chase the lights.
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col rounded-[20px] p-6 shadow-[var(--home-card-shadow)] transition-transform duration-300 hover:-translate-y-1"
            style={{ backgroundImage: 'var(--home-gradient-card)' }}
          >
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[var(--home-bg)]"
              style={{ backgroundImage: 'var(--home-gradient-cta)' }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-[family-name:var(--font-display)] text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
