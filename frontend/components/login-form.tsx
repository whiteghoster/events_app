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
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-3">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  className="h-11 rounded-lg border-border bg-secondary/50 transition-colors focus:bg-background"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 h-11 rounded-lg border-border bg-secondary/50 transition-colors focus:bg-background"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <Icon icon={showPassword ? ViewOffIcon : ViewIcon} size={16} />
                  </Button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-destructive text-sm font-medium">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 rounded-lg font-semibold bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all duration-200" 
                disabled={isLoading || isRedirecting}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : isRedirecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Redirecting...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
