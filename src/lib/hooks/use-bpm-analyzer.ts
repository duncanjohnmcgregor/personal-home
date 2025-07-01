import { useState, useCallback, useRef, useEffect } from 'react'
import { createRealTimeBpmProcessor, getBiquadFilter } from 'realtime-bpm-analyzer'

export interface BPMAnalysisResult {
  bpm: number
  confidence: number
  timestamp: number
}

export interface BPMAnalysisState {
  isAnalyzing: boolean
  currentBPM: number | null
  confidence: number
  error: string | null
  results: BPMAnalysisResult[]
}

export function useBPMAnalyzer() {
  const [state, setState] = useState<BPMAnalysisState>({
    isAnalyzing: false,
    currentBPM: null,
    confidence: 0,
    error: null,
    results: []
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyzerRef = useRef<AudioWorkletNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)

  const initializeAnalyzer = useCallback(async () => {
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Initialize BPM analyzer with AudioWorkletProcessor
      analyzerRef.current = await createRealTimeBpmProcessor(audioContextRef.current, {
        continuousAnalysis: true,
        stabilizationTime: 20000, // 20 seconds for stable BPM
      })

      // Create lowpass filter
      filterRef.current = getBiquadFilter(audioContextRef.current)

      // Set up BPM detection callback
      analyzerRef.current.port.onmessage = (event) => {
        if (event.data.message === 'BPM' || event.data.message === 'BPM_STABLE') {
          const bpm = event.data.data.bpm
          const confidence = event.data.message === 'BPM_STABLE' ? 1.0 : 0.7
          
          const result: BPMAnalysisResult = {
            bpm: Math.round(bpm),
            confidence,
            timestamp: Date.now()
          }

          setState(prev => ({
            ...prev,
            currentBPM: result.bpm,
            confidence,
            results: [...prev.results, result]
          }))
        }
      }

      return true
    } catch (error) {
      console.error('Failed to initialize BPM analyzer:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize analyzer'
      }))
      return false
    }
  }, [])

  const analyzeFromURL = useCallback(async (previewUrl: string) => {
    if (!previewUrl) {
      setState(prev => ({ ...prev, error: 'No preview URL provided' }))
      return
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      currentBPM: null,
      confidence: 0,
      results: []
    }))

    try {
      // Initialize analyzer if not already done
      if (!analyzerRef.current) {
        const initialized = await initializeAnalyzer()
        if (!initialized) return
      }

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio()
        audioRef.current.crossOrigin = 'anonymous'
        audioRef.current.preload = 'auto'
      }

      // Set up audio source
      audioRef.current.src = previewUrl
      
      // Create audio source node if not exists
      if (!sourceRef.current && audioContextRef.current && analyzerRef.current && filterRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
        // Connect: source -> lowpass filter -> analyzer
        sourceRef.current.connect(filterRef.current)
        filterRef.current.connect(analyzerRef.current)
        // Also connect to destination for audio playback
        sourceRef.current.connect(audioContextRef.current.destination)
      }

      // Handle audio events
      audioRef.current.onloadeddata = () => {
        console.log('Audio loaded, starting analysis...')
      }

      audioRef.current.onended = () => {
        setState(prev => ({ ...prev, isAnalyzing: false }))
      }

      audioRef.current.onerror = (error) => {
        console.error('Audio error:', error)
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: 'Failed to load audio'
        }))
      }

      // Resume audio context if suspended
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // Start playback and analysis
      await audioRef.current.play()
      
    } catch (error) {
      console.error('BPM analysis error:', error)
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }))
    }
  }, [initializeAnalyzer])

  const stopAnalysis = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    
    setState(prev => ({ ...prev, isAnalyzing: false }))
  }, [])

  const getAverageBPM = useCallback(() => {
    if (state.results.length === 0) return null
    
    // Get the most recent results (last 10 seconds worth)
    const recentResults = state.results.filter(
      result => Date.now() - result.timestamp < 10000
    )
    
    if (recentResults.length === 0) return state.currentBPM
    
    // Calculate weighted average based on confidence
    const totalWeight = recentResults.reduce((sum, result) => sum + result.confidence, 0)
    const weightedSum = recentResults.reduce(
      (sum, result) => sum + (result.bpm * result.confidence), 
      0
    )
    
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null
  }, [state.results, state.currentBPM])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      if (filterRef.current) {
        filterRef.current.disconnect()
        filterRef.current = null
      }
      if (analyzerRef.current) {
        analyzerRef.current.disconnect()
        analyzerRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  return {
    ...state,
    analyzeFromURL,
    stopAnalysis,
    getAverageBPM,
    isSupported: !!(window.AudioContext || (window as any).webkitAudioContext)
  }
}