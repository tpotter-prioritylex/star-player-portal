import { Download, Eye } from 'lucide-react'
import { downloadAssignment, getAssignmentStatusColor, getAssignmentStatusLabel } from '../../lib/assignments'
import type { StudentUpload } from '../../types'

interface AssignmentTableProps {
  assignments: StudentUpload[]
  onReview: (assignment: StudentUpload) => void
  onUpdate: () => void
}

export function AssignmentTable({ assignments, onReview, onUpdate: _onUpdate }: AssignmentTableProps) {
  const handleDownload = async (assignment: StudentUpload, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await downloadAssignment(assignment)
    } catch (error) {
      alert('Failed to download file')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (size: number | null) => {
    if (!size) return '—'
    if (size < 1024) return size + ' B'
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB'
    return Math.round(size / (1024 * 1024) * 10) / 10 + ' MB'
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-muted">No assignments to display</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Assignment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Training Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                File
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <tr
                key={assignment.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onReview(assignment)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-teal rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {assignment.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-dark">
                        {assignment.user?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted">
                        Group {assignment.group_id}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-dark">
                    {assignment.title}
                  </div>
                  {assignment.description && (
                    <div className="text-sm text-muted line-clamp-1">
                      {assignment.description}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-dark">
                    Day {assignment.training_day?.day_number}
                  </div>
                  <div className="text-sm text-muted">
                    {assignment.training_day?.title}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAssignmentStatusColor(assignment.status)}`}>
                    {getAssignmentStatusLabel(assignment.status)}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-dark">
                    {formatDate(assignment.created_at)}
                  </div>
                  {assignment.reviewed_at && assignment.status !== 'submitted' && (
                    <div className="text-xs text-muted">
                      Reviewed {formatDate(assignment.reviewed_at)}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-dark">
                    {assignment.file_name}
                  </div>
                  <div className="text-xs text-muted">
                    {formatFileSize(assignment.file_size)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => handleDownload(assignment, e)}
                      className="text-navy hover:text-navy/80 transition-colors"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onReview(assignment)}
                      className="text-teal hover:text-teal/80 transition-colors"
                      title="Review assignment"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}