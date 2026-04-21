'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icon'
import { ViewIcon, ViewOffIcon, Logout01Icon, Copy01Icon, Mail01Icon, Shield01Icon, Key01Icon } from '@hugeicons/core-free-icons'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageTransition } from '@/components/page-transition'
import { toast } from 'sonner'

function ProfileCard({ user }: { user: { name: string; email: string; role: string } }) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon icon={Mail01Icon} size={14} />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="secondary" className="capitalize">
                <Icon icon={Shield01Icon} size={12} className="mr-1" />
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PasswordCard() {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user_password')
    setPassword(stored || 'Password not available. Please log in again.')
  }, [])

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password)
    toast.success('Password copied to clipboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon icon={Key01Icon} size={16} />
          Password
        </CardTitle>
        <CardDescription>
          {password.includes('not available')
            ? 'Log out and log in again to save your password.'
            : 'Your saved password for this session.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2.5">
          <code className="flex-1 text-sm font-mono">
            {showPassword ? password : '••••••••••'}
          </code>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowPassword(!showPassword)}>
            <Icon icon={showPassword ? ViewOffIcon : ViewIcon} size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopyPassword}>
            <Icon icon={Copy01Icon} size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ThemeCard() {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Choose your preferred theme</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {options.map((opt) => (
            <Button
              key={opt.value}
              variant={theme === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme(opt.value)}
            >
              <opt.icon className="size-3.5 mr-1.5" />
              {opt.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SignOutCard({ onLogout }: { onLogout: () => void }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Sign out</p>
            <p className="text-xs text-muted-foreground mt-0.5">End your current session</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <Icon icon={Logout01Icon} size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const { user } = useAuth()

  if (!user) {
    router.replace('/login')
    return null
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
    } catch {
      // silent
    } finally {
      localStorage.clear()
      router.push('/login')
    }
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6 pb-24 lg:pb-8">
        <ProfileCard user={user} />
        <ThemeCard />
        <PasswordCard />
        <SignOutCard onLogout={handleLogout} />
      </div>
    </PageTransition>
  )
}
