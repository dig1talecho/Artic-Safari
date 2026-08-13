'use client'

// Catches errors thrown by the root layout itself -- must render its own
// <html>/<body> since it replaces the layout entirely when triggered.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: '#070a0f', color: '#eef1f6', fontFamily: 'system-ui, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '1.25rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Artic Safari is temporarily unavailable</h1>
          <p style={{ maxWidth: '32rem', color: '#8a94a6', fontSize: '0.9rem' }}>
            Please refresh the page. If this keeps happening, reach us on WhatsApp at +47 929 97 190.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '0.5rem',
              borderRadius: '0.75rem',
              background: '#7fd0e0',
              color: '#070a0f',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '0.75rem 1.5rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </main>
      </body>
    </html>
  )
}
