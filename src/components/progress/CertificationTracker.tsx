import React, { useState } from 'react'
import { Award, Clock, CheckCircle, Play } from 'lucide-react'
import { updatePipelineCertification, getCertificationStatusColor, getCertificationStatusLabel } from '../../lib/progress'
import { PIPELINE_CERTIFICATIONS, CLIO_CREDENTIALS } from '../../types'
import type { PipelineCertification } from '../../types'

interface CertificationTrackerProps {
  certifications: PipelineCertification[]
  canEdit: boolean
  onUpdate: () => void
}

export function CertificationTracker({ certifications, canEdit, onUpdate }: CertificationTrackerProps) {
  const [updating, setUpdating] = useState<number | null>(null)

  const handleStatusUpdate = async (certification: PipelineCertification, newStatus: PipelineCertification['status']) => {
    if (!canEdit) return

    setUpdating(certification.id)
    try {
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : undefined
      const { error } = await updatePipelineCertification(certification.id, newStatus, completedAt)
      if (error) {
        alert(`Failed to update certification: ${error.message}`)
      } else {
        onUpdate()
      }
    } catch (err) {
      alert('Failed to update certification')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (status: PipelineCertification['status']) => {
    switch (status) {
      case 'not_started':
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-teal" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getNextStatus = (currentStatus: PipelineCertification['status']): PipelineCertification['status'] => {
    switch (currentStatus) {
      case 'not_started':
        return 'in_progress'
      case 'in_progress':
        return 'completed'
      case 'completed':
        return 'not_started' // Cycle back for re-certification
      default:
        return 'in_progress'
    }
  }

  const getGroupedCertifications = () => {
    const core = certifications.filter(c => PIPELINE_CERTIFICATIONS.includes(c.certification as any))
    const clio = certifications.filter(c => CLIO_CREDENTIALS.includes(c.certification as any))

    return { core, clio }
  }

  const { core, clio } = getGroupedCertifications()

  const CertificationCard = ({ certification }: { certification: PipelineCertification }) => (
    <div
      className={`border-2 rounded-lg p-4 transition-all duration-200 ${
        canEdit ? 'cursor-pointer hover:shadow-md' : ''
      } ${
        certification.status === 'completed'
          ? 'border-green-200 bg-green-50'
          : certification.status === 'in_progress'
          ? 'border-teal/20 bg-teal/5'
          : 'border-gray-200 bg-white'
      }`}
      onClick={() => canEdit && handleStatusUpdate(certification, getNextStatus(certification.status))}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getStatusIcon(certification.status)}
          <span className="ml-2 font-medium text-dark">
            {certification.certification}
          </span>
        </div>
        {updating === certification.id && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal" />
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCertificationStatusColor(certification.status)}`}>
          {getCertificationStatusLabel(certification.status)}
        </span>

        {certification.status === 'completed' && certification.completed_at && (
          <span className="text-xs text-muted">
            Completed {new Date(certification.completed_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {certification.status === 'in_progress' && (
        <div className="mt-2">
          <div className="flex items-center text-xs text-teal">
            <Play className="h-3 w-3 mr-1" />
            <span>In progress...</span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Core Pipeline Tools */}
      <div>
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-gold mr-2" />
          <h3 className="text-lg font-medium text-navy">Core Pipeline Tools</h3>
          <div className="ml-auto text-sm text-muted">
            {core.filter(c => c.status === 'completed').length} of {core.length} completed
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {core.map(certification => (
            <CertificationCard key={certification.id} certification={certification} />
          ))}
        </div>
      </div>

      {/* Clio Credentials */}
      <div>
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-teal mr-2" />
          <h3 className="text-lg font-medium text-navy">Clio Credentials</h3>
          <div className="ml-auto text-sm text-muted">
            {clio.filter(c => c.status === 'completed').length} of {clio.length} completed
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clio.map(certification => (
            <CertificationCard key={certification.id} certification={certification} />
          ))}
        </div>
      </div>

      {/* Research Platform (Midpage only - included in core pipeline above) */}

      {/* Overall Progress */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-navy">Overall Certification Progress</h4>
            <p className="text-sm text-muted">
              {certifications.filter(c => c.status === 'completed').length} of {certifications.length} certifications completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-navy">
              {certifications.length > 0
                ? Math.round(certifications.filter(c => c.status === 'completed').length / certifications.length * 100)
                : 0}%
            </div>
            <div className="text-sm text-muted">Complete</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal h-2 rounded-full transition-all duration-300"
              style={{
                width: `${certifications.length > 0
                  ? certifications.filter(c => c.status === 'completed').length / certifications.length * 100
                  : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="text-sm text-muted bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-medium text-blue-900 mb-1">For Instructors and Admins:</p>
          <p className="text-blue-800">
            Click on any certification card to cycle through statuses: Not Started → In Progress → Completed
          </p>
        </div>
      )}
    </div>
  )
}