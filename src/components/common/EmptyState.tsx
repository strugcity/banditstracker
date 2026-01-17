import { cn } from '@/utils/cn'
import { Button } from './Button'

/**
 * EmptyState component props
 */
export interface EmptyStateProps {
  /** Icon or illustration to display */
  icon?: React.ReactNode
  /** Title text */
  title: string
  /** Descriptive message */
  message: string
  /** Optional action button configuration */
  action?: {
    label: string
    onClick: () => void
  }
  /** Additional CSS classes */
  className?: string
}

/**
 * EmptyState Component
 *
 * A component to display when there's no content or data to show.
 * Provides a centered layout with icon, title, message, and optional action.
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState
 *   title="No workouts yet"
 *   message="Start tracking your training by adding your first workout."
 * />
 *
 * // Empty state with icon
 * <EmptyState
 *   icon={<WorkoutIcon className="h-16 w-16" />}
 *   title="No exercises found"
 *   message="Try adjusting your search or filters."
 * />
 *
 * // Empty state with action button
 * <EmptyState
 *   icon={<PlusIcon className="h-16 w-16" />}
 *   title="No training sessions"
 *   message="Create your first training session to get started."
 *   action={{
 *     label: 'Add Session',
 *     onClick: () => navigate('/sessions/new')
 *   }}
 * />
 * ```
 */
export const EmptyState = ({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4 py-12',
        className
      )}
    >
      {icon && (
        <div className="text-gray-400 mb-4" aria-hidden="true">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      <p className="text-base text-gray-600 max-w-md mb-6">{message}</p>

      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

EmptyState.displayName = 'EmptyState'
