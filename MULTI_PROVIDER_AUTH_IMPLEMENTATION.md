# Multi-Provider Authentication Implementation

## Overview

This implementation allows users to be authenticated with multiple music providers simultaneously:
- **Spotify** - Music streaming and playlist management
- **SoundCloud** - Independent artist discovery and streaming  
- **Beatport** - Electronic music purchasing and DJ content

## Key Features

### ✅ Simultaneous Authentication
- Users can connect to all three providers at once
- Each provider maintains separate authentication tokens
- No conflicts between different provider sessions

### ✅ Individual Provider Management
- Connect/disconnect individual providers without affecting others
- View connection status for each provider separately
- Platform-specific features based on connected providers

### ✅ Enhanced User Experience
- Progress tracking (1/3, 2/3, 3/3 platforms connected)
- Platform-specific connection statuses
- Unified dashboard showing all connected services

## Implementation Details

### Authentication Configuration (`src/lib/auth.ts`)

```typescript
// Added custom providers for SoundCloud and Beatport
const SoundCloudProvider = {
  id: 'soundcloud',
  name: 'SoundCloud', 
  type: 'oauth',
  // OAuth configuration
}

const BeatportProvider = {
  id: 'beatport',
  name: 'Beatport',
  type: 'oauth', 
  // OAuth configuration
}

// Modified signIn callback to handle multiple providers
async signIn({ user, account, profile }) {
  // Check if user already exists with different provider
  // Allow connecting additional providers to existing account
  // Update tokens if provider already connected
}

// Enhanced session callback
async session({ session, user }) {
  // Add connected providers to session
  session.connectedProviders = [...] 
}
```

### Multi-Provider Utilities (`src/lib/multi-auth.ts`)

```typescript
// Type definitions
export type Provider = 'spotify' | 'soundcloud' | 'beatport'

// Key functions
getUserConnections(userId) // Get all provider tokens for user
getProviderTokens(userId, provider) // Get specific provider tokens
isProviderConnected(userId, provider) // Check connection status
disconnectProvider(userId, provider) // Remove provider connection
```

### Database Schema

The existing Prisma `Account` model supports multiple providers per user:

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  provider          String  // 'spotify', 'soundcloud', or 'beatport'
  providerAccountId String
  access_token      String?
  refresh_token     String?
  // ... other fields
  
  @@unique([provider, providerAccountId])
}
```

### UI Components

#### Dashboard (`src/app/dashboard/page.tsx`)
- Shows connected platform count (e.g., "Connected to 2 platforms!")
- Displays individual platform connection cards
- Prompts to connect remaining platforms

#### Connect Page (`src/app/dashboard/connect/page.tsx`)  
- Lists all three platforms
- Shows connected vs. available platforms
- Progress indicators (1/3, 2/3, 3/3 connected)
- Individual connect/disconnect buttons

#### Connect Button (`src/components/connect-button.tsx`)
- Handles authentication for all three providers
- Maps platform names to provider IDs
- Redirects to connect page after authentication

#### Disconnect Button (`src/components/disconnect-button.tsx`)
- Allows disconnecting individual providers
- Confirmation dialog before disconnecting
- Refreshes page to show updated status

### API Endpoints

#### Disconnect API (`src/app/api/auth/disconnect/route.ts`)
```typescript
POST /api/auth/disconnect
{
  "provider": "spotify" | "soundcloud" | "beatport"
}
```

## Required Environment Variables

```bash
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# SoundCloud OAuth  
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
SOUNDCLOUD_CLIENT_SECRET=your_soundcloud_client_secret

# Beatport OAuth
BEATPORT_CLIENT_ID=your_beatport_client_id  
BEATPORT_CLIENT_SECRET=your_beatport_client_secret

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000 # or your production URL

# Database
POSTGRES_PRISMA_URL=your_database_url
POSTGRES_URL_NON_POOLING=your_direct_database_url
```

## OAuth Provider Setup

### Spotify
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create app with redirect URI: `{NEXTAUTH_URL}/api/auth/callback/spotify`
3. Copy Client ID and Client Secret

### SoundCloud  
1. Go to [SoundCloud Developers](https://developers.soundcloud.com/)
2. Register app with redirect URI: `{NEXTAUTH_URL}/api/auth/callback/soundcloud`
3. Copy Client ID and Client Secret

### Beatport
1. Contact Beatport API team for developer access
2. Set redirect URI: `{NEXTAUTH_URL}/api/auth/callback/beatport`
3. Copy Client ID and Client Secret

## User Flow

### Initial Connection
1. User visits `/dashboard` - sees "Connect your first platform"
2. User goes to `/dashboard/connect` - sees all three platforms
3. User clicks "Connect Spotify" - OAuth flow begins
4. After successful auth, user returns to connect page
5. User sees "Connected Platforms (1/3)" and can connect more

### Multiple Connections
1. User can connect additional platforms independently
2. Each platform maintains separate tokens/sessions
3. Dashboard shows all connected platforms
4. User can disconnect individual platforms without affecting others

### Platform-Specific Features
- **Spotify**: Stream music, manage playlists, import existing playlists
- **SoundCloud**: Discover independent artists, stream user content
- **Beatport**: Purchase electronic tracks, access DJ content

## Benefits

### For Users
- **Unified Experience**: Manage all music platforms in one place
- **No Conflicts**: Can use multiple platforms simultaneously  
- **Flexibility**: Connect only desired platforms
- **Easy Management**: Clear status and simple connect/disconnect

### For Developers
- **Modular Design**: Easy to add/remove providers
- **Clean Architecture**: Separate concerns for each provider
- **Scalable**: Can easily add more music platforms
- **Maintainable**: Clear utilities and consistent patterns

## Testing

### Manual Testing Steps
1. ✅ Connect to Spotify only - verify single platform experience
2. ✅ Connect to SoundCloud while Spotify connected - verify both work
3. ✅ Connect to Beatport with other platforms - verify all three work
4. ✅ Disconnect individual platforms - verify others remain connected
5. ✅ Navigate between pages - verify connection state persists
6. ✅ Re-connect disconnected platforms - verify re-authentication works

### Database Verification
```sql
-- Check user's connected accounts
SELECT provider, access_token IS NOT NULL as has_token 
FROM Account 
WHERE userId = 'user_id';

-- Should show multiple rows for users with multiple providers
```

## Future Enhancements

### Cross-Platform Features
- **Playlist Sync**: Copy playlists between platforms
- **Track Matching**: Find same songs across platforms
- **Purchase Workflow**: Buy on Beatport, add to Spotify/SoundCloud
- **Discovery Engine**: Combine recommendations from all platforms

### Enhanced UI
- **Platform-Specific Dashboards**: Dedicated sections for each platform
- **Usage Analytics**: Show activity across platforms
- **Sync Status**: Real-time sync progress between platforms
- **Bulk Operations**: Manage multiple platforms simultaneously

## Troubleshooting

### Common Issues

**"Provider not found" Error**
- Verify environment variables are set correctly
- Check OAuth app configuration and redirect URIs

**"Token expired" Errors**  
- Implement automatic token refresh for each provider
- Add token validation before API calls

**Multiple Account Conflicts**
- Current implementation links by email address
- Consider alternative user matching strategies if needed

**Database Connection Issues**
- Verify Prisma client is properly configured
- Check database connection and migrations

This implementation provides a solid foundation for multi-provider authentication that can be extended with additional platforms and cross-platform features as needed.