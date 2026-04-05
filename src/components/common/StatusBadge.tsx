interface StatusBadgeProps {
  status: 'submitted' | 'reviewed' | 'revision_needed' | 'approved' | 'not_started' | 'in_progress' | 'demonstrated' | 'verified' | 'completed'
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'reviewed':
        return 'bg-purple-100 text-purple-800'
      case 'revision_needed':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'not_started':
        return 'bg-gray-100 text-gray-600'
      case 'in_progress':
        return 'bg-teal/10 text-teal border border-teal/20'
      case 'demonstrated':
        return 'bg-teal text-white'
      case 'verified':
        return 'bg-gold text-navy'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'submitted':
        return 'Submitted'
      case 'reviewed':
        return 'Reviewed'
      case 'revision_needed':
        return 'Needs Revision'
      case 'approved':
        return 'Approved'
      case 'not_started':
        return 'Not Started'
      case 'in_progress':
        return 'In Progress'
      case 'demonstrated':
        return 'Demonstrated'
      case 'verified':
        return 'Verified'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles()} ${className}`}>
      {getStatusLabel()}
    </span>
  )
}