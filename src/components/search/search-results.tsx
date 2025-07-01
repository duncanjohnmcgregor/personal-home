'use client'

import { useState } from 'react'
import { Play, Plus, ExternalLink, Clock, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { SearchTrack } from '@/lib/hooks/use-search'
import { toast } from '@/lib/hooks/use-toast'

interface SearchResultsProps {
  results: SearchTrack[]
  loading: boolean
  query: string
  totalResults: number
  onAddToPlaylist: (track: SearchTrack) => void
  onPlay?: (track: SearchTrack) => void
  currentlyPlaying?: string
  className?: string
}

const PLATFORM_COLORS = {
  spotify: 'bg-green-500',
  soundcloud: 'bg-orange-500',
  beatport: 'bg-purple-500',
}

const PLATFORM_LABELS = {
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  beatport: 'Beatport',
}

function formatDuration(ms?: number): string {
  if (!ms) return '--:--'
  
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function TrackItem({ 
  track, 
  onAddToPlaylist, 
  onPlay, 
  isPlaying 
}: { 
  track: SearchTrack
  onAddToPlaylist: (track: SearchTrack) => void
  onPlay?: (track: SearchTrack) => void
  isPlaying: boolean
}) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToPlaylist = async () => {
    setIsAdding(true)
    try {
      await onAddToPlaylist(track)
      // Toast is handled in the parent component (AddSongsDialog)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add track to playlist. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handlePlay = () => {
    if (onPlay) {
      onPlay(track)
    }
  }

  const handleExternalLink = () => {
    if (track.url) {
      window.open(track.url, '_blank')
    }
  }

  return (
    <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Album Art / Placeholder */}
      <div className="relative w-12 h-12 flex-shrink-0">
        {track.image ? (
          <img
            src={track.image}
            alt={`${track.name} cover`}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded flex items-center justify-center">
            <Music className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        
        {/* Play button overlay */}
        {onPlay && track.previewUrl && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePlay}
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white border-0"
          >
            <Play className={cn('h-4 w-4', isPlaying && 'animate-pulse')} />
          </Button>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium truncate">{track.name}</h4>
          <Badge 
            variant="outline" 
            className="text-xs flex items-center gap-1 flex-shrink-0"
          >
            <div className={cn('w-2 h-2 rounded-full', PLATFORM_COLORS[track.platform])} />
            {PLATFORM_LABELS[track.platform]}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{track.artist}</span>
          {track.album && (
            <>
              <span>•</span>
              <span className="truncate">{track.album}</span>
            </>
          )}
          {track.duration && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(track.duration)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddToPlaylist}
          disabled={isAdding}
          className="h-8"
        >
          {isAdding ? (
            <LoadingSpinner className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Add
        </Button>
        
        {track.url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExternalLink}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function SearchResults({
  results,
  loading,
  query,
  totalResults,
  onAddToPlaylist,
  onPlay,
  currentlyPlaying,
  className,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-muted-foreground">Searching across platforms...</p>
        </div>
      </div>
    )
  }

  if (!query) {
    return (
      <div className={cn('py-12', className)}>
        <EmptyState
          icon={Music}
          title="Start searching"
          description="Search for songs, artists, or albums across Spotify, SoundCloud, and Beatport."
        />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={cn('py-12', className)}>
        <EmptyState
          icon={Music}
          title="No results found"
          description={`No tracks found for &quot;${query}&quot;. Try adjusting your search terms or platform filters.`}
        />
      </div>
    )
  }

  // Group results by platform
  const groupedResults = results.reduce((acc, track) => {
    if (!acc[track.platform]) {
      acc[track.platform] = []
    }
    acc[track.platform].push(track)
    return acc
  }, {} as Record<string, SearchTrack[]>)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Results summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Search Results for &quot;{query}&quot;
        </h3>
        <Badge variant="secondary">
          {results.length} tracks found
        </Badge>
      </div>

      {/* Results grouped by platform */}
      {Object.entries(groupedResults).map(([platform, tracks]) => (
        <div key={platform} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS])} />
            <h4 className="font-medium">
              {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]} ({tracks.length})
            </h4>
          </div>
          
          <div className="space-y-1">
            {tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onAddToPlaylist={onAddToPlaylist}
                onPlay={onPlay}
                isPlaying={currentlyPlaying === track.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}