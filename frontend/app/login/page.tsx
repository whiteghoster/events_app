'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const success = await login(email, password)

    if (success) {
      router.push('/events')
    } else {
      setError('Invalid credentials')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle geometric background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            60deg,
            transparent,
            transparent 10px,
            var(--primary) 10px,
            var(--primary) 11px
          )`
        }}
      />

      <div
        className={cn(
          'w-full max-w-md bg-card rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-border relative',
          shake && 'animate-shake'
        )}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">E</span>
          </div>
          <h1 className="font-serif text-3xl text-foreground">
            Event<span className="text-primary">OS</span>
          </h1>
          <p className="text-muted-foreground text-sm italic mt-1">Your events. Organised.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-label">Email / Username</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-secondary border-border focus:border-primary focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-label">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-12 bg-secondary border-border focus:border-primary focus:ring-primary/20"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Demo hint */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-muted-foreground text-xs text-center">
            Demo: Use any email from the system (e.g., flora@company.com)
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
