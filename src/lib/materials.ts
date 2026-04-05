import { supabase } from './supabase'
import { STORAGE_BUCKETS } from './supabase'
import type { CurriculumMaterial, TrainingDay } from '../types'

export interface UploadMaterialData {
  day_id: number
  title: string
  description?: string
  sop_reference?: string
  practice_area?: string
  file: File
}

export async function getTrainingDays(): Promise<{ data: TrainingDay[] | null; error: any }> {
  try {
    console.log('🔍 Fetching training days...')
    const { data, error } = await supabase
      .from('training_days')
      .select('*')
      .order('day_number', { ascending: true })

    if (error) {
      console.error('❌ getTrainingDays error:', error)
    } else {
      console.log('✅ Training days fetched:', data?.length || 0)
    }

    return { data: data as TrainingDay[] | null, error }
  } catch (exception: any) {
    console.error('💥 getTrainingDays exception:', exception)
    return { data: null, error: exception }
  }
}

export async function getCurriculumMaterials(): Promise<{ data: CurriculumMaterial[] | null; error: any }> {
  try {
    console.log('🔍 Fetching curriculum materials...')
    const { data, error } = await supabase
      .from('curriculum_materials')
      .select(`
        *,
        training_day:training_days!day_id(id, day_number, title)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ getCurriculumMaterials error:', error)
    } else {
      console.log('✅ Curriculum materials fetched:', data?.length || 0)
    }

    return { data: data as CurriculumMaterial[] | null, error }
  } catch (exception: any) {
    console.error('💥 getCurriculumMaterials exception:', exception)
    return { data: null, error: exception }
  }
}

export async function uploadMaterial(materialData: UploadMaterialData): Promise<{ data: CurriculumMaterial | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    // Generate file path
    const fileName = `${Date.now()}-${materialData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `day-${materialData.day_id}/${fileName}`

    // Upload file to storage
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.CURRICULUM_MATERIALS)
      .upload(filePath, materialData.file)

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.CURRICULUM_MATERIALS)
      .getPublicUrl(filePath)

    // Create material record
    const { data: materialRecord, error: dbError } = await supabase
      .from('curriculum_materials')
      .insert({
        day_id: materialData.day_id,
        title: materialData.title,
        description: materialData.description,
        file_url: publicUrl,
        file_name: materialData.file.name,
        file_size: materialData.file.size,
        sop_reference: materialData.sop_reference,
        practice_area: materialData.practice_area,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from(STORAGE_BUCKETS.CURRICULUM_MATERIALS)
        .remove([filePath])
      return { data: null, error: dbError }
    }

    return { data: materialRecord as CurriculumMaterial, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteMaterial(materialId: string): Promise<{ error: any }> {
  try {
    // Get material info first to delete file from storage
    const { data: material, error: fetchError } = await supabase
      .from('curriculum_materials')
      .select('file_url, day_id, file_name')
      .eq('id', materialId)
      .single()

    if (fetchError) {
      return { error: fetchError }
    }

    // Extract file path from URL
    const urlParts = material.file_url.split('/')
    const filePath = urlParts.slice(-2).join('/') // day-X/filename

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.CURRICULUM_MATERIALS)
      .remove([filePath])

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError)
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('curriculum_materials')
      .delete()
      .eq('id', materialId)

    return { error: dbError }
  } catch (error) {
    return { error }
  }
}

export async function downloadMaterial(material: CurriculumMaterial): Promise<void> {
  try {
    const response = await fetch(material.file_url)
    if (!response.ok) throw new Error('Download failed')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = material.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)
  } catch (error) {
    throw new Error('Failed to download file')
  }
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'pdf':
      return '📄'
    case 'doc':
    case 'docx':
      return '📝'
    case 'xls':
    case 'xlsx':
      return '📊'
    case 'ppt':
    case 'pptx':
      return '📋'
    case 'zip':
    case 'rar':
      return '📦'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '🖼️'
    case 'mp4':
    case 'mov':
    case 'avi':
      return '🎥'
    case 'mp3':
    case 'wav':
      return '🎵'
    default:
      return '📄'
  }
}