'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from './types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Initialize auth state from localStorage on mount
   * Attempts to restore user session if access token exists
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

        if (token) {
          // Token exists, user was previously logged in
          // In a real app, you'd validate the token here
          // For now, we'll trust the stored session
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            setUser(JSON.parse(storedUser))
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err)
        // Clear invalid tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Login failed')
        }

        const data = await response.json()

        // Store tokens in localStorage
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token)
          }
        }

        // Store user info
        const userData: User = {
          id: data.user.id,
          name: data.user.email,
          email: data.user.email,
          role: data.user.role || 'Staff',
          createdAt: new Date().toISOString(),
        }

        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed'
        setError(errorMessage)
        console.error('Login failed:', errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      }).catch(() => {
        // Logout can fail if token is invalid, but we still want to clear local state
      })
    } finally {
      // Clear local state regardless of backend response
      setUser(null)
      setError(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  }, [])

  /**
   * Dev helper to switch roles (for testing only)
   * Remove in production
   */
  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        switchRole,
      }}
    >
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

// Permission helpers
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