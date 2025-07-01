import { Song } from '@/types'
import { createRealTimeBpmProcessor, getBiquadFilter } from 'realtime-bpm-analyzer'

export interface BPMAnalysisJob {
  id: string
  song: Song
  priority: 'high' | 'normal' | 'low'
  retries: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    bpm: number
    confidence: number
    timestamp: number
  }
  error?: string
}

export class BPMBackgroundService {
  private static instance: BPMBackgroundService | null = null
  private queue: BPMAnalysisJob[] = []
  private processing = false
  private audioContext: AudioContext | null = null
  private analyzer: AudioWorkletNode | null = null
  private filter: BiquadFilterNode | null = null
  private maxRetries = 3
  private maxConcurrent = 1 // Process one at a time to avoid audio conflicts
  private listeners: Set<(jobs: BPMAnalysisJob[]) => void> = new Set()

  private constructor() {
    this.initializeAudioContext()
  }

  static getInstance(): BPMBackgroundService {
    if (!BPMBackgroundService.instance) {
      BPMBackgroundService.instance = new BPMBackgroundService()
    }
    return BPMBackgroundService.instance
  }

  private async initializeAudioContext() {
    try {
      if (typeof window === 'undefined') return

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyzer = await createRealTimeBpmProcessor(this.audioContext, {
        continuousAnalysis: true,
        stabilizationTime: 15000, // 15 seconds for stable BPM
      })
      this.filter = getBiquadFilter(this.audioContext)

      console.log('BPM Background Service initialized')
    } catch (error) {
      console.error('Failed to initialize BPM Background Service:', error)
    }
  }

  addToQueue(song: Song, priority: 'high' | 'normal' | 'low' = 'normal'): string {
    // Skip if song already has BPM or no preview URL
    if (song.bpm || !song.previewUrl) {
      return ''
    }

    // Check if already in queue
    const existingJob = this.queue.find(job => job.song.id === song.id)
    if (existingJob) {
      // Update priority if higher
      if (priority === 'high' && existingJob.priority !== 'high') {
        existingJob.priority = 'high'
        this.sortQueue()
      }
      return existingJob.id
    }

    const job: BPMAnalysisJob = {
      id: `bpm-${song.id}-${Date.now()}`,
      song,
      priority,
      retries: 0,
      status: 'pending'
    }

    this.queue.push(job)
    this.sortQueue()
    this.notifyListeners()
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue()
    }

