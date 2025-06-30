# Authentication Bug Fix Guide

## Issue Diagnosis

The "An authentication error occurred. Please try again." error is happening because the Spotify authentication is not properly configured. Based on the analysis, here are the main issues identified:

## Root Causes

1. **Missing/Invalid Spotify Credentials**: The environment variables contain placeholder values instead of actual Spotify app credentials
2. **Incorrect Callback URL Configuration**: The callback URL might not match between Spotify app settings and deployment configuration
3. **Environment Variable Issues**: Missing or incorrectly configured environment variables in the deployment

## Quick Fix Steps

### 1. Set Up Spotify App Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use existing one
3. Get your `Client ID` and `Client Secret`
4. Add the correct redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/spotify`
   - For production: `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`

### 2. Update Environment Variables

#### For Local Development (.env.local):
```bash
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000

# Your actual Spotify credentials
SPOTIFY_CLIENT_ID=your-actual-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-actual-spotify-client-secret

# Database URL (update with your actual database)
DATABASE_URL="postgresql://username:password@localhost:5432/music_playlist_manager"
```

#### For Vercel Deployment:
Run these commands in your project directory:

```bash
# Set production environment variables
npx vercel env add NEXTAUTH_SECRET production
# Paste your generated secret when prompted

npx vercel env add NEXTAUTH_URL production
# Enter: https://personal-home-kappa.vercel.app

npx vercel env add SPOTIFY_CLIENT_ID production
# Enter your actual Spotify client ID

npx vercel env add SPOTIFY_CLIENT_SECRET production
# Enter your actual Spotify client secret

# Redeploy
npx vercel --prod
```

### 3. Verify Spotify App Settings

In your Spotify app settings, ensure:
- **Redirect URIs** include: `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`
- **App status** is not in development mode (if you need public access)
- **Users** are added to the allowlist (if in development mode)

### 4. Test the Fix

1. Clear browser cache and cookies
2. Try authentication again
3. Check browser developer console for any JavaScript errors
4. Check Vercel function logs for server-side errors

## Additional Debugging Steps

### Check Environment Variables

```bash
# In your project directory
npx vercel env ls
```

### Enable Debug Mode

Add to your environment variables:
```bash
NEXTAUTH_DEBUG=true
```

### Common Error Scenarios

| Error Type | Cause | Solution |
|------------|-------|----------|
| `Configuration` | Invalid client credentials | Update SPOTIFY_CLIENT_ID/SECRET |
| `OAuthSignin` | Callback URL mismatch | Fix redirect URIs in Spotify app |
| `AccessDenied` | User denied permissions | User needs to approve app permissions |
| `Verification` | Invalid state/PKCE | Check NEXTAUTH_SECRET and clear cookies |

### Database Considerations

If you're getting database-related errors:
1. Ensure DATABASE_URL is correctly set
2. Run Prisma migrations: `npx prisma db push`
3. Check if the database is accessible from Vercel

## Testing Checklist

- [ ] Spotify app has correct redirect URIs
- [ ] All environment variables are set in Vercel
- [ ] NEXTAUTH_SECRET is a secure random string
- [ ] NEXTAUTH_URL matches your deployment URL
- [ ] Database is accessible and schema is up to date
- [ ] App is redeployed after environment variable changes

## Still Having Issues?

1. Check Vercel function logs in your Vercel dashboard
2. Enable debug mode and check browser console
3. Verify Spotify app is not in restricted mode
4. Try authentication with a different browser/incognito mode
5. Check if your Spotify account has any restrictions

## Quick Commands

```bash
# Generate a secure secret
openssl rand -base64 32

# Check current environment
npx vercel env ls

# Deploy with logs
npx vercel --prod --debug

# Run locally with debugging
npm run dev
```

This should resolve the authentication error. The key is ensuring all environment variables are properly set with actual values, not placeholders.