import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Search, Upload } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canCreateUsers } from '../../lib/permissions'
import { getAllUsers, deleteUser, changeUserGroup } from '../../lib/users'
import { getAllGroups } from '../../lib/groups'
import { CreateUserModal } from './CreateUserModal'
import { EditUserModal } from './EditUserModal'
import { BulkImportModal } from './BulkImportModal'
import { UserTable } from './UserTable'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { User, Group } from '../../types'

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Check permissions
  if (!currentUser || !canCreateUsers(currentUser)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">User Management</h1>
          <p className="text-muted">Manage user accounts and group assignments</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-red-600">You don't have permission to access user management.</p>
        </div>
      </div>
    )
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersResult, groupsResult] = await Promise.all([
        getAllUsers(),
        getAllGroups()
      ])

      if (usersResult.error) {
        console.error('Load users error:', usersResult.error)
        setError(usersResult.error.message || 'Failed to load users')
      } else {
        setUsers(usersResult.data || [])
        setFilteredUsers(usersResult.data || [])
      }

      if (groupsResult.error) {
        console.error('Load groups error:', groupsResult.error)
        // Don't show error for groups, just log it
      } else {
        setGroups(groupsResult.data || [])
      }
    } catch (err: any) {
      console.error('❌ UserManagement loadUsers error:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  const handleCreateUser = () => {
    setShowCreateModal(true)
  }

  const handleBulkImport = () => {
    setShowBulkImportModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.full_name}?\n\nThis will:\n• Remove their user account and login access\n• Preserve all their work (assignments, competencies, certifications)\n• Keep their chat messages for historical record\n\nTheir progress and submissions will remain in the system but will be marked as from a deleted user.\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      setActionLoading(user.id)
      setError(null) // Clear any previous errors

      const { error } = await deleteUser(user.id)

      if (error) {
        console.error('Delete user failed:', error)
        setError(`Failed to delete ${user.full_name}: ${error.message}`)

        // Also show alert for immediate feedback
        alert(`Failed to delete user: ${error.message}`)
      } else {
        console.log('User deleted successfully, refreshing list')

        // Success feedback
        alert(`${user.full_name} has been deleted successfully.`)

        try {
          await loadUsers() // Refresh the list
        } catch (refreshError) {
          console.error('Failed to refresh user list after delete:', refreshError)
          setError('User deleted but failed to refresh the list. Please reload the page.')
        }
      }
    } catch (err: any) {
      console.error('Unexpected error during user deletion:', err)
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(`Failed to delete ${user.full_name}: ${errorMessage}`)
      alert(`Failed to delete user: ${errorMessage}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowBulkImportModal(false)
    setSelectedUser(null)
  }

  const handleUserCreated = () => {
    loadUsers()
    handleModalClose()
  }

  const handleUserUpdated = () => {
    loadUsers()
    handleModalClose()
  }

  const handleUsersCreated = () => {
    loadUsers()
    // Don't auto-close bulk import modal to allow copying emails
  }

  const handleGroupChange = async (user: User, newGroupId: number | null) => {
    if (user.group_id === newGroupId) {
      return // No change needed
    }

    const groupName = newGroupId ? `Group ${newGroupId}` : 'Unassigned'
    if (!confirm(`Move ${user.full_name} to ${groupName}?`)) {
      return
    }

    try {
      setActionLoading(user.id)
      setError(null)

      const { error } = await changeUserGroup(user.id, newGroupId)

      if (error) {
        console.error('Change group failed:', error)
        setError(`Failed to change ${user.full_name}'s group: ${error.message}`)
        alert(`Failed to change group: ${error.message}`)
      } else {
        console.log('User group changed successfully')
        alert(`${user.full_name} moved to ${groupName} successfully.`)

        try {
          await loadUsers() // Refresh the list
        } catch (refreshError) {
          console.error('Failed to refresh after group change:', refreshError)
          setError('Group changed but failed to refresh the list. Please reload the page.')
        }
      }
    } catch (err: any) {
      console.error('Unexpected error during group change:', err)
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(`Failed to change ${user.full_name}'s group: ${errorMessage}`)
      alert(`Failed to change group: ${errorMessage}`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">User Management</h1>
          <p className="text-muted">Manage user accounts and group assignments</p>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-12 w-12" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">User Management</h1>
          <p className="text-muted">Manage user accounts and group assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm text-muted hover:text-dark rounded-md hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleBulkImport}
            className="flex items-center px-4 py-2 bg-teal text-white rounded-md hover:bg-teal/80 transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </button>
          <button
            onClick={handleCreateUser}
            className="flex items-center px-4 py-2 bg-navy text-white rounded-md hover:bg-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="star_player">Star Player</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-semibold text-navy">{users.length}</div>
          <div className="text-sm text-muted">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-semibold text-navy">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm text-muted">Admins</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-semibold text-navy">
            {users.filter(u => u.role === 'instructor').length}
          </div>
          <div className="text-sm text-muted">Instructors</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-semibold text-navy">
            {users.filter(u => u.role === 'star_player').length}
          </div>
          <div className="text-sm text-muted">Star Players</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading users</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {!error && users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted mb-4">No users have been created yet.</p>
            <button
              onClick={handleCreateUser}
              className="inline-flex items-center px-4 py-2 bg-navy text-white rounded-md hover:bg-navy/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First User
            </button>
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            groups={groups}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onGroupChange={handleGroupChange}
            actionLoading={actionLoading}
            currentUserId={currentUser.id}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={handleModalClose}
          onUserCreated={handleUserCreated}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={handleModalClose}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {showBulkImportModal && (
        <BulkImportModal
          onClose={handleModalClose}
          onUsersCreated={handleUsersCreated}
        />
      )}
    </div>
  )
}