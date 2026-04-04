import React, { useState, useEffect, useMemo } from 'react'
import { getSOPCompetencies, getPipelineCertifications, calculateProgress } from '../../lib/progress'
import type { User } from '../../types'

interface ProgressHeatmapProps {
  users: User[]
}

interface UserProgress {
  user: User
  sopProgress: number
  certProgress: number
  overallProgress: number
}

export function ProgressHeatmap({ users }: ProgressHeatmapProps) {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stabilize users dependency by memoizing user IDs
  const userIds = useMemo(() => users.map(u => u.id).join(','), [users])

  const loadAllProgress = async () => {
    setLoading(true)
    setError(null)

    try {
      const progressData = await Promise.all(
        users.map(async (user) => {
            const [sopResult, certResult] = await Promise.all([
              getSOPCompetencies(user.id),
              getPipelineCertifications(user.id)
            ])

          const sops = sopResult.data || []
          const certs = certResult.data || []
          const { overallProgress } = calculateProgress(sops, certs)

          return {
            user,
            sopProgress: overallProgress.sop,
            certProgress: overallProgress.certification,
            overallProgress: (overallProgress.sop + overallProgress.certification) / 2
          }
        })
      )

      setUserProgress(progressData)
    } catch (error) {
      console.error('Failed to load progress data:', error)
      setError('Failed to load progress data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (users.length > 0) {
      loadAllProgress()
    } else {
      setUserProgress([])
      setLoading(false)
      setError(null)
    }
  }, [userIds])

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-green-400'
    if (progress >= 40) return 'bg-yellow-400'
    if (progress >= 20) return 'bg-orange-400'
    if (progress > 0) return 'bg-red-400'
    return 'bg-gray-200'
  }

  const getProgressLabel = (progress: number) => {
    if (progress >= 80) return 'Excellent'
    if (progress >= 60) return 'Good'
    if (progress >= 40) return 'Fair'
    if (progress >= 20) return 'Needs Improvement'
    if (progress > 0) return 'Getting Started'
    return 'Not Started'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        <p className="font-medium">Error loading progress data</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={loadAllProgress}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    )
  }

  // Sort users by group and then by overall progress
  const sortedProgress = userProgress.sort((a, b) => {
    if (a.user.group_id !== b.user.group_id) {
      return (a.user.group_id || 0) - (b.user.group_id || 0)
    }
    return b.overallProgress - a.overallProgress
  })

  // Group by training group
  const groupedProgress = sortedProgress.reduce((acc, progress) => {
    const groupId = progress.user.group_id || 0
    if (!acc[groupId]) {
      acc[groupId] = []
    }
    acc[groupId].push(progress)
    return acc
  }, {} as Record<number, UserProgress[]>)

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-navy">Progress by Student</h4>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-200 rounded mr-2" />
            <span className="text-muted">0%</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-400 rounded mr-2" />
            <span className="text-muted">1-20%</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-orange-400 rounded mr-2" />
            <span className="text-muted">21-40%</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-yellow-400 rounded mr-2" />
            <span className="text-muted">41-60%</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-400 rounded mr-2" />
            <span className="text-muted">61-80%</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded mr-2" />
            <span className="text-muted">81-100%</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="space-y-4">
        {Object.entries(groupedProgress).map(([groupId, students]) => (
          <div key={groupId} className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-navy mb-3">
              {groupId === '0' ? 'Unassigned Students' : `Group ${groupId}`}
            </h5>

            <div className="space-y-2">
              {students.map((progress) => (
                <div key={progress.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-teal rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-white">
                        {progress.user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-dark">
                        {progress.user.full_name}
                      </div>
                      <div className="text-sm text-muted">
                        {getProgressLabel(progress.overallProgress)} - {Math.round(progress.overallProgress)}% overall
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* SOP Progress */}
                    <div className="text-center">
                      <div className="text-xs text-muted mb-1">SOPs</div>
                      <div className={`h-3 w-12 rounded-full ${getProgressColor(progress.sopProgress)}`}>
                        <div className="text-xs text-white font-medium leading-3 text-center">
                          {Math.round(progress.sopProgress)}%
                        </div>
                      </div>
                    </div>

                    {/* Certification Progress */}
                    <div className="text-center">
                      <div className="text-xs text-muted mb-1">Certs</div>
                      <div className={`h-3 w-12 rounded-full ${getProgressColor(progress.certProgress)}`}>
                        <div className="text-xs text-white font-medium leading-3 text-center">
                          {Math.round(progress.certProgress)}%
                        </div>
                      </div>
                    </div>

                    {/* Overall Progress Circle */}
                    <div className="text-center">
                      <div className="text-xs text-muted mb-1">Overall</div>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getProgressColor(progress.overallProgress)}`}>
                        <span className="text-xs font-medium text-white">
                          {Math.round(progress.overallProgress)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-navy text-white rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold">
              {Math.round(userProgress.reduce((sum, p) => sum + p.overallProgress, 0) / userProgress.length) || 0}%
            </div>
            <div className="text-sm opacity-90">Cohort Average</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold">
              {userProgress.filter(p => p.overallProgress >= 80).length}
            </div>
            <div className="text-sm opacity-90">Excellent (80%+)</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold">
              {userProgress.filter(p => p.overallProgress >= 60).length}
            </div>
            <div className="text-sm opacity-90">On Track (60%+)</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold">
              {userProgress.filter(p => p.overallProgress < 40).length}
            </div>
            <div className="text-sm opacity-90">Need Support (&lt;40%)</div>
          </div>
        </div>
      </div>
    </div>
  )
}