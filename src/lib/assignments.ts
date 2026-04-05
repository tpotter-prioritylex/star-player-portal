import { supabase } from './supabase'
import { STORAGE_BUCKETS } from './supabase'
import type { StudentUpload } from '../types'

export interface UploadAssignmentData {
  day_id: number
  title: string
  description?: string
  file: File
}

export interface UpdateAssignmentData {
  status: 'submitted' | 'reviewed' | 'revision_needed' | 'approved'
  reviewer_notes?: string
}

export async function getStudentUploads(userId?: string): Promise<{ data: StudentUpload[] | null; error: any }> {
  try {
    let query = supabase
      .from('student_uploads')
      .select(`
        *,
        user:users!user_id(id, email, full_name, role),
        training_day:training_days!day_id(id, day_number, title),
        reviewer:users!reviewer_id(id, email, full_name)
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ getStudentUploads error:', error)
    } else {
      console.log('✅ Student uploads fetched:', data?.length || 0)
    }

    return { data: data as StudentUpload[] | null, error }
  } catch (exception: any) {
    console.error('💥 getStudentUploads exception:', exception)
    return { data: null, error: exception }
  }
}

export async function uploadAssignment(assignmentData: UploadAssignmentData): Promise<{ data: StudentUpload | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    // Get user's group
    const { data: userData } = await supabase
      .from('users')
      .select('group_id')
      .eq('id', user.id)
      .single()

    if (!userData?.group_id) {
      return { data: null, error: new Error('User not assigned to a group') }
    }

    // Generate file path
    const fileName = `${Date.now()}-${assignmentData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `group-${userData.group_id}/day-${assignmentData.day_id}/${user.id}/${fileName}`

    // Upload file to storage
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.STUDENT_UPLOADS)
      .upload(filePath, assignmentData.file)

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    // Get file URL (private, will be accessed through RLS)
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.STUDENT_UPLOADS)
      .getPublicUrl(filePath)

    // Create assignment record
    const { data: assignmentRecord, error: dbError } = await supabase
      .from('student_uploads')
      .insert({
        user_id: user.id,
        group_id: userData.group_id,
        day_id: assignmentData.day_id,
        title: assignmentData.title,
        description: assignmentData.description,
        file_url: publicUrl,
        file_name: assignmentData.file.name,
        file_size: assignmentData.file.size,
      })
      .select(`
        *,
        user:users!user_id(id, email, full_name, role),
        training_day:training_days!day_id(id, day_number, title)
      `)
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from(STORAGE_BUCKETS.STUDENT_UPLOADS)
        .remove([filePath])
      return { data: null, error: dbError }
    }

    return { data: assignmentRecord as StudentUpload, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateAssignmentStatus(
  assignmentId: string,
  updateData: UpdateAssignmentData
): Promise<{ data: StudentUpload | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('student_uploads')
      .update({
        ...updateData,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select(`
        *,
        user:users!user_id(id, email, full_name, role),
        training_day:training_days!day_id(id, day_number, title),
        reviewer:users!reviewer_id(id, email, full_name)
      `)
      .single()

    return { data: data as StudentUpload | null, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteAssignment(assignmentId: string): Promise<{ error: any }> {
  try {
    // Get assignment info first to delete file from storage
    const { data: assignment, error: fetchError } = await supabase
      .from('student_uploads')
      .select('file_url, group_id, day_id, user_id, file_name')
      .eq('id', assignmentId)
      .single()

    if (fetchError) {
      return { error: fetchError }
    }

    // Extract file path from URL
    const urlParts = assignment.file_url.split('/')
    const filePath = urlParts.slice(-4).join('/') // group-X/day-Y/user-id/filename

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.STUDENT_UPLOADS)
      .remove([filePath])

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError)
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('student_uploads')
      .delete()
      .eq('id', assignmentId)

    return { error: dbError }
  } catch (error) {
    return { error }
  }
}

export async function downloadAssignment(assignment: StudentUpload): Promise<void> {
  try {
    const response = await fetch(assignment.file_url)
    if (!response.ok) throw new Error('Download failed')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = assignment.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)
  } catch (error) {
    throw new Error('Failed to download file')
  }
}

export function getAssignmentStatusColor(status: StudentUpload['status']): string {
  switch (status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800'
    case 'reviewed':
      return 'bg-purple-100 text-purple-800'
    case 'revision_needed':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export function getAssignmentStatusLabel(status: StudentUpload['status']): string {
  switch (status) {
    case 'submitted':
      return 'Submitted'
    case 'reviewed':
      return 'Reviewed'
    case 'revision_needed':
      return 'Needs Revision'
    case 'approved':
      return 'Approved'
    default:
      return status
  }
}