'use client'

import { useState } from 'react'
import { SongItem } from './song-item'
import { PlaylistSong } from '@/types/playlist'
import { EmptyState } from '@/components/ui/empty-state'
import { Music } from 'lucide-react'

interface SongListProps {
  songs: PlaylistSong[]
  onPlay?: (song: PlaylistSong) => void
  onRemove?: (song: PlaylistSong) => void
  currentlyPlaying?: string
  showPosition?: boolean
}

export function SongList({
  songs,
  onPlay,
  onRemove,
  currentlyPlaying,
  showPosition = true,
}: SongListProps) {
  if (songs.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No songs in this playlist"
        description="Add some songs to get started"
      />
    )
  }

  // Sort songs by position
  const sortedSongs = [...songs].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-1">
      {sortedSongs.map((playlistSong, index) => (
        <SongItem
          key={playlistSong.id}
          playlistSong={playlistSong}
          position={index + 1}
          isPlaying={currentlyPlaying === playlistSong.song.id}
          onPlay={onPlay}
          onRemove={onRemove}
          showPosition={showPosition}
        />
      ))}
    </div>
  )
}