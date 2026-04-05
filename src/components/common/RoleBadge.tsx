import { getRoleDisplayName, getRoleColor } from '../../lib/permissions'
import type { UserRole } from '../../types'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role)} ${className}`}>
      {getRoleDisplayName(role)}
    </span>
  )
}