'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CheckCircle, XCircle, Clock, Download } from 'lucide-react'

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
}

export function ImportProgress({ job }: ImportProgressProps) {
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
        return <Badge variant="secondary">Pending</Badge>
      case 'importing':
        return <Badge variant="default">Importing</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h4 className="font-medium">{job.playlistName}</h4>
                <p className="text-sm text-muted-foreground">
                  {job.importedTracks} of {job.totalTracks} tracks
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Progress Bar */}
          {(job.status === 'importing' || job.status === 'completed') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {job.status === 'failed' && job.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{job.error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}