'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogOut, Copy, Check, User, Mail, Shield, Key } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useAuth } from '@/lib/auth-context'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AccountPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Get password from localStorage
    const storedPassword = localStorage.getItem('user_password')
    if (storedPassword) {
      setPassword(storedPassword)
    } else {
      setPassword('Password not available. Please log in again.')
    }
  }, [])

  if (!user) {
    router.replace('/login')
    return null
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    toast.success('Password copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token && user) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
      }
      localStorage.clear()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.clear()
      router.push('/login')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-screen">
      <PageHeader title="My Account" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8 space-y-4 sm:space-y-6">
        {/* User Info Card */}
        <Card className="clay-card border-0">
          <CardHeader className="pt-4 sm:pt-5 pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            {/* Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">Name</label>
              <div className="clay-input px-3 sm:px-4 py-2 sm:py-2.5">
                <p className="font-medium text-sm sm:text-base text-foreground">{user.name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">Email</label>
              <div className="clay-input px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="font-medium text-sm sm:text-base truncate text-foreground">{user.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">Role</label>
              <div className="clay-input px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="font-medium text-sm sm:text-base capitalize text-foreground">{user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card className="clay-card border-0">
          <CardHeader className="pt-4 sm:pt-5 pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
              <Key className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Password
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">Your Password</label>
              <div className="clay-input px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
                <p className="font-mono text-sm sm:text-base truncate text-foreground">
                  {showPassword ? password : '••••••••'}
                </p>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-8 w-8 flex-shrink-0 hover:bg-primary/10 hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyPassword}
                    className="h-8 w-8 flex-shrink-0 hover:bg-primary/10 hover:text-primary"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {password.includes('not available') 
                  ? 'Password not stored. Please log out and log in again to save your password.'
                  : 'Toggle the eye icon to show/hide your password'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="clay-card border-0">
          <CardHeader className="pt-4 sm:pt-5 pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <Button
              onClick={handleLogout}
              className="w-full clay-button text-white h-11 sm:h-12 text-sm sm:text-base font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
