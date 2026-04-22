'use client'

import { useAuth } from '@/lib/auth-context'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, User, Mail, Shield, Calendar } from 'lucide-react'

export default function AccountPage() {
  const { user, logout } = useAuth()

  if (!user) return null

  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    karigar: 'Karigar',
    manager: 'Manager',
  }

  return (
    <PageTransition>
      <div className="max-w-lg">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight mb-6">Account</h1>

        {/* Profile card */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Avatar + name header */}
          <div className="px-5 py-5 border-b border-border flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{user.name}</p>
              <Badge variant="secondary" className="text-[11px] mt-1">
                {roleLabel[user.role] || user.role}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="divide-y divide-border">
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
            <InfoRow icon={<Shield className="w-4 h-4" />} label="Role" value={roleLabel[user.role] || user.role} />
            <InfoRow icon={<User className="w-4 h-4" />} label="User ID" value={user.id} mono />
            {user.createdAt && (
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="Member since"
                value={new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => { if (confirm('Are you sure you want to log out?')) logout() }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
      <span className={`text-sm text-foreground truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
