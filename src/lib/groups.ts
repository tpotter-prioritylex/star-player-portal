import { supabase } from './supabase'
import type { Group } from '../types'

export async function getAllGroups(): Promise<{ data: Group[] | null; error: any }> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('id', { ascending: true })

  return { data: data as Group[] | null, error }
}

export async function getGroupById(groupId: number): Promise<{ data: Group | null; error: any }> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  return { data: data as Group | null, error }
}

// For development/testing - create default groups if they don't exist
export const DEFAULT_GROUPS = [
  { id: 1, name: 'Group 1', cohort: 'Cohort 2' },
  { id: 2, name: 'Group 2', cohort: 'Cohort 2' },
  { id: 3, name: 'Group 3', cohort: 'Cohort 2' },
  { id: 4, name: 'Group 4', cohort: 'Cohort 2' },
  { id: 5, name: 'Group 5', cohort: 'Cohort 2' },
  { id: 6, name: 'Group 6', cohort: 'Cohort 2' },
]