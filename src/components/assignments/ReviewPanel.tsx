import React, { useState } from 'react'
import { X, Download, User, Calendar, FileText, MessageSquare } from 'lucide-react'
import { updateAssignmentStatus, downloadAssignment, getAssignmentStatusColor, getAssignmentStatusLabel } from '../../lib/assignments'
import type { StudentUpload } from '../../types'

interface ReviewPanelProps {
  assignment: StudentUpload
  onClose: () => void
  onSuccess: () => void
}

export function ReviewPanel({ assignment, onClose, onSuccess }: ReviewPanelProps) {
  const [status, setStatus] = useState<StudentUpload['status']>(assignment.status)
  const [notes, setNotes] = useState(assignment.reviewer_notes || '')
  const [updating, setUpdating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (status === assignment.status && notes === (assignment.reviewer_notes || '')) {
      onClose()
      return
    }

    setUpdating(true)
    setError(null)

    try {
      const { error: updateError } = await updateAssignmentStatus(assignment.id, {
        status,
        reviewer_notes: notes.trim() || undefined
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to update assignment status')
    } finally {
      setUpdating(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadAssignment(assignment)
    } catch (error) {
      alert('Failed to download file')
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (size: number | null) => {
    if (!size) return 'Unknown size'
    if (size < 1024) return size + ' B'
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB'
    return Math.round(size / (1024 * 1024) * 10) / 10 + ' MB'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-serif font-semibold text-navy">Review Assignment</h2>
            <p className="text-sm text-muted">
              {assignment.user?.full_name} • Group {assignment.group_id}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={updating}
            className="text-muted hover:text-dark transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Assignment Details */}
        <div className="p-6 space-y-6">
          {/* Assignment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-dark mb-3">{assignment.title}</h3>

            {assignment.description && (
              <p className="text-muted mb-3">{assignment.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-muted">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Day {assignment.training_day?.day_number}: {assignment.training_day?.title}</span>
              </div>

              <div className="flex items-center text-muted">
                <User className="h-4 w-4 mr-2" />
                <span>{assignment.user?.full_name}</span>
              </div>

              <div className="flex items-center text-muted">
                <FileText className="h-4 w-4 mr-2" />
                <span>{assignment.file_name} ({formatFileSize(assignment.file_size)})</span>
              </div>

              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted" />
                <span className="text-muted">Submitted {formatDate(assignment.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-muted mr-2">Current Status:</span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getAssignmentStatusColor(assignment.status)}`}>
                  {getAssignmentStatusLabel(assignment.status)}
                </span>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center px-4 py-2 bg-navy text-white rounded-md hover:bg-navy/90 disabled:opacity-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download File'}
              </button>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-dark mb-2">
                Review Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StudentUpload['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              >
                <option value="submitted">Submitted (No review yet)</option>
                <option value="reviewed">Reviewed</option>
                <option value="revision_needed">Needs Revision</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            {/* Reviewer Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-dark mb-2">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Feedback and Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                placeholder="Provide feedback to the student..."
              />
              <div className="text-xs text-muted mt-1">
                This feedback will be visible to the student
              </div>
            </div>

            {/* Previous Review */}
            {assignment.reviewer_notes && assignment.status !== 'submitted' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">Previous Review</div>
                <div className="text-sm text-blue-800">{assignment.reviewer_notes}</div>
                {assignment.reviewed_at && (
                  <div className="text-xs text-blue-600 mt-2">
                    Reviewed on {formatDate(assignment.reviewed_at)}
                  </div>
                )}
              </div>
            )}

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
                disabled={updating}
                className="px-4 py-2 text-sm text-muted hover:text-dark border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 text-sm bg-navy text-white rounded-md hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? 'Updating...' : 'Update Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}