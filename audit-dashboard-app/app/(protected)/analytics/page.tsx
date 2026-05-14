'use client';

import { useEffect, useState } from 'react';
import { auditService } from '@/lib/audit-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { subDays, format } from 'date-fns';

type GroupBy = 'day' | 'week' | 'month';

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        const data = await auditService.getAuditTrends(
          {
            startDate,
            endDate,
          },
          groupBy
        );
        setTrends(data);
      } catch (error) {
        toast.error('Failed to fetch analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [startDate, endDate, groupBy]);

  const handleQuickRange = (days: number) => {
    const today = new Date();
    const startOfRange = subDays(today, days);
    setStartDate(format(startOfRange, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
  };

  const totalCreates = Array.isArray(trends) ? trends.reduce((sum, item) => sum + (item.creates || 0), 0) : 0;
  const totalUpdates = Array.isArray(trends) ? trends.reduce((sum, item) => sum + (item.updates || 0), 0) : 0;
  const totalDeletes = Array.isArray(trends) ? trends.reduce((sum, item) => sum + (item.deletes || 0), 0) : 0;
  const totalOperations = totalCreates + totalUpdates + totalDeletes;

  return (
    <div className="h-screen overflow-auto">
      <div className="p-4 sm:p-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">Audit activity trends and insights</p>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-8 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Group By</label>
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRange(7)}
                  className="flex-1"
                >
                  7d
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRange(30)}
                  className="flex-1"
                >
                  30d
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickRange(90)}
                  className="flex-1"
                >
                  90d
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOperations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Creates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalCreates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalUpdates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deletes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totalDeletes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {isLoading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </Card>
        ) : Array.isArray(trends) && trends.length > 0 ? (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient id="colorCreates" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDeletes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="creates"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorCreates)"
                        name="Creates"
                      />
                      <Area
                        type="monotone"
                        dataKey="updates"
                        stroke="#f59e0b"
                        fillOpacity={1}
                        fill="url(#colorUpdates)"
                        name="Updates"
                      />
                      <Area
                        type="monotone"
                        dataKey="deletes"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorDeletes)"
                        name="Deletes"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operations Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="creates" fill="#10b981" name="Creates" />
                      <Bar dataKey="updates" fill="#f59e0b" name="Updates" />
                      <Bar dataKey="deletes" fill="#ef4444" name="Deletes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="p-8">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No trend data available. The backend does not support the trends endpoint.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
