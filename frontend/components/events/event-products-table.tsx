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
import { Pencil, Trash2, Check, X, Plus, Package, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { EventProduct, Category, Product } from '@/lib/types'

interface EventProductsTableProps {
  products: EventProduct[]
  canEdit: boolean
  canEditQuantity: boolean
  quantityOnly: boolean
  isEditable: boolean
  allCategories: Category[]
  allProducts: Product[]
  filteredProducts: Product[]
  units: string[]
  editingRow: string | null
  editingData: Partial<EventProduct>
  setEditingData: (fn: (prev: Partial<EventProduct>) => Partial<EventProduct>) => void
  addingNew: boolean
  setAddingNew: (v: boolean) => void
  newProductData: { categoryId: string; productId: string; quantity: string; unit: string; price: string }
  setNewProductData: (fn: (prev: any) => any) => void
  onStartEdit: (product: EventProduct) => void
  onSaveEdit: (quantityOnly: boolean) => void
  onCancelEdit: () => void
  onDeleteProduct: (id: string) => void
  onAddProduct: () => void
  onResetNewProduct: () => void
}

const QUANTITY_OPTIONS = Array.from({ length: 100 }, (_, index) => String(index + 1))

export function EventProductsTable({
  products, canEdit, canEditQuantity, quantityOnly, isEditable,
  allCategories, allProducts, filteredProducts, units,
  editingRow, editingData, setEditingData,
  addingNew, setAddingNew, newProductData, setNewProductData,
  onStartEdit, onSaveEdit, onCancelEdit, onDeleteProduct, onAddProduct, onResetNewProduct,
}: EventProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [mobileActionProduct, setMobileActionProduct] = useState<EventProduct | null>(null)
  const [mobileActionOpen, setMobileActionOpen] = useState(false)

  const pricedItems = products.filter(p => p.price && p.price > 0)
  const grandTotal = products.reduce((sum, p) => sum + (p.price || 0), 0)

  const columns = useMemo<ColumnDef<EventProduct>[]>(() => {
    const cols: ColumnDef<EventProduct>[] = [
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
        accessorKey: 'categoryName',
        header: ({ column }) => <SortHeader column={column} label="Category" />,
        cell: ({ row }) => {
          if (editingRow === row.original.id && !quantityOnly) {
            return (
              <Select value={editingData.categoryId} onValueChange={(v) => setEditingData(prev => ({ ...prev, categoryId: v, productId: '' }))}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCategories.filter(c => c.isActive).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
          return <span className="text-xs text-muted-foreground">{row.original.categoryName}</span>
        },
      },
      {
        accessorKey: 'productName',
        header: ({ column }) => <SortHeader column={column} label="Product" />,
        cell: ({ row }) => {
          if (editingRow === row.original.id && !quantityOnly) {
            return (
              <Select value={editingData.productId} onValueChange={(v) => {
                const prod = allProducts.find(p => p.id === v)
                setEditingData(prev => ({ ...prev, productId: v, unit: prod?.defaultUnit || prev.unit }))
              }}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allProducts.filter(p => p.categoryId === editingData.categoryId && p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
          return <span className="font-medium text-sm text-foreground">{row.original.productName}</span>
        },
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => <SortHeader column={column} label="Qty" className="justify-end" />,
        cell: ({ row }) => {
          if (editingRow === row.original.id) {
            return (
              <Select
                value={editingData.quantity ? String(editingData.quantity) : ''}
                onValueChange={(value) => setEditingData(prev => ({ ...prev, quantity: parseInt(value, 10) }))}
              >
                <SelectTrigger className="w-16 h-8 text-xs justify-end">
                  <SelectValue placeholder="Qty" />
                </SelectTrigger>
                <SelectContent>
                  {QUANTITY_OPTIONS.map(quantity => (
                    <SelectItem key={quantity} value={quantity}>
                      {quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
          return <span className="text-sm font-semibold tabular-nums">{row.original.quantity}</span>
        },
        meta: { align: 'right' },
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        cell: ({ row }) => {
          if (editingRow === row.original.id && !quantityOnly) {
            return (
              <Select value={editingData.unit} onValueChange={(v) => setEditingData(prev => ({ ...prev, unit: v }))}>
                <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            )
          }
          return <span className="text-xs text-muted-foreground">{row.original.unit}</span>
        },
        enableSorting: false,
      },
    ]

    if (!quantityOnly) {
      cols.push({
        accessorKey: 'price',
        header: ({ column }) => <SortHeader column={column} label="Price" className="justify-end" />,
        cell: ({ row }) => {
          if (editingRow === row.original.id) {
            return (
              <Input type="number" value={editingData.price || ''} onChange={(e) => setEditingData(prev => ({ ...prev, price: parseFloat(e.target.value) || undefined }))} className="w-20 h-8 text-xs text-right ml-auto" placeholder="₹" />
            )
          }
          const price = row.original.price
          return (
            <span className={cn('text-sm tabular-nums', price ? 'font-semibold' : 'text-muted-foreground')}>
              {price ? `₹${price.toLocaleString('en-IN')}` : '–'}
            </span>
          )
        },
        meta: { align: 'right' },
      })
    }

    cols.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (editingRow === row.original.id) {
          return (
            <div className="flex items-center justify-end gap-1">
              <Button size="icon" variant="ghost" onClick={() => onSaveEdit(!!quantityOnly)} className="h-7 w-7 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-md">
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onCancelEdit} className="h-7 w-7 text-muted-foreground rounded-md">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )
        }
        if (canEditQuantity && isEditable) {
          return (
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" onClick={() => onStartEdit(row.original)} className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md">
                <Pencil className="w-3 h-3" />
              </Button>
              {canEdit && (
                <Button size="icon" variant="ghost" onClick={() => onDeleteProduct(row.original.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-md">
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )
        }
        return (
          <div className="flex items-center justify-end">
            <span className="text-[10px] text-muted-foreground opacity-0 group-hover/row:opacity-100">
              {!canEditQuantity ? 'Login required' : 'Locked'}
            </span>
          </div>
        )
      },
      size: 80,
      enableSorting: false,
    })

    return cols
  }, [editingRow, editingData, quantityOnly, canEdit, canEditQuantity, isEditable, allCategories, allProducts, units, setEditingData, onStartEdit, onSaveEdit, onCancelEdit, onDeleteProduct])

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
    <div className="bg-card rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm sm:text-base text-foreground">Products</h2>
          <Badge variant="secondary" className="text-[11px] font-mono px-1.5">
            {products.length}
          </Badge>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  size="sm"
                  onClick={() => setAddingNew(true)}
                  disabled={!canEdit || !isEditable}
                  className="hidden sm:flex"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Product
                </Button>
                <Button
                  size="icon"
                  onClick={() => setAddingNew(true)}
                  disabled={!canEdit || !isEditable}
                  className="sm:hidden h-8 w-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {!canEdit ? 'Login required' : !isEditable ? 'Event is finished - locked' : 'Add a product to this event'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ─── Mobile card layout ───────────────────────────────── */}
      <div className="sm:hidden">
        {products.length === 0 && !addingNew && (
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-12 px-4">
            <div className="p-3 rounded-full bg-muted/50">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm">No products assigned yet</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingNew(true)}
                      disabled={!canEdit || !isEditable}
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add first product
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {!canEdit ? 'Login required' : !isEditable ? 'Event is finished - locked' : 'Add a product to this event'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <div className="divide-y divide-border">
          {products.map((product, index) => (
            <div key={product.id} className={cn('px-4 py-3', editingRow === product.id && 'bg-primary/5')}>
              {editingRow === product.id ? (
                /* Mobile edit mode */
                <div className="space-y-3">
                  {!quantityOnly && (
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={editingData.categoryId} onValueChange={(v) => setEditingData(prev => ({ ...prev, categoryId: v, productId: '' }))}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>{allCategories.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={editingData.productId} onValueChange={(v) => {
                        const prod = allProducts.find(p => p.id === v)
                        setEditingData(prev => ({ ...prev, productId: v, unit: prod?.defaultUnit || prev.unit }))
                      }}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Product" /></SelectTrigger>
                        <SelectContent>{allProducts.filter(p => p.categoryId === editingData.categoryId && p.isActive).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Select
                      value={editingData.quantity ? String(editingData.quantity) : ''}
                      onValueChange={(value) => setEditingData(prev => ({ ...prev, quantity: parseInt(value, 10) }))}
                    >
                      <SelectTrigger className="h-9 text-xs flex-1">
                        <SelectValue placeholder="Qty" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUANTITY_OPTIONS.map(quantity => (
                          <SelectItem key={quantity} value={quantity}>
                            {quantity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!quantityOnly && (
                      <Select value={editingData.unit} onValueChange={(v) => setEditingData(prev => ({ ...prev, unit: v }))}>
                        <SelectTrigger className="h-9 text-xs w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                    {!quantityOnly && (
                      <Input type="number" value={editingData.price || ''} onChange={(e) => setEditingData(prev => ({ ...prev, price: parseFloat(e.target.value) || undefined }))} className="h-9 text-xs flex-1" placeholder="₹ Price" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onSaveEdit(!!quantityOnly)} className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Check className="w-3.5 h-3.5 mr-1" />Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={onCancelEdit} className="flex-1 h-8 text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* Mobile read mode */
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 tabular-nums">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{product.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.categoryName} · {product.quantity} {product.unit}
                      {product.price ? ` · ₹${product.price.toLocaleString('en-IN')}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                    onClick={() => {
                      setMobileActionProduct(product)
                      setMobileActionOpen(true)
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile add new */}
        {addingNew && (
          <div className="px-4 py-3 border-t border-border bg-primary/5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={newProductData.categoryId} onValueChange={(v) => setNewProductData((prev: any) => ({ ...prev, categoryId: v, productId: '' }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{allCategories.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={newProductData.productId} onValueChange={(v) => {
                const prod = allProducts.find(p => p.id === v)
                setNewProductData((prev: any) => ({ ...prev, productId: v, unit: prod?.defaultUnit || '' }))
              }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Product" /></SelectTrigger>
                <SelectContent>{filteredProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={newProductData.quantity}
                onValueChange={(value) => setNewProductData((prev: any) => ({ ...prev, quantity: value }))}
              >
                <SelectTrigger className="h-9 text-xs flex-1">
                  <SelectValue placeholder="Qty" />
                </SelectTrigger>
                <SelectContent>
                  {QUANTITY_OPTIONS.map(quantity => (
                    <SelectItem key={quantity} value={quantity}>
                      {quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newProductData.unit} onValueChange={(v) => setNewProductData((prev: any) => ({ ...prev, unit: v }))}>
                <SelectTrigger className="h-9 text-xs w-24"><SelectValue placeholder="Unit" /></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
              {!quantityOnly && (
                <Input type="number" value={newProductData.price} onChange={(e) => setNewProductData((prev: any) => ({ ...prev, price: e.target.value }))} className="h-9 text-xs flex-1" placeholder="₹ Price" />
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onAddProduct} className="flex-1 h-8 text-xs">
                <Check className="w-3.5 h-3.5 mr-1" />Add
              </Button>
              <Button size="sm" variant="outline" onClick={onResetNewProduct} className="flex-1 h-8 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Desktop table layout ─────────────────────────────── */}
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
            {table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                className={cn(
                  'border-border group/row transition-colors',
                  editingRow === row.original.id ? 'bg-primary/5' : 'hover:bg-muted/40'
                )}
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
            ))}

            {/* Desktop add new row */}
            {addingNew && (
              <TableRow className="border-border bg-primary/5">
                <TableCell className="text-muted-foreground text-xs pl-5 font-mono">–</TableCell>
                <TableCell>
                  <Select value={newProductData.categoryId} onValueChange={(v) => setNewProductData((prev: any) => ({ ...prev, categoryId: v, productId: '' }))}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>{allCategories.filter(c => c.isActive).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={newProductData.productId} onValueChange={(v) => {
                    const prod = allProducts.find(p => p.id === v)
                    setNewProductData((prev: any) => ({ ...prev, productId: v, unit: prod?.defaultUnit || '' }))
                  }}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Product" /></SelectTrigger>
                    <SelectContent>{filteredProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Select
                    value={newProductData.quantity}
                    onValueChange={(value) => setNewProductData((prev: any) => ({ ...prev, quantity: value }))}
                  >
                    <SelectTrigger className="w-16 h-8 text-xs justify-end ml-auto">
                      <SelectValue placeholder="Qty" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUANTITY_OPTIONS.map(quantity => (
                        <SelectItem key={quantity} value={quantity}>
                          {quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={newProductData.unit} onValueChange={(v) => setNewProductData((prev: any) => ({ ...prev, unit: v }))}>
                    <SelectTrigger className="w-20 h-8 text-xs"><SelectValue placeholder="Unit" /></SelectTrigger>
                    <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                {!quantityOnly && (
                  <TableCell className="text-right">
                    <Input type="number" value={newProductData.price} onChange={(e) => setNewProductData((prev: any) => ({ ...prev, price: e.target.value }))} className="w-20 h-8 text-xs text-right ml-auto" placeholder="₹" />
                  </TableCell>
                )}
                <TableCell className="pr-5">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={onAddProduct} className="h-7 w-7 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-md">
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onResetNewProduct} className="h-7 w-7 text-muted-foreground rounded-md">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Desktop empty state */}
            {products.length === 0 && !addingNew && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32">
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <div className="p-3 rounded-full bg-muted/50"><Package className="w-6 h-6" /></div>
                    <p className="text-sm">No products assigned yet</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddingNew(true)}
                              disabled={!canEdit || !isEditable}
                            >
                              <Plus className="w-4 h-4 mr-1.5" />Add first product
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {!canEdit ? 'Login required' : !isEditable ? 'Event is finished - locked' : 'Add a product to this event'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with totals */}
      {products.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="hidden sm:flex flex-wrap gap-x-4 gap-y-1 min-w-0">
            {pricedItems.map(p => (
              <span key={p.id} className="text-xs text-muted-foreground">
                {p.productName}: {p.quantity} {p.unit} = <span className="text-foreground font-medium">₹{p.price!.toLocaleString('en-IN')}</span>
              </span>
            ))}
            {pricedItems.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No prices assigned</span>
            )}
          </div>
          <span className="sm:hidden text-xs text-muted-foreground">
            {products.length} item{products.length !== 1 ? 's' : ''}
          </span>
          <div className="text-right shrink-0">
            <span className="text-xs text-muted-foreground mr-1.5">Total</span>
            <span className="text-base sm:text-lg font-bold text-primary tabular-nums">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Mobile Product Actions Dialog */}
      <Dialog open={mobileActionOpen} onOpenChange={setMobileActionOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Product Actions</DialogTitle>
            <DialogDescription>
              {mobileActionProduct?.productName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            {canEditQuantity && isEditable ? (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => {
                    if (mobileActionProduct) {
                      onStartEdit(mobileActionProduct)
                      setMobileActionOpen(false)
                    }
                  }}
                >
                  <Pencil className="w-5 h-5 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">Edit Product</p>
                    <p className="text-xs text-muted-foreground">Change quantity, unit, or price</p>
                  </div>
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (mobileActionProduct) {
                        onDeleteProduct(mobileActionProduct.id)
                        setMobileActionOpen(false)
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Delete Product</p>
                      <p className="text-xs text-muted-foreground">Remove from this event</p>
                    </div>
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {!canEditQuantity ? 'Please log in to edit products' : 'Event is finished and locked'}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={() => setMobileActionOpen(false)} className="w-full">
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── Sortable header helper ──────────────────────────────────── */
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
