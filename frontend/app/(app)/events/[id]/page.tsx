
'use client'

import { useState, useMemo, use, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, Check, X, MapPin, Calendar, User, FileText } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { useAuth, canEditEvent, canCloseEvent, canEditProductRow, canEditQuantityOnly, canViewAudit } from '@/lib/auth-context'
import { eventsApi, catalogApi, auditApi } from '@/lib/api'
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

  const [event, setEvent] = useState<Event | null>(null)
  const [eventProductsList, setEventProductsList] = useState<EventProduct[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [eventLogs, setEventLogs] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [infoExpanded, setInfoExpanded] = useState(false)
  const [auditExpanded, setAuditExpanded] = useState(false)
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

  const loadData = useCallback(async () => {
    try {
      const [eventData, productsData, catData, prodData, logsData] = await Promise.all([
        eventsApi.getEventById(id),
        eventsApi.getEventProducts(id),
        catalogApi.getCategories(),
        catalogApi.getProducts({ pageSize: 1000 }),
        auditApi.getAuditLogs({ limit: 50 }) // we don't have entity_id filter yet, fetching latest
      ])

      setEvent(eventData)
      setEventProductsList(productsData)
      setAllCategories(catData)
      setAllProducts(prodData.data)
      
      // Filter logs locally for now until backend supports entity_id filtering
      setEventLogs(logsData.data.filter(l => l.entityName === eventData.name))
    } catch (err) {
      console.error('Failed to load event data:', err)
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Event not found')) {
        toast.error('This event does not exist in the database. Please create a new event.')
      } else {
        toast.error('Failed to load event details')
      }
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])



  const categorySummary = useMemo(() => {
    const summary: Record<string, { quantities: Record<string, number> }> = {}
    eventProductsList.forEach(p => {
      if (!summary[p.categoryName]) {
        summary[p.categoryName] = { quantities: {} }
      }
      const key = p.unit
      summary[p.categoryName].quantities[key] = (summary[p.categoryName].quantities[key] || 0) + (p.quantity || 0)
    })
    return summary
  }, [eventProductsList])

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

  const isEditable = event.status === 'live' || (event.status === 'hold' && user?.role === 'admin')

  const canEdit = user && (canEditProductRow(user.role) || canEditQuantityOnly(user.role))
  const quantityOnly = user && canEditQuantityOnly(user.role)

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
      await eventsApi.updateEventProduct(id, editingRow!, {
        product_id: editingData.productId,
        quantity: editingData.quantity,
        unit: editingData.unit,
        price: editingData.price,
      })
      toast.success('Product updated')
      setEditingRow(null)
      setEditingData({})
      loadData() // Reload to reflect changes
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
      loadData()
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
      loadData()
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
        loadData()
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
        title={event.name}
        breadcrumbs={[
          { label: 'Events', href: '/events' },
          { label: event.name },
        ]}
        action={
          <div className="flex items-center gap-3">
            {event.displayId && (
              <span className="text-sm font-mono font-semibold text-muted-foreground bg-secondary px-3 py-1.5 rounded-md border border-border">
                {event.displayId}
              </span>
            )}
            <StatusBadge status={event.status} size="md" />
            {user && canEditEvent(user.role) && isEditable && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/events/${id}/edit`)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Event
              </Button>
            )}
            {user && canCloseEvent(user.role) && event.status.toLowerCase() === 'live' && (
              <Button
                variant="outline"
                className="border-warning text-warning hover:bg-warning/10 hover:text-warning"
                onClick={() => {
                  setCloseStatus('hold')
                  setCloseModalOpen(true)
                }}
              >
                Hold Event
              </Button>
            )}
            {user && canCloseEvent(user.role) && ['live', 'hold'].includes(event.status.toLowerCase()) && (
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  setCloseStatus('finished')
                  setCloseModalOpen(true)
                }}
              >
                Finish Event
              </Button>
            )}
            {user && user.role === 'admin' && event.status.toLowerCase() === 'finished' && (
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteEvent}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </Button>
            )}
          </div>
        }
      />

      {/* Event Info Panel */}
      <Collapsible open={infoExpanded} onOpenChange={setInfoExpanded} className="mb-6">
        <div className="bg-card rounded-xl border border-border">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="hidden sm:flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {event.venueName}
              </span>
            </div>
            {infoExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-label mb-1">Occasion</p>
                <p className="text-foreground">
                  {event.occasionType.replace('_', ' ').charAt(0).toUpperCase() + event.occasionType.replace('_', ' ').slice(1)}
                </p>

              </div>
              <div>
                <p className="text-label mb-1">Date</p>
                <p className="text-foreground">{new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-label mb-1">Venue</p>
                <p className="text-foreground">{event.venueName}</p>
                {event.venueAddress && <p className="text-muted-foreground text-xs mt-0.5">{event.venueAddress}</p>}
              </div>
              {event.contactName && (
                <div>
                  <p className="text-label mb-1">Contact</p>
                  <p className="text-foreground">{event.contactName}</p>
                  {event.contactPhone && <p className="text-muted-foreground text-xs mt-0.5">{event.contactPhone}</p>}
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

      {/* Products Table */}
      <div className="bg-card rounded-xl border border-border mb-6">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h2 className="font-semibold text-foreground">Products Assigned to This Event</h2>
          {canEdit && isEditable && !quantityOnly && (
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
                    {editingRow === product.id ? (
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
                      {editingRow === product.id ? (
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

                  {canEdit && isEditable && (
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
                          {!quantityOnly && (
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
      </div>

      {/* Category Summary */}
      {Object.keys(categorySummary).length > 0 && (
        <div className="bg-secondary rounded-xl p-4 border-l-4 border-primary mb-6">
          <h3 className="text-label mb-3">Category Summary</h3>
          <div className="space-y-2">
            {Object.entries(categorySummary).map(([category, data]) => (
              <div key={category} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-foreground w-32">{category}</span>
                <span className="text-muted-foreground">
                  {Object.entries(data.quantities).map(([unit, qty], i) => (
                    <span key={unit}>
                      {i > 0 && ' · '}
                      {qty} {unit}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3 text-sm text-muted-foreground">
            Total: {Object.keys(categorySummary).length} categories · {eventProductsList.length} rows
          </div>
        </div>
      )}

      {/* Audit Log Panel (Admin only) */}
      {user && canViewAudit(user.role) && (
        <Collapsible open={auditExpanded} onOpenChange={setAuditExpanded}>
          <div className="bg-card rounded-xl border border-border">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Change Log</span>
                <span className="text-muted-foreground text-sm">({eventLogs.length} entries)</span>
              </div>
              {auditExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                {eventLogs.map(entry => (
                  <div key={entry.id} className="bg-secondary rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">{entry.userName}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className={cn(
                        'text-xs font-medium',
                        entry.action === 'Created' && 'text-success',
                        entry.action === 'Updated' && 'text-warning',
                        entry.action === 'Deleted' && 'text-destructive'
                      )}>
                        {entry.action}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{entry.entityType}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{entry.change}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-2">
                      {new Date(entry.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
                {eventLogs.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No changes recorded for this event.</p>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Close Event Modal */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {event.status.toLowerCase() === 'hold' ? 'Finish This Event' : 'Close This Event'}
            </DialogTitle>
            <DialogDescription>
              Moving &quot;{event.name}&quot; to {event.status.toLowerCase() === 'hold' ? 'Finished' : 'Over'}. Choose closing status:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              {event.status.toLowerCase() !== 'hold' && (
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
              )}
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
