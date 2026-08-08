import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-white/10 bg-white/5 text-foreground',
        aurora: 'border-aurora/30 bg-aurora/20 text-aurora',
        violet: 'border-violet/30 bg-violet/20 text-violet',
        warning: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
        destructive: 'border-rose-500/30 bg-rose-500/20 text-rose-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
