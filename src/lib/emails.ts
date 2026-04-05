import { supabase } from './supabase'

export interface WelcomeEmailData {
  email: string
  full_name: string
  temporary_password: string
}

export interface AnnouncementEmailData {
  title: string
  content: string
}

export interface EmailResult {
  success: boolean
  error?: string
  message?: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-welcome-email', {
      body: data
    })

    if (error) {
      console.error('Welcome email error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send welcome email'
      }
    }

    return {
      success: true,
      message: result?.message || `Welcome email sent to ${data.email}`
    }
  } catch (err: any) {
    console.error('Welcome email exception:', err)
    return {
      success: false,
      error: err.message || 'Failed to send welcome email'
    }
  }
}

export async function sendAnnouncementEmail(data: AnnouncementEmailData): Promise<EmailResult> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-announcement-email', {
      body: data
    })

    if (error) {
      console.error('Announcement email error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send announcement email'
      }
    }

    return {
      success: true,
      message: result?.message || `Announcement email sent to ${result?.sent_count || 0} users`
    }
  } catch (err: any) {
    console.error('Announcement email exception:', err)
    return {
      success: false,
      error: err.message || 'Failed to send announcement email'
    }
  }
}