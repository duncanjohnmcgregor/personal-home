'use client'

import { useState, useEffect } from 'react'
import { useBPMAnalyzer } from '@/lib/hooks/use-bpm-analyzer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, Pause, RotateCcw, Activity, AlertCircle, Music } from 'lucide-react'
import { Song } from '@/types'

interface BPMAnalyzerProps {
  song: Song
  onBPMDetected?: (bpm: number, confidence: number) => void
  className?: string
}

function BPMAnalyzer({ song, onBPMDetected, className }: BPMAnalyzerProps) {
  const {
    isAnalyzing,
    currentBPM,
    confidence,
    error,
    results,
    analyzeFromURL,
    stopAnalysis,
    getAverageBPM,
    isSupported
  } = useBPMAnalyzer()

  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [stableBPM, setStableBPM] = useState<number | null>(null)

  // Update progress based on analysis time
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + 2 // Increment by 2% every 400ms
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 400)

      return () => clearInterval(interval)
    } else {
      setAnalysisProgress(0)
    }
  }, [isAnalyzing])

  // Calculate stable BPM from recent results
  useEffect(() => {
    if (results.length >= 3) {
      const averageBPM = getAverageBPM()
      if (averageBPM && averageBPM !== stableBPM) {
        setStableBPM(averageBPM)
        onBPMDetected?.(averageBPM, confidence)
      }
    }
  }, [results, getAverageBPM, confidence, stableBPM, onBPMDetected])

  const handleStartAnalysis = async () => {
    if (!song.previewUrl) {
      return
    }
    
    setStableBPM(null)
    await analyzeFromURL(song.previewUrl)
  }

  const handleStopAnalysis = () => {
    stopAnalysis()
    setStableBPM(null)
  }

  const handleReset = () => {
    stopAnalysis()
    setStableBPM(null)
    setAnalysisProgress(0)
  }

  if (!isSupported) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          BPM analysis is not supported in this browser. Web Audio API is required.
        </AlertDescription>
      </Alert>
    )
  }

  if (!song.previewUrl) {
    return (
      <Alert className={className}>
        <Music className="h-4 w-4" />
        <AlertDescription>
          No preview URL available for this song. BPM analysis requires an audio preview.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          BPM Analyzer
        </CardTitle>
        <CardDescription>
          Analyze the BPM of &quot;{song.title}&quot; by {song.artist}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>

          {isAnalyzing && (
            <Button
              onClick={handleStopAnalysis}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Stop
            </Button>
          )}

          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Analysis Progress</span>
              <span>{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="w-full" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Current BPM</div>
            <div className="flex items-center gap-2">
              {currentBPM ? (
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {currentBPM} BPM
                </Badge>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Stable BPM</div>
            <div className="flex items-center gap-2">
              {stableBPM ? (
                <Badge variant="default" className="text-lg px-3 py-1">
                  {stableBPM} BPM
                </Badge>
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </div>
          </div>
        </div>

        {confidence > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Confidence</span>
              <span className="text-muted-foreground">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <Progress value={confidence * 100} className="w-full" />
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Results</div>
            <div className="max-h-24 overflow-y-auto space-y-1">
              {results.slice(-5).reverse().map((result, index) => (
                <div
                  key={`${result.timestamp}-${index}`}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span>{result.bpm} BPM</span>
                  <span>{Math.round(result.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { BPMAnalyzer }
export default BPMAnalyzer