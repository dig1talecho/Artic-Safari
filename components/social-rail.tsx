import { MessageCircle, Mail } from 'lucide-react'

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

const WHATSAPP_URL = 'https://wa.me/+4792997190'
const INSTAGRAM_URL = 'https://instagram.com/articsafaritour'
// TODO: replace with the real contact email once provided.
const EMAIL_URL = 'mailto:info@articsafaritour.com'

interface SocialRailProps {
  variant?: 'dark' | 'light'
}

export function SocialRail({ variant = 'dark' }: SocialRailProps) {
  const isLight = variant === 'light'

  const containerClass = isLight
    ? 'border-[var(--home-border)] bg-[var(--home-surface)] shadow-[0_16px_40px_-12px_rgba(38,36,31,0.25)]'
    : 'glass border-white/12 shadow-2xl shadow-black/50'

  const iconClass = isLight
    ? 'text-[var(--home-muted)] hover:bg-[var(--home-surface-soft)] hover:text-[var(--home-accent)]'
    : 'text-muted-foreground hover:bg-white/[0.06] hover:text-aurora'

  return (
    <div className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 sm:block">
      <div className={`flex flex-col items-center gap-1.5 rounded-full border p-1.5 ${containerClass}`}>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconClass}`}
        >
          <InstagramIcon className="h-4 w-4" />
        </a>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconClass}`}
        >
          <MessageCircle className="h-4 w-4" />
        </a>
        <a
          href={EMAIL_URL}
          aria-label="Email us"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${iconClass}`}
        >
          <Mail className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
