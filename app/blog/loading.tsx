export default function BlogLoading() {
  return (
    <main className="home-theme min-h-screen bg-[var(--home-bg)] px-5 pb-20 pt-16">
      <div className="mx-auto w-full max-w-4xl animate-pulse">
        <div className="h-3 w-28 rounded bg-[var(--home-surface-soft)]" />
        <div className="mt-4 h-10 w-1/2 rounded bg-[var(--home-surface-soft)]" />
        <div className="mt-12 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-3xl border border-[var(--home-border)] bg-[var(--home-surface)]" />
          ))}
        </div>
      </div>
    </main>
  )
}
