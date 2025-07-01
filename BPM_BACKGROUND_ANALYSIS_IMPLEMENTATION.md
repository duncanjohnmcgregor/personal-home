# BPM Background Analysis Implementation

## Overview

This implementation adds automatic, asynchronous BPM (Beats Per Minute) analysis that runs in the background for all songs with preview URLs. The system analyzes songs automatically when they are displayed and shows the BPM information throughout the application.

## Key Features

### 1. Background Analysis Service (`src/lib/services/bpm-background-service.ts`)
- **Singleton service** that manages a queue of songs to analyze
- **Priority-based queue** (high, normal, low priority)
- **Automatic retry logic** with configurable retry attempts
- **Audio processing** using the realtime-bpm-analyzer library
- **Database integration** to save detected BPM values
- **Memory management** with automatic cleanup of old jobs

### 2. React Integration (`src/lib/hooks/use-bpm-background.ts`)
- **React hook** for easy integration with components
- **Real-time status updates** via subscription pattern
- **Queue management functions** (add, clear, status)
- **Song-specific queries** (BPM lookup, analysis status)

### 3. Auto-Analysis Components
- **BPMAutoAnalyzer** (`src/components/bpm/bpm-auto-analyzer.tsx`): Automatically adds songs to analysis queue
- **useBPMAutoAnalyzer hook**: Hook version for programmatic use

### 4. Enhanced UI Components
- **BPMStatus** (`src/components/bpm/bpm-status.tsx`): Shows queue status and progress
- **BPMBadgeEnhanced** (`src/components/bpm/bpm-badge-enhanced.tsx`): Advanced BPM display with status indicators
- **Updated song displays**: Added BPM badges to playlist and search components

## Implementation Details

### Background Service Architecture

```typescript
class BPMBackgroundService {
  - queue: BPMAnalysisJob[]          // Priority-sorted job queue
  - processing: boolean              // Processing state flag
  - audioContext: AudioContext      // Web Audio API context
  - analyzer: AudioWorkletNode      // BPM analysis processor
  - listeners: Set<Function>        // State change subscribers
}
```

### Job Processing Flow

1. **Queue Addition**: Songs are added to queue with priority levels
2. **Automatic Processing**: Service processes jobs sequentially to avoid audio conflicts
3. **BPM Analysis**: Uses realtime-bpm-analyzer with 15-second stabilization time
4. **Database Storage**: Saves results via `/api/songs/[id]/bpm` endpoint
5. **Status Updates**: Notifies subscribers of progress changes

### Analysis States

- **Pending**: Song is queued for analysis
- **Processing**: Currently being analyzed
- **Completed**: Analysis finished successfully
- **Failed**: Analysis failed (with retry logic)

### Priority System

- **High**: Manual user requests, immediate analysis
- **Normal**: Automatic playlist analysis
- **Low**: Background discovery analysis

## Integration Points

### 1. Playlist Pages
```typescript
// Auto-analyze all songs in playlist
<BPMAutoAnalyzer 
  songs={playlist.songs.map(ps => ps.song)} 
  priority="normal"
/>

// Show analysis status
<BPMStatus compact />
```

### 2. Song Display Components
```typescript
// Enhanced song items with BPM badges
{song.bpm && (
  <Badge variant="secondary">
    {song.bpm} BPM
  </Badge>
)}
```

### 3. Search Results
- BPM information displayed in track metadata
- Automatic analysis for new discoveries

## Configuration

### Service Settings
- **Max Retries**: 3 attempts per song
- **Stabilization Time**: 15 seconds for stable BPM detection
- **Audio Volume**: 0.1 (low volume for background processing)
- **Cleanup Interval**: 30 minutes for old jobs

### Queue Management
- **Sequential Processing**: One song at a time to prevent audio conflicts
- **Priority Sorting**: High → Normal → Low
- **Automatic Cleanup**: Removes completed jobs after 1 hour

## API Integration

### BPM Update Endpoint
```typescript
PATCH /api/songs/[id]/bpm
{
  "bpm": number,
  "confidence": number
}
```

### Database Schema
```sql
-- Song table includes bmp field
bpm: Int? // Beats per minute
```

## Performance Considerations

### Memory Management
- **Audio cleanup**: Proper disposal of audio elements and contexts
- **Job pruning**: Automatic removal of old completed jobs
- **Listener cleanup**: Unsubscribe pattern for React components

### Audio Processing
- **Low volume playback**: 0.1 volume to minimize user distraction
- **Timeout handling**: 30-second timeout per analysis
- **Error recovery**: Graceful handling of audio loading failures

### Queue Optimization
- **Duplicate prevention**: Avoids re-analyzing songs already in queue
- **Priority updates**: Allows upgrading priority of existing jobs
- **Batch processing**: Efficient handling of multiple songs

## Usage Examples

### Basic Auto-Analysis
```typescript
import { BPMAutoAnalyzer } from '@/components/bpm'

// Automatically analyze songs when component mounts
<BPMAutoAnalyzer songs={songs} priority="normal" />
```

### Manual Queue Management
```typescript
import { useBPMBackground } from '@/components/bpm'

const { addToQueue, status, getSongBPM } = useBPMBackground()

// Add high-priority song
addToQueue(song, 'high')

// Check if song is being analyzed
const isAnalyzing = isSongBeingAnalyzed(song.id)

// Get detected BPM
const bpm = getSongBPM(song.id)
```

### Status Monitoring
```typescript
import { BPMStatus } from '@/components/bpm'

// Compact status in header
<BPMStatus compact />

// Full status card
<BPMStatus />
```

## Benefits

1. **Automatic Operation**: No user intervention required
2. **Background Processing**: Doesn't interfere with user experience
3. **Priority System**: Important analyses get processed first
4. **Real-time Updates**: UI updates as BPM values are detected
5. **Persistent Storage**: BPM values saved to database
6. **Error Handling**: Robust retry and error recovery
7. **Memory Efficient**: Proper cleanup and resource management

## Future Enhancements

1. **Batch Analysis**: Analyze multiple songs simultaneously
2. **Manual BPM Input**: Allow users to manually set BPM values
3. **BPM Filtering**: Filter playlists by BPM ranges
4. **Tempo Matching**: Suggest songs with similar BPM
5. **Analysis History**: Track analysis success rates and timing
6. **Web Worker**: Move analysis to web worker for better performance

## Technical Dependencies

- **realtime-bpm-analyzer**: Core BPM detection library
- **Web Audio API**: Browser audio processing
- **Prisma**: Database ORM for BPM storage
- **React**: UI framework and state management
- **Next.js**: API routes for BPM updates

This implementation provides a comprehensive, user-friendly BPM analysis system that enhances the music management experience with minimal user friction.