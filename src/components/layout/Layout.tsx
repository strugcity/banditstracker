/**
 * Layout Component
 *
 * Main layout wrapper for all pages
 * Features:
 * - Navigation bar at top
 * - Breadcrumbs below nav
 * - Main content area
 * - Responsive padding and spacing
 */

import { Navigation } from './Navigation'
import { Breadcrumbs } from './Breadcrumbs'

interface LayoutProps {
  children: React.ReactNode
  showBreadcrumbs?: boolean
}

export function Layout({ children, showBreadcrumbs = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {showBreadcrumbs && <Breadcrumbs />}
      <main>{children}</main>
    </div>
  )
}
