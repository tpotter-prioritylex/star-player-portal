import { useState, useEffect, createContext, useContext } from 'react'
import type { User as AppUser } from '../types'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function useAuthState() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshUser = async (force = false) => {
    // Prevent concurrent refreshes unless forced
    if (isRefreshing && !force) {
      return
    }

    try {
      setIsRefreshing(true)

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        // Only clear user on auth-specific errors, not network issues
        if (sessionError.message?.includes('invalid') || sessionError.message?.includes('expired')) {
          setUser(null)
        }
        setLoading(false)
        return
      }

      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }

      // Get user profile from database
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (dbError) {
        console.error('Database error fetching user:', dbError)

        // Only clear user if it's a real database error (not network/temporary)
        if (dbError.code === 'PGRST116' || dbError.message?.includes('not found')) {
          // User profile doesn't exist
          console.warn('User profile not found, keeping auth session but clearing user')
          setUser(null)
        } else if (!dbError.message?.includes('network') && !dbError.message?.includes('timeout')) {
          // Other database errors (not network issues)
          setUser(null)
        }
        // For network errors, keep existing user state
      } else if (userData) {
        setUser(userData as AppUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      // Don't clear user on network errors
      if (error instanceof Error && !error.message?.includes('network')) {
        setUser(null)
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
    setUser(null)
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    refreshUser(true)

    // Listen for auth changes with debouncing
    let refreshTimeout: NodeJS.Timeout

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state change:', event, !!session)

      // Clear any pending refresh
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }

      if (event === 'SIGNED_IN') {
        // Immediate refresh on sign in
        await refreshUser(true)
      } else if (event === 'TOKEN_REFRESHED') {
        // Debounced refresh on token refresh to prevent loops
        refreshTimeout = setTimeout(() => {
          if (mounted) {
            refreshUser(false)
          }
        }, 1000)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, signOut, refreshUser }
}