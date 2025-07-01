'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isLoading: boolean
  error: string | null
}

export interface AudioPlayerControls {
  play: (url: string) => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggle: (url: string) => void
}

export function useAudioPlayer(): [AudioPlayerState, AudioPlayerControls] {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false,
    error: null,
  })

  const [currentUrl, setCurrentUrl] = useState<string | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = state.volume
    }

    const audio = audioRef.current

    const handleLoadStart = () => {
      setState((prev: AudioPlayerState) => ({ ...prev, isLoading: true, error: null }))
    }

    const handleCanPlay = () => {
      setState((prev: AudioPlayerState) => ({ 
        ...prev, 
        isLoading: false, 
        duration: audio.duration || 0 
      }))
    }

    const handleTimeUpdate = () => {
      setState((prev: AudioPlayerState) => ({ 
        ...prev, 
        currentTime: audio.currentTime || 0 
      }))
    }

    const handleEnded = () => {
      setState((prev: AudioPlayerState) => ({ 
        ...prev, 
        isPlaying: false, 
        currentTime: 0 
      }))
    }

    const handleError = () => {
      setState((prev: AudioPlayerState) => ({ 
        ...prev, 
        isPlaying: false, 
        isLoading: false, 
        error: 'Failed to load audio' 
      }))
    }

    const handlePlay = () => {
      setState((prev: AudioPlayerState) => ({ ...prev, isPlaying: true }))
    }

    const handlePause = () => {
      setState((prev: AudioPlayerState) => ({ ...prev, isPlaying: false }))
    }

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    // Cleanup
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [state.volume])

  const play = useCallback((url: string) => {
    if (!audioRef.current) return

    const audio = audioRef.current

    // If it's a different URL, load the new audio
    if (currentUrl !== url) {
      audio.src = url
      setCurrentUrl(url)
    }

    audio.play().catch((error: any) => {
      console.error('Error playing audio:', error)
      setState((prev: AudioPlayerState) => ({ 
        ...prev, 
        error: 'Failed to play audio', 
        isPlaying: false 
      }))
    })
  }, [currentUrl])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setState((prev: AudioPlayerState) => ({ ...prev, currentTime: 0 }))
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setState((prev: AudioPlayerState) => ({ ...prev, volume: clampedVolume }))
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
  }, [])

  const toggle = useCallback((url: string) => {
    if (state.isPlaying && currentUrl === url) {
      pause()
    } else {
      play(url)
    }
  }, [state.isPlaying, currentUrl, play, pause])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  const controls: AudioPlayerControls = {
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggle,
  }

  return [state, controls]
}