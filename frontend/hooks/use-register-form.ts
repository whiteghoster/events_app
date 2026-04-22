import { useState } from 'react'
import { usersApi } from '@/lib/api'
import { toast } from 'sonner'

const DEFAULT_FORM = { name: '', email: '', password: '', role: 'karigar' }

export function useRegisterForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState(DEFAULT_FORM)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      await usersApi.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })
      toast.success('Team member invited successfully')
      setIsOpen(false)
      setFormData(DEFAULT_FORM)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isOpen, setIsOpen,
    isLoading, formData,
    handleChange, generatePassword, handleSubmit,
  }
}
