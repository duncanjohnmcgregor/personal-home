# Personal Home Deployment Guide

## 🎯 Goal
Deploy your music playlist manager to `https://personal-home-kappa.vercel.app` with fully working Spotify authentication.

## 🚀 Quick Deployment

### Option 1: One-Command Deployment (Recommended)

```bash
# Set your environment variables and deploy
SPOTIFY_CLIENT_ID=your_spotify_client_id \
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret \
DATABASE_URL=your_database_url \
./deploy-to-personal-home.sh
```

### Option 2: Manual Step-by-Step

Follow the detailed steps below for full control over the deployment process.

## 📋 Prerequisites

### 1. Spotify Developer App Setup

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account

2. **Create or Edit Your App**
   - If you don't have an app, click "Create App"
   - If you have an app, click on it to edit

3. **Configure Redirect URIs**
   - Click "Edit Settings"
   - In "Redirect URIs", add this exact URL:
   ```
   https://personal-home-kappa.vercel.app/api/auth/callback/spotify
   ```
   - Save the settings

4. **Get Your Credentials**
   - Copy your Client ID and Client Secret
   - You'll need these for deployment

### 2. Database Setup (Choose One)

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string

#### Option B: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

#### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Create a PostgreSQL service
3. Copy the connection string

### 3. Vercel Account
1. Sign up at [vercel.com](https://vercel.com)
2. Connect your GitHub account

## 🛠️ Manual Deployment Steps

### Step 1: Prepare Environment
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Test build locally
npm run build
```

### Step 2: Configure Vercel Project
```bash
# Login to Vercel
npx vercel login

# Link to your project (create if doesn't exist)
npx vercel --prod --name personal-home-kappa
```

### Step 3: Set Environment Variables
```bash
# Set production environment variables
npx vercel env add NEXTAUTH_URL production
# Enter: https://personal-home-kappa.vercel.app

npx vercel env add NEXTAUTH_SECRET production
# Enter: $(openssl rand -base64 32)

npx vercel env add SPOTIFY_CLIENT_ID production
# Enter: your_spotify_client_id

npx vercel env add SPOTIFY_CLIENT_SECRET production
# Enter: your_spotify_client_secret

npx vercel env add DATABASE_URL production
# Enter: your_database_connection_string

npx vercel env add NODE_ENV production
# Enter: production
```

### Step 4: Deploy
```bash
# Deploy to production
npx vercel --prod
```

## 🔧 Post-Deployment Configuration

### 1. Database Migration
After first deployment, run database migrations:
```bash
# Connect to your database and run migrations
# This depends on your database provider
```

### 2. Verify Spotify Redirect URI
Ensure your Spotify app has the correct redirect URI:
```
https://personal-home-kappa.vercel.app/api/auth/callback/spotify
```

### 3. Test Authentication
1. Go to `https://personal-home-kappa.vercel.app`
2. Click "Sign in with Spotify"
3. You should be redirected to Spotify
4. After authorizing, you should be redirected back successfully

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid client" Error
**Problem**: Spotify redirect URI doesn't match
**Solution**: 
- Check that the redirect URI in Spotify Developer Dashboard is exactly:
  `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`
- No trailing slashes, exact match required

#### 2. "Application Request Error"
**Problem**: NEXTAUTH_URL doesn't match actual URL
**Solution**: 
- Verify NEXTAUTH_URL environment variable is set to:
  `https://personal-home-kappa.vercel.app`

#### 3. Database Connection Errors
**Problem**: DATABASE_URL is incorrect or database is unreachable
**Solution**: 
- Test your database connection string
- Ensure your database allows connections from Vercel IPs
- Check that the database exists and is accessible

#### 4. Build Errors
**Problem**: Missing dependencies or environment variables during build
**Solution**: 
- Run `npm ci` and `npx prisma generate` locally first
- Check that all required environment variables are set

### Debug Commands
```bash
# Check deployment status
npx vercel list

# View deployment logs
npx vercel logs

# Test health endpoint
curl https://personal-home-kappa.vercel.app/api/health
```

## ✅ Verification Checklist

- [ ] Spotify app redirect URI set to: `https://personal-home-kappa.vercel.app/api/auth/callback/spotify`
- [ ] All environment variables set in Vercel
- [ ] Database is accessible and configured
- [ ] App deploys successfully without errors
- [ ] Authentication flow works end-to-end
- [ ] Can access protected pages after login

## 🎉 Success!

Once everything is working:
- ✅ App is live at: `https://personal-home-kappa.vercel.app`
- ✅ Spotify authentication works
- ✅ Users can manage their playlists
- ✅ Database stores user data securely

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Verify all environment variables are correctly set
4. Test the Spotify authentication flow step by step

## 🔄 Future Updates

To update your deployment:
1. Push changes to your Git repository
2. Vercel will automatically deploy from the main branch
3. Or manually redeploy: `npx vercel --prod`

---

**Target URL**: https://personal-home-kappa.vercel.app
**Spotify Callback**: https://personal-home-kappa.vercel.app/api/auth/callback/spotify