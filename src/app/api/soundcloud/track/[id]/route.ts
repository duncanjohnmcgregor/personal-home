export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { SoundCloudService } from '@/lib/soundcloud'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      )
    }

    // Get track details from SoundCloud
    const track = await SoundCloudService.getTrack(id)

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found or failed to fetch from SoundCloud' },
        { status: 404 }
      )
    }

    return NextResponse.json(track)
  } catch (error) {
    console.error('Error fetching SoundCloud track:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}