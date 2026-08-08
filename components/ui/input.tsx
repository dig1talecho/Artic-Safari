import { cn } from '@/lib/utils'

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white transition-colors placeholder:text-muted-foreground focus:border-aurora focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
