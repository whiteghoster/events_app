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
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: ['eventProducts', id],
        queryFn: () => eventsApi.getEventProducts(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: ['categorySummary', id],
        queryFn: () => eventsApi.getCategorySummary(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
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
      }
      await eventsApi.updateEventProduct(id, editingRow!, updateData)
      toast.success('Product updated')
      setEditingRow(null)
      setEditingData({})
      queryClient.invalidateQueries({ queryKey: ['eventProducts', id] })
      queryClient.invalidateQueries({ queryKey: ['categorySummary', id] })
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
      queryClient.invalidateQueries({ queryKey: ['eventProducts', id] })
      queryClient.invalidateQueries({ queryKey: ['categorySummary', id] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add product')
    }
  }

  const handleCloseEvent = async () => {
    try {
      await eventsApi.closeEvent(id, closeStatus)
      toast.success(`Event moved to ${closeStatus}`)
      setCloseModalOpen(false)
      // Invalidate ALL events list caches so the status change appears instantly on the events page
      await queryClient.invalidateQueries({ queryKey: ['events', 'list'], exact: false })
      if (closeStatus === 'hold') {
        // Also refresh the individual event data
        queryClient.invalidateQueries({ queryKey: ['event', id] })
      } else {
        router.push('/events')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close event')
    }
  }

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ['event', id] })
    queryClient.invalidateQueries({ queryKey: ['eventProducts', id] })
    queryClient.invalidateQueries({ queryKey: ['categorySummary', id] })
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
