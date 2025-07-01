import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SpotifyService } from '@/lib/spotify'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { playlistId } = await request.json()

    if (!playlistId) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      )
    }

    // Fetch playlist details from Spotify
    const spotifyPlaylist = await SpotifyService.getPlaylist(playlistId)
    
    if (!spotifyPlaylist) {
      return NextResponse.json(
        { error: 'Failed to fetch playlist from Spotify' },
        { status: 500 }
      )
    }

    // Check if playlist already exists
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { spotifyId: playlistId }
    })

    let playlist

    if (existingPlaylist) {
      // Update existing playlist
      playlist = await prisma.playlist.update({
        where: { id: existingPlaylist.id },
        data: {
          name: spotifyPlaylist.name,
          description: spotifyPlaylist.description || null,
          image: spotifyPlaylist.images[0]?.url || null,
          isPublic: spotifyPlaylist.public,
          updatedAt: new Date()
        }
      })

      // Delete existing songs in the playlist to re-import fresh data
      await prisma.playlistSong.deleteMany({
        where: { playlistId: playlist.id }
      })
    } else {
      // Create new playlist
      playlist = await prisma.playlist.create({
        data: {
          name: spotifyPlaylist.name,
          description: spotifyPlaylist.description || null,
          image: spotifyPlaylist.images[0]?.url || null,
          spotifyId: playlistId,
          isPublic: spotifyPlaylist.public,
          userId: session.user.id
        }
      })
    }

    // Fetch all tracks from the playlist (handle pagination)
    let allTracks: any[] = []
    let offset = 0
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const tracksResponse = await SpotifyService.getPlaylistTracks(playlistId, limit, offset)
      
      if (!tracksResponse) {
        console.error('Failed to fetch tracks at offset:', offset)
        break
      }

      allTracks = [...allTracks, ...tracksResponse.items]
      
      hasMore = tracksResponse.next !== null
      offset += limit
    }

    // Import tracks and create song entries
    let importedTracks = 0
    
    for (let i = 0; i < allTracks.length; i++) {
      const item = allTracks[i]
      const track = item.track

      if (!track || track.type !== 'track') {
        continue // Skip non-track items (e.g., episodes)
      }

      try {
        // Find or create song
        let song = await prisma.song.findUnique({
          where: { spotifyId: track.id }
        })

        if (!song) {
          song = await prisma.song.create({
            data: {
              title: track.name,
              artist: track.artists.map((a: any) => a.name).join(', '),
              album: track.album?.name || null,
              duration: track.duration_ms,
              spotifyId: track.id,
              previewUrl: track.preview_url,
              image: track.album?.images[0]?.url || null,
              isrc: track.external_ids?.isrc || null
            }
          })
        }

        // Add song to playlist
        await prisma.playlistSong.create({
          data: {
            playlistId: playlist.id,
            songId: song.id,
            position: i
          }
        })

        importedTracks++
      } catch (error) {
        console.error('Error importing track:', track.name, error)
        // Continue with next track even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      playlistId: playlist.id,
      playlistName: playlist.name,
      totalTracks: allTracks.length,
      importedTracks
    })
  } catch (error) {
    console.error('Error importing playlist:', error)
    return NextResponse.json(
      { error: 'Failed to import playlist' },
      { status: 500 }
    )
  }
}