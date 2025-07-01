'use client'

import { useState } from 'react'
import { BPMAnalyzer } from '@/components/bpm/bpm-analyzer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Activity, Music } from 'lucide-react'
import { Song } from '@/types'

// Sample songs with preview URLs for demo
const sampleSongs: Song[] = [
  {
    id: '1',
    title: 'Blue Monday',
    artist: 'New Order',
    album: 'Power, Corruption & Lies',
    previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Demo URL
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Around the World',
    artist: 'Daft Punk',
    album: 'Homework',
    previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Demo URL
    createdAt: new Date(),
    updatedAt: new Date(),
  }
]

export default function BPMDemoPage() {
  const [selectedSong, setSelectedSong] = useState<Song>(sampleSongs[0])
  const [customSong, setCustomSong] = useState({
    title: '',
    artist: '',
    previewUrl: ''
  })
  const [detectedBPMs, setDetectedBPMs] = useState<Record<string, { bpm: number; confidence: number }>>({})

  const handleBPMDetected = (bpm: number, confidence: number) => {
    setDetectedBPMs(prev => ({
      ...prev,
      [selectedSong.id]: { bpm, confidence }
    }))
  }

  const handleCustomSongAnalysis = () => {
    if (!customSong.title || !customSong.artist || !customSong.previewUrl) {
      return
    }

    const newSong: Song = {
      id: 'custom-' + Date.now(),
      title: customSong.title,
      artist: customSong.artist,
      previewUrl: customSong.previewUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setSelectedSong(newSong)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Activity className="h-10 w-10" />
          BPM Analyzer Demo
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Analyze the beats per minute (BPM) of songs using real-time audio analysis.
          This feature uses the Web Audio API and realtime-bpm-analyzer library.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Song Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Select Song
              </CardTitle>
              <CardDescription>
                Choose a sample song or add your own preview URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sample Songs</Label>
                <div className="space-y-2">
                  {sampleSongs.map((song) => (
                    <Button
                      key={song.id}
                      variant={selectedSong.id === song.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedSong(song)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{song.title}</div>
                        <div className="text-sm text-muted-foreground">{song.artist}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label>Custom Song</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Song title"
                    value={customSong.title}
                    onChange={(e) => setCustomSong(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Input
                    placeholder="Artist name"
                    value={customSong.artist}
                    onChange={(e) => setCustomSong(prev => ({ ...prev, artist: e.target.value }))}
                  />
                  <Input
                    placeholder="Preview URL (MP3, WAV, FLAC)"
                    value={customSong.previewUrl}
                    onChange={(e) => setCustomSong(prev => ({ ...prev, previewUrl: e.target.value }))}
                  />
                  <Button 
                    onClick={handleCustomSongAnalysis}
                    disabled={!customSong.title || !customSong.artist || !customSong.previewUrl}
                    className="w-full"
                  >
                    Analyze Custom Song
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                BPM detection results for analyzed songs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(detectedBPMs).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No songs analyzed yet. Start an analysis to see results.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(detectedBPMs).map(([songId, result]) => {
                    const song = sampleSongs.find(s => s.id === songId) || selectedSong
                    return (
                      <div key={songId} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{song.title}</div>
                          <div className="text-sm text-muted-foreground">{song.artist}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            {result.bpm} BPM
                          </Badge>
                          <Badge variant="secondary">
                            {Math.round(result.confidence * 100)}%
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* BPM Analyzer */}
        <div>
          <BPMAnalyzer
            song={selectedSong}
            onBPMDetected={handleBPMDetected}
            className="h-fit"
          />
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="font-medium">1. Select a Song</div>
                <p className="text-sm text-muted-foreground">
                  Choose from sample songs or add your own preview URL. The song must have an audio preview available.
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium">2. Start Analysis</div>
                <p className="text-sm text-muted-foreground">
                  Click "Start Analysis" to begin BPM detection. The analyzer will play the preview and analyze the audio in real-time.
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium">3. View Results</div>
                <p className="text-sm text-muted-foreground">
                  Watch as the BPM is detected and stabilizes. The confidence level indicates how accurate the detection is.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}