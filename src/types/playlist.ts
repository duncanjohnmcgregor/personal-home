export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number
  bpm?: number
  spotifyId?: string
  soundcloudId?: string
  beatportId?: string
  previewUrl?: string
  image?: string
  isrc?: string
  createdAt: Date
  updatedAt: Date
}

export interface PlaylistSong {
  id: string
  playlistId: string
  songId: string
  position: number
  addedAt: Date
  song: Song
}

export interface Playlist {
  id: string
  name: string
  description?: string
  image?: string
  userId: string
  spotifyId?: string
  isPublic: boolean
  categoryId?: string
  createdAt: Date
  updatedAt: Date
  songs: PlaylistSong[]
  _count: {
    songs: number
  }
}

export interface PlaylistsResponse {
  playlists: Playlist[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface CreatePlaylistData {
  name: string
  description?: string
  isPublic?: boolean
}

export interface UpdatePlaylistData {
  name?: string
  description?: string
  isPublic?: boolean
  categoryId?: string
}

export interface AddSongToPlaylistData {
  songId: string
  position?: number
}

export interface RemoveSongFromPlaylistData {
  songId: string
}

export interface ReorderPlaylistSongsData {
  songIds: string[]
}

export interface PlaylistCategory {
  id: string
  name: string
  description?: string
  color?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}