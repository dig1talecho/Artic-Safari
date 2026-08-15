'use client'

// Catches errors thrown by the root layout itself -- must render its own
// <html>/<body> since it replaces the layout entirely when triggered.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: '#faf8f4', color: '#26241f', fontFamily: 'system-ui, sans-serif' }}>
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
          <p style={{ maxWidth: '32rem', color: '#7a7368', fontSize: '0.9rem' }}>
            Please refresh the page. If this keeps happening, reach us on WhatsApp at +47 929 97 190.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '0.5rem',
              borderRadius: '0.75rem',
              background: '#2f4b3c',
              color: '#faf8f4',
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
