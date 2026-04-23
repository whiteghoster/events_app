'use client'

import { useAuth } from '@/lib/auth-context'
import { useDashboard } from '@/hooks/use-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Loader2, Calendar, Users, Package, Grid3X3 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
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

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats, isLoading, error } = useDashboard()

  // Prepare chart data
  const eventsChartData = stats ? [
    { name: 'Live', value: stats.activeEvents, color: COLORS.success },
    { name: 'Hold', value: stats.holdEvents, color: COLORS.warning },
    { name: 'Finished', value: stats.finishedEvents, color: COLORS.primary },
  ] : []

  const usersChartData = stats ? [
    { name: 'Active', value: stats.activeUsers, color: COLORS.success },
    { name: 'Inactive', value: stats.inactiveUsers, color: COLORS.destructive },
  ] : []

  const productsChartData = stats ? [
    { name: 'Active', value: stats.activeProducts, color: COLORS.blue },
    { name: 'Inactive', value: stats.inactiveProducts, color: COLORS.muted },
  ] : []

  const summaryChartData = stats ? [
    { name: 'Events', value: stats.totalEvents, color: COLORS.primary },
    { name: 'Users', value: stats.totalUsers, color: COLORS.blue },
    { name: 'Products', value: stats.totalProducts, color: COLORS.purple },
    { name: 'Categories', value: stats.totalCategories, color: COLORS.orange },
  ] : []

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    )
  }

  if (error || !stats) {
    return (
      <PageTransition>
        <PageHeader title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]} />
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error || 'Failed to load dashboard'}</p>
        </div>
      </PageTransition>
    )
  }

  const chartConfig: ChartConfig = {
    events: { label: 'Events', color: COLORS.primary },
    users: { label: 'Users', color: COLORS.blue },
    products: { label: 'Products', color: COLORS.purple },
    categories: { label: 'Categories', color: COLORS.orange },
  }

  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        description="Overview of your EventOS system"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">Events</CardTitle>
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {stats.activeEvents} live, {stats.holdEvents} hold
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">Users</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {stats.activeUsers} active, {stats.inactiveUsers} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">Products</CardTitle>
            <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {stats.activeProducts} active, {stats.inactiveProducts} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">Categories</CardTitle>
            <Grid3X3 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              Product groups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Events Breakdown */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Events Status</CardTitle>
            <CardDescription className="text-xs md:text-sm">Distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px]">
              <PieChart>
                <Pie
                  data={eventsChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => window?.innerWidth < 640 ? `${value}` : `${name}: ${value}`}
                  outerRadius={window?.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Users Breakdown */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Users Status</CardTitle>
            <CardDescription className="text-xs md:text-sm">Active vs inactive users</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px]">
              <PieChart>
                <Pie
                  data={usersChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => window?.innerWidth < 640 ? `${value}` : `${name}: ${value}`}
                  outerRadius={window?.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {usersChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Products Breakdown */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Products Status</CardTitle>
            <CardDescription className="text-xs md:text-sm">Active vs inactive products</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px]">
              <PieChart>
                <Pie
                  data={productsChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => window?.innerWidth < 640 ? `${value}` : `${name}: ${value}`}
                  outerRadius={window?.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Summary Overview */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-sm md:text-lg">Overview Summary</CardTitle>
            <CardDescription className="text-[10px] md:text-sm">Total counts across all entities</CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-6 pt-0 md:pt-0">
            <ChartContainer config={chartConfig} className="h-[150px] md:h-[250px]">
              <BarChart data={summaryChartData} margin={{ top: 5, right: 10, left: 25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} tickLine={true} axisLine={true} />
                <YAxis fontSize={10} width={25} tickLine={true} axisLine={true} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill={COLORS.primary} radius={[2, 2, 0, 0]} barSize={window?.innerWidth < 640 ? 30 : 40}>
                  {summaryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
