'use client'

import { motion } from 'framer-motion'

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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.08-4.85-4.27-.14-.19-1.16-1.54-1.16-2.94s.73-2.09.99-2.37c.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.15.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.13.57.17.28.75 1.24 1.61 2 1.11.99 2.04 1.3 2.32 1.44.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.64-.14.26.09 1.65.78 1.94.92.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
    </svg>
  )
}

function EmailIcon({ className }: { className?: string }) {
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
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </svg>
  )
}

const WHATSAPP_URL = 'https://wa.me/+4792997190'
const INSTAGRAM_URL = 'https://instagram.com/articsafaritour'
// TODO: replace with the real contact email once provided.
const EMAIL_URL = 'mailto:info@articsafaritour.com'

const socials = [
  {
    href: INSTAGRAM_URL,
    label: 'Follow us on Instagram',
    icon: InstagramIcon,
    gradient: 'linear-gradient(135deg, #f9ce34 0%, #ee2a7b 55%, #6228d7 100%)',
    glow: 'rgba(238,42,123,0.55)',
    external: true,
  },
  {
    href: WHATSAPP_URL,
    label: 'Chat with us on WhatsApp',
    icon: WhatsAppIcon,
    gradient: 'linear-gradient(135deg, #3fd67e 0%, #1fa855 100%)',
    glow: 'rgba(37,211,102,0.55)',
    external: true,
  },
  {
    href: EMAIL_URL,
    label: 'Email us',
    icon: EmailIcon,
    // Literal gradient rather than the .home-theme-scoped --home-gradient-cta
    // var, since this rail also renders on /admin and /dashboard which
    // aren't wrapped in .home-theme.
    gradient: 'linear-gradient(135deg, #5ce1e6 0%, #1a8fa3 100%)',
    glow: 'rgba(51,187,207,0.55)',
    external: false,
  },
] as const

interface SocialRailProps {
  variant?: 'dark' | 'light'
}

/**
 * Fixed left-edge social rail.
 *
 * Only rendered from 2xl (1536px) up. The rail occupies x: 16–82px, while
 * page content starts at (viewport − 1280) / 2 + 20px — so on anything
 * narrower than ~1450px it sat directly on top of the hero headline (it was
 * previously shown from `sm`, i.e. 640px, which covered every laptop and
 * tablet). Below 2xl the bottom floating bar already carries WhatsApp, Call
 * Dispatch and Live Support, so no contact route is lost by hiding it.
 */
export function SocialRail({ variant = 'dark' }: SocialRailProps) {
  const isLight = variant === 'light'

  const containerClass = isLight
    ? 'border-[var(--home-glass-border)] bg-[var(--home-glass)] shadow-[0_20px_50px_-16px_rgba(0,0,0,0.4)]'
    : 'border-white/10 bg-[#0a0a0c]/70 shadow-2xl shadow-black/50'

  return (
    <div className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 2xl:block">
      <div
        className={`flex flex-col items-center gap-2.5 rounded-[22px] border p-2.5 backdrop-blur-2xl backdrop-saturate-150 ${containerClass}`}
      >
        {socials.map(({ href, label, icon: Icon, gradient, glow, external }) => (
          <motion.a
            key={label}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            aria-label={label}
            title={label}
            initial={false}
            whileHover={{ y: -3, scale: 1.08 }}
            whileTap={{ scale: 0.94, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            style={{
              backgroundImage: gradient,
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.35) inset, 0 -3px 6px rgba(0,0,0,0.35) inset, 0 10px 20px -8px rgba(0,0,0,0.55)',
            }}
            className="group relative flex h-11 w-11 items-center justify-center rounded-2xl text-white"
          >
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-70"
              style={{ backgroundColor: glow }}
              aria-hidden="true"
            />
            <Icon className="relative h-[18px] w-[18px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]" />
          </motion.a>
        ))}
      </div>
    </div>
  )
}
