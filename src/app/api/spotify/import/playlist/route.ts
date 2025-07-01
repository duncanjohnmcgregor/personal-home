export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SpotifyService } from '@/lib/spotify'
import { prisma } from '@/lib/prisma'

interface AuthenticatedSession {
  user: {
    id: string
    email?: string
    name?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as AuthenticatedSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const { playlistId } = await request.json()
    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 })
    }

    // Get playlist details from Spotify
    const spotifyPlaylist = await SpotifyService.getPlaylist(playlistId)
    if (!spotifyPlaylist) {
      return NextResponse.json({ error: 'Failed to fetch playlist from Spotify' }, { status: 500 })
    }

    // Check if playlist already exists in our database
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        spotifyId: playlistId,
        userId: userId,
      },
    })

    let playlist
    if (existingPlaylist) {
      // Update existing playlist
      playlist = await prisma.playlist.update({
        where: { id: existingPlaylist.id },
        data: {
          name: spotifyPlaylist.name,
          description: spotifyPlaylist.description,
          image: spotifyPlaylist.images?.[0]?.url,
          isPublic: spotifyPlaylist.public,
        },
      })
    } else {
      // Create new playlist
      playlist = await prisma.playlist.create({
        data: {
          name: spotifyPlaylist.name,
          description: spotifyPlaylist.description,
          image: spotifyPlaylist.images?.[0]?.url,
          userId: userId,
          spotifyId: playlistId,
          isPublic: spotifyPlaylist.public,
        },
      })
    }

    // Get all tracks from the Spotify playlist
    let allTracks: any[] = []
    let offset = 0
    const limit = 100

    while (true) {
      const tracksResponse = await SpotifyService.getPlaylistTracks(playlistId, limit, offset)
      if (!tracksResponse?.items) break

      const validTracks = tracksResponse.items.filter(item => item.track && item.track.id)
      allTracks = allTracks.concat(validTracks)

      if (!tracksResponse.next || validTracks.length < limit) break
      offset += limit
    }

    let tracksImported = 0

    // Process tracks in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < allTracks.length; i += batchSize) {
      const batch = allTracks.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (item, batchIndex) => {
        try {
          const track = item.track
          if (!track || !track.id) return

          // Create or update song
          const songData = {
            title: track.name,
            artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
            album: track.album?.name,
            duration: track.duration_ms,
            spotifyId: track.id,
            previewUrl: track.preview_url,
            image: track.album?.images?.[0]?.url,
          }

          const song = await prisma.song.upsert({
            where: { spotifyId: track.id },
            update: songData,
            create: songData,
          })

          // Add song to playlist if not already there
          const position = i + batchIndex
          await prisma.playlistSong.upsert({
            where: {
              playlistId_songId: {
                playlistId: playlist.id,
                songId: song.id,
              },
            },
            update: { position },
            create: {
              playlistId: playlist.id,
              songId: song.id,
              position,
            },
          })

          tracksImported++
                 } catch (error) {
           console.error('Error processing track:', item.track?.name, error)
           // Continue processing other tracks even if one fails
         }
      }))
    }

    // If this is an update, remove songs that are no longer in the Spotify playlist
    if (existingPlaylist) {
      const currentSpotifyTrackIds = allTracks
        .map(item => item.track?.id)
        .filter(Boolean)

      // Get current songs in our playlist
      const currentPlaylistSongs = await prisma.playlistSong.findMany({
        where: { playlistId: playlist.id },
        include: { song: true },
      })

             // Find songs to remove (songs that are in our playlist but not in the current Spotify playlist)
       const songsToRemove = currentPlaylistSongs.filter(
         (ps: any) => ps.song.spotifyId && !currentSpotifyTrackIds.includes(ps.song.spotifyId)
       )

       if (songsToRemove.length > 0) {
         await prisma.playlistSong.deleteMany({
           where: {
             id: { in: songsToRemove.map((ps: any) => ps.id) },
           },
         })
       }
    }

    return NextResponse.json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        tracksTotal: allTracks.length,
        tracksImported,
      },
      tracksImported,
    })
  } catch (error) {
    console.error('Error importing playlist:', error)
    return NextResponse.json(
      { error: 'Failed to import playlist' },
      { status: 500 }
    )
  }
}