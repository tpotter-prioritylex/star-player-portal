import React, { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { uploadMaterial } from '../../lib/materials'
import type { TrainingDay } from '../../types'

interface UploadMaterialModalProps {
  trainingDays: TrainingDay[]
  onClose: () => void
  onSuccess: () => void
}

export function UploadMaterialModal({ trainingDays, onClose, onSuccess }: UploadMaterialModalProps) {
  const [formData, setFormData] = useState({
    day_id: 0,
    title: '',
    description: '',
    sop_reference: '',
    practice_area: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sopOptions = [
    'A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'A-8',
    'B-1', 'B-2', 'B-4', 'B-5',
    'D-1', 'D-2', 'D-3', 'D-4',
    'F-1', 'F-2', 'F-3', 'F-4'
  ]

  const practiceAreas = [
    'General Practice',
    'Corporate Law',
    'Litigation',
    'Real Estate',
    'Family Law',
    'Criminal Law',
    'Immigration',
    'Personal Injury',
    'Estate Planning',
    'Employment Law'
  ]

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
      setError('Please enter a title')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { data: _data, error: uploadError } = await uploadMaterial({
        ...formData,
        file
      })

      if (uploadError) {
        setError(uploadError.message)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to upload material')
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
        const fileName = selectedFile.name.split('.')[0]
        setFormData(prev => ({ ...prev, title: fileName }))
      }
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B'
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB'
    return Math.round(size / (1024 * 1024) * 10) / 10 + ' MB'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-serif font-semibold text-navy">Upload Material</h2>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value={0}>Select training day</option>
              {trainingDays.map(day => (
                <option key={day.id} value={day.id}>
                  Day {day.day_number}: {day.title}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-dark mb-1">
              File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-teal transition-colors">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                required
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
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
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Enter material title"
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
              placeholder="Optional description of the material"
            />
          </div>

          {/* SOP Reference */}
          <div>
            <label htmlFor="sop_reference" className="block text-sm font-medium text-dark mb-1">
              SOP Reference
            </label>
            <select
              id="sop_reference"
              name="sop_reference"
              value={formData.sop_reference}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="">Select SOP (optional)</option>
              {sopOptions.map(sop => (
                <option key={sop} value={sop}>{sop}</option>
              ))}
            </select>
          </div>

          {/* Practice Area */}
          <div>
            <label htmlFor="practice_area" className="block text-sm font-medium text-dark mb-1">
              Practice Area
            </label>
            <select
              id="practice_area"
              name="practice_area"
              value={formData.practice_area}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="">Select practice area (optional)</option>
              {practiceAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
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
              {uploading ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}