export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreatePlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100, 'Playlist name too long'),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const playlists = await prisma.playlist.findMany({
      where: {
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
      orderBy: [
        {
          position: 'asc',
        },
        {
          updatedAt: 'desc',
        },
      ],
      take: limit,
      skip: offset,
    })

    const totalCount = await prisma.playlist.count({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      playlists,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error('Error fetching playlists:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const validatedData = CreatePlaylistSchema.parse(body)

    const playlist = await prisma.playlist.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isPublic: validatedData.isPublic,
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

    return NextResponse.json(playlist, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating playlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}