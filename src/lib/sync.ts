import { prisma } from '@/lib/prisma'
import { SpotifyService } from '@/lib/spotify'
import { Platform, SyncStatus, SyncAction } from '@prisma/client'

// Types for sync operations
export interface SyncResult {
  success: boolean
  syncId: string
  status: SyncStatus
  message: string
  stats: {
    total: number
    success: number
    conflicts: number
    errors: number
  }
}

export interface SyncConflict {
  songId: string
  title: string
  artist: string
  reason: 'not_found' | 'multiple_matches' | 'unavailable'
  suggestions?: Array<{
    id: string
    name: string
    artists: string[]
    uri: string
  }>
}

export interface BatchSyncResult {
  success: boolean
  results: Array<{
    playlistId: string
    playlistName: string
    result: SyncResult
  }>
  totalPlaylists: number
  successfulSyncs: number
  failedSyncs: number
}

/**
 * Spotify Sync Service
 * Handles synchronization of playlists between the local database and Spotify
 */
export class SpotifySyncService {
  /**
   * Sync a single playlist to Spotify
   */
  static async syncPlaylistToSpotify(
    playlistId: string,
    userId: string,
    options: {
      createIfNotExists?: boolean
      updateExisting?: boolean
      handleConflicts?: boolean
    } = {}
  ): Promise<SyncResult> {
    const {
      createIfNotExists = true,
      updateExisting = true,
      handleConflicts = true
    } = options

    try {
      // Get the playlist with songs from database
      const playlist = await prisma.playlist.findFirst({
        where: {
          id: playlistId,
          userId: userId
        },
        include: {
          songs: {
            include: {
              song: true
            },
            orderBy: {
              position: 'asc'
            }
          }
        }
      })

      if (!playlist) {
        throw new Error('Playlist not found')
      }

      // Create or get existing sync record
      let sync = await prisma.playlistSync.findFirst({
        where: {
          playlistId: playlistId,
          platform: Platform.SPOTIFY
        }
      })

      if (!sync) {
        sync = await prisma.playlistSync.create({
          data: {
            playlistId: playlistId,
            platform: Platform.SPOTIFY,
            status: SyncStatus.PENDING,
            totalCount: playlist.songs.length
          }
        })
      }

      // Update sync status to in progress
      await prisma.playlistSync.update({
        where: { id: sync.id },
        data: {
          status: SyncStatus.IN_PROGRESS,
          totalCount: playlist.songs.length,
          successCount: 0,
          conflictCount: 0,
          errorMessage: null
        }
      })

      let spotifyPlaylist
      const stats = {
        total: playlist.songs.length,
        success: 0,
        conflicts: 0,
        errors: 0
      }

      // Check if playlist already exists on Spotify
      if (sync.externalId) {
        try {
          spotifyPlaylist = await SpotifyService.getPlaylist(sync.externalId)
          if (!spotifyPlaylist && createIfNotExists) {
            // Playlist was deleted on Spotify, create new one
            spotifyPlaylist = await this.createSpotifyPlaylist(playlist, userId)
            if (spotifyPlaylist) {
              await prisma.playlistSync.update({
                where: { id: sync.id },
                data: { externalId: spotifyPlaylist.id }
              })
            }
          }
        } catch (error) {
          console.error('Error fetching existing Spotify playlist:', error)
          if (createIfNotExists) {
            spotifyPlaylist = await this.createSpotifyPlaylist(playlist, userId)
            if (spotifyPlaylist) {
              await prisma.playlistSync.update({
                where: { id: sync.id },
                data: { externalId: spotifyPlaylist.id }
              })
            }
          }
        }
      } else if (createIfNotExists) {
        // Create new playlist on Spotify
        spotifyPlaylist = await this.createSpotifyPlaylist(playlist, userId)
        if (spotifyPlaylist) {
          await prisma.playlistSync.update({
            where: { id: sync.id },
            data: { externalId: spotifyPlaylist.id }
          })
        }
      }

      if (!spotifyPlaylist) {
        throw new Error('Failed to create or access Spotify playlist')
      }

      // Clear existing tracks if updating
      if (updateExisting) {
        const existingTracks = await SpotifyService.getPlaylistTracks(spotifyPlaylist.id)
        if (existingTracks && existingTracks.items.length > 0) {
          const urisToRemove = existingTracks.items.map(item => item.track.uri)
          await SpotifyService.removeTracksFromPlaylist(spotifyPlaylist.id, urisToRemove)
        }
      }

      // Process each song in the playlist
      const trackUris: string[] = []
      
      for (const playlistSong of playlist.songs) {
        const song = playlistSong.song
        
        try {
          let spotifyUri = song.spotifyId ? `spotify:track:${song.spotifyId}` : null

          // If no Spotify ID, try to find the track
          if (!spotifyUri) {
            const searchResults = await this.searchSpotifyTrack(song.title, song.artist)
            
            if (searchResults.length === 0) {
              // Track not found
              await this.logSyncAction(sync.id, song.id, SyncAction.SEARCH_TRACK, SyncStatus.FAILED, 'Track not found on Spotify')
              stats.conflicts++
              continue
            } else if (searchResults.length === 1) {
              // Exact match found
              spotifyUri = searchResults[0].uri
              
              // Update song with Spotify ID
              await prisma.song.update({
                where: { id: song.id },
                data: { spotifyId: searchResults[0].id }
              })
              
              await this.logSyncAction(sync.id, song.id, SyncAction.SEARCH_TRACK, SyncStatus.COMPLETED, null, spotifyUri)
            } else {
              // Multiple matches - use best match (first result)
              spotifyUri = searchResults[0].uri
              
              // Update song with Spotify ID
              await prisma.song.update({
                where: { id: song.id },
                data: { spotifyId: searchResults[0].id }
              })
              
              await this.logSyncAction(sync.id, song.id, SyncAction.SEARCH_TRACK, SyncStatus.PARTIAL, 'Multiple matches found, used best match', spotifyUri)
              stats.conflicts++
            }
          }

          if (spotifyUri) {
            trackUris.push(spotifyUri)
            await this.logSyncAction(sync.id, song.id, SyncAction.ADD_TRACK, SyncStatus.COMPLETED, null, spotifyUri)
            stats.success++
          }
        } catch (error) {
          console.error(`Error processing song ${song.id}:`, error)
          await this.logSyncAction(sync.id, song.id, SyncAction.ADD_TRACK, SyncStatus.FAILED, error instanceof Error ? error.message : 'Unknown error')
          stats.errors++
        }
      }

      // Add tracks to Spotify playlist in batches (Spotify has a 100 track limit per request)
      if (trackUris.length > 0) {
        const batchSize = 100
        for (let i = 0; i < trackUris.length; i += batchSize) {
          const batch = trackUris.slice(i, i + batchSize)
          try {
            await SpotifyService.addTracksToPlaylist(spotifyPlaylist.id, { uris: batch })
          } catch (error) {
            console.error(`Error adding batch ${i / batchSize + 1} to Spotify:`, error)
            stats.errors += batch.length
            stats.success -= batch.length
          }
        }
      }

      // Determine final sync status
      let finalStatus: SyncStatus
      if (stats.errors > 0 && stats.success === 0) {
        finalStatus = SyncStatus.FAILED
      } else if (stats.conflicts > 0 || stats.errors > 0) {
        finalStatus = SyncStatus.PARTIAL
      } else {
        finalStatus = SyncStatus.COMPLETED
      }

      // Update sync record
      await prisma.playlistSync.update({
        where: { id: sync.id },
        data: {
          status: finalStatus,
          lastSyncAt: new Date(),
          successCount: stats.success,
          conflictCount: stats.conflicts,
          errorMessage: stats.errors > 0 ? `${stats.errors} tracks failed to sync` : null
        }
      })

      return {
        success: finalStatus !== SyncStatus.FAILED,
        syncId: sync.id,
        status: finalStatus,
        message: this.getSyncMessage(finalStatus, stats),
        stats
      }

    } catch (error) {
      console.error('Sync error:', error)
      
      // Update sync record with error
      if (playlistId) {
        await prisma.playlistSync.updateMany({
          where: {
            playlistId: playlistId,
            platform: Platform.SPOTIFY
          },
          data: {
            status: SyncStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }

      return {
        success: false,
        syncId: '',
        status: SyncStatus.FAILED,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stats: { total: 0, success: 0, conflicts: 0, errors: 1 }
      }
    }
  }

  /**
   * Get sync status for a playlist
   */
  static async getSyncStatus(playlistId: string, platform: Platform = Platform.SPOTIFY) {
    const sync = await prisma.playlistSync.findFirst({
      where: {
        playlistId: playlistId,
        platform: platform
      },
      include: {
        syncLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    return sync
  }

  /**
   * Batch sync multiple playlists
   */
  static async batchSyncPlaylists(
    playlistIds: string[],
    userId: string,
    options: {
      createIfNotExists?: boolean
      updateExisting?: boolean
      handleConflicts?: boolean
    } = {}
  ): Promise<BatchSyncResult> {
    const results: BatchSyncResult['results'] = []
    let successfulSyncs = 0
    let failedSyncs = 0

    for (const playlistId of playlistIds) {
      try {
        // Get playlist name for result
        const playlist = await prisma.playlist.findUnique({
          where: { id: playlistId },
          select: { name: true }
        })

        const result = await this.syncPlaylistToSpotify(playlistId, userId, options)
        
        results.push({
          playlistId,
          playlistName: playlist?.name || 'Unknown',
          result
        })

        if (result.success) {
          successfulSyncs++
        } else {
          failedSyncs++
        }

        // Add delay between syncs to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error syncing playlist ${playlistId}:`, error)
        results.push({
          playlistId,
          playlistName: 'Unknown',
          result: {
            success: false,
            syncId: '',
            status: SyncStatus.FAILED,
            message: error instanceof Error ? error.message : 'Unknown error',
            stats: { total: 0, success: 0, conflicts: 0, errors: 1 }
          }
        })
        failedSyncs++
      }
    }

    return {
      success: successfulSyncs > 0,
      results,
      totalPlaylists: playlistIds.length,
      successfulSyncs,
      failedSyncs
    }
  }

  /**
   * Create a new playlist on Spotify
   */
  private static async createSpotifyPlaylist(playlist: any, userId: string) {
    const spotifyUser = await SpotifyService.getCurrentUser()
    if (!spotifyUser) {
      throw new Error('Failed to get Spotify user information')
    }

    return await SpotifyService.createPlaylist(spotifyUser.id, {
      name: playlist.name,
      description: playlist.description || `Synced from Music Playlist Manager`,
      public: playlist.isPublic
    })
  }

  /**
   * Search for a track on Spotify
   */
  private static async searchSpotifyTrack(title: string, artist: string) {
    const query = `track:"${title}" artist:"${artist}"`
    const searchResult = await SpotifyService.search(query, 'track', 5)
    
    if (!searchResult?.tracks?.items) {
      return []
    }

    return searchResult.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name),
      uri: track.uri
    }))
  }

  /**
   * Log sync action
   */
  private static async logSyncAction(
    syncId: string,
    songId: string,
    action: SyncAction,
    status: SyncStatus,
    errorMessage?: string | null,
    spotifyUri?: string | null
  ) {
    await prisma.syncLog.create({
      data: {
        syncId,
        songId,
        action,
        status,
        errorMessage,
        spotifyUri
      }
    })
  }

  /**
   * Generate sync message based on status and stats
   */
  private static getSyncMessage(status: SyncStatus, stats: any): string {
    switch (status) {
      case SyncStatus.COMPLETED:
        return `Successfully synced ${stats.success} tracks`
      case SyncStatus.PARTIAL:
        return `Synced ${stats.success} tracks with ${stats.conflicts} conflicts and ${stats.errors} errors`
      case SyncStatus.FAILED:
        return `Sync failed: ${stats.errors} errors occurred`
      default:
        return 'Sync status unknown'
    }
  }
}