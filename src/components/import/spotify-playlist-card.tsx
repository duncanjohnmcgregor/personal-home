'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Music, Users, Lock, Globe, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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
}

export function SpotifyPlaylistCard({
  playlist,
  selected,
  onToggleSelect,
  importing = false
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
      className={cn(
        "playlist-card-compact",
        selected && "selected",
        importing && "opacity-50 pointer-events-none"
      )}
      onClick={handleCardClick}
    >
      {importing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
          <div className="flex items-center space-x-2">
            <LoadingSpinner className="w-4 h-4" />
            <span className="text-sm font-medium">Importing...</span>
          </div>
        </div>
      )}

      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={selected}
            onCheckedChange={handleCheckboxChange}
            disabled={importing}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          />

          {/* Playlist Image */}
          <div className="playlist-image-compact">
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
                <Music className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Playlist Info */}
          <div className="playlist-info-compact">
            <h4 className="playlist-title-compact" title={playlist.name}>
              {playlist.name}
            </h4>
            <div className="playlist-meta-compact">
              <span>by {playlist.owner.display_name}</span>
              <span className="mx-1">•</span>
              <span>{trackCount} track{trackCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1 mt-1">
              {playlist.collaborative && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  <Users className="w-2.5 h-2.5 mr-0.5" />
                  Collab
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {playlist.public ? (
                  <>
                    <Globe className="w-2.5 h-2.5 mr-0.5" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5 mr-0.5" />
                    Private
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* External Link */}
          <a
            href={playlist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 hover:bg-muted rounded-sm transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
            title="Open in Spotify"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}