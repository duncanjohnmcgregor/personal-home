# BPM Analyzer Implementation

This document describes the implementation of a real-time BPM (Beats Per Minute) detection feature for the music playlist manager using the `realtime-bpm-analyzer` library.

## Overview

The BPM analyzer can detect the tempo of songs from their preview URLs in real-time using the Web Audio API. This feature is useful for DJs, music producers, and anyone who wants to analyze the tempo of their music collection.

## Features

- **Real-time BPM Detection**: Analyzes audio from song preview URLs
- **Web Audio API Integration**: Uses AudioWorkletProcessor for efficient audio processing
- **Confidence Scoring**: Provides confidence levels for BPM detection accuracy
- **Progressive Analysis**: Shows current and stable BPM values as analysis progresses
- **Cross-Origin Audio Support**: Handles CORS for external audio URLs
- **Modern UI Components**: Beautiful React components with progress indicators

## Implementation Details

### 1. Dependencies

- `realtime-bpm-analyzer`: Core BPM detection library
- `@radix-ui/react-progress`: Progress bar component
- Web Audio API (built into modern browsers)

### 2. Key Files Created/Modified

#### Core Hook: `src/lib/hooks/use-bpm-analyzer.ts`
- Custom React hook that wraps the realtime-bpm-analyzer library
- Manages audio context, analyzer state, and audio playback
- Provides methods for starting/stopping analysis and calculating average BPM
- Handles browser compatibility and error states

#### BPM Analyzer Component: `src/components/bpm/bpm-analyzer.tsx`
- React component for the BPM analysis interface
- Shows real-time BPM values, confidence levels, and analysis progress
- Provides controls for starting, stopping, and resetting analysis
- Displays recent analysis results and stable BPM calculations

#### Demo Page: `src/app/bpm-demo/page.tsx`
- Complete demo interface showcasing the BPM analyzer
- Allows users to select sample songs or input custom preview URLs
- Shows analysis results and provides usage instructions

#### UI Components:
- `src/components/ui/progress.tsx`: Progress bar component
- `src/components/ui/alert.tsx`: Alert/notification component

#### API Endpoint: `src/app/api/songs/[id]/bpm/route.ts`
- REST API for saving BPM values to the database
- PATCH endpoint for updating song BPM
- GET endpoint for retrieving song BPM data

#### Database Schema: `prisma/schema.prisma`
- Added `bpm` field to the Song model
- Added index for efficient BPM-based queries

#### Types: `src/types/index.ts`
- Added `bpm?: number` field to the Song interface

### 3. Required Files

The library requires the AudioWorklet processor file to be publicly accessible:
- `public/realtime-bpm-processor.js` (copied from node_modules)

## Usage

### Basic Usage

```tsx
import { BPMAnalyzer } from '@/components/bpm/bpm-analyzer'

function MyComponent() {
  const song = {
    id: '1',
    title: 'Example Song',
    artist: 'Example Artist',
    previewUrl: 'https://example.com/preview.mp3',
    // ... other song properties
  }

  const handleBPMDetected = (bpm: number, confidence: number) => {
    console.log(`Detected BPM: ${bpm} (confidence: ${confidence})`)
  }

  return (
    <BPMAnalyzer 
      song={song} 
      onBPMDetected={handleBPMDetected}
    />
  )
}
```

### Hook Usage

```tsx
import { useBPMAnalyzer } from '@/lib/hooks/use-bpm-analyzer'

function CustomBPMComponent() {
  const {
    isAnalyzing,
    currentBPM,
    confidence,
    error,
    analyzeFromURL,
    stopAnalysis,
    getAverageBPM,
    isSupported
  } = useBPMAnalyzer()

  const handleAnalyze = () => {
    analyzeFromURL('https://example.com/song.mp3')
  }

  return (
    <div>
      <button onClick={handleAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
      </button>
      {currentBPM && <p>BPM: {currentBPM}</p>}
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

### API Usage

```typescript
// Update song BPM
const response = await fetch(`/api/songs/${songId}/bpm`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bpm: 128, confidence: 0.95 })
})

// Get song BPM
const response = await fetch(`/api/songs/${songId}/bpm`)
const data = await response.json()
```

## Technical Implementation

### Audio Processing Flow

1. **Audio Context Creation**: Creates Web Audio API context
2. **AudioWorklet Setup**: Initializes the realtime-bpm-analyzer processor
3. **Audio Source**: Creates MediaElementAudioSource from HTML audio element
4. **Filter Chain**: Applies lowpass filter for better BPM detection
5. **Analysis**: Connects audio through analyzer node for real-time processing
6. **Results**: Receives BPM data via message port communication

### BPM Detection Algorithm

The library uses the Tornqvist algorithm (based on Joe Sullivan's work):
1. Applies lowpass filter to isolate bass frequencies
2. Detects peaks in the audio signal using amplitude thresholding
3. Calculates intervals between peaks
4. Uses multiple threshold levels to find the most consistent BPM
5. Provides confidence scoring based on peak consistency

### Browser Compatibility

- **Supported**: Chrome, Firefox, Safari, Edge (modern versions)
- **Required**: Web Audio API support
- **CORS**: Requires proper CORS headers for external audio URLs

## Configuration Options

### Analyzer Options

```typescript
const options = {
  continuousAnalysis: true,     // Enable continuous analysis mode
  stabilizationTime: 20000,     // Time to stabilize BPM (ms)
}
```

### Audio Context Options

```typescript
const audioContext = new AudioContext({
  sampleRate: 44100,           // Sample rate for audio processing
  latencyHint: 'interactive'   // Optimize for real-time interaction
})
```

## Performance Considerations

- **Memory Usage**: Continuous analysis mode prevents memory leaks by periodically clearing data
- **CPU Usage**: AudioWorklet runs on separate thread for better performance
- **Network**: Preview URLs should be reasonably short (30-60 seconds) for quick analysis
- **Accuracy**: Longer analysis time generally provides better accuracy

## Limitations

- Requires audio preview URLs (not all songs may have them)
- CORS restrictions may limit analysis of external URLs
- Microphone input not recommended for continuous analysis
- Some complex music (polyrhythmic, tempo changes) may be challenging to analyze

## Future Enhancements

1. **Batch Analysis**: Analyze multiple songs simultaneously
2. **Offline Analysis**: Support for local file uploads
3. **BPM History**: Track BPM changes over time
4. **Genre Detection**: Combine with music genre classification
5. **Playlist BPM Matching**: Suggest songs with similar BPM for DJ mixing
6. **BPM Visualization**: Real-time waveform and tempo visualization

## Demo

Visit `/bpm-demo` to see the BPM analyzer in action with sample songs and custom URL input.

## Troubleshooting

### Common Issues

1. **"BPM analysis is not supported"**: Browser doesn't support Web Audio API
2. **"No preview URL available"**: Song doesn't have a preview URL
3. **"Failed to load audio"**: CORS issues or invalid URL
4. **"Analysis failed"**: Audio format not supported or network issues

### Solutions

1. Use a modern browser with Web Audio API support
2. Ensure songs have valid preview URLs
3. Check CORS headers on audio URLs
4. Verify audio format is supported (MP3, WAV, FLAC)

## Security Considerations

- Audio URLs are processed client-side (no server audio processing)
- User authentication required for API endpoints
- Input validation on BPM values
- Rate limiting should be considered for production use