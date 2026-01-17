import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  /** Size of the button - all sizes meet minimum 44x44px tap target */
  size?: 'sm' | 'md' | 'lg'
  /** Whether button should take full width of container */
  fullWidth?: boolean
  /** Loading state - shows spinner and disables button */
  loading?: boolean
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode
}

/**
 * Button Component
 *
 * A flexible button component with multiple variants, sizes, and states.
 * Built with mobile-first principles ensuring minimum 44x44px tap targets.
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary">Click me</Button>
 *
 * // Button with icon
 * <Button leftIcon={<PlusIcon />}>Add Item</Button>
 *
 * // Loading state
 * <Button loading>Saving...</Button>
 *
 * // Full width
 * <Button fullWidth>Submit</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors ' +
      'focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
      'disabled:opacity-50 disabled:pointer-events-none ' +
      'active:scale-[0.98] transition-transform'

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ' +
        'focus:ring-blue-500 shadow-sm',
      secondary:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
        'focus:ring-red-500 shadow-sm',
      outline:
        'border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 ' +
        'active:bg-blue-100 focus:ring-blue-500',
      ghost:
        'text-gray-700 hover:bg-gray-100 active:bg-gray-200 ' +
        'focus:ring-gray-500',
      danger:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
        'focus:ring-red-500 shadow-sm',
    }

    // All sizes meet minimum 44x44px tap target requirement
    const sizes = {
      sm: 'text-sm px-3 py-2 min-h-[44px]',
      md: 'text-base px-4 py-3 min-h-[44px]',
      lg: 'text-lg px-6 py-4 min-h-[52px]',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" color="current" className="mr-2" />}
        {leftIcon && !loading && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
