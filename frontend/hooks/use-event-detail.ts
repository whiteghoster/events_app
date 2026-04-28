import { useState, useMemo } from 'react'
import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { eventsApi, catalogApi } from '@/lib/api'
import type { EventProduct } from '@/lib/types'

const UNITS = ['kg', 'g', 'pcs', 'bunch', 'dozen', 'box', 'bundle', 'set', 'roll', 'metre', 'litre', 'ml']

export function useEventDetail(id: string) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [infoExpanded, setInfoExpanded] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [closeStatus, setCloseStatus] = useState<'hold' | 'finished'>('hold')
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Partial<EventProduct>>({})
  const [addingNew, setAddingNew] = useState(false)
  const [newProductData, setNewProductData] = useState({
    categoryId: '',
    productId: '',
    quantity: '',
    unit: '',
    price: '',
  })

  const [
    { data: event, isLoading: eventLoading },
    { data: eventProductsList = [], isLoading: productsLoading },
    { data: categorySummary = [] },
  ] = useQueries({
    queries: [
      {
        queryKey: ['event', id],
        queryFn: () => eventsApi.getEventById(id),
        enabled: !!id,
      },
      {
        queryKey: ['eventProducts', id],
        queryFn: () => eventsApi.getEventProducts(id),
        enabled: !!id,
      },
      {
        queryKey: ['categorySummary', id],
        queryFn: () => eventsApi.getCategorySummary(id),
        enabled: !!id,
      },
    ],
  })

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
    staleTime: 1000 * 60 * 10,
  })

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => catalogApi.getProducts({ pageSize: 100 }),
    staleTime: 1000 * 60 * 10,
  })
  const allProducts = productsData?.data || []

  const isLoading = eventLoading || productsLoading

  const filteredProducts = useMemo(() => {
    if (!newProductData.categoryId) return []
    return allProducts.filter(p => p.categoryId === newProductData.categoryId && p.isActive)
  }, [allProducts, newProductData.categoryId])

  const handleStartEdit = (product: EventProduct) => {
    setEditingRow(product.id)
    setEditingData({ ...product, categoryId: product.categoryId, productId: product.productId })
  }

  const handleSaveEdit = async (quantityOnly: boolean) => {
    if (!editingData.quantity || editingData.quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    try {
      const updateData: any = { quantity: editingData.quantity }
      if (!quantityOnly) {
        updateData.unit = editingData.unit
        updateData.price = editingData.price
        updateData.product_id = editingData.productId
      }
      await eventsApi.updateEventProduct(id, editingRow!, updateData)
      toast.success('Product updated')
      setEditingRow(null)
      setEditingData({})
      // Refetch queries to force immediate data refresh
      await queryClient.refetchQueries({ queryKey: ['eventProducts', id] })
      await queryClient.refetchQueries({ queryKey: ['categorySummary', id] })
      await queryClient.invalidateQueries({ queryKey: ['audit', 'event-products', id] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditingData({})
  }

  const handleDeleteProduct = async (rowId: string) => {
    try {
      await eventsApi.deleteEventProduct(id, rowId)
      toast.success('Product removed from event')
      queryClient.invalidateQueries({ queryKey: ['eventProducts', id] })
      queryClient.invalidateQueries({ queryKey: ['categorySummary', id] })
      queryClient.invalidateQueries({ queryKey: ['audit', 'event-products', id] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) return
    try {
      await eventsApi.deleteEvent(id)
      toast.success('Event deleted successfully')
      // Invalidate ALL events list caches (all tabs) so the deleted event is removed immediately
      await queryClient.invalidateQueries({ queryKey: ['events', 'list'], exact: false })
      await queryClient.invalidateQueries({ queryKey: ['audit', 'event', id] })
      router.push('/events')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleAddProduct = async () => {
    if (!newProductData.categoryId || !newProductData.productId || !newProductData.quantity || !newProductData.unit) {
      toast.error('Please fill all required fields')
      return
    }
    const qty = parseInt(newProductData.quantity)
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    try {
      await eventsApi.addEventProduct(id, {
        productId: newProductData.productId,
        quantity: qty,
        unit: newProductData.unit,
        price: newProductData.price ? parseFloat(newProductData.price) : undefined,
      })
      setAddingNew(false)
      setNewProductData({ categoryId: '', productId: '', quantity: '', unit: '', price: '' })
      toast.success('Product added')
      await queryClient.refetchQueries({ queryKey: ['eventProducts', id] })
      await queryClient.refetchQueries({ queryKey: ['categorySummary', id] })
      await queryClient.invalidateQueries({ queryKey: ['audit', 'event-products', id] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add product')
    }
  }

  const handleCloseEvent = async () => {
    try {
      // Optimistic update: remove event from current tab's cache immediately
      queryClient.setQueriesData({ queryKey: ['events', 'list'], exact: false }, (oldData: any) => {
        if (!oldData?.pages) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            events: page.events.filter((e: any) => e.id !== id),
          })),
        }
      })
      setCloseModalOpen(false)
      
      await eventsApi.closeEvent(id, closeStatus)
      toast.success(`Event moved to ${closeStatus}`)
      
      // Refresh all event lists to sync with server
      await queryClient.invalidateQueries({
        queryKey: ['events', 'list'],
        exact: false,
        refetchType: 'active',
      })
      await queryClient.invalidateQueries({ queryKey: ['audit', 'event', id] })
      
      if (closeStatus === 'hold') {
        // Update individual event cache with new status
        queryClient.setQueryData(['event', id], (old: any) => old ? { ...old, status: 'hold' } : old)
        await queryClient.invalidateQueries({ queryKey: ['event', id], refetchType: 'active' })
      } else {
        router.push('/events')
      }
    } catch (err) {
      // Restore on error
      await queryClient.invalidateQueries({ queryKey: ['events', 'list'], exact: false })
      toast.error(err instanceof Error ? err.message : 'Failed to close event')
    }
  }

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ['event', id] })
    queryClient.invalidateQueries({ queryKey: ['eventProducts', id] })
    queryClient.invalidateQueries({ queryKey: ['categorySummary', id] })
    queryClient.invalidateQueries({ queryKey: ['audit', 'event', id] })
    queryClient.invalidateQueries({ queryKey: ['audit', 'event-products', id] })
  }

  const resetNewProduct = () => {
    setAddingNew(false)
    setNewProductData({ categoryId: '', productId: '', quantity: '', unit: '', price: '' })
  }

  return {
    event,
    isLoading,
    eventProductsList,
    categorySummary,
    allCategories,
    allProducts,
    filteredProducts,
    infoExpanded,
    setInfoExpanded,
    closeModalOpen,
    setCloseModalOpen,
    closeStatus,
    setCloseStatus,
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
    handleDeleteEvent,
    handleAddProduct,
    handleCloseEvent,
    reload,
    resetNewProduct,
    units: UNITS,
  }
}
