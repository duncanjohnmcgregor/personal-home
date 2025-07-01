import { useState, useCallback } from 'react'
import { 
  Playlist, 
  PlaylistsResponse, 
  CreatePlaylistData, 
  UpdatePlaylistData,
  AddSongToPlaylistData,
  RemoveSongFromPlaylistData
} from '@/types/playlist'

interface UsePlaylistsResult {
  playlists: Playlist[]
  loading: boolean
  error: string | null
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  } | null
  fetchPlaylists: (limit?: number, offset?: number) => Promise<void>
  createPlaylist: (data: CreatePlaylistData) => Promise<Playlist | null>
  updatePlaylist: (id: string, data: UpdatePlaylistData) => Promise<Playlist | null>
  deletePlaylist: (id: string) => Promise<boolean>
  addSongToPlaylist: (playlistId: string, data: AddSongToPlaylistData) => Promise<boolean>
  removeSongFromPlaylist: (playlistId: string, data: RemoveSongFromPlaylistData) => Promise<boolean>
}

export function usePlaylists(): UsePlaylistsResult {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<UsePlaylistsResult['pagination']>(null)

  const fetchPlaylists = useCallback(async (limit = 50, offset = 0) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/playlists?limit=${limit}&offset=${offset}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists')
      }
      
      const data: PlaylistsResponse = await response.json()
      
      if (offset === 0) {
        setPlaylists(data.playlists)
      } else {
        setPlaylists(prev => [...prev, ...data.playlists])
      }
      
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const createPlaylist = useCallback(async (data: CreatePlaylistData): Promise<Playlist | null> => {
    setError(null)
    
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create playlist')
      }
      
      const newPlaylist: Playlist = await response.json()
      setPlaylists(prev => [newPlaylist, ...prev])
      
      return newPlaylist
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }, [])

  const updatePlaylist = useCallback(async (id: string, data: UpdatePlaylistData): Promise<Playlist | null> => {
    setError(null)
    
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update playlist')
      }
      
      const updatedPlaylist: Playlist = await response.json()
      setPlaylists(prev => prev.map(p => p.id === id ? updatedPlaylist : p))
      
      return updatedPlaylist
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }, [])

  const deletePlaylist = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete playlist')
      }
      
      setPlaylists(prev => prev.filter(p => p.id !== id))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }, [])

  const addSongToPlaylist = useCallback(async (playlistId: string, data: AddSongToPlaylistData): Promise<boolean> => {
    setError(null)
    
    try {
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add song to playlist')
      }
      
      // Refresh the specific playlist
      await fetchPlaylists()
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }, [fetchPlaylists])

  const removeSongFromPlaylist = useCallback(async (playlistId: string, data: RemoveSongFromPlaylistData): Promise<boolean> => {
    setError(null)
    
    try {
      const response = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove song from playlist')
      }
      
      // Refresh the specific playlist
      await fetchPlaylists()
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }, [fetchPlaylists])

  return {
    playlists,
    loading,
    error,
    pagination,
    fetchPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
  }
}

interface UsePlaylistResult {
  playlist: Playlist | null
  loading: boolean
  error: string | null
  fetchPlaylist: (id: string) => Promise<void>
}

export function usePlaylist(id?: string): UsePlaylistResult {
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPlaylist = useCallback(async (playlistId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/playlists/${playlistId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlist')
      }
      
      const data: Playlist = await response.json()
      setPlaylist(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch if id is provided
  useState(() => {
    if (id) {
      fetchPlaylist(id)
    }
  })

  return {
    playlist,
    loading,
    error,
    fetchPlaylist,
  }
}