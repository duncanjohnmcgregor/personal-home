import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color } = body

    // Verify the category belongs to the user
    const existingCategory = await prisma.playlistCategory.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const category = await prisma.playlistCategory.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color }),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating playlist category:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the category belongs to the user
    const existingCategory = await prisma.playlistCategory.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Remove category reference from all playlists in this category
    await prisma.playlist.updateMany({
      where: {
        categoryId: params.id,
        userId: session.user.id,
      },
      data: {
        categoryId: null,
      },
    })

    // Delete the category
    await prisma.playlistCategory.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting playlist category:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}