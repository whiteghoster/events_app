'use client'

import { Add01Icon, PencilEdit01Icon, Refresh01Icon, BlockedIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Category, Product } from '@/lib/types'

interface ProductsTableProps {
  selectedCategory: Category | undefined
  filteredProducts: Product[]
  canManage: boolean
  openProductSheet: (product?: Product) => void
  deactivateProduct: (product: Product) => void
  reactivateProduct: (product: Product) => void
}

export function ProductsTable({
  selectedCategory,
  filteredProducts,
  canManage,
  openProductSheet,
  deactivateProduct,
  reactivateProduct,
}: ProductsTableProps) {
  return (
    <div className="flex-1 min-w-0">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base">
            {selectedCategory?.name}
            <span className="text-muted-foreground font-normal ml-2">({filteredProducts.length})</span>
          </CardTitle>
          {canManage && (
            <Button size="sm" onClick={() => openProductSheet()}>
              <Icon icon={Add01Icon} size={16} className="mr-2" /> Add Product
            </Button>
          )}
        </CardHeader>

        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id} className={cn(!product.isActive && 'opacity-60')}>
                    <TableCell className={cn('font-medium', !product.isActive && 'line-through')}>{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.defaultUnit}</TableCell>
                    <TableCell className="text-muted-foreground">{product.price ? `₹${product.price}` : '-'}</TableCell>
                    <TableCell><StatusBadge status={product.isActive ? 'active' : 'inactive'} /></TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProductSheet(product)}>
                            <Icon icon={PencilEdit01Icon} size={16} />
                          </Button>
                          {product.isActive ? (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deactivateProduct(product)}>
                              <Icon icon={BlockedIcon} size={16} />
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => reactivateProduct(product)}>
                              <Icon icon={Refresh01Icon} size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No products in this category"
            description="Add your first product to get started"
            action={canManage ? (
              <Button onClick={() => openProductSheet()}>
                <Icon icon={Add01Icon} size={16} className="mr-2" /> Add Product
              </Button>
            ) : undefined}
          />
        )}
      </Card>
    </div>
  )
}
