import React, { useState } from 'react'
import { X, Pin, Megaphone } from 'lucide-react'
import type { Announcement } from '../../types'

interface CreateAnnouncementModalProps {
  announcement?: Announcement | null
  onSave: (announcementData: { title: string; content: string; pinned: boolean }) => Promise<void>
  onClose: () => void
}

export function CreateAnnouncementModal({ announcement, onSave, onClose }: CreateAnnouncementModalProps) {
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    pinned: announcement?.pinned || false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('Please enter a title for the announcement')
      return
    }

    if (!formData.content.trim()) {
      setError('Please enter the announcement content')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        title: formData.title.trim(),
        content: formData.content.trim(),
        pinned: formData.pinned,
      })
    } catch (err) {
      setError('Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Megaphone className="h-5 w-5 text-teal mr-2" />
            <h2 className="text-lg font-serif font-semibold text-navy">
              {announcement ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-muted hover:text-dark transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              placeholder="Enter announcement title"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-dark mb-1">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Enter the announcement content..."
            />
            <div className="text-sm text-muted mt-1">
              You can use line breaks to format your announcement
            </div>
          </div>

          {/* Pin Option */}
          <div className="flex items-center">
            <input
              id="pinned"
              name="pinned"
              type="checkbox"
              checked={formData.pinned}
              onChange={handleChange}
              className="h-4 w-4 text-teal focus:ring-teal border-gray-300 rounded"
            />
            <label htmlFor="pinned" className="ml-2 flex items-center text-sm text-dark">
              <Pin className="h-4 w-4 mr-1" />
              Pin this announcement
            </label>
          </div>
          <div className="text-sm text-muted">
            Pinned announcements appear at the top and are highlighted in gold
          </div>

          {/* Preview */}
          {formData.title || formData.content ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="text-sm font-medium text-muted mb-2">Preview:</div>
              <div className={`p-4 rounded-lg border ${
                formData.pinned ? 'border-gold bg-gold/5' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center mb-2">
                  {formData.pinned && (
                    <Pin className="h-4 w-4 text-gold mr-2" />
                  )}
                  <h3 className="font-serif font-medium text-navy">
                    {formData.title || 'Announcement Title'}
                  </h3>
                </div>
                <p className="text-dark whitespace-pre-line">
                  {formData.content || 'Announcement content will appear here...'}
                </p>
                <div className="text-sm text-muted mt-2">
                  Just now • Your Name
                </div>
              </div>
            </div>
          ) : null}

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
              disabled={saving}
              className="px-4 py-2 text-sm text-muted hover:text-dark border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-navy text-white rounded-md hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : announcement ? 'Update Announcement' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}