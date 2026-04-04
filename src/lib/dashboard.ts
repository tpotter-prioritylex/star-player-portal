import { supabase } from './supabase'

export interface DashboardStats {
  totalStarPlayers: number
  avgCompletion: number
  pendingReviews: number
  activeGroups: number
}

export async function getDashboardStats(): Promise<{ data: DashboardStats | null; error: any }> {
  try {
    console.log('🔍 Fetching dashboard stats...')

    // Fetch all stats in parallel
    const [
      starPlayersResult,
      uploadsResult,
      groupsResult,
      competenciesResult
    ] = await Promise.all([
        // Count star players
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'star_player'),

        // Count pending reviews
        supabase
          .from('student_uploads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'submitted'),

        // Count active groups (groups with users)
        supabase
          .from('users')
          .select('group_id')
          .not('group_id', 'is', null),

        // Get completion data for average calculation
        supabase
          .from('sop_competencies')
          .select('user_id, competency_level, user:users!user_id(role)')
      ])

    // Calculate stats
    const totalStarPlayers = starPlayersResult.count || 0
    const pendingReviews = uploadsResult.count || 0

    // Calculate unique groups
    const groupIds = (groupsResult.data || []).map(u => u.group_id).filter(Boolean)
    const activeGroups = new Set(groupIds).size

    // Calculate average completion percentage
    let avgCompletion = 0
    if (competenciesResult.data && competenciesResult.data.length > 0) {
      const starPlayerCompetencies = competenciesResult.data.filter(
        (comp: any) => comp.user?.role === 'star_player'
      )

      if (starPlayerCompetencies.length > 0) {
        const totalLevels = starPlayerCompetencies.reduce((sum: number, comp: any) => {
          return sum + (comp.competency_level || 0)
        }, 0)

        // Assuming competency levels are 0-4 (5 levels), calculate percentage
        const maxPossibleScore = starPlayerCompetencies.length * 4
        avgCompletion = maxPossibleScore > 0 ? Math.round((totalLevels / maxPossibleScore) * 100) : 0
      }
    }

    const stats: DashboardStats = {
      totalStarPlayers,
      avgCompletion,
      pendingReviews,
      activeGroups
    }

    console.log('✅ Dashboard stats fetched:', stats)
    return { data: stats, error: null }

  } catch (exception: any) {
    console.error('💥 getDashboardStats exception:', exception)
    return { data: null, error: exception }
  }
}