import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  BookOpen,
  Upload,
  MessageCircle,
  BarChart3,
  Users,
  Calendar,
  Megaphone
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canCreateUsers } from '../../lib/permissions'
import { UserProfileDropdown } from './UserProfileDropdown'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  requiredPermission?: (user: any) => boolean
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/materials', icon: BookOpen, label: 'Materials Library' },
  { to: '/assignments', icon: Upload, label: 'Assignments' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/announcements', icon: Megaphone, label: 'Announcements' },
  {
    to: '/users',
    icon: Users,
    label: 'User Management',
    requiredPermission: canCreateUsers
  },
]

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return null
  }

  const filteredNavItems = navItems.filter(item => {
    if (item.requiredPermission) {
      return item.requiredPermission(user)
    }
    return true
  })

  return (
    <div className="w-64 bg-navy h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-navy/20">
        <Link to="/" className="block">
          <img
            src="/PriorityLex Logo (Final).png"
            alt="PriorityLex"
            className="h-8 filter brightness-0 invert"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to

            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal text-white'
                      : 'text-gray-300 hover:bg-navy/60 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile Dropdown */}
      <div className="p-4 border-t border-navy/20">
        <UserProfileDropdown />
      </div>
    </div>
  )
}