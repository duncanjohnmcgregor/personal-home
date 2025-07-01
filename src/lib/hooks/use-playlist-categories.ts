import { useState, useCallback } from 'react'
import { PlaylistCategory } from '@/types/playlist'

interface UsePlaylistCategoriesReturn {
  categories: PlaylistCategory[]
  loading: boolean
  error: string | null
  fetchCategories: () => Promise<void>
  createCategory: (data: Omit<PlaylistCategory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PlaylistCategory | null>
  updateCategory: (id: string, data: Partial<PlaylistCategory>) => Promise<PlaylistCategory | null>
  deleteCategory: (id: string) => Promise<boolean>
}

export function usePlaylistCategories(): UsePlaylistCategoriesReturn {
  const [categories, setCategories] = useState<PlaylistCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/playlist-categories')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories'
      setError(message)
      console.error('Error fetching playlist categories:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createCategory = useCallback(async (data: Omit<PlaylistCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError(null)
    
    try {
      const response = await fetch('/api/playlist-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const newCategory = result.category

      if (newCategory) {
        setCategories(prev => [...prev, newCategory])
        return newCategory
      }
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category'
      setError(message)
      console.error('Error creating playlist category:', err)
      return null
    }
  }, [])

  const updateCategory = useCallback(async (id: string, data: Partial<PlaylistCategory>) => {
    setError(null)
    
    try {
      const response = await fetch(`/api/playlist-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const updatedCategory = result.category

      if (updatedCategory) {
        setCategories(prev => 
          prev.map(category => 
            category.id === id ? updatedCategory : category
          )
        )
        return updatedCategory
      }
      return null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category'
      setError(message)
      console.error('Error updating playlist category:', err)
      return null
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    setError(null)
    
    try {
      const response = await fetch(`/api/playlist-categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setCategories(prev => prev.filter(category => category.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category'
      setError(message)
      console.error('Error deleting playlist category:', err)
      return false
    }
  }, [])

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}