'use client'

import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react'
import { PencilEdit01Icon, Refresh01Icon, BlockedIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { CatalogProductsTableProps, Product } from '@/lib/types'

export function ProductsTable({
  products,
  categories,
  canManage,
  openProductSheet,
  deactivateProduct,
  reactivateProduct,
}: CatalogProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Product>[]>(() => {
    const cols: ColumnDef<Product>[] = [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {row.index + 1}
          </span>
        ),
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <SortHeader column={column} label="Product" />,
        cell: ({ row }) => (
          <span className={cn('font-medium text-sm', !row.original.isActive && 'line-through opacity-60')}>
            {row.original.name}
          </span>
        ),
      },
      {
        id: 'category',
        header: ({ column }) => <SortHeader column={column} label="Category" />,
        accessorFn: (row) => categories.find(c => c.id === row.categoryId)?.name || '',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'defaultUnit',
        header: 'Unit',
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[11px] font-mono">
            {row.original.defaultUnit}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'price',
        header: ({ column }) => <SortHeader column={column} label="Price" className="justify-end" />,
        cell: ({ row }) => {
          const price = row.original.price
          return (
            <span className={cn('text-sm tabular-nums', price ? 'font-semibold' : 'text-muted-foreground')}>
              {price ? `₹${price.toLocaleString('en-IN')}` : '–'}
            </span>
          )
        },
        meta: { align: 'right' },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => row.isActive ? 'active' : 'inactive',
        cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} />,
        enableSorting: false,
      },
    ]

    if (canManage) {
      cols.push({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md" onClick={() => openProductSheet(row.original)}>
              <Icon icon={PencilEdit01Icon} size={14} />
            </Button>
            {row.original.isActive ? (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-md" onClick={() => deactivateProduct(row.original)}>
                <Icon icon={BlockedIcon} size={14} />
              </Button>
            ) : (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md" onClick={() => reactivateProduct(row.original)}>
                <Icon icon={Refresh01Icon} size={14} />
              </Button>
            )}
          </div>
        ),
        size: 72,
        enableSorting: false,
      })
    }

    return cols
  }, [canManage, categories, openProductSheet, deactivateProduct, reactivateProduct])

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden min-w-0 w-full">

      {/* Mobile card layout */}
      <div className="sm:hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-12 px-4">
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {products.map((product, index) => (
              <div key={product.id} className={cn('px-4 py-3', !product.isActive && 'opacity-60')}>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 tabular-nums">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium text-foreground truncate', !product.isActive && 'line-through')}>
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {categories.find(c => c.id === product.categoryId)?.name}
                      {' · '}{product.defaultUnit}
                      {product.price ? ` · ₹${product.price.toLocaleString('en-IN')}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={product.isActive ? 'active' : 'inactive'} />
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => openProductSheet(product)}>
                          <Icon icon={PencilEdit01Icon} size={14} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {product.isActive ? (
                          <DropdownMenuItem onClick={() => deactivateProduct(product)} className="text-destructive focus:text-destructive">
                            <Icon icon={BlockedIcon} size={14} className="mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => reactivateProduct(product)}>
                            <Icon icon={Refresh01Icon} size={14} className="mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent bg-muted/30">
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-muted-foreground text-xs font-medium h-10',
                      header.index === 0 && 'pl-5 w-10',
                      header.id === 'actions' && 'pr-5',
                      (header.column.columnDef.meta as any)?.align === 'right' && 'text-right',
                    )}
                    style={header.column.getSize() !== 150 ? { width: header.column.getSize() } : undefined}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className="border-border group/row transition-colors hover:bg-muted/40"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'py-2.5',
                        cell.column.id === 'index' && 'pl-5',
                        cell.column.id === 'actions' && 'pr-5',
                        (cell.column.columnDef.meta as any)?.align === 'right' && 'text-right',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32">
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <p className="text-sm">No products found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with count */}
      {products.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 sm:px-5 py-2.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''}
            {products.filter(p => !p.isActive).length > 0 && (
              <> · {products.filter(p => !p.isActive).length} inactive</>
            )}
          </span>
          {products.some(p => p.price) && (
            <span className="text-xs text-muted-foreground">
              {products.filter(p => p.price).length} priced
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function SortHeader({ column, label, className }: { column: any; label: string; className?: string }) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 -ml-3 px-2 text-xs font-medium text-muted-foreground hover:text-foreground', className)}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-1 w-3 h-3" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-1 w-3 h-3" />
      ) : (
        <ArrowUpDown className="ml-1 w-3 h-3 opacity-30" />
      )}
    </Button>
  )
}
