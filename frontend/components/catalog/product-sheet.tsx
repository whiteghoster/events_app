'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { PRODUCT_UNITS } from '@/lib/types'
import type { Category, Product, ProductUnit, ProductFormData, ProductSheetProps } from '@/lib/types'

export function ProductSheet({
  open,
  onOpenChange,
  editingProduct,
  categories,
  productFormData,
  setProductFormData,
  isSaving,
  saveProduct,
}: ProductSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</SheetTitle>
          <SheetDescription>{editingProduct ? 'Update details.' : 'Fill in details to create.'}</SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label>Product Name *</Label>
            <Input value={productFormData.name} onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Roses" />
          </div>
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={productFormData.categoryId} onValueChange={(v) => setProductFormData(prev => ({ ...prev, categoryId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default Unit</Label>
            <Select value={productFormData.defaultUnit} onValueChange={(v) => setProductFormData(prev => ({ ...prev, defaultUnit: v as ProductUnit }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCT_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Price (indicative)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input type="number" value={productFormData.price} onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))} className="pl-7" placeholder="Optional" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={productFormData.isActive} onCheckedChange={(checked) => setProductFormData(prev => ({ ...prev, isActive: checked }))} />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={saveProduct} disabled={isSaving}>
            {isSaving && <Skeleton className="h-4 w-4 mr-2 rounded-full" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
