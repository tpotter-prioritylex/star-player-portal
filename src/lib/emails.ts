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

// Supabase Edge Functions URL and anon key
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  try {
    console.log('Sending welcome email to:', data.email)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Welcome email API error:', response.status, errorData)
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: Failed to send welcome email`
      }
    }

    const result = await response.json()
    console.log('Welcome email sent successfully:', result)

    return {
      success: true,
      message: result.message || `Welcome email sent to ${data.email}`
    }
  } catch (err: any) {
    console.error('Welcome email exception:', err)
    return {
      success: false,
      error: err.message || 'Network error sending welcome email'
    }
  }
}

export async function sendAnnouncementEmail(data: AnnouncementEmailData): Promise<EmailResult> {
  try {
    console.log('Sending announcement email:', data.title)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-announcement-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Announcement email API error:', response.status, errorData)
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: Failed to send announcement email`
      }
    }

    const result = await response.json()
    console.log('Announcement email sent successfully:', result)

    return {
      success: true,
      message: result.message || `Announcement email sent to ${result.sent_count || 0} users`
    }
  } catch (err: any) {
    console.error('Announcement email exception:', err)
    return {
      success: false,
      error: err.message || 'Network error sending announcement email'
    }
  }
}