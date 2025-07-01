import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Beatport API Base URL - v4
const BEATPORT_API_BASE = 'https://api.beatport.com/v4'

// Types for Beatport API responses
export interface BeatportTrack {
  id: number
  name: string
  mix_name?: string
  artists: Array<{
    id: number
    name: string
  }>
  remixers?: Array<{
    id: number
    name: string
  }>
  release: {
    id: number
    name: string
    image: {
      id: number
      uri: string
      dynamic_uri: string
    }
  }
  duration: {
    minutes: number
    seconds: number
    milliseconds: number
  }
  bpm?: number
  key?: {
    camelot_name: string
    standard_name: string
  }
  genre: {
    id: number
    name: string
  }
  label: {
    id: number
    name: string
  }
  released: string
  price: {
    code: string
    symbol: string
    value: number
    display: string
  }
  url: string
  isrc?: string
}

export interface BeatportSearchResult {
  tracks: {
    data: BeatportTrack[]
    count: number
    page: number
    per_page: number
  }
}

export interface BeatportPurchase {
  id: string
  track_id: number
  user_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  price: number
  currency: string
  created_at: Date
  completed_at?: Date
  error_message?: string
}

/**
 * Gets Beatport API credentials from environment or database
 * Note: Beatport API requires authentication which may need to be configured
 */
async function getBeatportCredentials(): Promise<{ token: string } | null> {
  try {
    // For now, we'll use environment variables
    // In production, this might come from user OAuth tokens stored in the database
    const token = process.env.BEATPORT_API_TOKEN
    
    if (!token) {
      console.warn('No Beatport API token configured')
      return null
    }

    return { token }
  } catch (error) {
    console.error('Error getting Beatport credentials:', error)
    return null
  }
}

/**
 * Makes authenticated requests to the Beatport API
 */
