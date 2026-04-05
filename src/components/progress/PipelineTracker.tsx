import { useState, useEffect, useMemo } from 'react'
import { User, TrendingUp, Award, Target } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canUpdateCompetencies } from '../../lib/permissions'
import { getAllUsers } from '../../lib/users'
import { getSOPCompetencies, getPipelineCertifications, calculateProgress } from '../../lib/progress'
import { SOPCompetencyGrid } from './SOPCompetencyGrid'
import { CertificationTracker } from './CertificationTracker'
import { ProgressHeatmap } from './ProgressHeatmap'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { User as UserType, SOPCompetency, PipelineCertification } from '../../types'

export function PipelineTracker() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [sops, setSOPs] = useState<SOPCompetency[]>([])
  const [certifications, setCertifications] = useState<PipelineCertification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canEdit = currentUser && canUpdateCompetencies(currentUser)
  const isStarPlayer = currentUser?.role === 'star_player'

  const loadUsers = async () => {
    if (isStarPlayer) {
      setUsers([currentUser])
      setSelectedUser(currentUser)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await getAllUsers()

      if (error) {
        console.error('Error loading users:', error)
        setError(error.message)
      } else {
        const starPlayers = (data || []).filter(u => u.role === 'star_player')
        console.log('Found star players:', starPlayers.length)
        setUsers(starPlayers)

        if (starPlayers.length > 0) {
          setSelectedUser(starPlayers[0])
        } else {
          setSelectedUser(null)
        }
      }
    } catch (err) {
      console.error('Error in loadUsers:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    if (!selectedUser) {
      setLoading(false)
      return
    }

    try {
      setError(null)

      const [sopResult, certResult] = await Promise.all([
        getSOPCompetencies(selectedUser.id),
        getPipelineCertifications(selectedUser.id)
      ])

      if (sopResult.error) {
        setError(sopResult.error.message)
      } else {
        setSOPs(sopResult.data || [])
      }

      if (certResult.error) {
        setError(certResult.error.message)
      } else {
        setCertifications(certResult.data || [])
      }
    } catch (err) {
      setError('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      loadUsers()
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (selectedUser) {
      loadProgress()
    }
  }, [selectedUser])

  const handleUpdate = () => {
    loadProgress()
  }

  // Memoize users array to prevent unnecessary ProgressHeatmap re-renders
  const memoizedUsers = useMemo(() => users, [users.map(u => u.id).join(',')])

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted">Please log in to access progress tracking</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Progress Tracker</h1>
          <p className="text-muted">Track your SOP competencies and certifications</p>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-12 w-12" />
        </div>
      </div>
    )
  }

  if (!isStarPlayer && users.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Progress Tracker</h1>
          <p className="text-muted">Monitor student progress and update competency status</p>
        </div>
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto mb-4 text-muted opacity-50" />
          <div className="text-lg font-medium text-dark mb-2">No Star Players enrolled yet</div>
          <div className="text-muted">Star Players will appear here once they're added to the system</div>
        </div>
      </div>
    )
  }

  const { sopStats, certStats, overallProgress } = calculateProgress(sops, certifications)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Progress Tracker</h1>
          <p className="text-muted">
            {isStarPlayer
              ? 'Track your SOP competencies and certifications'
              : 'Monitor student progress and update competency status'
            }
          </p>
        </div>

        {/* User Selector */}
        {canEdit && users.length > 0 && (
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted" />
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = users.find(u => u.id === e.target.value)
                setSelectedUser(user || null)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="">Select a Star Player</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} {user.group_id ? `(Group ${user.group_id})` : '(Unassigned)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedUser && (
        <>
          {/* User Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-teal rounded-full flex items-center justify-center mr-4">
                  <span className="text-lg font-medium text-white">
                    {selectedUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-serif font-medium text-navy">
                    {selectedUser.full_name}
                  </h2>
                  <p className="text-muted">
                    {selectedUser.group_id ? `Group ${selectedUser.group_id}` : 'Unassigned'} • Star Player
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-semibold text-navy">
                  {Math.round(overallProgress.sop)}%
                </div>
                <div className="text-sm text-muted">Overall SOP Progress</div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-teal">{sopStats.demonstrated + sopStats.verified}</div>
                <div className="text-sm text-muted">SOPs Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-gold">{sopStats.verified}</div>
                <div className="text-sm text-muted">SOPs Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">{certStats.completed}</div>
                <div className="text-sm text-muted">Certifications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-navy">{Math.round(overallProgress.certification)}%</div>
                <div className="text-sm text-muted">Certification Progress</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner className="h-12 w-12" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading progress data</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* Pipeline Certifications */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Award className="h-5 w-5 text-teal mr-2" />
                  <h2 className="text-lg font-serif font-medium text-navy">Pipeline Certifications</h2>
                </div>
                <CertificationTracker
                  certifications={certifications}
                  canEdit={!!canEdit}
                  onUpdate={handleUpdate}
                />
              </div>

              {/* SOP Competency Grid */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Target className="h-5 w-5 text-teal mr-2" />
                  <h2 className="text-lg font-serif font-medium text-navy">SOP Competencies</h2>
                </div>
                <SOPCompetencyGrid
                  sops={sops}
                  canEdit={!!canEdit}
                  onUpdate={handleUpdate}
                />
              </div>

              {/* Progress Heatmap (for admin/instructor) */}
              {canEdit && users.length > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="h-5 w-5 text-teal mr-2" />
                    <h2 className="text-lg font-serif font-medium text-navy">Cohort Progress Overview</h2>
                  </div>
                  <ProgressHeatmap users={memoizedUsers} />
                </div>
              )}
            </>
          )}
        </>
      )}

      {!selectedUser && !loading && (
        <div className="text-center py-12">
          <div className="text-muted">
            {isStarPlayer
              ? 'Loading your progress...'
              : 'Select a Star Player to view their progress'
            }
          </div>
        </div>
      )}
    </div>
  )
}