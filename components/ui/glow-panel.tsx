import { cn } from '@/lib/utils'

function GlowPanel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="glow-panel"
      className={cn(
        'glow-border glass relative overflow-hidden rounded-3xl bg-white/[0.02] p-[1px]',
        className,
      )}
      {...props}
    />
  )
}

function GlowPanelContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="glow-panel-content"
      className={cn('relative rounded-[inherit] p-6', className)}
      {...props}
    />
  )
}

export { GlowPanel, GlowPanelContent }
