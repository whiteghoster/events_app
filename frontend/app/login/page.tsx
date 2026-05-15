'use client'

import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-10">
      <div className="w-full max-w-md">
        <div className="space-y-2 mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Zevan
          </h1>
          <p className="text-muted-foreground text-sm">Professional Event Management System</p>
        </div>
        <div className="rounded-2xl border border-border bg-card shadow-lg">
          <div className="p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
