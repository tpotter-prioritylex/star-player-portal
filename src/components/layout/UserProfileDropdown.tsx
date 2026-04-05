import { useState, useRef, useEffect } from 'react'
import { ChevronUp, Key, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getRoleDisplayName } from '../../lib/permissions'
import { ChangePasswordModal } from '../users/ChangePasswordModal'

interface UserProfileDropdownProps {
  className?: string
}

export function UserProfileDropdown({ className = '' }: UserProfileDropdownProps) {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
  }

  const handleChangePassword = () => {
    setIsOpen(false)
    setShowChangePassword(true)
  }

  if (!user) {
    return null
  }

  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center text-left hover:bg-navy/60 rounded-md transition-colors group"
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-teal rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {initials}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-300 capitalize mt-0.5">
                  {getRoleDisplayName(user.role)}
                </p>
              </div>
              <ChevronUp
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={handleChangePassword}
                className="w-full flex items-center px-3 py-2 text-sm text-dark hover:bg-gray-100 transition-colors"
              >
                <Key className="h-4 w-4 mr-3 text-muted" />
                Change Password
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </>
  )
}