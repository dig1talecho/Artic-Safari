export function AuroraBackground() {
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
