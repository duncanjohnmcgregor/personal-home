import { useState, useEffect, useCallback } from 'react'
import { Song } from '@/types'
import { bpmBackgroundService, BPMAnalysisJob } from '@/lib/services/bpm-background-service'

export function useBPMBackground() {
  const [jobs, setJobs] = useState<BPMAnalysisJob[]>([])
  const [status, setStatus] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  })

  useEffect(() => {
    const unsubscribe = bpmBackgroundService.subscribe((updatedJobs) => {
      setJobs(updatedJobs)
      setStatus(bpmBackgroundService.getQueueStatus())
    })

    // Initial load
    setJobs(bpmBackgroundService.getQueue())
    setStatus(bpmBackgroundService.getQueueStatus())

    return unsubscribe
  }, [])

  const addToQueue = useCallback((song: Song, priority: 'high' | 'normal' | 'low' = 'normal') => {
    return bpmBackgroundService.addToQueue(song, priority)
  }, [])

  const addMultipleToQueue = useCallback((songs: Song[], priority: 'high' | 'normal' | 'low' = 'normal') => {
    const jobIds: string[] = []
    songs.forEach((song: Song) => {
      const jobId = bpmBackgroundService.addToQueue(song, priority)
      if (jobId) jobIds.push(jobId)
    })
    return jobIds
  }, [])

  const getJobForSong = useCallback((songId: string) => {
    return jobs.find(job => job.song.id === songId)
  }, [jobs])

  const getSongBPM = useCallback((songId: string) => {
    const job = getJobForSong(songId)
    return job?.result?.bpm || null
  }, [getJobForSong])

  const isSongBeingAnalyzed = useCallback((songId: string) => {
    const job = getJobForSong(songId)
    return job?.status === 'processing'
  }, [getJobForSong])

  const isSongInQueue = useCallback((songId: string) => {
    const job = getJobForSong(songId)
    return job?.status === 'pending'
  }, [getJobForSong])

  const clearQueue = useCallback(() => {
    bpmBackgroundService.clearQueue()
  }, [])

  const cleanupOldJobs = useCallback(() => {
    bpmBackgroundService.cleanupOldJobs()
  }, [])

  return {
    jobs,
    status,
    addToQueue,
    addMultipleToQueue,
    getJobForSong,
    getSongBPM,
    isSongBeingAnalyzed,
    isSongInQueue,
    clearQueue,
    cleanupOldJobs
  }
}

// Auto-cleanup old jobs every 30 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    bpmBackgroundService.cleanupOldJobs()
  }, 30 * 60 * 1000)
}