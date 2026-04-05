import { useState, useEffect } from 'react'
import { BookOpen, MessageCircle, Upload, Calendar, TrendingUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { TrainingDay, Group } from '../../types'

interface SOPProgress {
  demonstrated: number
  in_progress: number
  not_started: number
}

interface PipelineCertification {
  id: number
  certification: string
  status: string
}

interface DashboardData {
  trainingDays: TrainingDay[]
  sopProgress: SOPProgress
  pipelineCertifications: PipelineCertification[]
  group: Group | null
}

export function StarPlayerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load training days
        const { data: trainingDays, error: trainingError } = await supabase
          .from('training_days')
          .select('*')
          .order('date', { ascending: true })

        if (trainingError) throw trainingError

        // Load SOP competencies for current user
        const { data: sopCompetencies, error: sopError } = await supabase
          .from('sop_competencies')
          .select('status')
          .eq('user_id', user.id)

        if (sopError) throw sopError

        // Load pipeline certifications for current user
        const { data: pipelineCerts, error: pipelineError } = await supabase
          .from('pipeline_certifications')
          .select('*')
          .eq('user_id', user.id)

        if (pipelineError) throw pipelineError

        // Load user's group
        let group = null
        if (user.group_id) {
          const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', user.group_id)
            .single()

          if (groupError) {
            console.error('Error loading group:', groupError)
          } else {
            group = groupData
          }
        }

        // Calculate SOP progress
        const sopProgress: SOPProgress = {
          demonstrated: sopCompetencies?.filter(s => s.status === 'demonstrated').length || 0,
          in_progress: sopCompetencies?.filter(s => s.status === 'in_progress').length || 0,
          not_started: sopCompetencies?.filter(s => s.status === 'not_started').length || 0
        }

        setData({
          trainingDays: trainingDays || [],
          sopProgress,
          pipelineCertifications: pipelineCerts || [],
          group
        })

      } catch (err: any) {
        console.error('Dashboard data loading error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Determine program status based on training days using string comparison to avoid timezone issues
  const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format

  const firstTrainingDay = data.trainingDays.find(day => day.date !== null)
  const lastTrainingDay = data.trainingDays.slice().reverse().find(day => day.date !== null)

  let programStatus: 'before' | 'active' | 'after' = 'before'
  let currentDay: TrainingDay | null = null
  let nextDay: TrainingDay | null = null

  if (firstTrainingDay?.date && lastTrainingDay?.date) {
    if (todayStr < firstTrainingDay.date) {
      programStatus = 'before'
    } else if (todayStr > lastTrainingDay.date) {
      programStatus = 'after'
    } else {
      programStatus = 'active'

      // Find current day by string comparison
      currentDay = data.trainingDays.find(day => day.date === todayStr) || null

      if (!currentDay) {
        // Find next training day by string comparison
        nextDay = data.trainingDays.find(day => {
          if (!day.date) return false
          return day.date > todayStr
        }) || null
      }
    }
  }

  const formatDate = (dateString: string) => {
    // Parse date string to avoid UTC offset issues
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-serif font-semibold text-navy mb-2">
          Welcome back, {user.full_name.split(' ')[0]}
        </h1>
        <p className="text-muted mb-4">
          You're assigned to <span className="font-medium text-navy">
            {data.group ? data.group.name : 'Unassigned'}
          </span> in Cohort 2
        </p>

        {/* Training Status */}
        {programStatus === 'before' && firstTrainingDay?.date && (
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-gold mr-2" />
              <h3 className="font-medium text-navy">Training begins {formatDate(firstTrainingDay.date)}</h3>
            </div>
            <p className="text-sm text-muted">
              Your training program will start soon. Get ready for an intensive learning experience!
            </p>
          </div>
        )}

        {programStatus === 'active' && currentDay && (
          <div className="bg-teal/10 border border-teal/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-teal mr-2" />
              <h3 className="font-medium text-navy">
                Today - Day {currentDay.day_number}: {currentDay.title}
              </h3>
            </div>
            <p className="text-sm text-muted mb-3">
              {currentDay.description}
            </p>
            {currentDay.sop_series && currentDay.sop_series.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentDay.sop_series.map((topic: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-teal text-white text-xs rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {programStatus === 'active' && !currentDay && nextDay && nextDay.date && (
          <div className="bg-teal/10 border border-teal/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-teal mr-2" />
              <h3 className="font-medium text-navy">
                Next Session - Day {nextDay.day_number}: {nextDay.title}
              </h3>
            </div>
            <p className="text-sm text-muted mb-3">
              {formatDate(nextDay.date)} - {nextDay.description}
            </p>
            {nextDay.sop_series && nextDay.sop_series.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextDay.sop_series.map((topic: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-teal text-white text-xs rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {programStatus === 'after' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-navy">Training program complete</h3>
            </div>
            <p className="text-sm text-muted">
              Congratulations! You've completed the Star Player training program.
            </p>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Certifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-teal mr-2" />
            <h2 className="text-lg font-serif font-medium text-navy">Pipeline Certifications</h2>
          </div>
          {data.pipelineCertifications.length > 0 ? (
            <div className="space-y-3">
              {data.pipelineCertifications.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between">
                  <span className="text-sm text-dark">{cert.certification}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    cert.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : cert.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cert.status === 'completed' ? 'Completed' :
                     cert.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No pipeline certifications assigned yet.</p>
          )}
        </div>

        {/* SOP Progress Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="h-5 w-5 text-teal mr-2" />
            <h2 className="text-lg font-serif font-medium text-navy">SOP Progress</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-gold">{data.sopProgress.demonstrated}</div>
              <div className="text-xs text-muted">Demonstrated</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-teal">{data.sopProgress.in_progress}</div>
              <div className="text-xs text-muted">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-muted">{data.sopProgress.not_started}</div>
              <div className="text-xs text-muted">Not Started</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-serif font-medium text-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <MessageCircle className="h-6 w-6 text-teal mb-2" />
            <p className="font-medium text-navy">Group Chat</p>
            <p className="text-sm text-muted">Connect with your group</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Upload className="h-6 w-6 text-teal mb-2" />
            <p className="font-medium text-navy">Upload Assignment</p>
            <p className="text-sm text-muted">Submit your work</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <BookOpen className="h-6 w-6 text-teal mb-2" />
            <p className="font-medium text-navy">Materials Library</p>
            <p className="text-sm text-muted">Access training materials</p>
          </button>
        </div>
      </div>
    </div>
  )
}