'use client'

import { useState } from 'react'
import { Icon } from '@/components/icon'
import {
  Search01Icon, Add01Icon, PencilEdit01Icon,
  Cancel01Icon, GridViewIcon,
} from '@hugeicons/core-free-icons'
import { Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useCatalog } from '@/hooks/use-catalog'
import { ProductsTable } from '@/components/catalog/products-table'
import { ProductSheet } from '@/components/catalog/product-sheet'
import { CategoryDialog } from '@/components/catalog/category-dialog'
import { DeactivateDialog } from '@/components/catalog/deactivate-dialog'
import { CatalogSkeleton } from '@/components/skeletons'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

export default function CatalogPage() {
  const { user } = useAuth()
  const catalog = useCatalog()
  // Allow all logged-in users to manage products
  const canManage = !!user
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)

  if (catalog.isPageLoading) return <CatalogSkeleton />

  return (
    <PageTransition>
      {/* Desktop: single row | Mobile: search full-width, filter+buttons below */}
      <div className="mb-6 space-y-3 sm:space-y-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-0">
            <Icon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products.."
              value={catalog.search}
              onChange={(e) => catalog.setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select
            value={catalog.selectedCategoryId || '__all__'}
            onValueChange={(v) => catalog.setSelectedCategoryId(v === '__all__' ? '' : v === '__uncategorized__' ? '__uncategorized__' : v)}
          >
            <SelectTrigger className="h-9 w-full flex-1 sm:flex-none sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories ({catalog.products.length})</SelectItem>
              {catalog.categories.map(category => {
                const count = catalog.products.filter(p => p.categoryId === category.id).length
                return (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({count})
                  </SelectItem>
                )
              })}
              {(() => {
                const uncategorizedCount = catalog.products.filter(p => !p.categoryId).length
                return uncategorizedCount > 0 ? (
                  <SelectItem value="__uncategorized__">
                    Uncategorized ({uncategorizedCount})
                  </SelectItem>
                ) : null
              })()}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            {canManage && (
              <Button size="sm" variant="outline" className="h-8 sm:h-9 px-2.5 sm:px-3" onClick={() => setManageCategoriesOpen(true)}>
                <Icon icon={GridViewIcon} size={16} className="sm:mr-1.5" />
                <span className="hidden sm:inline">Manage Categories</span>
              </Button>
            )}
            {canManage && (
              <>
                <Button size="sm" onClick={() => catalog.openProductSheet()} className="hidden sm:flex">
                  <Icon icon={Add01Icon} size={16} className="mr-1.5" />
                  Add Product
                </Button>
                <Button size="icon" onClick={() => catalog.openProductSheet()} className="sm:hidden h-8 w-8">
                  <Icon icon={Add01Icon} size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ProductsTable
        products={catalog.filteredProducts}
        categories={catalog.categories}
        canManage={canManage}
        openProductSheet={catalog.openProductSheet}
        deactivateProduct={catalog.deactivateProduct}
        reactivateProduct={catalog.reactivateProduct}
        deleteProduct={catalog.deleteProduct}
      />

      {/* Manage Categories drawer */}
      <Sheet open={manageCategoriesOpen} onOpenChange={setManageCategoriesOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6">
          <SheetHeader className="pb-2">
            <SheetTitle>Manage Categories</SheetTitle>
            <SheetDescription>Add, edit, or delete product categories.</SheetDescription>
          </SheetHeader>

          <div className="py-4">
            <Button size="sm" onClick={() => { catalog.openCategoryDialog(); setManageCategoriesOpen(false) }} className="w-full">
              <Icon icon={Add01Icon} size={16} className="mr-1.5" />
              Add Category
            </Button>
          </div>

          <div className="divide-y divide-border">
            {catalog.categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>
            ) : (
              catalog.categories.map(category => {
                const count = catalog.products.filter(p => p.categoryId === category.id).length
                return (
                  <div key={category.id} className="flex items-center justify-between py-3 group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{count} product{count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => { catalog.openCategoryDialog(category); setManageCategoriesOpen(false) }}
                      >
                        <Icon icon={PencilEdit01Icon} size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => catalog.deleteCategory(category)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Product create/edit sheet */}
      <ProductSheet
        open={catalog.productSheetOpen}
        onOpenChange={catalog.setProductSheetOpen}
        editingProduct={catalog.editingProduct}
        categories={catalog.categories}
        productFormData={catalog.productFormData}
        setProductFormData={catalog.setProductFormData}
        isSaving={catalog.isSaving}
        saveProduct={catalog.saveProduct}
      />
      <CategoryDialog
        open={catalog.categoryDialogOpen}
        onOpenChange={catalog.setCategoryDialogOpen}
        editingCategory={catalog.editingCategory}
        newCategoryName={catalog.newCategoryName}
        setNewCategoryName={catalog.setNewCategoryName}
        isSaving={catalog.isSaving}
        saveCategory={catalog.saveCategory}
      />
      <DeactivateDialog
        open={catalog.deactivateDialogOpen}
        onOpenChange={catalog.setDeactivateDialogOpen}
        confirmDeactivate={catalog.confirmDeactivate}
      />
    </PageTransition>
  )
}
