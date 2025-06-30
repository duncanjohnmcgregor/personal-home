# Music Playlist Manager - Deployment Guide

This guide will help you deploy the Music Playlist Manager to production and make it available on the internet.

## Quick Deployment to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- PostgreSQL database (Supabase/Railway/Vercel Postgres)
- Spotify Developer App

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Ensure all files are committed including the new deployment infrastructure

### Step 2: Set Up Database
Choose one of these options:

#### Option A: Supabase (Recommended - Free Tier)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (starts with `postgresql://`)

#### Option B: Railway (Free Tier)
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string

#### Option C: Vercel Postgres
1. Go to your Vercel dashboard
2. Create a Postgres database
3. Copy the connection string

### Step 3: Set Up Spotify Developer App
1. Go to [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set the redirect URI to: `https://your-app-name.vercel.app/api/auth/callback/spotify`
4. Note down the Client ID and Client Secret

### Step 4: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables in Vercel dashboard:

```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secure-random-secret
DATABASE_URL=your-postgresql-connection-string
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

4. Deploy the application

### Step 5: Set Up GitHub Secrets (Optional - for CI/CD)
Add these secrets to your GitHub repository settings:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
PRODUCTION_URL=https://your-app-name.vercel.app
```

## Manual Deployment

### Using the Deployment Script
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

### Using Docker
```bash
# Build the Docker image
docker build -t music-playlist-manager .

# Run with Docker Compose (for local testing)
docker-compose up
```

## Post-Deployment Setup

### 1. Database Migration
Run the migration script to set up your database:
```bash
./scripts/migrate.sh production
```

### 2. Health Check
Verify your deployment:
```bash
./scripts/health-check.sh production
```

### 3. Domain Setup (Optional)
- Add your custom domain in Vercel dashboard
- Update NEXTAUTH_URL environment variable
- Update Spotify app redirect URI

## Environment Variables Reference

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Your app's URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret for JWT | Generate with `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | From Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Spotify app secret | From Spotify Developer Dashboard |

### Optional Variables
| Variable | Description |
|----------|-------------|
| `VERCEL_URL` | Automatically set by Vercel |
| `SENTRY_DSN` | For error tracking |
| `VERCEL_ANALYTICS_ID` | For analytics |

## Troubleshooting

### Common Issues

#### 1. "NEXTAUTH_URL environment variable is not set"
- Ensure `NEXTAUTH_URL` is set in your Vercel environment variables
- Must match your actual domain (including https://)

#### 2. "Database connection failed"
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Check if database exists and is accessible

#### 3. "Spotify authentication not working"
- Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
- Check redirect URI in Spotify app settings matches your domain
- Ensure Spotify app is not in development mode for production use

#### 4. "Build failed"
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Run `npm run build` locally to test

### Monitoring and Maintenance

#### Health Checks
The app includes a health check endpoint at `/api/health` that monitors:
- Application status
- Environment configuration

#### GitHub Actions
The repository includes automated workflows for:
- Continuous Integration (tests, linting, type checking)
- Staging deployments (on develop branch)
- Production deployments (on main branch)

#### Manual Commands
```bash
# Check application health
curl https://your-app.vercel.app/api/health

# Run local health check script
./scripts/health-check.sh production

# Run database migrations
./scripts/migrate.sh production
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to the repository
2. **NEXTAUTH_SECRET**: Use a cryptographically secure random string
3. **Database**: Use connection strings with proper SSL settings
4. **Spotify Credentials**: Restrict app permissions in Spotify Developer Dashboard

## Performance Optimization

1. **Database**: Use connection pooling for production databases
2. **Caching**: Vercel automatically caches static assets
3. **Images**: Optimize images using Next.js Image component
4. **API Routes**: Implement proper caching headers

## Next Steps

After successful deployment:
1. Test all authentication flows
2. Import some test playlists from Spotify
3. Verify database operations work correctly
4. Set up monitoring and alerts
5. Configure custom domain (if desired)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check GitHub Actions workflow logs
4. Verify all environment variables are set correctly

The app should now be live and accessible at your Vercel URL! 🎉