async function beatportApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const credentials = await getBeatportCredentials()
    
    if (!credentials) {
      // Return mock data for development
      console.warn('No Beatport credentials available, returning mock data')
      return getMockData(endpoint) as T
    }

    const response = await fetch(`${BEATPORT_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Beatport API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Beatport API request failed:', error)
    // Return mock data in development
    if (process.env.NODE_ENV === 'development') {
      return getMockData(endpoint) as T
    }
    return null
  }
}

/**
 * Get mock data for development
 */
function getMockData(endpoint: string): any {
  if (endpoint.includes('/catalog/search')) {
    return {
      tracks: {
        data: [
          {
            id: 1,
            name: 'Sample Track',
            mix_name: 'Original Mix',
            artists: [{ id: 1, name: 'Sample Artist' }],
            release: {
              id: 1,
              name: 'Sample Release',
              image: {
                id: 1,
                uri: 'https://via.placeholder.com/500',
                dynamic_uri: 'https://via.placeholder.com/{w}x{h}'
              }
            },
            duration: {
              minutes: 6,
              seconds: 32,
              milliseconds: 392000
            },
            bpm: 128,
            key: {
              camelot_name: '8A',
              standard_name: 'A minor'
            },
            genre: {
              id: 5,
              name: 'House'
            },
            label: {
              id: 1,
              name: 'Sample Label'
            },
            released: '2024-01-01',
            price: {
              code: 'USD',
              symbol: '$',
              value: 2.49,
              display: '$2.49'
            },
            url: 'https://www.beatport.com/track/sample-track/1',
            isrc: 'USRC12345678'
          }
        ],
        count: 1,
        page: 1,
        per_page: 20
      }
    }
  }
  
  return null
}

/**
 * Beatport API Service Class
 */
export class BeatportService {
  /**
   * Search for tracks on Beatport
   */
  static async searchTracks(
    query: string,
    page = 1,
    perPage = 20,
    filters?: {
      genre_id?: number
      label_id?: number
      artist_id?: number
      bpm_min?: number
      bpm_max?: number
      key?: string
    }
  ): Promise<BeatportSearchResult | null> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      per_page: perPage.toString(),
    })

    // Add optional filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString())
        }
      })
    }

    return beatportApiRequest(`/catalog/search?${params.toString()}`)
  }

  /**
   * Get track details by ID
   */
  static async getTrack(trackId: number): Promise<BeatportTrack | null> {
    return beatportApiRequest(`/catalog/tracks/${trackId}`)
  }

  /**
   * Initiate a track purchase
   * Note: This is a placeholder - actual implementation would require
   * integration with Beatport's purchase API and payment processing
   */
  static async purchaseTrack(trackId: number): Promise<BeatportPurchase | null> {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        throw new Error('User not authenticated')
      }

      // In a real implementation, this would:
      // 1. Create a purchase intent with Beatport
      // 2. Handle payment processing
      // 3. Store the purchase record in our database
      
      // For now, create a mock purchase record
      // First, we need to create or find the song record
      const song = await prisma.song.findFirst({
        where: { beatportId: trackId.toString() }
      }) || await prisma.song.create({
        data: {
          title: 'Beatport Track',
          artist: 'Unknown Artist',
          beatportId: trackId.toString(),
        }
      })

      const purchase = await prisma.purchaseHistory.create({
        data: {
          userId: session.user.id,
          songId: song.id,
          platform: 'BEATPORT',
          status: 'PENDING',
          price: 2.49,
          currency: 'USD',
        },
      })

      return {
        id: purchase.id,
        track_id: trackId,
        user_id: session.user.id,
        status: purchase.status.toLowerCase() as any,
        price: purchase.price || 0,
        currency: purchase.currency || 'USD',
        created_at: purchase.createdAt,
        completed_at: purchase.status === 'COMPLETED' ? purchase.updatedAt : undefined,
        error_message: undefined,
      }
    } catch (error) {
      console.error('Error creating purchase:', error)
      return null
    }
  }

  /**
   * Get purchase status
   */
  static async getPurchaseStatus(purchaseId: string): Promise<BeatportPurchase | null> {
    try {
      const purchase = await prisma.purchaseHistory.findUnique({
        where: { id: purchaseId },
        include: { song: true }
      })

      if (!purchase || !purchase.song.beatportId) {
        return null
      }

      return {
        id: purchase.id,
        track_id: parseInt(purchase.song.beatportId),
        user_id: purchase.userId,
        status: purchase.status.toLowerCase() as any,
        price: purchase.price || 0,
        currency: purchase.currency || 'USD',
        created_at: purchase.createdAt,
        completed_at: purchase.status === 'COMPLETED' ? purchase.updatedAt : undefined,
        error_message: undefined,
      }
    } catch (error) {
      console.error('Error getting purchase status:', error)
      return null
    }
  }

  /**
   * Get user's purchase history
   */
  static async getPurchaseHistory(
    limit = 50,
    offset = 0
  ): Promise<{ purchases: BeatportPurchase[], total: number } | null> {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return null
      }

      const [purchases, total] = await Promise.all([
        prisma.purchaseHistory.findMany({
          where: {
            userId: session.user.id,
            platform: 'BEATPORT',
          },
          include: { song: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.purchaseHistory.count({
          where: {
            userId: session.user.id,
            platform: 'BEATPORT',
          },
        }),
      ])

      return {
        purchases: purchases
          .filter(p => p.song.beatportId)
          .map(p => ({
            id: p.id,
            track_id: parseInt(p.song.beatportId!),
            user_id: p.userId,
            status: p.status.toLowerCase() as any,
            price: p.price || 0,
            currency: p.currency || 'USD',
            created_at: p.createdAt,
            completed_at: p.status === 'COMPLETED' ? p.updatedAt : undefined,
            error_message: undefined,
          })),
        total,
      }
    } catch (error) {
      console.error('Error getting purchase history:', error)
      return null
    }
  }
}

// Export utility functions for direct use
export { getBeatportCredentials, beatportApiRequest }