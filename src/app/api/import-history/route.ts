import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const importHistory = await prisma.importHistory.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        playlist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.importHistory.count({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      items: importHistory,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching import history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import history' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      spotifyPlaylistId, 
      playlistName, 
      totalTracks, 
      playlistId 
    } = body

    const importHistory = await prisma.importHistory.create({
      data: {
        userId: session.user.id,
        spotifyPlaylistId,
        playlistName,
        totalTracks,
        importedTracks: 0,
        status: 'PENDING',
        playlistId,
      },
    })

    return NextResponse.json(importHistory)
  } catch (error) {
    console.error('Error creating import history:', error)
    return NextResponse.json(
      { error: 'Failed to create import history' },
      { status: 500 }
    )
  }
}