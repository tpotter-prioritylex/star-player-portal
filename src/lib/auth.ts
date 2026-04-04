import { supabase } from './supabase'
import type { User } from '../types'

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !userData) {
      return null
    }

    return userData as User
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function getAuthUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}