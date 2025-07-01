'use client'

import { useEffect } from 'react'
import { Song } from '@/types'
import { bpmBackgroundService } from '@/lib/services/bpm-background-service'

interface BPMAutoAnalyzerProps {
  songs: Song[]
  enabled?: boolean
  priority?: 'high' | 'normal' | 'low'
}

export function BPMAutoAnalyzer({ 
  songs, 
  enabled = true, 
  priority = 'normal' 
}: BPMAutoAnalyzerProps) {
  useEffect(() => {
    if (!enabled) return

    // Add songs to analysis queue if they don't have BPM and have preview URLs
    const songsToAnalyze = songs.filter(song => 
      !song.bpm && song.previewUrl && song.id
    )

    songsToAnalyze.forEach(song => {
      bpmBackgroundService.addToQueue(song, priority)
    })
  }, [songs, enabled, priority])

  // This component doesn't render anything
  return null
}

// Hook version for easier integration
export function useBPMAutoAnalyzer(
  songs: Song[], 
  enabled = true, 
  priority: 'high' | 'normal' | 'low' = 'normal'
) {
  useEffect(() => {
    if (!enabled) return

    const songsToAnalyze = songs.filter(song => 
      !song.bpm && song.previewUrl && song.id
    )

    songsToAnalyze.forEach(song => {
      bpmBackgroundService.addToQueue(song, priority)
    })
  }, [songs, enabled, priority])
}