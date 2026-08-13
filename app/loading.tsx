export default function Loading() {
  return (
    <main className="home-theme flex min-h-screen items-center justify-center bg-[var(--home-bg)]">
      <div className="flex flex-col items-center gap-4">
        <span className="live-dot h-2.5 w-2.5 rounded-full bg-[var(--home-gold)]" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--home-muted)]">
          Loading Artic Safari…
        </p>
      </div>
    </main>
  )
}
