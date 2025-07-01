import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disconnectProvider, type Provider } from '@/lib/multi-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await request.json()

    const validProviders = ['spotify', 'soundcloud', 'beatport']
    if (!provider || validProviders.indexOf(provider) === -1) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    const success = await disconnectProvider(session.user.id, provider as Provider)

    if (success) {
      return NextResponse.json({ message: `${provider} disconnected successfully` })
    } else {
      return NextResponse.json({ error: 'Failed to disconnect provider' }, { status: 500 })
    }
  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}