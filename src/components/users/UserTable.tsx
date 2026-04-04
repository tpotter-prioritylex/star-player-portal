import React from 'react'
import { Edit, Trash2, RefreshCw, Users } from 'lucide-react'
import { getRoleDisplayName, getRoleColor } from '../../lib/permissions'
import type { User, Group } from '../../types'

interface UserTableProps {
  users: User[]
  groups: Group[]
  onEdit: (user: User) => void
  onDelete: (user: User) => Promise<void>
  onGroupChange: (user: User, groupId: number | null) => Promise<void>
  actionLoading: string | null
  currentUserId: string
}

export function UserTable({
  users,
  groups,
  onEdit,
  onDelete,
  onGroupChange,
  actionLoading,
  currentUserId
}: UserTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGroupDisplay = (groupId: number | null) => {
    if (!groupId) return 'Unassigned'
    return `Group ${groupId}`
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted">No users found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Group
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId
            const isActionLoading = actionLoading === user.id

            return (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-teal rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-dark">
                        {user.full_name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-teal">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-dark">
                  {user.role === 'star_player' ? (
                    <select
                      value={user.group_id || ''}
                      onChange={(e) => {
                        const newGroupId = e.target.value ? parseInt(e.target.value) : null
                        onGroupChange(user, newGroupId)
                      }}
                      disabled={isActionLoading}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change group assignment"
                    >
                      <option value="">Unassigned</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-muted italic">
                      {getGroupDisplay(user.group_id)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                  {formatDate(user.updated_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(user)}
                      disabled={isActionLoading}
                      className="text-teal hover:text-teal/80 disabled:opacity-50 transition-colors"
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {user.role === 'star_player' && (
                      <button
                        onClick={() => {
                          const nextGroup = user.group_id ? (user.group_id % 6) + 1 : 1
                          onGroupChange(user, nextGroup)
                        }}
                        disabled={isActionLoading}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                        title="Quick assign to next group"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                    )}

                    {!isCurrentUser && (
                      <button
                        onClick={() => onDelete(user)}
                        disabled={isActionLoading}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                        title="Delete user account"
                      >
                        {isActionLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}