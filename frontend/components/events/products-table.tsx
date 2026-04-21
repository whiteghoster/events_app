'use client'

import { Add01Icon, PencilEdit01Icon, Delete01Icon, Tick01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { EventProduct, Category, Product } from '@/lib/types'

interface ProductsTableProps {
  eventProductsList: EventProduct[]
  allCategories: Category[]
  allProducts: Product[]
  filteredProducts: Product[]
  units: string[]
  isEditable: boolean
  canEdit: boolean
  quantityOnly: boolean
  canEditQty: boolean
  editingRow: string | null
  editingData: Partial<EventProduct>
  setEditingData: React.Dispatch<React.SetStateAction<Partial<EventProduct>>>
  addingNew: boolean
  setAddingNew: (adding: boolean) => void
  newProductData: { categoryId: string; productId: string; quantity: string; unit: string; price: string }
  setNewProductData: React.Dispatch<React.SetStateAction<{ categoryId: string; productId: string; quantity: string; unit: string; price: string }>>
  handleStartEdit: (product: EventProduct) => void
  handleSaveEdit: (quantityOnly: boolean) => void
  handleCancelEdit: () => void
  handleDeleteProduct: (rowId: string) => void
  handleAddProduct: () => void
  resetNewProduct: () => void
}

export function ProductsTable({
  eventProductsList,
  allCategories,
  allProducts,
  filteredProducts,
  units,
  isEditable,
  canEdit,
  quantityOnly,
  canEditQty,
  editingRow,
  editingData,
  setEditingData,
  addingNew,
  setAddingNew,
  newProductData,
  setNewProductData,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  handleDeleteProduct,
  handleAddProduct,
  resetNewProduct,
}: ProductsTableProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-base">Products</CardTitle>
        {canEdit && isEditable && (
          <Button size="sm" onClick={() => setAddingNew(true)}>
            <Icon icon={Add01Icon} size={16} className="mr-2" />
            Add Product
          </Button>
        )}
      </CardHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
              {!quantityOnly && <TableHead>Price</TableHead>}
              {canEditQty && isEditable && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventProductsList.map((product, index) => (
              <TableRow key={product.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  {editingRow === product.id && !quantityOnly ? (
                    <Select value={editingData.categoryId} onValueChange={(v) => setEditingData(prev => ({ ...prev, categoryId: v, productId: '' }))}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allCategories.filter(c => c.isActive).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : product.categoryName}
                </TableCell>
                <TableCell className="font-medium">
                  {editingRow === product.id && !quantityOnly ? (
                    <Select value={editingData.productId} onValueChange={(v) => {
                      const prod = allProducts.find(p => p.id === v)
                      setEditingData(prev => ({ ...prev, productId: v, unit: prod?.defaultUnit || prev.unit }))
                    }}>
                      <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allProducts.filter(p => p.categoryId === editingData.categoryId && p.isActive).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : product.productName}
                </TableCell>
                <TableCell>
                  {editingRow === product.id ? (
                    <Input type="number" min="1" value={editingData.quantity || ''} onChange={(e) => setEditingData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} className="w-20 h-8" />
                  ) : product.quantity}
                </TableCell>
                <TableCell>
                  {editingRow === product.id && !quantityOnly ? (
                    <Select value={editingData.unit} onValueChange={(v) => setEditingData(prev => ({ ...prev, unit: v }))}>
                      <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : product.unit}
                </TableCell>
                {!quantityOnly && (
                  <TableCell className="text-muted-foreground">
                    {editingRow === product.id && !quantityOnly ? (
                      <Input type="number" value={editingData.price || ''} onChange={(e) => setEditingData(prev => ({ ...prev, price: parseFloat(e.target.value) || undefined }))} className="w-24 h-8" placeholder="₹" />
                    ) : product.price ? `₹${product.price}` : '-'}
                  </TableCell>
                )}
                {canEditQty && isEditable && (
                  <TableCell>
                    {editingRow === product.id ? (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(!!quantityOnly)} className="h-8 w-8"><Icon icon={Tick01Icon} size={16} /></Button>
                        <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8"><Icon icon={Cancel01Icon} size={16} /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleStartEdit(product)} className="h-8 w-8"><Icon icon={PencilEdit01Icon} size={16} /></Button>
                        {canEdit && <Button size="icon" variant="ghost" onClick={() => handleDeleteProduct(product.id)} className="h-8 w-8 text-destructive"><Icon icon={Delete01Icon} size={16} /></Button>}
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}

            {addingNew && (
              <TableRow>
                <TableCell className="text-muted-foreground">-</TableCell>
                <TableCell>
                  <Select value={newProductData.categoryId} onValueChange={(v) => setNewProductData(prev => ({ ...prev, categoryId: v, productId: '' }))}>
                    <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {allCategories.filter(c => c.isActive).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={newProductData.productId} onValueChange={(v) => {
                    const prod = allProducts.find(p => p.id === v)
                    setNewProductData(prev => ({ ...prev, productId: v, unit: prod?.defaultUnit || '' }))
                  }}>
                    <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Product" /></SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input type="number" min="1" value={newProductData.quantity} onChange={(e) => setNewProductData(prev => ({ ...prev, quantity: e.target.value }))} className="w-20 h-8" placeholder="Qty" />
                </TableCell>
                <TableCell>
                  <Select value={newProductData.unit} onValueChange={(v) => setNewProductData(prev => ({ ...prev, unit: v }))}>
                    <SelectTrigger className="w-24 h-8"><SelectValue placeholder="Unit" /></SelectTrigger>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input type="number" value={newProductData.price} onChange={(e) => setNewProductData(prev => ({ ...prev, price: e.target.value }))} className="w-24 h-8" placeholder="₹" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={handleAddProduct} className="h-8 w-8"><Icon icon={Tick01Icon} size={16} /></Button>
                    <Button size="icon" variant="ghost" onClick={resetNewProduct} className="h-8 w-8"><Icon icon={Cancel01Icon} size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {eventProductsList.length === 0 && !addingNew && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products assigned yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {eventProductsList.length > 0 && (() => {
        const grandTotal = eventProductsList.reduce((sum, p) => sum + (p.price || 0), 0)
        return (
          <div className="border-t px-4 py-3 flex items-center justify-end">
            <span className="text-sm font-medium">
              Total: <span className="text-base font-semibold">₹{grandTotal.toLocaleString('en-IN')}</span>
            </span>
          </div>
        )
      })()}
    </Card>
  )
}
