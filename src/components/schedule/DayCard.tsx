import { Calendar, Clock } from 'lucide-react'
import type { TrainingDay } from '../../types'

interface DayCardProps {
  day: TrainingDay
  isSelected: boolean
  onClick: () => void
  slotsCount: number
}

export function DayCard({ day, isSelected, onClick, slotsCount }: DayCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? 'border-teal bg-teal/5 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`text-lg font-semibold ${isSelected ? 'text-teal' : 'text-navy'}`}>
          Day {day.day_number}
        </div>
        {day.date && (
          <div className="flex items-center text-sm text-muted">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(day.date)}
          </div>
        )}
      </div>

      <h3 className="font-medium text-dark mb-2 line-clamp-2">
        {day.title}
      </h3>

      {day.description && (
        <p className="text-sm text-muted mb-3 line-clamp-2">
          {day.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        {/* SOP Series */}
        <div>
          {day.sop_series && day.sop_series.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {day.sop_series.slice(0, 2).map(sop => (
                <span key={sop} className="px-1.5 py-0.5 bg-teal text-white text-xs rounded">
                  {sop}
                </span>
              ))}
              {day.sop_series.length > 2 && (
                <span className="px-1.5 py-0.5 bg-gray-300 text-gray-600 text-xs rounded">
                  +{day.sop_series.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Schedule Slots Count */}
        <div className="flex items-center text-xs text-muted">
          <Clock className="h-3 w-3 mr-1" />
          <span>{slotsCount} {slotsCount === 1 ? 'item' : 'items'}</span>
        </div>
      </div>
    </button>
  )
}