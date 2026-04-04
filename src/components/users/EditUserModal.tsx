import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { updateUser, resetPassword, generateTemporaryPassword } from '../../lib/users'
import { getAllGroups } from '../../lib/groups'
import type { User, UserRole, Group } from '../../types'

interface EditUserModalProps {
  user: User
  onClose: () => void
  onUserUpdated: () => void
}

export function EditUserModal({ user, onClose, onUserUpdated }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    role: user.role as UserRole,
    group_id: user.group_id as number | null,
  })
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    // Load groups for selection
    const loadGroups = async () => {
      const { data } = await getAllGroups()
      if (data) {
        setGroups(data)
      }
    }
    loadGroups()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await updateUser(user.id, formData)

      if (updateError) {
        setError(updateError.message)
      } else {
        onUserUpdated()
      }
    } catch (err) {
      setError('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!newPassword) {
      setError('Please enter a new password')
      return
    }

    setPasswordLoading(true)
    setError(null)

    try {
      const { error: resetError } = await resetPassword(user.id, newPassword)

      if (resetError) {
        setError(resetError.message)
      } else {
        alert(`Password reset successfully!\n\nNew password: ${newPassword}\n\nPlease share this password with the user securely.`)
        setShowPasswordReset(false)
        setNewPassword('')
      }
    } catch (err) {
      setError('Failed to reset password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'group_id' ? (value ? parseInt(value) : null) : value
    }))
  }

  const generatePassword = () => {
    setNewPassword(generateTemporaryPassword())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-serif font-semibold text-navy">Edit User</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-dark transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Info */}
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <p className="text-sm text-muted">Editing user: <strong>{user.email}</strong></p>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-dark mb-1">
              Full Name *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-dark mb-1">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="star_player">Star Player</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Group Assignment */}
          <div>
            <label htmlFor="group_id" className="block text-sm font-medium text-dark mb-1">
              Group Assignment
            </label>
            <select
              id="group_id"
              name="group_id"
              value={formData.group_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {formData.role !== 'star_player' && formData.group_id && (
              <p className="text-xs text-muted mt-1">
                Note: Only Star Players typically need group assignments
              </p>
            )}
          </div>

          {/* Password Reset Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-dark">Password</span>
              <button
                type="button"
                onClick={() => setShowPasswordReset(!showPasswordReset)}
                className="text-sm text-teal hover:text-teal/80 transition-colors"
              >
                {showPasswordReset ? 'Cancel Reset' : 'Reset Password'}
              </button>
            </div>

            {showPasswordReset && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-dark mb-1">
                    New Password
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="new_password"
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent font-mono text-sm"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-3 py-2 text-sm text-teal border border-teal rounded-md hover:bg-teal hover:text-white transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={passwordLoading || !newPassword}
                  className="w-full px-3 py-2 text-sm bg-gold text-navy rounded-md hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {passwordLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-dark border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-navy text-white rounded-md hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}