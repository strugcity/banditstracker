import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Select option interface
 */
export interface SelectOption {
  /** The value of the option */
  value: string | number
  /** The display label for the option */
  label: string
}

/**
 * Select component props
 */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
  /** Label text for the select */
  label?: string
  /** Error message to display */
  error?: string
  /** Array of options to display */
  options: SelectOption[]
  /** Placeholder text for the select (creates a disabled option) */
  placeholder?: string
}

/**
 * Select Component
 *
 * A native select dropdown with label and error states.
 * Uses native select for better mobile UX - provides platform-specific pickers.
 * Font size is minimum 16px to prevent iOS zoom on focus.
 *
 * @example
 * ```tsx
 * // Basic select with label
 * <Select
 *   label="Exercise Type"
 *   options={[
 *     { value: 'push', label: 'Push' },
 *     { value: 'pull', label: 'Pull' },
 *     { value: 'legs', label: 'Legs' },
 *   ]}
 * />
 *
 * // Select with error
 * <Select
 *   label="Workout Day"
 *   options={workoutOptions}
 *   error="Please select a workout day"
 * />
 *
 * // Select with placeholder and value
 * <Select
 *   label="Choose Exercise"
 *   placeholder="Select an exercise..."
 *   value={selectedExercise}
 *   onChange={(e) => setSelectedExercise(e.target.value)}
 *   options={exerciseOptions}
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      className,
      id,
      placeholder,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    const baseStyles =
      'w-full rounded-lg border transition-colors appearance-none ' +
      'bg-white bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")] ' +
      'bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat ' +
      'focus:outline-none focus:ring-2 focus:ring-offset-0 ' +
      'disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed ' +
      'cursor-pointer ' +
      'text-base min-h-[44px] px-4 py-3 pr-10' // 16px minimum font size prevents iOS zoom

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={cn(baseStyles, stateStyles)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
