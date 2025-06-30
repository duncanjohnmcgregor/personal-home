# Spotify Authentication Callback Error Fix

## Problem Analysis

You're experiencing a "Callback" error after Spotify authentication because of URL mismatches and configuration issues. The error URL shows:
```
https://personal-home-kappa.vercel.app/auth/signin?callbackUrl=https%3A%2F%2Fpersonal-home-kappa.vercel.app%2Fdashboard&error=Callback
```

## Root Causes Identified

### 1. NEXTAUTH_URL Mismatch
- **Current**: `NEXTAUTH_URL=https://music-playlist-manager.vercel.app` (in .env.production)
- **Actual**: `https://personal-home-kappa.vercel.app`
- **Impact**: NextAuth can't properly handle OAuth callbacks

### 2. Spotify App Redirect URI Mismatch
- **Required**: `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`
- **Likely Current**: Wrong or missing redirect URI in Spotify app settings

### 3. Missing Database Connection
- **Issue**: Using PrismaAdapter but DATABASE_URL might not be set in Vercel
- **Impact**: Authentication sessions can't be stored

## Step-by-Step Fix

### Step 1: Fix Spotify App Settings

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Sign in and select your app
3. Click **"Edit Settings"**
4. In **"Redirect URIs"**, add EXACTLY:
   ```
   https://personal-home-kappa.vercel.app/api/auth/callback/spotify
   ```
5. **IMPORTANT**: Click **"SAVE"** at the bottom

### Step 2: Update Vercel Environment Variables

You need to set/update these environment variables in Vercel:

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: `personal-home`
3. Go to **Settings** → **Environment Variables**
4. Update/Add these variables for **Production**:

```bash
NEXTAUTH_URL=https://personal-home-kappa.vercel.app
NEXTAUTH_SECRET=your-32-character-random-string
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
DATABASE_URL=your-database-connection-string
```

#### Option B: Using Vercel CLI
```bash
# Install and login to Vercel CLI
npm install -g vercel
vercel login

# Link your project (if not already linked)
vercel link

# Update environment variables
vercel env add NEXTAUTH_URL production
# Enter: https://personal-home-kappa.vercel.app

vercel env add NEXTAUTH_SECRET production
# Enter: (generate with: openssl rand -base64 32)

vercel env add SPOTIFY_CLIENT_ID production
# Enter: your Spotify Client ID

vercel env add SPOTIFY_CLIENT_SECRET production
# Enter: your Spotify Client Secret

# If using database sessions, also add:
vercel env add DATABASE_URL production
# Enter: your database connection string
```

### Step 3: Generate Secure NEXTAUTH_SECRET

Generate a secure secret:
```bash
# On macOS/Linux:
openssl rand -base64 32

# Or use online generator:
# https://generate-secret.vercel.app/32
```

### Step 4: Set Up Database (If Using Database Sessions)

Since your app uses PrismaAdapter, you need a database:

#### Option A: Vercel Postgres (Recommended)
```bash
# Create Vercel Postgres database
vercel storage create postgres

# Pull environment variables
vercel env pull .env.local

# The DATABASE_URL will be automatically added to Vercel
```

#### Option B: External Database (Neon, PlanetScale, etc.)
1. Create a database on your preferred provider
2. Get the connection string
3. Add it to Vercel environment variables as `DATABASE_URL`

### Step 5: Update Production Environment File

Update your `.env.production` file to match the correct URL:

```bash
# Application
NEXTAUTH_URL=https://personal-home-kappa.vercel.app
NEXTAUTH_SECRET=your-secure-random-secret

# Database
DATABASE_URL=your-database-connection-string

# Spotify API
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Production configurations
NODE_ENV=production
VERCEL_URL=https://personal-home-kappa.vercel.app
```

### Step 6: Redeploy Application

After updating environment variables:
```bash
# Trigger new deployment
vercel --prod

# Or redeploy from Vercel dashboard
```

### Step 7: Test Authentication Flow

1. Visit: `https://personal-home-kappa.vercel.app`
2. Click "Sign in with Spotify"
3. Should redirect to Spotify
4. After granting permissions, should redirect back successfully

## Verification Checklist

- [ ] Spotify app has correct redirect URI: `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`
- [ ] `NEXTAUTH_URL` matches actual deployment URL
- [ ] `NEXTAUTH_SECRET` is set and secure
- [ ] Spotify credentials are correct
- [ ] `DATABASE_URL` is set (if using database sessions)
- [ ] Application redeployed after environment variable changes

## Common Issues & Solutions

### Issue: Still getting "Callback" error
**Solution**: Double-check Spotify app redirect URI is EXACTLY correct and saved

### Issue: "Configuration" error
**Solution**: Verify all environment variables are set in Vercel production environment

### Issue: "OAuthCallback" error
**Solution**: Check that NEXTAUTH_URL matches your actual deployment URL

### Issue: User gets signed out immediately
**Solution**: Ensure DATABASE_URL is set if using database sessions

## Alternative: Switch to JWT Sessions

If you want to avoid database setup, you can switch to JWT sessions:

1. Update `src/lib/auth.ts`:
```typescript
export const authOptions: NextAuthOptions = {
  // Remove or comment out the adapter line
  // adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // Change from 'database' to 'jwt'
  },
  // ... rest of config
}
```

2. Redeploy the application

**Note**: JWT sessions don't persist user data in database, but work without DATABASE_URL.

## Testing the Fix

After implementing the fixes:

1. **Test Callback URL**: Visit directly:
   `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`
   Should show "400 Bad Request" (normal - means endpoint exists)

2. **Test Authentication**: 
   - Go to your app
   - Click "Sign in with Spotify"
   - Complete OAuth flow
   - Should redirect to dashboard successfully

3. **Check Logs**: If issues persist, check Vercel function logs:
   ```bash
   vercel logs --follow
   ```

## Success Indicators

✅ **Fixed when**:
- No "Callback" error in URL
- Successful redirect to `/dashboard` after Spotify auth
- User session persists (can refresh page and stay logged in)
- No authentication errors in Vercel logs

The main issue is the URL mismatch between your Spotify app settings and actual deployment URL. Fix the redirect URI in Spotify and update NEXTAUTH_URL, and the authentication should work properly.