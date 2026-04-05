import { useState, useEffect } from 'react'
import { Plus, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canReviewUploads } from '../../lib/permissions'
import { getTrainingDays } from '../../lib/materials'
import { getStudentUploads } from '../../lib/assignments'
import { UploadAssignmentModal } from './UploadAssignmentModal'
import { ReviewPanel } from './ReviewPanel'
import { AssignmentTable } from './AssignmentTable'
import { AssignmentCard } from './AssignmentCard'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { TrainingDay, StudentUpload } from '../../types'

export function AssignmentGrid() {
  const { user } = useAuth()
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([])
  const [assignments, setAssignments] = useState<StudentUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<TrainingDay | null>(null)
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<StudentUpload | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const canReview = user && canReviewUploads(user)
  const isStarPlayer = user?.role === 'star_player'

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [daysResult, assignmentsResult] = await Promise.all([
        getTrainingDays(),
        getStudentUploads(isStarPlayer ? user?.id : undefined)
      ])

      if (daysResult.error) {
        setError(daysResult.error.message)
      } else {
        setTrainingDays(daysResult.data || [])
      }

      if (assignmentsResult.error) {
        setError(assignmentsResult.error.message)
      } else {
        setAssignments(assignmentsResult.data || [])
      }
    } catch (err: any) {
      console.error('❌ AssignmentGrid loadData error:', err)
      setError(err.message || 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const handleUploadSuccess = () => {
    loadData()
    setShowUploadModal(false)
  }

  const handleReviewSuccess = () => {
    loadData()
    setShowReviewPanel(false)
    setSelectedAssignment(null)
  }

  const filteredAssignments = assignments.filter(assignment => {
    if (statusFilter === 'all') return true
    return assignment.status === statusFilter
  })

  // Calculate stats
  const stats = {
    total: assignments.length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    reviewed: assignments.filter(a => a.status === 'reviewed').length,
    approved: assignments.filter(a => a.status === 'approved').length,
    needsRevision: assignments.filter(a => a.status === 'revision_needed').length,
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted">Please log in to access assignments</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Assignments</h1>
          <p className="text-muted">Upload and manage your training assignments</p>
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
          <h1 className="text-2xl font-serif font-semibold text-navy">Assignments</h1>
          <p className="text-muted">
            {isStarPlayer
              ? 'Upload and track your training assignments'
              : 'Review student submissions and provide feedback'
            }
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {canReview && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-muted hover:bg-gray-200'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  viewMode === 'table'
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-muted hover:bg-gray-200'
                }`}
              >
                Table
              </button>
            </div>
          )}

          {isStarPlayer && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-navy text-white rounded-md hover:bg-navy/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Assignment
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl font-semibold text-navy">{stats.total}</div>
            <div className="ml-auto">
              <Clock className="h-5 w-5 text-muted" />
            </div>
          </div>
          <div className="text-sm text-muted">Total Submissions</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl font-semibold text-blue-600">{stats.submitted}</div>
            <div className="ml-auto">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-sm text-muted">Awaiting Review</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl font-semibold text-purple-600">{stats.reviewed}</div>
            <div className="ml-auto">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="text-sm text-muted">Reviewed</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl font-semibold text-yellow-600">{stats.needsRevision}</div>
            <div className="ml-auto">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <div className="text-sm text-muted">Needs Revision</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl font-semibold text-green-600">{stats.approved}</div>
            <div className="ml-auto">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="text-sm text-muted">Approved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="revision_needed">Needs Revision</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading assignments</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      {isStarPlayer ? (
        // Star Player Grid View
        <div>
          <h2 className="text-lg font-serif font-medium text-navy mb-4">Your Assignment Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {trainingDays.map(day => {
              const dayAssignments = assignments.filter(a => a.day_id === day.id)
              const latestAssignment = dayAssignments[0] // Most recent

              return (
                <AssignmentCard
                  key={day.id}
                  trainingDay={day}
                  assignment={latestAssignment}
                  onUpload={() => {
                    setSelectedDay(day)
                    setShowUploadModal(true)
                  }}
                  onUpdate={loadData}
                />
              )
            })}
          </div>
        </div>
      ) : (
        // Admin/Instructor View
        viewMode === 'table' ? (
          <AssignmentTable
            assignments={filteredAssignments}
            onReview={(assignment) => {
              setSelectedAssignment(assignment)
              setShowReviewPanel(true)
            }}
            onUpdate={loadData}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(assignment => (
              <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-dark">{assignment.title}</h3>
                    <p className="text-sm text-muted">
                      {assignment.user?.full_name} • Group {assignment.group_id}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    assignment.status === 'reviewed' ? 'bg-purple-100 text-purple-800' :
                    assignment.status === 'revision_needed' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {assignment.status === 'submitted' ? 'Awaiting Review' :
                     assignment.status === 'reviewed' ? 'Reviewed' :
                     assignment.status === 'revision_needed' ? 'Needs Revision' :
                     'Approved'}
                  </span>
                </div>

                {assignment.description && (
                  <p className="text-sm text-muted mb-3 line-clamp-2">
                    {assignment.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    Day {assignment.training_day?.day_number}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setShowReviewPanel(true)
                    }}
                    className="text-teal hover:text-teal/80 font-medium"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {filteredAssignments.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-muted">
            {isStarPlayer
              ? 'No assignments uploaded yet. Start by uploading your first assignment!'
              : 'No assignments to review at this time.'
            }
          </div>
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadAssignmentModal
          trainingDays={trainingDays}
          selectedDay={selectedDay}
          onClose={() => {
            setShowUploadModal(false)
            setSelectedDay(null)
          }}
          onSuccess={handleUploadSuccess}
        />
      )}

      {showReviewPanel && selectedAssignment && (
        <ReviewPanel
          assignment={selectedAssignment}
          onClose={() => {
            setShowReviewPanel(false)
            setSelectedAssignment(null)
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  )
}