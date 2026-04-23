'use client'

import { useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useDashboard } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Icon } from '@/components/icon'
import {
  DashboardSquare01Icon,
  Calendar01Icon,
  UserGroupIcon,
  CatalogueIcon,
  GridViewIcon,
} from '@hugeicons/core-free-icons'
import { Loader2 } from 'lucide-react'
import { PageTransition } from '@/components/page-transition'

const COLORS = {
  primary: 'hsl(var(--primary))',
  success: '#22c55e',
  warning: '#f59e0b',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted-foreground))',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
}

const chartConfig: ChartConfig = {
  events: { label: 'Events', color: COLORS.primary },
  users: { label: 'Users', color: COLORS.blue },
  products: { label: 'Products', color: COLORS.purple },
  categories: { label: 'Categories', color: COLORS.orange },
}

// Simple stat card component for faster rendering
function StatCard({ title, value, subtext, icon, color = 'text-primary', isLoading = false }: {
  title: string
  value: number
  subtext: string
  icon: typeof DashboardSquare01Icon
  color?: string
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 md:p-6">
        <CardTitle className="text-sm md:text-base font-medium">{title}</CardTitle>
        <Icon icon={icon} className={`h-5 w-5 md:h-6 md:w-6 ${color}`} />
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        <div className="text-2xl md:text-3xl font-bold">{value}</div>
        <p className="text-xs md:text-sm text-muted-foreground truncate">{subtext}</p>
      </CardContent>
    </Card>
  )
}

// Chart skeleton for loading state
function ChartSkeleton() {
  return (
    <div className="h-[150px] md:h-[250px] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats, isLoading, error } = useDashboard()

  // Memoize chart data to prevent recalculation
  const eventsChartData = useMemo(() => stats ? [
    { name: 'Live', value: stats.activeEvents, color: COLORS.success },
    { name: 'Hold', value: stats.holdEvents, color: COLORS.warning },
    { name: 'Finished', value: stats.finishedEvents, color: COLORS.primary },
  ] : [], [stats])

  const usersChartData = useMemo(() => stats ? [
    { name: 'Active', value: stats.activeUsers, color: COLORS.success },
    { name: 'Inactive', value: stats.inactiveUsers, color: COLORS.destructive },
  ] : [], [stats])

  const productsChartData = useMemo(() => stats ? [
    { name: 'Active', value: stats.activeProducts, color: COLORS.blue },
    { name: 'Inactive', value: stats.inactiveProducts, color: COLORS.muted },
  ] : [], [stats])

  const summaryChartData = useMemo(() => stats ? [
    { name: 'Events', value: stats.totalEvents, color: COLORS.primary },
    { name: 'Users', value: stats.totalUsers, color: COLORS.blue },
    { name: 'Products', value: stats.totalProducts, color: COLORS.purple },
    { name: 'Categories', value: stats.totalCategories, color: COLORS.orange },
  ] : [], [stats])

  // Show cards immediately with 0 values while loading
  const displayStats = stats || {
    totalEvents: 0, totalUsers: 0, totalProducts: 0, totalCategories: 0,
    activeEvents: 0, holdEvents: 0, finishedEvents: 0,
    activeUsers: 0, inactiveUsers: 0,
    activeProducts: 0, inactiveProducts: 0
  }

  if (error) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      {/* Summary Cards - Show skeleton while loading */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
        <StatCard
          title="Events"
          value={displayStats.totalEvents}
          subtext={`${displayStats.activeEvents} live, ${displayStats.holdEvents} hold`}
          icon={Calendar01Icon}
          isLoading={isLoading}
        />
        <StatCard
          title="Users"
          value={displayStats.totalUsers}
          subtext={`${displayStats.activeUsers} active, ${displayStats.inactiveUsers} inactive`}
          icon={UserGroupIcon}
          isLoading={isLoading}
        />
        <StatCard
          title="Products"
          value={displayStats.totalProducts}
          subtext={`${displayStats.activeProducts} active, ${displayStats.inactiveProducts} inactive`}
          icon={CatalogueIcon}
          isLoading={isLoading}
        />
        <StatCard
          title="Categories"
          value={displayStats.totalCategories}
          subtext="Product groups"
          icon={GridViewIcon}
          isLoading={isLoading}
        />
      </div>

      {/* Charts - Render with skeleton while loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Events Breakdown */}
        <Card>
          <CardHeader className="p-5 md:p-6">
            <CardTitle className="text-lg md:text-xl">Events Status</CardTitle>
            <CardDescription className="text-sm md:text-base">Distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-6 pt-0 md:pt-0">
            {isLoading ? <ChartSkeleton /> : (
              <ChartContainer config={chartConfig} className="h-[220px] md:h-[280px]">
                <PieChart>
                  <Pie
                    data={eventsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ value }) => value}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {eventsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Users Breakdown */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Users Status</CardTitle>
            <CardDescription className="text-xs md:text-sm">Active vs inactive users</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {isLoading ? <ChartSkeleton /> : (
              <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px]">
                <PieChart>
                  <Pie
                    data={usersChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ value }) => value}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {usersChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Products Breakdown */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Products Status</CardTitle>
            <CardDescription className="text-xs md:text-sm">Active vs inactive products</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {isLoading ? <ChartSkeleton /> : (
              <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px]">
                <PieChart>
                  <Pie
                    data={productsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ value }) => value}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {productsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary Overview */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-sm md:text-lg">Overview Summary</CardTitle>
            <CardDescription className="text-[10px] md:text-sm">Total counts across all entities</CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-6 pt-0 md:pt-0">
            {isLoading ? <ChartSkeleton /> : (
              <ChartContainer config={chartConfig} className="h-[150px] md:h-[250px]">
                <BarChart data={summaryChartData} margin={{ top: 5, right: 10, left: 25, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} tickLine={true} axisLine={true} />
                  <YAxis fontSize={10} width={25} tickLine={true} axisLine={true} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[2, 2, 0, 0]} barSize={40} isAnimationActive={false}>
                    {summaryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
