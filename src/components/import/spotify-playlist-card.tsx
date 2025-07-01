'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Music, Users, Lock, Globe, ExternalLink } from 'lucide-react'
import Image from 'next/image'

interface SpotifyPlaylist {
  id: string
  name: string
  description?: string
  public: boolean
  collaborative: boolean
  tracks: {
    total: number
  }
  images: Array<{
    url: string
    height?: number
    width?: number
  }>
  owner: {
    id: string
    display_name: string
  }
  external_urls: {
    spotify: string
  }
}

interface SpotifyPlaylistCardProps {
  playlist: SpotifyPlaylist
  selected: boolean
  onToggleSelect: () => void
  importing?: boolean
  queued?: boolean
}

export function SpotifyPlaylistCard({
  playlist,
  selected,
  onToggleSelect,
  importing = false,
  queued = false
}: SpotifyPlaylistCardProps) {
  const [imageError, setImageError] = useState(false)
  
  const playlistImage = playlist.images?.[0]?.url
  const trackCount = playlist.tracks.total

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle selection if clicking on external link
    if (e.target instanceof HTMLElement && e.target.closest('a')) {
      return
    }
    onToggleSelect()
  }

  const handleCheckboxChange = (checked: boolean) => {
    if (checked !== selected) {
      onToggleSelect()
    }
  }

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected ? 'ring-2 ring-primary' : ''
      } ${importing ? 'opacity-50' : ''} ${queued ? 'ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
      onClick={handleCardClick}
    >
      {(importing || queued) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
          <div className="flex items-center space-x-2">
            {importing ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner className="w-4 h-4" />
                <span className="text-sm font-medium">Importing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Queued</span>
              </div>
            )}
          </div>
        </div>
      )}

      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <Checkbox
              checked={selected}
              onCheckedChange={handleCheckboxChange}
              disabled={importing}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight line-clamp-1" title={playlist.name}>
                {playlist.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground line-clamp-1">
                by {playlist.owner.display_name}
              </p>
            </div>
          </div>
          <a
            href={playlist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-muted rounded-sm transition-colors flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            title="Open in Spotify"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Compact Playlist Image */}
        <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted max-w-24 mx-auto">
          {playlistImage && !imageError ? (
            <Image
              src={playlistImage}
              alt={playlist.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Compact Playlist Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <Music className="w-3 h-3 mr-1" />
            <span>{trackCount} track{trackCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-1">
            {playlist.collaborative && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                <Users className="w-2 h-2 mr-1" />
                Collab
              </Badge>
            )}
            <Badge variant="outline" className="text-xs px-1 py-0">
              {playlist.public ? (
                <>
                  <Globe className="w-2 h-2 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-2 h-2 mr-1" />
                  Private
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}