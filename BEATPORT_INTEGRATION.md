# Beatport Integration Implementation

## Overview

This document describes the implementation of Beatport API integration for the Music Playlist Manager application. The integration provides track search and purchase functionality using Beatport's API v4.

## Implementation Status

✅ **Completed**: Basic foundation for Beatport integration has been implemented with:
- API service layer with mock data support
- Search functionality
- Purchase flow structure
- API routes for all operations

⚠️ **Note**: Full functionality requires a valid Beatport API token. The current implementation includes mock data for development.

## Files Created/Modified

### 1. Service Layer
- `src/lib/beatport.ts` - Main Beatport API service
  - Search tracks functionality
  - Track details retrieval
  - Purchase initiation
  - Purchase status checking
  - Purchase history management

### 2. API Routes
- `src/app/api/beatport/search/route.ts` - Search endpoint
- `src/app/api/beatport/purchase/route.ts` - Purchase initiation endpoint
- `src/app/api/beatport/purchase/[id]/route.ts` - Purchase status endpoint

### 3. Configuration
- `.env.example` - Added `BEATPORT_API_TOKEN` variable
- `.env.staging` - Added staging configuration
- `.env.production` - Added production configuration

### 4. Database Schema
- Uses existing `PurchaseHistory` model with `BEATPORT` platform enum value
- Links purchases to `Song` model via `beatportId` field

## API Endpoints

### 1. Search Tracks
```
GET /api/beatport/search?q={query}&page={page}&per_page={per_page}
```

Optional filters:
- `genre_id` - Filter by genre ID
- `label_id` - Filter by label ID
- `artist_id` - Filter by artist ID
- `bpm_min` - Minimum BPM
- `bpm_max` - Maximum BPM
- `key` - Musical key

### 2. Purchase Track
```
POST /api/beatport/purchase
Body: { trackId: number }
```

### 3. Get Purchase Status
```
GET /api/beatport/purchase/{purchaseId}
```

## Data Models

### BeatportTrack
```typescript
interface BeatportTrack {
  id: number
  name: string
  mix_name?: string
  artists: Array<{ id: number, name: string }>
  remixers?: Array<{ id: number, name: string }>
  release: {
    id: number
    name: string
    image: { uri: string, dynamic_uri: string }
  }
  duration: { minutes: number, seconds: number, milliseconds: number }
  bpm?: number
  key?: { camelot_name: string, standard_name: string }
  genre: { id: number, name: string }
  label: { id: number, name: string }
  released: string
  price: { code: string, symbol: string, value: number, display: string }
  url: string
  isrc?: string
}
```

## Configuration

### Environment Variables
```env
# Beatport API Configuration
BEATPORT_API_TOKEN="your-beatport-api-token"
```

### Getting API Access
1. Visit https://api.beatport.com/v4/docs/
2. Request API access from Beatport
3. Once approved, obtain your API token
4. Add the token to your environment variables

## Development Mode

When no API token is configured, the service returns mock data for development:
- Mock search results with sample tracks
- Simulated purchase flow
- Test data for UI development

## Integration with Existing Features

### Purchase History
- Purchases are stored in the `PurchaseHistory` table
- Linked to songs via `beatportId`
- Status tracking: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

### Cross-Platform Matching
- Tracks include ISRC codes when available
- Can be used for matching with Spotify/SoundCloud tracks
- BPM and key information available for DJ-friendly matching

## Future Enhancements

1. **OAuth Integration**: Implement Beatport OAuth for user-specific purchases
2. **Webhook Support**: Add webhook handlers for purchase status updates
3. **Advanced Search**: Implement more sophisticated filtering options
4. **Batch Operations**: Support bulk track purchases
5. **Price Monitoring**: Track price changes and sales
6. **Download Management**: Handle actual file downloads after purchase

## Testing

To test the integration:

1. **Without API Token** (Mock Mode):
   ```bash
   # Search will return mock data
   curl http://localhost:3000/api/beatport/search?q=test
   ```

2. **With API Token**:
   - Add `BEATPORT_API_TOKEN` to `.env.local`
   - Restart the development server
   - API calls will use real Beatport data

## Security Considerations

1. **API Token**: Store securely in environment variables, never commit to code
2. **Purchase Validation**: Always validate purchase requests server-side
3. **User Authorization**: Ensure users can only access their own purchase history
4. **Rate Limiting**: Implement rate limiting to prevent API abuse

## Troubleshooting

### Common Issues

1. **No API Token**
   - Service will use mock data
   - Check console for warning messages

2. **Authentication Errors**
   - Verify API token is correct
   - Check token hasn't expired
   - Ensure proper Bearer token format

3. **Purchase Failures**
   - Check user authentication
   - Verify track exists in Beatport
   - Ensure proper error handling in UI

## References

- [Beatport API v4 Documentation](https://api.beatport.com/v4/docs/)
- [Previous API Version Issue](https://github.com/beetbox/beets/issues/3862)