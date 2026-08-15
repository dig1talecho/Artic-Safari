import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import { AuthRedirectHandler } from '@/components/auth-redirect-handler'
import { siteUrl } from '@/lib/site-config'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

const title = 'Private Northern Lights Tours Tromsø | Artic Safari'
const description =
  'Chase the aurora in first-class comfort. Private Northern Lights tours & VIP airport transfers in Tromsø, Norway. Book your Arctic expedition today.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  generator: 'v0.app',
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'Artic Safari',
    images: [
      {
        url: '/aurora-hero.png',
        width: 1600,
        height: 720,
        alt: 'Northern lights over an Arctic Norwegian fjord at night',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/aurora-hero.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#FAF8F4',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <AuthRedirectHandler />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
