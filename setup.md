# Music Playlist Manager - Setup Guide

## Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Spotify Developer Account
- Git

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb music_playlist_manager`
3. Update `DATABASE_URL` in `.env.local`

#### Option B: Cloud Database (Recommended)
1. Create a PostgreSQL database on:
   - [Supabase](https://supabase.com) (Free tier available)
   - [Railway](https://railway.app) (Free tier available)
   - [Vercel Postgres](https://vercel.com/storage/postgres)
2. Copy the connection string to `.env.local`

### 3. Environment Variables
```bash
cp .env.example .env.local
```

Fill in the following variables in `.env.local`:
```env
# Required
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_SECRET="your-random-secret"
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"

# Optional (for development)
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Spotify App Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Copy Client ID and Secret to `.env.local`

### 5. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 6. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Working with Database
```bash
# View database in browser
npx prisma studio

# Reset database (careful!)
npx prisma db push --force-reset

# Generate Prisma client after schema changes
npx prisma generate
```

### Code Quality
```bash
# Run linting
npm run lint

# Type checking
npm run type-check
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run `npm install` to ensure all dependencies are installed
   - Restart your TypeScript server in VS Code

2. **Database connection errors**
   - Verify `DATABASE_URL` is correct in `.env.local`
   - Ensure database server is running
   - Check if database exists

3. **Spotify authentication not working**
   - Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
   - Check redirect URI in Spotify app settings
   - Ensure `NEXTAUTH_URL` matches your development URL

4. **Build errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Development Tips

1. **Hot Reloading**: The development server supports hot reloading for most changes
2. **Database Changes**: After modifying `prisma/schema.prisma`, run `npx prisma db push`
3. **Environment Variables**: Restart the development server after changing `.env.local`
4. **TypeScript**: Use `npm run type-check` to verify types without building

## Next Steps

After setup is complete, refer to `TODO.md` for development tasks and priorities.

## Support

If you encounter issues:
1. Check this troubleshooting section
2. Review the error messages carefully
3. Consult the Next.js, Prisma, and NextAuth.js documentation
4. Update `TODO.md` with any new issues discovered