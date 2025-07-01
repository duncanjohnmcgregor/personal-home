import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SpotifyService } from '@/lib/spotify'
import { SoundCloudService } from '@/lib/soundcloud'
import { BeatportService } from '@/lib/beatport'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

interface UnifiedSearchResult {
  platform: 'spotify' | 'soundcloud' | 'beatport'
  tracks: any[]
  total?: number
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const platforms = searchParams.get('platforms')?.split(',') || ['spotify', 'soundcloud', 'beatport']
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    const results: UnifiedSearchResult[] = []

    // Search across selected platforms in parallel
    const searchPromises = platforms.map(async (platform): Promise<UnifiedSearchResult> => {
      try {
        switch (platform) {
          case 'spotify':
            const spotifyResult = await SpotifyService.search(query, 'track', limit, offset)
            return {
              platform: 'spotify',
              tracks: spotifyResult?.tracks?.items || [],
              total: spotifyResult?.tracks?.total || 0,
            }

          case 'soundcloud':
            const soundcloudResult = await SoundCloudService.searchTracks(query, limit, offset)
            return {
              platform: 'soundcloud',
              tracks: soundcloudResult?.collection || [],
              total: soundcloudResult?.total_results || 0,
            }

          case 'beatport':
            const beatportResult = await BeatportService.searchTracks(query, 1, limit)
            return {
              platform: 'beatport',
              tracks: beatportResult?.tracks?.data || [],
              total: beatportResult?.tracks?.count || 0,
            }

          default:
            return {
              platform: platform as any,
              tracks: [],
              error: `Unknown platform: ${platform}`,
            }
        }
      } catch (error) {
        console.error(`Error searching ${platform}:`, error)
        return {
          platform: platform as any,
          tracks: [],
          error: `Failed to search ${platform}`,
        }
      }
    })

    const searchResults = await Promise.all(searchPromises)

    // Combine results
    const response = {
      query,
      platforms,
      results: searchResults,
      totalTracks: searchResults.reduce((sum, result) => sum + result.tracks.length, 0),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in unified search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}