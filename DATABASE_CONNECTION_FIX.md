# Database Connection Fix Guide

## Current Issue Summary

The database schema setup is failing with the error:
```
❌ Database connection failed
Error: Environment variable not found: POSTGRES_PRISMA_URL
```

## Root Cause Analysis

1. **✅ Prisma Client Generated Successfully** - The Prisma client was generated without issues
2. **✅ Dependencies Installed** - All npm packages are properly installed
3. **❌ Environment Variables Missing** - The `.env.local` file contains placeholder values instead of actual database credentials

## Current Environment Status

The `.env.local` file contains placeholder values:
```bash
POSTGRES_URL="postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb"
POSTGRES_PRISMA_URL="postgresql://username:password@ep-example-123456-pooler.us-east-2.aws.neon.tech/neondb?pgbouncer=true&connection_limit=1"
POSTGRES_URL_NON_POOLING="postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/neondb"
```

These are **example values** and need to be replaced with actual database credentials.

## Solution Options

### Option 1: Use Vercel Environment Variables (Recommended)

If this project is deployed on Vercel and has a database configured:

```bash
# Install Vercel CLI if not available
npm install -g vercel

# Login to Vercel (requires interactive authentication)
vercel login

# Pull environment variables from Vercel project
vercel env pull .env.local

# Test the connection
npm run db:test
```

### Option 2: Create a Neon Database (Manual Setup)

1. **Create Neon Account**:
   - Go to https://console.neon.tech
   - Sign up or log in with GitHub/Google
   - Click "New Project"

2. **Create Database Project**:
   - Project name: `music-playlist-manager`
   - Select region closest to your users
   - Click "Create Project"

3. **Get Connection Strings**:
   - In your Neon dashboard, click "Connect"
   - Copy the connection strings (they'll look like):
     ```
     postgresql://user:pass@ep-xxx-123456.region.aws.neon.tech/neondb
     ```

4. **Update .env.local**:
   Replace the placeholder values with your actual Neon credentials:
   ```bash
   POSTGRES_URL="your-actual-direct-connection-string"
   POSTGRES_PRISMA_URL="your-actual-pooled-connection-string"
   POSTGRES_URL_NON_POOLING="your-actual-direct-connection-string"
   ```

### Option 3: Use Local PostgreSQL (Development Only)

For local development, you can set up a local PostgreSQL instance:

```bash
# Install PostgreSQL locally (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb music_playlist_manager
sudo -u postgres createuser --interactive

# Update .env.local with local connection
POSTGRES_URL="postgresql://username:password@localhost:5432/music_playlist_manager"
POSTGRES_PRISMA_URL="postgresql://username:password@localhost:5432/music_playlist_manager"
POSTGRES_URL_NON_POOLING="postgresql://username:password@localhost:5432/music_playlist_manager"
```

## Testing Your Setup

After configuring your database credentials:

1. **Test Database Connection**:
   ```bash
   npm run db:test
   ```

2. **Generate Prisma Client** (if needed):
   ```bash
   npm run db:generate
   ```

3. **Create Database Tables**:
   ```bash
   npm run db:push
   ```

4. **Verify Schema**:
   ```bash
   npm run db:studio
   ```

## Expected Success Output

When properly configured, you should see:
```
🔄 Testing database connection...
✅ Database connected successfully

📋 Environment Variables:
POSTGRES_URL: ✅ Set
POSTGRES_PRISMA_URL: ✅ Set
POSTGRES_URL_NON_POOLING: ✅ Set

🧪 Testing database operations...
📊 Users in database: 0
📊 Playlists in database: 0
📊 Songs in database: 0

✅ All database tests passed!
```

## Additional Configuration

### Spotify API Setup (Optional)
1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Update `.env.local`:
   ```bash
   SPOTIFY_CLIENT_ID=your-actual-client-id
   SPOTIFY_CLIENT_SECRET=your-actual-client-secret
   ```

## Troubleshooting

### Error: "Environment variable not found"
- Ensure `.env.local` exists in project root
- Verify environment variables don't have quotes around the values
- Restart your development server after changing environment variables

### Error: "Connection timeout"
- Check your internet connection
- Verify database credentials are correct
- Ensure database server is running (for local setups)

### Error: "Authentication failed"
- Double-check username and password in connection string
- Verify database user has proper permissions

## Next Steps

1. Choose one of the solution options above
2. Configure your database credentials
3. Run `npm run db:test` to verify connection
4. Run `npm run db:push` to create database schema
5. Start development with `npm run dev`

## Support Resources

- [Neon Documentation](https://neon.tech/docs)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/postgres)
- [Prisma Documentation](https://www.prisma.io/docs)
- Project Setup Guide: `DATABASE_SETUP_SOLUTION.md`