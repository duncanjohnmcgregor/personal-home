'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BPMAnalyzer } from './bpm-analyzer'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Activity, Loader2, Clock, AlertCircle } from 'lucide-react'
import { Song } from '@/types'
import { useBPMBackground } from '@/lib/hooks/use-bpm-background'
import { cn } from '@/lib/utils'

interface BPMBadgeEnhancedProps {
  song: Song
  showAnalyzer?: boolean
  autoAnalyze?: boolean
  priority?: 'high' | 'normal' | 'low'
  onBPMUpdated?: (bpm: number) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BPMBadgeEnhanced({ 
  song, 
  showAnalyzer = true, 
  autoAnalyze = true,
  priority = 'normal',
  onBPMUpdated, 
  className,
  size = 'sm'
}: BPMBadgeEnhancedProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localBPM, setLocalBPM] = useState<number | null>(song.bpm || null)
  
  const { 
    addToQueue, 
    getJobForSong, 
    getSongBPM, 
    isSongBeingAnalyzed, 
    isSongInQueue 
  } = useBPMBackground()

  // Auto-analyze on mount if enabled and conditions are met
  useEffect(() => {
    if (autoAnalyze && !song.bpm && song.previewUrl && song.id) {
      addToQueue(song, priority)
    }
  }, [autoAnalyze, song, priority, addToQueue])

  // Watch for BPM updates from background service
  useEffect(() => {
    if (song.id) {
      const detectedBPM = getSongBPM(song.id)
      if (detectedBPM && detectedBPM !== localBPM) {
        setLocalBPM(detectedBPM)
        onBPMUpdated?.(detectedBPM)
      }
    }
  }, [song.id, getSongBPM, localBPM, onBPMUpdated])

  const handleBPMDetected = async (bpm: number, confidence: number) => {
    setLocalBPM(bpm)
    onBPMUpdated?.(bpm)
    // Close dialog after successful update
    setTimeout(() => setIsOpen(false), 2000)
  }

  const handleManualAnalyze = () => {
    if (song.id) {
      addToQueue(song, 'high') // High priority for manual requests
    }
  }

  const isAnalyzing = song.id ? isSongBeingAnalyzed(song.id) : false
  const isQueued = song.id ? isSongInQueue(song.id) : false
  const job = song.id ? getJobForSong(song.id) : null

  // If song has BPM (either from DB or detected), show it
  if (localBPM) {
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-1',
      lg: 'text-base px-3 py-1.5'
    }

    return (
      <Badge 
        variant="secondary" 
        className={cn(sizeClasses[size], className)}
      >
        <Activity className="h-3 w-3 mr-1" />
        {localBPM} BPM
      </Badge>
    )
  }

  // If analyzing, show progress
  if (isAnalyzing) {
    return (
      <Badge 
        variant="outline" 
        className={cn('text-blue-600 border-blue-600/20 animate-pulse', className)}
      >
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Analyzing...
      </Badge>
    )
  }

  // If queued, show queue status
  if (isQueued) {
    return (
      <Badge 
        variant="outline" 
        className={cn('text-orange-600 border-orange-600/20', className)}
      >
        <Clock className="h-3 w-3 mr-1" />
        Queued
      </Badge>
    )
  }

  // If job failed, show error state
  if (job?.status === 'failed') {
    return (
      <Badge 
        variant="outline" 
        className={cn('text-red-600 border-red-600/20', className)}
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    )
  }

  // If no preview URL, show unavailable
  if (!song.previewUrl) {
    return (
      <Badge 
        variant="outline" 
        className={cn('text-muted-foreground', className)}
      >
        No Preview
      </Badge>
    )
  }

  // If analyzer is disabled, show static badge
  if (!showAnalyzer) {
    return (
      <Badge 
        variant="outline" 
        className={cn('text-muted-foreground', className)}
      >
        No BPM
      </Badge>
    )
  }

  // Default state - show analyze button
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn('h-6 px-2 text-xs hover:bg-muted', className)}
          onClick={handleManualAnalyze}
        >
          <Activity className="h-3 w-3 mr-1" />
          Analyze BPM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="space-y-4">
          <BPMAnalyzer
            song={song}
            onBPMDetected={handleBPMDetected}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Compact version for dense layouts
export function BPMBadgeCompact({ song, className }: { song: Song; className?: string }) {
  const { getSongBPM, isSongBeingAnalyzed, isSongInQueue } = useBPMBackground()
  
  const bpm = song.bpm || (song.id ? getSongBPM(song.id) : null)
  const isAnalyzing = song.id ? isSongBeingAnalyzed(song.id) : false
  const isQueued = song.id ? isSongInQueue(song.id) : false

  if (bpm) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        {bpm} BPM
      </span>
    )
  }

  if (isAnalyzing) {
    return (
      <span className={cn('text-xs text-blue-600 flex items-center gap-1', className)}>
        <Loader2 className="h-2 w-2 animate-spin" />
        Analyzing
      </span>
    )
  }

  if (isQueued) {
    return (
      <span className={cn('text-xs text-orange-600 flex items-center gap-1', className)}>
        <Clock className="h-2 w-2" />
        Queued
      </span>
    )
  }

  return null
}