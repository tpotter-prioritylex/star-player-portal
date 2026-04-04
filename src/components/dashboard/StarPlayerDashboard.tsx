import React from 'react'
import { BookOpen, MessageCircle, Upload, Calendar, TrendingUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { PIPELINE_CERTIFICATIONS } from '../../types'

export function StarPlayerDashboard() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-serif font-semibold text-navy mb-2">
          Welcome back, {user.full_name.split(' ')[0]}
        </h1>
        <p className="text-muted mb-4">
          You're assigned to <span className="font-medium text-navy">Group {user.group_id || 'Unassigned'}</span> in Cohort 2
        </p>

        {/* Today's Training */}
        <div className="bg-teal/10 border border-teal/20 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Calendar className="h-5 w-5 text-teal mr-2" />
            <h3 className="font-medium text-navy">Today - Day 4: Technology Stack III -- Quo Platform Administration and Operations</h3>
          </div>
          <p className="text-sm text-muted mb-3">
            Quo operations, voice intake processing, and dashboard management
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-teal text-white text-xs rounded-full">B-4: Quo Operations</span>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Certifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-teal mr-2" />
            <h2 className="text-lg font-serif font-medium text-navy">Pipeline Certifications</h2>
          </div>
          <div className="space-y-3">
            {PIPELINE_CERTIFICATIONS.map((cert) => (
              <div key={cert} className="flex items-center justify-between">
                <span className="text-sm text-dark">{cert}</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  In Progress
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SOP Progress Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="h-5 w-5 text-teal mr-2" />
            <h2 className="text-lg font-serif font-medium text-navy">SOP Progress</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-gold">8</div>
              <div className="text-xs text-muted">Demonstrated</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-teal">6</div>
              <div className="text-xs text-muted">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-muted">6</div>
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