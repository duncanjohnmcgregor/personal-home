import { useState, useCallback } from 'react'
import type { ToastActionElement } from '@/components/ui/toast'

export interface ToastData {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: ToastActionElement
}

interface ToastState extends ToastData {
  id: string
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const addToast = useCallback((data: ToastData) => {
    const id = (++toastCounter).toString()
    const toast: ToastState = { ...data, id }
    
    setToasts(prev => [...prev, toast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
  }
}

// Global toast function for convenience
let globalToast: ((data: ToastData) => string) | null = null

export function setGlobalToast(toastFn: (data: ToastData) => string) {
  globalToast = toastFn
}

export function toast(data: ToastData) {
  if (globalToast) {
    return globalToast(data)
  }
  console.warn('Toast not initialized. Make sure to call setGlobalToast.')
  return ''
}