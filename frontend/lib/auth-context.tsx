'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { User, UserRole } from './types'
import { authApi } from './api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void  // kept for dev convenience
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Map backend role strings → frontend UserRole type
function normalizeRole(role: string): UserRole {
  if (!role) return 'Staff'
  const r = role.toLowerCase()
  if (r === 'admin') return 'Admin'
  if (r === 'staff_member' || r === 'staff member') return 'Staff Member'
  return 'Staff'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const stored = localStorage.getItem('flora_user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('flora_user')
        localStorage.removeItem('access_token')
      }
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await authApi.login(email, password)

      const loggedInUser: User = {
        id: data.user.id,
        name: data.user.email.split('@')[0], // derive display name from email
        email: data.user.email,
        role: normalizeRole(data.user.role),
        createdAt: new Date().toISOString(),
      }

      // Persist token and user profile
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      localStorage.setItem('flora_user', JSON.stringify(loggedInUser))

      setUser(loggedInUser)
      return true
    } catch (err) {
      console.error('Login failed:', err)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('flora_user')
    setUser(null)
  }, [])

  // Dev helper: re-login with a different role (only works if user is already logged in)
  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      const updated = { ...user, role }
      setUser(updated)
      localStorage.setItem('flora_user', JSON.stringify(updated))
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Permission helpers (unchanged)
export function canCreateEvent(role: UserRole): boolean {
  return role === 'Admin'
}

export function canEditEvent(role: UserRole): boolean {
  return role === 'Admin'
}

export function canCloseEvent(role: UserRole): boolean {
  return role === 'Admin'
}

export function canManageProducts(role: UserRole): boolean {
  return role === 'Admin' || role === 'Staff'
}

export function canEditProductRow(role: UserRole): boolean {
  return role === 'Admin' || role === 'Staff'
}

export function canEditQuantityOnly(role: UserRole): boolean {
  return role === 'Staff Member'
}

export function canViewCatalog(role: UserRole): boolean {
  return role === 'Admin' || role === 'Staff'
}

export function canViewUsers(role: UserRole): boolean {
  return role === 'Admin'
}

export function canViewAudit(role: UserRole): boolean {
  return role === 'Admin'
}
