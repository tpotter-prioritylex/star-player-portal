import { supabase } from './supabase'

export interface ScheduleSlot {
  id?: string
  day_id: number
  start_time: string
  end_time: string
  title: string
  description?: string
  instructor?: string
  location?: string
  meeting_url?: string
  created_at?: string
  updated_at?: string
}

export async function getScheduleSlots(): Promise<{ data: ScheduleSlot[] | null; error: any }> {
  try {
    console.log('🔍 Fetching schedule slots...')
    const { data, error } = await supabase
      .from('schedule_slots')
      .select('*')
      .order('start_time', { ascending: true })

    if (error) {
      console.error('❌ getScheduleSlots error:', error)
    } else {
      console.log('✅ Schedule slots fetched:', data?.length || 0)
    }

    return { data: data as ScheduleSlot[] | null, error }
  } catch (exception: any) {
    console.error('💥 getScheduleSlots exception:', exception)
    return { data: null, error: exception }
  }
}

export async function createScheduleSlot(slotData: Omit<ScheduleSlot, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ScheduleSlot | null; error: any }> {
  const { data, error } = await supabase
    .from('schedule_slots')
    .insert(slotData)
    .select()
    .single()

  return { data: data as ScheduleSlot | null, error }
}

export async function updateScheduleSlot(id: string, slotData: Partial<ScheduleSlot>): Promise<{ data: ScheduleSlot | null; error: any }> {
  const { data, error } = await supabase
    .from('schedule_slots')
    .update({
      ...slotData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  return { data: data as ScheduleSlot | null, error }
}

export async function deleteScheduleSlot(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('schedule_slots')
    .delete()
    .eq('id', id)

  return { error }
}

// Default schedule template for the 10-day program
export const DEFAULT_SCHEDULE_TEMPLATE = [
  // Day 1: Ethics, Compliance, and Governance Framework
  { start_time: '09:00', end_time: '09:30', title: 'Welcome & Introductions', description: 'Cohort introductions and program overview' },
  { start_time: '09:30', end_time: '11:00', title: 'Legal Ethics Foundation', description: 'Introduction to legal ethics and UPL boundaries' },
  { start_time: '11:15', end_time: '12:30', title: 'F-1: Confidentiality and Data Handling', description: 'Client confidentiality and data protection protocols' },
  { start_time: '13:30', end_time: '14:30', title: 'F-2: Ethical Boundaries and UPL Prevention', description: 'Understanding unauthorized practice of law boundaries' },
  { start_time: '14:45', end_time: '16:00', title: 'F-3: Attorney Review Submission Protocol', description: 'When and how to escalate work for attorney review' },
  { start_time: '16:00', end_time: '16:30', title: 'Day 1 Wrap-up', description: 'Q&A and assignment briefing' },

  // Day 2: Technology Stack I -- Clio, Document Management, and the Pipeline
  { start_time: '09:00', end_time: '09:15', title: 'Daily Standup', description: 'Quick check-in and day overview' },
  { start_time: '09:15', end_time: '10:30', title: 'Clio Platform Overview', description: 'Introduction to Clio practice management platform' },
  { start_time: '10:45', end_time: '12:00', title: 'B-1: Clio Manage Operations', description: 'Core Clio operations and navigation' },
  { start_time: '13:00', end_time: '14:30', title: 'A-2: Matter Creation in Clio', description: 'Creating and organizing legal matters' },
  { start_time: '14:45', end_time: '16:00', title: 'A-7: Document Management and Filing', description: 'Document organization and filing protocols' },
  { start_time: '16:00', end_time: '16:30', title: 'Day 2 Review', description: 'Review and assignment preparation' },
] as const

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${period}`
}

export function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}