'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { BarChart3, Table2, Settings, LogOut, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">Audit Dashboard</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar border-r border-sidebar-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border hidden lg:block">
          <h1 className="text-xl font-bold text-sidebar-foreground">Audit Dashboard</h1>
          <p className="text-sm text-sidebar-foreground/60 mt-2">System Activity Monitor</p>
        </div>

        {/* Mobile Header */}
        <div className="p-6 border-b border-sidebar-border lg:hidden">
          <h1 className="text-xl font-bold text-sidebar-foreground">Audit Dashboard</h1>
          <p className="text-sm text-sidebar-foreground/60 mt-2">System Activity Monitor</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" onClick={() => setIsOpen(false)}>
            <Button
              variant={isActive('/dashboard') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/audits" onClick={() => setIsOpen(false)}>
            <Button
              variant={isActive('/audits') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Table2 className="w-4 h-4" />
              Audit Logs
            </Button>
          </Link>
          <Link href="/analytics" onClick={() => setIsOpen(false)}>
            <Button
              variant={isActive('/analytics') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
          </Link>
          <Link href="/settings" onClick={() => setIsOpen(false)}>
            <Button
              variant={isActive('/settings') ? 'default' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-4">
          <div className="px-2 py-2 rounded bg-sidebar-accent/10">
            <p className="text-xs font-semibold text-sidebar-foreground/70">Logged in as</p>
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
