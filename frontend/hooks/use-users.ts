import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersApi } from '@/lib/api'
import type { User, UserRole } from '@/lib/types'

export function useUsers(currentUserId: string) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'karigar' as UserRole,
  })

  const { data: usersData, isLoading: isInitialLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    staleTime: 1000 * 60 * 2,
  })

  const users = usersData?.data || []

  const openDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({ name: user.name, email: user.email, password: '', role: user.role })
    } else {
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: 'karigar' })
    }
    setDialogOpen(true)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, password }))
    toast.success('Secure password generated')
  }

  const saveUser = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users')
      return
    }
    setIsLoading(true)
    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser.id, { name: formData.name, role: formData.role })
        toast.success('User updated successfully')
      } else {
        await usersApi.createUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
        })
        toast.success('User invitation created')
      }
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (error: any) {
      toast.error(error.message || 'Error processing request')
    } finally {
      setIsLoading(false)
    }
  }

  const deactivateUser = async (user: User) => {
    if (user.id === currentUserId) {
      toast.error('You cannot delete yourself')
      return
    }
    if (!confirm(`Are you sure you want to deactivate ${user.name}?`)) return
    try {
      await usersApi.deleteUser(user.id)
      toast.success('User has been deactivated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate user')
    }
  }

  const activateUser = async (user: User) => {
    try {
      await usersApi.activateUser(user.id)
      toast.success('User account re-activated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate user')
    }
  }

  const permanentlyDeleteUser = async (user: User) => {
    if (!window.confirm(`DANGER: Permanently delete ${user.name}? This cannot be undone.`)) return
    setIsLoading(true)
    try {
      await usersApi.permanentlyDeleteUser(user.id)
      toast.success('User permanently deleted')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to permanently delete user')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    users,
    dialogOpen,
    setDialogOpen,
    editingUser,
    isLoading,
    isInitialLoading,
    formData,
    setFormData,
    openDialog,
    generatePassword,
    saveUser,
    deactivateUser,
    activateUser,
    permanentlyDeleteUser,
  }
}
