export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ReorderSongsSchema = z.object({
  songIds: z.array(z.string()).min(1, 'At least one song ID is required'),
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ReorderSongsSchema.parse(body)

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        songs: {
          include: {
            song: true,
          },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Verify all song IDs exist in the playlist
    const existingSongIds = playlist.songs.map(ps => ps.songId)
    const missingIds = validatedData.songIds.filter(id => !existingSongIds.includes(id))
    
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: 'Some songs not found in playlist', missingIds },
        { status: 400 }
      )
    }

    // Verify all playlist songs are included in the reorder
    if (validatedData.songIds.length !== existingSongIds.length) {
      return NextResponse.json(
        { error: 'All songs in playlist must be included in reorder' },
        { status: 400 }
      )
    }

    // Update positions in a transaction
    await prisma.$transaction(async (tx) => {
      // Update each song's position based on its new index
      for (let i = 0; i < validatedData.songIds.length; i++) {
        await tx.playlistSong.update({
          where: {
            playlistId_songId: {
              playlistId: params.id,
              songId: validatedData.songIds[i],
            },
          },
          data: {
            position: i,
          },
        })
      }

      // Update playlist's updatedAt
      await tx.playlist.update({
        where: {
          id: params.id,
        },
        data: {
          updatedAt: new Date(),
        },
      })
    })

    // Fetch the updated playlist with songs
    const updatedPlaylist = await prisma.playlist.findUnique({
      where: {
        id: params.id,
      },
      include: {
        songs: {
          include: {
            song: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            songs: true,
          },
        },
      },
    })

    return NextResponse.json(updatedPlaylist)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error reordering playlist songs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}