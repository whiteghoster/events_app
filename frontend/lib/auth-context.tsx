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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

// ─── Token helpers ────────────────────────────────────────────────────────────

function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('expires_at')
  if (!expiresAt) return true
  // Treat as expired 60 s before actual expiry so we refresh proactively
  return Date.now() / 1000 > Number(expiresAt) - 60
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null

    const json = await res.json()
    const data = json.data ?? json
    if (!data?.access_token) return null

    localStorage.setItem('access_token', data.access_token)
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
    if (data.expires_at)   localStorage.setItem('expires_at',   String(data.expires_at))

    return data.access_token
  } catch {
    return null
  }
}

function clearSession() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('expires_at')
  localStorage.removeItem('user')
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        if (!token) return

        // If token is expired, try to silently refresh before restoring session
        if (isTokenExpired()) {
          const newToken = await tryRefreshToken()
          if (!newToken) {
            // Refresh failed — clear everything and redirect to login
            clearSession()
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login'
            }
            return
          }
        }

        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.error('Failed to restore session:', err)
        clearSession()
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

        const json = await response.json()
        const data = json.data ?? json

        // Store tokens + expiry
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
          if (data.expires_at)   localStorage.setItem('expires_at',   String(data.expires_at))
        }

        const userData: User = {
          id: data.user.id,
          name: data.user.name || data.user.email,
          email: data.user.email,
          role: (data.user.role || 'staff').toLowerCase() as UserRole,
          createdAt: new Date().toISOString(),
        }

        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))

        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed'
        setError(errorMessage)
        console.error('❌ Login error:', errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {
          // Silent fail — always clear local state
        })
      }
    } finally {
      setUser(null)
      setError(null)
      clearSession()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
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

// ─── RBAC helpers ─────────────────────────────────────────────────────────────

export function canCreateEvent(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'admin' || role === 'staff'
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return role === 'admin'
}

export function canDeactivateUser(role: UserRole | undefined): boolean {
  return role === 'admin'
}

export function canCloseEvent(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'admin'
}

export function canViewCatalog(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'admin' || role === 'staff' || role === 'staff_member'
}

export function canViewUsers(role: UserRole | undefined): boolean {
  return role === 'admin'
}

export function canViewAudit(role: UserRole | undefined): boolean {
  return role === 'admin'
}

export function canEditEvent(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'admin' || role === 'staff'
}

export function canEditProductRow(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'admin' || role === 'staff'
}

export function canEditQuantityOnly(role: UserRole | undefined): boolean {
  return role === 'staff_member'
}

export function canManageProducts(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'admin' || role === 'staff'
}