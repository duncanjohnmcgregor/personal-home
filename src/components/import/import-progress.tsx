'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CheckCircle, XCircle, Clock, Download, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportJob {
  id: string
  playlistId: string
  playlistName: string
  totalTracks: number
  importedTracks: number
  status: 'pending' | 'importing' | 'completed' | 'failed'
  error?: string
}

interface ImportProgressProps {
  job: ImportJob

  isCurrentJob?: boolean
  queuePosition?: number
}

export function ImportProgress({ 
  job, 
  isCurrentJob = false,
  queuePosition
}: ImportProgressProps) {

  const progress = job.totalTracks > 0 ? (job.importedTracks / job.totalTracks) * 100 : 0

  const getStatusIcon = () => {
    switch (job.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />
      case 'importing':
        return <LoadingSpinner className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  const getStatusBadge = () => {
    switch (job.status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            {queuePosition !== undefined ? `#${queuePosition + 1} in Queue` : 'Pending'}
          </Badge>
        )
      case 'importing':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            {isCurrentJob ? 'Currently Importing' : 'Importing'}
          </Badge>
        )
      case 'completed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (compact) {
    return (
      <div className="import-queue-indicator">
        {getStatusIcon()}
        <span className="font-medium">{job.playlistName}</span>
        <span>({job.importedTracks}/{job.totalTracks})</span>
        {(job.status === 'importing' || job.status === 'completed') && (
          <div className="flex-1 max-w-24 ml-2">
            <div className="import-progress-bar">
              <div
                className="import-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={`transition-all duration-200 ${isCurrentJob ? 'ring-2 ring-blue-500 shadow-md' : ''}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium line-clamp-1" title={job.playlistName}>
                  {job.playlistName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {job.importedTracks} of {job.totalTracks} tracks
                  {job.status === 'importing' && isCurrentJob && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                      • Processing now
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              {getStatusBadge()}
              {job.status === 'importing' && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          {(job.status === 'importing' || job.status === 'completed') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>

              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                    job.status === 'completed' 
                      ? 'bg-green-500' 
                      : isCurrentJob 
                        ? 'bg-blue-500 animate-pulse' 
                        : 'bg-primary'
                  }`}
                  
                  style={{ width: `${progress}%` }}
                />
              </div>
              {job.status === 'importing' && isCurrentJob && (
                <div className="flex items-center justify-center text-xs text-blue-600 dark:text-blue-400">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse mr-2" />
                  Importing tracks...
                </div>
              )}
            </div>
          )}

          {/* Queue Position for Pending Jobs */}
          {job.status === 'pending' && queuePosition !== undefined && queuePosition > 0 && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                <Pause className="w-3 h-3 inline mr-1" />
                Waiting in queue - {queuePosition} playlist{queuePosition !== 1 ? 's' : ''} ahead
              </p>
            </div>
          )}

          {/* Error Message */}
          {job.status === 'failed' && job.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{job.error}</p>
            </div>
          )}

          {/* Success Summary */}
          {job.status === 'completed' && (
            <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-xs text-green-700 dark:text-green-300 text-center">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Successfully imported {job.importedTracks} track{job.importedTracks !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact progress summary for showing beneath playlist count
export function ImportProgressSummary({ jobs }: { jobs: ImportJob[] }) {
  if (jobs.length === 0) return null

  const totalTracks = jobs.reduce((sum, job) => sum + job.totalTracks, 0)
  const importedTracks = jobs.reduce((sum, job) => sum + job.importedTracks, 0)
  const progress = totalTracks > 0 ? (importedTracks / totalTracks) * 100 : 0

  const activeJobs = jobs.filter(job => job.status === 'importing' || job.status === 'pending')
  const completedJobs = jobs.filter(job => job.status === 'completed')
  const failedJobs = jobs.filter(job => job.status === 'failed')

  return (
    <div className="space-y-2 text-sm">
      <div className="import-queue-indicator">
        <LoadingSpinner className="w-3 h-3" />
        <span>Importing {activeJobs.length} playlist{activeJobs.length !== 1 ? 's' : ''}</span>
        <span className="text-muted-foreground">
          ({importedTracks}/{totalTracks} tracks)
        </span>
      </div>
      
      <div className="import-progress-bar">
        <div
          className="import-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {(completedJobs.length > 0 || failedJobs.length > 0) && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          {completedJobs.length > 0 && (
            <span className="text-green-600">
              {completedJobs.length} completed
            </span>
          )}
          {failedJobs.length > 0 && (
            <span className="text-red-600">
              {failedJobs.length} failed
            </span>
          )}
        </div>
      )}
    </div>
  )
}