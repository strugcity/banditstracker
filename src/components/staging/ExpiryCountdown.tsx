/**
 * Expiry Countdown Component
 *
 * Displays time remaining until session expires.
 * Features:
 * - Updates every minute
 * - Warning state when < 1 hour remaining
 * - Tooltip explaining auto-import behavior
 */

import { useState, useEffect } from 'react'
import { getTimeRemaining } from '@/types/staging'

interface ExpiryCountdownProps {
  expiresAt: string
}

export function ExpiryCountdown({ expiresAt }: ExpiryCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    getTimeRemaining(expiresAt)
  )

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(expiresAt))
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [expiresAt])

  // Also update immediately when expiresAt changes
  useEffect(() => {
    setTimeRemaining(getTimeRemaining(expiresAt))
  }, [expiresAt])

  if (timeRemaining.isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-medium">Session expired</span>
      </div>
    )
  }

  const { hours, minutes, isWarning } = timeRemaining

  // Format display
  let displayText = ''
  if (hours > 0) {
    displayText = `${hours}h ${minutes}m remaining`
  } else {
    displayText = `${minutes}m remaining`
  }

  return (
    <div
      className={`
        flex items-center gap-2 text-sm
        ${isWarning ? 'text-orange-600' : 'text-gray-500'}
      `}
      title="Unsaved exercises will be automatically imported to your library when the session expires"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className={isWarning ? 'font-medium' : ''}>
        {isWarning && '⚠️ '}
        {displayText}
      </span>
      {isWarning && (
        <span className="text-xs text-orange-500">
          (exercises will auto-save)
        </span>
      )}
    </div>
  )
}
