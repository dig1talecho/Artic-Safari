interface AuroraBackgroundProps {
  variant?: 'dark' | 'light'
}

export function AuroraBackground({ variant = 'dark' }: AuroraBackgroundProps) {
  if (variant === 'light') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* base -- #00040f, matched to the reference site's primary color */}
        <div className="absolute inset-0 bg-[var(--home-bg)]" />
        {/* the reference site's large blurred blue ambient blob, bottom-right */}
        <div
          className="absolute -right-[10%] bottom-0 h-[60%] w-[60%] rounded-full blur-[123px]"
          style={{ backgroundImage: 'var(--home-gradient-blob)' }}
        />
        {/* a second, softer echo top-left for depth across taller pages */}
        <div
          className="absolute -left-[15%] -top-[10%] h-[45%] w-[45%] rounded-full opacity-60 blur-[140px]"
          style={{ backgroundImage: 'var(--home-gradient-blob)' }}
        />
      </div>
    )
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* base -- matches the homepage's #00040f */}
      <div className="absolute inset-0 bg-background" />
      {/* the same blurred ice-blue blob used on the homepage, echoed for
          brand consistency across /dashboard */}
      <div className="absolute -right-[10%] bottom-0 h-[60%] w-[60%] rounded-full bg-[linear-gradient(180deg,rgba(188,165,255,0)_0%,#214d76_100%)] blur-[123px]" />
      <div className="absolute -left-[15%] -top-[10%] h-[45%] w-[45%] rounded-full bg-[linear-gradient(180deg,rgba(188,165,255,0)_0%,#214d76_100%)] opacity-60 blur-[140px]" />
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  )
}
