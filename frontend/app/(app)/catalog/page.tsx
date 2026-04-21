'use client'

import { useRouter } from 'next/navigation'
import { PageTransition } from '@/components/page-transition'
import { CatalogSkeleton } from '@/components/skeletons'
import { useAuth, canManageProducts, canViewCatalog } from '@/lib/auth-context'
import { useCatalog } from '@/hooks/use-catalog'
import { CategoriesSidebar } from '@/components/catalog/categories-sidebar'
import { ProductsTable } from '@/components/catalog/products-table'
import { ProductSheet } from '@/components/catalog/product-sheet'
import { CategoryDialog } from '@/components/catalog/category-dialog'
import { DeactivateDialog } from '@/components/catalog/deactivate-dialog'

export default function CatalogPage() {
  const router = useRouter()
  const { user } = useAuth()
  const catalog = useCatalog()

  if (!user || !canViewCatalog(user.role)) {
    router.replace('/events')
    return null
  }

  const canManage = canManageProducts(user.role)

  if (catalog.isPageLoading) {
    return <CatalogSkeleton />
  }

  return (
    <PageTransition>
      <div className="flex flex-col lg:flex-row gap-6">
        <CategoriesSidebar
          categories={catalog.categories}
          products={catalog.products}
          selectedCategoryId={catalog.selectedCategoryId}
          setSelectedCategoryId={catalog.setSelectedCategoryId}
          canManage={canManage}
          openCategoryDialog={catalog.openCategoryDialog}
          deleteCategory={catalog.deleteCategory}
        />

        <ProductsTable
          selectedCategory={catalog.selectedCategory}
          filteredProducts={catalog.filteredProducts}
          canManage={canManage}
          openProductSheet={catalog.openProductSheet}
          deactivateProduct={catalog.deactivateProduct}
          reactivateProduct={catalog.reactivateProduct}
        />
      </div>

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
