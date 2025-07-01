'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useAudioPlayer, AudioPlayerState, AudioPlayerControls } from '@/lib/hooks/use-audio-player'

interface PreviewPlayerState {
  currentSongId: string | null
  currentPreviewUrl: string | null
  audioState: AudioPlayerState
}

interface PreviewPlayerContextType extends PreviewPlayerState {
  playPreview: (songId: string, previewUrl: string) => void
  pausePreview: () => void
  stopPreview: () => void
  isPlaying: (songId: string) => boolean
  audioControls: AudioPlayerControls
}

const PreviewPlayerContext = createContext<PreviewPlayerContextType | undefined>(undefined)

export function PreviewPlayerProvider({ children }: { children: React.ReactNode }) {
  const [audioState, audioControls] = useAudioPlayer()
  const [currentSongId, setCurrentSongId] = useState<string | null>(null)
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null)

  const playPreview = useCallback((songId: string, previewUrl: string) => {
    if (currentSongId === songId && currentPreviewUrl === previewUrl) {
      // Same song, toggle play/pause
      if (audioState.isPlaying) {
        audioControls.pause()
      } else {
        audioControls.play(previewUrl)
      }
    } else {
      // New song, start playing
      setCurrentSongId(songId)
      setCurrentPreviewUrl(previewUrl)
      audioControls.play(previewUrl)
    }
  }, [currentSongId, currentPreviewUrl, audioState.isPlaying, audioControls])

  const pausePreview = useCallback(() => {
    audioControls.pause()
  }, [audioControls])

  const stopPreview = useCallback(() => {
    audioControls.stop()
    setCurrentSongId(null)
    setCurrentPreviewUrl(null)
  }, [audioControls])

  const isPlaying = useCallback((songId: string) => {
    return currentSongId === songId && audioState.isPlaying
  }, [currentSongId, audioState.isPlaying])

  // Reset current song when audio ends
  React.useEffect(() => {
    if (!audioState.isPlaying && audioState.currentTime === 0 && currentSongId) {
      setCurrentSongId(null)
      setCurrentPreviewUrl(null)
    }
  }, [audioState.isPlaying, audioState.currentTime, currentSongId])

  const value: PreviewPlayerContextType = {
    currentSongId,
    currentPreviewUrl,
    audioState,
    playPreview,
    pausePreview,
    stopPreview,
    isPlaying,
    audioControls,
  }

  return (
    <PreviewPlayerContext.Provider value={value}>
      {children}
    </PreviewPlayerContext.Provider>
  )
}

export function usePreviewPlayer() {
  const context = useContext(PreviewPlayerContext)
  if (context === undefined) {
    throw new Error('usePreviewPlayer must be used within a PreviewPlayerProvider')
  }
  return context
}