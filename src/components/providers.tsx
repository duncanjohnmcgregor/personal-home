'use client'

import { SessionProvider } from 'next-auth/react'
import { PreviewPlayerProvider } from '@/lib/contexts/preview-player-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PreviewPlayerProvider>
        {children}
      </PreviewPlayerProvider>
    </SessionProvider>
  )
}