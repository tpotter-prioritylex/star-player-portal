import { CheckCircle, AlertCircle, Clock, Plus } from 'lucide-react'
import { getAssignmentStatusColor, getAssignmentStatusLabel } from '../../lib/assignments'
import type { TrainingDay, StudentUpload } from '../../types'

interface AssignmentCardProps {
  trainingDay: TrainingDay
  assignment?: StudentUpload
  onUpload: () => void
  onUpdate: () => void
}

export function AssignmentCard({ trainingDay, assignment, onUpload, onUpdate: _onUpdate }: AssignmentCardProps) {
  const getStatusIcon = () => {
    if (!assignment) {
      return <Plus className="h-5 w-5 text-muted" />
    }

    switch (assignment.status) {
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'reviewed':
        return <CheckCircle className="h-5 w-5 text-purple-600" />
      case 'revision_needed':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Clock className="h-5 w-5 text-muted" />
    }
  }

  const getCardStyle = () => {
    if (!assignment) {
      return 'border-2 border-dashed border-gray-300 hover:border-teal'
    }

    switch (assignment.status) {
      case 'submitted':
        return 'border border-blue-200 bg-blue-50'
      case 'reviewed':
        return 'border border-purple-200 bg-purple-50'
      case 'revision_needed':
        return 'border border-yellow-200 bg-yellow-50'
      case 'approved':
        return 'border border-green-200 bg-green-50'
      default:
        return 'border border-gray-200 bg-white'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div
      className={`rounded-lg p-4 transition-all duration-200 cursor-pointer ${getCardStyle()}`}
      onClick={onUpload}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-dark">
          Day {trainingDay.day_number}
        </div>
        {getStatusIcon()}
      </div>

      {/* Title */}
      <h3 className="font-medium text-dark mb-2 line-clamp-2">
        {trainingDay.title}
      </h3>

      {/* SOPs */}
      {trainingDay.sop_series && trainingDay.sop_series.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {trainingDay.sop_series.slice(0, 2).map(sop => (
            <span key={sop} className="px-1.5 py-0.5 bg-teal text-white text-xs rounded">
              {sop}
            </span>
          ))}
          {trainingDay.sop_series.length > 2 && (
            <span className="px-1.5 py-0.5 bg-gray-300 text-gray-600 text-xs rounded">
              +{trainingDay.sop_series.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Assignment Info */}
      {assignment ? (
        <div className="space-y-2">
          <div className="text-sm font-medium text-dark truncate">
            {assignment.title}
          </div>

          <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAssignmentStatusColor(assignment.status)}`}>
            {getAssignmentStatusLabel(assignment.status)}
          </div>

          <div className="text-xs text-muted">
            Submitted {formatDate(assignment.created_at)}
          </div>

          {assignment.reviewer_notes && assignment.status !== 'submitted' && (
            <div className="text-xs text-muted bg-white/50 p-2 rounded border">
              <div className="font-medium mb-1">Feedback:</div>
              <div className="line-clamp-2">{assignment.reviewer_notes}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="text-sm text-muted mb-2">
            No submission yet
          </div>
          <div className="text-xs text-muted">
            Click to upload assignment
          </div>
        </div>
      )}
    </div>
  )
}