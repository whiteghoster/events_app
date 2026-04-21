import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { catalogApi } from '@/lib/api'
import type { Category, Product, ProductUnit } from '@/lib/types'

export function useCatalog() {
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
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
    isActive: true,
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
    staleTime: 1000 * 60 * 5,
  })

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => catalogApi.getProducts({ pageSize: 100 }),
    staleTime: 1000 * 60 * 5,
  })

  const products = productsData?.data || []
  const isPageLoading = categoriesLoading || productsLoading

  // Auto-select first category
  if (!selectedCategoryId && categories.length > 0) {
    setSelectedCategoryId(categories[0].id)
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.categoryId === selectedCategoryId)
  }, [products, selectedCategoryId])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['products', 'all'] })
  }

  const openProductSheet = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductFormData({
        name: product.name,
        categoryId: product.categoryId,
        defaultUnit: product.defaultUnit as ProductUnit,
        price: product.price?.toString() || '',
        isActive: product.isActive,
      })
    } else {
      setEditingProduct(null)
      setProductFormData({
        name: '',
        categoryId: selectedCategoryId,
        defaultUnit: 'pcs',
        price: '',
        isActive: true,
      })
    }
    setProductSheetOpen(true)
  }

  const saveProduct = async () => {
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
          isActive: productFormData.isActive,
        })
        toast.success('Product updated')
      } else {
        await catalogApi.createProduct({
          name: productFormData.name,
          categoryId: productFormData.categoryId,
          defaultUnit: productFormData.defaultUnit,
          price: productFormData.price ? parseFloat(productFormData.price) : undefined,
        })
        toast.success('Product created')
      }
      setProductSheetOpen(false)
      invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const deactivateProduct = async (product: Product) => {
    try {
      await catalogApi.deactivateProduct(product.id)
      toast.success('Product deactivated')
      invalidateAll()
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
    setDeactivateDialogOpen(false)
    setProductToDeactivate(null)
    invalidateAll()
  }

  const reactivateProduct = async (product: Product) => {
    try {
      await catalogApi.updateProduct(product.id, { isActive: true })
      toast.success('Product reactivated')
      invalidateAll()
    } catch {
      toast.error('Failed to reactivate product')
    }
  }

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setNewCategoryName(category.name)
    } else {
      setEditingCategory(null)
      setNewCategoryName('')
    }
    setCategoryDialogOpen(true)
  }

  const saveCategory = async () => {
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
      invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteCategory = async (category: Category) => {
    try {
      await catalogApi.deleteCategory(category.id)
      toast.success('Category deleted')
      if (selectedCategoryId === category.id) setSelectedCategoryId('')
      invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  return {
    categories,
    products,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    filteredProducts,
    isPageLoading,
    isSaving,
    productSheetOpen,
    setProductSheetOpen,
    editingProduct,
    productFormData,
    setProductFormData,
    categoryDialogOpen,
    setCategoryDialogOpen,
    editingCategory,
    newCategoryName,
    setNewCategoryName,
    deactivateDialogOpen,
    setDeactivateDialogOpen,
    openProductSheet,
    saveProduct,
    deactivateProduct,
    confirmDeactivate,
    reactivateProduct,
    openCategoryDialog,
    saveCategory,
    deleteCategory,
  }
}
