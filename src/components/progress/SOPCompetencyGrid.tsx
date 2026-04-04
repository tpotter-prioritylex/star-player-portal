import React, { useState } from 'react'
import { Check, Clock, Star, Target, MessageSquare } from 'lucide-react'
import { updateSOPCompetency, groupSOPsBySeries, getSOPStatusColor, getSOPStatusLabel } from '../../lib/progress'
import { SOP_SERIES } from '../../types'
import type { SOPCompetency } from '../../types'

interface SOPCompetencyGridProps {
  sops: SOPCompetency[]
  canEdit: boolean
  onUpdate: () => void
}

export function SOPCompetencyGrid({ sops, canEdit, onUpdate }: SOPCompetencyGridProps) {
  const [updating, setUpdating] = useState<number | null>(null)
  const [selectedSOP, setSelectedSOP] = useState<SOPCompetency | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)

  const groupedSOPs = groupSOPsBySeries(sops)

  const handleStatusUpdate = async (sop: SOPCompetency, newStatus: SOPCompetency['status']) => {
    if (!canEdit) return

    setUpdating(sop.id)
    try {
      const { error } = await updateSOPCompetency(sop.id, newStatus, sop.notes || undefined)
      if (error) {
        alert(`Failed to update SOP: ${error.message}`)
      } else {
        onUpdate()
      }
    } catch (err) {
      alert('Failed to update SOP')
    } finally {
      setUpdating(null)
    }
  }

  const handleNotesUpdate = async (notes: string) => {
    if (!selectedSOP) return

    setUpdating(selectedSOP.id)
    try {
      const { error } = await updateSOPCompetency(selectedSOP.id, selectedSOP.status, notes)
      if (error) {
        alert(`Failed to update notes: ${error.message}`)
      } else {
        onUpdate()
        setShowNotesModal(false)
        setSelectedSOP(null)
      }
    } catch (err) {
      alert('Failed to update notes')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (status: SOPCompetency['status']) => {
    switch (status) {
      case 'not_started':
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-teal" />
      case 'demonstrated':
        return <Check className="h-4 w-4 text-teal" />
      case 'verified':
        return <Star className="h-4 w-4 text-gold" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getNextStatus = (currentStatus: SOPCompetency['status']): SOPCompetency['status'] => {
    switch (currentStatus) {
      case 'not_started':
        return 'in_progress'
      case 'in_progress':
        return 'demonstrated'
      case 'demonstrated':
        return 'verified'
      case 'verified':
        return 'not_started' // Cycle back
      default:
        return 'in_progress'
    }
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full border-2 border-gray-300 mr-2" />
          <span className="text-muted">Not Started</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 text-teal mr-2" />
          <span className="text-muted">In Progress</span>
        </div>
        <div className="flex items-center">
          <Check className="h-3 w-3 text-teal mr-2" />
          <span className="text-muted">Demonstrated</span>
        </div>
        <div className="flex items-center">
          <Star className="h-3 w-3 text-gold mr-2" />
          <span className="text-muted">Verified</span>
        </div>
      </div>

      {/* SOP Grid by Series */}
      <div className="space-y-6">
        {Object.entries(groupedSOPs).sort().map(([series, seriesSOPs]) => (
          <div key={series}>
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-medium text-navy mr-2">
                {series} Series
              </h3>
              <span className="text-sm text-muted">
                {SOP_SERIES[series as keyof typeof SOP_SERIES]}
              </span>
              <div className="ml-auto text-sm text-muted">
                {seriesSOPs.filter(s => s.status === 'demonstrated' || s.status === 'verified').length} of {seriesSOPs.length} completed
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {seriesSOPs.sort((a, b) => a.sop_code.localeCompare(b.sop_code)).map(sop => (
                <div
                  key={sop.id}
                  className={`border-2 rounded-lg p-3 transition-all duration-200 ${
                    canEdit ? 'cursor-pointer hover:shadow-md' : ''
                  } ${getSOPStatusColor(sop.status)}`}
                  onClick={() => canEdit && handleStatusUpdate(sop, getNextStatus(sop.status))}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="font-mono text-sm font-medium mr-2">
                        {sop.sop_code}
                      </span>
                      {getStatusIcon(sop.status)}
                    </div>
                    {updating === sop.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    )}
                  </div>

                  <h4 className="font-medium text-sm mb-2 line-clamp-2">
                    {sop.sop_title}
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium">
                      {getSOPStatusLabel(sop.status)}
                    </span>

                    {sop.notes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSOP(sop)
                          setShowNotesModal(true)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="View notes"
                      >
                        <MessageSquare className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {sop.updated_at && sop.status !== 'not_started' && (
                    <div className="text-xs opacity-75 mt-1">
                      Updated {new Date(sop.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedSOP && (
        <SOPNotesModal
          sop={selectedSOP}
          canEdit={canEdit}
          onClose={() => {
            setShowNotesModal(false)
            setSelectedSOP(null)
          }}
          onSave={handleNotesUpdate}
        />
      )}
    </div>
  )
}

interface SOPNotesModalProps {
  sop: SOPCompetency
  canEdit: boolean
  onClose: () => void
  onSave: (notes: string) => void
}

function SOPNotesModal({ sop, canEdit, onClose, onSave }: SOPNotesModalProps) {
  const [notes, setNotes] = useState(sop.notes || '')

  const handleSave = () => {
    onSave(notes)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium text-navy">
            {sop.sop_code}: {sop.sop_title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getSOPStatusColor(sop.status)}`}>
              {getSOPStatusLabel(sop.status)}
            </span>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canEdit}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:bg-gray-100"
            placeholder="Add notes about this SOP competency..."
          />

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-navy text-white rounded-md hover:bg-navy/90"
              >
                Save Notes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}