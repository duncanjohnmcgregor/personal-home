# INVALID_CLIENT Error Fix Guide

## Current Issue
You're encountering `INVALID_CLIENT: Invalid client` error when trying to authenticate with Spotify.

## Updated Solution (February 2025)

### 1. Check Your Current Deployment URL
First, determine your actual deployment URL. Based on your project history, it might be one of these:
- `https://personal-home-kappa.vercel.app`
- `https://personal-home-17oclx9gq-duncanjohnmcgregors-projects.vercel.app`

### 2. Update Spotify Developer App Settings

**CRITICAL**: As of February 2025, Spotify has updated security requirements:
- ❌ HTTP redirect URIs are no longer supported (except localhost loopback)
- ✅ Only HTTPS redirect URIs are accepted
- ✅ Loopback addresses like `http://127.0.0.1:3000` still work for development

#### Steps to Fix:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Find your app and click "Edit Settings"
3. In "Redirect URIs", **replace all existing URIs** with:

**For Production:**
```
https://your-actual-vercel-url.vercel.app/api/auth/callback/spotify
```

**For Development (optional):**
```
http://127.0.0.1:3000/api/auth/callback/spotify
```

4. **Remove any HTTP URIs** that aren't loopback addresses
5. Click "Save"

### 3. Verify Environment Variables in Vercel

Ensure these environment variables are correctly set in your Vercel deployment:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXTAUTH_URL=https://your-actual-vercel-url.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_key
```

### 4. Check Your Current NextAuth Configuration

Your current `src/lib/auth.ts` looks correct, but verify it matches this:

```typescript
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import SpotifyProvider from 'next-auth/providers/spotify'
import { prisma } from '@/lib/prisma'

const spotifyScopes = [
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
].join(' ')

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: spotifyScopes,
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
  },
}
```

### 5. Test the Authentication Flow

1. Clear your browser cache and cookies
2. Try accessing your app: `https://your-vercel-url.vercel.app`
3. Click "Sign in with Spotify"
4. You should be redirected to Spotify's authorization page
5. After granting permissions, you should be redirected back to your app

### 6. Common Troubleshooting Steps

#### A. If you still get INVALID_CLIENT:
- Double-check the redirect URI in Spotify matches EXACTLY: `https://your-domain.vercel.app/api/auth/callback/spotify`
- Ensure there are no typos in your Spotify Client ID/Secret
- Verify your Spotify app is not in "Development Mode" restrictions

#### B. If you get "Application Request Error":
- Check that your NEXTAUTH_URL environment variable matches your actual deployment URL
- Ensure NEXTAUTH_SECRET is set and is a secure random string

#### C. If the authentication page doesn't load:
- Verify your Vercel deployment is successful
- Check Vercel logs: `vercel logs --follow`
- Ensure all environment variables are set in Vercel dashboard

### 7. Generate Secure NEXTAUTH_SECRET

If you haven't set a secure NEXTAUTH_SECRET, generate one:

```bash
openssl rand -base64 32
```

Then add it to your Vercel environment variables.

### 8. Migration from Previous Setup

If you were using HTTP redirect URIs before February 2025:
- ❌ `http://localhost:3000/api/auth/callback/spotify` 
- ✅ `http://127.0.0.1:3000/api/auth/callback/spotify` (for development)
- ✅ `https://your-domain.vercel.app/api/auth/callback/spotify` (for production)

### 9. Verification Checklist

- [ ] Spotify Developer App redirect URI uses HTTPS (or loopback for dev)
- [ ] SPOTIFY_CLIENT_ID matches your Spotify app
- [ ] SPOTIFY_CLIENT_SECRET is correct
- [ ] NEXTAUTH_URL matches your deployment URL exactly
- [ ] NEXTAUTH_SECRET is set and secure
- [ ] Browser cache/cookies cleared
- [ ] Vercel deployment is successful

### 10. Quick Fix Script

Run this in your terminal to check and update your Vercel environment variables:

```bash
# Check current deployment URL
vercel ls

# Update environment variables if needed
vercel env add NEXTAUTH_URL production
# Enter: https://your-actual-vercel-url.vercel.app

vercel env add NEXTAUTH_SECRET production
# Enter: your-generated-secret

# Redeploy
vercel --prod
```

## Success Indicators

✅ No "INVALID_CLIENT" error
✅ Spotify consent screen appears
✅ User is successfully redirected back to your app
✅ Session is created with Spotify user data

## If You Still Have Issues

1. Check the exact error in your browser's developer console
2. Review Vercel deployment logs
3. Ensure your Spotify app quota limits aren't exceeded
4. Consider creating a new Spotify app if the old one has configuration conflicts

## Contact Support

If none of these steps work:
- Post in [NextAuth.js GitHub Discussions](https://github.com/nextauthjs/next-auth/discussions)
- Check [Spotify Developer Community](https://community.spotify.com/t5/Spotify-for-Developers/bd-p/Spotify_Developer)