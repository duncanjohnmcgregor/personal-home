'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Users } from 'lucide-react'

interface ConnectButtonProps {
  platformName: string
  comingSoon?: boolean
  disabled?: boolean
  className?: string
}

export function ConnectButton({ 
  platformName, 
  comingSoon = false, 
  disabled = false,
  className = "w-full" 
}: ConnectButtonProps) {
  const handleConnect = async () => {
    const providerMap: { [key: string]: string } = {
      'SoundCloud': 'soundcloud',
      'Beatport': 'beatport',
      'Spotify': 'spotify'
    }

    const providerId = providerMap[platformName]
    
    if (providerId) {
      // Use NextAuth to connect to the specified provider
      await signIn(providerId, { 
        callbackUrl: '/dashboard/connect',
        redirect: true 
      })
    } else {
      console.log(`Provider ${platformName} not yet implemented`)
    }
  }

  if (comingSoon) {
    return (
      <Button 
        disabled 
        className={className}
        variant="outline"
      >
        <Users className="w-4 h-4 mr-2" />
        Coming Soon
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleConnect}
      className={className}
      disabled={disabled}
    >
      <ExternalLink className="w-4 h-4 mr-2" />
      Connect {platformName}
    </Button>
  )
}