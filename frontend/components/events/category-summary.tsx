'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface CategorySummaryProps {
  categorySummary: any[]
  totalRows: number
}

export function CategorySummary({ categorySummary, totalRows }: CategorySummaryProps) {
  if (categorySummary.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader className="py-4">
        <CardTitle className="text-base">Category Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categorySummary.map((item: any, idx: number) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
            <span className="font-medium sm:w-32">{item.category}</span>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {item.totals.map((t: any, tidx: number) => (
                <span key={tidx} className="text-muted-foreground">{t.quantity} {t.unit}</span>
              ))}
            </div>
          </div>
        ))}
        <Separator />
        <p className="text-sm text-muted-foreground">
          {categorySummary.length} categories, {totalRows} rows
        </p>
      </CardContent>
    </Card>
  )
}
