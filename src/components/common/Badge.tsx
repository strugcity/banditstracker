import { cn } from '@/utils/cn'

/**
 * Badge component props
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual variant of the badge */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show a dot indicator */
  dot?: boolean
  /** Icon to display in the badge */
  icon?: React.ReactNode
}

/**
 * Badge Component
 *
 * A versatile badge component for labels, status indicators, and counts.
 * Supports multiple variants, sizes, and optional dot indicators or icons.
 *
 * @example
 * ```tsx
 * // Default badge
 * <Badge>New</Badge>
 *
 * // Success badge
 * <Badge variant="success">Completed</Badge>
 *
 * // Badge with dot indicator
 * <Badge variant="warning" dot>In Progress</Badge>
 *
 * // Badge with icon
 * <Badge variant="info" icon={<InfoIcon />}>
 *   Important
 * </Badge>
 *
 * // Small danger badge
 * <Badge variant="danger" size="sm">Error</Badge>
 * ```
 */
export const Badge = ({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
  ...props
}: BadgeProps) => {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full whitespace-nowrap'

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const dotColors = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  }

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'rounded-full mr-1.5',
            dotColors[variant],
            dotSizes[size]
          )}
        />
      )}
      {icon && <span className="mr-1 flex items-center">{icon}</span>}
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'
