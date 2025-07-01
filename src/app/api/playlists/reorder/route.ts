import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reorderPlaylistsSchema = z.object({
  playlistIds: z.array(z.string()).min(1),
})

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { playlistIds } = reorderPlaylistsSchema.parse(body)

    // Verify all playlists belong to the user
    const playlists = await prisma.playlist.findMany({
      where: {
        id: { in: playlistIds },
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (playlists.length !== playlistIds.length) {
      return NextResponse.json(
        { error: 'Some playlists not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update positions in a transaction
    await prisma.$transaction(
      playlistIds.map((playlistId, index) =>
        prisma.playlist.update({
          where: { id: playlistId },
          data: { position: index },
        })
      )
    )

    // Fetch updated playlists with counts
    const updatedPlaylists = await prisma.playlist.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            songs: true,
          },
        },
        songs: {
          include: {
            song: true,
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    })

    return NextResponse.json({
      playlists: updatedPlaylists,
      message: 'Playlists reordered successfully',
    })
  } catch (error) {
    console.error('Error reordering playlists:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}