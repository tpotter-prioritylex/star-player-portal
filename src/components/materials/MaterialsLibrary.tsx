import { useState, useEffect } from 'react'
import { Search, Upload } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canUploadCurriculum } from '../../lib/permissions'
import { getTrainingDays, getCurriculumMaterials } from '../../lib/materials'
import { MaterialCard } from './MaterialCard'
import { UploadMaterialModal } from './UploadMaterialModal'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { TrainingDay, CurriculumMaterial } from '../../types'

export function MaterialsLibrary() {
  const { user } = useAuth()
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([])
  const [materials, setMaterials] = useState<CurriculumMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<CurriculumMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeries, setSelectedSeries] = useState<string>('all')

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [daysResult, materialsResult] = await Promise.all([
        getTrainingDays(),
        getCurriculumMaterials()
      ])

      if (daysResult.error) {
        setError(daysResult.error.message)
      } else {
        setTrainingDays(daysResult.data || [])
      }

      if (materialsResult.error) {
        setError(materialsResult.error.message)
      } else {
        setMaterials(materialsResult.data || [])
        setFilteredMaterials(materialsResult.data || [])
      }
    } catch (err: any) {
      console.error('❌ MaterialsLibrary loadData error:', err)
      setError(err.message || 'Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter materials
  useEffect(() => {
    let filtered = materials

    if (selectedDay) {
      filtered = filtered.filter(material => material.day_id === selectedDay)
    }

    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.sop_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSeries !== 'all') {
      filtered = filtered.filter(material =>
        material.sop_reference?.startsWith(selectedSeries.toUpperCase())
      )
    }

    setFilteredMaterials(filtered)
  }, [materials, selectedDay, searchTerm, selectedSeries])

  const handleUploadSuccess = () => {
    loadData()
    setShowUploadModal(false)
  }

  const sopSeries = ['A', 'B', 'D', 'F']

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Materials Library</h1>
          <p className="text-muted">Access training materials and curriculum content</p>
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
          <h1 className="text-2xl font-serif font-semibold text-navy">Materials Library</h1>
          <p className="text-muted">Access training materials and curriculum content</p>
        </div>
        {user && canUploadCurriculum(user) && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-4 py-2 bg-navy text-white rounded-md hover:bg-navy/90 transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Material
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Training Day Filter */}
          <div>
            <select
              value={selectedDay || ''}
              onChange={(e) => setSelectedDay(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="">All Days</option>
              {trainingDays.map(day => (
                <option key={day.id} value={day.id}>
                  Day {day.day_number}: {day.title}
                </option>
              ))}
            </select>
          </div>

          {/* SOP Series Filter */}
          <div>
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="all">All Series</option>
              {sopSeries.map(series => (
                <option key={series} value={series}>
                  {series} Series
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-semibold text-navy">{materials.length}</div>
          <div className="text-sm text-muted">Total Materials</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-semibold text-navy">
            {new Set(materials.map(m => m.day_id)).size}
          </div>
          <div className="text-sm text-muted">Training Days Covered</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-semibold text-navy">
            {new Set(materials.map(m => m.sop_reference?.charAt(0)).filter(Boolean)).size}
          </div>
          <div className="text-sm text-muted">SOP Series Covered</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-semibold text-navy">
            {Math.round(materials.reduce((sum, m) => sum + (m.file_size || 0), 0) / 1024 / 1024)}MB
          </div>
          <div className="text-sm text-muted">Total File Size</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading materials</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Training Days and Materials */}
      <div className="space-y-6">
        {selectedDay ? (
          // Single day view
          <div>
            {(() => {
              const day = trainingDays.find(d => d.id === selectedDay)
              const dayMaterials = filteredMaterials.filter(m => m.day_id === selectedDay)

              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-serif font-medium text-navy">
                        Day {day?.day_number}: {day?.title}
                      </h2>
                      {day?.description && (
                        <p className="text-muted mt-1">{day.description}</p>
                      )}
                      {day?.sop_series && day.sop_series.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {day.sop_series.map(sop => (
                            <span key={sop} className="px-2 py-1 bg-teal text-white text-xs rounded-full">
                              {sop}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-muted hover:text-dark"
                    >
                      View All Days
                    </button>
                  </div>

                  {dayMaterials.length === 0 ? (
                    <div className="text-center py-8 text-muted">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div>No materials available for this day</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayMaterials.map(material => (
                        <MaterialCard
                          key={material.id}
                          material={material}
                          onUpdate={loadData}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        ) : (
          // All days overview
          trainingDays.map(day => {
            const dayMaterials = filteredMaterials.filter(m => m.day_id === day.id)

            return (
              <div key={day.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-serif font-medium text-navy">
                      Day {day.day_number}: {day.title}
                    </h2>
                    {day.description && (
                      <p className="text-muted mt-1">{day.description}</p>
                    )}
                    {day.sop_series && day.sop_series.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {day.sop_series.map(sop => (
                          <span key={sop} className="px-2 py-1 bg-teal text-white text-xs rounded-full">
                            {sop}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted">
                      {dayMaterials.length} {dayMaterials.length === 1 ? 'material' : 'materials'}
                    </span>
                    {dayMaterials.length > 0 && (
                      <button
                        onClick={() => setSelectedDay(day.id)}
                        className="text-teal hover:text-teal/80 text-sm"
                      >
                        View All
                      </button>
                    )}
                  </div>
                </div>

                {dayMaterials.length === 0 ? (
                  <div className="text-center py-6 text-muted">
                    <Upload className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No materials available</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dayMaterials.slice(0, 3).map(material => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onUpdate={loadData}
                      />
                    ))}
                    {dayMaterials.length > 3 && (
                      <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
                        <button
                          onClick={() => setSelectedDay(day.id)}
                          className="text-teal hover:text-teal/80 text-sm font-medium"
                        >
                          View {dayMaterials.length - 3} more materials
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}

        {filteredMaterials.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search className="h-8 w-8 mx-auto mb-2 text-muted opacity-50" />
            <div className="text-muted">No materials found matching your search</div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadMaterialModal
          trainingDays={trainingDays}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  )
}