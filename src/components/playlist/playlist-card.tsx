'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Music, MoreVertical, Edit, Trash2, Users, Lock } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Playlist } from '@/types/playlist'
import { formatDistanceToNow } from 'date-fns'

interface PlaylistCardProps {
  playlist: Playlist
  onEdit?: (playlist: Playlist) => void
  onDelete?: (playlist: Playlist) => void
}

export function PlaylistCard({ playlist, onEdit, onDelete }: PlaylistCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (isDeleting || !onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(playlist)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDuration = (totalDuration: number) => {
    const hours = Math.floor(totalDuration / 3600000)
    const minutes = Math.floor((totalDuration % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const totalDuration = playlist.songs.reduce((acc, playlistSong) => {
    return acc + (playlistSong.song.duration || 0)
  }, 0)

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/dashboard/playlists/${playlist.id}`}
              className="block hover:text-primary transition-colors"
            >
              <h3 className="font-semibold text-lg truncate mb-1">
                {playlist.name}
              </h3>
            </Link>
            {playlist.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {playlist.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(playlist)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Music className="h-4 w-4" />
            <span>{playlist._count.songs} songs</span>
          </div>
          {totalDuration > 0 && (
            <span>{formatDuration(totalDuration)}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={playlist.isPublic ? "default" : "secondary"}>
              {playlist.isPublic ? (
                <>
                  <Users className="h-3 w-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              )}
            </Badge>
            {playlist.spotifyId && (
              <Badge variant="outline" className="text-green-600">
                Spotify
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 pt-0">
        <p className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(playlist.updatedAt), { addSuffix: true })}
        </p>
      </CardFooter>
    </Card>
  )
}