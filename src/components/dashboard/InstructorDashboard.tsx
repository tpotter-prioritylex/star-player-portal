import { useState, useEffect } from 'react'
import { BookOpen, Upload, TrendingUp, Users } from 'lucide-react'
import { getDashboardStats } from '../../lib/dashboard'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { DashboardStats } from '../../lib/dashboard'

export function InstructorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await getDashboardStats()

        if (fetchError) {
          setError(fetchError.message || 'Failed to load dashboard statistics')
        } else {
          setStats(data)
        }
      } catch (err: any) {
        console.error('❌ InstructorDashboard loadStats error:', err)
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Instructor Dashboard</h1>
          <p className="text-muted">Monitor student progress and manage curriculum</p>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-12 w-12" />
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-navy">Instructor Dashboard</h1>
        <p className="text-muted">Monitor student progress and manage curriculum</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-teal" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted">Star Players</p>
              <p className="text-2xl font-semibold text-navy">{stats?.totalStarPlayers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Upload className="h-8 w-8 text-navy" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted">Pending Reviews</p>
              <p className="text-2xl font-semibold text-navy">{stats?.pendingReviews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-gold" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted">Avg Completion</p>
              <p className="text-2xl font-semibold text-navy">{stats?.avgCompletion || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-serif font-medium text-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Upload className="h-6 w-6 text-teal mb-2" />
            <p className="font-medium text-navy">Review Submissions</p>
            <p className="text-sm text-muted">Review student work across all groups</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <BookOpen className="h-6 w-6 text-teal mb-2" />
            <p className="font-medium text-navy">Upload Materials</p>
            <p className="text-sm text-muted">Add curriculum content</p>
          </button>
        </div>
      </div>
    </div>
  )
}