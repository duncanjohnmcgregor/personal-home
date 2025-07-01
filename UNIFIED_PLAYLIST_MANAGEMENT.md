# Unified Playlist Management Implementation

## Overview

The playlist management feature has been simplified into a single, unified page that allows users to:
- View multiple playlists with expandable/collapsible views
- Drag and drop songs between playlists
- Reorder songs within playlists
- See all playlists and their songs on the same page

## Implementation Details

### Technology Stack
- **Shopify Draggable** - Used for drag and drop functionality
- **React** - Component-based UI
- **Next.js** - Framework with server-side rendering
- **TypeScript** - Type safety

### Key Components

#### 1. DraggablePlaylists Component (`/src/components/playlist/draggable-playlists.tsx`)
- Main component that renders all playlists
- Handles expandable/collapsible playlist views
- Implements drag and drop functionality using Shopify Draggable
- Supports:
  - Dragging songs between playlists
  - Reordering songs within playlists
  - Removing songs from playlists
  - Editing and deleting playlists

#### 2. Updated Playlists Page (`/src/app/dashboard/playlists/page.tsx`)
- Simplified main playlists page
- Removed grid/list view toggle in favor of unified draggable view
- Added clear instructions for users
- Integrated search and sort functionality

#### 3. Updated Playlist Hook (`/src/lib/hooks/use-playlists.ts`)
- Added `moveSongBetweenPlaylists` function to handle moving songs between playlists
- Handles the removal from source playlist and addition to target playlist

### Removed Components
The following components were removed as they're no longer needed:
- `/src/app/dashboard/playlists/organize/page.tsx` - Old organize page
- `/src/components/playlist/song-organizer.tsx` - Old song organizer
- `/src/components/playlist/playlist-manager.tsx` - Old playlist manager
- `/src/components/playlist/draggable-playlist-list.tsx` - Old draggable list
- `/src/components/playlist/playlist-song-manager.tsx` - Old song manager
- `/src/lib/hooks/use-undo-redo.ts` - Undo/redo functionality

### User Experience

1. **Viewing Playlists**
   - All playlists are shown in a vertical list
   - Each playlist shows its name, description, and song count
   - Playlists can be expanded/collapsed by clicking on them

2. **Managing Songs**
   - Expand a playlist to see its songs
   - Drag songs by the grip handle to reorder within the playlist
   - Drag songs between different playlists to move them
   - Click the trash icon to remove a song from a playlist

3. **Playlist Actions**
   - Edit playlist details using the edit button
   - Delete playlists using the delete button
   - Create new playlists using the "New Playlist" button

### Technical Considerations

- **Client-side only dragging**: Shopify Draggable is loaded dynamically to avoid SSR issues
- **Real-time updates**: Changes are immediately reflected in the UI
- **Error handling**: Failed operations show toast notifications
- **Performance**: Uses React refs and event delegation for efficient updates

## Usage

Navigate to `/dashboard/playlists` to access the unified playlist manager. Expand playlists to see their songs, then drag and drop to organize your music collection.