import { supabase } from './supabase'
import type { SOPCompetency, PipelineCertification } from '../types'

export async function getSOPCompetencies(userId?: string): Promise<{ data: SOPCompetency[] | null; error: any }> {
  try {
    console.log('🔍 Fetching SOP competencies...')
    let query = supabase
      .from('sop_competencies')
      .select('*')
      .order('sop_code', { ascending: true })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ getSOPCompetencies error:', error)
    } else {
      console.log('✅ SOP competencies fetched:', data?.length || 0)
    }

    return { data: data as SOPCompetency[] | null, error }
  } catch (exception: any) {
    console.error('💥 getSOPCompetencies exception:', exception)
    return { data: null, error: exception }
  }
}

export async function updateSOPCompetency(
  id: number,
  status: SOPCompetency['status'],
  notes?: string
): Promise<{ data: SOPCompetency | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const { data, error } = await supabase
      .from('sop_competencies')
      .update({
        status,
        notes: notes || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    return { data: data as SOPCompetency | null, error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getPipelineCertifications(userId?: string): Promise<{ data: PipelineCertification[] | null; error: any }> {
  try {
    console.log('🔍 Fetching pipeline certifications...')
    let query = supabase
      .from('pipeline_certifications')
      .select('*')
      .order('id', { ascending: true })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ getPipelineCertifications error:', error)
    } else {
      console.log('✅ Pipeline certifications fetched:', data?.length || 0)
    }

    return { data: data as PipelineCertification[] | null, error }
  } catch (exception: any) {
    console.error('💥 getPipelineCertifications exception:', exception)
    return { data: null, error: exception }
  }
}

export async function updatePipelineCertification(
  id: number,
  status: PipelineCertification['status'],
  completedAt?: string
): Promise<{ data: PipelineCertification | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error('User not authenticated') }
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'completed') {
      updateData.completed_at = completedAt || new Date().toISOString()
      updateData.verified_by = user.id
    } else {
      updateData.completed_at = null
      updateData.verified_by = null
    }

    const { data, error } = await supabase
      .from('pipeline_certifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    return { data: data as PipelineCertification | null, error }
  } catch (error) {
    return { data: null, error }
  }
}

export function getSOPStatusColor(status: SOPCompetency['status']): string {
  switch (status) {
    case 'not_started':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'in_progress':
      return 'bg-teal/10 text-teal border-teal/20'
    case 'demonstrated':
      return 'bg-teal text-white border-teal'
    case 'verified':
      return 'bg-gold text-navy border-gold'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function getSOPStatusLabel(status: SOPCompetency['status']): string {
  switch (status) {
    case 'not_started':
      return 'Not Started'
    case 'in_progress':
      return 'In Progress'
    case 'demonstrated':
      return 'Demonstrated'
    case 'verified':
      return 'Verified'
    default:
      return status
  }
}

export function getCertificationStatusColor(status: PipelineCertification['status']): string {
  switch (status) {
    case 'not_started':
      return 'bg-gray-100 text-gray-600'
    case 'in_progress':
      return 'bg-teal/10 text-teal'
    case 'completed':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export function getCertificationStatusLabel(status: PipelineCertification['status']): string {
  switch (status) {
    case 'not_started':
      return 'Not Started'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    default:
      return status
  }
}

// Group SOPs by series
export function groupSOPsBySeries(sops: SOPCompetency[]) {
  const groups: Record<string, SOPCompetency[]> = {}

  sops.forEach(sop => {
    const series = sop.sop_code.charAt(0)
    if (!groups[series]) {
      groups[series] = []
    }
    groups[series].push(sop)
  })

  return groups
}

// Calculate progress statistics
export function calculateProgress(sops: SOPCompetency[], certifications: PipelineCertification[]) {
  const sopStats = {
    total: sops.length,
    notStarted: sops.filter(s => s.status === 'not_started').length,
    inProgress: sops.filter(s => s.status === 'in_progress').length,
    demonstrated: sops.filter(s => s.status === 'demonstrated').length,
    verified: sops.filter(s => s.status === 'verified').length,
  }

  const certStats = {
    total: certifications.length,
    notStarted: certifications.filter(c => c.status === 'not_started').length,
    inProgress: certifications.filter(c => c.status === 'in_progress').length,
    completed: certifications.filter(c => c.status === 'completed').length,
  }

  const overallProgress = {
    sop: sopStats.total > 0 ? ((sopStats.demonstrated + sopStats.verified) / sopStats.total * 100) : 0,
    certification: certStats.total > 0 ? (certStats.completed / certStats.total * 100) : 0,
  }

  return { sopStats, certStats, overallProgress }
}