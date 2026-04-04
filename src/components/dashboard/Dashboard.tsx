import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { AdminDashboard } from './AdminDashboard'
import { InstructorDashboard } from './InstructorDashboard'
import { StarPlayerDashboard } from './StarPlayerDashboard'

export function Dashboard() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />
    case 'instructor':
      return <InstructorDashboard />
    case 'star_player':
      return <StarPlayerDashboard />
    default:
      return (
        <div className="text-center py-12">
          <p className="text-muted">Unknown user role</p>
        </div>
      )
  }
}