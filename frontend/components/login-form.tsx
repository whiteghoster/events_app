'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { Icon } from '@/components/icon'
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import { useLogin } from '@/hooks/use-login'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    isLoading, isRedirecting, error,
    handleSubmit,
  } = useLogin()

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <img src="/favicon-32x32.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight">Zevan</span>
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@floraindia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <Icon icon={showPassword ? ViewOffIcon : ViewIcon} size={16} />
                  </Button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : isRedirecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              Sign in with your Zevan account credentials.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
