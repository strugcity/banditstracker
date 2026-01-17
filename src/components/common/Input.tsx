import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Input component props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text for the input */
  label?: string
  /** Error message to display */
  error?: string
  /** Helper text to display below the input */
  helperText?: string
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode
}

/**
 * Input Component
 *
 * A flexible input component with label, error states, and icon support.
 * Font size is minimum 16px to prevent iOS zoom on focus.
 *
 * @example
 * ```tsx
 * // Basic input with label
 * <Input label="Email" type="email" placeholder="Enter your email" />
 *
 * // Input with error
 * <Input label="Username" error="Username is required" />
 *
 * // Input with helper text
 * <Input label="Password" type="password" helperText="Must be at least 8 characters" />
 *
 * // Input with icons
 * <Input
 *   label="Search"
 *   leftIcon={<SearchIcon />}
 *   placeholder="Search..."
 * />
 *
 * // Number input (shows numeric keyboard on mobile)
 * <Input label="Reps" type="number" inputMode="numeric" />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const baseStyles =
      'w-full rounded-lg border transition-colors ' +
      'focus:outline-none focus:ring-2 focus:ring-offset-0 ' +
      'disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed ' +
      'text-base min-h-[44px]' // 16px minimum font size prevents iOS zoom

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'

    const paddingStyles = cn(
      leftIcon ? 'pl-10' : 'pl-4',
      rightIcon ? 'pr-10' : 'pr-4',
      'py-3'
    )

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(baseStyles, stateStyles, paddingStyles)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
