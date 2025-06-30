import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      environment: 'production',
      cron: true
    }

    // Log the health check for monitoring
    console.log('Cron health check executed:', healthData)

    return NextResponse.json(healthData, { status: 200 })
  } catch (error) {
    console.error('Cron health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        cron: true
      },
      { status: 503 }
    )
  }
} 