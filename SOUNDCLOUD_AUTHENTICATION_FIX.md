# SoundCloud Authentication Error Fix

## Issue
Getting "An authentication error occurred. Please try again." when trying to authenticate with SoundCloud because the OAuth application is not properly configured.

## Root Cause
1. **Missing Environment Variables**: `SOUNDCLOUD_CLIENT_ID` and `SOUNDCLOUD_CLIENT_SECRET` are not set
2. **No SoundCloud OAuth App**: SoundCloud developer application not created
3. **Feature Flag Disabled**: `ENABLE_SOUNDCLOUD_INTEGRATION="false"` in production

## Solution Steps

### Step 1: Create SoundCloud Developer Application

1. **Go to SoundCloud Developers**: https://developers.soundcloud.com/
2. **Sign in** with your SoundCloud account
3. **Create a new app**:
   - App Name: "Music Playlist Manager"
   - Description: "Multi-platform playlist management application"
   - Website URL: Your production URL (e.g., `https://your-app.vercel.app`)

4. **Configure OAuth Settings**:
   - **Redirect URI**: `https://your-app.vercel.app/api/auth/callback/soundcloud`
   - **For local development**: `http://localhost:3000/api/auth/callback/soundcloud`

5. **Note down**:
   - Client ID
   - Client Secret

### Step 2: Configure Environment Variables

#### For Local Development
Create `.env.local` file:
```bash
# SoundCloud OAuth Configuration
SOUNDCLOUD_CLIENT_ID="your_actual_soundcloud_client_id"
SOUNDCLOUD_CLIENT_SECRET="your_actual_soundcloud_client_secret"

# Enable SoundCloud Integration
ENABLE_SOUNDCLOUD_INTEGRATION="true"
```

#### For Production (Vercel)
Set environment variables in Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add these variables:

```bash
SOUNDCLOUD_CLIENT_ID = your_actual_soundcloud_client_id
SOUNDCLOUD_CLIENT_SECRET = your_actual_soundcloud_client_secret
ENABLE_SOUNDCLOUD_INTEGRATION = true
```

### Step 3: Update Production Environment File

Update `.env.production`:
```bash
# SoundCloud API Configuration
SOUNDCLOUD_CLIENT_ID="your-production-soundcloud-client-id"
SOUNDCLOUD_CLIENT_SECRET="your-production-soundcloud-client-secret"

# Feature Flags
ENABLE_SOUNDCLOUD_INTEGRATION="true"  # Changed from false
```

### Step 4: Verify OAuth Configuration

Ensure your SoundCloud app has the correct redirect URIs:

**Production**: `https://personal-home-kappa.vercel.app/api/auth/callback/soundcloud`
**Local**: `http://localhost:3000/api/auth/callback/soundcloud`

### Step 5: Test the Authentication Flow

1. **Restart your application** (if running locally)
2. **Redeploy** (if testing production)
3. Go to your Music Playlist Manager
4. Try connecting to SoundCloud
5. You should be redirected to SoundCloud's OAuth page
6. After authorization, you should be redirected back successfully

## Troubleshooting

### Common Issues:

1. **"Invalid client_id"**:
   - Check that `SOUNDCLOUD_CLIENT_ID` is set correctly
   - Verify the client ID matches your SoundCloud app

2. **"Invalid redirect_uri"**:
   - Ensure the redirect URI in your SoundCloud app matches exactly
   - Check for trailing slashes or protocol mismatches

3. **"Access denied"**:
   - User cancelled the authorization
   - SoundCloud app may not be approved for public use

4. **"Configuration error"**:
   - `SOUNDCLOUD_CLIENT_SECRET` is missing or incorrect
   - Environment variables not properly loaded

### Debug Steps:

1. **Check environment variables are loaded**:
   ```bash
   console.log('SoundCloud Client ID:', process.env.SOUNDCLOUD_CLIENT_ID ? 'Set' : 'Missing')
   ```

2. **Verify OAuth provider configuration**:
   - Check `src/lib/auth.ts` SoundCloud provider setup
   - Ensure clientId and clientSecret are not undefined

3. **Check NextAuth configuration**:
   - Verify `NEXTAUTH_URL` matches your domain
   - Ensure `NEXTAUTH_SECRET` is set

## Required SoundCloud App Permissions

Your SoundCloud app should request these scopes:
- `non-expiring` - Basic access that doesn't expire

## Security Notes

- **Never commit** actual credentials to version control
- **Use different apps** for development and production
- **Keep client secrets secure** in environment variables only
- **Regularly rotate** OAuth credentials if compromised

## Testing Checklist

- [ ] SoundCloud developer app created
- [ ] Redirect URIs configured correctly
- [ ] Environment variables set in all environments
- [ ] Application redeployed/restarted
- [ ] OAuth flow works without errors
- [ ] User can successfully connect SoundCloud account
- [ ] SoundCloud appears in connected platforms

## Next Steps After Fix

Once authentication is working:
1. Test SoundCloud API integration
2. Verify track search functionality
3. Test playlist import/sync features
4. Monitor for any API rate limiting issues

The authentication error should be resolved once you complete the SoundCloud OAuth app setup and configure the environment variables properly.