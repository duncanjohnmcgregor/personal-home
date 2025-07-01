'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface DisconnectButtonProps {
  provider: string
  className?: string
}

export function DisconnectButton({ provider, className = "" }: DisconnectButtonProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const router = useRouter()

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect from ${provider}?`)) {
      return
    }

    setIsDisconnecting(true)
    
    try {
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: provider.toLowerCase() }),
      })

      if (response.ok) {
        // Refresh the page to show updated connection status
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Failed to disconnect: ${error.error}`)
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      alert('Failed to disconnect. Please try again.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Button 
      onClick={handleDisconnect}
      variant="outline" 
      size="sm"
      className={`text-red-600 border-red-200 hover:bg-red-50 ${className}`}
      disabled={isDisconnecting}
    >
      <X className="w-4 h-4 mr-1" />
      {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
    </Button>
  )
}