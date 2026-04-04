import React, { useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import { useAuth } from '../../hooks/useAuth'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { LoadingSpinner } from '../common/LoadingSpinner'

export function ChatChannel() {
  const { user } = useAuth()
  const {
    channels,
    activeChannel,
    messages,
    loading,
    sending,
    error,
    sendMessage,
    selectChannel,
    refreshMessages,
    clearError
  } = useChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted">Please log in to access chat</div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <ChatSidebar
        channels={channels}
        activeChannel={activeChannel}
        onSelectChannel={selectChannel}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-r-lg">
        {/* Header */}
        {activeChannel && (
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-medium text-navy">
                {activeChannel.name}
              </h2>
              <p className="text-sm text-muted">
                {activeChannel.type === 'cohort' && 'All cohort members'}
                {activeChannel.type === 'group' && `Group ${activeChannel.group_id} members`}
              </p>
            </div>
            <button
              onClick={refreshMessages}
              disabled={loading}
              className="p-2 text-muted hover:text-dark rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner className="h-8 w-8" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <div className="text-lg font-medium">No messages yet</div>
              <div className="text-sm">Be the first to start the conversation!</div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwnMessage={message.user_id === user.id}
                  showAvatar={
                    index === 0 ||
                    messages[index - 1]?.user_id !== message.user_id ||
                    new Date(message.created_at).getTime() - new Date(messages[index - 1]?.created_at).getTime() > 300000 // 5 minutes
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {activeChannel && (
          <ChatInput
            onSendMessage={sendMessage}
            disabled={sending || (activeChannel.type === 'announcement' && user.role === 'star_player')}
            placeholder={
              activeChannel.type === 'announcement' && user.role === 'star_player'
                ? 'Only admins and instructors can post announcements'
                : `Message ${activeChannel.name}...`
            }
          />
        )}
      </div>
    </div>
  )
}