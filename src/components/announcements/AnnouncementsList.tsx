import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Pin, PinOff, Megaphone, User, Calendar } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canManageAnnouncements } from '../../lib/permissions'
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncementPin, formatAnnouncementDate } from '../../lib/announcements'
import { sendAnnouncementEmail } from '../../lib/emails'
import { CreateAnnouncementModal } from './CreateAnnouncementModal'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { Announcement } from '../../types'

export function AnnouncementsList() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const canManage = user && canManageAnnouncements(user)
  const canEdit = user && user.role === 'admin'

  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: loadError } = await getAnnouncements()

      if (loadError) {
        setError(loadError.message)
      } else {
        setAnnouncements(data || [])
      }
    } catch (err: any) {
      console.error('❌ AnnouncementsList loadAnnouncements error:', err)
      setError(err.message || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setShowCreateModal(true)
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setShowCreateModal(true)
  }

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`)) {
      return
    }

    setActionLoading(announcement.id)
    try {
      const { error } = await deleteAnnouncement(announcement.id)
      if (error) {
        alert(`Failed to delete announcement: ${error.message}`)
      } else {
        await loadAnnouncements()
      }
    } catch (err) {
      alert('Failed to delete announcement')
    } finally {
      setActionLoading(null)
    }
  }

  const handleTogglePin = async (announcement: Announcement) => {
    setActionLoading(announcement.id)
    try {
      const { error } = await toggleAnnouncementPin(announcement.id, !announcement.pinned)
      if (error) {
        alert(`Failed to ${announcement.pinned ? 'unpin' : 'pin'} announcement: ${error.message}`)
      } else {
        await loadAnnouncements()
      }
    } catch (err) {
      alert(`Failed to ${announcement.pinned ? 'unpin' : 'pin'} announcement`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleModalSave = async (announcementData: { title: string; content: string; pinned: boolean }) => {
    try {
      let error
      const isCreating = !editingAnnouncement

      if (editingAnnouncement) {
        const result = await updateAnnouncement(editingAnnouncement.id, announcementData)
        error = result.error
      } else {
        const result = await createAnnouncement(announcementData)
        error = result.error
      }

      if (error) {
        alert(`Failed to save announcement: ${error.message}`)
      } else {
        await loadAnnouncements()
        setShowCreateModal(false)
        setEditingAnnouncement(null)

        // Send announcement email for new announcements only (not updates)
        if (isCreating) {
          sendAnnouncementEmail({
            title: announcementData.title,
            content: announcementData.content
          }).then((emailResult) => {
            if (emailResult.success) {
              console.log('Announcement email sent successfully:', emailResult.message)
              // Optionally show a success message to the user
            } else {
              console.error('Failed to send announcement email:', emailResult.error)
              // Optionally show an error message to the user
            }
          }).catch((err) => {
            console.error('Unexpected error sending announcement email:', err)
          })
        }
      }
    } catch (err) {
      alert('Failed to save announcement')
    }
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setEditingAnnouncement(null)
  }

  // Separate pinned and unpinned announcements
  const pinnedAnnouncements = announcements.filter(a => a.pinned)
  const regularAnnouncements = announcements.filter(a => !a.pinned)

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-navy">Announcements</h1>
          <p className="text-muted">Important updates and news</p>
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
          <h1 className="text-2xl font-serif font-semibold text-navy">Announcements</h1>
          <p className="text-muted">
            {canManage
              ? 'Create and manage important announcements'
              : 'Important updates and news'
            }
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-navy text-white rounded-md hover:bg-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading announcements</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Announcements */}
      <div className="space-y-6">
        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <Pin className="h-5 w-5 text-gold mr-2" />
              <h2 className="text-lg font-serif font-medium text-navy">Pinned Announcements</h2>
            </div>
            <div className="space-y-4">
              {pinnedAnnouncements.map(announcement => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  canEdit={!!canEdit}
                  actionLoading={actionLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Announcements */}
        {regularAnnouncements.length > 0 && (
          <div>
            {pinnedAnnouncements.length > 0 && (
              <div className="flex items-center mb-4">
                <Megaphone className="h-5 w-5 text-teal mr-2" />
                <h2 className="text-lg font-serif font-medium text-navy">Recent Announcements</h2>
              </div>
            )}
            <div className="space-y-4">
              {regularAnnouncements.map(announcement => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  canEdit={!!canEdit}
                  actionLoading={actionLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {announcements.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted opacity-50" />
            <div className="text-lg font-medium text-dark mb-2">No announcements yet</div>
            <div className="text-muted">
              {canManage
                ? 'Create your first announcement to keep everyone informed'
                : 'Check back later for important updates'
              }
            </div>
            {canManage && (
              <button
                onClick={handleCreate}
                className="mt-4 text-teal hover:text-teal/80 font-medium"
              >
                Create First Announcement
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          announcement={editingAnnouncement}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

interface AnnouncementCardProps {
  announcement: Announcement
  canEdit: boolean
  actionLoading: string | null
  onEdit: (announcement: Announcement) => void
  onDelete: (announcement: Announcement) => void
  onTogglePin: (announcement: Announcement) => void
}

function AnnouncementCard({ announcement, canEdit, actionLoading, onEdit, onDelete, onTogglePin }: AnnouncementCardProps) {
  const isActionLoading = actionLoading === announcement.id

  return (
    <div className={`bg-white border rounded-lg p-6 ${
      announcement.pinned ? 'border-gold shadow-md bg-gold/5' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {announcement.pinned && (
              <Pin className="h-4 w-4 text-gold mr-2" />
            )}
            <h3 className="text-lg font-serif font-medium text-navy">
              {announcement.title}
            </h3>
          </div>

          <div className="prose prose-sm max-w-none mb-4">
            <p className="text-dark whitespace-pre-line">
              {announcement.content}
            </p>
          </div>

          <div className="flex items-center text-sm text-muted">
            <User className="h-4 w-4 mr-1" />
            <span className="mr-4">
              {announcement.author?.full_name || 'Unknown Author'}
            </span>
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {formatAnnouncementDate(announcement.created_at)}
            </span>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onTogglePin(announcement)}
              disabled={isActionLoading}
              className={`p-2 rounded-md transition-colors ${
                announcement.pinned
                  ? 'text-gold hover:bg-gold/10'
                  : 'text-muted hover:bg-gray-100'
              } disabled:opacity-50`}
              title={announcement.pinned ? 'Unpin announcement' : 'Pin announcement'}
            >
              {isActionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : announcement.pinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => onEdit(announcement)}
              disabled={isActionLoading}
              className="p-2 text-teal hover:bg-teal/10 rounded-md transition-colors disabled:opacity-50"
              title="Edit announcement"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(announcement)}
              disabled={isActionLoading}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete announcement"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}