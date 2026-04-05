import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Clock, MapPin, Video, User, Calendar } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canCreateUsers } from '../../lib/permissions' // Using this as admin check
import { getTrainingDays } from '../../lib/materials'
import { getScheduleSlots, createScheduleSlot, updateScheduleSlot, deleteScheduleSlot, formatTime, type ScheduleSlot } from '../../lib/schedule'
import { ScheduleSlotModal } from './ScheduleSlotModal'
import { DayCard } from './DayCard'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { TrainingDay } from '../../types'

export function DailySchedule() {
  const { user } = useAuth()
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([])
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [selectedDay, setSelectedDay] = useState<TrainingDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)

  const isAdmin = user && canCreateUsers(user) // Using admin permission check

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [daysResult, slotsResult] = await Promise.all([
        getTrainingDays(),
        getScheduleSlots()
      ])

      if (daysResult.error) {
        setError(daysResult.error.message)
      } else {
        const days = daysResult.data || []
        setTrainingDays(days)
        // Set first day as default selected
        if (!selectedDay && days.length > 0) {
          setSelectedDay(days[0])
        }
      }

      if (slotsResult.error) {
        setError(slotsResult.error.message)
      } else {
        setScheduleSlots(slotsResult.data || [])
      }
    } catch (err) {
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateSlot = () => {
    setEditingSlot(null)
    setShowModal(true)
  }

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot)
    setShowModal(true)
  }

  const handleDeleteSlot = async (slot: ScheduleSlot) => {
    if (!slot.id || !confirm(`Are you sure you want to delete "${slot.title}"?`)) {
      return
    }

    try {
      const { error } = await deleteScheduleSlot(slot.id)
      if (error) {
        alert(`Failed to delete slot: ${error.message}`)
      } else {
        await loadData()
      }
    } catch (err) {
      alert('Failed to delete schedule slot')
    }
  }

  const handleModalSave = async (slotData: Omit<ScheduleSlot, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      let error

      if (editingSlot?.id) {
        const result = await updateScheduleSlot(editingSlot.id, slotData)
        error = result.error
      } else {
        const result = await createScheduleSlot(slotData)
        error = result.error
      }

      if (error) {
        alert(`Failed to save schedule slot: ${error.message}`)
      } else {
        await loadData()
        setShowModal(false)
        setEditingSlot(null)
      }
    } catch (err) {
      alert('Failed to save schedule slot')
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingSlot(null)
  }

  // Get slots for selected day
  const daySlots = scheduleSlots
    .filter(slot => slot.day_id === selectedDay?.id)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const formatDate = (day: TrainingDay) => {
    if (day.date) {
      return new Date(day.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    }
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Training Schedule</h1>
          <p className="text-muted">View training schedule and daily agenda</p>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-12 w-12" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Training Schedule</h1>
          <p className="text-muted">
            {isAdmin ? 'Manage training schedule and daily agenda' : 'View training schedule and daily agenda'}
          </p>
        </div>

        {isAdmin && selectedDay && (
          <button
            onClick={handleCreateSlot}
            className="flex items-center px-4 py-2 bg-navy text-white rounded-md hover:bg-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule Item
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading schedule</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Training Days Sidebar */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-serif font-medium text-navy mb-4">Training Days</h2>
          <div className="space-y-2">
            {trainingDays.map(day => (
              <DayCard
                key={day.id}
                day={day}
                isSelected={selectedDay?.id === day.id}
                onClick={() => setSelectedDay(day)}
                slotsCount={scheduleSlots.filter(s => s.day_id === day.id).length}
              />
            ))}
          </div>
        </div>

        {/* Schedule Details */}
        <div className="lg:col-span-3">
          {selectedDay ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Day Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-serif font-semibold text-navy">
                    Day {selectedDay.day_number}: {selectedDay.title}
                  </h2>
                  <div className="flex items-center text-muted">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {formatDate(selectedDay) || 'Date TBD'}
                    </span>
                  </div>
                </div>

                {selectedDay.description && (
                  <p className="text-muted mb-3">{selectedDay.description}</p>
                )}

                {selectedDay.sop_series && selectedDay.sop_series.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm font-medium text-muted mr-2">SOPs:</span>
                    {selectedDay.sop_series.map(sop => (
                      <span key={sop} className="px-2 py-1 bg-teal text-white text-xs rounded-full">
                        {sop}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule Slots */}
              <div className="p-6">
                {daySlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-muted opacity-50" />
                    <div className="text-muted">No schedule items for this day</div>
                    {isAdmin && (
                      <button
                        onClick={handleCreateSlot}
                        className="mt-2 text-teal hover:text-teal/80 font-medium"
                      >
                        Add the first schedule item
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Clock className="h-4 w-4 text-teal mr-2" />
                              <span className="font-medium text-dark">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                              <span className="ml-2 text-lg font-medium text-navy">
                                {slot.title}
                              </span>
                            </div>

                            {slot.description && (
                              <p className="text-muted mb-2">{slot.description}</p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm">
                              {slot.instructor && (
                                <div className="flex items-center text-muted">
                                  <User className="h-3 w-3 mr-1" />
                                  <span>{slot.instructor}</span>
                                </div>
                              )}

                              {slot.location && (
                                <div className="flex items-center text-muted">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{slot.location}</span>
                                </div>
                              )}

                              {slot.meeting_url && (
                                <div className="flex items-center">
                                  <Video className="h-3 w-3 mr-1 text-blue-600" />
                                  <a
                                    href={slot.meeting_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    Join Meeting
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => handleEditSlot(slot)}
                                className="text-teal hover:text-teal/80 transition-colors"
                                title="Edit schedule item"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete schedule item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted opacity-50" />
              <div className="text-muted">Select a training day to view its schedule</div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Slot Modal */}
      {showModal && (
        <ScheduleSlotModal
          trainingDays={trainingDays}
          selectedDay={selectedDay}
          editingSlot={editingSlot}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}