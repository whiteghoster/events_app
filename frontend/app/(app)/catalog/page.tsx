'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, MoreVertical, RotateCcw, Ban, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState, FlowerIcon } from '@/components/empty-state'
import { useAuth, canManageProducts, canViewCatalog } from '@/lib/auth-context'
import { categories as initialCategories, products as initialProducts, events, eventProducts } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Category, Product, ProductUnit } from '@/lib/types'

const units: ProductUnit[] = ['kg', 'g', 'pcs', 'bunch', 'dozen', 'box', 'bundle', 'set', 'roll', 'metre', 'litre', 'ml']

export default function CatalogPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '')
  
  const [productSheetOpen, setProductSheetOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [productToDeactivate, setProductToDeactivate] = useState<Product | null>(null)

  const [productFormData, setProductFormData] = useState({
    name: '',
    categoryId: '',
    defaultUnit: 'pcs' as ProductUnit,
    price: '',
    description: '',
    isActive: true,
  })

  if (!user || !canViewCatalog(user.role)) {
    router.replace('/events')
    return null
  }

  const canManage = canManageProducts(user.role)
  
  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.categoryId === selectedCategoryId)
  }, [products, selectedCategoryId])

  const activeProductCount = filteredProducts.filter(p => p.isActive).length

  // Check if product is in any live events
  const getProductLiveEventCount = (productId: string) => {
    const liveEventIds = events.filter(e => e.status === 'Live').map(e => e.id)
    return eventProducts.filter(ep => ep.productId === productId && liveEventIds.includes(ep.eventId)).length
  }

  const handleOpenProductSheet = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductFormData({
        name: product.name,
        categoryId: product.categoryId,
        defaultUnit: product.defaultUnit,
        price: product.price?.toString() || '',
        description: product.description || '',
        isActive: product.isActive,
      })
    } else {
      setEditingProduct(null)
      setProductFormData({
        name: '',
        categoryId: selectedCategoryId,
        defaultUnit: 'pcs',
        price: '',
        description: '',
        isActive: true,
      })
    }
    setProductSheetOpen(true)
  }

  const handleSaveProduct = () => {
    if (!productFormData.name.trim()) {
      toast.error('Product name is required')
      return
    }

    if (editingProduct) {
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: productFormData.name,
              categoryId: productFormData.categoryId,
              categoryName: categories.find(c => c.id === productFormData.categoryId)?.name || p.categoryName,
              defaultUnit: productFormData.defaultUnit,
              price: productFormData.price ? parseFloat(productFormData.price) : undefined,
              description: productFormData.description || undefined,
              isActive: productFormData.isActive,
            }
          : p
      ))
      toast.success('Product updated')
    } else {
      const newProduct: Product = {
        id: `new-${Date.now()}`,
        name: productFormData.name,
        categoryId: productFormData.categoryId,
        categoryName: categories.find(c => c.id === productFormData.categoryId)?.name || '',
        defaultUnit: productFormData.defaultUnit,
        price: productFormData.price ? parseFloat(productFormData.price) : undefined,
        description: productFormData.description || undefined,
        isActive: productFormData.isActive,
      }
      setProducts(prev => [...prev, newProduct])
      toast.success('Product created')
    }
    setProductSheetOpen(false)
  }

  const handleDeactivateProduct = (product: Product) => {
    const liveCount = getProductLiveEventCount(product.id)
    if (liveCount > 0) {
      setProductToDeactivate(product)
      setDeactivateDialogOpen(true)
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: false } : p))
      toast.success('Product deactivated')
    }
  }

  const confirmDeactivate = () => {
    if (productToDeactivate) {
      setProducts(prev => prev.map(p => p.id === productToDeactivate.id ? { ...p, isActive: false } : p))
      toast.success('Product deactivated')
    }
    setDeactivateDialogOpen(false)
    setProductToDeactivate(null)
  }

  const handleReactivateProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: true } : p))
    toast.success('Product reactivated')
  }

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setNewCategoryName(category.name)
    } else {
      setEditingCategory(null)
      setNewCategoryName('')
    }
    setCategoryDialogOpen(true)
  }

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    if (editingCategory) {
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id ? { ...c, name: newCategoryName } : c
      ))
      setProducts(prev => prev.map(p => 
        p.categoryId === editingCategory.id ? { ...p, categoryName: newCategoryName } : p
      ))
      toast.success('Category updated')
    } else {
      const newCategory: Category = {
        id: `new-${Date.now()}`,
        name: newCategoryName,
        productCount: 0,
        isActive: true,
      }
      setCategories(prev => [...prev, newCategory])
      toast.success('Category created')
    }
    setCategoryDialogOpen(false)
  }

  const handleDeleteCategory = (category: Category) => {
    const productCount = products.filter(p => p.categoryId === category.id && p.isActive).length
    if (productCount > 0) {
      toast.error(`Cannot delete - ${productCount} active products in this category`)
      return
    }
    setCategories(prev => prev.filter(c => c.id !== category.id))
    if (selectedCategoryId === category.id) {
      setSelectedCategoryId(categories[0]?.id || '')
    }
    toast.success('Category deleted')
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader title="Product Catalog" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories Panel */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <h2 className="text-label">Categories</h2>
              {canManage && (
                <Button size="sm" variant="ghost" onClick={() => handleOpenCategoryDialog()}>
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="p-2">
              {categories.map(category => {
                const productCount = products.filter(p => p.categoryId === category.id).length
                const hasActiveProducts = products.some(p => p.categoryId === category.id && p.isActive)
                const isSelected = category.id === selectedCategoryId
                
                return (
                  <div
                    key={category.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group',
                      isSelected 
                        ? 'bg-sidebar-accent border-l-2 border-l-primary' 
                        : 'hover:bg-secondary'
                    )}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'font-medium text-sm',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}>
                        {category.name}
                      </span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {productCount}
                      </span>
                      {hasActiveProducts && (
                        <span className="w-2 h-2 rounded-full bg-success" />
                      )}
                    </div>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenCategoryDialog(category)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit name
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Products Panel */}
        <div className="flex-1">
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <h2 className="font-medium text-foreground">
                {selectedCategory?.name} <span className="text-muted-foreground font-normal">({filteredProducts.length} products)</span>
              </h2>
              {canManage && (
                <Button size="sm" onClick={() => handleOpenProductSheet()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Product Name</TableHead>
                    <TableHead className="text-muted-foreground">Default Unit</TableHead>
                    <TableHead className="text-muted-foreground">Price</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    {canManage && <TableHead className="text-muted-foreground w-24">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => (
                    <TableRow 
                      key={product.id} 
                      className={cn('border-border', !product.isActive && 'opacity-60')}
                    >
                      <TableCell className={cn('font-medium', !product.isActive && 'line-through')}>
                        {product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.defaultUnit}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.price ? `₹${product.price}` : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={product.isActive ? 'Active' : 'Inactive'} />
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenProductSheet(product)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {product.isActive ? (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeactivateProduct(product)}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-success"
                                onClick={() => handleReactivateProduct(product)}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<FlowerIcon className="w-12 h-12" />}
                title="No products in this category"
                description="Add your first product to get started"
                action={
                  canManage && (
                    <Button onClick={() => handleOpenProductSheet()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  )
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Product Slide-Over */}
      <Sheet open={productSheetOpen} onOpenChange={setProductSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</SheetTitle>
            <SheetDescription>
              {editingProduct ? 'Update the product details below.' : 'Fill in the details to create a new product.'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-label">Product Name <span className="text-primary">*</span></Label>
              <Input
                value={productFormData.name}
                onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Roses"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-label">Category <span className="text-primary">*</span></Label>
              <Select 
                value={productFormData.categoryId} 
                onValueChange={(v) => setProductFormData(prev => ({ ...prev, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-label">Default Unit</Label>
              <Select 
                value={productFormData.defaultUnit} 
                onValueChange={(v) => setProductFormData(prev => ({ ...prev, defaultUnit: v as ProductUnit }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-label">Price (indicative)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  type="number"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="pl-8"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-label">Description</Label>
              <Textarea
                value={productFormData.description}
                onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-label">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {productFormData.isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={productFormData.isActive}
                  onCheckedChange={(checked) => setProductFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setProductSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the category name.' : 'Create a new product category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-label">Category Name <span className="text-primary">*</span></Label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Gift Hampers"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Warning Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deactivate Product</DialogTitle>
            <DialogDescription>
              This product is in {getProductLiveEventCount(productToDeactivate?.id || '')} live events. Deactivate anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeactivate}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
