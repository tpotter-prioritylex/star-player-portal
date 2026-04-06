import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'
import type { User, UserRole } from '../types'

export interface CreateUserData {
  email: string
  full_name: string
  role: UserRole
  group_id: number | null
  temporary_password: string
}

export interface UpdateUserData {
  full_name?: string
  role?: UserRole
  group_id?: number | null
}

export async function createUser(userData: CreateUserData): Promise<{ data: User | null; error: any }> {
  console.log('🚀 Starting user creation for:', userData.email)

  try {
    // Create a completely isolated Supabase client for signUp to avoid localStorage lock conflicts
    const userCreationClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          storageKey: 'user-creation-temp',
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )

    console.log('📧 Creating auth user with isolated client...')

    // Use the isolated client for signUp - completely separate from main client's localStorage
    const { data: authData, error: authError } = await userCreationClient.auth.signUp({
      email: userData.email,
      password: userData.temporary_password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role,
        }
      }
    })

    if (authError) {
      console.error('❌ Auth user creation failed:', authError.message)
      return {
        data: null,
        error: new Error(`Failed to create user account: ${authError.message}`)
      }
    }

    if (!authData.user) {
      console.error('❌ No user returned from signUp')
      return {
        data: null,
        error: new Error('No user returned from signup')
      }
    }

    const newUserId = authData.user.id
    console.log('✅ Auth user created:', newUserId)

    // Use the main supabase client (with admin session) for database operations
    console.log('👤 Creating user profile...')

    const profileData = {
      id: newUserId,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      group_id: userData.group_id,
    }

    const { data: insertedProfile, error: profileError } = await supabase
      .from('users')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message)

      let errorMessage = 'Profile creation failed'
      if (profileError.code === '42501') {
        errorMessage = 'Permission denied creating user profile'
      } else if (profileError.code === '23505') {
        errorMessage = 'User with this email already exists'
      } else {
        errorMessage = `Profile creation failed: ${profileError.message}`
      }

      return {
        data: null,
        error: new Error(`${errorMessage}. Auth account was created but profile setup failed. Contact administrator.`)
      }
    }

    if (!insertedProfile) {
      console.error('❌ No profile data returned')
      return {
        data: null,
        error: new Error('Profile creation completed but no data returned')
      }
    }

    console.log('✅ Profile created successfully:', insertedProfile.id)

    // Create SOP competencies for Star Players (optional, don't fail if this fails)
    if (userData.role === 'star_player') {
      console.log('📋 Creating SOP competencies...')
      try {
        await createSOPCompetenciesForUser(newUserId)
        console.log('✅ SOP competencies created')
      } catch (sopError) {
        console.error('⚠️ Failed to create SOP competencies:', sopError)
        // Don't fail the whole operation
      }
    }

    console.log('🎉 User creation completed successfully!')
    return { data: insertedProfile as User, error: null }

  } catch (error: any) {
    console.error('💥 Exception during user creation:', error.message)
    return {
      data: null,
      error: new Error(`User creation failed: ${error.message}`)
    }
  }
}

// Helper function to create SOP competencies for a new star player
async function createSOPCompetenciesForUser(userId: string) {
  const sopCompetencies = [
    // A Series: Core Operations
    { user_id: userId, sop_code: 'A-1', sop_title: 'Voice Intake Processing' },
    { user_id: userId, sop_code: 'A-2', sop_title: 'Matter Creation in Clio' },
    { user_id: userId, sop_code: 'A-3', sop_title: 'AI-Powered Legal Research' },
    { user_id: userId, sop_code: 'A-4', sop_title: 'Work Execution and Task Management' },
    { user_id: userId, sop_code: 'A-5', sop_title: 'Daily Operations Dashboard' },
    { user_id: userId, sop_code: 'A-6', sop_title: 'Client Communication Protocols' },
    { user_id: userId, sop_code: 'A-7', sop_title: 'Document Management and Filing' },
    { user_id: userId, sop_code: 'A-8', sop_title: 'Quality Control and Self-Review' },

    // B Series: Technology Operations
    { user_id: userId, sop_code: 'B-1', sop_title: 'Clio Manage Operations' },
    { user_id: userId, sop_code: 'B-2', sop_title: 'Claude AI Usage and Prompt Engineering' },
    { user_id: userId, sop_code: 'B-4', sop_title: 'Quo Operations' },
    { user_id: userId, sop_code: 'B-5', sop_title: 'Legal Research with Midpage MCP' },

    // D Series: Estate and Probate
    { user_id: userId, sop_code: 'D-1', sop_title: 'Asset Inventory Compilation' },
    { user_id: userId, sop_code: 'D-2', sop_title: 'Creditor Notification and Tracking' },
    { user_id: userId, sop_code: 'D-3', sop_title: 'Estate Accounting Production' },
    { user_id: userId, sop_code: 'D-4', sop_title: 'Estate Case Intake and Lifecycle Management' },

    // F Series: Governance and Compliance
    { user_id: userId, sop_code: 'F-1', sop_title: 'Confidentiality and Data Handling' },
    { user_id: userId, sop_code: 'F-2', sop_title: 'Ethical Boundaries and UPL Prevention' },
    { user_id: userId, sop_code: 'F-3', sop_title: 'Attorney Review Submission Protocol' },
    { user_id: userId, sop_code: 'F-4', sop_title: 'Incident Reporting and Escalation' },
  ]

  await supabase
    .from('sop_competencies')
    .insert(sopCompetencies)
}

