'use client'

import { useState, useEffect } from 'react'
import { dashboardApi } from '@/lib/api'

export interface DashboardStats {
  totalEvents: number
  totalUsers: number
  totalProducts: number
  totalCategories: number
  activeEvents: number
  holdEvents: number
  finishedEvents: number
  activeUsers: number
  inactiveUsers: number
  activeProducts: number
  inactiveProducts: number
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        const data = await dashboardApi.getStats()
        setStats(data)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard stats')
        setStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, isLoading, error }
}
