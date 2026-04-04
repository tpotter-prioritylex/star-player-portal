import React from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getRoleDisplayName, getRoleColor, canDeleteMessages } from '../../lib/permissions'
import { deleteMessage } from '../../lib/chat'
import type { ChatMessage as ChatMessageType } from '../../types'

interface ChatMessageProps {
  message: ChatMessageType
  isOwnMessage: boolean
  showAvatar: boolean
}

export function ChatMessage({ message, isOwnMessage, showAvatar }: ChatMessageProps) {
  const { user } = useAuth()

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins <= 0 ? 'just now' : `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const handleDeleteMessage = async () => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      await deleteMessage(message.id)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const userInitials = message.user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2) || '??'

  const userRole = message.user?.role

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && (
          <div className={`flex-shrink-0 ${isOwnMessage ? 'ml-3' : 'mr-3'}`}>
            <div className="h-8 w-8 bg-teal rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">
                {userInitials}
              </span>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`${showAvatar ? '' : isOwnMessage ? 'mr-11' : 'ml-11'}`}>
          {/* Header */}
          {showAvatar && (
            <div className={`flex items-center mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <span className="text-sm font-medium text-dark mr-2">
                {message.user?.full_name || 'Unknown User'}
              </span>
              {userRole && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(userRole)} mr-2`}>
                  {getRoleDisplayName(userRole)}
                </span>
              )}
              <span className="text-xs text-muted">
                {formatTime(message.created_at)}
              </span>
            </div>
          )}

          {/* Message Bubble */}
          <div className="group relative">
            <div className={`px-4 py-2 rounded-lg ${
              isOwnMessage
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-dark'
            }`}>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>

            {/* Delete Button */}
            {user && canDeleteMessages(user) && (
              <button
                onClick={handleDeleteMessage}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                title="Delete message"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </button>
            )}
          </div>

          {/* Timestamp for non-avatar messages */}
          {!showAvatar && (
            <div className={`text-xs text-muted mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
              {formatTime(message.created_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}