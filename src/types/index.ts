export interface User {
  id: string
  name?: string
  email?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Playlist {
  id: string
  name: string
  description?: string
  image?: string
  userId: string
  spotifyId?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  songs: Song[]
}

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number
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

export enum Platform {
  SPOTIFY = 'SPOTIFY',
  BEATPORT = 'BEATPORT',
  SOUNDCLOUD = 'SOUNDCLOUD'
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface PurchaseHistory {
  id: string
  userId: string
  songId: string
  platform: Platform
  price?: number
  currency?: string
  purchaseId?: string
  status: PurchaseStatus
  createdAt: Date
  updatedAt: Date
  song: Song
}

// Spotify API Types
export interface SpotifyPlaylist {
  id: string
  name: string
  description?: string
  images: SpotifyImage[]
  tracks: {
    total: number
    items: SpotifyPlaylistTrack[]
  }
  public: boolean
  owner: {
    id: string
    display_name: string
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  duration_ms: number
  preview_url?: string
  external_ids: {
    isrc?: string
  }
}

export interface SpotifyArtist {
  id: string
  name: string
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: SpotifyImage[]
}

export interface SpotifyImage {
  url: string
  height: number
  width: number
}

export interface SpotifyPlaylistTrack {
  track: SpotifyTrack
  added_at: string
}

// SoundCloud API Types
export interface SoundCloudTrack {
  id: number
  title: string
  user: {
    username: string
  }
  duration: number
  stream_url?: string
  artwork_url?: string
  permalink_url: string
}

// Beatport API Types (Note: Beatport API is not publicly available)
export interface BeatportTrack {
  id: string
  name: string
  artists: BeatportArtist[]
  release: {
    name: string
    image: {
      uri: string
    }
  }
  length: string
  preview_url?: string
  purchase_url?: string
  price: {
    value: number
    currency: string
  }
}

export interface BeatportArtist {
  id: string
  name: string
}