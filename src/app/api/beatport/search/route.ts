import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BeatportService } from '@/lib/beatport'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')
    
    // Optional filters
    const filters = {
      genre_id: searchParams.get('genre_id') ? parseInt(searchParams.get('genre_id')!) : undefined,
      label_id: searchParams.get('label_id') ? parseInt(searchParams.get('label_id')!) : undefined,
      artist_id: searchParams.get('artist_id') ? parseInt(searchParams.get('artist_id')!) : undefined,
      bpm_min: searchParams.get('bpm_min') ? parseInt(searchParams.get('bpm_min')!) : undefined,
      bpm_max: searchParams.get('bpm_max') ? parseInt(searchParams.get('bpm_max')!) : undefined,
      key: searchParams.get('key') || undefined,
    }

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const results = await BeatportService.searchTracks(query, page, perPage, filters)
    
    if (!results) {
      return NextResponse.json({ error: 'Failed to search tracks' }, { status: 500 })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching Beatport tracks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}