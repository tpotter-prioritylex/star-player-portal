import { supabase } from './supabase'
import type { ChatChannel, ChatMessage, User } from '../types'

export interface SendMessageData {
  channel_id: number
  content: string
}

export async function getChatChannels(): Promise<{ data: ChatChannel[] | null; error: any }> {
  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .order('id', { ascending: true })

  return { data: data as ChatChannel[] | null, error }
}

export async function getChatMessages(channelId: number, limit = 50): Promise<{ data: ChatMessage[] | null; error: any }> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      user:users!user_id(id, email, full_name, role)
    `)
    .eq('channel_id', channelId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit)

  return { data: data as ChatMessage[] | null, error }
}

export async function sendMessage(messageData: SendMessageData): Promise<{ data: ChatMessage | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('User not authenticated') }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      channel_id: messageData.channel_id,
      user_id: user.id,
      content: messageData.content,
    })
    .select(`
      *,
      user:users!user_id(id, email, full_name, role)
    `)
    .single()

  return { data: data as ChatMessage | null, error }
}

export async function deleteMessage(messageId: string): Promise<{ error: any }> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: new Error('User not authenticated') }
  }

  const { error } = await supabase
    .from('chat_messages')
    .update({
      is_deleted: true,
      deleted_by: user.id
    })
    .eq('id', messageId)

  return { error }
}

// Real-time subscriptions removed for stability - chat refreshes on page load