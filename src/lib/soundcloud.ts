import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// SoundCloud API Base URL
const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com'

// Types for SoundCloud API responses
export interface SoundCloudTrack {
  id: number
  title: string
  description?: string
  duration: number
  genre?: string
  tag_list: string
  created_at: string
  user: {
    id: number
    username: string
    avatar_url: string
    permalink_url: string
  }
  artwork_url?: string
  stream_url?: string
  permalink_url: string
  playback_count: number
  favoritings_count: number
  comment_count: number
  access: 'playable' | 'preview' | 'blocked'
  policy: string
  public: boolean
  streamable: boolean
  downloadable: boolean
}

export interface SoundCloudUser {
  id: number
  username: string
  permalink: string
  avatar_url: string
  description?: string
  city?: string
  country?: string
  followers_count: number
  followings_count: number
  track_count: number
  playlist_count: number
  permalink_url: string
}

export interface SoundCloudSearchResult {
  collection: SoundCloudTrack[]
  total_results: number
  next_href?: string
  query_urn?: string
}

/**
 * Refreshes the SoundCloud access token using the refresh token
 */
async function refreshSoundCloudToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://secure.soundcloud.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(
          `${process.env.SOUNDCLOUD_CLIENT_ID}:${process.env.SOUNDCLOUD_CLIENT_SECRET}`
        )}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      console.error('Failed to refresh SoundCloud token:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error refreshing SoundCloud token:', error)
    return null
  }
}

/**
 * Gets a valid SoundCloud access token for the current user
 */
async function getSoundCloudAccessToken(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.warn('No valid session found for SoundCloud access token')
      return null
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'soundcloud',
      },
    })

    if (!account?.access_token || !account?.refresh_token) {
      console.warn('No SoundCloud account tokens found for user:', session.user.id)
      return null
    }

    // Check if token needs refresh (SoundCloud tokens expire after 1 hour)
    const tokenExpiresAt = account.expires_at ? new Date(account.expires_at * 1000) : new Date(0)
    const now = new Date()
    const shouldRefresh = tokenExpiresAt.getTime() - now.getTime() < 5 * 60 * 1000 // Refresh 5 minutes early

    if (shouldRefresh) {
      console.log('Refreshing SoundCloud token for user:', session.user.id)
      const newAccessToken = await refreshSoundCloudToken(account.refresh_token)
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
      } else {
        console.error('Failed to refresh SoundCloud token for user:', session.user.id)
        return null
      }
    }

    return account.access_token
  } catch (error) {
    console.error('Error getting SoundCloud access token:', error)
    return null
  }
}

/**
 * Gets a client credentials token for public API access
 */
async function getSoundCloudClientToken(): Promise<string | null> {
  try {
    const response = await fetch('https://secure.soundcloud.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(
          `${process.env.SOUNDCLOUD_CLIENT_ID}:${process.env.SOUNDCLOUD_CLIENT_SECRET}`
        )}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    })

    if (!response.ok) {
      console.error('Failed to get SoundCloud client token:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting SoundCloud client token:', error)
    return null
  }
}

/**
 * Makes authenticated requests to the SoundCloud API
 */
async function soundcloudApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  useClientCredentials = false
): Promise<T | null> {
  try {
    let accessToken: string | null

    if (useClientCredentials) {
      accessToken = await getSoundCloudClientToken()
    } else {
      accessToken = await getSoundCloudAccessToken()
    }

    if (!accessToken) {
      throw new Error('No valid SoundCloud access token available')
    }

    const response = await fetch(`${SOUNDCLOUD_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `OAuth ${accessToken}`,
        'Accept': 'application/json; charset=utf-8',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`SoundCloud API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('SoundCloud API request failed:', error)
    return null
  }
}

/**
 * SoundCloud API Service Class
 */
export class SoundCloudService {
  /**
   * Search for tracks on SoundCloud
   */
  static async searchTracks(
    query: string, 
    limit = 20, 
    offset = 0,
    access: 'playable' | 'preview' | 'blocked' | 'all' = 'playable'
  ): Promise<SoundCloudSearchResult | null> {
    const encodedQuery = encodeURIComponent(query)
    const accessFilter = access !== 'all' ? `&access=${access}` : ''
    
    return soundcloudApiRequest(
      `/tracks?q=${encodedQuery}&limit=${limit}&offset=${offset}${accessFilter}&linked_partitioning=true`,
      {},
      true // Use client credentials for public search
    )
  }

  /**
   * Get a specific track by ID
   */
  static async getTrack(trackId: string): Promise<SoundCloudTrack | null> {
    return soundcloudApiRequest(`/tracks/${trackId}`, {}, true)
  }

  /**
   * Get track details including stream URL (requires authentication for private tracks)
   */
  static async getTrackWithStream(trackId: string): Promise<SoundCloudTrack | null> {
    return soundcloudApiRequest(`/tracks/${trackId}`)
  }

  /**
   * Get the current user's SoundCloud profile (requires authentication)
   */
  static async getCurrentUser(): Promise<SoundCloudUser | null> {
    return soundcloudApiRequest('/me')
  }

  /**
   * Get a user's profile by ID
   */
  static async getUser(userId: string): Promise<SoundCloudUser | null> {
    return soundcloudApiRequest(`/users/${userId}`, {}, true)
  }

  /**
   * Get a user's tracks
   */
  static async getUserTracks(
    userId: string, 
    limit = 50, 
    offset = 0
  ): Promise<{ collection: SoundCloudTrack[], next_href?: string } | null> {
    return soundcloudApiRequest(
      `/users/${userId}/tracks?limit=${limit}&offset=${offset}&linked_partitioning=true`,
      {},
      true
    )
  }

  /**
   * Resolve a SoundCloud URL to get resource information
   */
  static async resolveUrl(url: string): Promise<SoundCloudTrack | SoundCloudUser | null> {
    const encodedUrl = encodeURIComponent(url)
    return soundcloudApiRequest(`/resolve?url=${encodedUrl}`, {}, true)
  }

  /**
   * Get stream URL for a track (requires authentication for private tracks)
   */
  static async getStreamUrl(trackId: string): Promise<{ url: string } | null> {
    return soundcloudApiRequest(`/tracks/${trackId}/stream`)
  }

  /**
   * Search for users on SoundCloud
   */
  static async searchUsers(
    query: string,
    limit = 20,
    offset = 0
  ): Promise<{ collection: SoundCloudUser[], next_href?: string } | null> {
    const encodedQuery = encodeURIComponent(query)
    return soundcloudApiRequest(
      `/users?q=${encodedQuery}&limit=${limit}&offset=${offset}&linked_partitioning=true`,
      {},
      true
    )
  }
}

// Export utility functions for direct use
export { getSoundCloudAccessToken, refreshSoundCloudToken, soundcloudApiRequest, getSoundCloudClientToken }