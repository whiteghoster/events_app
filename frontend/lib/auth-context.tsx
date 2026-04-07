'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole } from './types'
import { users } from './mock-data'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (foundUser) {
      setUser(foundUser)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  // Dev helper to switch roles
  const switchRole = useCallback((role: UserRole) => {
    const userWithRole = users.find(u => u.role === role)
    if (userWithRole) {
      setUser(userWithRole)
    }
  }, [])

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
