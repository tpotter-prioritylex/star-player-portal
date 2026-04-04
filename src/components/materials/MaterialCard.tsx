import React, { useState } from 'react'
import { Download, Trash2, Calendar, User, Tag } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canUploadCurriculum } from '../../lib/permissions'
import { downloadMaterial, deleteMaterial, formatFileSize, getFileIcon } from '../../lib/materials'
import type { CurriculumMaterial } from '../../types'

interface MaterialCardProps {
  material: CurriculumMaterial
  onUpdate: () => void
}

export function MaterialCard({ material, onUpdate }: MaterialCardProps) {
  const { user } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadMaterial(material)
    } catch (error) {
      alert('Failed to download file')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${material.title}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await deleteMaterial(material.id)
      if (error) {
        alert(`Failed to delete material: ${error.message}`)
      } else {
        onUpdate()
      }
    } catch (error) {
      alert('Failed to delete material')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <span className="text-lg mr-2">
              {getFileIcon(material.file_name)}
            </span>
            <h3 className="font-medium text-dark truncate">
              {material.title}
            </h3>
          </div>

          {material.description && (
            <p className="text-sm text-muted line-clamp-2 mb-2">
              {material.description}
            </p>
          )}
        </div>

        {user && canUploadCurriculum(user) && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors ml-2"
            title="Delete material"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs text-muted">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formatDate(material.created_at)}</span>
        </div>

        <div className="flex items-center text-xs text-muted">
          <span>{formatFileSize(material.file_size)}</span>
          <span className="mx-1">•</span>
          <span className="truncate">{material.file_name}</span>
        </div>

        {material.sop_reference && (
          <div className="flex items-center">
            <Tag className="h-3 w-3 mr-1 text-teal" />
            <span className="text-xs bg-teal text-white px-2 py-0.5 rounded-full">
              {material.sop_reference}
            </span>
          </div>
        )}

        {material.practice_area && (
          <div className="text-xs text-muted">
            <span className="font-medium">Practice Area:</span> {material.practice_area}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center px-3 py-1.5 bg-navy text-white rounded-md hover:bg-navy/90 disabled:opacity-50 transition-colors text-sm"
        >
          <Download className="h-3 w-3 mr-1" />
          {downloading ? 'Downloading...' : 'Download'}
        </button>

        <div className="text-xs text-muted">
          <User className="h-3 w-3 inline mr-1" />
          Uploaded by {material.uploaded_by ? 'instructor' : 'system'}
        </div>
      </div>
    </div>
  )
}