    return job.id
  }

  private sortQueue() {
    // Sort by priority: high -> normal -> low
    const priorityOrder = { high: 0, normal: 1, low: 2 }
    this.queue.sort((a, b) => {
      if (a.status !== 'pending' && b.status === 'pending') return 1
      if (a.status === 'pending' && b.status !== 'pending') return -1
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const pendingJobs = this.queue.filter(job => job.status === 'pending')
      if (pendingJobs.length === 0) break

      const job = pendingJobs[0]
      await this.processJob(job)
      
      // Small delay between jobs to prevent audio conflicts
      await this.sleep(1000)
    }

    this.processing = false
  }

  private async processJob(job: BPMAnalysisJob) {
    job.status = 'processing'
    this.notifyListeners()

    try {
      const result = await this.analyzeSong(job.song)
      
      if (result) {
        job.result = result
        job.status = 'completed'
        
        // Save to database
        await this.saveBPMToDatabase(job.song.id, result.bpm, result.confidence)
      } else {
        throw new Error('Failed to analyze BPM')
      }
    } catch (error) {
      job.retries++
      job.error = error instanceof Error ? error.message : 'Unknown error'
      
      if (job.retries >= this.maxRetries) {
        job.status = 'failed'
        console.error(`BPM analysis failed for ${job.song.title}:`, job.error)
      } else {
        job.status = 'pending'
        // Move to end of queue for retry
        const index = this.queue.indexOf(job)
        if (index > -1) {
          this.queue.splice(index, 1)
          this.queue.push(job)
        }
      }
    }

    this.notifyListeners()
  }

  private async analyzeSong(song: Song): Promise<{ bpm: number; confidence: number; timestamp: number } | null> {
    if (!song.previewUrl || !this.audioContext || !this.analyzer || !this.filter) {
      return null
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio(song.previewUrl!)
      audio.crossOrigin = 'anonymous'
      audio.volume = 0.1 // Keep volume low for background processing
      
      let source: MediaElementAudioSourceNode | null = null
      let resolved = false
      let bpmResults: Array<{ bpm: number; confidence: number; timestamp: number }> = []
      
      const cleanup = () => {
        if (source) {
          source.disconnect()
        }
        if (this.analyzer) {
          this.analyzer.port.onmessage = null
        }
        audio.pause()
        audio.src = ''
      }

      const handleResult = () => {
        if (resolved) return
        resolved = true
        cleanup()
        
        if (bpmResults.length > 0) {
          // Get the most confident result
          const bestResult = bpmResults.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
          )
          resolve(bestResult)
        } else {
          reject(new Error('No BPM detected'))
        }
      }

      // Set up BPM detection
      if (this.analyzer) {
        this.analyzer.port.onmessage = (event) => {
          if (event.data.message === 'BPM' || event.data.message === 'BPM_STABLE') {
            const bpm = event.data.data.bpm
            const confidence = event.data.message === 'BPM_STABLE' ? 1.0 : 0.7
            
            bpmResults.push({
              bpm: Math.round(bpm),
              confidence,
              timestamp: Date.now()
            })

            // If we get a stable result, finish early
            if (event.data.message === 'BPM_STABLE') {
              handleResult()
            }
          }
        }
      }

      audio.onloadeddata = async () => {
        try {
          if (!this.audioContext || !this.analyzer || !this.filter) {
            throw new Error('Audio context not initialized')
          }

          source = this.audioContext.createMediaElementSource(audio)
          source.connect(this.filter)
          this.filter.connect(this.analyzer)
          // Don't connect to destination to avoid playback

          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume()
          }

          await audio.play()
        } catch (error) {
          reject(error)
        }
      }

      audio.onended = () => {
        handleResult()
      }

      audio.onerror = () => {
        reject(new Error('Failed to load audio'))
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          cleanup()
          reject(new Error('Analysis timeout'))
        }
      }, 30000)
    })
  }

  private async saveBPMToDatabase(songId: string, bpm: number, confidence: number) {
    try {
      const response = await fetch(`/api/songs/${songId}/bpm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bpm, confidence })
      })

      if (!response.ok) {
        throw new Error('Failed to save BPM to database')
      }
    } catch (error) {
      console.error('Error saving BPM to database:', error)
      throw error
    }
  }

  // Helper method for sleep
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public methods for monitoring
  getQueue(): BPMAnalysisJob[] {
    return [...this.queue]
  }

  getQueueStatus() {
    const pending = this.queue.filter(job => job.status === 'pending').length
    const processing = this.queue.filter(job => job.status === 'processing').length
    const completed = this.queue.filter(job => job.status === 'completed').length
    const failed = this.queue.filter(job => job.status === 'failed').length

    return { pending, processing, completed, failed, total: this.queue.length }
  }

  subscribe(listener: (jobs: BPMAnalysisJob[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.queue]))
  }

  // Clean up completed/failed jobs older than 1 hour
  cleanupOldJobs() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    this.queue = this.queue.filter(job => {
      if (job.status === 'pending' || job.status === 'processing') {
        return true
      }
      return job.result?.timestamp ? job.result.timestamp > oneHourAgo : true
    })
    this.notifyListeners()
  }

  // Clear all jobs
  clearQueue() {
    this.queue = []
    this.notifyListeners()
  }
}

// Export singleton instance
export const bpmBackgroundService = BPMBackgroundService.getInstance()