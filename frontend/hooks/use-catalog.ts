import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { catalogApi } from '@/lib/api'
import type { Category, Product, ProductUnit } from '@/lib/types'

export function useCatalog() {
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [search, setSearch] = useState('')
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
    staleTime: 1000 * 30,
  })

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => catalogApi.getProducts({ pageSize: 100 }),
    staleTime: 1000 * 30,
  })

  const products = productsData?.data || []
  const isPageLoading = categoriesLoading || productsLoading

  // No auto-select — show all products by default

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  const filteredProducts = useMemo(() => {
    let filtered = selectedCategoryId
      ? selectedCategoryId === '__uncategorized__'
        ? products.filter(p => !p.categoryId)
        : products.filter(p => p.categoryId === selectedCategoryId)
      : products
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q))
    }
    return filtered
  }, [products, selectedCategoryId, search])

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
    const tempId = editingProduct ? editingProduct.id : `temp-${Date.now()}`
    const productData = {
      name: productFormData.name,
      categoryId: productFormData.categoryId,
      defaultUnit: productFormData.defaultUnit,
      price: productFormData.price ? parseFloat(productFormData.price) : undefined,
      isActive: editingProduct ? productFormData.isActive : true,
    }
    
    // Optimistic update for instant UI feedback
    queryClient.setQueryData(['products', 'all'], (oldData: any) => {
      if (!oldData?.data) return oldData
      if (editingProduct) {
        // Update existing product
        return {
          ...oldData,
          data: oldData.data.map((p: Product) =>
            p.id === editingProduct.id ? { ...p, ...productData } : p
          ),
        }
      } else {
        // Add new product temporarily
        return {
          ...oldData,
          data: [{ ...productData, id: tempId, category: categories.find(c => c.id === productData.categoryId) }, ...oldData.data],
        }
      }
    })
    setProductSheetOpen(false)
    
    try {
      if (editingProduct) {
        await catalogApi.updateProduct(editingProduct.id, productData)
        toast.success('Product updated')
      } else {
        await catalogApi.createProduct(productData)
        toast.success('Product created')
      }
      invalidateAll()
    } catch (err) {
      // Revert on error
      invalidateAll()
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const deactivateProduct = async (product: Product) => {
    // Optimistic update: update UI immediately
    queryClient.setQueryData(['products', 'all'], (oldData: any) => {
      if (!oldData?.data) return oldData
      return {
        ...oldData,
        data: oldData.data.map((p: Product) => 
          p.id === product.id ? { ...p, isActive: false } : p
        )
      }
    })

    try {
      await catalogApi.deactivateProduct(product.id)
      toast.success('Product deactivated')
    } catch (err) {
      // Revert optimistic update on error
      invalidateAll()
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
    // Optimistic update: update UI immediately
    queryClient.setQueryData(['products', 'all'], (oldData: any) => {
      if (!oldData?.data) return oldData
      return {
        ...oldData,
        data: oldData.data.map((p: Product) => 
          p.id === product.id ? { ...p, isActive: true } : p
        )
      }
    })

    try {
      await catalogApi.updateProduct(product.id, { isActive: true })
      toast.success('Product reactivated')
    } catch {
      // Revert optimistic update on error
      invalidateAll()
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
    const tempId = editingCategory ? editingCategory.id : `temp-${Date.now()}`
    
    // Optimistic update for instant UI feedback
    queryClient.setQueryData(['categories'], (oldData: any) => {
      if (!oldData) return oldData
      if (editingCategory) {
        // Update existing category
        return oldData.map((c: Category) =>
          c.id === editingCategory.id ? { ...c, name: newCategoryName } : c
        )
      } else {
        // Add new category temporarily
        return [{ id: tempId, name: newCategoryName }, ...oldData]
      }
    })
    setCategoryDialogOpen(false)
    
    try {
      if (editingCategory) {
        await catalogApi.updateCategory(editingCategory.id, newCategoryName)
        toast.success('Category updated')
      } else {
        await catalogApi.createCategory(newCategoryName)
        toast.success('Category created')
      }
      invalidateAll()
    } catch (err) {
      // Revert on error
      invalidateAll()
      toast.error(err instanceof Error ? err.message : 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteCategory = async (category: Category) => {
    // Optimistic update: remove from cache immediately
    queryClient.setQueryData(['categories'], (oldData: any) => {
      if (!oldData) return oldData
      return oldData.filter((c: Category) => c.id !== category.id)
    })
    if (selectedCategoryId === category.id) setSelectedCategoryId('')
    
    try {
      await catalogApi.deleteCategory(category.id)
      toast.success('Category deleted')
      invalidateAll()
    } catch (err) {
      // Revert on error
      invalidateAll()
      toast.error(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  const deleteProduct = async (product: Product) => {
    // Optimistic update: remove from cache immediately
    queryClient.setQueryData(['products', 'all'], (oldData: any) => {
      if (!oldData?.data) return oldData
      return {
        ...oldData,
        data: oldData.data.filter((p: Product) => p.id !== product.id)
      }
    })
    
    try {
      await catalogApi.deleteProduct(product.id)
      toast.success('Product deleted')
      invalidateAll()
    } catch (err) {
      // Revert on error
      invalidateAll()
      toast.error(err instanceof Error ? err.message : 'Failed to delete product')
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
    search,
    setSearch,
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
    deleteProduct,
  }
}
