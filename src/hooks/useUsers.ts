import { useState, useEffect } from 'react'
import { getAllUsers } from '../lib/users'
import type { User } from '../types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: loadError } = await getAllUsers()

      if (loadError) {
        setError(loadError.message)
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const refreshUsers = () => {
    loadUsers()
  }

  return {
    users,
    loading,
    error,
    refreshUsers
  }
}