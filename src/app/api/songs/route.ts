import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { 
      title, 
      artist, 
      album, 
      duration, 
      spotifyId, 
      soundcloudId, 
      beatportId, 
      previewUrl, 
      image, 
      isrc 
    } = body

    if (!title || !artist) {
      return NextResponse.json(
        { error: 'Title and artist are required' }, 
        { status: 400 }
      )
    }

    // Check if song already exists by platform ID
    let existingSong = null
    
    if (spotifyId) {
      existingSong = await prisma.song.findUnique({
        where: { spotifyId }
      })
    } else if (soundcloudId) {
      existingSong = await prisma.song.findFirst({
        where: { soundcloudId }
      })
    } else if (beatportId) {
      existingSong = await prisma.song.findFirst({
        where: { beatportId }
      })
    }
    
    if (existingSong) {
      return NextResponse.json(existingSong)
    }

    // Create new song
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        album,
        duration,
        spotifyId,
        soundcloudId,
        beatportId,
        previewUrl,
        image,
        isrc,
      },
    })

    return NextResponse.json(song)
  } catch (error) {
    console.error('Error creating song:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const search = searchParams.get('search')

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { artist: { contains: search, mode: 'insensitive' as const } },
            { album: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Fetch songs
    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.song.count({ where }),
    ])

    return NextResponse.json({
      songs,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error('Error fetching songs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}