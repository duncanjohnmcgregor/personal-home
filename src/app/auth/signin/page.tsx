'use client'

import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import SignInContent from './signin-content'

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <LoadingSpinner />
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}