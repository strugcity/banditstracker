/**
 * Navigation Component
 *
 * Main navigation bar with mobile menu support
 * Features:
 * - Sticky header with app branding
 * - Mobile hamburger menu
 * - Desktop horizontal navigation
 * - Active link highlighting
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface NavLinkProps {
  to: string
  children: React.ReactNode
  onClick?: () => void
}

function NavLink({ to, children, onClick }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  )
}

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">🏋️</div>
              <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
                Bandits Tracker
              </span>
              <span className="ml-2 text-xl font-bold text-gray-900 sm:hidden">
                Bandits
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/history">History</NavLink>
            <NavLink to="/programs">Programs</NavLink>
            <NavLink to="/exercises">Exercises</NavLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              // Close icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-1">
              <NavLink to="/" onClick={closeMobileMenu}>
                🏠 Home
              </NavLink>
              <NavLink to="/history" onClick={closeMobileMenu}>
                📊 History
              </NavLink>
              <NavLink to="/programs" onClick={closeMobileMenu}>
                📋 Programs
              </NavLink>
              <NavLink to="/exercises" onClick={closeMobileMenu}>
                💪 Exercises
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
