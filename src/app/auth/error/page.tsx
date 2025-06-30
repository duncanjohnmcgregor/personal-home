'use client'

import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import AuthErrorContent from './error-content'

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-lg">
          <CardContent className="flex items-center justify-center p-8">
            <LoadingSpinner />
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}