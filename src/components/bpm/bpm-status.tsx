'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, Loader2, Clock, CheckCircle, X } from 'lucide-react'
import { useBPMBackground } from '@/lib/hooks/use-bpm-background'

interface BPMStatusProps {
  compact?: boolean
  className?: string
}

export function BPMStatus({ compact = false, className }: BPMStatusProps) {
  const { status, jobs, clearQueue } = useBPMBackground()

  // Don't show if no activity
  if (status.total === 0) {
    return null
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        {status.processing > 0 && (
          <div className="flex items-center gap-1 text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Analyzing BPM</span>
          </div>
        )}
        {status.pending > 0 && status.processing === 0 && (
          <div className="flex items-center gap-1 text-orange-600">
            <Clock className="h-3 w-3" />
            <span>{status.pending} queued</span>
          </div>
        )}
        {status.total > 0 && status.pending === 0 && status.processing === 0 && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>{status.completed} analyzed</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          BPM Analysis Queue
        </CardTitle>
        <CardDescription>
          Automatic background analysis of song tempo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Processing</div>
            <div className="font-medium">{status.processing}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Queued</div>
            <div className="font-medium">{status.pending}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Completed</div>
            <div className="font-medium text-green-600">{status.completed}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Failed</div>
            <div className="font-medium text-red-600">{status.failed}</div>
          </div>
        </div>

        {status.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((status.completed / status.total) * 100)}%</span>
            </div>
            <Progress 
              value={(status.completed / status.total) * 100} 
              className="w-full"
            />
          </div>
        )}

        {status.processing > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Currently Processing</div>
            {jobs
              .filter(job => job.status === 'processing')
              .slice(0, 3)
              .map(job => (
                <div key={job.id} className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span className="truncate">
                    {job.song.title} - {job.song.artist}
                  </span>
                </div>
              ))}
          </div>
        )}

        {status.pending > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Next in Queue</div>
            {jobs
              .filter(job => job.status === 'pending')
              .slice(0, 3)
              .map(job => (
                <div key={job.id} className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3 text-orange-600" />
                  <span className="truncate">
                    {job.song.title} - {job.song.artist}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {job.priority}
                  </Badge>
                </div>
              ))}
          </div>
        )}

        {status.total > 0 && (
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Total: {status.total} songs
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearQueue}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}