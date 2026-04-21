'use client'

import { Add01Icon, PencilEdit01Icon, MoreVerticalIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Category, Product } from '@/lib/types'

interface CategoriesSidebarProps {
  categories: Category[]
  products: Product[]
  selectedCategoryId: string
  setSelectedCategoryId: (id: string) => void
  canManage: boolean
  openCategoryDialog: (category?: Category) => void
  deleteCategory: (category: Category) => void
}

export function CategoriesSidebar({
  categories,
  products,
  selectedCategoryId,
  setSelectedCategoryId,
  canManage,
  openCategoryDialog,
  deleteCategory,
}: CategoriesSidebarProps) {
  return (
    <div className="w-full lg:w-64 shrink-0">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm">Categories</CardTitle>
          {canManage && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openCategoryDialog()}>
              <Icon icon={Add01Icon} size={16} />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-2">
          {categories.length > 0 ? (
            categories.map(category => {
              const productCount = products.filter(p => p.categoryId === category.id).length
              const isSelected = category.id === selectedCategoryId
              return (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors group',
                    isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                  )}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm', isSelected && 'font-medium')}>{category.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{productCount}</span>
                  </div>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                          <Icon icon={MoreVerticalIcon} size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openCategoryDialog(category)}>
                          <Icon icon={PencilEdit01Icon} size={16} className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteCategory(category)}>
                          <Icon icon={Cancel01Icon} size={16} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <p className="mb-3">No categories yet.</p>
              {canManage && (
                <Button size="sm" variant="outline" onClick={() => openCategoryDialog()}>
                  <Icon icon={Add01Icon} size={12} className="mr-1" /> Add Category
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
