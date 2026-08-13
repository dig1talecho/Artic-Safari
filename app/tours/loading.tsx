export default function ToursLoading() {
  return (
    <main className="home-theme min-h-screen bg-[var(--home-bg)] px-5 pb-20 pt-16">
      <div className="mx-auto w-full max-w-7xl animate-pulse">
        <div className="h-3 w-32 rounded bg-[var(--home-surface-soft)]" />
        <div className="mt-4 h-10 w-2/3 rounded bg-[var(--home-surface-soft)]" />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)]" />
          ))}
        </div>
      </div>
    </main>
  )
}
