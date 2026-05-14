'use client'

import { Icon } from '@/components/icon'
import { Mail01Icon, Shield01Icon, UserCircleIcon, Calendar01Icon, Logout01Icon } from '@hugeicons/core-free-icons'
import { useAuth } from '@/lib/auth-context'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
      <div className="max-w-2xl">
        {/* Profile card */}
        <Card className="py-0 gap-0">
          <CardContent className="p-0">
            {/* Avatar + name header */}
            <div className="px-5 py-5 flex items-center gap-4">
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

            <Separator />

            {/* Details */}
            <div className="divide-y divide-border">
              <InfoRow icon={<Icon icon={Mail01Icon} size={16} />} label="Email" value={user.email} />
              <InfoRow icon={<Icon icon={Shield01Icon} size={16} />} label="Role" value={roleLabel[user.role] || user.role} />
              <InfoRow icon={<Icon icon={UserCircleIcon} size={16} />} label="User ID" value={user.id} mono />
              {user.createdAt && (
                <InfoRow
                  icon={<Icon icon={Calendar01Icon} size={16} />}
                  label="Member since"
                  value={new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => { if (confirm('Are you sure you want to log out?')) logout() }}
          >
            <Icon icon={Logout01Icon} size={16} className="mr-2" />
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
