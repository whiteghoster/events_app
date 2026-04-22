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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6">
        <SheetHeader className="pb-2">
          <SheetTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</SheetTitle>
          <SheetDescription>{editingProduct ? 'Update product details.' : 'Fill in details to create a new product.'}</SheetDescription>
        </SheetHeader>
        <div className="py-5 space-y-5">
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <Label className="text-sm">Active</Label>
              <p className="text-xs text-muted-foreground">Product available for events</p>
            </div>
            <Switch checked={productFormData.isActive} onCheckedChange={(checked) => setProductFormData(prev => ({ ...prev, isActive: checked }))} />
          </div>
        </div>
        <SheetFooter className="pt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">Cancel</Button>
          <Button onClick={saveProduct} disabled={isSaving} className="flex-1 sm:flex-none">
            {isSaving && <Skeleton className="h-4 w-4 mr-2 rounded-full" />}
            {editingProduct ? 'Save Changes' : 'Create Product'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
