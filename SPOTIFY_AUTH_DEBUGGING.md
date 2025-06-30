# Spotify Authentication Debugging Guide

## Current Issue
You're getting `INVALID_CLIENT: Invalid redirect URI` when trying to sign into Spotify on your deployed Vercel app.

## Root Cause
The redirect URI configured in your Spotify Developer App doesn't match the actual redirect URI that NextAuth.js is using.

## Required Fix

### 1. Update Spotify Developer App Settings
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Find your app and click "Edit Settings"
3. In "Redirect URIs", add this exact URL:
   ```
   https://personal-home-17oclx9gq-duncanjohnmcgregors-projects.vercel.app/api/auth/callback/spotify
   ```
4. Remove any incorrect URIs (like localhost URLs if they exist)
5. Click "Save"

### 2. Verify Environment Variables
Ensure these are set correctly in your Vercel deployment:
- `SPOTIFY_CLIENT_ID` - Your Spotify app's Client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app's Client Secret
- `NEXTAUTH_URL` - Your deployed app URL: `https://personal-home-17oclx9gq-duncanjohnmcgregors-projects.vercel.app`
- `NEXTAUTH_SECRET` - A random secret string

### 3. Common Mistakes to Avoid
- ❌ Using localhost URLs in production
- ❌ Missing the `/api/auth/callback/spotify` path
- ❌ Using HTTP instead of HTTPS
- ❌ Typos in the domain name
- ❌ Extra trailing slashes

### 4. How to Verify the Correct Redirect URI
1. Try to sign in and get the error page
2. Check the browser's address bar - it will show the exact redirect URI being used
3. Copy that exact URI to your Spotify app settings

### 5. Testing Steps
After updating the redirect URI:
1. Wait a few minutes for Spotify's settings to propagate
2. Clear your browser cache/cookies
3. Try the authentication flow again
4. Check your Vercel deployment logs for any additional errors

## Current NextAuth Configuration
Your auth configuration in `src/lib/auth.ts` looks correct:
- Spotify provider is properly configured
- Required scopes are included
- Callbacks are set up for token handling

## If Issue Persists
1. Check Vercel deployment logs: `vercel logs your-deployment-url`
2. Verify all environment variables are set in Vercel dashboard
3. Ensure your Spotify app is not in "Development Mode" restrictions
4. Try generating new Client Secret in Spotify dashboard

## Success Indicators
- No "INVALID_CLIENT" error
- Spotify consent screen appears
- User is redirected back to your app successfully
- Session is created with Spotify data