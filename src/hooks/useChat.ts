import { useState, useEffect } from 'react'
import { getChatChannels, getChatMessages, sendMessage } from '../lib/chat'
import { useAuth } from './useAuth'
import type { ChatChannel, ChatMessage } from '../types'

export function useChat() {
  const { user } = useAuth()
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      if (!user) return

      try {
        const { data, error } = await getChatChannels()
        if (error) {
          setError(error.message)
        } else {
          const accessibleChannels = (data || []).filter(channel => {
            // NO announcement channels in chat - those are in separate Announcements page
            if (channel.type === 'announcement') {
              return false
            }
            // Everyone can access cohort channel
            if (channel.type === 'cohort') {
              return true
            }
            // Admin and instructor can access all group channels
            if (user.role === 'admin' || user.role === 'instructor') {
              return true
            }
            // Star players can only access their own group channel
            if (user.role === 'star_player' && channel.type === 'group') {
              return channel.group_id === user.group_id
            }
            return false
          })
          setChannels(accessibleChannels)

          // Set default channel (cohort chat or first accessible channel)
          const defaultChannel = accessibleChannels.find(c => c.type === 'cohort') || accessibleChannels[0]
          if (defaultChannel && !activeChannel) {
            setActiveChannel(defaultChannel)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load channels')
      }
    }

    loadChannels()
  }, [user])

  // Load messages for active channel
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChannel) return

      setLoading(true)
      try {
        const { data, error } = await getChatMessages(activeChannel.id)
        if (error) {
          setError(error.message)
        } else {
          setMessages(data || [])
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [activeChannel])

  // No real-time subscriptions - messages refresh when page loads

  const handleSendMessage = async (content: string) => {
    if (!activeChannel || !content.trim()) return

    setSending(true)
    try {
      const { error } = await sendMessage({
        channel_id: activeChannel.id,
        content: content.trim()
      })

      if (error) {
        setError(error.message)
      } else {
        // Refresh messages after sending to show the new message
        await refreshMessages()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleSelectChannel = (channel: ChatChannel) => {
    setActiveChannel(channel)
    setMessages([]) // Clear messages when switching channels
  }

  const refreshMessages = async () => {
    if (!activeChannel) return

    setLoading(true)
    try {
      const { data, error } = await getChatMessages(activeChannel.id)
      if (error) {
        setError(error.message)
      } else {
        setMessages(data || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  return {
    channels,
    activeChannel,
    messages,
    loading,
    sending,
    error,
    sendMessage: handleSendMessage,
    selectChannel: handleSelectChannel,
    refreshMessages,
    clearError: () => setError(null)
  }
}