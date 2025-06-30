# Music Playlist Manager

A web application that allows users to manage music playlists across multiple platforms including Spotify, Beatport, and SoundCloud.

## 🚀 Automated Internet Deployment

**Get your app live on the internet in 2 minutes with minimal setup!**

### One-Click Deployment (Recommended)
```bash
# 1. Get Spotify credentials from: https://developer.spotify.com/dashboard
# 2. Run one command:
SPOTIFY_CLIENT_ID=your_id SPOTIFY_CLIENT_SECRET=your_secret npm run deploy:one-click
```

**What happens automatically:**
- ✅ Creates GitHub repository
- ✅ Sets up database (Vercel Postgres)
- ✅ Deploys to internet (Vercel)
- ✅ Configures all environment variables
- ✅ Sets up CI/CD pipeline

### Other Automated Options
```bash
npm run deploy:ultra    # Ultra-automated with Railway (5 min)
npm run deploy         # Full automation with Supabase (10 min)
```

👉 **See [AUTOMATED_DEPLOYMENT.md](AUTOMATED_DEPLOYMENT.md) for complete guide**

## Features

- **Spotify Integration**: Connect your Spotify account and import playlists and songs
- **Playlist Management**: Easily modify existing playlists by adding/deleting songs
- **Sync to Spotify**: Sync playlists modified in the app back to Spotify
- **Beatport Integration**: Connect your Beatport account and purchase songs
- **SoundCloud Integration**: Connect your SoundCloud account for additional music discovery
- **Cross-Platform Purchasing**: Purchase songs from playlists directly through Beatport and SoundCloud

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui
- **State Management**: Zustand
- **Authentication**: NextAuth.js

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: OAuth 2.0 (Spotify, Beatport, SoundCloud)
- **Deployment**: Vercel

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── playlists/         # Playlist management pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility functions and configurations
│   ├── hooks/                 # Custom React hooks
│   ├── store/                 # State management
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
├── docs/                      # Documentation
└── TODO.md                    # Development roadmap
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env.local` and fill in your API keys:
   ```bash
   cp .env.example .env.local
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for required environment variables including:
- Spotify API credentials
- Beatport API credentials
- SoundCloud API credentials
- Database connection string
- NextAuth secret

## Contributing

See `TODO.md` for current development tasks and roadmap.