import React, { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { createUser, generateTemporaryPassword } from '../../lib/users'
import { getAllGroups } from '../../lib/groups'
import { WelcomeEmailCopy } from './WelcomeEmailCopy'
import type { UserRole, Group } from '../../types'

interface CreateUserModalProps {
  onClose: () => void
  onUserCreated: () => void
}

export function CreateUserModal({ onClose, onUserCreated }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'star_player' as UserRole,
    group_id: null as number | null,
    temporary_password: generateTemporaryPassword()
  })
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdUser, setCreatedUser] = useState<{
    email: string
    full_name: string
    password: string
  } | null>(null)

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

    // Prevent double submission
    if (loading) {
      return
    }

    // Validate required fields
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return
    }

    if (!formData.temporary_password.trim()) {
      setError('Temporary password is required')
      return
    }

    setLoading(true)
    setError(null)

    console.log('🚀 Admin creating user:', {
      email: formData.email,
      name: formData.full_name,
      role: formData.role,
      group: formData.group_id
    })

    try {
      // Call the rebuilt createUser function
      const { data, error: createError } = await createUser(formData)

      if (createError) {
        // STEP 3 & 5: If signUp OR INSERT fails, show the error message
        console.error('❌ User creation failed:', createError.message)
        setError(createError.message)
        return
      }

      // STEP 6: If both succeed, show success view with welcome email copy
      if (data) {
        console.log('✅ User creation successful:', data.id)

        // Set created user to show success view
        setCreatedUser({
          email: data.email,
          full_name: data.full_name,
          password: formData.temporary_password
        })

        // Refresh user list in background
        onUserCreated()
      } else {
        setError('User creation completed but no user data returned')
      }

    } catch (err: any) {
      console.error('💥 Unexpected error during user creation:', err)
      setError(`Unexpected error: ${err?.message || 'Unknown error occurred'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'group_id' ? (value ? parseInt(value) : null) : value
    }))
  }

  const regeneratePassword = () => {
    setFormData(prev => ({
      ...prev,
      temporary_password: generateTemporaryPassword()
    }))
  }

  // Show success view if user was created
  if (createdUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-serif font-semibold text-navy">User Created Successfully</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-dark transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-dark mb-2">{createdUser.full_name}</h3>
              <p className="text-muted mb-4">{createdUser.email}</p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Temporary Password:</strong>
                </p>
                <p className="font-mono text-sm bg-white border border-gray-300 rounded px-3 py-2">
                  {createdUser.password}
                </p>
              </div>

              <WelcomeEmailCopy user={createdUser} className="w-full justify-center mb-4" />

              <p className="text-xs text-muted">
                The user must change their password on first login
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-navy text-white rounded-md hover:bg-navy/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-serif font-semibold text-navy">Create New User</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-dark transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark mb-1">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Enter email address"
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
          {formData.role === 'star_player' && (
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
            </div>
          )}

          {/* Temporary Password */}
          <div>
            <label htmlFor="temporary_password" className="block text-sm font-medium text-dark mb-1">
              Temporary Password
            </label>
            <div className="flex space-x-2">
              <input
                id="temporary_password"
                name="temporary_password"
                type="text"
                value={formData.temporary_password}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent font-mono text-sm"
              />
              <button
                type="button"
                onClick={regeneratePassword}
                className="px-3 py-2 text-sm text-teal border border-teal rounded-md hover:bg-teal hover:text-white transition-colors"
              >
                Regenerate
              </button>
            </div>
            <p className="text-xs text-muted mt-1">
              User must change this password on first login
            </p>
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
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}