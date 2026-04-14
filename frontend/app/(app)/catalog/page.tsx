'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, MoreVertical, RotateCcw, Ban, X, Loader2, Database } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState, FlowerIcon } from '@/components/empty-state'
import { useAuth, canManageProducts, canViewCatalog } from '@/lib/auth-context'
import { catalogApi, eventsApi } from '@/lib/api'
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
  
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsPageLoading(true)
    else setIsRefreshing(true)

    try {
      const [catData, prodData] = await Promise.all([
        catalogApi.getCategories(),
        catalogApi.getProducts({ pageSize: 1000 })
      ])
      
      setCategories(catData)
      setProducts(prodData.data)
      
      if (!selectedCategoryId && catData.length > 0) {
        setSelectedCategoryId(catData[0].id)
      }
    } catch (err) {
      toast.error('Failed to load catalog data')
    } finally {
      setIsPageLoading(false)
      setIsRefreshing(false)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    if (user && canViewCatalog(user.role)) {
      loadData()
    }
  }, [user, loadData])

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

  const handleSeedCatalog = async () => {
    setIsRefreshing(true)
    try {
      await catalogApi.seedCategories()
      await catalogApi.seedProducts()
      toast.success('Catalog seeded with default items')
      loadData()
    } catch (err) {
      toast.error('Failed to seed catalog')
    } finally {
      setIsRefreshing(false)
    }
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

  const handleSaveProduct = async () => {
    if (!productFormData.name.trim()) {
      toast.error('Product name is required')
      return
    }

    setIsSaving(true)
    try {
      if (editingProduct) {
        await catalogApi.updateProduct(editingProduct.id, {
          name: productFormData.name,
          categoryId: productFormData.categoryId,
          defaultUnit: productFormData.defaultUnit,
          price: productFormData.price ? parseFloat(productFormData.price) : undefined,
          description: productFormData.description || '',
          isActive: productFormData.isActive,
        })
        toast.success('Product updated')
      } else {
        await catalogApi.createProduct({
          name: productFormData.name,
          categoryId: productFormData.categoryId,
          defaultUnit: productFormData.defaultUnit,
          price: productFormData.price ? parseFloat(productFormData.price) : undefined,
          description: productFormData.description || '',
        })
        toast.success('Product created')
      }
      setProductSheetOpen(false)
      loadData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivateProduct = async (product: Product) => {
    try {
      await catalogApi.deactivateProduct(product.id)
      toast.success('Product deactivated')
      loadData(true)
    } catch (err) {
      if (err instanceof Error && err.message.includes('live event')) {
        setProductToDeactivate(product)
        setDeactivateDialogOpen(true)
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to deactivate product')
      }
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

  const handleReactivateProduct = async (product: Product) => {
    try {
      await catalogApi.updateProduct(product.id, { isActive: true })
      toast.success('Product reactivated')
      loadData(true)
    } catch (err) {
      toast.error('Failed to reactivate product')
    }
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

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    setIsSaving(true)
    try {
      if (editingCategory) {
        await catalogApi.updateCategory(editingCategory.id, newCategoryName)
        toast.success('Category updated')
      } else {
        await catalogApi.createCategory(newCategoryName)
        toast.success('Category created')
      }
      setCategoryDialogOpen(false)
      loadData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    try {
      await catalogApi.deleteCategory(category.id)
      toast.success('Category deleted')
      if (selectedCategoryId === category.id) {
        setSelectedCategoryId('')
      }
      loadData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Synchronizing Catalog...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader 
        title="Product Catalog" 
        action={
          user?.role === 'admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSeedCatalog}
              disabled={isRefreshing}
            >
              <Database className="w-4 h-4 mr-2" />
              {isRefreshing ? 'Seeding...' : 'Seed Catalog'}
            </Button>
          )
        }
      />

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
                        <StatusBadge status={product.isActive ? 'active' : 'inactive'} />

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
            <Button onClick={handleSaveProduct} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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
            <Button onClick={handleSaveCategory} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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
