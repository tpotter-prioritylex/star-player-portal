import { supabase } from './supabase'
import type { Announcement } from '../types'

export interface CreateAnnouncementData {
  title: string
  content: string
  pinned?: boolean
}

export async function getAnnouncements(): Promise<{ data: Announcement[] | null; error: any }> {
  try {
    console.log('🔍 Fetching announcements...')
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        author:users!author_id(id, email, full_name)
      `)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ getAnnouncements error:', error)
    } else {
      console.log('✅ Announcements fetched:', data?.length || 0)
    }

    return { data: data as Announcement[] | null, error }
  } catch (exception: any) {
    console.error('💥 getAnnouncements exception:', exception)
    return { data: null, error: exception }
  }
}

export async function createAnnouncement(announcementData: CreateAnnouncementData): Promise<{ data: Announcement | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: announcementData.title,
        content: announcementData.content,
        author_id: user.id,
        pinned: announcementData.pinned || false,
      })
      .select(`
        *,
        author:users!author_id(id, email, full_name)
      `)
      .single()

    return { data: data as Announcement | null, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<CreateAnnouncementData>
): Promise<{ data: Announcement | null; error: any }> {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      author:author_id(id, email, full_name)
    `)
    .single()

  return { data: data as Announcement | null, error }
}

export async function deleteAnnouncement(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  return { error }
}

export async function toggleAnnouncementPin(id: string, pinned: boolean): Promise<{ data: Announcement | null; error: any }> {
  const { data, error } = await supabase
    .from('announcements')
    .update({ pinned })
    .eq('id', id)
    .select(`
      *,
      author:author_id(id, email, full_name)
    `)
    .single()

  return { data: data as Announcement | null, error }
}

export function formatAnnouncementDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return diffMins <= 0 ? 'just now' : `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)}d ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}