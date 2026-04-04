import React, { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { uploadAssignment } from '../../lib/assignments'
import type { TrainingDay } from '../../types'

interface UploadAssignmentModalProps {
  trainingDays: TrainingDay[]
  selectedDay?: TrainingDay | null
  onClose: () => void
  onSuccess: () => void
}

export function UploadAssignmentModal({ trainingDays, selectedDay, onClose, onSuccess }: UploadAssignmentModalProps) {
  const [formData, setFormData] = useState({
    day_id: selectedDay?.id || 0,
    title: '',
    description: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    if (!formData.day_id) {
      setError('Please select a training day')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a title for your assignment')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { data, error: uploadError } = await uploadAssignment({
        ...formData,
        file
      })

      if (uploadError) {
        setError(uploadError.message)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to upload assignment')
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'day_id' ? parseInt(value) : value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-fill title from filename if empty
      if (!formData.title) {
        const fileName = selectedFile.name.split('.')[0].replace(/[-_]/g, ' ')
        setFormData(prev => ({ ...prev, title: fileName }))
      }
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B'
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB'
    return Math.round(size / (1024 * 1024) * 10) / 10 + ' MB'
  }

  const selectedTrainingDay = trainingDays.find(day => day.id === formData.day_id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-serif font-semibold text-navy">Upload Assignment</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-muted hover:text-dark transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Training Day */}
          <div>
            <label htmlFor="day_id" className="block text-sm font-medium text-dark mb-1">
              Training Day *
            </label>
            <select
              id="day_id"
              name="day_id"
              value={formData.day_id}
              onChange={handleChange}
              required
              disabled={!!selectedDay}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:bg-gray-100"
            >
              <option value={0}>Select training day</option>
              {trainingDays.map(day => (
                <option key={day.id} value={day.id}>
                  Day {day.day_number}: {day.title}
                </option>
              ))}
            </select>
            {selectedTrainingDay && (
              <div className="mt-2 text-sm text-muted">
                <div>{selectedTrainingDay.description}</div>
                {selectedTrainingDay.sop_series && selectedTrainingDay.sop_series.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTrainingDay.sop_series.map(sop => (
                      <span key={sop} className="px-2 py-0.5 bg-teal text-white text-xs rounded">
                        {sop}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-dark mb-1">
              Assignment File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-teal transition-colors">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                required
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.txt"
              />
              <label htmlFor="file" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted" />
                {file ? (
                  <div>
                    <div className="font-medium text-dark">{file.name}</div>
                    <div className="text-sm text-muted">{formatFileSize(file.size)}</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-dark">Click to select file</div>
                    <div className="text-sm text-muted">
                      PDF, Word, Excel, PowerPoint, Images, ZIP files
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-dark mb-1">
              Assignment Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Enter assignment title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Optional description or notes about your assignment"
            />
          </div>

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
              disabled={uploading}
              className="px-4 py-2 text-sm text-muted hover:text-dark border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 text-sm bg-navy text-white rounded-md hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}