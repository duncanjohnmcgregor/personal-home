import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { BeatportService } from '@/lib/beatport'

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trackId } = body

    if (!trackId || typeof trackId !== 'number') {
      return NextResponse.json({ error: 'Valid trackId is required' }, { status: 400 })
    }

    const purchase = await BeatportService.purchaseTrack(trackId)
    
    if (!purchase) {
      return NextResponse.json({ error: 'Failed to initiate purchase' }, { status: 500 })
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error purchasing Beatport track:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}