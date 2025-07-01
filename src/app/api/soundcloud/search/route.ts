export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { SoundCloudService } from '@/lib/soundcloud'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const access = (searchParams.get('access') as 'playable' | 'preview' | 'blocked' | 'all') || 'playable'

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Search tracks on SoundCloud
    const searchResult = await SoundCloudService.searchTracks(query, limit, offset, access)

    if (!searchResult) {
      return NextResponse.json(
        { error: 'Failed to search tracks on SoundCloud' },
        { status: 500 }
      )
    }

    return NextResponse.json(searchResult)
  } catch (error) {
    console.error('Error searching SoundCloud tracks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}