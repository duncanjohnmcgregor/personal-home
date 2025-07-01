export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdatePlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100, 'Playlist name too long').optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdatePlaylistSchema.parse(body)

    // Check if playlist exists and belongs to user
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingPlaylist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    const updatedPlaylist = await prisma.playlist.update({
      where: {
        id: params.id,
      },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.isPublic !== undefined && { isPublic: validatedData.isPublic }),
        updatedAt: new Date(),
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

    console.error('Error updating playlist:', error)
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

    // Check if playlist exists and belongs to user
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingPlaylist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
    }

    await prisma.playlist.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: 'Playlist deleted successfully' })
  } catch (error) {
    console.error('Error deleting playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}