export async function updateUser(userId: string, userData: UpdateUserData): Promise<{ data: User | null; error: any }> {
  try {
    console.log('🔄 Updating user:', userId, userData)

    const { data, error } = await supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ updateUser error:', error)
    } else {
      console.log('✅ User updated successfully')
    }

    return { data: data as User | null, error }
  } catch (exception: any) {
    console.error('💥 updateUser exception:', exception)
    return { data: null, error: exception }
  }
}

export async function changeUserGroup(userId: string, groupId: number | null): Promise<{ data: User | null; error: any }> {
  try {
    console.log('🔄 Changing user group:', userId, 'to group:', groupId)

    const { data, error } = await supabase
      .from('users')
      .update({
        group_id: groupId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ changeUserGroup error:', error)
      return {
        data: null,
        error: new Error(`Failed to change user group: ${error.message}`)
      }
    }

    console.log('✅ User group changed successfully')
    return { data: data as User | null, error: null }
  } catch (exception: any) {
    console.error('💥 changeUserGroup exception:', exception)
    return {
      data: null,
      error: new Error('An unexpected error occurred while changing user group. Please try again.')
    }
  }
}

export async function getAllUsers(): Promise<{ data: User[] | null; error: any }> {
  try {
    console.log('🔍 Fetching all users...')
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ getAllUsers error:', error)
      return { data: null, error }
    }

    console.log('✅ Users fetched successfully:', data?.length || 0)
    return { data: data as User[] | null, error: null }
  } catch (exception: any) {
    console.error('💥 getAllUsers exception:', exception)
    return { data: null, error: exception }
  }
}

export async function getUserById(userId: string): Promise<{ data: User | null; error: any }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return { data: data as User | null, error }
}

export async function deleteUser(userId: string): Promise<{ error: any }> {
  try {
    console.log('🗑️ Deleting user:', userId)

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('❌ deleteUser error:', error)

      // Handle specific error types
      if (error.code === '23503') {
        return {
          error: new Error('Cannot delete user: User has associated records. Please contact an administrator to properly remove this user.')
        }
      }

      if (error.code === '42501') {
        return {
          error: new Error('Permission denied: You do not have permission to delete users.')
        }
      }

      return {
        error: new Error(`Failed to delete user: ${error.message}`)
      }
    }

    console.log('✅ User deleted successfully')
    return { error: null }

  } catch (exception: any) {
    console.error('💥 deleteUser exception:', exception)
    return {
      error: new Error('An unexpected error occurred while deleting the user. Please try again.')
    }
  }
}

export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function resetPassword(userId: string, newPassword: string): Promise<{ error: any }> {
  try {
    console.log('🔄 Resetting password for user:', userId)

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase configuration')
      return { error: new Error('Supabase configuration is missing') }
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/admin-reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        new_password: newPassword
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Password reset failed:', response.status, errorText)

      let errorMessage = 'Password reset failed'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorMessage
      } catch {
        // If parsing fails, use the raw text or generic message
        errorMessage = errorText || errorMessage
      }

      return { error: new Error(errorMessage) }
    }

    console.log('✅ Password reset successfully')
    return { error: null }

  } catch (exception: any) {
    console.error('💥 resetPassword exception:', exception)
    return { error: new Error(`Password reset failed: ${exception.message}`) }
  }
}