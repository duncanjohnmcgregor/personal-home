import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { importedTracks, status, errorMessage, completedAt } = body

    // Verify the import history belongs to the user
    const existingImport = await prisma.importHistory.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingImport) {
      return NextResponse.json({ error: 'Import history not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (importedTracks !== undefined) updateData.importedTracks = importedTracks
    if (status !== undefined) updateData.status = status
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage
    if (completedAt !== undefined) updateData.completedAt = new Date(completedAt)

    const updatedImport = await prisma.importHistory.update({
      where: { id: params.id },
      data: updateData,
      include: {
        playlist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(updatedImport)
  } catch (error) {
    console.error('Error updating import history:', error)
    return NextResponse.json(
      { error: 'Failed to update import history' },
      { status: 500 }
    )
  }
}