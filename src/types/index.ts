export type UserRole = 'admin' | 'instructor' | 'star_player'

export type User = {
  id: string
  email: string
  full_name: string
  role: UserRole
  group_id: number | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Group = {
  id: number
  name: string
  cohort: string
  created_at: string
}

export type TrainingDay = {
  id: number
  day_number: number
  title: string
  description: string | null
  date: string | null
  sop_series: string[]
  created_at: string
}

export type CurriculumMaterial = {
  id: string
  day_id: number | null
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_size: number | null
  sop_reference: string | null
  practice_area: string | null
  uploaded_by: string | null
  created_at: string
}

export type StudentUploadStatus = 'submitted' | 'reviewed' | 'revision_needed' | 'approved'

export type StudentUpload = {
  id: string
  user_id: string
  group_id: number
  day_id: number
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_size: number | null
  status: StudentUploadStatus
  reviewer_id: string | null
  reviewer_notes: string | null
  reviewed_at: string | null
  created_at: string
  user?: User // Joined user data
  training_day?: TrainingDay // Joined training day data
  reviewer?: User // Joined reviewer data
}

export type ChatChannelType = 'cohort' | 'group' | 'announcement'

export type ChatChannel = {
  id: number
  name: string
  type: ChatChannelType
  group_id: number | null
  created_at: string
}

export type ChatMessage = {
  id: string
  channel_id: number
  user_id: string
  content: string
  is_deleted: boolean
  deleted_by: string | null
  created_at: string
  user?: User // Joined user data
}

export type SOPCompetencyStatus = 'not_started' | 'in_progress' | 'demonstrated' | 'verified'

export type SOPCompetency = {
  id: number
  user_id: string
  sop_code: string
  sop_title: string
  status: SOPCompetencyStatus
  updated_by: string | null
  notes: string | null
  updated_at: string
}

export type PipelineCertificationStatus = 'not_started' | 'in_progress' | 'completed'

export type PipelineCertification = {
  id: number
  user_id: string
  certification: string
  status: PipelineCertificationStatus
  completed_at: string | null
  verified_by: string | null
  updated_at: string
}

export type Announcement = {
  id: string
  title: string
  content: string
  author_id: string
  pinned: boolean
  created_at: string
  author?: User // Joined user data
}

// SOP Reference Data
export const SOP_SERIES = {
  'A': 'Core Operations',
  'B': 'Technology Operations',
  'D': 'Estate and Probate',
  'F': 'Governance and Compliance'
} as const

export const SOPS = [
  { code: 'A-1', title: 'Voice Intake Processing', series: 'A' },
  { code: 'A-2', title: 'Matter Creation in Clio', series: 'A' },
  { code: 'A-3', title: 'AI-Powered Legal Research', series: 'A' },
  { code: 'A-4', title: 'Work Execution and Task Management', series: 'A' },
  { code: 'A-5', title: 'Daily Operations Dashboard', series: 'A' },
  { code: 'A-6', title: 'Client Communication Protocols', series: 'A' },
  { code: 'A-7', title: 'Document Management and Filing', series: 'A' },
  { code: 'A-8', title: 'Quality Control and Self-Review', series: 'A' },
  { code: 'B-1', title: 'Clio Manage Operations', series: 'B' },
  { code: 'B-2', title: 'Claude AI Usage and Prompt Engineering', series: 'B' },
  { code: 'B-4', title: 'Quo Operations', series: 'B' },
  { code: 'B-5', title: 'Legal Research with Midpage MCP', series: 'B' },
  { code: 'D-1', title: 'Asset Inventory Compilation', series: 'D' },
  { code: 'D-2', title: 'Creditor Notification and Tracking', series: 'D' },
  { code: 'D-3', title: 'Estate Accounting Production', series: 'D' },
  { code: 'D-4', title: 'Estate Case Intake and Lifecycle Management', series: 'D' },
  { code: 'F-1', title: 'Confidentiality and Data Handling', series: 'F' },
  { code: 'F-2', title: 'Ethical Boundaries and UPL Prevention', series: 'F' },
  { code: 'F-3', title: 'Attorney Review Submission Protocol', series: 'F' },
  { code: 'F-4', title: 'Incident Reporting and Escalation', series: 'F' }
] as const

export const PIPELINE_CERTIFICATIONS = [
  'Quo',
  'Clio',
  'Claude (with Legal Quality Standards)',
  'Midpage'
] as const

export const CLIO_CREDENTIALS = [
  'Clio Manage Product Essentials',
  'Clio Certified Administrator',
  'Clio Legal AI Fundamentals'
] as const

// Research platforms removed - only Midpage is used in our pipeline