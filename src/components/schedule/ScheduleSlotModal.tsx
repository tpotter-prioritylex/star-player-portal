import React, { useState, useEffect } from 'react'
import { X, Clock, User, MapPin, Video } from 'lucide-react'
import { formatTime, parseTimeToMinutes, minutesToTime, type ScheduleSlot } from '../../lib/schedule'
import type { TrainingDay } from '../../types'

interface ScheduleSlotModalProps {
  trainingDays: TrainingDay[]
  selectedDay?: TrainingDay | null
  editingSlot?: ScheduleSlot | null
  onSave: (slotData: Omit<ScheduleSlot, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onClose: () => void
}

export function ScheduleSlotModal({ trainingDays, selectedDay, editingSlot, onSave, onClose }: ScheduleSlotModalProps) {
  const [formData, setFormData] = useState({
    day_id: selectedDay?.id || editingSlot?.day_id || 0,
    start_time: editingSlot?.start_time || '09:00',
    end_time: editingSlot?.end_time || '10:00',
    title: editingSlot?.title || '',
    description: editingSlot?.description || '',
    instructor: editingSlot?.instructor || '',
    location: editingSlot?.location || '',
    meeting_url: editingSlot?.meeting_url || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-adjust end time when start time changes
  useEffect(() => {
    if (!editingSlot) { // Only auto-adjust for new slots
      const startMinutes = parseTimeToMinutes(formData.start_time)
      const endMinutes = parseTimeToMinutes(formData.end_time)

      // If end time is before or same as start time, add 1 hour
      if (endMinutes <= startMinutes) {
        setFormData(prev => ({
          ...prev,
          end_time: minutesToTime(startMinutes + 60)
        }))
      }
    }
  }, [formData.start_time, editingSlot])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.day_id) {
      setError('Please select a training day')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a title')
      return
    }

    const startMinutes = parseTimeToMinutes(formData.start_time)
    const endMinutes = parseTimeToMinutes(formData.end_time)

    if (endMinutes <= startMinutes) {
      setError('End time must be after start time')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        day_id: formData.day_id,
        start_time: formData.start_time,
        end_time: formData.end_time,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        instructor: formData.instructor.trim() || undefined,
        location: formData.location.trim() || undefined,
        meeting_url: formData.meeting_url.trim() || undefined,
      })
    } catch (err) {
      setError('Failed to save schedule item')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'day_id' ? parseInt(value) : value
    }))
  }

  // Generate time options (15-minute intervals)
  const timeOptions = []
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeOptions.push(timeString)
    }
  }

  const selectedTrainingDay = trainingDays.find(day => day.id === formData.day_id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-serif font-semibold text-navy">
            {editingSlot ? 'Edit Schedule Item' : 'Add Schedule Item'}
          </h2>
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
              <div className="text-sm text-muted mt-1">
                {selectedTrainingDay.description}
              </div>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-dark mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time *
              </label>
              <select
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-dark mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time *
              </label>
              <select
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
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
              placeholder="e.g., Introduction to Clio"
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
              placeholder="Optional description of the session"
            />
          </div>

          {/* Instructor */}
          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-dark mb-1">
              <User className="h-4 w-4 inline mr-1" />
              Instructor
            </label>
            <input
              id="instructor"
              name="instructor"
              type="text"
              value={formData.instructor}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="e.g., Sarah Wilson"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-dark mb-1">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="e.g., Training Room A or Remote"
            />
          </div>

          {/* Meeting URL */}
          <div>
            <label htmlFor="meeting_url" className="block text-sm font-medium text-dark mb-1">
              <Video className="h-4 w-4 inline mr-1" />
              Meeting URL
            </label>
            <input
              id="meeting_url"
              name="meeting_url"
              type="url"
              value={formData.meeting_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="https://zoom.us/j/..."
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
              {saving ? 'Saving...' : editingSlot ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}