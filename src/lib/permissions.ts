import type { User, UserRole } from '../types'

export function canCreateUsers(user: User): boolean {
  return user.role === 'admin'
}

export function canDeleteUsers(user: User): boolean {
  return user.role === 'admin'
}

export function canManageGroups(user: User): boolean {
  return user.role === 'admin'
}

export function canUploadCurriculum(user: User): boolean {
  return user.role === 'admin' || user.role === 'instructor'
}

export function canReviewUploads(user: User): boolean {
  return user.role === 'admin' || user.role === 'instructor'
}

export function canUpdateCompetencies(user: User): boolean {
  return user.role === 'admin' || user.role === 'instructor'
}

export function canAccessAllGroups(user: User): boolean {
  return user.role === 'admin' || user.role === 'instructor'
}

export function canDeleteMessages(user: User): boolean {
  return user.role === 'admin'
}

export function canManageAnnouncements(user: User): boolean {
  return user.role === 'admin' || user.role === 'instructor'
}

export function canAccessGroupChat(user: User, groupId: number): boolean {
  // Admins and instructors can access all group chats
  if (user.role === 'admin' || user.role === 'instructor') {
    return true
  }

  // Star players can only access their own group chat
  return user.role === 'star_player' && user.group_id === groupId
}

export function canAccessCohortChat(_user: User): boolean {
  // All authenticated users can access cohort chat
  return true
}

export function canUploadToGroup(user: User, groupId: number): boolean {
  // Star players can only upload to their own group
  if (user.role === 'star_player') {
    return user.group_id === groupId
  }

  // Admins and instructors cannot upload assignments (they review them)
  return false
}

export function canViewAllUploads(user: User): boolean {
  return user.role === 'admin' || user.role === 'instructor'
}

export function canViewUserProgress(user: User, targetUserId: string): boolean {
  // Users can view their own progress
  if (user.id === targetUserId) {
    return true
  }

  // Admins and instructors can view all progress
  return user.role === 'admin' || user.role === 'instructor'
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'instructor':
      return 'Instructor'
    case 'star_player':
      return 'Star Player'
  }
}

export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'bg-gold text-navy'
    case 'instructor':
      return 'bg-teal text-white'
    case 'star_player':
      return 'bg-navy text-white'
  }
}