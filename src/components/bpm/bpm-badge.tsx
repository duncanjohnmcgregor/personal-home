'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BPMAnalyzer } from './bpm-analyzer'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Activity, Loader2 } from 'lucide-react'
import { Song } from '@/types'

interface BPMBadgeProps {
  song: Song
  showAnalyzer?: boolean
  onBPMUpdated?: (bpm: number) => void
  className?: string
}

export function BPMBadge({ song, showAnalyzer = true, onBPMUpdated, className }: BPMBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleBPMDetected = async (bpm: number, confidence: number) => {
    if (!song.id) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/songs/${song.id}/bpm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bpm, confidence })
      })

      if (response.ok) {
        onBPMUpdated?.(bpm)
        // Close dialog after successful update
        setTimeout(() => setIsOpen(false), 2000)
      }
    } catch (error) {
      console.error('Failed to update BPM:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (song.bpm) {
    return (
      <Badge variant="secondary" className={className}>
        {song.bpm} BPM
      </Badge>
    )
  }

  if (!song.previewUrl || !showAnalyzer) {
    return (
      <Badge variant="outline" className={className}>
        No BPM
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs ${className}`}>
          <Activity className="h-3 w-3 mr-1" />
          Analyze BPM
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
  )
}