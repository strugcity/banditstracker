import { cn } from '@/utils/cn'

/**
 * Spinner component props
 */
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant of the spinner */
  color?: 'current' | 'primary' | 'white'
}

/**
 * Spinner Component
 *
 * A loading spinner component with multiple sizes and colors.
 * Accessible with proper ARIA labels.
 *
 * @example
 * ```tsx
 * // Default spinner
 * <Spinner />
 *
 * // Small primary spinner
 * <Spinner size="sm" color="primary" />
 *
 * // Large white spinner
 * <Spinner size="lg" color="white" />
 *
 * // Custom aria-label
 * <Spinner aria-label="Loading data..." />
 * ```
 */
export const Spinner = ({
  size = 'md',
  color = 'primary',
  className,
  ...props
}: SpinnerProps) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  const colors = {
    current: 'border-current border-t-transparent',
    primary: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  }

  return (
    <div
      role="status"
      aria-label={props['aria-label'] || 'Loading'}
      className={cn('inline-block', className)}
      {...props}
    >
      <div
        className={cn(
          'animate-spin rounded-full',
          sizes[size],
          colors[color]
        )}
      />
      <span className="sr-only">{props['aria-label'] || 'Loading'}</span>
    </div>
  )
}

Spinner.displayName = 'Spinner'
