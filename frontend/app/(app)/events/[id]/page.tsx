
'use client'

import { useState, useMemo, use, useCallback } from 'react'
import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query'

import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, Check, X, MapPin, Calendar, User, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { useAuth, canEditEvent, canCloseEvent, canEditProductRow, canEditQuantityOnly } from '@/lib/auth-context'
import { eventsApi, catalogApi } from '@/lib/api'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Event, EventProduct, EventStatus, Category, Product } from '@/lib/types'

const units = ['kg', 'g', 'pcs', 'bunch', 'dozen', 'box', 'bundle', 'set', 'roll', 'metre', 'litre', 'ml']

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
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

  // Parallel data fetching with useQueries for better performance
  const [
    { data: event, isLoading: eventLoading, error: eventError },
    { data: eventProductsList = [], isLoading: productsLoading, error: productsError },
    { data: categorySummary = [], isLoading: summaryLoading, error: summaryError },
  ] = useQueries({
    queries: [
      {
        queryKey: ['event', id],
        queryFn: () => eventsApi.getEventById(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 2, // 2 minutes
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

  // Fetch categories (cached globally)
  const { data: allCategories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes - categories rarely change
  })

  // Fetch products (cached globally)
  const { data: productsData, isLoading: productsListLoading, error: productsListError } = useQuery({
    queryKey: ['products'],
    queryFn: () => catalogApi.getProducts({ pageSize: 100 }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
  const allProducts = productsData?.data || []

  const isLoading = eventLoading || productsLoading || categoriesLoading || productsListLoading

  // Handle errors
  if (eventError) {
    const msg = eventError instanceof Error ? eventError.message : String(eventError)
    if (msg.includes('Event not found')) {
      toast.error('This event does not exist in the database. Please create a new event.')
    } else {
      toast.error('Failed to load event details')
    }
  }

  if (productsError) {
    console.error('Failed to load event products:', productsError)
  }

  if (categoriesError) {
    console.error('Failed to load categories:', categoriesError)
  }

  if (productsListError) {
    console.error('Failed to load products list:', productsListError)
  }

  if (summaryError) {
    console.error('Failed to load category summary:', summaryError)
  }



  const filteredProducts = useMemo(() => {
    if (!newProductData.categoryId) return []
    return allProducts.filter(p => p.categoryId === newProductData.categoryId && p.isActive)
  }, [allProducts, newProductData.categoryId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Event not found in database.</p>
        <Button variant="outline" onClick={() => router.push('/events')}>Back to Events</Button>
      </div>
    )
  }



  const isEditable = event.status !== 'finished'

  const canEdit = user && canEditProductRow(user.role)
  const quantityOnly = user && canEditQuantityOnly(user.role)
  const canEditQuantity = user && (canEditProductRow(user.role) || canEditQuantityOnly(user.role))

  const handleStartEdit = (product: EventProduct) => {
    setEditingRow(product.id)
    setEditingData({
      ...product,
      categoryId: product.categoryId,
      productId: product.productId
    })
  }

  const handleSaveEdit = async () => {
    if (!editingData.quantity || editingData.quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    try {
      const updateData: any = {
        quantity: editingData.quantity,
      }
      
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

  const handleDelete = async (rowId: string) => {
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
    if (!window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
      return
    }

    try {
      await eventsApi.deleteEvent(id)
      toast.success('Event deleted successfully')
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

      if (closeStatus === 'hold') {
        queryClient.invalidateQueries({ queryKey: ['event', id] })
      } else {
        router.push('/events')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close event')
    }
  }


  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <PageHeader
        title={event.clientName}
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: event.clientName },
        ]}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {event.displayId && (
              <span className="text-xs sm:text-sm font-mono font-semibold text-muted-foreground bg-secondary px-2 sm:px-3 py-1.5 rounded-md border border-border">
                {event.displayId}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['event', id] })} className="hidden sm:flex">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload
            </Button>
            {user && canEditEvent(user.role) && isEditable && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/events/${id}/edit`)} className="hidden sm:flex">
                <Pencil className="w-4 h-4 mr-2" />
                Edit Event
              </Button>
            )}
            {user && canEditEvent(user.role) && isEditable && (
              <Button variant="outline" size="icon" className="sm:hidden" onClick={() => router.push(`/events/${id}/edit`)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" className="sm:hidden" onClick={() => queryClient.invalidateQueries({ queryKey: ['event', id] })}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            {user && canCloseEvent(user.role) && event.status !== 'hold' && event.status !== 'finished' && (
              <Button
                variant="outline"
                size="sm"
                className="border-warning text-warning hover:bg-warning/10 hover:text-warning text-xs sm:text-sm"
                onClick={() => {
                  setCloseStatus('hold')
                  setCloseModalOpen(true)
                }}
              >
                Hold
              </Button>
            )}
            {user && canCloseEvent(user.role) && event.status !== 'finished' && (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm"
                onClick={() => {
                  setCloseStatus('finished')
                  setCloseModalOpen(true)
                }}
              >
                Finish
              </Button>
            )}
            {user && user.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive text-xs sm:text-sm hidden sm:flex"
                onClick={handleDeleteEvent}
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Delete
              </Button>
            )}
            {user && user.role === 'admin' && (
              <Button
                variant="outline"
                size="icon"
                className="sm:hidden border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteEvent}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        }
      />

      {/* Event Info Panel */}
      {event && (
        <Collapsible open={infoExpanded} onOpenChange={setInfoExpanded} className="mb-6">
          <div className="bg-card rounded-xl border border-border">
            <CollapsibleTrigger className="w-full p-3 sm:p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                {event.deliveryFromDate && (
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {new Date(event.deliveryFromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {event.deliveryToDate ? new Date(event.deliveryToDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBD'}
                  </span>
                )}
                <span className="hidden sm:flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.venue}
                </span>
              </div>
              {infoExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />}
            </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 sm:px-4 pb-4 pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-label mb-1">Venue</p>
                <p className="text-foreground">{event.venue}</p>
                {event.venueAddress && <p className="text-muted-foreground text-xs mt-0.5">{event.venueAddress}</p>}
              </div>
              {event.city && (
                <div>
                  <p className="text-label mb-1">City</p>
                  <p className="text-foreground">{event.city}</p>
                </div>
              )}
              {event.clientName && (
                <div>
                  <p className="text-label mb-1">Client Name</p>
                  <p className="text-foreground">{event.clientName}</p>
                </div>
              )}
              {event.companyName && (
                <div>
                  <p className="text-label mb-1">Company Name</p>
                  <p className="text-foreground">{event.companyName}</p>
                </div>
              )}
              {event.contactPhone && (
                <div>
                  <p className="text-label mb-1">Contact Phone</p>
                  <p className="text-foreground">{event.contactPhone}</p>
                </div>
              )}
              {event.headKarigarName && (
                <div>
                  <p className="text-label mb-1">Head Karigar</p>
                  <p className="text-foreground">{event.headKarigarName}</p>
                </div>
              )}
              {event.managerName && (
                <div>
                  <p className="text-label mb-1">Manager</p>
                  <p className="text-foreground">{event.managerName}</p>
                </div>
              )}
              {event.deliveryFromDate && (
                <div>
                  <p className="text-label mb-1">Delivery From</p>
                  <p className="text-foreground">{new Date(event.deliveryFromDate).toLocaleDateString()}</p>
                </div>
              )}
              {event.deliveryToDate && (
                <div>
                  <p className="text-label mb-1">Delivery To</p>
                  <p className="text-foreground">{new Date(event.deliveryToDate).toLocaleDateString()}</p>
                </div>
              )}
              {event.notes && (
                <div className="sm:col-span-2">
                  <p className="text-label mb-1">Notes</p>
                  <p className="text-foreground">{event.notes}</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
      )}

      {/* Products Table */}
      <div className="bg-card rounded-xl border border-border mb-6">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h2 className="font-semibold text-foreground">Products Assigned to This Event</h2>
          {canEdit && isEditable && (
            <Button size="sm" onClick={() => setAddingNew(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-12">#</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Product Name</TableHead>
                <TableHead className="text-muted-foreground">Qty</TableHead>
                <TableHead className="text-muted-foreground">Unit</TableHead>
                {!quantityOnly && <TableHead className="text-muted-foreground">Price</TableHead>}
                {canEdit && isEditable && <TableHead className="text-muted-foreground w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventProductsList.map((product, index) => (
                <TableRow
                  key={product.id}
                  className={cn(
                    'border-border',
                    editingRow === product.id && 'bg-primary/5 border-l-2 border-l-primary'
                  )}
                >
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    {editingRow === product.id && !quantityOnly ? (
                      <Select
                        value={editingData.categoryId}
                        onValueChange={(v) => setEditingData(prev => ({ ...prev, categoryId: v, productId: '' }))}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.filter(c => c.isActive).map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      product.categoryName
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {editingRow === product.id && !quantityOnly ? (
                      <Select
                        value={editingData.productId}
                        onValueChange={(v) => {
                          const prod = allProducts.find(p => p.id === v)
                          setEditingData(prev => ({ ...prev, productId: v, unit: prod?.defaultUnit || prev.unit }))
                        }}
                      >
                        <SelectTrigger className="w-40 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allProducts
                            .filter(p => p.categoryId === editingData.categoryId && p.isActive)
                            .map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      product.productName
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRow === product.id ? (
                      <Input
                        type="number"
                        min="1"
                        value={editingData.quantity || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        className="w-20 h-8"
                      />
                    ) : (
                      product.quantity
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRow === product.id && !quantityOnly ? (
                      <Select value={editingData.unit} onValueChange={(v) => setEditingData(prev => ({ ...prev, unit: v }))}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      product.unit
                    )}
                  </TableCell>
                  {!quantityOnly && (
                    <TableCell className="text-muted-foreground">
                      {editingRow === product.id && !quantityOnly ? (
                        <Input
                          type="number"
                          value={editingData.price || ''}
                          onChange={(e) => setEditingData(prev => ({ ...prev, price: parseFloat(e.target.value) || undefined }))}
                          className="w-24 h-8"
                          placeholder="₹"
                        />
                      ) : (
                        product.price ? `₹${product.price}` : '-'
                      )}
                    </TableCell>
                  )}

                  {canEditQuantity && isEditable && (
                    <TableCell>
                      {editingRow === product.id ? (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-8 w-8 text-success hover:text-success">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 text-muted-foreground">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleStartEdit(product)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {/* Add New Row */}
              {addingNew && (
                <TableRow className="border-border bg-primary/5 border-l-2 border-l-primary">
                  <TableCell className="text-muted-foreground">-</TableCell>
                  <TableCell>
                    <Select value={newProductData.categoryId} onValueChange={(v) => setNewProductData(prev => ({ ...prev, categoryId: v, productId: '' }))}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories.filter(c => c.isActive).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={newProductData.productId} onValueChange={(v) => {
                      const prod = allProducts.find(p => p.id === v)
                      setNewProductData(prev => ({ ...prev, productId: v, unit: prod?.defaultUnit || '' }))
                    }}>
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProducts.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={newProductData.quantity}
                      onChange={(e) => setNewProductData(prev => ({ ...prev, quantity: e.target.value }))}
                      className="w-20 h-8"
                      placeholder="Qty"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={newProductData.unit} onValueChange={(v) => setNewProductData(prev => ({ ...prev, unit: v }))}>
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={newProductData.price}
                      onChange={(e) => setNewProductData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-24 h-8"
                      placeholder="₹"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={handleAddProduct} className="h-8 w-8 text-success hover:text-success">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        setAddingNew(false)
                        setNewProductData({ categoryId: '', productId: '', quantity: '', unit: '', price: '' })
                      }} className="h-8 w-8 text-muted-foreground">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {eventProductsList.length === 0 && !addingNew && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No products assigned to this event yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Total Amount Footer */}
        {eventProductsList.length > 0 && (() => {
          const pricedItems = eventProductsList.filter(p => p.price && p.price > 0)
          const grandTotal = eventProductsList.reduce((sum, p) => sum + (p.price || 0), 0)
          return (
            <div className="border-t border-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {pricedItems.map(p => (
                  <span key={p.id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{p.productName}</span>
                    {': '}
                    {p.quantity} {p.unit} = <span className="text-foreground">₹{p.price!.toLocaleString('en-IN')}</span>
                  </span>
                ))}
                {pricedItems.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No prices assigned to products yet.</span>
                )}
              </div>
              <div className="text-sm font-semibold text-foreground shrink-0">
                Total:{' '}
                <span className="text-primary text-base">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Category Summary */}
      {categorySummary.length > 0 && (
        <div className="bg-secondary rounded-xl p-4 border-l-4 border-primary mb-6">
          <h3 className="text-label mb-3">Category Summary</h3>
          <div className="space-y-4">
            {categorySummary.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                  <span className="font-bold text-foreground sm:w-32">{item.category}</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {item.totals.map((t: any, tidx: number) => (
                      <span key={tidx} className="text-muted-foreground whitespace-nowrap">
                        {t.quantity} {t.unit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3 text-sm text-muted-foreground">
            Total: {categorySummary.length} categories · {eventProductsList.length} rows
          </div>
        </div>
      )}

      
      {/* Close Event Modal */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Close This Event
            </DialogTitle>
            <DialogDescription>
              Moving &quot;{event.clientName}&quot; to Over. Choose closing status:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary cursor-pointer">
                  <input
                    type="radio"
                    name="closeStatus"
                    value="hold"
                    checked={closeStatus === 'hold'}
                    onChange={() => setCloseStatus('hold')}
                    className="accent-primary"
                  />
                  <div>
                    <p className="font-medium text-foreground">Hold</p>
                    <p className="text-sm text-muted-foreground">Admin can still edit</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary cursor-pointer">
                <input
                  type="radio"
                  name="closeStatus"
                  value="finished"
                  checked={closeStatus === 'finished'}
                  onChange={() => setCloseStatus('finished')}
                  className="accent-primary"
                />
                <div>
                  <p className="font-medium text-foreground">Finished</p>
                  <p className="text-sm text-muted-foreground">Permanently read-only</p>
                </div>
              </label>

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseModalOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCloseEvent}>
              Confirm & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
