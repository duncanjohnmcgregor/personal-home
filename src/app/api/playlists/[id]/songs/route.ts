export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const AddSongSchema = z.object({
  songId: z.string().min(1, 'Song ID is required'),
  position: z.number().int().min(0).optional(),
})

const RemoveSongSchema = z.object({
  songId: z.string().min(1, 'Song ID is required'),
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = AddSongSchema.parse(body)

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        songs: {
          orderBy: {
            position: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Check if song exists
    const song = await prisma.song.findUnique({
      where: {
        id: validatedData.songId,
      },
    })

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    // Check if song is already in playlist
    const existingPlaylistSong = await prisma.playlistSong.findUnique({
      where: {
        playlistId_songId: {
          playlistId: params.id,
          songId: validatedData.songId,
        },
      },
    })

    if (existingPlaylistSong) {
      return NextResponse.json({ error: 'Song already in playlist' }, { status: 409 })
    }

    // Determine position for new song
    const position = validatedData.position ?? (playlist.songs[0]?.position ?? -1) + 1

    const playlistSong = await prisma.playlistSong.create({
      data: {
        playlistId: params.id,
        songId: validatedData.songId,
        position,
      },
      include: {
        song: true,
      },
    })

    // Update playlist's updatedAt
    await prisma.playlist.update({
      where: {
        id: params.id,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(playlistSong, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding song to playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = RemoveSongSchema.parse(body)

    // Check if playlist exists and belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    // Check if song is in playlist
    const playlistSong = await prisma.playlistSong.findUnique({
      where: {
        playlistId_songId: {
          playlistId: params.id,
          songId: validatedData.songId,
        },
      },
    })

    if (!playlistSong) {
      return NextResponse.json({ error: 'Song not found in playlist' }, { status: 404 })
    }

    await prisma.playlistSong.delete({
      where: {
        playlistId_songId: {
          playlistId: params.id,
          songId: validatedData.songId,
        },
      },
    })

    // Update playlist's updatedAt
    await prisma.playlist.update({
      where: {
        id: params.id,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Song removed from playlist successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error removing song from playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}