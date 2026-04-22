'use client'

import Link from 'next/link'
import { Icon } from '@/components/icon'
import { Add01Icon, Search01Icon, Download01Icon } from '@hugeicons/core-free-icons'
import { EventCard } from '@/components/event-card'
import { EmptyState } from '@/components/empty-state'
import { useAuth, canCreateEvent } from '@/lib/auth-context'
import { useEvents } from '@/hooks/use-events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTransition } from '@/components/page-transition'
import { Loader2 } from 'lucide-react'

export default function EventsPage() {
  const { user } = useAuth()
  const {
    isLoading, search, setSearch,
    activeTab, setActiveTab,
    filteredEvents, prefetchEvent,
    handleExportCSV,
  } = useEvents()

  return (
    <PageTransition>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Icon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="hold">Hold</TabsTrigger>
            <TabsTrigger value="finished">Finished</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto flex items-center gap-2">
          {user && canCreateEvent(user.role) && (
            <Link href={activeTab === 'live' ? '/events/new' : '#'} onClick={(e) => activeTab !== 'live' && e.preventDefault()}>
              <Button size="sm" disabled={activeTab !== 'live'}>
                <Icon icon={Add01Icon} size={16} className="mr-1.5" />
                New Event
              </Button>
            </Link>
          )}
          {user?.role === 'admin' && (
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={activeTab !== 'finished'}>
              <Icon icon={Download01Icon} size={16} className="mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {!isLoading && filteredEvents.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEvents.map(event => (
            <div
              key={event.id}
              onMouseEnter={() => prefetchEvent(event.id)}
              onTouchStart={() => prefetchEvent(event.id)}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No events found"
          description={search ? 'No events match your search criteria' : 'Create your first event to get started'}
          action={
            user && canCreateEvent(user.role) && activeTab === 'live' && !search ? (
              <Link href="/events/new">
                <Button>
                  <Icon icon={Add01Icon} size={16} className="mr-2" />
                  New Event
                </Button>
              </Link>
            ) : undefined
          }
        />
      )}
    </PageTransition>
  )
}
