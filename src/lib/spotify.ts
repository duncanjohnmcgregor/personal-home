import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Spotify API Base URL
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

// Types for Spotify API responses
export interface SpotifyPlaylist {
  id: string
  name: string
  description?: string
  public: boolean
  collaborative: boolean
  tracks: {
    total: number
    href: string
  }
  images: Array<{
    url: string
    height?: number
    width?: number
  }>
  owner: {
    id: string
    display_name: string
  }
  external_urls: {
    spotify: string
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{
    id: string
    name: string
  }>
  album: {
    id: string
    name: string
    images: Array<{
      url: string
      height?: number
      width?: number
    }>
  }
  duration_ms: number
  explicit: boolean
  preview_url?: string
  external_urls: {
    spotify: string
  }
  uri: string
}

export interface SpotifyPlaylistTracks {
  items: Array<{
    added_at: string
    track: SpotifyTrack
  }>
  total: number
  limit: number
  offset: number
  next?: string
  previous?: string
}

export interface CreatePlaylistData {
  name: string
  description?: string
  public?: boolean
  collaborative?: boolean
}

export interface AddTracksData {
  uris: string[]
  position?: number
}

/**
 * Refreshes the Spotify access token using the refresh token
 */
async function refreshSpotifyToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        )}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      console.error('Failed to refresh Spotify token:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error refreshing Spotify token:', error)
    return null
  }
}

/**
 * Gets a valid Spotify access token for the current user
 */
async function getSpotifyAccessToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'spotify',
      },
    })

    if (!account?.access_token || !account?.refresh_token) {
      return null
    }

    // Check if token needs refresh (Spotify tokens expire after 1 hour)
    const tokenExpiresAt = account.expires_at ? new Date(account.expires_at * 1000) : new Date(0)
    const now = new Date()
    const shouldRefresh = tokenExpiresAt.getTime() - now.getTime() < 5 * 60 * 1000 // Refresh 5 minutes early

    if (shouldRefresh) {
      const newAccessToken = await refreshSpotifyToken(account.refresh_token)
      if (newAccessToken) {
        // Update the token in the database
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: newAccessToken,
            expires_at: Math.floor(now.getTime() / 1000) + 3600, // 1 hour from now
          },
        })
        return newAccessToken
      }
    }

    return account.access_token
  } catch (error) {
    console.error('Error getting Spotify access token:', error)
    return null
  }
}

/**
 * Makes authenticated requests to the Spotify API
 */
async function spotifyApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const accessToken = await getSpotifyAccessToken()
    if (!accessToken) {
      throw new Error('No valid Spotify access token available')
    }

    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Spotify API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Spotify API request failed:', error)
    return null
  }
}

/**
 * Spotify API Service Class
 */
export class SpotifyService {
  /**
   * Get the current user's playlists
   */
  static async getUserPlaylists(limit = 50, offset = 0): Promise<{
    items: SpotifyPlaylist[]
    total: number
    limit: number
    offset: number
    next?: string
    previous?: string
  } | null> {
    return spotifyApiRequest(`/me/playlists?limit=${limit}&offset=${offset}`)
  }

  /**
   * Get a specific playlist by ID
   */
  static async getPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
    return spotifyApiRequest(`/playlists/${playlistId}`)
  }

  /**
   * Get tracks from a specific playlist
   */
  static async getPlaylistTracks(
    playlistId: string,
    limit = 100,
    offset = 0
  ): Promise<SpotifyPlaylistTracks | null> {
    return spotifyApiRequest(
      `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(added_at,track(id,name,artists,album,duration_ms,explicit,preview_url,external_urls,uri)),total,limit,offset,next,previous`
    )
  }

  /**
   * Create a new playlist
   */
  static async createPlaylist(
    userId: string,
    data: CreatePlaylistData
  ): Promise<SpotifyPlaylist | null> {
    return spotifyApiRequest(`/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description || '',
        public: data.public ?? false,
        collaborative: data.collaborative ?? false,
      }),
    })
  }

  /**
   * Update playlist details
   */
  static async updatePlaylist(
    playlistId: string,
    data: Partial<CreatePlaylistData>
  ): Promise<boolean> {
    const result = await spotifyApiRequest(`/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return result !== null
  }

  /**
   * Add tracks to a playlist
   */
  static async addTracksToPlaylist(
    playlistId: string,
    data: AddTracksData
  ): Promise<{ snapshot_id: string } | null> {
    const body: any = { uris: data.uris }
    if (data.position !== undefined) {
      body.position = data.position
    }

    return spotifyApiRequest(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Remove tracks from a playlist
   */
  static async removeTracksFromPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Promise<{ snapshot_id: string } | null> {
    return spotifyApiRequest(`/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({
        tracks: trackUris.map(uri => ({ uri })),
      }),
    })
  }

  /**
   * Get the current user's Spotify profile
   */
  static async getCurrentUser(): Promise<{
    id: string
    display_name: string
    email: string
    images: Array<{ url: string }>
  } | null> {
    return spotifyApiRequest('/me')
  }

  /**
   * Search for tracks, artists, albums, or playlists
   */
  static async search(
    query: string,
    type: 'track' | 'artist' | 'album' | 'playlist' = 'track',
    limit = 20,
    offset = 0
  ): Promise<any> {
    const encodedQuery = encodeURIComponent(query)
    return spotifyApiRequest(
      `/search?q=${encodedQuery}&type=${type}&limit=${limit}&offset=${offset}`
    )
  }
}

// Export utility functions for direct use
export { getSpotifyAccessToken, refreshSpotifyToken, spotifyApiRequest }