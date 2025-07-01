'use client'

import { useState } from 'react'
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
      className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected ? 'ring-2 ring-primary' : ''
      } ${importing ? 'opacity-50' : ''}`}
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

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selected}
              onCheckedChange={handleCheckboxChange}
              disabled={importing}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1" title={playlist.name}>
                {playlist.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-1">
                by {playlist.owner.display_name}
              </p>
            </div>
          </div>
          <a
            href={playlist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-muted rounded-sm transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="Open in Spotify"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Playlist Image */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
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
              <Music className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Playlist Description */}
        {playlist.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {playlist.description}
          </p>
        )}

        {/* Playlist Stats and Badges */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Music className="w-4 h-4" />
              <span>{trackCount} track{trackCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {playlist.collaborative && (
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Collaborative
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {playlist.public ? (
                <>
                  <Globe className="w-3 h-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1" />
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