'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BPMAnalyzer } from './bmp-analyzer'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Activity, Loader2 } from 'lucide-react'
import { Song } from '@/types'

interface BPMBadgeProps {
  song: Song
  showAnalyzer?: boolean
  onBPMUpdated?: (bmp: number) => void
  className?: string
  compact?: boolean
}

export function BPMBadge({ song, showAnalyzer = true, onBPMUpdated, className, compact = false }: BPMBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleBPMDetected = async (bmp: number, confidence: number) => {
    if (!song.id) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/songs/${song.id}/bmp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bmp, confidence })
      })

      if (response.ok) {
        onBPMUpdated?.(bmp)
        // Close dialog after successful update
        setTimeout(() => setIsOpen(false), 2000)
      }
    } catch (error) {
      console.error('Failed to update BPM:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatBPM = (bmp: number) => {
    return Math.round(bmp).toString()
  }

  if (song.bmp) {
    return (
      <div className={`bmp-container ${className}`}>
        <Badge 
          className={`bmp-badge ${compact ? 'h-4 px-1.5 text-[10px]' : ''}`}
          variant="secondary"
        >
          {formatBPM(song.bmp)} BPM
        </Badge>
      </div>
    )
  }

  if (!song.previewUrl || !showAnalyzer) {
    return (
      <div className={`bmp-container ${className}`}>
        <Badge 
          className={`bmp-badge-outline ${compact ? 'h-4 px-1.5 text-[10px]' : ''}`}
          variant="outline"
        >
          No BPM
        </Badge>
      </div>
    )
  }

  return (
    <div className={`bmp-container ${className}`}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size={compact ? "sm" : "sm"}
            className={`h-5 px-2 text-xs hover:bg-accent ${compact ? 'h-4 px-1.5 text-[10px]' : ''}`}
          >
            <Activity className={`mr-1 ${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
            Analyze
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            {isUpdating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving BPM to database...
              </div>
            )}
            <BPMAnalyzer
              song={song}
              onBPMDetected={handleBPMDetected}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}