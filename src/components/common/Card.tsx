import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Card component props
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the card */
  variant?: 'default' | 'elevated' | 'outlined'
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Whether the card is clickable (adds hover effects and cursor pointer) */
  clickable?: boolean
}

/**
 * Card Component
 *
 * A flexible card container with multiple variants and padding options.
 * Supports clickable cards with appropriate hover states and accessibility.
 *
 * @example
 * ```tsx
 * // Default card
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 *
 * // Elevated card with large padding
 * <Card variant="elevated" padding="lg">
 *   Content here
 * </Card>
 *
 * // Clickable card
 * <Card clickable onClick={() => console.log('clicked')}>
 *   Click me!
 * </Card>
 *
 * // Outlined card with no padding (for custom layout)
 * <Card variant="outlined" padding="none">
 *   <div className="p-4">Custom padding</div>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      clickable = false,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-lg transition-all'

    const variants = {
      default: 'bg-white border border-gray-200',
      elevated: 'bg-white shadow-md hover:shadow-lg',
      outlined: 'bg-white border-2 border-gray-300',
    }

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }

    const clickableStyles = clickable
      ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] ' +
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      : ''

    // Use semantic button element if clickable for better accessibility
    const Component = clickable && onClick ? 'button' : 'div'

    const commonProps = {
      className: cn(
        baseStyles,
        variants[variant],
        paddings[padding],
        clickableStyles,
        Component === 'button' && 'text-left w-full',
        className
      ),
      children,
    }

    if (Component === 'button') {
      return (
        <button
          ref={ref as any}
          {...commonProps}
          onClick={onClick ? (e) => onClick(e as any) : undefined}
          type="button"
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        />
      )
    }

    return (
      <div
        ref={ref}
        {...commonProps}
        onClick={onClick}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'
