import { useState, useCallback, useEffect } from 'react'
import { toast } from './use-toast'

export interface SearchTrack {
  id: string
  name: string
  artist: string
  album?: string
  duration?: number
  image?: string
  previewUrl?: string
  platform: 'spotify' | 'soundcloud' | 'beatport'
  platformId: string
  uri?: string
  url?: string
}

interface UnifiedSearchResult {
  platform: 'spotify' | 'soundcloud' | 'beatport'
  tracks: any[]
  total?: number
  error?: string
}

interface SearchResponse {
  query: string
  platforms: string[]
  results: UnifiedSearchResult[]
  totalTracks: number
}

export function useSearch() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchTrack[]>([])
  const [query, setQuery] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['spotify', 'soundcloud', 'beatport'])
  const [totalResults, setTotalResults] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const normalizeTrack = useCallback((track: any, platform: 'spotify' | 'soundcloud' | 'beatport'): SearchTrack => {
    switch (platform) {
      case 'spotify':
        return {
          id: `spotify-${track.id}`,
          name: track.name,
          artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          album: track.album?.name,
          duration: track.duration_ms,
          image: track.album?.images?.[0]?.url,
          previewUrl: track.preview_url,
          platform: 'spotify',
          platformId: track.id,
          uri: track.uri,
          url: track.external_urls?.spotify,
        }

      case 'soundcloud':
        return {
          id: `soundcloud-${track.id}`,
          name: track.title,
          artist: track.user?.username || 'Unknown Artist',
          album: undefined,
          duration: track.duration,
          image: track.artwork_url,
          previewUrl: track.stream_url,
          platform: 'soundcloud',
          platformId: track.id.toString(),
          url: track.permalink_url,
        }

      case 'beatport':
        return {
          id: `beatport-${track.id}`,
          name: track.name + (track.mix_name ? ` (${track.mix_name})` : ''),
          artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          album: track.release?.name,
          duration: track.duration?.milliseconds,
          image: track.release?.image?.uri,
          previewUrl: undefined,
          platform: 'beatport',
          platformId: track.id.toString(),
          url: track.url,
        }

      default:
        return {
          id: `unknown-${Math.random()}`,
          name: 'Unknown Track',
          artist: 'Unknown Artist',
          platform: platform,
          platformId: 'unknown',
        }
    }
  }, [])

  const search = useCallback(async (searchQuery: string, selectedPlatforms?: string[]) => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotalResults(0)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setQuery(searchQuery)

    const platformsToSearch = selectedPlatforms || platforms

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        platforms: platformsToSearch.join(','),
        limit: '20',
      })

      const response = await fetch(`/api/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data: SearchResponse = await response.json()

      // Normalize and combine results from all platforms
      const normalizedTracks: SearchTrack[] = []
      let total = 0

      data.results.forEach((result) => {
        if (result.error) {
          console.warn(`Search error for ${result.platform}:`, result.error)
          return
        }

        const platformTracks = result.tracks.map(track => 
          normalizeTrack(track, result.platform)
        )
        
        normalizedTracks.push(...platformTracks)
        total += result.total || 0
      })

      setResults(normalizedTracks)
      setTotalResults(total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      toast({
        title: 'Search Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [platforms, normalizeTrack])

  const clearSearch = useCallback(() => {
    setResults([])
    setQuery('')
    setError(null)
    setTotalResults(0)
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (!query) return

    const timeoutId = setTimeout(() => {
      search(query, platforms)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, platforms, search])

  return {
    loading,
    results,
    query,
    platforms,
    totalResults,
    error,
    search,
    clearSearch,
    setPlatforms,
    setQuery,
  }
}