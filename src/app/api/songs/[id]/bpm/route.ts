import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { bpm, confidence } = body

    if (!bpm || typeof bpm !== 'number' || bpm <= 0) {
      return NextResponse.json(
        { error: 'Valid BPM value is required' }, 
        { status: 400 }
      )
    }

    // Check if song exists
    const existingSong = await prisma.song.findUnique({
      where: { id: params.id }
    })

    if (!existingSong) {
      return NextResponse.json(
        { error: 'Song not found' }, 
        { status: 404 }
      )
    }

    // Update song with BPM
    const updatedSong = await prisma.song.update({
      where: { id: params.id },
      data: {
        bpm: Math.round(bpm), // Round to nearest integer
      },
    })

    // Log the BPM detection for analytics (optional)
    console.log(`BPM updated for song "${existingSong.title}" by ${existingSong.artist}: ${bpm} BPM (confidence: ${confidence || 'unknown'})`)

    return NextResponse.json({
      song: updatedSong,
      message: 'BPM updated successfully'
    })
  } catch (error) {
    console.error('Error updating song BPM:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get song with BPM
    const song = await prisma.song.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        artist: true,
        bpm: true,
        updatedAt: true
      }
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(song)
  } catch (error) {
    console.error('Error fetching song BPM:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}