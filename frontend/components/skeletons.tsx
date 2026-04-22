import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'

export function EventCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  )
}

export function EventsGridSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function EventDetailSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md shrink-0" />
          <Skeleton className="h-6 w-44" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block w-72 xl:w-80 shrink-0 space-y-4">
          <div className="rounded-xl border border-border p-4 space-y-4">
            <Skeleton className="h-3 w-20" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-4 w-4 rounded shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-4 w-full max-w-[10rem]" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-6 rounded" />
              </div>
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
            <div className="p-5 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-6 shrink-0" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-10 ml-auto" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CatalogSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-64 shrink-0">
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="flex-1">
        <Card>
          <CardHeader className="py-4">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <TableSkeleton rows={6} cols={4} />
        </Card>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card>
        <TableSkeleton rows={8} cols={5} />
      </Card>
    </div>
  )
}
