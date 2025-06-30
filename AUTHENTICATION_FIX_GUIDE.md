# Authentication Fix Guide

## Problem Identified
Your Music Playlist Manager application is failing to authenticate with Spotify because the required environment variables are not configured in your Vercel deployment.

## Current Issues
1. ✅ `SPOTIFY_CLIENT_ID` - Set
2. ✅ `SPOTIFY_CLIENT_SECRET` - Set  
3. ✅ `NEXTAUTH_SECRET` - Set
4. ✅ `NEXTAUTH_URL` - Set
5. ❌ `DATABASE_URL` - **MISSING** (Required for PrismaAdapter)

## Critical Missing Piece: DATABASE_URL

Your application uses `PrismaAdapter` for NextAuth, which requires a database connection. Without `DATABASE_URL`, the authentication will fail even with correct Spotify credentials.

## Step-by-Step Fix

### 1. Get Spotify App Credentials

First, you need to get your Spotify application credentials:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Sign in with your Spotify account
3. Create a new app or use an existing one
4. Note down your:
   - **Client ID**
   - **Client Secret**
5. **IMPORTANT**: Add your Vercel URL to the Redirect URIs:
   - `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`

### 2. Configure Vercel Environment Variables

You have several options to set environment variables in Vercel:

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add SPOTIFY_CLIENT_ID production
# Enter your Spotify Client ID when prompted

vercel env add SPOTIFY_CLIENT_SECRET production  
# Enter your Spotify Client Secret when prompted

vercel env add NEXTAUTH_SECRET production
# Enter a random 32-character string (you can generate one with: openssl rand -base64 32)

# NEXTAUTH_URL is optional for Vercel but you can set it:
vercel env add NEXTAUTH_URL production
# Enter: https://personal-home-kappa.vercel.app
```

#### Option B: Using Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project (likely named `personal-home`)
3. Go to **Settings** → **Environment Variables**
4. Add these variables for **Production**:
   - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret  
   - `NEXTAUTH_SECRET`: A random 32-character string
   - `NEXTAUTH_URL`: `https://personal-home-kappa.vercel.app`

### 3. Generate NEXTAUTH_SECRET

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

### 4. Update Spotify App Settings

1. In your Spotify Developer Dashboard
2. Go to your app settings
3. Add these Redirect URIs:
   - `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`
   - `http://localhost:3000/api/auth/callback/spotify` (for local development)
4. **Click SAVE** (this is crucial!)

### 5. Redeploy Your Application

After setting the environment variables:

```bash
# Trigger a new deployment
vercel --prod
```

Or you can trigger a redeploy from the Vercel dashboard.

### 6. Test the Authentication

1. Visit your deployed app: `https://personal-home-kappa.vercel.app`
2. Click "Sign in with Spotify"
3. You should be redirected to Spotify for authentication
4. After granting permissions, you should be redirected back and logged in

## Verification Steps

To verify everything is working:

1. **Check Environment Variables**: 
   ```bash
   vercel env ls
   ```

2. **Check Logs**: If still having issues, check Vercel function logs:
   ```bash
   vercel logs
   ```

3. **Test Callback URL**: The callback should be accessible at:
   `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`

## Common Issues & Solutions

### Issue: "Configuration Error"
- **Cause**: Missing or incorrect environment variables
- **Solution**: Double-check all environment variables are set correctly

### Issue: "Invalid Client" 
- **Cause**: Wrong Client ID/Secret or not set
- **Solution**: Verify Spotify credentials are correct

### Issue: "Callback URL Mismatch"
- **Cause**: Redirect URI not added to Spotify app
- **Solution**: Add the exact callback URL to Spotify app settings

### Issue: "Access Denied"
- **Cause**: User denied permissions or OAuth flow interrupted
- **Solution**: Try authentication again and approve all permissions

## Environment Variables Summary

Here's what each variable does:

- `SPOTIFY_CLIENT_ID`: Identifies your app to Spotify
- `SPOTIFY_CLIENT_SECRET`: Secret key for your Spotify app
- `NEXTAUTH_SECRET`: Encrypts JWT tokens and session data
- `NEXTAUTH_URL`: Your app's base URL (optional for Vercel)

## Next Steps

1. Set up the environment variables as described above
2. Redeploy your application
3. Test the authentication flow
4. If issues persist, check the Vercel function logs for specific error details

## Local Development

For local development, create a `.env.local` file:

```bash
cp .env.example .env.local
```

Then fill in your values:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXTAUTH_SECRET=your_random_secret_key_here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=your_database_connection_string
```

Remember to add `http://localhost:3000/api/auth/callback/spotify` to your Spotify app's redirect URIs for local testing.