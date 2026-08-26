import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface SafeUser {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

/**
 * Get the currently authenticated user from the server session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role || 'user',
  }
}

/**
 * Ensures the user is authenticated on the server side.
 * Throws an error or returns the user object.
 */
export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  return user
}

/**
 * Ensures the user is authenticated and has the admin role.
 * Throws an error or returns the admin user object.
 */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin privileges required')
  }
  return user
}
