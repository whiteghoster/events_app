'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole, AuthResponse } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('auth_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        let errorDetail = `status ${response.status}`
        try {
          const errorData = await response.json()
          errorDetail = errorData?.message || errorData?.error || errorDetail
        } catch { }
        console.error('Login failed:', errorDetail)
        return false
      }

      const data: AuthResponse = await response.json()
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      setUser(data.user)
      return true
    } catch (error) {
      console.error('Login request failed:', error)
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  // Dev helper to switch roles — kept for development convenience
  const switchRole = useCallback((role: UserRole) => {
    if (!user) return
    const updated: User = { ...user, role }
    localStorage.setItem('auth_user', JSON.stringify(updated))
    setUser(updated)
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
