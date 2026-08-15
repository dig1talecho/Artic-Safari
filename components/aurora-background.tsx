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
      {/* base obsidian */}
      <div className="absolute inset-0 bg-background" />
      {/* violet glow top-left */}
      <div className="animate-aurora-drift absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-violet/25 blur-[120px]" />
      {/* aurora green glow bottom-right */}
      <div
        className="animate-aurora-drift absolute -bottom-52 right-[-10rem] h-[40rem] w-[40rem] rounded-full bg-aurora/15 blur-[130px]"
        style={{ animationDelay: '3s' }}
      />
      {/* soft center violet */}
      <div
        className="animate-aurora-drift absolute left-1/2 top-1/3 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-violet/10 blur-[140px]"
        style={{ animationDelay: '6s' }}
      />
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
