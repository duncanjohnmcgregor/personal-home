# Spotify Authentication Fix - Step by Step Guide

## Current Issue
You can sign into Spotify successfully, but when you're redirected back to your app, you see an error message and the "Sign in with Spotify" button appears again.

## Root Cause
The redirect URI configured in your Spotify Developer App doesn't match your actual deployment URL.

## Step-by-Step Fix

### Step 1: Identify Your Current Deployment URL
From your browser address bar, your current app URL appears to be:
```
https://personal-home-17oclx9gq-duncanjohnmcgregors-projects.vercel.app
```

### Step 2: Update Spotify Developer App Settings

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account

2. **Find Your App**
   - Look for your music playlist manager app
   - Click on the app name to open settings

3. **Edit Settings**
   - Click the "Edit Settings" button

4. **Update Redirect URIs**
   - In the "Redirect URIs" section, **ADD** this exact URL:
   ```
   https://personal-home-17oclx9gq-duncanjohnmcgregors-projects.vercel.app/api/auth/callback/spotify
   ```
   
   - **Important**: Make sure the URL is exactly as shown above, including:
     - `https://` (not http)
     - The exact domain name
     - `/api/auth/callback/spotify` at the end

5. **Remove Old URIs (Optional)**
   - If there are any old redirect URIs (like localhost or music-playlist-manager URLs), you can remove them
   - Keep only the new URI for your current deployment

6. **Save Changes**
   - Click "Save" at the bottom of the settings page

### Step 3: Update Environment Variables in Vercel

1. **Log into Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Find your project

2. **Update Environment Variables**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Update or add these variables:

   ```
   NEXTAUTH_URL=https://personal-home-17oclx9gq-duncanjohnmcgregors-projects.vercel.app
   SPOTIFY_CLIENT_ID=your_actual_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_actual_spotify_client_secret
   NEXTAUTH_SECRET=your_secure_random_secret
   ```

   **Note**: Make sure `NEXTAUTH_URL` matches your actual deployment URL exactly.

### Step 4: Redeploy Your Application

1. **Trigger a New Deployment**
   - Go to your project's "Deployments" tab in Vercel
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger automatic deployment

### Step 5: Test the Authentication Flow

1. **Clear Browser Data**
   - Clear cookies and cache for your app
   - Or use an incognito/private browsing window

2. **Test Authentication**
   - Go to your app URL
   - Click "Sign in with Spotify"
   - You should see Spotify's authorization page
   - Grant permissions
   - You should be redirected back successfully

## Verification Checklist

- [ ] Spotify redirect URI exactly matches: `https://[your-domain]/api/auth/callback/spotify`
- [ ] NEXTAUTH_URL environment variable matches your deployment URL
- [ ] SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are correct
- [ ] NEXTAUTH_SECRET is set to a secure random string
- [ ] Browser cache/cookies cleared
- [ ] New deployment completed successfully

## If You Still Have Issues

### Check Browser Developer Tools
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to sign in again
4. Look for failed requests and error messages

### Check Vercel Logs
1. In Vercel dashboard, go to your project
2. Click on "Functions" tab
3. Look for any error logs during authentication

### Common Issues and Solutions

**Issue**: Still getting "Invalid client" error
- **Solution**: Double-check the redirect URI in Spotify matches exactly

**Issue**: Getting "Application Request Error"
- **Solution**: Verify NEXTAUTH_URL matches your actual deployment URL

**Issue**: Authentication seems to work but user data is missing
- **Solution**: Check if NEXTAUTH_SECRET is properly set

**Issue**: Getting 500 errors
- **Solution**: Check Vercel function logs for database connection issues

## Quick Verification Commands

If you have access to your deployment environment, you can verify these URLs:

```bash
# Your app should be accessible at:
curl -I https://personal-home-17oclx9gq-duncanjohnmcgregors-projects.vercel.app

# The auth callback should return something (not 404):
curl -I https://personal-home-17oclx9gq-duncanjohnmcgregors-projects.vercel.app/api/auth/callback/spotify
```

## Success Indicators

✅ No error messages after Spotify redirect
✅ User is logged in and can see their profile/dashboard
✅ Navigation shows user avatar/name
✅ Can access protected pages like "/dashboard"

---

**Last Updated**: Based on your current deployment URL as of today.
**Next Steps**: If this fixes your issue, consider setting up a custom domain to avoid URL changes in the future.