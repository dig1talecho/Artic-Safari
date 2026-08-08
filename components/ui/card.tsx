import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const cardVariants = cva(
  'glass group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 p-6 transition-all duration-300',
  {
    variants: {
      glow: {
        none: '',
        aurora:
          'hover:-translate-y-1 hover:border-aurora/40 hover:shadow-[0_0_40px_-12px_rgba(0,255,163,0.45)]',
        violet:
          'hover:-translate-y-1 hover:border-violet/40 hover:shadow-[0_0_40px_-12px_rgba(110,58,255,0.5)]',
      },
    },
    defaultVariants: {
      glow: 'none',
    },
  },
)

function Card({
  className,
  glow,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ glow, className }))}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('mb-5 flex items-start gap-3', className)}
      {...props}
    />
  )
}

function CardIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="card-icon"
      className={cn(
        'grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-aurora',
        className,
      )}
      {...props}
    />
  )
}

function CardEyebrow({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-eyebrow"
      className={cn(
        'text-[11px] uppercase tracking-[0.18em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        'mt-1 text-lg font-semibold leading-tight text-foreground',
        className,
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-pretty leading-relaxed text-muted-foreground', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-content" className={cn('flex-1', className)} {...props} />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('mt-auto pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardIcon,
  CardEyebrow,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}
