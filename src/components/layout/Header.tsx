import { LogOut, Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getRoleDisplayName, getRoleColor } from '../../lib/permissions'

export function Header() {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-semibold text-navy">
            Star Player Training Portal
          </h1>
          <p className="text-sm text-muted">
            Welcome back, {user.full_name}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Role Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </span>

          {/* Notifications */}
          <button className="p-2 text-muted hover:text-dark rounded-md hover:bg-gray-100">
            <Bell className="h-5 w-5" />
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center px-3 py-2 text-sm text-muted hover:text-dark rounded-md hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}